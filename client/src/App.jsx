import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

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

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const res = await axios.get("https://neurobase-2.onrender.com/user_status");
      if (res.data.logged_in) {
        setLoggedIn(true);
        setUsername(res.data.username);
        await loadCSVs();
      }
    } catch (err) {
      console.log("No existing session");
    }
  };

  const login = async () => {
    try {
      setLoading(true);
      setError("");
      
      if (!username.trim()) {
        setError("Please enter a username");
        return;
      }
      
      const response = await axios.post("https://neurobase-2.onrender.com/login", 
        { username }, 
        { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true 
        }
      );
      
      if (response.status === 200) {
        setLoggedIn(true);
        await loadCSVs();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post("https://neurobase-2.onrender.com/logout", {}, {
        withCredentials: true
      });
      setLoggedIn(false);
      setUsername("");
      setCsvList([]);
      setDbId("");
      setResponse(null);
      setError("");
    } catch (err) {
      console.error("Logout error:", err);
      setLoggedIn(false);
      setUsername("");
      setCsvList([]);
      setDbId("");
      setResponse(null);
      setError("");
    }
  };

  const loadCSVs = async () => {
    try {
      const res = await axios.get("https://neurobase-2.onrender.com/list_csvs", {
        withCredentials: true
      });
      setCsvList(res.data);
    } catch (err) {
      console.error("Load CSVs error:", err);
      if (err.response?.status === 403) {
        setLoggedIn(false);
        setError("Session expired. Please login again.");
      } else {
        setError("Failed to load CSV list");
      }
    }
  };

  const uploadCSV = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await axios.post("https://neurobase-2.onrender.com/upload_csv", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      
      setError("");
      setFile(null);
      await loadCSVs();
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setError(error.response?.data?.error || "Failed to upload CSV");
    } finally {
      setLoading(false);
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
      
      const res = await axios.post("https://neurobase-2.onrender.com/query", {
        db_id: dbId,
        question,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
      
      setResponse(res.data);
    } catch (err) {
      console.error("Query error:", err);
      if (err.response?.status === 403) {
        setLoggedIn(false);
        setError("Session expired. Please login again.");
      } else {
        setError(err.response?.data?.error || "Query failed. Please try again.");
      }
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
              value=""
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
                  <div style={{ overflowX: "auto" }}>
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
                              <td key={j}>{cell !== null ? cell.toString() : ""}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
