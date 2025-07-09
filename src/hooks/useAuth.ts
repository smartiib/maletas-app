import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const userAuth = localStorage.getItem('user_authenticated');
      setIsAuthenticated(userAuth === 'true');
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = () => {
    localStorage.setItem('user_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('user_authenticated');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};