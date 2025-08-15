import { DashboardAprimorado } from './DashboardAprimorado';
import DashboardFinanceiro from './DashboardFinanceiro';
import { NoticiasContabeis } from './NoticiasContabeis';
import { AreaTarefas } from './AreaTarefas';

export function NovaHomePage() {
  return (
    <div className="p-6 space-y-8">
      {/* Dashboard Financeiro - Dados Reais */}
      <div className="w-full">
        <DashboardFinanceiro />
      </div>

      {/* Layout Principal - NFSe, Notícias e Tarefas */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

        {/* Dashboard NFSe - 40% da largura (4/10 colunas) */}
        <div className="lg:col-span-4 order-1">
          <div className="sticky top-6">
            <DashboardAprimorado />
          </div>
        </div>

        {/* Sistema de Notícias - 30% da largura (3/10 colunas) */}
        <div className="lg:col-span-3 order-2">
          <div className="sticky top-6">
            <NoticiasContabeis />
          </div>
        </div>

        {/* Área de Tarefas - 30% da largura (3/10 colunas) */}
        <div className="lg:col-span-3 order-3">
          <div className="sticky top-6">
            <AreaTarefas />
          </div>
        </div>

      </div>

      {/* Seção Adicional para Mobile - Cards de Resumo */}
      <div className="lg:hidden mt-8">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary/5 rounded-lg p-3 text-center">
            <h3 className="font-semibold text-primary text-sm">Financeiro</h3>
            <p className="text-xs text-muted-foreground">Dados Reais</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <h3 className="font-semibold text-blue-700 text-sm">NFSe</h3>
            <p className="text-xs text-muted-foreground">Dados Reais</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <h3 className="font-semibold text-green-700 text-sm">Tarefas</h3>
            <p className="text-xs text-muted-foreground">Sistema</p>
          </div>
        </div>
      </div>

      {/* Footer com informações úteis */}
      <div className="mt-12 pt-8 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Atalhos Rápidos</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Emitir NFSe</p>
              <p>• Consultar Notas</p>
              <p>• Gerenciar Empresas</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Suporte</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Documentação</p>
              <p>• FAQ</p>
              <p>• Contato</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Sistema</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Versão 2.1 - Dados Reais</p>
              <p>• Dashboard Atualizado</p>
              <p>• Status: Online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
