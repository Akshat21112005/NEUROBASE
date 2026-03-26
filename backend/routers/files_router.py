import os
import re
import uuid
import sqlite3
import logging
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from auth.dependencies import get_current_user
from config import MAX_CSV_PER_USER, SUPPORTED_EXTENSIONS, UPLOAD_FOLDER
from database.mongodb import mongodb
from database.sqlite_utils import sanitize_table_name, get_schema, ensure_db_on_disk

logger = logging.getLogger("neurobase.files")
router = APIRouter(tags=["File Management"])

@router.post("/upload_csv")
async def upload_csv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    if await mongodb.count(user_id) >= MAX_CSV_PER_USER:
        raise HTTPException(
            status_code=400,
            detail={"error": f"Maximum of {MAX_CSV_PER_USER} databases per account reached."},
        )

    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail={"error": f"Unsupported file type '{file_ext}'. Use CSV, XLSX, or XLS."},
        )

    try:
        raw_bytes = await file.read()

        if file_ext == ".csv":
            df = pd.read_csv(pd.io.common.BytesIO(raw_bytes))
        else:
            df = pd.read_excel(pd.io.common.BytesIO(raw_bytes))

        if df.empty:
            raise HTTPException(status_code=400, detail={"error": "The uploaded file is empty."})

        # Sanitize columns
        df.columns = [re.sub(r"[^a-zA-Z0-9_]", "_", str(c)) for c in df.columns]

        db_id = str(uuid.uuid4())
        table_name = sanitize_table_name(file.filename or "data")
        db_path = os.path.join(UPLOAD_FOLDER, f"{db_id}.db")

        with sqlite3.connect(db_path) as conn:
            df.to_sql(table_name, conn, index=False, if_exists="replace")

        # Persistence Hack: Binary blob for MongoDB
        with open(db_path, "rb") as f:
            binary_content = f.read()

        db_meta = {
            "id": db_id,
            "user_id": user_id,
            "name": os.path.splitext(file.filename or "data")[0],
            "original_name": file.filename,
            "table_name": table_name,
            "row_count": len(df),
            "columns": list(df.columns),
            "upload_time": datetime.now().isoformat(),
            "file_size": len(raw_bytes),
            "db_path": db_path,
            "binary_content": binary_content,
        }
        await mongodb.upsert(user_id, db_meta)
        
        return {"message": f"'{file.filename}' uploaded successfully.", "db_id": db_id}

    except Exception as exc:
        logger.error(f"Upload error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": str(exc)})

@router.get("/list_csvs")
async def list_csvs(user_id: str = Depends(get_current_user)):
    all_dbs = await mongodb.get_all(user_id)
    return [
        {
            "id": db["id"],
            "name": db["name"],
            "row_count": db["row_count"],
            "columns": len(db["columns"]),
            "upload_time": db["upload_time"],
        }
        for db in all_dbs
    ]

@router.delete("/delete_csv/{db_id}")
async def delete_csv(db_id: str, user_id: str = Depends(get_current_user)):
    db_meta = await mongodb.get_one(user_id, db_id)
    if not db_meta:
        raise HTTPException(status_code=404, detail="Database not found.")

    db_path = db_meta.get("db_path", "")
    if os.path.exists(db_path):
        os.remove(db_path)

    await mongodb.delete(user_id, db_id)
    return {"message": "Deleted successfully."}

@router.get("/database_info/{db_id}")
async def get_database_info(db_id: str, user_id: str = Depends(get_current_user)):
    """Get detailed information about a specific database."""
    db_meta = await mongodb.get_one(user_id, db_id)
    if not db_meta:
        raise HTTPException(status_code=404, detail="Database not found.")
    
    # Ensure database is on disk
    db_path = await ensure_db_on_disk(db_meta)
    
    # Get full schema with column types
    schema = get_schema(db_path, db_meta["table_name"])
    
    return {
        "id": db_meta["id"],
        "name": db_meta["name"],
        "original_name": db_meta.get("original_name"),
        "table_name": db_meta["table_name"],
        "row_count": db_meta.get("row_count", 0),
        "columns": db_meta.get("columns", []),
        "schema": schema,
        "upload_time": db_meta.get("upload_time"),
        "file_size": db_meta.get("file_size"),
    }
