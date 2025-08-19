import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  RefreshCw,
  XCircle,
  AlertTriangle,
  Calendar,
  Target,
  Filter,
  Download,
  Users,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Percent
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
  Legend,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalNFSe: number;
  valorTotalFaturado: number;
  empresasCadastradas: number;
  nfseMesAtual: number;
  valorMesAtual: number;
  crescimentoMensal: number;
  totalCanceladas: number;
  valorCancelado: number;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  evolucaoMensal: Array<{ 
    mes: string; 
    nfse: number; 
    valor: number; 
    meta?: number;
    variacao?: number;
    empresa?: string;
  }>;
  faturamentoPorMes: Array<{ 
    mes: string; 
    valor: number; 
    meta?: number;
    realizado?: number;
  }>;
  empresasTop: Array<{
    nome: string;
    valor: number;
    quantidade: number;
    crescimento: number;
  }>;
}

interface TaskWithPriority {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  status: string;
  assigned_to?: string;
  financial_value?: number;
  urgency_score: number;
  days_until_due?: number;
  responsible?: string;
}

const DashboardMelhorado = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<TaskWithPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  
  // Filtros e controles
  const [periodo, setPeriodo] = useState('6meses');
  const [empresaFiltro, setEmpresaFiltro] = useState('todas');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [metaMensal, setMetaMensal] = useState(10000);
  const [activeTab, setActiveTab] = useState('overview');

  // Função para calcular urgência de tarefas
  const calculateTaskUrgency = (task: any): TaskWithPriority => {
    let urgencyScore = 0;
    let daysUntilDue = null;

    // Calcular dias até vencimento
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Pontuação por vencimento
      if (daysUntilDue < 0) urgencyScore += 100; // Atrasado
      else if (daysUntilDue === 0) urgencyScore += 80; // Vence hoje
      else if (daysUntilDue <= 3) urgencyScore += 60; // Vence em 3 dias
      else if (daysUntilDue <= 7) urgencyScore += 40; // Vence em 1 semana
      else if (daysUntilDue <= 30) urgencyScore += 20; // Vence em 1 mês
    }

    // Pontuação por prioridade
    const priorityScores = { 'baixa': 10, 'media': 25, 'alta': 50, 'urgente': 75 };
    urgencyScore += priorityScores[task.priority] || 10;

    // Pontuação por valor financeiro
    if (task.financial_value) {
      if (task.financial_value > 10000) urgencyScore += 30;
      else if (task.financial_value > 5000) urgencyScore += 20;
      else if (task.financial_value > 1000) urgencyScore += 10;
    }

    // Determinar prioridade automática baseada na urgência
    let autoPriority: 'baixa' | 'media' | 'alta' | 'urgente' = 'baixa';
    if (urgencyScore >= 100) autoPriority = 'urgente';
    else if (urgencyScore >= 70) autoPriority = 'alta';
    else if (urgencyScore >= 40) autoPriority = 'media';

    return {
      ...task,
      urgency_score: urgencyScore,
      days_until_due: daysUntilDue,
      priority: autoPriority,
      responsible: task.assigned_to || 'Não atribuído'
    };
  };

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    } else {
      return `R$ ${value.toFixed(2)}`;
    }
  };

  // Função para formatar eixo Y dos gráficos
  const formatYAxis = (value: number) => {
    if (value === 0) return 'R$ 0';
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    } else {
      return `R$ ${value.toFixed(0)}`;
    }
  };

  // Função para calcular domínio do eixo Y
  const calculateYAxisDomain = (data: any[], key: string) => {
    const values = data.map(item => item[key] || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    
    if (maxValue === 0) return [0, 100];
    
    const padding = maxValue * 0.1;
    return [Math.max(0, minValue - padding), maxValue + padding];
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando dados do dashboard melhorado...');

      // Buscar NFSe emitidas
      const { data: nfse, error: nfseError } = await supabase
        .from('nfse_emitidas')
        .select('*');

      if (nfseError) {
        console.error('❌ Erro ao buscar NFSe:', nfseError);
        throw nfseError;
      }

      // Buscar empresas
      const { data: empresas, error: empresasError } = await supabase
        .from('companies')
        .select('*');

      if (empresasError) {
        console.error('❌ Erro ao buscar empresas:', empresasError);
        throw empresasError;
      }

      // Buscar tarefas
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .limit(20);

      if (tasksError) {
        console.error('❌ Erro ao buscar tarefas:', tasksError);
      }

      console.log('📊 Dados carregados:', {
        nfse: nfse?.length || 0,
        empresas: empresas?.length || 0,
        tasks: tasksData?.length || 0
      });

      // Processar dados
      const processedStats = await processarDadosDashboard(nfse || [], empresas || []);
      const processedTasks = (tasksData || []).map(calculateTaskUrgency);

      setStats(processedStats);
      setTasks(processedTasks.sort((a, b) => b.urgency_score - a.urgency_score));
      setHasData((nfse?.length || 0) > 0 || (empresas?.length || 0) > 0);

    } catch (error: any) {
      console.error('❌ Erro ao carregar dashboard:', error);
      toast({
        title: 'Erro ao carregar dashboard',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const processarDadosDashboard = async (nfse: any[], empresas: any[]): Promise<DashboardStats> => {
    // Calcular estatísticas básicas
    const totalNFSe = nfse.length;
    const valorTotalFaturado = nfse.reduce((acc, nota) => {
      const valor = parseFloat(nota.valor_liquido_nfse || nota.servico_valor_servicos || 0);
      return acc + valor;
    }, 0);

    const empresasCadastradas = empresas.length;

    // NFSe do mês atual
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const nfseMesAtual = nfse.filter(nota => {
      if (!nota.data_emissao) return false;
      const dataEmissao = new Date(nota.data_emissao);
      return dataEmissao.getMonth() === mesAtual && dataEmissao.getFullYear() === anoAtual;
    });

    const valorMesAtual = nfseMesAtual.reduce((acc, nota) => {
      const valor = parseFloat(nota.valor_liquido_nfse || nota.servico_valor_servicos || 0);
      return acc + valor;
    }, 0);

    // Crescimento mensal
    const mesAnterior = new Date(hoje);
    mesAnterior.setMonth(mesAnterior.getMonth() - 1);

    const nfseMesAnterior = nfse.filter(nota => {
      if (!nota.data_emissao) return false;
      const dataEmissao = new Date(nota.data_emissao);
      return dataEmissao.getMonth() === mesAnterior.getMonth() && 
             dataEmissao.getFullYear() === mesAnterior.getFullYear();
    });

    const valorMesAnterior = nfseMesAnterior.reduce((acc, nota) => {
      const valor = parseFloat(nota.valor_liquido_nfse || nota.servico_valor_servicos || 0);
      return acc + valor;
    }, 0);

    const crescimentoMensal = valorMesAnterior > 0 
      ? ((valorMesAtual - valorMesAnterior) / valorMesAnterior) * 100 
      : 0;

    // Canceladas
    const totalCanceladas = nfse.filter(nota => 
      nota.status_processamento === 'cancelada' || nota.status === 'cancelada'
    ).length;

    const valorCancelado = nfse
      .filter(nota => nota.status_processamento === 'cancelada' || nota.status === 'cancelada')
      .reduce((acc, nota) => {
        const valor = parseFloat(nota.valor_liquido_nfse || nota.servico_valor_servicos || 0);
        return acc + valor;
      }, 0);

    // Distribuição por status
    const statusCount = nfse.reduce((acc, nota) => {
      const status = nota.status_processamento || nota.status || 'pendente';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

    // Evolução mensal com metas e variações
    const evolucaoMensal = [];
    const faturamentoPorMes = [];
    const empresasTop: Array<{nome: string; valor: number; quantidade: number; crescimento: number}> = [];

    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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

      const valorMes = nfsesMes.reduce((acc, nota) => {
        const valor = parseFloat(nota.valor_liquido_nfse || nota.servico_valor_servicos || 0);
        return acc + valor;
      }, 0);

      const quantidadeMes = nfsesMes.length;
      const meta = metaMensal; // Meta configurável
      const variacao = meta > 0 ? ((valorMes - meta) / meta) * 100 : 0;

      evolucaoMensal.push({
        mes: nomesMeses[mes],
        nfse: quantidadeMes,
        valor: valorMes,
        meta: meta,
        variacao: Math.round(variacao * 10) / 10
      });

      faturamentoPorMes.push({
        mes: nomesMeses[mes],
        valor: valorMes,
        meta: meta,
        realizado: valorMes
      });
    }

    // Top empresas por faturamento
    const empresasFaturamento = empresas.map(empresa => {
      const nfseEmpresa = nfse.filter(nota => nota.empresa_id === empresa.id);
      const valorTotal = nfseEmpresa.reduce((acc, nota) => {
        const valor = parseFloat(nota.valor_liquido_nfse || nota.servico_valor_servicos || 0);
        return acc + valor;
      }, 0);

      // Calcular crescimento da empresa (últimos 2 meses)
      const nfseMesAtualEmpresa = nfseEmpresa.filter(nota => {
        if (!nota.data_emissao) return false;
        const dataEmissao = new Date(nota.data_emissao);
        return dataEmissao.getMonth() === mesAtual && dataEmissao.getFullYear() === anoAtual;
      });

      const nfseMesAnteriorEmpresa = nfseEmpresa.filter(nota => {
        if (!nota.data_emissao) return false;
        const dataEmissao = new Date(nota.data_emissao);
        return dataEmissao.getMonth() === mesAnterior.getMonth() && 
               dataEmissao.getFullYear() === mesAnterior.getFullYear();
      });

      const valorMesAtualEmpresa = nfseMesAtualEmpresa.reduce((acc, nota) => {
        const valor = parseFloat(nota.valor_liquido_nfse || nota.servico_valor_servicos || 0);
        return acc + valor;
      }, 0);

      const valorMesAnteriorEmpresa = nfseMesAnteriorEmpresa.reduce((acc, nota) => {
        const valor = parseFloat(nota.valor_liquido_nfse || nota.servico_valor_servicos || 0);
        return acc + valor;
      }, 0);

      const crescimentoEmpresa = valorMesAnteriorEmpresa > 0 
        ? ((valorMesAtualEmpresa - valorMesAnteriorEmpresa) / valorMesAnteriorEmpresa) * 100 
        : 0;

      return {
        nome: empresa.name || empresa.razao_social || 'Empresa sem nome',
        valor: valorTotal,
        quantidade: nfseEmpresa.length,
        crescimento: Math.round(crescimentoEmpresa * 10) / 10
      };
    }).sort((a, b) => b.valor - a.valor).slice(0, 5);

    return {
      totalNFSe,
      valorTotalFaturado,
      empresasCadastradas,
      nfseMesAtual: nfseMesAtual.length,
      valorMesAtual,
      crescimentoMensal: Math.round(crescimentoMensal * 10) / 10,
      totalCanceladas,
      valorCancelado,
      statusDistribution,
      evolucaoMensal,
      faturamentoPorMes,
      empresasTop: empresasFaturamento
    };
  };

  useEffect(() => {
    fetchDashboardData();
  }, [periodo, empresaFiltro, dataInicio, dataFim]);

  // Dados filtrados baseados nos controles
  const dadosFiltrados = useMemo(() => {
    if (!stats) return null;

    let evolucaoFiltrada = [...stats.evolucaoMensal];
    let faturamentoFiltrado = [...stats.faturamentoPorMes];

    // Aplicar filtro de período
    if (periodo === '3meses') {
      evolucaoFiltrada = evolucaoFiltrada.slice(-3);
      faturamentoFiltrado = faturamentoFiltrado.slice(-3);
    } else if (periodo === '1mes') {
      evolucaoFiltrada = evolucaoFiltrada.slice(-1);
      faturamentoFiltrado = faturamentoFiltrado.slice(-1);
    }

    return {
      ...stats,
      evolucaoMensal: evolucaoFiltrada,
      faturamentoPorMes: faturamentoFiltrado
    };
  }, [stats, periodo, empresaFiltro, dataInicio, dataFim]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles melhorados */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Dashboard Inteligente
          </h2>
          <p className="text-sm text-muted-foreground">
            {hasData ? 'Dados reais com análises avançadas' : 'Configure suas primeiras NFSe para ver dados reais'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1mes">1 Mês</SelectItem>
              <SelectItem value="3meses">3 Meses</SelectItem>
              <SelectItem value="6meses">6 Meses</SelectItem>
              <SelectItem value="12meses">12 Meses</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Label className="text-xs">Meta Mensal:</Label>
            <Input
              type="number"
              value={metaMensal}
              onChange={(e) => setMetaMensal(Number(e.target.value))}
              className="w-24 h-8 text-xs"
              placeholder="Meta"
            />
          </div>

          <Button onClick={fetchDashboardData} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs para organizar o dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          <TabsTrigger value="nfse">NFSe Detalhado</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas Inteligentes</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {dadosFiltrados && (
            <>
              {/* Cards de KPIs principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Total NFSe
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dadosFiltrados.totalNFSe}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Este mês: {dadosFiltrados.nfseMesAtual}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Faturamento Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(dadosFiltrados.valorTotalFaturado)}</div>
                    <div className="flex items-center gap-1 text-xs">
                      <span>Este mês: {formatCurrency(dadosFiltrados.valorMesAtual)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Crescimento Mensal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold flex items-center gap-1 ${
                      dadosFiltrados.crescimentoMensal >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dadosFiltrados.crescimentoMensal >= 0 ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5" />
                      )}
                      {Math.abs(dadosFiltrados.crescimentoMensal)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      vs. mês anterior
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      Empresas Ativas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dadosFiltrados.empresasCadastradas}</div>
                    <div className="text-xs text-muted-foreground">
                      {dadosFiltrados.empresasTop.length} com faturamento
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de evolução mensal melhorado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Evolução vs Meta
                    </CardTitle>
                    <CardDescription>
                      Comparação do faturamento realizado com a meta mensal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={dadosFiltrados.evolucaoMensal}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="mes"
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                          tickFormatter={formatYAxis}
                          domain={calculateYAxisDomain(dadosFiltrados.evolucaoMensal, 'valor')}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value: any, name: string) => [
                            name === 'valor' ? formatCurrency(value) :
                            name === 'meta' ? formatCurrency(value) : value,
                            name === 'valor' ? 'Realizado' :
                            name === 'meta' ? 'Meta' : name
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="meta" fill="#e5e7eb" name="Meta" />
                        <Line
                          type="monotone"
                          dataKey="valor"
                          stroke="#10b981"
                          strokeWidth={3}
                          name="Realizado"
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top empresas */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Top Empresas
                    </CardTitle>
                    <CardDescription>
                      Empresas com maior faturamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dadosFiltrados.empresasTop.slice(0, 5).map((empresa, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{empresa.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {empresa.quantidade} NFSe emitidas
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{formatCurrency(empresa.valor)}</div>
                            <div className={`text-xs flex items-center gap-1 ${
                              empresa.crescimento >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {empresa.crescimento >= 0 ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {Math.abs(empresa.crescimento)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab: Faturamento */}
        <TabsContent value="faturamento" className="space-y-6">
          {dadosFiltrados && (
            <>
              {/* Controles de período customizado */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros Avançados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm">Data Início</Label>
                      <Input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Data Fim</Label>
                      <Input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Meta Mensal (R$)</Label>
                      <Input
                        type="number"
                        value={metaMensal}
                        onChange={(e) => setMetaMensal(Number(e.target.value))}
                        className="mt-1"
                        placeholder="10000"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={fetchDashboardData} className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Aplicar Filtros
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de faturamento corrigido */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Faturamento por Mês
                  </CardTitle>
                  <CardDescription>
                    Valores reais de faturamento com escala corrigida
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart data={dadosFiltrados.faturamentoPorMes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="mes"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickFormatter={formatYAxis}
                        domain={calculateYAxisDomain(dadosFiltrados.faturamentoPorMes, 'valor')}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, name: string) => [
                          formatCurrency(value),
                          name === 'valor' ? 'Faturamento' :
                          name === 'meta' ? 'Meta' : name
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="meta" fill="#e5e7eb" name="Meta" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="valor" fill="#10b981" name="Realizado" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Métricas de performance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Target className="h-4 w-4" />
                      Atingimento da Meta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metaMensal > 0 ? Math.round((dadosFiltrados.valorMesAtual / metaMensal) * 100) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Meta: {formatCurrency(metaMensal)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Ticket Médio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dadosFiltrados.nfseMesAtual > 0
                        ? formatCurrency(dadosFiltrados.valorMesAtual / dadosFiltrados.nfseMesAtual)
                        : 'R$ 0'
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Por NFSe emitida
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Percent className="h-4 w-4" />
                      Taxa de Cancelamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dadosFiltrados.totalNFSe > 0
                        ? Math.round((dadosFiltrados.totalCanceladas / dadosFiltrados.totalNFSe) * 100)
                        : 0
                      }%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dadosFiltrados.totalCanceladas} canceladas
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab: NFSe Detalhado */}
        <TabsContent value="nfse" className="space-y-6">
          {dadosFiltrados && (
            <>
              {/* Gráfico de evolução com comparação mês a mês */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Evolução NFSe - Comparação Mês a Mês
                  </CardTitle>
                  <CardDescription>
                    Quantidade e valor das NFSe com variações percentuais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={dadosFiltrados.evolucaoMensal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="mes"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickFormatter={formatYAxis}
                        domain={calculateYAxisDomain(dadosFiltrados.evolucaoMensal, 'valor')}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, name: string) => [
                          name === 'valor' ? formatCurrency(value) :
                          name === 'nfse' ? `${value} NFSe` :
                          name === 'variacao' ? `${value}%` : value,
                          name === 'valor' ? 'Valor Total' :
                          name === 'nfse' ? 'Quantidade' :
                          name === 'variacao' ? 'Variação vs Meta' : name
                        ]}
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="valor"
                        fill="#10b981"
                        fillOpacity={0.3}
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Valor Total"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="nfse"
                        fill="#3b82f6"
                        name="Quantidade NFSe"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="variacao"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Variação vs Meta (%)"
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribuição por status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Distribuição por Status
                    </CardTitle>
                    <CardDescription>
                      Status das NFSe emitidas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={dadosFiltrados.statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {dadosFiltrados.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [`${value} NFSe`, 'Quantidade']}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Métricas detalhadas */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Métricas Detalhadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">NFSe Emitidas</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{dadosFiltrados.totalNFSe - dadosFiltrados.totalCanceladas}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(dadosFiltrados.valorTotalFaturado - dadosFiltrados.valorCancelado)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium">NFSe Canceladas</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{dadosFiltrados.totalCanceladas}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(dadosFiltrados.valorCancelado)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Média Mensal</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {Math.round(dadosFiltrados.totalNFSe / 6)} NFSe
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(dadosFiltrados.valorTotalFaturado / 6)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">Projeção Anual</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {Math.round((dadosFiltrados.valorMesAtual * 12))}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(dadosFiltrados.valorMesAtual * 12)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab: Tarefas Inteligentes */}
        <TabsContent value="tarefas" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Tarefas com Priorização Inteligente
              </CardTitle>
              <CardDescription>
                Tarefas organizadas por urgência, prazo e valor financeiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa encontrada</h3>
                    <p className="text-muted-foreground">
                      Crie tarefas no módulo de Tarefas para ver a priorização inteligente aqui.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Tarefas urgentes */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Urgentes (Score ≥ 80)
                      </h3>
                      {tasks.filter(task => task.urgency_score >= 80).map(task => (
                        <div key={task.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <Badge variant="destructive" className="text-xs">
                                  Score: {task.urgency_score}
                                </Badge>
                                {task.days_until_due !== null && (
                                  <Badge variant="outline" className={`text-xs ${
                                    task.days_until_due < 0 ? 'border-red-500 text-red-700' :
                                    task.days_until_due === 0 ? 'border-orange-500 text-orange-700' :
                                    'border-yellow-500 text-yellow-700'
                                  }`}>
                                    {task.days_until_due < 0 ? `${Math.abs(task.days_until_due)} dias atrasado` :
                                     task.days_until_due === 0 ? 'Vence hoje' :
                                     `${task.days_until_due} dias restantes`}
                                  </Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Responsável: {task.responsible}</span>
                                {task.financial_value && (
                                  <span>Valor: {formatCurrency(task.financial_value)}</span>
                                )}
                                {task.due_date && (
                                  <span>Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tarefas importantes */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-orange-600 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Importantes (Score 50-79)
                      </h3>
                      {tasks.filter(task => task.urgency_score >= 50 && task.urgency_score < 80).map(task => (
                        <div key={task.id} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                  Score: {task.urgency_score}
                                </Badge>
                                {task.days_until_due !== null && (
                                  <Badge variant="outline" className="text-xs border-orange-500 text-orange-700">
                                    {task.days_until_due < 0 ? `${Math.abs(task.days_until_due)} dias atrasado` :
                                     task.days_until_due === 0 ? 'Vence hoje' :
                                     `${task.days_until_due} dias restantes`}
                                  </Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Responsável: {task.responsible}</span>
                                {task.financial_value && (
                                  <span>Valor: {formatCurrency(task.financial_value)}</span>
                                )}
                                {task.due_date && (
                                  <span>Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tarefas normais */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-blue-600 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Normais (Score &lt; 50)
                      </h3>
                      {tasks.filter(task => task.urgency_score < 50).slice(0, 5).map(task => (
                        <div key={task.id} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                  Score: {task.urgency_score}
                                </Badge>
                                {task.days_until_due !== null && task.days_until_due > 0 && (
                                  <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                                    {task.days_until_due} dias restantes
                                  </Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Responsável: {task.responsible}</span>
                                {task.financial_value && (
                                  <span>Valor: {formatCurrency(task.financial_value)}</span>
                                )}
                                {task.due_date && (
                                  <span>Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Resumo de tarefas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                      <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {tasks.filter(task => task.urgency_score >= 80).length}
                          </div>
                          <div className="text-sm text-red-700">Urgentes</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {tasks.filter(task => task.urgency_score >= 50 && task.urgency_score < 80).length}
                          </div>
                          <div className="text-sm text-orange-700">Importantes</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {tasks.filter(task => task.urgency_score < 50).length}
                          </div>
                          <div className="text-sm text-blue-700">Normais</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-gray-600">
                            {tasks.filter(task => task.days_until_due !== null && task.days_until_due < 0).length}
                          </div>
                          <div className="text-sm text-gray-700">Atrasadas</div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mensagem quando não há dados */}
      {!hasData && (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Dashboard em Construção</h3>
            <p className="text-muted-foreground text-center mb-4">
              {loading ? (
                'Carregando dados do dashboard...'
              ) : (
                'Não há dados suficientes para exibir métricas completas. Comece emitindo NFSe ou adicionando transações financeiras para ver insights detalhados.'
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={fetchDashboardData} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Carregando...' : 'Atualizar Dados'}
              </Button>
              <Button onClick={() => window.location.href = '/notas/emitir'}>
                <FileText className="h-4 w-4 mr-2" />
                Emitir NFSe
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicador de dados simulados */}
      {hasData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                <strong>Dashboard Inteligente:</strong> Dados reais com análises avançadas, escalas corrigidas e priorização automática de tarefas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardMelhorado;
