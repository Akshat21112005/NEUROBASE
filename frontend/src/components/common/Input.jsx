import React from 'react';

const Input = ({ 
  label,
  error,
  className = '',
  variant = 'default',
  size = 'md',
  ...props 
}) => {
  const baseClasses = 'input-3d w-full transition-all duration-300 focus:outline-none';
  
  const variants = {
    default: 'bg-glass-light border border-glass-border text-white placeholder-white/60',
    solid: 'bg-white/10 border border-pastel-blue/30 text-white placeholder-white/60',
    accent: 'bg-pastel-pink/10 border border-pastel-pink/30 text-white placeholder-white/60'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-base rounded-xl',
    lg: 'px-6 py-4 text-lg rounded-2xl'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${error ? 'border-red-400 focus:border-red-400 focus:shadow-red-400/30' : 'focus:border-pastel-blue focus:shadow-pastel-blue/30'}
    ${className}
  `.trim();

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <input className={classes} {...props} />
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  );
};

export default Input;
