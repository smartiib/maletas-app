
import { useState, useEffect } from 'react';

export const useMasterAuth = () => {
  const [isMasterAuthenticated, setIsMasterAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMasterAuth = () => {
      const masterAuth = localStorage.getItem('master_auth');
      setIsMasterAuthenticated(masterAuth === 'true');
      setIsLoading(false);
    };

    checkMasterAuth();
  }, []);

  const loginMaster = () => {
    setIsMasterAuthenticated(true);
  };

  const logoutMaster = () => {
    localStorage.removeItem('master_auth');
    setIsMasterAuthenticated(false);
  };

  return {
    isMasterAuthenticated,
    isLoading,
    loginMaster,
    logoutMaster,
  };
};
