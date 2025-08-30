from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sqlite3
import pandas as pd
import os
import uuid
import re
import requests
from dotenv import load_dotenv
import json
from datetime import datetime, timedelta
import logging
import sys
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, auth

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
FIREBASE_ENABLED = False
try:
    firebase_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-credentials.json")
    if os.path.exists(firebase_cred_path):
        cred = credentials.Certificate(firebase_cred_path)
        firebase_admin.initialize_app(cred)
        FIREBASE_ENABLED = True
        logger.info("Firebase Admin SDK initialized successfully.")
    else:
        logger.warning(f"Firebase credentials file not found at {firebase_cred_path}. Running in basic auth mode.")
except Exception as e:
    logger.warning(f"Failed to initialize Firebase Admin SDK: {e}. Running in basic auth mode.")

# FastAPI app configuration
app = FastAPI(
    title="NeuroBase API",
    description="Enhanced API for uploading CSVs, querying data with AI, and managing databases.",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://neurobase-9352.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session middleware
SECRET_KEY = os.getenv("SECRET_KEY", os.urandom(24).hex())
app.add_middleware(
    SessionMiddleware, 
    secret_key=SECRET_KEY,
    session_cookie="session_id",
    max_age=86400
)

# Configuration
UPLOAD_FOLDER = "./databases/"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
MAX_CSV_PER_USER = 15
SUPPORTED_EXTENSIONS = {'.csv', '.xlsx', '.xls'}
MAX_CONTENT_LENGTH = 100 * 1024 * 1024

# Gemini AI configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Gemini API configured successfully.")

# In-memory storage
user_dbs: Dict[str, List[Dict[str, Any]]] = {}

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    
class FirebaseLoginRequest(BaseModel):
    firebase_token: str
    username: str

class QueryRequest(BaseModel):
    question: str
    db_id: str

class RefinementRequest(BaseModel):
    question: str
    db_id: str
    result: int

# Authentication helper
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer ") and FIREBASE_ENABLED:
        token = auth_header.split(" ")[1]
        try:
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token.get("uid")
            email = decoded_token.get("email")
            name = decoded_token.get("name") or email.split('@')[0] if email else uid
            request.session["user"] = name
            return name
        except Exception as e:
            logger.warning(f"Firebase token verification failed: {e}")
    
    user = request.session.get("user")
    if not user:
        # If Firebase is not enabled, allow demo mode with a default user
        if not FIREBASE_ENABLED:
            demo_user = "demo_user"
            request.session["user"] = demo_user
            if demo_user not in user_dbs:
                user_dbs[demo_user] = []
            logger.info(f"Demo mode: Auto-authenticated as {demo_user}")
            return demo_user
        raise HTTPException(status_code=401, detail={"error": "Authentication required"})
    return user

# Utility functions
def sanitize_table_name(name: str) -> str:
    name = os.path.splitext(name)[0]
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    name = re.sub(r'_+', '_', name).strip('_')
    if not name or name[0].isdigit():
        name = f'table_{name}' if name else 'data'
    timestamp = str(int(datetime.now().timestamp()))
    return f"user_data_{name}_{timestamp}"[:60]

def get_table_schema(db_path: str, table_name: str) -> List[Dict[str, str]]:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info(`{table_name}`)")
        columns = cursor.fetchall()
        conn.close()
        return [{"name": col[1], "type": col[2]} for col in columns]
    except Exception as e:
        logger.error(f"Error getting schema: {e}")
        return []

def get_sample_data(db_path: str, table_name: str, limit: int = 3) -> tuple[List[str], List[List[Any]]]:
    """Get sample data from the database table for context."""
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM `{table_name}` LIMIT {limit}")
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        return columns, rows
    except sqlite3.Error as e:
        logger.error(f"SQLite error getting sample data for {table_name} in {db_path}: {e}")
        return [], []
    except Exception as e:
        logger.error(f"Unexpected error getting sample data for {table_name} in {db_path}: {e}")
        return [], []
    finally:
        if conn:
            conn.close()

def analyze_question_intent(question: str) -> List[str]:
    """Analyze the user's question to determine query intent patterns."""
    question_lower = question.lower().strip()

    intent_patterns = {
        'aggregation': ['sum', 'total', 'count', 'average', 'avg', 'max', 'min', 'maximum', 'minimum'],
        'filtering': ['where', 'with', 'having', 'contains', 'like', 'equal', 'greater', 'less', 'between', 'for'],
        'sorting': ['top', 'bottom', 'highest', 'lowest', 'best', 'worst', 'largest', 'smallest', 'first', 'last', 'order by'],
        'grouping': ['by', 'per', 'each', 'group', 'category', 'type', 'department', 'segment'],
        'comparison': ['compare', 'vs', 'versus', 'difference', 'correlation', 'than'],
        'time_based': ['year', 'month', 'day', 'date', 'time', 'recent', 'latest', 'oldest', 'period'],
        'statistical': ['distribution', 'frequency', 'percentage', 'ratio', 'proportion', 'how many unique'],
        'selection': ['show me', 'list', 'what are', 'retrieve', 'select'],
    }

    detected_intents = []
    for intent, patterns in intent_patterns.items():
        if any(pattern in question_lower for pattern in patterns):
            detected_intents.append(intent)

    return detected_intents if detected_intents else ['selection']

def get_column_insights(columns: List[Dict[str, str]], sample_data: Optional[List[List[Any]]] = None) -> Dict[str, Dict[str, Any]]:
    """Analyze column types and characteristics for better query generation."""
    insights = {}
    col_names_from_schema = [col['name'] for col in columns]

    for col in columns:
        col_name = col['name']
        col_type = col['type'].upper()

        insights[col_name] = {
            'type': col_type,
            'is_numeric': col_type in ['INTEGER', 'REAL', 'NUMERIC', 'FLOAT', 'DOUBLE'],
            'is_text': col_type in ['TEXT', 'VARCHAR', 'CHAR'],
            'is_date': 'DATE' in col_type or 'TIME' in col_type,
            'likely_categorical': False,
            'likely_id': False
        }

        col_lower = col_name.lower()
        if any(keyword in col_lower for keyword in ['id', 'key', 'index']):
            insights[col_name]['likely_id'] = True

        if any(keyword in col_lower for keyword in ['category', 'type', 'status', 'gender', 'department', 'region', 'city', 'product', 'item']):
            insights[col_name]['likely_categorical'] = True

    if sample_data and len(sample_data) > 0:
        for i, col_name in enumerate(col_names_from_schema):
            if i < len(sample_data[0]):
                sample_values = [row[i] for row in sample_data if row is not None and i < len(row) and row[i] is not None]
                if sample_values:
                    unique_values_count = len(set(sample_values))
                    total_values_count = len(sample_values)
                    if total_values_count > 0 and (unique_values_count / total_values_count < 0.2 and unique_values_count < 50):
                        insights[col_name]['likely_categorical'] = True
                    
                    if insights[col_name]['is_text'] and not insights[col_name]['is_date']:
                        if all(re.match(r'^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$', str(v)) for v in sample_values if v is not None and isinstance(v, str)):
                            insights[col_name]['is_date'] = True

    return insights

def generate_contextual_examples(columns: List[Dict[str, str]], insights: Dict[str, Dict[str, Any]], question_intents: List[str], table_name: str) -> str:
    """Generate contextual SQL examples based on schema and question intent."""
    examples = []
    
    numeric_cols = [name for name, info in insights.items() if info['is_numeric']]
    text_cols = [name for name, info in insights.items() if info['is_text']]
    date_cols = [name for name, info in insights.items() if info['is_date']]
    categorical_cols = [name for name, info in insights.items() if info['likely_categorical']]

    examples.append(f"SELECT * FROM `{table_name}` LIMIT 100;")

    if 'aggregation' in question_intents and numeric_cols:
        examples.append(f"SELECT SUM(`{numeric_cols[0]}`) AS total_{numeric_cols[0]} FROM `{table_name}`;")
        if categorical_cols:
            examples.append(f"SELECT `{categorical_cols[0]}`, COUNT(*) AS record_count FROM `{table_name}` GROUP BY `{categorical_cols[0]}`;")
            if numeric_cols:
                 examples.append(f"SELECT `{categorical_cols[0]}`, AVG(`{numeric_cols[0]}`) AS avg_{numeric_cols[0]} FROM `{table_name}` GROUP BY `{categorical_cols[0]}`;")

    if 'sorting' in question_intents:
        if numeric_cols:
            examples.append(f"SELECT * FROM `{table_name}` ORDER BY `{numeric_cols[0]}` DESC LIMIT 10;")
        elif date_cols:
            examples.append(f"SELECT * FROM `{table_name}` ORDER BY `{date_cols[0]}` DESC LIMIT 5;")

    if 'filtering' in question_intents:
        if text_cols:
            examples.append(f"SELECT * FROM `{table_name}` WHERE `{text_cols[0]}` LIKE '%search_term%';")
            examples.append(f"SELECT * FROM `{table_name}` WHERE `{text_cols[0]}` = 'Exact Value';")
        if numeric_cols:
            examples.append(f"SELECT * FROM `{table_name}` WHERE `{numeric_cols[0]}` > 100;")
            examples.append(f"SELECT * FROM `{table_name}` WHERE `{numeric_cols[0]}` BETWEEN 50 AND 150;")
        if date_cols:
            examples.append(f"SELECT * FROM `{table_name}` WHERE `{date_cols[0]}` > '2023-01-01';")
            examples.append(f"SELECT * FROM `{table_name}` WHERE `{date_cols[0]}` IS NOT NULL;")
    
    if 'grouping' in question_intents and categorical_cols:
        if numeric_cols:
            examples.append(f"SELECT `{categorical_cols[0]}`, SUM(`{numeric_cols[0]}`) FROM `{table_name}` GROUP BY `{categorical_cols[0]}`;")

    return "\n".join(examples)

def create_enhanced_prompt(question: str, table_name: str, columns: List[Dict[str, str]], sample_data: Optional[List[List[Any]]] = None) -> str:
    """Create an enhanced prompt for better SQL generation."""
    question_intents = analyze_question_intent(question)
    column_insights = get_column_insights(columns, sample_data)

    columns_info = []
    for col in columns:
        col_name = col['name']
        col_type = col['type']
        insight = column_insights[col_name]

        context_hints = []
        if insight['is_numeric']:
            context_hints.append("numeric (int/real) - use for calculations, aggregations, comparisons")
        if insight['is_text']:
            context_hints.append("text - use LIKE for partial matching ('%term%'), = for exact matching")
        if insight['is_date']:
            context_hints.append("date/datetime (string formatYYYY-MM-DD orYYYY-MM-DD HH:MM:SS) - use date functions if needed, compare as strings")
        if insight['likely_categorical']:
            context_hints.append("categorical - ideal for grouping (GROUP BY) and filtering (WHERE IN, =)")
        if insight['likely_id']:
            context_hints.append("identifier - often unique, typically for specific lookups or joins (though only one table here)")

        hint_text = f" ({'; '.join(context_hints)})" if context_hints else ""
        columns_info.append(f"  - `{col_name}` ({col_type}){hint_text}")

    columns_detail = "\n".join(columns_info)
    contextual_examples = generate_contextual_examples(columns, column_insights, question_intents, table_name)

    sample_context = ""
    if sample_data and len(sample_data) > 0:
        sample_context = f"""
--- SAMPLE DATA (First {len(sample_data)} rows for reference) ---
Each row is a list of values corresponding to the schema order.
Example: `col1`, `col2`, `col3`
Data:
{json.dumps(sample_data, indent=2)}
---
"""

    complexity_guidance = ""
    if len(question_intents) > 1:
        complexity_guidance = f"""
--- DETECTED QUERY INTENTS: {', '.join(question_intents).upper()} ---
- Your query likely involves multiple operations. Break down the question into logical SQL components.
- Think about SELECT, WHERE, GROUP BY, ORDER BY, and LIMIT clauses.
---
"""

    prompt = f"""You are an expert SQLite query generator. Your sole purpose is to convert natural language questions into precise, executable SQLite SELECT statements.

--- DATABASE SCHEMA ---
You are working with a single table.
Table Name: `{table_name}`
Columns Available:
{columns_detail}

{sample_context}

--- USER QUESTION ---
"{question}"

{complexity_guidance}

--- CONTEXTUAL SQL EXAMPLES FOR `{table_name}` ---
Consider these common patterns based on the table structure and question intent. Adapt them to the user's specific request:
{contextual_examples}

--- CRITICAL SQL GENERATION RULES ---
1.  **Output Format**: Return **ONLY THE SQL SELECT STATEMENT**. No explanations, no markdown, no comments, no extra text, no leading/trailing spaces or newlines.
2.  **SQL Dialect**: Generate queries specifically for **SQLite**.
3.  **Table & Column Names**:
    * **Always** wrap table and column names in **backticks (` `)**. Example: `column_name`, `table_name`.
    * **Use ONLY** the column names provided in the "Columns Available" section. Do not invent, guess, or assume column names. If a requested column doesn't exist, state this in a comment (e.g., `-- Column 'X' not found`).
    * Ensure the table name is `{table_name}`.
4.  **Query Type**: Only generate **SELECT** statements. Absolutely NO INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, PRAGMA, or other DML/DDL statements are allowed.
5.  **Result Limiting**:
    * For non-aggregate queries (e.g., `SELECT *`, `SELECT col1, col2`), **always add `LIMIT 100`** unless the user explicitly specifies a different limit (e.g., "top 5", "first 20").
    * For "top N" or "bottom N" requests, use `ORDER BY` and the appropriate `LIMIT N`.
6.  **Text Matching**: Use `LIKE '%term%'` for partial text matching. Use `=` for exact text matching.
7.  **Aggregations**: When using aggregate functions (COUNT, SUM, AVG, MAX, MIN), **always include a `GROUP BY` clause** if you are selecting non-aggregated columns.
8.  **Ordering**: Use `ORDER BY` for "top", "bottom", "highest", "lowest", "best", "worst" requests.
9.  **NULL Values**: Consider `IS NULL` or `IS NOT NULL` when questions imply missing data.
10. **Case Sensitivity**: SQLite is generally case-insensitive for data comparisons by default, but it's good practice to ensure column names in the query match the provided schema.

--- QUERY VALIDATION CHECKLIST (Self-Correction before output) ---
- Does the query start with `SELECT`?
- Are ALL column names used present in the "Columns Available" schema above?
- Is the table name exactly `{table_name}` and wrapped in backticks?
- Is an appropriate `LIMIT` clause included for non-aggregate queries?
- Is `GROUP BY` correctly used for aggregations?
- Are there NO dangerous SQL operations?
- Is the output ONLY the SQL query string, with no extra formatting or text?

Generate the SQLite SELECT query now:"""

    return prompt

async def generate_sql_with_gemini(question: str, table_name: str, columns: List[Dict[str, str]], sample_data: Optional[List[List[Any]]] = None) -> tuple[Optional[str], Optional[str]]:
    if not GEMINI_API_KEY:
        return None, "Gemini API key not configured."

    try:
        prompt = create_enhanced_prompt(question, table_name, columns, sample_data)
        logger.debug(f"Prompt sent to Gemini:\n{prompt}")

        generation_config = {
            'temperature': 0.1,
            'top_p': 0.8,
            'top_k': 40,
            'max_output_tokens': 1024,
        }

        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt, generation_config=generation_config)

        sql_query_raw = response.text.strip()
        logger.debug(f"Raw SQL generated by Gemini:\n{sql_query_raw}")

        # Clean the response
        sql_query = re.sub(r'```(?:[a-zA-Z0-9_]*\s*)?|SQL\s*:\s*|Query\s*:\s*', '', sql_query_raw, flags=re.IGNORECASE | re.DOTALL).strip()
        
        lines = sql_query.split('\n')
        cleaned_lines = []
        for line in lines:
            stripped_line = line.strip()
            if stripped_line and not stripped_line.startswith('--') and not stripped_line.startswith('#'):
                cleaned_lines.append(stripped_line)
        
        sql_query = ' '.join(cleaned_lines).strip()
        
        if not sql_query.upper().startswith('SELECT'):
            logger.warning(f"Generated query does not start with SELECT after cleaning. Raw: {sql_query_raw}")
            return None, f"AI generated an invalid query (doesn't start with SELECT). Raw output: {sql_query_raw[:200]}"
        
        # Ensure table name has backticks
        if f"`{table_name}`" not in sql_query:
            sql_query = sql_query.replace(f"FROM {table_name}", f"FROM `{table_name}`")
            sql_query = sql_query.replace(f"FROM {table_name.lower()}", f"FROM `{table_name}`")
            logger.warning(f"Corrected table name backticks in query: {sql_query}")

        logger.info(f"Final cleaned SQL generated: {sql_query}")
        return sql_query, None
    except genai.types.BlockedPromptException as e:
        logger.error(f"Gemini API blocked prompt: {e}")
        return None, "The question was flagged by AI safety filters. Please rephrase."
    except genai.types.StopCandidateException as e:
        logger.error(f"Gemini API stopped generation: {e}")
        return None, "AI stopped generating a query. Please try again or rephrase your question."
    except Exception as e:
        logger.error(f"General error during Gemini SQL generation: {e}", exc_info=True)
        fallback_query = f"SELECT * FROM `{table_name}` LIMIT 100"
        logger.info(f"Using fallback query due to AI generation error: {fallback_query}")
        return fallback_query, f"AI generation failed: {str(e)}. Using a fallback query."

