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
import ConsultarNotasGeral from "./pages/ConsultarNotasGeral";
import EmitirNFe from "./pages/EmitirNFe";
import EmitirNFSe from "./pages/EmitirNFSe";

import CancelarInutilizar from "./pages/CancelarInutilizar";
import Relatorios from "./pages/Relatorios";
import EmpresasFocus from "./pages/EmpresasFocus";
import NotFound from "./pages/NotFound";
import Tarefas from "./pages/Tarefas";
import FluxoDeCaixaModerno from "./pages/FluxoDeCaixaModerno";
import Recebimentos from "./pages/Recebimentos";
import RelatoriosFinanceiros from "./pages/RelatoriosFinanceiros";
import ContasPagar from "./pages/ContasPagar";
import ConciliacaoBancaria from "./pages/ConciliacaoBancaria";
import ImpostoRenda from "./pages/ImpostoRenda";
import Configuracoes from "./pages/Configuracoes";

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
              <ProtectedRoute pageKey="dashboard">
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/notas" element={
              <ProtectedRoute pageKey="notas_consultar">
                <ConsultarNFSeSimples />
              </ProtectedRoute>
            } />
            <Route path="/notas/consultar" element={
              <ProtectedRoute pageKey="notas_consultar">
                <ConsultarNotasGeral />
              </ProtectedRoute>
            } />
            <Route path="/notas/nfe" element={
              <ProtectedRoute pageKey="notas_nfe" requiredPermission="edit">
                <EmitirNFe />
              </ProtectedRoute>
            } />
            <Route path="/notas/nfse" element={
              <ProtectedRoute pageKey="notas_nfse" requiredPermission="edit">
                <EmitirNFSe />
              </ProtectedRoute>
            } />

            <Route path="/notas/cancelar" element={
              <ProtectedRoute pageKey="notas_cancelar" requiredPermission="edit">
                <CancelarInutilizar />
              </ProtectedRoute>
            } />
            <Route path="/notas/empresas" element={
              <ProtectedRoute pageKey="notas_empresas">
                <EmpresasFocus />
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute pageKey="relatorios">
                <Relatorios />
              </ProtectedRoute>
            } />
            <Route path="/tarefas" element={
              <ProtectedRoute pageKey="tarefas">
                <Tarefas />
              </ProtectedRoute>
            } />
            <Route path="/financeiro/fluxo-caixa" element={
              <ProtectedRoute pageKey="financeiro_fluxo_caixa">
                <FluxoDeCaixaModerno />
              </ProtectedRoute>
            } />
            <Route path="/financeiro/recebimentos" element={
              <ProtectedRoute pageKey="financeiro_recebimentos">
                <Recebimentos />
              </ProtectedRoute>
            } />
            <Route path="/financeiro/relatorios" element={
              <ProtectedRoute pageKey="financeiro_relatorios">
                <RelatoriosFinanceiros />
              </ProtectedRoute>
            } />
            <Route path="/financeiro/contas-pagar" element={
              <ProtectedRoute pageKey="financeiro_contas_pagar">
                <ContasPagar />
              </ProtectedRoute>
            } />
            <Route path="/financeiro/conciliacao" element={
              <ProtectedRoute pageKey="financeiro_conciliacao">
                <ConciliacaoBancaria />
              </ProtectedRoute>
            } />
            <Route path="/imposto-renda" element={
              <ProtectedRoute pageKey="imposto_renda">
                <ImpostoRenda />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute pageKey="configuracoes">
                <Configuracoes />
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






