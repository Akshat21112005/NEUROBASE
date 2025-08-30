import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CubeCard = ({ 
  label, 
  value, 
  gradientId = 'primary', 
  size = 'medium', 
  statIcon,
  className = '',
  ...props 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Animated count-up effect
  useEffect(() => {
    const duration = 800;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const gradients = {
    primary: {
      cube: 'linear-gradient(135deg, #FF9A8B 0%, #FF6F91 50%, #B794F4 100%)',
      glow: 'rgba(255, 111, 145, 0.5)',
      faces: {
        top: '#FFB4A8',
        left: '#FF8FA0',
        right: '#C794F4'
      }
    },
    secondary: {
      cube: 'linear-gradient(135deg, #72E6FF 0%, #68FBD0 100%)',
      glow: 'rgba(114, 230, 255, 0.5)',
      faces: {
        top: '#8EEAFF',
        left: '#72E6FF',
        right: '#68FBD0'
      }
    },
    tertiary: {
      cube: 'linear-gradient(135deg, #A8E6CF 0%, #88D8A3 100%)',
      glow: 'rgba(168, 230, 207, 0.5)',
      faces: {
        top: '#B8F0D5',
        left: '#A8E6CF',
        right: '#88D8A3'
      }
    },
    quaternary: {
      cube: 'linear-gradient(135deg, #FFD166 0%, #F76E11 100%)',
      glow: 'rgba(247, 110, 17, 0.5)',
      faces: {
        top: '#FFDA85',
        left: '#FFD166',
        right: '#F76E11'
      }
    }
  };

  const sizeClasses = {
    small: 'w-36 h-44',
    medium: 'w-52 h-60',
    large: 'w-68 h-76'
  };

  const cubeSize = {
    small: { width: 80, height: 80 },
    medium: { width: 120, height: 120 },
    large: { width: 160, height: 160 }
  };

  const currentGradient = gradients[gradientId];
  const currentSize = cubeSize[size];

  return (
    <motion.div
      className={`
        relative ${sizeClasses[size]} 
        bg-white/12 backdrop-blur-lg 
        border border-white/20 rounded-2xl 
        p-6 cursor-pointer select-none
        transition-all duration-300 ease-out
        overflow-hidden
        ${className}
      `}
      style={{
        boxShadow: isHovered 
          ? `0 25px 50px ${currentGradient.glow}, 0 10px 20px rgba(0,0,0,0.25)`
          : `0 10px 30px ${currentGradient.glow}, 0 5px 10px rgba(0,0,0,0.15)`
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8, 
        scale: 1.03,
        transition: { type: "spring", stiffness: 260, damping: 20 }
      }}
      whileTap={{ 
        scale: 0.97,
        transition: { duration: 0.1 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${value}`}
      {...props}
    >
      {/* Decorative background elements */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-50" />
      
      {/* 3D Cube SVG */}
      <div className="flex justify-center mb-5">
        <motion.svg
          width={currentSize.width}
          height={currentSize.height}
          viewBox="0 0 120 120"
          className="drop-shadow-lg"
          animate={isHovered ? { rotateY: 6, rotateX: -2 } : { rotateY: 0, rotateX: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
        >
          <defs>
            <linearGradient id={`cube-gradient-${gradientId}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentGradient.faces.top} />
              <stop offset="100%" stopColor={currentGradient.faces.left} />
            </linearGradient>
            <linearGradient id={`cube-gradient-${gradientId}-left`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentGradient.faces.left} />
              <stop offset="100%" stopColor="#8B5A9F" />
            </linearGradient>
            <linearGradient id={`cube-gradient-${gradientId}-right`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentGradient.faces.right} />
              <stop offset="100%" stopColor="#6B4C93" />
            </linearGradient>
            <filter id={`cube-glow-${gradientId}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Cube faces */}
          <g filter={`url(#cube-glow-${gradientId})`}>
            {/* Top face */}
            <path
              d="M20 40 L60 20 L100 40 L60 60 Z"
              fill={`url(#cube-gradient-${gradientId}-top)`}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />
            {/* Left face */}
            <path
              d="M20 40 L60 60 L60 100 L20 80 Z"
              fill={`url(#cube-gradient-${gradientId}-left)`}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            {/* Right face */}
            <path
              d="M60 60 L100 40 L100 80 L60 100 Z"
              fill={`url(#cube-gradient-${gradientId}-right)`}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            {/* Highlight edges */}
            <path
              d="M20 40 L60 20 L100 40"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.5"
            />
            <path
              d="M60 20 L60 60"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />
          </g>
        </motion.svg>
      </div>

      {/* Value Display */}
      <div className="text-center mb-3">
        <motion.div 
          className="text-4xl font-black text-white leading-none"
          key={displayValue}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.span className="relative">
            {displayValue.toLocaleString()}
            <motion.span 
              className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-white/80 to-transparent" 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.3, duration: 0.4 }}
            />
          </motion.span>
        </motion.div>
      </div>

      {/* Label */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          {statIcon && (
            <div className="w-5 h-5 text-white/80">
              {statIcon}
            </div>
          )}
          <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">
            {label}
          </span>
        </div>
      </div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${currentGradient.glow} 0%, transparent 70%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.15 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Animated corner accent */}
      <motion.div 
        className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path 
            d="M64 0v64H0C0 28.65 28.65 0 64 0z" 
            fill="rgba(255,255,255,0.03)" 
          />
        </svg>
      </motion.div>

      {/* Focus ring for accessibility */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent focus-within:ring-white/60 focus-within:ring-offset-2 focus-within:ring-offset-transparent" />
    </motion.div>
  );
};

export default CubeCard;
