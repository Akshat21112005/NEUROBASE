import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedAuth = localStorage.getItem('isAuthenticated');
        const storedUser = localStorage.getItem('user_data');
        
        if (storedAuth === 'true' && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser.id);
          setUserProfile(parsedUser);
        }
      } catch (err) {
        console.error("Session check failed", err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (response.access_token) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user_data', JSON.stringify({
          id: response.id,
          email: email,
          displayName: email.split('@')[0]
        }));
        localStorage.setItem('token', response.access_token);
        
        setUser(response.id);
        setUserProfile({
           id: response.id,
           email: email,
           displayName: email.split('@')[0]
        });
        return true;
      }
      return false;
    } catch (err) {
      setError(err.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      
      if (response.access_token) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user_data', JSON.stringify({
          id: response.id,
          email: email,
          displayName: name
        }));
        localStorage.setItem('token', response.access_token);
        
        setUser(response.id);
        setUserProfile({
           id: response.id,
           email: email,
           displayName: name
        });
        return true;
      }
      return false;
    } catch (err) {
      setError(err.message || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token');
    setUser(null);
    setUserProfile(null);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loggedIn: !!user,
        loading,
        error,
        setError,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};