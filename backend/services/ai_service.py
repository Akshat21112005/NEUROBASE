import re
import json
import sqlite3
import logging
from typing import Any, Optional, Tuple
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from config import GROQ_API_KEY

logger = logging.getLogger("neurobase.ai")

# Using llama-3.1-8b-instant for fast and precise SQL generation
_MODEL_NAME = "llama-3.1-8b-instant"

if GROQ_API_KEY:
    logger.info("Groq AI (via LangChain) configured successfully.")
else:
    logger.warning("GROQ_API_KEY is not set. AI features will not work.")

async def generate_sql(
    question: str,
    table_name: str,
    columns: list[dict],
    conn: sqlite3.Connection
) -> Tuple[Optional[str], Optional[str]]:
    """
    Returns: (sql_query, error_message)
    """

    if not GROQ_API_KEY:
        return None, "Groq API key is not configured."

    # 🔹 Build clean schema (NO sample rows)
    schema = {
        "table": table_name,
        "columns": {col["name"]: col["type"] for col in columns}
    }

    llm = ChatGroq(
        api_key=GROQ_API_KEY,
        model_name=_MODEL_NAME,
        temperature=0,
        max_tokens=600
    )

    async def call_llm(sys_msg: str, human_msg: str) -> str:
        response = await llm.ainvoke([
            SystemMessage(content=sys_msg),
            HumanMessage(content=human_msg)
        ])
        return response.content
        
    def extract_json_sql(text: str) -> str:
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1]
        
        # Some models prefix with 'json' without backticks, let's just use naive search if parse fails
        try:
            parsed = json.loads(text.strip())
            return parsed["sql"]
        except json.JSONDecodeError:
            # Fallback naive search
            match = re.search(r'"sql"\s*:\s*"([^"]+)"', text, re.IGNORECASE)
            if match:
                return match.group(1)
            raise ValueError("Could not parse JSON output")

    try:
        # 🔹 Chain 1: Analyze Query
        query_sys = "You are an expert data analyst. Parse the user's question, determine the intent, and outline step-by-step how to logically retrieve this data from a table."
        query_human = f"Question: {question}"
        query_analysis = await call_llm(query_sys, query_human)
        logger.info(f"Chain 1 (Query Analysis): {query_analysis}")

        # 🔹 Chain 2: Analyze Data
        data_sys = "You are a database architect. Look at this schema. Write out which columns will be needed to answer the question, and any potential pitfalls (e.g. data types, grouping)."
        data_human = f"Schema: {json.dumps(schema)}\nQuestion: {question}"
        data_analysis = await call_llm(data_sys, data_human)
        logger.info(f"Chain 2 (Data Analysis): {data_analysis}")

        # 🔹 Chain 3: Generate SQL
        sql_sys = "You are an expert SQLite query generator. Output ONLY valid JSON containing a 'sql' key. No markdown, no explanations."
        sql_human = f"""
Return ONLY valid JSON:
{{
  "sql": "<valid SQLite SELECT query>"
}}

Rules:
- Only SELECT queries
- Wrap table and column names in backticks
- Add LIMIT 100 unless aggregation
- Use valid SQLite syntax

Schema:
{json.dumps(schema)}

Question:
{question}

Query Intent Analysis:
{query_analysis}

Data Architecture Analysis:
{data_analysis}
"""
        raw_sql_json = await call_llm(sql_sys, sql_human)
        logger.info(f"Chain 3 (Raw SQL JSON): {raw_sql_json}")
        sql = extract_json_sql(raw_sql_json)

        # 🔹 Syntax Verification
        def validate_syntax(q):
            try:
                conn.execute(f"EXPLAIN QUERY PLAN {q}")
                return True, ""
            except Exception as e:
                return False, str(e)

        valid, error = validate_syntax(sql)

        # 🔹 Chain 4: Repair Syntax
        if not valid:
            repair_sys = "You are an SQL repair bot. Output ONLY valid JSON fixing the syntax error."
            repair_human = f"""
Bad SQL: {sql}
SQLite Error: {error}
Schema: {json.dumps(schema)}
Return ONLY valid JSON: {{ "sql": "<fixed query>" }}
"""
            raw_repaired = await call_llm(repair_sys, repair_human)
            logger.info(f"Chain 4 (Syntax Repair): {raw_repaired}")
            sql = extract_json_sql(raw_repaired)
            
            valid, error = validate_syntax(sql)
            if not valid:
                return None, f"Chain 4 repair failed: {error}"

        # 🔹 Chain 5: Semantic Verification
        verify_sys = "You are a QA bot verifying if a SQL query answers the original question perfectly. Output ONLY valid JSON containing the 'sql' key."
        verify_human = f"""
Return ONLY valid JSON:
{{
  "sql": "<verified or fixed SQLite SELECT query>"
}}

Schema: {json.dumps(schema)}
Original Question: {question}
Proposed SQL: {sql}

Cross-verify the logic. If there is a missing condition, bad logic, or it poorly matches the question, fix it. If it is already fully correct according to the intent, output the same SQL untouched.
"""
        raw_final = await call_llm(verify_sys, verify_human)
        logger.info(f"Chain 5 (Semantic Verify): {raw_final}")
        
        final_sql = extract_json_sql(raw_final)
        
        # Final Syntax check just in case QA bot broke it
        valid, error = validate_syntax(final_sql)
        if not valid:
             return sql, None # Fallback to the syntactically valid one we had before QA
        
        return final_sql, None

    except Exception as exc:
        logger.error(f"Long chain pipeline failed: {exc}")
        return None, f"AI Pipeline Error: {exc}"

async def generate_refinements(
    question: str,
    table_name: str,
    schema: list[dict[str, str]],
    sample_rows: list[tuple],
    result_count: int,
) -> list[str]:
    if not GROQ_API_KEY:
        return []

    col_names = [col["name"] for col in schema]
    sample_fmt = [
        dict(zip(col_names, row))
        for row in sample_rows[:3]
        if len(row) == len(col_names)
    ]

    prompt = (
        f"Generate 3-5 insightful follow-up questions for this dataset.\n"
        f"Table: {table_name}\n"
        f"Schema: {json.dumps(schema)}\n"
        f"Sample data: {json.dumps(sample_fmt)}\n"
        f'Original question: "{question}"\n'
        f"Rows returned: {result_count}\n\n"
        "Return ONLY a JSON array of question strings with no other text."
    )

    try:
        llm = ChatGroq(
            api_key=GROQ_API_KEY,
            model_name="llama-3.3-70b-versatile",
            temperature=0.7,
        )
        
        messages = [
            SystemMessage(content="You are a data analyst. Return ONLY a JSON array of strings."),
            HumanMessage(content=prompt)
        ]
        
        response = await llm.ainvoke(messages)
        text = response.content

        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1]

        parsed = json.loads(text.strip())
        if isinstance(parsed, list):
            return [str(q) for q in parsed if q][:5]
    except Exception as exc:
        logger.debug(f"Refinement generation failed (non-critical): {exc}")

    return []


