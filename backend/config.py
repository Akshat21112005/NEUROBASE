import os
from dotenv import load_dotenv

load_dotenv()

# Server Settings
PORT = int(os.getenv("PORT", 5000))
RELOAD = os.getenv("RELOAD", "True").lower() == "true"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# Auth Settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", 24))

# Database Settings
MONGODB_URI = os.getenv("MONGODB_URI")
UPLOAD_FOLDER = os.path.join(os.getcwd(), "databases")
MAX_CSV_PER_USER = 15
SUPPORTED_EXTENSIONS = {'.csv', '.xlsx', '.xls'}

# AI Settings
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
