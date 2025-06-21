from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.utils import secure_filename
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import sqlite3
import pandas as pd
import torch
import os
import uuid
import traceback
import json
from datetime import datetime, timedelta
from werkzeug.middleware.proxy_fix import ProxyFix  
app = Flask(__name__)
app.secret_key = "supersecretkey"
app.permanent_session_lifetime = timedelta(hours=24)
app.config.update(
    SESSION_COOKIE_NAME='session',
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_SAMESITE='None'
)

app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

CORS(app, 
     origins=["https://neurobase-five.vercel.app"], 
     methods=["GET", "POST", "OPTIONS", "DELETE"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)

UPLOAD_FOLDER = "./databases/"
USERS_FILE = "./users.json"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
tokenizer = None
model = None
model_loaded = False

try:
    model_path = 'gaussalgo/T5-LM-Large-text2sql-spider'
    model = AutoModelForSeq2SeqLM.from_pretrained(model_path).to(device)
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model_loaded = True
    print(f"Model loaded on {device}")
except Exception as e:
    print(f"Failed to load model: {e}")

def load_user_data():
    try:
        if os.path.exists(USERS_FILE):
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading user data: {e}")
    return {}

def save_user_data(user_data):
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump(user_data, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving user data: {e}")

user_dbs = load_user_data()

@app.before_request
def before_request():
    if request.method == 'OPTIONS':
        return '', 200

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "NeuroBase API is running!", "timestamp": datetime.now().isoformat()}), 200

@app.route("/test", methods=["GET", "POST"])
def test():
    return jsonify({"message": "Server is working!", "method": request.method}), 200

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        username = data.get("username", "").strip()
        if not username:
            return jsonify({"error": "Username is required"}), 400

        if len(username) < 3:
            return jsonify({"error": "Username must be at least 3 characters"}), 400

        session["user"] = username
        session.permanent = True

        if username not in user_dbs:
            user_dbs[username] = []
            save_user_data(user_dbs)

        return jsonify({
            "message": f"Logged in as {username}",
            "username": username,
            "csv_count": len(user_dbs[username])
        }), 200

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": "Login failed"}), 500

@app.route("/logout", methods=["POST"])
def logout():
    user = session.get("user", "Unknown")
    session.clear()
    return jsonify({"message": f"{user} logged out"}), 200

@app.route("/user_status", methods=["GET"])
def user_status():
    if "user" not in session:
        return jsonify({"logged_in": False}), 200

    user = session["user"]
    return jsonify({
        "logged_in": True,
        "username": user,
        "csv_count": len(user_dbs.get(user, [])),
        "csv_limit": 5
    }), 200

@app.route("/upload_csv", methods=["POST"])
def upload_csv():
    try:
        if "user" not in session:
            return jsonify({"error": "Not logged in"}), 403

        user = session["user"]
        file = request.files.get("file")

        if not file or file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        if not file.filename.lower().endswith('.csv'):
            return jsonify({"error": "Only CSV files are allowed"}), 400

        current_dbs = user_dbs.get(user, [])
        if len(current_dbs) >= 5:
            return jsonify({"error": "CSV upload limit (5) reached. Please delete some databases first."}), 403

        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({"error": "Invalid filename"}), 400

        db_id = str(uuid.uuid4())
        db_path = os.path.join(UPLOAD_FOLDER, f"{user}_{db_id}.db")

        try:
            df = pd.read_csv(file)
        except Exception as e:
            return jsonify({"error": f"Failed to read CSV: {str(e)}"}), 400

        if df.empty:
            return jsonify({"error": "CSV file is empty"}), 400

        df.columns = df.columns.str.strip().str.replace(' ', '_').str.replace('-', '_')

        table_name = os.path.splitext(filename)[0].replace('-', '_').replace(' ', '_').lower()
        if not table_name or not table_name.replace('_', '').isalnum():
            table_name = f"table_{db_id[:8]}"

        conn = sqlite3.connect(db_path)
        try:
            df.to_sql(table_name, conn, index=False, if_exists="replace")
        except Exception as e:
            conn.close()
            if os.path.exists(db_path):
                os.remove(db_path)
            return jsonify({"error": f"Failed to create database: {str(e)}"}), 500
        finally:
            conn.close()

        db_info = {
            "id": db_id,
            "name": filename,
            "path": db_path,
            "table": table_name,
            "uploaded_at": datetime.now().isoformat(),
            "row_count": len(df),
            "column_count": len(df.columns)
        }

        if user not in user_dbs:
            user_dbs[user] = []
        user_dbs[user].append(db_info)
        save_user_data(user_dbs)

        return jsonify({
            "message": "CSV uploaded successfully",
            "db_id": db_id,
            "table_name": table_name,
            "rows": len(df),
            "columns": len(df.columns)
        }), 200

    except Exception as e:
        print(f"Upload error: {traceback.format_exc()}")
        return jsonify({"error": "Upload failed"}), 500

