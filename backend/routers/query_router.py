import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from auth.dependencies import get_current_user
from database.mongodb import mongodb
from database.sqlite_utils import get_schema, ensure_db_on_disk
from services import ai_service
from services.sql_validator import validate
from database.sqlite_utils import execute_select

logger = logging.getLogger("neurobase.query_router")
router = APIRouter(tags=["Query"])

class QueryRequest(BaseModel):
    question: str
    db_id: str

class RefinementRequest(BaseModel):
    question: str
    db_id: str
    result_count: int = 0

@router.post("/query")
async def query_database(
    body: QueryRequest,
    user_id: str = Depends(get_current_user),
):
    logger.info(f"Incoming query request: {body.question}")
    db_meta = await mongodb.get_one(user_id, body.db_id)
    if not db_meta:
        logger.error(f"DB meta not found for user {user_id} and db {body.db_id}")
        raise HTTPException(status_code=404, detail="Database metadata not found.")

    # Restore from MongoDB if missing on disk
    logger.info("Restoring or checking db on disk")
    db_path = await ensure_db_on_disk(db_meta)
    table_name = db_meta["table_name"]

    import sqlite3
    logger.info("Getting schema")
    schema = get_schema(db_path, table_name)

    logger.info("Connecting to sqlite and generating SQL")
    try:
        with sqlite3.connect(db_path) as conn:
            raw_sql, ai_error = await ai_service.generate_sql(
                body.question, table_name, schema, conn
            )
        logger.info(f"Generated SQL: {raw_sql} | error: {ai_error}")
    except Exception as e:
        logger.error(f"Crash during generate_sql: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Backend generating sql crash")

    if ai_error:
        # Check for fallback
        if "fallback" not in ai_error.lower():
             raise HTTPException(status_code=500, detail=ai_error)
        
    logger.info("Validating SQL output")
    final_sql, val_error = validate(raw_sql, table_name, schema)

    if val_error:
        logger.error(f"Validation failed: {val_error}")
        raise HTTPException(
            status_code=400,
            detail={"error": val_error, "attempted_sql": raw_sql},
        )

    logger.info(f"Executing select on {table_name}")
    try:
        columns, rows, exec_error = execute_select(db_path, final_sql)
    except Exception as e:
        logger.error(f"Execute crash: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Execute crash")

    if exec_error:
        logger.error(f"SQL Execution failed: {exec_error}")
        return {"error": f"SQL execution failed: {exec_error}", "sql": final_sql}

    logger.info(f"User {user_id}: query returned {len(rows)} rows from '{table_name}'")

    return {
        "question": body.question,
        "sql": final_sql,
        "columns": columns,
        "data": rows,
        "row_count": len(rows),
    }

@router.post("/suggest_refinements")
async def suggest_refinements(
    body: RefinementRequest,
    user_id: str = Depends(get_current_user),
):
    """Generate follow-up question suggestions based on a query result."""
    logger.info(f"Generating refinements for: {body.question}")
    db_meta = await mongodb.get_one(user_id, body.db_id)
    if not db_meta:
        raise HTTPException(status_code=404, detail="Database metadata not found.")

    db_path = await ensure_db_on_disk(db_meta)
    table_name = db_meta["table_name"]
    schema = get_schema(db_path, table_name)

    # Get sample rows for context
    import sqlite3
    sample_rows = []
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM `{table_name}` LIMIT 3")
            sample_rows = cursor.fetchall()
    except Exception as e:
        logger.warning(f"Could not fetch sample rows: {e}")

    suggestions = await ai_service.generate_refinements(
        body.question, table_name, schema, sample_rows, body.result_count
    )

    return {"suggestions": suggestions}
