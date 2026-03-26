import uuid
import logging
from typing import Dict, Any, Optional
from database.mongodb import mongodb

logger = logging.getLogger("neurobase.users")

async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    if mongodb.is_connected():
        return await mongodb.db.users.find_one({"email": email})
    
    # In-memory fallback
    for user_list in mongodb._FALLBACK.values():
        if isinstance(user_list, list):
            for item in user_list:
                if item.get("email") == email:
                    return item
    return None

async def create_user(name: str, email: str, hashed_password: str) -> str:
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": name,
        "email": email,
        "password": hashed_password
    }
    
    if mongodb.is_connected():
        await mongodb.db.users.insert_one(user_doc)
    else:
        if "users" not in mongodb._FALLBACK:
            mongodb._FALLBACK["users"] = []
        mongodb._FALLBACK["users"].append(user_doc)
        
    return user_id
