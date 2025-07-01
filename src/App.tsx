import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./components/auth/AuthProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";
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
import ConfigGuard from "./components/auth/ConfigGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={
                <ProtectedRoute permission="dashboard">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/produtos" element={
                <ProtectedRoute permission="products">
                  <Products />
                </ProtectedRoute>
              } />
              <Route path="/pedidos" element={
                <ProtectedRoute permission="orders">
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/clientes" element={
                <ProtectedRoute permission="customers">
                  <Customers />
                </ProtectedRoute>
              } />
              <Route path="/pos" element={
                <ProtectedRoute permission="pos">
                  <POS />
                </ProtectedRoute>
              } />
              <Route path="/maletas" element={
                <ProtectedRoute permission="maletas">
                  <Maletas />
                </ProtectedRoute>
              } />
              <Route path="/relatorios" element={
                <ProtectedRoute permission="reports">
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/logs" element={
                <ProtectedRoute permission="logs">
                  <Logs />
                </ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ConfigGuard>
                  <Settings />
                </ConfigGuard>
              } />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
