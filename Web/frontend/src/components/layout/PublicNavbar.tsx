import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PublicNavbar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClasses = (path: string) =>
    location.pathname === path
      ? 'text-indigo-600 dark:text-indigo-400'
      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400';

  return (
    <nav className="bg-white dark:bg-gray-900 shadow sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              CloudNest
            </Link>
            <div className="hidden md:flex md:space-x-8 ml-10">
              <Link to="/" className={`text-sm font-medium ${linkClasses('/')}`}>Home</Link>
              <Link to="/about" className={`text-sm font-medium ${linkClasses('/about')}`}>About</Link>
              <Link to="/contact" className={`text-sm font-medium ${linkClasses('/contact')}`}>Contact</Link>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center">
            {user ? (
              <Link
                to="/dashboard"
                className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-3 space-y-1 px-2 pt-2">
          <Link to="/" onClick={() => setMobileOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${linkClasses('/')}`}>Home</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${linkClasses('/about')}`}>About</Link>
          <Link to="/contact" onClick={() => setMobileOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${linkClasses('/contact')}`}>Contact</Link>
          {user ? (
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 dark:text-indigo-400">Dashboard</Link>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 dark:text-indigo-400">Login</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default PublicNavbar;