def validate_sql_enhanced(sql_query: str, table_name: str, columns: List[Dict[str, str]]) -> tuple[Optional[str], Optional[str]]:
    """Enhanced SQL validation with comprehensive security and correctness checks."""
    if not sql_query or not sql_query.strip():
        return None, "Empty SQL query provided."

    sql_query = sql_query.strip()
    sql_upper = sql_query.upper()

    if not sql_upper.startswith('SELECT'):
        return None, "Only SELECT queries are allowed."

    # Check for dangerous keywords
    dangerous_keywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 'PRAGMA', 'ATTACH', 'DETACH', 'REINDEX', 'VACUUM']
    for keyword in dangerous_keywords:
        if re.search(r'\b' + keyword + r'\b', sql_upper):
            return None, f"'{keyword}' statements are not allowed for security reasons."

    # Validate table name reference
    if f"`{table_name}`" not in sql_query:
        if f"FROM {table_name}" not in sql_upper and f"FROM `{table_name}`" not in sql_upper:
             return None, f"Query does not reference the correct table: `{table_name}`. It must be explicitly included."

    # Validate column references
    available_columns_lower = {col['name'].lower() for col in columns}
    column_references = re.findall(r'`([^`]+)`', sql_query)
    
    for col_ref in column_references:
        if col_ref.lower() != table_name.lower() and col_ref.lower() not in available_columns_lower:
            logger.warning(f"Query references non-existent column: '{col_ref}'. Available: {available_columns_lower}")
            return None, f"Query references an unknown column: '{col_ref}'. Please check your question or data."

    # Add LIMIT if needed
    if 'LIMIT' not in sql_upper and not any(agg in sql_upper for agg in ['COUNT(', 'SUM(', 'AVG(', 'MAX(', 'MIN(', 'GROUP BY']):
        sql_query += " LIMIT 100"
        logger.info(f"Added LIMIT 100 to query: {sql_query}")
    
    # Check for remaining comments
    if "--" in sql_query or "#" in sql_query:
        logger.warning(f"Query still contains comments after cleaning. Original intent: NO comments. Query: {sql_query}")

    return sql_query, None

