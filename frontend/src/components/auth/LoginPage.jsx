import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import { User, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const LoginPage = () => {
  const { login, loading, loggedIn, error } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (loggedIn) {
      localStorage.setItem('isAuthenticated', 'true');
      addNotification({
        type: 'info',
        title: 'Already Logged In',
        message: 'You are already authenticated. Redirecting to dashboard.',
      });
      navigate('/dashboard');
    }
    
    // Show error notification if there's an authentication error
    if (error) {
      addNotification({
        type: 'error',
        title: 'Authentication Error',
        message: error?.message || 'There was an issue with authentication. Please try again.',
      });
    }
  }, [loggedIn, navigate, addNotification, error]);

  const handleGoogleLogin = async () => {
    try {
      const success = await login();
      if (success) {
        localStorage.setItem('isAuthenticated', 'true');
        addNotification({
          type: 'success',
          title: 'Login Successful',
          message: 'Welcome to NeuroBase Dashboard!',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      // Login failed - error handled by notification system
      addNotification({
        type: 'error',
        title: 'Login Failed',
        message: error?.message || 'There was an issue signing in. Please try again.',
      });
    }
  };

  return (
    <div className="w-full h-screen absolute top-0 left-0 z-0 overflow-hidden bg-primary">
      {/* Clean professional background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-tertiary opacity-50"></div>
      
      {/* Minimal geometric pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-secondary/20 rounded-full"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 border border-secondary/20 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-16 h-16 border border-secondary/20 rounded-full"></div>
      </div>
      
      {/* Login Form */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="w-full"
        >
          <Card variant="default" className="backdrop-blur-xl border border-white/20 p-8 rounded-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                <User size={28} className="text-silver" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Welcome to NeuroBase</h2>
                <p className="text-white/70">Sign in to access your AI-powered data platform</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <motion.button 
                className="w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 flex items-center justify-center gap-2 border border-white/20 backdrop-blur-sm"
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(192, 192, 192, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>Sign in with Google</span>
                  </>
                )}
              </motion.button>
              
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="h-px bg-white/20 flex-1"></div>
                <span className="text-white/60 text-sm">Secure Authentication</span>
                <div className="h-px bg-white/20 flex-1"></div>
              </div>
              
              <div className="text-center text-white/60 text-sm">
                <p>NeuroBase uses secure authentication to protect your data</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;