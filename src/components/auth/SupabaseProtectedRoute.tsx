import React from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import AuthPage from '@/pages/Auth';
import { Loader2 } from 'lucide-react';

interface SupabaseProtectedRouteProps {
  children: React.ReactNode;
}

const SupabaseProtectedRoute = ({ children }: SupabaseProtectedRouteProps) => {
  const { user, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <>{children}</>;
};

export default SupabaseProtectedRoute;