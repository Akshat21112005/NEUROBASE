import { getIdToken } from '../firebase/config';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  async request(endpoint, options = {}) {
    try {
      // Get Firebase token if user is authenticated
      let headers = { 'Content-Type': 'application/json', ...options.headers };
      
      try {
        const token = await getIdToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (tokenError) {
        // No Firebase token available - continuing without auth
      }
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        credentials: 'include',
        headers,
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please ensure the backend is running on localhost:5000');
      }
      throw error;
    }
  }

  // Authentication endpoints
  login = (username) => this.request('/login', { 
    method: 'POST', 
    body: JSON.stringify({ username }) 
  });

  logout = () => this.request('/logout', { method: 'POST' });

  sessionCheck = () => this.request('/session_check');

  firebaseLogin = (firebaseToken, username) => this.request('/api/firebase-login', {
    method: 'POST',
    body: JSON.stringify({ firebase_token: firebaseToken, username })
  });

  // File upload endpoints
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Get Firebase token for authentication
    let headers = {};
    try {
      const token = await getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (tokenError) {
      // No Firebase token available for upload - continuing without auth
    }
    
    const response = await fetch(`${this.baseURL}/upload_csv`, {
      method: 'POST', 
      credentials: 'include',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: HTTP ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Database endpoints
  listCSVs = () => this.request('/list_csvs');
  
  deleteCSV = (dbId) => this.request(`/delete_csv/${dbId}`, { method: 'DELETE' });
  
  getDatabaseInfo = (dbId) => this.request(`/database_info/${dbId}`);

  // Query endpoints
  query = (question, dbId) => this.request('/query', { 
    method: 'POST', 
    body: JSON.stringify({ question, db_id: dbId }) 
  });

  enhancedQuery = (question, dbId, context, analysisType) => this.request('/enhanced_query', {
    method: 'POST',
    body: JSON.stringify({ 
      question, 
      db_id: dbId, 
      context, 
      analysis_type: analysisType 
    })
  });

  suggestRefinements = (question, dbId, result) => this.request('/suggest_refinements', { 
    method: 'POST', 
    body: JSON.stringify({ question, db_id: dbId, result }) 
  });

  // Health check
  healthCheck = () => this.request('/health');
}

const apiService = new ApiService();
export default apiService;