async def generate_query_refinements(question: str, table_name: str, schema: List[Dict[str, str]], sample_data: List[List[Any]], result_count: int) -> List[str]:
    """Generate query refinement suggestions using Gemini AI."""
    if not GEMINI_API_KEY:
        logger.warning("Gemini API key not configured. Using fallback refinements.")
        return [
            f"Show me more details about {question}",
            f"What are the top 5 {question}",
            f"Summarize the data related to {question}"
        ]

    try:
        # Format sample data for better readability
        sample_data_formatted = []
        if sample_data and len(sample_data) > 0:
            column_names = [col["name"] for col in schema]
            for row in sample_data:
                if len(row) == len(column_names):
                    sample_data_formatted.append(dict(zip(column_names, row)))

        prompt = f"""You are an AI assistant helping to generate follow-up questions for a data analysis session.
        
DATABASE TABLE: {table_name}
        
SCHEMA:
        {json.dumps(schema, indent=2)}
        
SAMPLE DATA:
        {json.dumps(sample_data_formatted[:3], indent=2)}
        
ORIGINAL QUESTION: "{question}"
        
RESULT COUNT: {result_count} rows were returned for this query.
        
TASK: Generate 3-5 follow-up questions that would help the user explore this data further.
        These should be natural language questions that:
        1. Build upon the original question to explore related aspects
        2. Suggest different ways to analyze or visualize the same data
        3. Explore potential correlations or patterns in the data
        4. Are specific to the database schema and likely data content
        5. Would be interesting and relevant to someone analyzing this dataset
        
FORMAT: Return ONLY a JSON array of strings, each containing a single follow-up question. Do not include any explanations or other text."""

        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        
        response_text = response.text
        
        # Try to parse as JSON
        try:
            if "```json" in response_text:
                json_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_text = response_text.split("```")[1].strip()
            else:
                json_text = response_text.strip()
                
            refinements = json.loads(json_text)
            
            if isinstance(refinements, list):
                refinements = [str(r) for r in refinements if r]
                return refinements[:5]
        except Exception as e:
            logger.warning(f"Failed to parse Gemini refinements as JSON: {e}. Using text parsing fallback.")
            
            # Fallback: Try to extract questions using regex
            questions = re.findall(r'"([^"]+)"', response_text)
            if questions:
                return questions[:5]
                
            # Second fallback: Split by newlines and look for numbered items
            lines = response_text.split('\n')
            questions = []
            for line in lines:
                line = line.strip()
                if re.match(r'^\d+\.\s+', line):
                    question = re.sub(r'^\d+\.\s+', '', line)
                    questions.append(question)
            
            if questions:
                return questions[:5]
        
        return [
            f"Show me more details about {question}",
            f"What are the top 5 {question}",
            f"Summarize the data related to {question}",
            f"How does {question} change over time?",
            f"What factors correlate with {question}?"
        ]
    except Exception as e:
        logger.error(f"Error generating refinements with Gemini: {e}")
        return [
            f"Show me more details about {question}",
            f"What are the top 5 {question}",
            f"Summarize the data related to {question}"
        ]

