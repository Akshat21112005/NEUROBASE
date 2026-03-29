import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Main ThreeDInterface component with CSS-based animations instead of Three.js
const ThreeDInterface = () => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  
  return (
    <div className="w-full h-screen absolute top-0 left-0 z-0 overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated circles representing neural nodes */}
        {Array.from({ length: 20 }).map((_, i) => {
          const size = Math.random() * 100 + 50;
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const delay = Math.random() * 5;
          const duration = Math.random() * 10 + 10;
          const color = i % 5 === 0 ? '#FF5733' : i % 3 === 0 ? '#33FF57' : '#915EFF';
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full opacity-30"
              style={{
                width: size,
                height: size,
                left: `${x}%`,
                top: `${y}%`,
                backgroundColor: color,
                boxShadow: `0 0 30px ${color}`,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50, 0],
                y: [0, Math.random() * 100 - 50, 0],
                scale: [1, Math.random() * 0.5 + 0.8, 1],
              }}
              transition={{
                duration: duration * 2, // Doubled the duration to slow down
                delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          );
        })}
        
        {/* Animated lines representing connections */}
        {Array.from({ length: 10 }).map((_, i) => {
          const width = Math.random() * 200 + 100;
          const height = Math.random() * 2 + 1;
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const rotation = Math.random() * 360;
          const delay = Math.random() * 5;
          
          return (
            <motion.div
              key={`line-${i}`}
              className="absolute bg-white opacity-10"
              style={{
                width,
                height,
                left: `${x}%`,
                top: `${y}%`,
                transform: `rotate(${rotation}deg)`,
              }}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                width: [width, width * 1.2, width],
              }}
              transition={{
                duration: 14, // Doubled from 7 to slow down
                delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          );
        })}
        
        {/* Central glowing orb */}
        <motion.div
          className="absolute rounded-full bg-purple-500 opacity-20"
          style={{
            width: 300,
            height: 300,
            left: '50%',
            top: '50%',
            marginLeft: -150,
            marginTop: -150,
            boxShadow: '0 0 100px #915EFF',
            filter: 'blur(40px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 16, // Doubled from 8 to slow down
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* Overlay UI elements */}
       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5, duration: 0.8 }}
           className="glass-strong p-8 rounded-2xl pointer-events-auto"
           whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(145, 94, 255, 0.5)' }}
           onHoverStart={() => setHovered(true)}
           onHoverEnd={() => setHovered(false)}
         >
           <motion.h1 
             className="text-4xl font-bold text-white mb-4"
             animate={{ scale: hovered ? 1.05 : 1 }}
             transition={{ duration: 0.3 }}
           >
             NeuroBase
           </motion.h1>
           <motion.p 
             className="text-xl text-white/80 mb-6"
             animate={{ opacity: hovered ? 1 : 0.8 }}
             transition={{ duration: 0.3 }}
           >
             AI-Powered Data Intelligence
           </motion.p>
           <motion.button 
             className="bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-3 px-6 rounded-full transition-all duration-300"
             whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(145, 94, 255, 0.7)' }}
             whileTap={{ scale: 0.98 }}
             onClick={() => navigate('/login')}
           >
             Enter Dashboard
           </motion.button>
         </motion.div>
       </div>
    </div>
  );
};

export default ThreeDInterface;