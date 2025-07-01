import React from 'react';
import { AuthContext, useSupabaseAuthState } from '@/hooks/useSupabaseAuth';

interface SupabaseAuthProviderProps {
  children: React.ReactNode;
}

const SupabaseAuthProvider = ({ children }: SupabaseAuthProviderProps) => {
  const authState = useSupabaseAuthState();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export default SupabaseAuthProvider;