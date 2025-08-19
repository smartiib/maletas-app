
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ConfigGuard from "@/components/auth/ConfigGuard";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Customers from "@/pages/Customers";
import Orders from "@/pages/Orders";
import POS from "@/pages/POS";
import Maletas from "@/pages/Maletas";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Suppliers from "@/pages/Suppliers";
import Financeiro from "@/pages/Financeiro";
import Auth from "@/pages/Auth";
import PdfTemplates from "@/pages/PdfTemplates";
import Organizations from "@/pages/Organizations";
import Billing from "@/pages/Billing";
import Logs from "@/pages/Logs";
import NotFound from "@/pages/NotFound";
import "./App.css";
import type { PropsWithChildren, ComponentType } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
// Novos diagnósticos
import GlobalDiagnostics from "@/components/diagnostics/GlobalDiagnostics";
import AppErrorBoundary from "@/components/diagnostics/AppErrorBoundary";

// Wrappers tipados para aceitar children (corrige o TS2559 sem alterar comportamento)
const ConfigGuardWithChildren = ConfigGuard as unknown as ComponentType<PropsWithChildren>;
const DashboardLayoutWithChildren = DashboardLayout as unknown as ComponentType<PropsWithChildren>;

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AppErrorBoundary>
            <AuthProvider>
              <OrganizationProvider>
                {/* Coletor global de logs/erros e telemetria (sem UI) */}
                <GlobalDiagnostics />
                <div className="min-h-screen bg-background">
                  <Toaster />
                  <SonnerToaster />
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route
                      path="/*"
                      element={
                        <ProtectedRoute>
                          <ConfigGuardWithChildren>
                            <DashboardLayoutWithChildren>
                              <Routes>
                                <Route path="/" element={<Index />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/products" element={<Products />} />
                                <Route path="/customers" element={<Customers />} />
                                <Route path="/orders" element={<Orders />} />
                                <Route path="/pos" element={<POS />} />
                                <Route path="/maletas" element={<Maletas />} />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/suppliers" element={<Suppliers />} />
                                <Route path="/financeiro" element={<Financeiro />} />
                                <Route path="/pdf-templates" element={<PdfTemplates />} />
                                <Route path="/organizations" element={<Organizations />} />
                                <Route path="/billing" element={<Billing />} />
                                <Route path="/logs" element={<Logs />} />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </DashboardLayoutWithChildren>
                          </ConfigGuardWithChildren>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </div>
              </OrganizationProvider>
            </AuthProvider>
          </AppErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
