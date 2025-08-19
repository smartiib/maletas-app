import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

// This hook now simply consumes the centralized AuthContext.
// The public API remains the same across the app.
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
};
