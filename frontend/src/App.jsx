import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentPath === '/login' || currentPath === '/') {
    return <Login onLoginSuccess={() => setCurrentPath('/dashboard')} />;
  }

  if (currentPath === '/dashboard/transactions') {
    return <Transactions />;
  }

  return <Dashboard />;
}
