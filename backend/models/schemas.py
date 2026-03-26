from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class QueryRequest(BaseModel):
    question: str
    db_id: str

class DatabaseMeta(BaseModel):
    id: str
    name: str
    original_name: str
    table_name: str
    row_count: int
    columns: List[str]
    upload_time: str
    file_size: int
