
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import { ReactQueryProvider } from './integrations/react-query/client';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationAuthProvider } from '@/contexts/OrganizationAuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import Labels from './pages/Labels';
import Auth from './pages/Auth';
import Index from './pages/Index';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GlobalDiagnostics from './components/diagnostics/GlobalDiagnostics';

function App() {
  return (
    <BrowserRouter>
      <ReactQueryProvider>
        <AuthProvider>
          <OrganizationAuthProvider>
            <OrganizationProvider>
              <GlobalDiagnostics />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/products" element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                } />
                <Route path="/customers" element={
                  <ProtectedRoute>
                    <Customers />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/labels" element={
                  <ProtectedRoute>
                    <Labels />
                  </ProtectedRoute>
                } />
              </Routes>
            </OrganizationProvider>
          </OrganizationAuthProvider>
        </AuthProvider>
      </ReactQueryProvider>
    </BrowserRouter>
  );
}

export default App;
