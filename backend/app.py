import logging
import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOWED_ORIGINS, PORT, RELOAD
from database.mongodb import mongodb
from routers import auth_router, files_router, query_router

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("neurobase.app")

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Starting NeuroBase API ...")
    await mongodb.connect()
    yield
    # Shutdown logic
    logger.info("Shutting down NeuroBase API …")

app = FastAPI(
    title="NeuroBase",
    description="Refactored and Rigorous SQL Generation API",
    version="4.0",
    lifespan=lifespan
)

# CORS
# Note: browsers disallow `Access-Control-Allow-Origin: *` when `allow_credentials=true`.
# If you want credentialed requests, set `ALLOWED_ORIGINS` explicitly.
_allowed_origins = [o.strip() for o in (ALLOWED_ORIGINS or []) if o and o.strip()]
if not _allowed_origins:
    _allowed_origins = ["http://localhost:3000"]

# Always allow credentials since frontend uses credentials: 'include'
_allow_credentials = True
# Wildcard origins are incompatible with credentials
if "*" in _allowed_origins:
    _allowed_origins = ["http://localhost:3000"]
    import logging
    logging.warning("CORS: Wildcard origin (*) not compatible with credentials. Using localhost:3000 instead.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(files_router)
app.include_router(query_router)

@app.get("/", tags=["Health"])
async def root():
    return {"message": "NeuroBase API v4.0", "status": "healthy"}

@app.get("/health", tags=["Health"])
async def health():
    from config import GROQ_API_KEY
    return {
        "status": "healthy",
        "version": "4.0.0",
        "auth_backend": "MongoDB (bcrypt + JWT)",
        "groq_configured": bool(GROQ_API_KEY),
        "mongodb_connected": mongodb.is_connected(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=PORT,
        reload=RELOAD,
        reload_excludes=["databases/*", "*.db", "*.csv", "*.json"],
        workers=1,
    )
