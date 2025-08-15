import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  DollarSign, 
  Building2, 
  CalendarDays,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DashboardStats {
  totalNFSe: number;
  valorTotalFaturado: number;
  empresasCadastradas: number;
  nfseMesAtual: number;
  valorMesAtual: number;
  crescimentoMensal: number;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  evolucaoMensal: Array<{ mes: string; nfse: number; valor: number }>;
  faturamentoPorMes: Array<{ mes: string; valor: number }>;
}

export function DashboardAprimorado() {
  const [stats, setStats] = useState<DashboardStats>({
    totalNFSe: 0,
    valorTotalFaturado: 0,
    empresasCadastradas: 0,
    nfseMesAtual: 0,
    valorMesAtual: 0,
    crescimentoMensal: 0,
    statusDistribution: [],
    evolucaoMensal: [],
    faturamentoPorMes: []
  });
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('6meses');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [periodo]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando dados reais do dashboard...');

      // Buscar dados reais das tabelas corretas
      const [nfseResult, invoicesResult, companiesResult, financeAccountsResult, financeTransactionsResult, categoriesResult] = await Promise.all([
        supabase.from('nfse_emitidas').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('companies').select('*'),
        supabase.from('finance_accounts').select('*'),
        supabase.from('finance_transactions').select('*'),
        supabase.from('categories').select('*')
      ]);

      console.log('📊 Dados encontrados:', {
        nfse: nfseResult.data?.length || 0,
        invoices: invoicesResult.data?.length || 0,
        companies: companiesResult.data?.length || 0,
        accounts: financeAccountsResult.data?.length || 0,
        transactions: financeTransactionsResult.data?.length || 0,
        categories: categoriesResult.data?.length || 0
      });

      // Processar dados reais
      const realStats = await processRealData({
        nfse: nfseResult.data || [],
        invoices: invoicesResult.data || [],
        companies: companiesResult.data || [],
        accounts: financeAccountsResult.data || [],
        transactions: financeTransactionsResult.data || [],
        categories: categoriesResult.data || []
      });

      setStats(realStats);
    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
      // Em caso de erro, mostrar dados zerados em vez de simulados
      setStats(getEmptyData());
    } finally {
      setLoading(false);
    }
  };

  const getEmptyData = (): DashboardStats => {
    return {
      totalNFSe: 0,
      valorTotalFaturado: 0,
      empresasCadastradas: 0,
      nfseMesAtual: 0,
      valorMesAtual: 0,
      crescimentoMensal: 0,
      statusDistribution: [],
      evolucaoMensal: [],
      faturamentoPorMes: []
    };
  };

  const processRealData = async (data: {
    nfse: any[];
    invoices: any[];
    companies: any[];
    accounts: any[];
    transactions: any[];
    categories: any[];
  }): Promise<DashboardStats> => {
    console.log('📊 Processando dados reais do sistema...');

    const { nfse, invoices, companies, accounts, transactions } = data;

    // === DADOS DE NFSe ===
    const totalNFSe = nfse.length + invoices.length;
    const empresasCadastradas = companies.length;

    // Calcular valor total faturado (NFSe + Invoices)
    const valorTotalNFSe = nfse.reduce((acc, nota) => {
      const valor = parseFloat(nota.servico_valor_servicos || nota.valor_liquido_nfse || 0);
      return acc + valor;
    }, 0);

    const valorTotalInvoices = invoices.reduce((acc, invoice) => {
      const valor = parseFloat(invoice.valor_total || 0);
      return acc + valor;
    }, 0);

    const valorTotalFaturado = valorTotalNFSe + valorTotalInvoices;

    // === DADOS DO MÊS ATUAL ===
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();

    const nfseMesAtual = nfse.filter(nota => {
      if (!nota.data_emissao) return false;
      const dataEmissao = new Date(nota.data_emissao);
      return dataEmissao.getMonth() === mesAtual && dataEmissao.getFullYear() === anoAtual;
    });

    const invoicesMesAtual = invoices.filter(invoice => {
      if (!invoice.data_emissao) return false;
      const dataEmissao = new Date(invoice.data_emissao);
      return dataEmissao.getMonth() === mesAtual && dataEmissao.getFullYear() === anoAtual;
    });

    const nfseMesAtualCount = nfseMesAtual.length + invoicesMesAtual.length;

    const valorMesAtualNFSe = nfseMesAtual.reduce((acc, nota) => {
      const valor = parseFloat(nota.servico_valor_servicos || nota.valor_liquido_nfse || 0);
      return acc + valor;
    }, 0);

    const valorMesAtualInvoices = invoicesMesAtual.reduce((acc, invoice) => {
      const valor = parseFloat(invoice.valor_total || 0);
      return acc + valor;
    }, 0);

    const valorMesAtual = valorMesAtualNFSe + valorMesAtualInvoices;

    // === CRESCIMENTO MENSAL ===
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

    const nfseMesAnterior = nfse.filter(nota => {
      if (!nota.data_emissao) return false;
      const dataEmissao = new Date(nota.data_emissao);
      return dataEmissao.getMonth() === mesAnterior && dataEmissao.getFullYear() === anoMesAnterior;
    });

    const invoicesMesAnterior = invoices.filter(invoice => {
      if (!invoice.data_emissao) return false;
      const dataEmissao = new Date(invoice.data_emissao);
      return dataEmissao.getMonth() === mesAnterior && dataEmissao.getFullYear() === anoMesAnterior;
    });

    const valorMesAnteriorNFSe = nfseMesAnterior.reduce((acc, nota) => {
      const valor = parseFloat(nota.servico_valor_servicos || nota.valor_liquido_nfse || 0);
      return acc + valor;
    }, 0);

    const valorMesAnteriorInvoices = invoicesMesAnterior.reduce((acc, invoice) => {
      const valor = parseFloat(invoice.valor_total || 0);
      return acc + valor;
    }, 0);

    const valorMesAnterior = valorMesAnteriorNFSe + valorMesAnteriorInvoices;

    const crescimentoMensal = valorMesAnterior > 0
      ? ((valorMesAtual - valorMesAnterior) / valorMesAnterior) * 100
      : 0;

    // === DISTRIBUIÇÃO POR STATUS ===
    const statusCount: Record<string, number> = {};

    // Contar status das NFSe
    nfse.forEach(nota => {
      const status = nota.status_processamento || nota.rps_status || 'emitida';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    // Contar status dos Invoices
    invoices.forEach(invoice => {
      const status = invoice.status || 'emitida';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const statusDistribution = Object.entries(statusCount).map(([status, count]) => ({
      name: status === 'emitida' || status === 'autorizada' ? 'Emitidas' :
            status === 'cancelada' ? 'Canceladas' :
            status === 'pendente' || status === 'processando' ? 'Pendentes' :
            status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: status === 'emitida' || status === 'autorizada' ? '#10b981' :
             status === 'cancelada' ? '#ef4444' :
             status === 'pendente' || status === 'processando' ? '#f59e0b' : '#6b7280'
    }));

    // === EVOLUÇÃO MENSAL (últimos 6 meses) ===
    const evolucaoMensal = [];
    const faturamentoPorMes = [];

    for (let i = 5; i >= 0; i--) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const mes = data.getMonth();
      const ano = data.getFullYear();

      const nfsesMes = nfse.filter(nota => {
        if (!nota.data_emissao) return false;
        const dataEmissao = new Date(nota.data_emissao);
        return dataEmissao.getMonth() === mes && dataEmissao.getFullYear() === ano;
      });

      const invoicesMes = invoices.filter(invoice => {
        if (!invoice.data_emissao) return false;
        const dataEmissao = new Date(invoice.data_emissao);
        return dataEmissao.getMonth() === mes && dataEmissao.getFullYear() === ano;
      });

      const valorMesNFSe = nfsesMes.reduce((acc, nota) => {
        const valor = parseFloat(nota.servico_valor_servicos || nota.valor_liquido_nfse || 0);
        return acc + valor;
      }, 0);

      const valorMesInvoices = invoicesMes.reduce((acc, invoice) => {
        const valor = parseFloat(invoice.valor_total || 0);
        return acc + valor;
      }, 0);

      const valorMes = valorMesNFSe + valorMesInvoices;
      const quantidadeMes = nfsesMes.length + invoicesMes.length;

      const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      evolucaoMensal.push({
        mes: nomesMeses[mes],
        nfse: quantidadeMes,
        valor: valorMes
      });

      faturamentoPorMes.push({
        mes: nomesMeses[mes],
        valor: valorMes
      });
    }

    console.log('✅ Dados reais processados:', {
      totalNFSe,
      valorTotalFaturado,
      empresasCadastradas,
      nfseMesAtual: nfseMesAtualCount,
      valorMesAtual,
      crescimentoMensal: crescimentoMensal.toFixed(1),
      statusDistribution: statusDistribution.length,
      evolucaoMensal: evolucaoMensal.length
    });

    return {
      totalNFSe,
      valorTotalFaturado,
      empresasCadastradas,
      nfseMesAtual: nfseMesAtualCount,
      valorMesAtual,
      crescimentoMensal: Math.round(crescimentoMensal * 10) / 10,
      statusDistribution,
      evolucaoMensal,
      faturamentoPorMes
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Verificar se há dados para mostrar
  const hasData = stats.totalNFSe > 0 || stats.empresasCadastradas > 0;

  return (
    <div className="space-y-4">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dashboard NFSe
          </h2>
          <p className="text-xs text-muted-foreground">
            {hasData ? 'Dados reais do sistema' : 'Nenhum dado encontrado'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1mes">1 Mês</SelectItem>
              <SelectItem value="3meses">3 Meses</SelectItem>
              <SelectItem value="6meses">6 Meses</SelectItem>
              <SelectItem value="1ano">1 Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total NFSe */}
        <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-3">
            <div className="flex flex-col items-center text-center">
              <FileText className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground">Total NFSe</p>
              <p className="text-lg font-bold text-primary">{formatNumber(stats.totalNFSe)}</p>
              {stats.crescimentoMensal > 0 && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{stats.crescimentoMensal}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Valor Total */}
        <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-3">
            <div className="flex flex-col items-center text-center">
              <DollarSign className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground">Valor Total</p>
              <p className="text-lg font-bold text-success">{formatCurrency(stats.valorTotalFaturado)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Empresas */}
        <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-3">
            <div className="flex flex-col items-center text-center">
              <Building2 className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground">Empresas</p>
              <p className="text-lg font-bold text-primary">{formatNumber(stats.empresasCadastradas)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Este Mês */}
        <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
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

      {/* Mensagem quando não há dados */}
      {!hasData && (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma NFSe encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Para começar a ver dados de NFSe, emita suas primeiras notas fiscais ou cadastre suas empresas.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.href = '/emitir-nfse'} size="sm">
                Emitir NFSe
              </Button>
              <Button onClick={() => window.location.href = '/empresas'} variant="outline" size="sm">
                Cadastrar Empresas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos - Só mostrar se houver dados */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de Evolução Mensal */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Evolução Mensal de NFSe
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ResponsiveContainer width="100%" height={200}>
              <RechartsLineChart data={stats.evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="nfse"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição por Status */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPieChart>
                <Pie
                  data={stats.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Faturamento por Mês */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Faturamento por Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ResponsiveContainer width="100%" height={250}>
              <RechartsBarChart data={stats.faturamentoPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                />
                <Bar
                  dataKey="valor"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
}
