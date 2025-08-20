
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/contexts/AuthContext';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import ConfigGuard from '@/components/auth/ConfigGuard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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
import NotFound from '@/pages/NotFound';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Stock from './pages/Stock';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Dashboard />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Products />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stock"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Stock />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Orders />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Customers />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pos"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <POS />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/maletas"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Maletas />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/financeiro"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Financeiro />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/suppliers"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Suppliers />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Reports />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizations"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Organizations />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Billing />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Settings />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/logs"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <Logs />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pdf-templates"
                  element={
                    <ProtectedRoute>
                      <ConfigGuard>
                        <DashboardLayout>
                          <PdfTemplates />
                        </DashboardLayout>
                      </ConfigGuard>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
