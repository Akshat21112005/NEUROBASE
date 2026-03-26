import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, Mail, Lock, UserPlus, Brain, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const LoginPage = () => {
  const { login, register, loading, loggedIn, error, setError } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const hasRedirected = useRef(false);

  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (loggedIn && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/dashboard', { replace: true });
    }
  }, [loggedIn, navigate]);

  // Show error notification
  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Authentication Error',
        message: error || 'There was an issue with authentication. Please try again.',
      });
      setError(null);
    }
  }, [error, addNotification, setError]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || (!isLoginView && !formData.username)) {
      addNotification({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please fill in all required fields.',
      });
      return;
    }

    try {
      let success = false;
      if (isLoginView) {
        success = await login(formData.email, formData.password);
      } else {
        success = await register(formData.username, formData.email, formData.password);
      }

      if (success) {
        hasRedirected.current = true;
        addNotification({
          type: 'success',
          title: isLoginView ? 'Login Successful' : 'Registration Successful',
          message: 'Welcome to NeuroBase!',
        });
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setFormData({ username: '', email: '', password: '' });
    setError(null);
  };

  return (
    <div className="nb-login-page">
      {/* Subtle animated background */}
      <div className="nb-login-bg">
        <div className="nb-login-orb nb-login-orb-1" />
        <div className="nb-login-orb nb-login-orb-2" />
        <div className="nb-login-orb nb-login-orb-3" />
      </div>

      {/* Login Card */}
      <div className="nb-login-container">
        <div className="nb-login-card">
          {/* Brand Header */}
          <div className="nb-login-brand">
            <div className="nb-login-logo">
              <Brain size={28} />
            </div>
            <div>
              <h1 className="nb-login-title">
                {isLoginView ? 'Welcome Back' : 'Join NeuroBase'}
              </h1>
              <p className="nb-login-subtitle">
                {isLoginView ? 'Sign in to your AI workspace' : 'Create your account to get started'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="nb-login-form">
            {/* Username - register only */}
            {!isLoginView && (
              <div className="nb-input-group">
                <div className="nb-input-icon">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Display Name"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="nb-input"
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email */}
            <div className="nb-input-group">
              <div className="nb-input-icon">
                <Mail size={18} />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                className="nb-input"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="nb-input-group">
              <div className="nb-input-icon">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="nb-input"
                autoComplete={isLoginView ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="nb-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="nb-login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="nb-spinner" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {isLoginView ? <LogIn size={18} /> : <UserPlus size={18} />}
                  <span>{isLoginView ? 'Sign In' : 'Create Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="nb-login-toggle">
            <span className="nb-login-toggle-text">
              {isLoginView ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button type="button" onClick={toggleView} className="nb-login-toggle-btn">
              {isLoginView ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;