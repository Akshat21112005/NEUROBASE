import os
import re
import datetime
import sqlite3
import shutil
import logging
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger("neurobase.sqlite")

def sanitize_table_name(name: str) -> str:
    # Remove extension
    name = os.path.splitext(name)[0]
    # Keep only alphanumeric and underscore
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    # Ensure it starts with a letter and isn't too long
    if not name or name[0].isdigit():
        name = "t_" + name
    return name[:50]

def get_schema(db_path: str, table_name: str) -> List[Dict[str, str]]:
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(f"PRAGMA table_info(`{table_name}`)")
            columns = cursor.fetchall()
            return [{"name": col[1], "type": col[2]} for col in columns]
    except Exception as e:
        logger.error(f"Error getting schema for {table_name}: {e}")
        return []

async def ensure_db_on_disk(db_meta: Dict[str, Any]) -> str:
    """Checks if the .db file exists on disk. If not, re-creates it from the binary_content in metadata."""
    from config import UPLOAD_FOLDER
    db_path = db_meta.get("db_path")
    
    if not db_path or not os.path.exists(db_path):
        db_id = db_meta["id"]
        db_path = os.path.join(UPLOAD_FOLDER, f"{db_id}.db")
        
        if "binary_content" in db_meta:
            logger.info(f"DB file missing for {db_id}. Restoring from MongoDB binary blob.")
            with open(db_path, "wb") as f:
                f.write(db_meta["binary_content"])
        else:
            logger.error(f"DB file missing and no binary content found for {db_id}!")
            
    return db_path

def execute_select(db_path: str, sql: str) -> Tuple[List[str], List[Any], Optional[str]]:
    """Executes a SELECT query and returns (columns, rows, error_message)"""
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(sql)
            rows = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]
            return columns, rows, None
    except Exception as e:
        logger.error(f"Execution error for query [{sql}]: {e}")
        return [], [], str(e)
