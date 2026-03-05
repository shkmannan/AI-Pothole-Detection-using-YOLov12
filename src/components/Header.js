import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ViewModeToggle from './ViewModeToggle';
import DarkModeToggle from './DarkModeToggle';
import { useApp } from '../context/AppContext';

const Header = () => {
  const location = useLocation();
  const { viewMode } = useApp();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">PotholeAI</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Smart City Infrastructure</p>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* View Mode Toggle */}
            <ViewModeToggle />

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              {viewMode === 'citizen' ? (
                <>
                  <Link
                    to="/"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/')
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/detect"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/detect')
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    Detection
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/dashboard')
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/map"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/map')
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    Map View
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;