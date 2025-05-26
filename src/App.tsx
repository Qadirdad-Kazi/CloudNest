import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FileProvider } from './context/FileContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  // Determine which view to show based on the URL
  const path = window.location.pathname;
  if (path === '/admin' && user?.role === 'admin') {
    return <Admin />;
  }
  
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <FileProvider>
        <AppContent />
      </FileProvider>
    </AuthProvider>
  );
}

export default App;