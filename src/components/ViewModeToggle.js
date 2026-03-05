import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

const ViewModeToggle = () => {
  const { viewMode, setViewMode } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleToggle = (mode) => {
    setViewMode(mode);
    
    // Auto-navigate based on mode
    if (mode === 'municipality') {
      navigate('/dashboard');
    } else if (location.pathname === '/dashboard') {
      navigate('/');
    }
  };

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => handleToggle('citizen')}
        className="relative px-4 py-2 text-sm font-medium rounded-md transition-colors"
      >
        {viewMode === 'citizen' && (
          <motion.div
            layoutId="viewModeBackground"
            className="absolute inset-0 bg-white rounded-md shadow-sm"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className={`relative z-10 ${viewMode === 'citizen' ? 'text-gray-900' : 'text-gray-600'}`}>
          <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Citizen View
        </span>
      </button>

      <button
        onClick={() => handleToggle('municipality')}
        className="relative px-4 py-2 text-sm font-medium rounded-md transition-colors"
      >
        {viewMode === 'municipality' && (
          <motion.div
            layoutId="viewModeBackground"
            className="absolute inset-0 bg-white rounded-md shadow-sm"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className={`relative z-10 ${viewMode === 'municipality' ? 'text-gray-900' : 'text-gray-600'}`}>
          <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Municipality
        </span>
      </button>
    </div>
  );
};

export default ViewModeToggle;