# API Endpoints
@app.get("/")
async def root():
    return {"message": "NeuroBase API v2.0", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "gemini_configured": bool(GEMINI_API_KEY),
        "firebase_enabled": FIREBASE_ENABLED,
        "firebase_credentials_path": os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-credentials.json"),
        "demo_mode": not FIREBASE_ENABLED
    }

@app.post("/login")
async def login(request_data: LoginRequest, request: Request):
    username = re.sub(r'[^a-zA-Z0-9_]', '_', request_data.username.strip())[:50]
    request.session["user"] = username
    if username not in user_dbs:
        user_dbs[username] = []
    return {"message": f"Logged in as {username}", "username": username}

@app.post("/api/firebase-login")
async def firebase_login(request_data: FirebaseLoginRequest, request: Request):
    if not FIREBASE_ENABLED:
        # Fallback to basic auth when Firebase is not available
        name = request_data.username or "demo_user"
        request.session["user"] = name
        if name not in user_dbs:
            user_dbs[name] = []
        logger.info(f"Demo mode login successful for user: {name}")
        return {"message": "Login successful (demo mode)", "username": name}
    
    try:
        decoded_token = auth.verify_id_token(request_data.firebase_token)
        name = request_data.username or decoded_token.get("email", "").split('@')[0]
        request.session["user"] = name
        if name not in user_dbs:
            user_dbs[name] = []
        logger.info(f"Firebase login successful for user: {name}")
        return {"message": "Firebase login successful", "username": name}
    except Exception as e:
        logger.error(f"Firebase login error: {e}")
        # If Firebase token verification fails but Firebase is enabled, still allow demo mode
        name = request_data.username or "demo_user"
        request.session["user"] = name
        if name not in user_dbs:
            user_dbs[name] = []
        logger.warning(f"Firebase token verification failed, falling back to demo mode for user: {name}")
        return {"message": "Login successful (demo mode - Firebase token invalid)", "username": name}

