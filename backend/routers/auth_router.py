import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from auth.jwt_handler import create_token
from auth.password import hash_password, verify_password
from database.users import create_user, get_user_by_email

logger = logging.getLogger("neurobase.auth_router")

router = APIRouter(prefix="/auth", tags=["Authentication"])

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(user_data: UserRegister):
    existing_user = await get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(user_data.password)
    user_id = await create_user(user_data.name, user_data.email, hashed)
    
    token = create_token(user_id, user_data.email, user_data.name)
    return {"id": user_id, "access_token": token, "token_type": "bearer"}

@router.post("/login")
async def login(user_data: UserLogin):
    user = await get_user_by_email(user_data.email)
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"], user["name"])
    return {"id": user["id"], "access_token": token, "token_type": "bearer"}
