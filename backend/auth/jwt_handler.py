import logging
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
from config import JWT_SECRET_KEY, JWT_ALGORITHM, TOKEN_EXPIRE_HOURS

logger = logging.getLogger("neurobase.jwt")

def create_token(user_id: str, email: str, name: str) -> str:
    """Creates a JWT for a user session."""
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Optional[Dict]:
    """Decodes and validates a JWT."""
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        logger.warning("JWT expired.")
    except jwt.InvalidTokenError as e:
        logger.error(f"JWT invalid: {e}")
    return None
