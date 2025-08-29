import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient } from '@/integrations/react-query';

import { Auth } from '@/pages/Auth';
import { Index } from '@/pages/Index';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Stock } from '@/pages/Stock';
import { Customers } from '@/pages/Customers';
import { Orders } from '@/pages/Orders';
import { Maletas } from '@/pages/Maletas';
import { Sync } from '@/pages/Sync';
import { POS } from '@/pages/POS';
import { Financeiro } from '@/pages/Financeiro';
import { Suppliers } from '@/pages/Suppliers';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { Organizations } from '@/pages/Organizations';
import { Billing } from '@/pages/Billing';
import { Logs } from '@/pages/Logs';
import { PdfTemplates } from '@/pages/PdfTemplates';
import { NotFound } from '@/pages/NotFound';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { OrganizationProvider } from '@/components/organization/OrganizationProvider';
import { OrganizationAuthProvider } from '@/components/organization/OrganizationAuthProvider';
import Labels from './pages/Labels';

function App() {
  return (
    <QueryClient>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <OrganizationAuthProvider>
            <OrganizationProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/maletas" element={<ProtectedRoute><Maletas /></ProtectedRoute>} />
                <Route path="/sync" element={<ProtectedRoute><Sync /></ProtectedRoute>} />
                <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
                <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
                <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/organizations" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
                <Route path="/pdf-templates" element={<ProtectedRoute><PdfTemplates /></ProtectedRoute>} />
                <Route path="/labels" element={<ProtectedRoute><Labels /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </OrganizationProvider>
          </OrganizationAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClient>
  );
}

export default App;
