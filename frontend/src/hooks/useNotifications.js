import { useState, useCallback } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((type, message, duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, type, message, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  }, [removeNotification]);

  const success = useCallback((message, duration) => 
    addNotification('success', message, duration), [addNotification]);
  
  const error = useCallback((message, duration) => 
    addNotification('error', message, duration), [addNotification]);
  
  const info = useCallback((message, duration) => 
    addNotification('info', message, duration), [addNotification]);
  
  const warning = useCallback((message, duration) => 
    addNotification('warning', message, duration), [addNotification]);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning,
    clear
  };
};
