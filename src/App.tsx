import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SupabaseAuthProvider from "./components/auth/SupabaseAuthProvider";
import SupabaseProtectedRoute from "./components/auth/SupabaseProtectedRoute";
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
import Billing from "./pages/Billing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SupabaseAuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <SupabaseProtectedRoute>
                <DashboardLayout />
              </SupabaseProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/clientes" element={<Customers />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/maletas" element={<Maletas />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/assinatura" element={<Billing />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SupabaseAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
