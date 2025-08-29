import React, { useState, useEffect } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';

const StatCounter = ({ 
  label, 
  value, 
  trend = 'neutral', 
  change = 0,
  className = '',
  delay = 0,
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Animated counter using Framer Motion spring
  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  const displayValue = useTransform(springValue, (latest) => {
    if (type === 'percent') {
      return `${Math.round(latest)}%`;
    }
    return Math.round(latest).toLocaleString();
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      springValue.set(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, springValue, delay]);

  const getTrendIcon = () => {
    if (trend === 'neutral') return null;
    
    const isPositive = trend === 'up';
    return (
      <motion.div
        className={`flex items-center gap-1.5 text-xs font-medium ${
          isPositive ? 'text-emerald-400' : 'text-red-400'
        }`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.5, duration: 0.3 }}
      >
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transform ${isPositive ? '' : 'rotate-180'}`}
        >
          <path d="m18 15-6-6-6 6"/>
        </svg>
        <span>{Math.abs(change)}%</span>
        
        {/* Pulse animation for significant changes */}
        {Math.abs(change) > 5 && (
          <motion.div
            className="w-1.5 h-1.5 bg-current rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      className={`
        relative bg-white/10 backdrop-blur-md 
        border border-white/15 rounded-xl 
        p-5 min-w-[160px]
        hover:bg-white/15 transition-all duration-300
        overflow-hidden
        ${className}
      `}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: delay,
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      }}
      whileHover={{ 
        y: -3,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
        transition: { duration: 0.3 }
      }}
      role="region"
      aria-live="polite"
      aria-label={`${label}: ${value}`}
      {...props}
    >
      {/* Decorative background elements */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-50" />
      
      {/* Label */}
      <div className="text-sm font-medium text-white/70 mb-2">
        {label}
      </div>

      {/* Value with animated counter */}
      <div className="flex items-end justify-between">
        <motion.div 
          className="text-3xl font-bold text-white leading-none"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: delay + 0.2,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
        >
          <motion.span className="relative">
            {displayValue}
            <motion.span 
              className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-white/80 to-transparent" 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: delay + 0.5, duration: 0.4 }}
            />
          </motion.span>
        </motion.div>

        {/* Trend indicator */}
        {getTrendIcon()}
      </div>

      {/* Subtle glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, transparent 70%)',
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Animated corner accent */}
      <motion.div 
        className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3, duration: 0.5 }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path 
            d="M48 0v48H0C0 21.49 21.49 0 48 0z" 
            fill="rgba(255,255,255,0.03)" 
          />
        </svg>
      </motion.div>

      {/* Focus ring for accessibility */}
      <div className="absolute inset-0 rounded-xl ring-2 ring-transparent focus-within:ring-white/40 focus-within:ring-offset-2 focus-within:ring-offset-transparent" />
    </motion.div>
  );
};

export default StatCounter;
