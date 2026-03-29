# NEUROBASE
AI-Powered Data Analysis Platform

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/react-18.2.0-blue.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com)

A full-stack web application that enables users to upload CSV/Excel files and query data using natural language. The platform converts uploaded spreadsheet files into per-user SQLite databases and uses an LLM to translate user questions into SQL queries and provides interactive data visualizations.

[Live Demo](https://neurobase-9352.vercel.app)

## Overview

NEUROBASE is designed to make data analysis accessible to non-technical users by providing a natural language interface for database queries. The platform automatically converts uploaded spreadsheet files into SQLite databases and uses AI to translate user questions into SQL queries.

### Core Functionality

```mermaid
graph TB
    A[File Upload] --> B[SQLite Database Creation]
    B --> C[Natural Language Query Input]
    C --> D[LLM Processing]
    D --> E[SQL Query Generation]
    E --> F[Query Validation & Execution]
    F --> G[Data Visualization]
```

### Architecture

**Frontend (React 18)**
- Authentication with JWT (email/password)
- File upload interface with drag-and-drop support
- Natural language query input with real-time processing
- Interactive data visualization using Recharts
- Responsive dashboard with mobile support
- 3D immersive interface toggle

**Backend (FastAPI)**
- RESTful API with automatic documentation
- File processing for CSV, XLSX, and XLS formats
- SQLite database creation and management per user
- AI-powered query generation using Groq (LangChain)
- SQL query validation for security (read-only operations)
- Query execution with result formatting
- AI-generated query refinement suggestions

## Installation and Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- Groq API key (required for AI SQL generation)

### Backend Setup

1. **Clone and navigate to backend directory:**
```bash
git clone https://github.com/Akshat21112005/NEUROBASE.git
cd NEUROBASE/backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
Create `.env` file with required variables:
```env
# Server
PORT=5000
RELOAD=True
ALLOWED_ORIGINS=http://localhost:3000

# Auth
JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24

# Database
MONGODB_URI=

# AI
GROQ_API_KEY=your_groq_api_key_here
```

5. **Start the backend server:**
```bash
python app.py
```
Server runs on `http://localhost:5000` with automatic API documentation at `/docs`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd ../frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create `.env` file (or `.env.local`) in `frontend/`:
```env
REACT_APP_API_URL=http://localhost:5000
```

4. **Start the development server:**
```bash
npm start
```
Application runs on `http://localhost:3000`

## Usage Guide

### Data Upload Process
1. Access the application through the login page
2. Navigate to the dashboard and select "Upload File"
3. Choose CSV, XLSX, or XLS files (maximum 100MB)
4. The system automatically creates a SQLite database from your data
5. Database appears in your databases list for querying

### Natural Language Querying
1. Select a database from your uploaded files
2. Enter questions in plain English (e.g., "Show me the top 10 sales by region")
3. The AI processes your question and generates appropriate SQL queries
4. Results display as both tabular data and interactive charts
5. Use AI-suggested follow-up questions for deeper analysis

### Data Visualization
The platform automatically selects appropriate chart types based on data characteristics:
- **Bar charts** for categorical comparisons
- **Line charts** for time series data
- **Pie charts** for proportional data
- **Scatter plots** for correlation analysis
- **Area charts** for cumulative data

## Technical Implementation

### Backend Architecture

**Core Components:**
- `app.py` - Main FastAPI application with all endpoints
- `databases/` - Directory storing user SQLite databases
- Authentication system with bcrypt + JWT
- File processing pipeline using pandas for data transformation

**Key Endpoints:**
- `POST /auth/register` - Create user and return JWT
- `POST /auth/login` - Login and return JWT
- `POST /upload_csv` - File upload and database creation
- `GET /list_csvs` - List user databases
- `DELETE /delete_csv/{db_id}` - Database deletion
- `GET /database_info/{db_id}` - Database metadata + schema
- `POST /query` - Natural language to SQL conversion and execution
- `POST /suggest_refinements` - AI-powered query refinement suggestions

**Security Features:**
- SQL injection prevention through query validation
- Read-only SQL operations (SELECT statements only)
- User data isolation with separate databases
- Session management with JWT tokens
- File size and type validation

### Frontend Architecture

**Main Components:**
- `App.jsx` - Root component with routing and context providers
- `LoginPage.jsx` - Authentication interface
- `ProfessionalDashboard.jsx` - Main dashboard with sections for databases, querying, and visualization
- `ChartContainer.jsx` - Dynamic chart rendering based on data types

**State Management:**
- React Context for authentication state
- Custom hooks for database operations (`useDatabase`)
- Custom hooks for query execution (`useQuery`)
- Notification system for user feedback

**UI Framework:**
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons
- Recharts for data visualization

### Dependencies

**Backend Dependencies:**
```
fastapi>=0.104.1
uvicorn[standard]>=0.24.0
python-multipart>=0.0.6
pandas>=2.2.0
python-dotenv>=1.0.0
langchain-groq
langchain
PyJWT
bcrypt
motor
requests>=2.31.0
openpyxl>=3.1.2
xlrd>=2.0.1
itsdangerous>=2.1.2
```

**Frontend Dependencies:**
```
react: ^18.2.0
react-dom: ^18.2.0
react-router-dom: ^7.8.2
tailwindcss: ^3.2.6
framer-motion: ^10.0.1
firebase: ^11.4.0
recharts: ^2.5.0
axios: ^1.3.4
lucide-react: ^0.321.0
```

## Configuration

### Environment Variables

**Backend (`backend/.env`):**
```env
PORT=5000
RELOAD=True
ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
MONGODB_URI=
GROQ_API_KEY=your_groq_api_key_here
```

**Frontend (`frontend/.env` or `frontend/.env.local`):**
```env
REACT_APP_API_URL=http://localhost:5000
```

Templates are provided:
- `backend/.env.example`
- `frontend/.env.example`

## API Documentation

The backend provides automatic API documentation at `/docs` when running. Key endpoints:

### Authentication
- `POST /auth/register`
- `POST /auth/login`

### File Management
- `POST /upload_csv`
- `GET /list_csvs`
- `DELETE /delete_csv/{db_id}`
- `GET /database_info/{db_id}`

### Query Operations
- `POST /query` - Execute natural language queries against selected database
- `POST /suggest_refinements` - Get AI-suggested query refinements

## Troubleshooting

### Common Issues

**Backend fails to start:**
- Verify Groq API key is correctly set in `backend/.env`
- Check Python version compatibility (3.8+)
- Ensure all dependencies are installed

**Frontend cannot connect to backend:**
- Confirm `REACT_APP_API_URL` matches backend server address
- Check if backend server is running on specified port
- Verify CORS configuration allows frontend domain

**Authentication issues:**
- Ensure you are sending `Authorization: Bearer <token>` from the frontend (stored in `localStorage`)
- If `ALLOWED_ORIGINS` is `*`, credentialed requests are disabled (set explicit origins for production)

**File upload failures:**
- Supported formats: CSV, XLSX, XLS
- Maximum file size: 100MB
- Ensure file has proper column headers
- Check file encoding (UTF-8 recommended)

**Query execution errors:**
- Only SELECT statements are allowed for security
- Verify database contains data
- Check column names in natural language queries

## Deployment

### Production Deployment

**Backend (Render):**
1. Connect GitHub repository to Render
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `python app.py`
4. Configure environment variables in Render dashboard (use `backend/.env.example` as reference)

Recommended production environment variables:
```env
PORT=5000
RELOAD=False
ALLOWED_ORIGINS=https://YOUR-VERCEL-DOMAIN.vercel.app
JWT_SECRET_KEY=long-random-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
```

**Frontend (Vercel):**
1. Connect GitHub repository to Vercel
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Configure environment variables in Vercel dashboard

Required frontend environment variables:
```env
REACT_APP_API_URL=https://YOUR-BACKEND-DOMAIN
```

 
 

### Project Structure
```
NEUROBASE/
├── backend/
│   ├── app.py              # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example       # Environment variables template
│   └── databases/         # SQLite databases storage
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── constants/     # Application constants
│   │   └── styles/        # Styling configuration
│   ├── package.json       # Node.js dependencies
│   └── .env.example      # Environment variables template
└── README.md
```

### Adding New Features

**Backend Extensions:**
- Add new endpoints in `app.py`
- Implement additional AI models for query processing
- Extend file format support
- Add data export capabilities

**Frontend Enhancements:**
- Create new dashboard sections
- Implement additional chart types
- Add data filtering and sorting
- Enhance mobile responsiveness

## Security Considerations

- SQL queries are validated to prevent injection attacks
- Only SELECT operations are permitted
- User data is isolated in separate SQLite databases
- Authentication is handled via JWT tokens
- Session tokens are managed securely
- File uploads are validated for type and size

## Performance

- SQLite databases provide fast query execution for moderate datasets
- Pandas optimizes data processing and transformation
- React components use efficient rendering patterns
- Charts are rendered client-side for responsive interactions
- API responses are optimized for minimal payload size

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Make your changes with appropriate tests
4. Commit changes (`git commit -m 'Add new feature'`)
5. Push to branch (`git push origin feature/new-feature`)
6. Create a Pull Request

## Support

For issues and questions:
- Create an issue on [GitHub](https://github.com/Akshat21112005/NEUROBASE/issues)
- Check existing documentation and troubleshooting guide
- Review API documentation at `/docs` endpoint

---

**Developed by [Akshat Bhatt](https://github.com/Akshat21112005)**