@app.route("/delete_csv/<db_id>", methods=["DELETE"])
def delete_csv(db_id):
    try:
        if "user" not in session:
            return jsonify({"error": "Not logged in"}), 403

        user = session["user"]
        user_databases = user_dbs.get(user, [])

        db_entry = next((d for d in user_databases if d["id"] == db_id), None)
        if not db_entry:
            return jsonify({"error": "Database not found"}), 404

        db_path = db_entry["path"]
        if os.path.exists(db_path):
            os.remove(db_path)

        user_dbs[user] = [d for d in user_databases if d["id"] != db_id]
        save_user_data(user_dbs)

        return jsonify({
            "message": "Database deleted successfully",
            "deleted_db": db_entry["name"]
        }), 200

    except Exception as e:
        print(f"Delete error: {traceback.format_exc()}")
        return jsonify({"error": "Delete failed"}), 500

@app.route("/list_csvs", methods=["GET"])
def list_csvs():
    if "user" not in session:
        return jsonify({"error": "Not logged in"}), 403

    user = session["user"]
    databases = user_dbs.get(user, [])

    valid_dbs = []
    for db in databases:
        if os.path.exists(db["path"]):
            valid_dbs.append(db)
        else:
            print(f"Removing reference to missing file: {db['path']}")

    if len(valid_dbs) != len(databases):
        user_dbs[user] = valid_dbs
        save_user_data(user_dbs)

    return jsonify(valid_dbs)

@app.route("/db_info/<db_id>", methods=["GET"])
def get_db_info(db_id):
    try:
        if "user" not in session:
            return jsonify({"error": "Not logged in"}), 403

        user = session["user"]
        db_entry = next((d for d in user_dbs.get(user, []) if d["id"] == db_id), None)
        if not db_entry:
            return jsonify({"error": "Database not found"}), 404

        db_path = db_entry["path"]
        table_name = db_entry["table"]

        if not os.path.exists(db_path):
            return jsonify({"error": "Database file not found"}), 404

        conn = sqlite3.connect(db_path)
        try:
            cursor = conn.cursor()
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns_info = cursor.fetchall()
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
            sample_data = cursor.fetchall()
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row_count = cursor.fetchone()[0]
        finally:
            conn.close()

        return jsonify({
            "db_id": db_id,
            "name": db_entry["name"],
            "table_name": table_name,
            "columns": [{"name": col[1], "type": col[2]} for col in columns_info],
            "sample_data": sample_data,
            "row_count": row_count,
            "uploaded_at": db_entry.get("uploaded_at", "Unknown")
        })

    except Exception as e:
        print(f"DB info error: {traceback.format_exc()}")
        return jsonify({"error": "Failed to get database info"}), 500

def get_table_schema(db_path, table_name):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns_info = cursor.fetchall()
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
        sample_data = cursor.fetchall()
        conn.close()
        columns = [col[1] for col in columns_info]
        return columns, sample_data
    except Exception as e:
        print(f"Schema error: {e}")
        return [], []

def clean_sql_query(query, table_name):
    query = query.replace("translate English to SQL: ", "").strip()
    if table_name not in query:
        query = query.replace(" table ", f" {table_name} ")
        query = query.replace("FROM table", f"FROM {table_name}")
        if "FROM" not in query.upper():
            query += f" FROM {table_name}"
    return query.strip()

