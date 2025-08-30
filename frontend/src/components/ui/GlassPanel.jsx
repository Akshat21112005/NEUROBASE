import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GlassPanel = ({ 
  children,
  title,
  subtitle,
  headerActions,
  collapsible = false,
  defaultCollapsed = false,
  className = '',
  contentClassName = '',
  glowColor = 'rgba(255, 255, 255, 0.1)',
  ...props 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <motion.div
      className={`
        relative bg-white/10 backdrop-blur-lg 
        border border-white/18 rounded-2xl 
        overflow-hidden
        hover:bg-white/12 hover:border-white/25
        transition-all duration-300 ease-out
        ${className}
      `}
      style={{
        boxShadow: `0 8px 32px ${glowColor}, 0 4px 16px rgba(0,0,0,0.1)`
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 28 
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2 }
      }}
      {...props}
    >
      {/* Header */}
      {(title || headerActions || collapsible) && (
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex-1">
            {title && (
              <motion.h3 
                className="text-xl font-bold text-white/95 mb-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {title}
              </motion.h3>
            )}
            {subtitle && (
              <motion.p 
                className="text-sm text-white/60"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Header Actions */}
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}

            {/* Collapse Toggle */}
            {collapsible && (
              <motion.button
                onClick={toggleCollapse}
                className="
                  p-2 rounded-lg bg-white/5 hover:bg-white/10
                  border border-white/10 hover:border-white/20
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-white/30
                "
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
              >
                <motion.svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  className="text-white/70"
                  animate={{ rotate: isCollapsed ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </motion.svg>
              </motion.button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className={`px-6 pb-6 ${contentClassName}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle gradient overlay for depth */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)'
        }}
      />

      {/* Focus ring for accessibility */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent focus-within:ring-white/30 focus-within:ring-offset-2 focus-within:ring-offset-transparent" />
    </motion.div>
  );
};

// Specialized variants for common use cases
export const ChartPanel = ({ children, ...props }) => (
  <GlassPanel 
    glowColor="rgba(114, 230, 255, 0.15)"
    className="min-h-[400px]"
    {...props}
  >
    {children}
  </GlassPanel>
);

export const DataPanel = ({ children, ...props }) => (
  <GlassPanel 
    glowColor="rgba(255, 111, 145, 0.15)"
    contentClassName="overflow-x-auto"
    {...props}
  >
    {children}
  </GlassPanel>
);

export const ControlPanel = ({ children, ...props }) => (
  <GlassPanel 
    glowColor="rgba(168, 230, 207, 0.15)"
    className="backdrop-blur-xl"
    {...props}
  >
    {children}
  </GlassPanel>
);

export default GlassPanel;
