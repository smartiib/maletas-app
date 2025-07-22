import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Stock from "./pages/Stock";
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

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/estoque" element={<Stock />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/clientes" element={<Customers />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/maletas" element={<Maletas />} />
              <Route path="/fornecedores" element={<Suppliers />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/templates-pdf" element={<PdfTemplates />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/configuracoes" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