@app.post("/logout")
async def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out successfully"}

@app.get("/session_check")
async def session_check(request: Request):
    user = request.session.get("user")
    return {"authenticated": bool(user), "user": user}

@app.post("/upload_csv")
async def upload_csv(file: UploadFile = File(...), user: str = Depends(get_current_user)):
    try:
        if len(user_dbs.get(user, [])) >= MAX_CSV_PER_USER:
            raise HTTPException(status_code=400, detail={"error": f"Maximum {MAX_CSV_PER_USER} databases exceeded"})
        
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in SUPPORTED_EXTENSIONS:
            raise HTTPException(status_code=400, detail={"error": "Unsupported file type"})
        
        contents = await file.read()
        
        # Read file into DataFrame
        if file_ext == '.csv':
            df = pd.read_csv(pd.io.common.BytesIO(contents))
        else:
            df = pd.read_excel(pd.io.common.BytesIO(contents))
        
        if df.empty:
            raise HTTPException(status_code=400, detail={"error": "File is empty"})
        
        # Clean column names
        df.columns = [re.sub(r'[^a-zA-Z0-9_]', '_', str(col)) for col in df.columns]
        
        # Generate unique database ID
        db_id = str(uuid.uuid4())
        table_name = sanitize_table_name(file.filename)
        db_path = os.path.join(UPLOAD_FOLDER, f"{db_id}.db")
        
        # Save to SQLite
        conn = sqlite3.connect(db_path)
        df.to_sql(table_name, conn, index=False, if_exists='replace')
        conn.close()
        
        # Store database info
        db_info = {
            "id": db_id,
            "name": os.path.splitext(file.filename)[0],
            "original_name": file.filename,
            "table_name": table_name,
            "row_count": len(df),
            "columns": list(df.columns),
            "upload_time": datetime.now().isoformat(),
            "file_size": len(contents),
            "db_path": db_path
        }
        
        if user not in user_dbs:
            user_dbs[user] = []
        user_dbs[user].append(db_info)
        
        return {"message": f"Successfully uploaded {file.filename}", "db_id": db_id}
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})

