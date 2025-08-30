import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  hover = true, 
  padding = 'lg',
  variant = 'default',
  ...props 
}) => {
  const baseClasses = 'card-3d transition-all duration-400';
  
  const variants = {
    default: 'bg-glass-light backdrop-blur-xl border border-glass-border',
    solid: 'bg-gradient-to-br from-pastel-blue/20 to-pastel-mint/20 border border-pastel-blue/30',
    accent: 'bg-gradient-to-br from-pastel-pink/20 to-pastel-peach/20 border border-pastel-pink/30',
    dark: 'bg-black/40 backdrop-blur-xl border border-gray-600/30'
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${paddings[padding]}
    ${hover ? 'hover:shadow-3d-hover hover:-translate-y-1' : ''}
    ${className}
  `.trim();

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