def create_fallback_query(question, table_name, columns):
    question_lower = question.lower()
    if any(word in question_lower for word in ["all", "show", "display", "list"]):
        return f"SELECT * FROM {table_name} LIMIT 100"
    elif "count" in question_lower:
        return f"SELECT COUNT(*) FROM {table_name}"
    elif "distinct" in question_lower and columns:
        return f"SELECT DISTINCT {columns[0]} FROM {table_name}"
    elif "max" in question_lower and columns:
        numeric_cols = [col for col in columns if any(word in col.lower() for word in ["price", "amount", "count", "number", "id"])]
        col = numeric_cols[0] if numeric_cols else columns[-1]
        return f"SELECT MAX({col}) FROM {table_name}"
    elif "min" in question_lower and columns:
        numeric_cols = [col for col in columns if any(word in col.lower() for word in ["price", "amount", "count", "number", "id"])]
        col = numeric_cols[0] if numeric_cols else columns[-1]
        return f"SELECT MIN({col}) FROM {table_name}"
    elif "average" in question_lower or "avg" in question_lower and columns:
        numeric_cols = [col for col in columns if any(word in col.lower() for word in ["price", "amount", "count", "number"])]
        col = numeric_cols[0] if numeric_cols else columns[-1]
        return f"SELECT AVG({col}) FROM {table_name}"
    return f"SELECT * FROM {table_name} LIMIT 10"

def execute_query_safely(conn, query, fallback_query):
    cursor = conn.cursor()
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        columns_result = [desc[0] for desc in cursor.description]
        return rows, columns_result, query
    except Exception as e:
        print(f"Primary query failed: {e}")
        try:
            cursor.execute(fallback_query)
            rows = cursor.fetchall()
            columns_result = [desc[0] for desc in cursor.description]
            return rows, columns_result, f"FALLBACK: {fallback_query}"
        except Exception as e2:
            print(f"Fallback query failed: {e2}")
            raise e2

@app.route("/query", methods=["POST"])
def query():
    try:
        if "user" not in session:
            return jsonify({"error": "Not logged in"}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        question = data.get("question", "").strip()
        db_id = data.get("db_id", "").strip()

        if not question or not db_id:
            return jsonify({"error": "Question and DB ID are required"}), 400

        user = session["user"]
        db_entry = next((d for d in user_dbs.get(user, []) if d["id"] == db_id), None)
        if not db_entry:
            return jsonify({"error": "Database not found"}), 404

        db_path = db_entry["path"]
        table_name = db_entry["table"]

        if not os.path.exists(db_path):
            return jsonify({"error": "Database file not found"}), 404

        columns, sample_data = get_table_schema(db_path, table_name)
        if not columns:
            return jsonify({"error": "Could not read table schema"}), 500

        sql_query = None

        if model_loaded:
            try:
                input_text = f"translate English to SQL: {question}. Use table name '{table_name}' with columns: {', '.join(columns)}"
                inputs = tokenizer.encode(input_text, return_tensors="pt", max_length=256, truncation=True).to(device)
                with torch.no_grad():
                    outputs = model.generate(inputs, max_length=100, num_beams=4, early_stopping=True)
                sql_query = tokenizer.decode(outputs[0], skip_special_tokens=True)
                sql_query = clean_sql_query(sql_query, table_name)
            except Exception as e:
                print(f"Model generation error: {e}")

        fallback_query = create_fallback_query(question, table_name, columns)
        if not sql_query or not sql_query.upper().strip().startswith("SELECT"):
            sql_query = fallback_query

        conn = sqlite3.connect(db_path)
        try:
            rows, columns_result, executed_query = execute_query_safely(conn, sql_query, fallback_query)
        finally:
            conn.close()

        return jsonify({
            "question": question,
            "query": executed_query,
            "columns": columns_result,
            "data": rows[:100],
            "row_count": len(rows),
            "table_info": {
                "name": table_name,
                "total_columns": len(columns),
                "available_columns": columns
            }
        })

    except Exception as e:
        print(f"Query error: {traceback.format_exc()}")
        return jsonify({"error": "Query execution failed"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    print(f"Internal error: {error}")
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    print(f"Unhandled exception: {traceback.format_exc()}")
    return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == "__main__":
    print("Starting NeuroBase Flask Server...")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Model loaded: {model_loaded}")
    app.run(debug=True, host='0.0.0.0', port=5000)