@app.get("/list_csvs")
async def list_csvs(user: str = Depends(get_current_user)):
    if user not in user_dbs:
        return []
    
    return [{
        "id": db["id"],
        "name": db["name"],
        "row_count": db["row_count"],
        "columns": len(db["columns"]),
        "upload_time": db["upload_time"]
    } for db in user_dbs[user] if os.path.exists(db.get("db_path", ""))]

@app.get("/database_info/{db_id}")
async def get_database_info(db_id: str, user: str = Depends(get_current_user)):
    if user not in user_dbs:
        raise HTTPException(status_code=404, detail={"error": "No databases found"})
    
    db_info = next((db for db in user_dbs[user] if db["id"] == db_id), None)
    if not db_info or not os.path.exists(db_info["db_path"]):
        raise HTTPException(status_code=404, detail={"error": "Database not found"})
    
    schema = get_table_schema(db_info["db_path"], db_info["table_name"])
    
    return {
        "id": db_info["id"],
        "name": db_info["name"],
        "row_count": db_info["row_count"],
        "columns": db_info["columns"],
        "upload_time": db_info["upload_time"],
        "file_size": db_info["file_size"],
        "schema": schema
    }

@app.post("/query")
async def query_database(request_data: QueryRequest, user: str = Depends(get_current_user)):
    try:
        if user not in user_dbs:
            raise HTTPException(status_code=404, detail={"error": "No databases found"})
        
        db_info = next((db for db in user_dbs[user] if db["id"] == request_data.db_id), None)
        if not db_info or not os.path.exists(db_info["db_path"]):
            raise HTTPException(status_code=404, detail={"error": "Database not found"})
        
        # Get schema and sample data for AI context
        schema = get_table_schema(db_info["db_path"], db_info["table_name"])
        
        # Get sample data for better context
        sample_columns, sample_rows = get_sample_data(db_info["db_path"], db_info["table_name"], limit=5)
        
        # Generate SQL with enhanced Gemini AI
        sql_query, error = await generate_sql_with_gemini(
            request_data.question, 
            db_info["table_name"], 
            schema,
            sample_rows
        )
        
        warning_message = None
        if error:
            if "fallback" not in error:
                raise HTTPException(status_code=500, detail={"error": error, "question": request_data.question})
            else:
                logger.warning(f"AI generation warning: {error}")
                warning_message = f"AI generation had issues ({error}). A general query was used. Results may not perfectly match your question."
        
        # Enhanced SQL validation
        final_sql_query, validation_error = validate_sql_enhanced(sql_query, db_info["table_name"], schema)
        
        if validation_error:
            logger.error(f"SQL validation failed for user {user}. Error: {validation_error}. SQL: {sql_query}")
            raise HTTPException(status_code=400, detail={"error": validation_error, "sql": sql_query, "question": request_data.question})
        
        sql_query = final_sql_query
        
        # Execute query
        conn = sqlite3.connect(db_info["db_path"])
        cursor = conn.cursor()
        
        try:
            cursor.execute(sql_query)
            rows = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]
            
            return {
                "question": request_data.question,
                "sql": sql_query,
                "columns": columns,
                "data": rows,
                "row_count": len(rows),
                "execution_time": datetime.now().isoformat(),
                "warning": warning_message
            }
            
        except sqlite3.Error as e:
            return {"error": f"SQL execution failed: {str(e)}", "sql": sql_query}
        finally:
            conn.close()
            
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})

