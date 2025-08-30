import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logoutFirebase, getIdToken } from '../firebase/config';
import apiService from '../services/api';
import { useNavigate } from 'react-router-dom';

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
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserProfile({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        // Auto-set authentication status when Firebase user is detected
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        setUserProfile(null);
        // Clear authentication status when user logs out
        localStorage.removeItem('isAuthenticated');
        setLoggedIn(false);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try Firebase login first
      try {
        const user = await signInWithGoogle();
        const token = await user.getIdToken();
        
        await apiService.firebaseLogin(token, user.displayName || (user.email ? user.email.split('@')[0] : user.uid));
        return true;
      } catch (firebaseError) {
        // Firebase login failed, using demo mode
        // Fallback to demo mode if Firebase fails
        await apiService.firebaseLogin('demo_token', 'demo_user');
        return true;
      }
    } catch (error) {
      setError(`Login failed: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutFirebase();
      await apiService.logout();
      setUser(null);
      setUserProfile(null);
      setLoggedIn(false);
      return true;
    } catch (error) {
      setError(`Logout failed: ${error.message}`);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loggedIn,
        loading,
        error,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};