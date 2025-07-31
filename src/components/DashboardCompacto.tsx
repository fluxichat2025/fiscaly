import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Building2, 
  DollarSign,
  CalendarDays,
  TrendingUp,
  BarChart3,
  Loader2
} from 'lucide-react';

interface DashboardStats {
  totalNFSe: number;
  valorTotalFaturado: number;
  empresasCadastradas: number;
  nfseMesAtual: number;
  valorMesAtual: number;
  tarefasPendentes: number;
  noticiasNaoLidas: number;
}

export function DashboardCompacto() {
  const [stats, setStats] = useState<DashboardStats>({
    totalNFSe: 0,
    valorTotalFaturado: 0,
    empresasCadastradas: 0,
    nfseMesAtual: 0,
    valorMesAtual: 0,
    tarefasPendentes: 0,
    noticiasNaoLidas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Buscar NFSe (usando tabela notas_fiscais)
      const { data: nfseData, error: nfseError } = await supabase
        .from('notas_fiscais')
        .select('valor_servicos, data_emissao, status');

      if (nfseError) throw nfseError;

      // Buscar empresas
      const { count: empresasCount, error: empresasError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      if (empresasError) throw empresasError;

      // Buscar tarefas pendentes (se a tabela existir)
      let tarefasPendentes = 0;
      try {
        const { count: tarefasCount } = await supabase
          .from('tarefas')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pendente', 'em_andamento']);
        tarefasPendentes = tarefasCount || 0;
      } catch (error) {
        // Tabela ainda não existe, ignorar erro
        console.log('Tabela tarefas ainda não existe');
      }

      // Buscar notícias não lidas (se a tabela existir)
      let noticiasNaoLidas = 0;
      try {
        const { count: noticiasCount } = await supabase
          .from('noticias_contabeis')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ativo')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Últimos 7 dias
        noticiasNaoLidas = noticiasCount || 0;
      } catch (error) {
        // Tabela ainda não existe, ignorar erro
        console.log('Tabela noticias_contabeis ainda não existe');
      }

      // Calcular estatísticas
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const valorTotalFaturado = nfseData?.reduce((sum, nfse) => sum + Number(nfse.valor_servicos || 0), 0) || 0;
      
      const nfseMesAtual = nfseData?.filter(nfse => {
        const nfseDate = new Date(nfse.data_emissao);
        return nfseDate.getMonth() === currentMonth && nfseDate.getFullYear() === currentYear;
      }) || [];
      
      const valorMesAtual = nfseMesAtual.reduce((sum, nfse) => sum + Number(nfse.valor_servicos || 0), 0);

      setStats({
        totalNFSe: nfseData?.length || 0,
        valorTotalFaturado,
        empresasCadastradas: empresasCount || 0,
        nfseMesAtual: nfseMesAtual.length,
        valorMesAtual,
        tarefasPendentes,
        noticiasNaoLidas,
      });
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-2">
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Visão geral das atividades
        </p>
      </div>

      {/* Stats Cards - Grid Horizontal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total NFSe */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex flex-col items-center text-center">
              <FileText className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground">Total NFSe</p>
              <p className="text-lg font-bold text-primary">{formatNumber(stats.totalNFSe)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Valor Total */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex flex-col items-center text-center">
              <DollarSign className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground">Valor Total</p>
              <p className="text-lg font-bold text-success">{formatCurrency(stats.valorTotalFaturado)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Empresas */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex flex-col items-center text-center">
              <Building2 className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground">Empresas</p>
              <p className="text-lg font-bold text-primary">{formatNumber(stats.empresasCadastradas)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Este Mês */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <div className="flex flex-col items-center text-center">
              <CalendarDays className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground">Este Mês</p>
              <p className="text-lg font-bold text-primary">{formatNumber(stats.nfseMesAtual)}</p>
              <p className="text-xs text-success">{formatCurrency(stats.valorMesAtual)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Adicional */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumo Rápido
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tarefas Pendentes</span>
              <Badge variant={stats.tarefasPendentes > 0 ? "destructive" : "secondary"}>
                {stats.tarefasPendentes}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Notícias Recentes</span>
              <Badge variant={stats.noticiasNaoLidas > 0 ? "default" : "secondary"}>
                {stats.noticiasNaoLidas}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Média por NFSe</span>
              <span className="font-medium">
                {stats.totalNFSe > 0 ? formatCurrency(stats.valorTotalFaturado / stats.totalNFSe) : 'R$ 0,00'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