@app.post("/suggest_refinements")
async def suggest_refinements(request_data: RefinementRequest, user: str = Depends(get_current_user)):
    try:
        question = request_data.question.strip()
        db_id = request_data.db_id.strip()
        result_count = request_data.result

        if not question or not db_id:
            raise HTTPException(status_code=400, detail={"error": "Question and DB ID are required"})

        db_entry = next((d for d in user_dbs.get(user, []) if d["id"] == db_id), None)
        if not db_entry:
            logger.warning(f"User {user} requested refinements for non-existent or inaccessible DB ID: {db_id}")
            raise HTTPException(status_code=404, detail={"error": "Database not found or not accessible to your session."})

        table_name = db_entry["table_name"]
        columns_schema = db_entry.get("schema", [])

        logger.info(f"User {user} - Processing refinement request for '{db_entry['name']}' with question: '{question}'")

        # Get sample data for context
        sample_columns_from_db, sample_rows = get_sample_data(db_entry["db_path"], table_name, limit=5)

        # Generate refinements using Gemini
        refinements = await generate_query_refinements(question, table_name, columns_schema, sample_rows, result_count)

        logger.info(f"User {user} - Generated {len(refinements)} refinements for question: '{question}'")

        return {"suggestions": refinements}

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Refinement generation error for user {user}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": f"An unexpected error occurred: {str(e)}. Please try again."})

@app.delete("/delete_csv/{db_id}")
async def delete_csv(db_id: str, user: str = Depends(get_current_user)):
    if user not in user_dbs:
        raise HTTPException(status_code=404, detail={"error": "No databases found"})
    
    db_info = next((db for db in user_dbs[user] if db["id"] == db_id), None)
    if not db_info:
        raise HTTPException(status_code=404, detail={"error": "Database not found"})
    
    # Remove file and database info
    if os.path.exists(db_info["db_path"]):
        os.remove(db_info["db_path"])
    
    user_dbs[user] = [db for db in user_dbs[user] if db["id"] != db_id]
    
    return {"message": f"Successfully deleted {db_info['name']}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
