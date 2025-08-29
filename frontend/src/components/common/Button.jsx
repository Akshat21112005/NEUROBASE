import React from 'react';
import { Loader } from 'lucide-react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  ...props 
}) => {
  const baseClasses = 'btn-3d font-semibold transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-pastel-blue to-pastel-mint text-gray-800 hover:from-pastel-mint hover:to-pastel-blue focus:ring-pastel-blue',
    secondary: 'bg-gradient-to-r from-pastel-pink to-pastel-peach text-gray-800 hover:from-pastel-peach hover:to-pastel-pink focus:ring-pastel-pink',
    accent: 'bg-gradient-to-r from-pastel-lavender to-pastel-pink text-gray-800 hover:from-pastel-pink hover:to-pastel-lavender focus:ring-pastel-lavender',
    ghost: 'bg-glass-light border border-glass-border text-white hover:bg-white/20 focus:ring-white/50',
    danger: 'bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600 focus:ring-red-400'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${loading || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
    ${className}
  `.trim();

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <>
          <Loader size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} className="animate-spin" />
          {children}
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
