import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const Notification = ({ 
  type = 'info', 
  message, 
  onClose, 
  autoClose = true, 
  duration = 5000,
  className = '' 
}) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle
  };

  const styles = {
    success: 'bg-gradient-to-r from-green-400/20 to-pastel-mint/20 border-green-400/40 text-green-200',
    error: 'bg-gradient-to-r from-red-400/20 to-red-500/20 border-red-400/40 text-red-200',
    info: 'bg-gradient-to-r from-pastel-blue/20 to-pastel-mint/20 border-pastel-blue/40 text-blue-200',
    warning: 'bg-gradient-to-r from-yellow-400/20 to-pastel-yellow/20 border-yellow-400/40 text-yellow-200'
  };

  const Icon = icons[type];

  return (
    <div className={`notification-3d fixed top-6 right-6 max-w-md z-50 p-4 border rounded-2xl backdrop-blur-xl ${styles[type]} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="flex-shrink-0 text-current hover:opacity-70 transition-opacity"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification;
