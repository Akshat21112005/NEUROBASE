import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      ...notification,
      type: notification.type || 'info',
    };
    
    setNotifications((prev) => [...prev, newNotification]);
    
    // Auto-dismiss after timeout
    if (notification.timeout !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.timeout || 5000);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const showSuccess = (message, options = {}) => {
    return addNotification({ message, type: 'success', ...options });
  };

  const showError = (message, options = {}) => {
    return addNotification({ message, type: 'error', ...options });
  };

  const showInfo = (message, options = {}) => {
    return addNotification({ message, type: 'info', ...options });
  };

  const showWarning = (message, options = {}) => {
    return addNotification({ message, type: 'warning', ...options });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};