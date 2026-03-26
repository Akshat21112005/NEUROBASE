import logging
from typing import Any, Dict, List, Optional
import motor.motor_asyncio
from config import MONGODB_URI

logger = logging.getLogger("neurobase.mongodb")

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None
        self._connected = False
        self._FALLBACK = {}

    async def connect(self):
        try:
            if MONGODB_URI:
                self.client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
                # Test connection
                await self.client.admin.command('ping')
                self.db = self.client.neurobase
                self._connected = True
                logger.info("MongoDB connected successfully.")
            else:
                logger.warning("MONGODB_URI not set. Falling back to in-memory store.")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}. Falling back to in-memory store.")
            self._connected = False

    def is_connected(self) -> bool:
        return self._connected

    async def upsert(self, user_id: str, db_meta: Dict[str, Any]):
        if self._connected:
            await self.db.user_databases.update_one(
                {"user_id": user_id, "id": db_meta["id"]},
                {"$set": db_meta},
                upsert=True
            )
        else:
            if user_id not in self._FALLBACK:
                self._FALLBACK[user_id] = []
            
            # Update existing or add new
            existing = False
            for i, d in enumerate(self._FALLBACK[user_id]):
                if d["id"] == db_meta["id"]:
                    self._FALLBACK[user_id][i] = db_meta
                    existing = True
                    break
            if not existing:
                self._FALLBACK[user_id].append(db_meta)

    async def get_all(self, user_id: str) -> List[Dict[str, Any]]:
        if self._connected:
            cursor = self.db.user_databases.find({"user_id": user_id})
            return await cursor.to_list(length=100)
        return self._FALLBACK.get(user_id, [])

    async def get_one(self, user_id: str, db_id: str) -> Optional[Dict[str, Any]]:
        if self._connected:
            return await self.db.user_databases.find_one({"user_id": user_id, "id": db_id})
        
        for d in self._FALLBACK.get(user_id, []):
            if d["id"] == db_id:
                return d
        return None

    async def delete(self, user_id: str, db_id: str):
        if self._connected:
            await self.db.user_databases.delete_one({"user_id": user_id, "id": db_id})
        else:
            if user_id in self._FALLBACK:
                self._FALLBACK[user_id] = [d for d in self._FALLBACK[user_id] if d["id"] != db_id]

    async def count(self, user_id: str) -> int:
        if self._connected:
            return await self.db.user_databases.count_documents({"user_id": user_id})
        return len(self._FALLBACK.get(user_id, []))

mongodb = MongoDB()
