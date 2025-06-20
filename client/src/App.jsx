import React, { useState } from "react";
import axios from "axios";
import "./App.css";

 
axios.defaults.withCredentials = true;

function App() {
  const [username, setUsername] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [file, setFile] = useState(null);
  const [csvList, setCsvList] = useState([]);
  const [dbId, setDbId] = useState("");
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    try {
      setLoading(true);
      setError("");
      
      if (!username.trim()) {
        setError("Please enter a username");
        return;
      }
      
      await axios.post("http://localhost:5000/login", { username });
      setLoggedIn(true);
      await loadCSVs();
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post("http://localhost:5000/logout", {});
      setLoggedIn(false);
      setCsvList([]);
      setDbId("");
      setResponse(null);
      setError("");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const loadCSVs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/list_csvs");
      setCsvList(res.data);
    } catch (err) {
      console.error("Load CSVs error:", err);
      setError("Failed to load CSV list");
    }
  };

  const uploadCSV = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      };
      
      const response = await axios.post("http://localhost:5000/upload_csv", formData, config);
      alert(response.data.message);
      loadCSVs();
    } catch (error) {
      console.error("Error uploading CSV:", error);
      alert(error.response?.data?.error || "Failed to upload CSV");
    }
  };

  const sendQuery = async () => {
    try {
      setLoading(true);
      setError("");
      
      if (!dbId) {
        setError("Please select a database first");
        return;
      }
      
      if (!question.trim()) {
        setError("Please enter a question");
        return;
      }
      
      const res = await axios.post("http://localhost:5000/query", {
        db_id: dbId,
        question,
      });
      
      setResponse(res.data);
    } catch (err) {
      console.error("Query error:", err);
      setError(err.response?.data?.error || "Query failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🧠 NeuroBase AI powered DBMS</h1>
      
      {error && (
        <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>
          {error}
        </div>
      )}
      
      {!loggedIn ? (
        <div className="login-box">
          <input 
            placeholder="Enter your username" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && login()}
          />
          <button onClick={login} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      ) : (
        <>
          <div className="top-bar">
            <span>Welcome, {username}</span>
            <button onClick={logout}>Logout</button>
          </div>

          <div className="section">
            <h2>Upload CSV (max 5) - Current: {csvList.length}/5</h2>
            <input 
              type="file" 
              accept=".csv"
              onChange={e => setFile(e.target.files[0])} 
            />
            <button onClick={uploadCSV} disabled={loading || !file}>
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>

          <div className="section">
            <h2>Select Database</h2>
            <select value={dbId} onChange={e => setDbId(e.target.value)}>
              <option value="">Select DB</option>
              {csvList.map(db => (
                <option key={db.id} value={db.id}>{db.name}</option>
              ))}
            </select>
          </div>

          <div className="section">
            <h2>Ask a Question</h2>
            <input
              placeholder="e.g., Show all students with marks > 90"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendQuery()}
            />
            <button onClick={sendQuery} disabled={loading || !dbId || !question.trim()}>
              {loading ? "Querying..." : "Query"}
            </button>
          </div>

          {response && (
            <div className="results">
              <h3>SQL Query:</h3>
              <code style={{ display: "block", background: "#f5f5f5", padding: "10px", marginBottom: "10px" }}>
                {response.query}
              </code>
              {response.columns ? (
                <div>
                  <h3>Results ({response.data.length} rows):</h3>
                  <table>
                    <thead>
                      <tr>
                        {response.columns.map((col, i) => (
                          <th key={i}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {response.data.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: "red" }}>Error: {response.error}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;