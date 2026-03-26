import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Brain, Activity, Search, Settings, User, LogOut, Trash2, BarChart3, Upload, FileText, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useQuery } from '../../hooks/useQuery';
import { useDatabase } from '../../hooks/useDatabase';
import { styles } from '../../styles';
import ChartContainer from '../charts/ChartContainer';

const ProfessionalDashboard = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { executeQuery, loading: queryLoading, result } = useQuery();
  const { databases, selectedDb, loadDatabases, setSelectedDb, uploadFile, deleteDatabase, loading: dbLoading } = useDatabase();
  
  // UI State
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [queryInput, setQueryInput] = useState('');
  
  // Combined loading state for UI
  const loading = queryLoading || dbLoading;
  
  // Navigation items
  const navItems = [
    { id: 'dashboard', title: 'Dashboard', icon: Activity },
    { id: 'databases', title: 'Databases', icon: Database },
    { id: 'query', title: 'Query', icon: Search },
    { id: 'visualize', title: 'Visualize', icon: BarChart3 },
  ];

  useEffect(() => {
    loadDatabases().catch(error => {
      addNotification({
        type: 'error',
        title: 'Database Error',
        message: `Failed to load databases: ${error.message}`,
      });
    });
  }, [loadDatabases, addNotification]);
  
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('isAuthenticated');
      addNotification({
        type: 'info',
        title: 'Logged Out',
        message: 'You have been successfully logged out.',
      });
      navigate('/login');
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Logout Failed',
        message: 'There was an issue logging you out. Please try again.',
      });
    }
  };

  const handleQuery = async () => {
    if (queryInput.trim()) {
      if (!selectedDb) {
        addNotification({
          type: 'warning',
          title: 'No Database Selected',
          message: 'Please select a database first.',
        });
        return;
      }
      
      try {
        await executeQuery(queryInput, selectedDb);
        addNotification({
          type: 'success',
          title: 'Query Successful',
          message: `Your query "${queryInput}" has been processed successfully.`,
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Query Failed',
          message: error.message,
        });
      }
    } else {
      addNotification({
        type: 'error',
        title: 'Empty Query',
        message: 'Please enter a question first.',
      });
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-primary">
      {/* Navigation Bar */}
      <nav className={`${styles.paddingX} w-full flex items-center py-5 fixed top-0 z-20 bg-primary`}>
        <div className='w-full flex justify-between items-center max-w-7xl mx-auto'>
          <div className='flex items-center gap-2'>
            <div className='w-9 h-9 rounded-full bg-[#915EFF] flex items-center justify-center'>
              <Brain size={20} className="text-white" />
            </div>
            <p className='text-white text-[18px] font-bold cursor-pointer flex'>
              NeuroBase &nbsp;
              <span className='sm:block hidden'> | AI Data Dashboard</span>
            </p>
          </div>

          <ul className='list-none hidden sm:flex flex-row gap-10'>
            {navItems.map((nav) => (
              <li
                key={nav.id}
                className={`${
                  activeSection === nav.id ? "text-white" : "text-secondary"
                } hover:text-white text-[18px] font-medium cursor-pointer`}
                onClick={() => setActiveSection(nav.id)}
              >
                <span className="flex items-center gap-2">
                  <nav.icon size={18} />
                  {nav.title}
                </span>
              </li>
            ))}
          </ul>

          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-tertiary rounded-full">
              {userProfile?.photoURL ? (
                <img 
                  src={userProfile.photoURL} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#915EFF] flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
              )}
              <span className="text-white text-sm">
                {userProfile?.displayName || 'User'}
              </span>
            </div>
            
            <motion.button 
              className="px-4 py-2 bg-[#915EFF] text-white rounded-lg hover:bg-[#7c3aed] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </motion.button>
          </div>

          <div className='sm:hidden flex flex-1 justify-end items-center'>
            <button
              className='w-[28px] h-[28px] flex items-center justify-center'
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="text-white" /> : <Menu className="text-white" />}
            </button>

            <div
              className={`${
                !mobileMenuOpen ? "hidden" : "flex"
              } p-6 black-gradient absolute top-20 right-0 mx-4 my-2 min-w-[140px] z-10 rounded-xl`}
            >
              <ul className='list-none flex justify-end items-start flex-1 flex-col gap-4'>
                {navItems.map((nav) => (
                  <li
                    key={nav.id}
                    className={`font-poppins font-medium cursor-pointer text-[16px] ${
                      activeSection === nav.id ? "text-white" : "text-secondary"
                    }`}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setActiveSection(nav.id);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <nav.icon size={16} />
                      {nav.title}
                    </span>
                  </li>
                ))}
                <li className="border-t border-white/20 pt-4 w-full">
                  <button 
                    className="flex items-center gap-2 text-red-400 font-medium"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <section className={`relative w-full min-h-screen mx-auto pt-[120px]`}>
        <div className={`${styles.paddingX} max-w-7xl mx-auto`}>
          
          {/* Hero Section */}
          {activeSection === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className='flex flex-row items-start gap-5 mb-10'>
                <div className='flex flex-col justify-center items-center mt-5'>
                  <div className='w-5 h-5 rounded-full bg-[#915EFF]' />
                  <div className='w-1 sm:h-20 h-10 violet-gradient' />
                </div>
                <div>
                  <h1 className={`${styles.heroHeadText} text-white`}>
                    Welcome to <span className='text-[#915EFF]'>NeuroBase</span>
                  </h1>
                  <p className={`${styles.heroSubText} mt-2 text-white-100`}>
                    AI-powered data analysis dashboard <br className='sm:block hidden' />
                    Query, visualize and gain neural insights
                  </p>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {[
                  { title: 'Active Databases', value: databases.length.toString(), icon: Database, color: 'bg-tertiary' },
                  { title: 'Total Queries', value: result ? '1' : '0', icon: Search, color: 'bg-tertiary' },
                  { title: 'Selected DB', value: selectedDb ? 'Ready' : 'None', icon: Activity, color: 'bg-tertiary' },
                ].map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <motion.div 
                      key={index}
                      className={`p-6 rounded-[20px] ${stat.color} shadow-card`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.5 }}
                      whileHover={{ y: -5 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-secondary text-sm font-medium mb-1">{stat.title}</h3>
                          <p className="text-white text-3xl font-bold">{stat.value}</p>
                        </div>
                        <div className="p-3 bg-[#915EFF]/20 rounded-lg">
                          <IconComponent size={24} className="text-[#915EFF]" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Guidance Button - Upload Database */}
              {databases.length === 0 && (
                <motion.div
                  className="mt-8 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <motion.button
                    className="px-8 py-4 bg-gradient-to-r from-[#915EFF] to-[#7c3aed] text-white rounded-full font-bold text-lg shadow-lg flex items-center gap-3 mx-auto"
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(145, 94, 255, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveSection('databases')}
                  >
                    <Upload size={24} />
                    <span>Start uploading</span>
                  </motion.button>
                  <p className="text-secondary text-sm mt-3">Upload a CSV, XLSX, or XLS file to begin analyzing your data</p>
                </motion.div>
              )}
              
              {/* Guidance Button - Go to Databases (only show if databases exist) */}
              {databases.length > 0 && (
                <motion.div
                  className="mt-8 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <motion.button
                    className="px-8 py-4 bg-gradient-to-r from-[#915EFF] to-[#7c3aed] text-white rounded-full font-bold text-lg shadow-lg flex items-center gap-3 mx-auto"
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(145, 94, 255, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveSection('databases')}
                  >
                    <Database size={24} />
                    <span>Get Started</span>
                  </motion.button>
                  <p className="text-secondary text-sm mt-3">Manage your databases and upload new data files</p>
                </motion.div>
              )}
            </motion.div>
          )}
          
          {/* Database Management Section */}
          {activeSection === 'databases' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-8">
                <h2 className={`${styles.sectionHeadText} text-white mb-4`}>Database Management</h2>
                <p className={`${styles.sectionSubText} text-secondary`}>
                  Upload, manage and organize your data sources
                </p>
              </div>
              
              <div className="bg-tertiary p-6 rounded-[20px] shadow-card">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Your Databases</h3>
                  
                  <label className="cursor-pointer">
                    <input 
                      type="file" 
                      accept=".csv,.xlsx,.xls" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          addNotification({
                            type: 'info',
                            title: 'Uploading Database',
                            message: `Uploading ${file.name}...`,
                          });
                          
                          uploadFile(file)
                            .then(result => {
                              addNotification({
                                type: 'success',
                                title: 'Upload Successful',
                                message: `${file.name} has been uploaded successfully.`,
                              });
                            })
                            .catch(error => {
                              addNotification({
                                type: 'error',
                                title: 'Upload Failed',
                                message: error.message,
                              });
                            });
                        }
                      }}
                    />
                    <motion.div 
                      className="px-4 py-2 bg-[#915EFF] text-white rounded-lg flex items-center gap-2 text-sm font-medium"
                      whileHover={{ scale: 1.05, backgroundColor: '#7c3aed' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Upload size={16} />
                      <span>Upload File</span>
                    </motion.div>
                  </label>
                </div>

                <div className="space-y-4 relative">
                  {dbLoading && (
                    <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-t-transparent border-[#915EFF] rounded-full animate-spin mb-2"></div>
                        <p className="text-sm text-secondary">Processing...</p>
                      </div>
                    </div>
                  )}
                  {databases.length > 0 ? (
                    databases.map((db, index) => (
                      <motion.div 
                        key={db.id} 
                        className={`p-4 rounded-lg border-2 flex justify-between items-center cursor-pointer transition-all duration-200 ${
                          selectedDb === db.id 
                            ? 'bg-[#915EFF]/10 border-[#915EFF]' 
                            : 'bg-primary border-secondary/20 hover:border-secondary/40'
                        }`}
                        onClick={() => setSelectedDb(db.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div>
                          <h3 className="text-white font-medium">{db.name}</h3>
                          <p className="text-secondary text-sm">{db.file_size || 'Unknown size'} • {db.row_count || '?'} rows</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            active
                          </div>
                          <motion.button
                            className="p-1 text-secondary hover:text-red-400 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDatabase(db.id)
                                .then(() => {
                                  addNotification({
                                    type: 'success',
                                    title: 'Database Deleted',
                                    message: `${db.name} has been deleted successfully.`,
                                  });
                                })
                                .catch((error) => {
                                  addNotification({
                                    type: 'error',
                                    title: 'Delete Failed',
                                    message: error.message,
                                  });
                                });
                            }}
                            disabled={dbLoading}
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-secondary">
                      <FileText size={48} className="mx-auto mb-4 text-secondary/50" />
                      <p>No databases available. Upload a CSV, XLSX, or XLS file to get started.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Guidance Button - Go to Query */}
              {databases.length > 0 && (
                <motion.div
                  className="mt-8 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <motion.button
                    className="px-8 py-4 bg-gradient-to-r from-[#915EFF] to-[#7c3aed] text-white rounded-full font-bold text-lg shadow-lg flex items-center gap-3 mx-auto"
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(145, 94, 255, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveSection('query')}
                  >
                    <Brain size={24} />
                    <span>Next Step - Query Your Data</span>
                  </motion.button>
                  <p className="text-secondary text-sm mt-3">Ask questions about your data using natural language</p>
                </motion.div>
              )}
            </motion.div>
          )}
          
          {/* Query Section */}
          {activeSection === 'query' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-8">
                <h2 className={`${styles.sectionHeadText} text-white mb-4`}>AI Query Interface</h2>
                <p className={`${styles.sectionSubText} text-secondary`}>
                  Ask questions about your data in natural language
                </p>
              </div>
              
              <div className="bg-tertiary p-6 rounded-[20px] shadow-card">
                <div className="mb-4">
                  <div className="relative">
                    <textarea 
                      className="w-full h-32 p-4 rounded-lg bg-primary border border-secondary/20 text-white placeholder-secondary focus:outline-none focus:ring-2 focus:ring-[#915EFF] focus:border-[#915EFF]"
                      placeholder={selectedDb ? "Ask a question about your data..." : "Select a database first..."}
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      disabled={!selectedDb || queryLoading}
                    />
                    {queryLoading && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-[#915EFF]/20 rounded-md text-xs text-[#915EFF] flex items-center gap-1">
                        <div className="w-3 h-3 border border-t-transparent border-[#915EFF] rounded-full animate-spin"></div>
                        <span>Processing</span>
                      </div>
                    )}
                  </div>
                </div>
                <motion.button 
                  className={`w-full py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-bold ${
                    !selectedDb 
                      ? 'bg-secondary/20 text-secondary cursor-not-allowed' 
                      : queryLoading 
                        ? 'bg-[#915EFF]/50 text-white' 
                        : 'bg-[#915EFF] text-white hover:bg-[#7c3aed]'
                  }`}
                  whileHover={!queryLoading && selectedDb ? { scale: 1.02 } : {}}
                  whileTap={!queryLoading && selectedDb ? { scale: 0.98 } : {}}
                  disabled={queryLoading || !selectedDb}
                  onClick={handleQuery}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Brain size={18} />
                      <span>Generate Answer</span>
                    </>
                  )}
                </motion.button>
                
                {/* Query Results */}
                {result && (
                  <motion.div
                    className="mt-6 p-4 rounded-lg bg-primary border border-secondary/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-white font-medium mb-2">Results</h3>
                    
                    {result.warning && (
                      <div className="mb-3 p-2 bg-yellow-500/20 text-yellow-300 text-sm rounded">
                        {result.warning}
                      </div>
                    )}
                    
                    <div className="text-xs text-secondary mb-1">SQL Query:</div>
                    <div className="p-2 bg-black/30 rounded mb-3 font-mono text-xs text-green-300 overflow-x-auto">
                      {result.sql || 'No SQL query available'}
                    </div>
                    
                    {result.data && result.data.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-white/90">
                          <thead>
                            <tr className="bg-[#915EFF]/20">
                              {result.columns && result.columns.map((col, i) => (
                                <th key={i} className="p-2 text-left font-medium">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.data.map((row, i) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-secondary/10' : ''}>
                                {Object.values(row).map((cell, j) => (
                                  <td key={j} className="p-2">{cell !== null ? String(cell) : 'NULL'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-secondary text-center py-4">
                        No data returned for this query.
                      </div>
                    )}
                    
                    <div className="mt-3 text-xs text-secondary">
                      {result.row_count} rows • Query executed at {new Date().toLocaleTimeString()}
                    </div>
                  </motion.div>
                )}
                
                {/* Guidance Button - Go to Visualization */}
                {result && result.data && result.data.length > 0 && (
                  <motion.div
                    className="mt-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <motion.button
                      className="px-8 py-4 bg-gradient-to-r from-[#915EFF] to-[#7c3aed] text-white rounded-full font-bold text-lg shadow-lg flex items-center gap-3 mx-auto"
                      whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(145, 94, 255, 0.4)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveSection('visualize')}
                    >
                      <BarChart3 size={24} />
                      <span>Final Step - Visualize Your Results</span>
                    </motion.button>
                    <p className="text-secondary text-sm mt-3">Create interactive charts and graphs from your query results</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Visualization Section */}
          {activeSection === 'visualize' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-8">
                <h2 className={`${styles.sectionHeadText} text-white mb-4`}>Data Visualization</h2>
                <p className={`${styles.sectionSubText} text-secondary`}>
                  Interactive charts and graphs from your query results
                </p>
              </div>
              
              <div className="bg-tertiary p-6 rounded-[20px] shadow-card">
                {result && result.data && result.data.length > 0 ? (
                  <ChartContainer 
                    data={result.data} 
                    columns={result.columns}
                    question={queryInput}
                  />
                ) : (
                  <div className="p-8 text-center text-secondary">
                    <BarChart3 size={48} className="mx-auto mb-4 text-secondary/50" />
                    <p>Run a query first to see visualizations of your data.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProfessionalDashboard;
