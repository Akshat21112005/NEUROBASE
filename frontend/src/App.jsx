import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { About, Contact, Experience, Feedbacks, Hero, Navbar, Tech, Works } from "./components";
import ThreeDInterface from './components/3d/ThreeDInterface';
import LoginPage from './components/auth/LoginPage';
import ProfessionalDashboard from './components/dashboard/ProfessionalDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Notification from './components/common/Notification';

// Protected route component
const ProtectedRoute = ({ children }) => {
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  const [showImmersiveUI, setShowImmersiveUI] = useState(true);
  
  return (
    <AuthProvider>
      <NotificationProvider>
        <Notification />
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ProfessionalDashboard />
            </ProtectedRoute>
          } />
          <Route path="/" element={
          <AnimatePresence mode="wait">
            {showImmersiveUI ? (
              <motion.div 
                key="immersive-ui"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-[#2A1B47] to-[#5B2B82]"
              >
                <ThreeDInterface />
                
                {/* Floating Action Button to switch to standard UI */}
                <motion.button
                  className="absolute bottom-8 right-8 z-50 px-6 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowImmersiveUI(false)}
                >
                  <span className="text-white font-medium">About Me</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                key="standard-ui"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className='relative z-0 bg-primary'
              >
                <div className='bg-hero-pattern bg-cover bg-no-repeat bg-center'>
                  <Navbar />
                  <Hero />
                </div>
                <About />
                <Experience />
                <Tech />
                <Works />
                <Feedbacks />
                <div className='relative z-0'>
                  <Contact />
                </div>
                
                {/* Floating Action Button to switch to immersive UI */}
                <motion.button
                  className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-[#915EFF] rounded-full shadow-lg"
                  whileHover={{ scale: 1.05, backgroundColor: '#A78BFF' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowImmersiveUI(true)}
                >
                  <span className="text-white font-medium">Go to Neurobase</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
