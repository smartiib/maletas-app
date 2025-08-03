import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import POS from "./pages/POS";
import Reports from "./pages/Reports";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Maletas from "./pages/Maletas";
import PdfTemplates from "./pages/PdfTemplates";
import Suppliers from "./pages/Suppliers";
import Financeiro from "./pages/Financeiro";
import Auth from "./pages/Auth";
import { useAuth } from "./hooks/useAuth";
import { Loader2 } from "lucide-react";

import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public route for authentication */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/clientes" element={<Customers />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/maletas" element={<Maletas />} />
              <Route path="/fornecedores" element={<Suppliers />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/templates-pdf" element={<PdfTemplates />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/configuracoes" element={<Settings />} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
