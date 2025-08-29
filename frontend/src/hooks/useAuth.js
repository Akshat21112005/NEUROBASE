import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, logoutFirebase } from '../firebase/config';
import apiService from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const profile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          photoURL: firebaseUser.photoURL
        };
        
        setUser(firebaseUser);
        setUserProfile(profile);
        setLoggedIn(true);
      } else {
        setUser(null);
        setUserProfile(null);
        setLoggedIn(false);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const login = async (userData) => {
    try {
      await apiService.firebaseLogin(userData.firebase_token, userData.username);
      return true;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
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
      throw new Error(`Logout failed: ${error.message}`);
    }
  };

  return {
    user,
    userProfile,
    loggedIn,
    loading,
    login,
    logout
  };
};
