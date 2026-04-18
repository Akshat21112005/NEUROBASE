class ApiService {
  constructor() {
    let url = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    // Remove trailing slash if present to avoid double slashes in requests
    this.baseURL = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  async request(endpoint, options = {}) {
    try {
      let headers = { 'Content-Type': 'application/json', ...options.headers };
      
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
  login = (email, password) => this.request('/auth/login', { 
    method: 'POST', 
    body: JSON.stringify({ email, password }) 
  });

  register = (name, email, password) => this.request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });

  // File upload endpoints
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    // For FormData, do NOT set Content-Type header - let browser set it with boundary
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
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

  suggestRefinements = (question, dbId, result) => this.request('/suggest_refinements', { 
    method: 'POST', 
    body: JSON.stringify({ question, db_id: dbId, result }) 
  });

  // Health check
  healthCheck = () => this.request('/health');
}

const apiService = new ApiService();
export default apiService;
