
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationAuthProvider } from '@/contexts/OrganizationAuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import ConfigGuard from '@/components/auth/ConfigGuard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Import pages with default exports
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Orders from '@/pages/Orders';
import Customers from '@/pages/Customers';
import POS from '@/pages/POS';
import Maletas from '@/pages/Maletas';
import Financeiro from '@/pages/Financeiro';
import Suppliers from '@/pages/Suppliers';
import Reports from '@/pages/Reports';
import Organizations from '@/pages/Organizations';
import Billing from '@/pages/Billing';
import Settings from '@/pages/Settings';
import Logs from '@/pages/Logs';
import PdfTemplates from '@/pages/PdfTemplates';
import Stock from '@/pages/Stock';
import Labels from '@/pages/Labels';
import NotFound from '@/pages/NotFound';
import DashboardLayout from '@/components/layout/DashboardLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationAuthProvider>
          <OrganizationProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Protected routes that need authentication but not necessarily config guard */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardLayout><Dashboard /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/products" element={
                    <ProtectedRoute>
                      <DashboardLayout><Products /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/orders" element={
                    <ProtectedRoute>
                      <DashboardLayout><Orders /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/customers" element={
                    <ProtectedRoute>
                      <DashboardLayout><Customers /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/pos" element={
                    <ProtectedRoute>
                      <DashboardLayout><POS /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/maletas" element={
                    <ProtectedRoute>
                      <DashboardLayout><Maletas /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/financeiro" element={
                    <ProtectedRoute>
                      <DashboardLayout><Financeiro /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/suppliers" element={
                    <ProtectedRoute>
                      <DashboardLayout><Suppliers /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <ProtectedRoute>
                      <DashboardLayout><Reports /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/stock" element={
                    <ProtectedRoute>
                      <DashboardLayout><Stock /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/labels" element={
                    <ProtectedRoute>
                      <DashboardLayout><Labels /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Config-protected routes (only super admin) */}
                  <Route path="/organizations" element={
                    <ConfigGuard>
                      <DashboardLayout><Organizations /></DashboardLayout>
                    </ConfigGuard>
                  } />
                  <Route path="/billing" element={
                    <ConfigGuard>
                      <DashboardLayout><Billing /></DashboardLayout>
                    </ConfigGuard>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <DashboardLayout><Settings /></DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/logs" element={
                    <ConfigGuard>
                      <DashboardLayout><Logs /></DashboardLayout>
                    </ConfigGuard>
                  } />
                  <Route path="/pdf-templates" element={
                    <ConfigGuard>
                      <DashboardLayout><PdfTemplates /></DashboardLayout>
                    </ConfigGuard>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </OrganizationProvider>
        </OrganizationAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
