import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ConsultarNFSeSimples from "./pages/ConsultarNFSeSimples";
import EmitirNFe from "./pages/EmitirNFe";
import EmitirNFSe from "./pages/EmitirNFSe";

import CancelarInutilizar from "./pages/CancelarInutilizar";
import Relatorios from "./pages/Relatorios";
import EmpresasFocus from "./pages/EmpresasFocus";
import NotFound from "./pages/NotFound";
import Tarefas from "./pages/Tarefas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/notas" element={
              <ProtectedRoute>
                <ConsultarNFSeSimples />
              </ProtectedRoute>
            } />
            <Route path="/notas/nfe" element={
              <ProtectedRoute>
                <EmitirNFe />
              </ProtectedRoute>
            } />
            <Route path="/notas/nfse" element={
              <ProtectedRoute>
                <EmitirNFSe />
              </ProtectedRoute>
            } />

            <Route path="/notas/cancelar" element={
              <ProtectedRoute>
                <CancelarInutilizar />
              </ProtectedRoute>
            } />
            <Route path="/notas/empresas" element={
              <ProtectedRoute>
                <EmpresasFocus />
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute>
                <Relatorios />
              </ProtectedRoute>
            } />
            <Route path="/tarefas" element={
              <ProtectedRoute>
                <Tarefas />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;






