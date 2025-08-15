import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FinancialData {
  saldoTotal: number;
  receitasMesAtual: number;
  despesasMesAtual: number;
  fluxoLiquido: number;
  crescimentoReceitas: number;
  crescimentoDespesas: number;
  contasBancarias: Array<{
    id: string;
    name: string;
    saldo: number;
    tipo: string;
  }>;
  transacoesPorCategoria: Array<{
    categoria: string;
    valor: number;
    tipo: 'income' | 'expense';
    color: string;
  }>;
  evolucaoMensal: Array<{
    mes: string;
    receitas: number;
    despesas: number;
    liquido: number;
  }>;
  ultimasTransacoes: Array<{
    id: string;
    descricao: string;
    valor: number;
    tipo: 'income' | 'expense';
    data: string;
    categoria: string;
  }>;
}

const DashboardFinanceiro: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      console.log('📊 Buscando dados financeiros reais...');

      if (!user?.id) {
        console.log('⚠️ Usuário não autenticado');
        setData(getEmptyFinancialData());
        return;
      }

      // Buscar dados das tabelas financeiras
      const [accountsResult, transactionsResult, categoriesResult] = await Promise.all([
        supabase.from('finance_accounts').select('*').eq('created_by', user.id),
        supabase.from('finance_transactions').select('*').eq('created_by', user.id),
        supabase.from('categories').select('*')
      ]);

      console.log('💰 Dados financeiros encontrados:', {
        contas: accountsResult.data?.length || 0,
        transacoes: transactionsResult.data?.length || 0,
        categorias: categoriesResult.data?.length || 0
      });

      // Processar dados reais
      const financialData = await processFinancialData({
        accounts: accountsResult.data || [],
        transactions: transactionsResult.data || [],
        categories: categoriesResult.data || []
      });

      setData(financialData);
    } catch (error) {
      console.error('❌ Erro ao buscar dados financeiros:', error);
      setData(getEmptyFinancialData());
    } finally {
      setLoading(false);
    }
  };

  const processFinancialData = async (data: {
    accounts: any[];
    transactions: any[];
    categories: any[];
  }): Promise<FinancialData> => {
    const { accounts, transactions, categories } = data;

    // === SALDO TOTAL DAS CONTAS ===
    const saldoTotal = accounts.reduce((acc, account) => {
      return acc + (parseFloat(account.opening_balance) || 0);
    }, 0);

    // === DADOS DO MÊS ATUAL ===
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();

    const transacoesMesAtual = transactions.filter(transaction => {
      if (!transaction.date) return false;
      const dataTransacao = new Date(transaction.date);
      return dataTransacao.getMonth() === mesAtual && dataTransacao.getFullYear() === anoAtual;
    });

    const receitasMesAtual = transacoesMesAtual
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

    const despesasMesAtual = transacoesMesAtual
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

    const fluxoLiquido = receitasMesAtual - despesasMesAtual;

    // === CRESCIMENTO MENSAL ===
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

    const transacoesMesAnterior = transactions.filter(transaction => {
      if (!transaction.date) return false;
      const dataTransacao = new Date(transaction.date);
      return dataTransacao.getMonth() === mesAnterior && dataTransacao.getFullYear() === anoMesAnterior;
    });

    const receitasMesAnterior = transacoesMesAnterior
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

    const despesasMesAnterior = transacoesMesAnterior
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

    const crescimentoReceitas = receitasMesAnterior > 0 
      ? ((receitasMesAtual - receitasMesAnterior) / receitasMesAnterior) * 100 
      : 0;

    const crescimentoDespesas = despesasMesAnterior > 0 
      ? ((despesasMesAtual - despesasMesAnterior) / despesasMesAnterior) * 100 
      : 0;

    // === CONTAS BANCÁRIAS ===
    const contasBancarias = accounts.map(account => ({
      id: account.id,
      name: account.name,
      saldo: parseFloat(account.opening_balance) || 0,
      tipo: account.account_type || 'corrente'
    }));

    // === TRANSAÇÕES POR CATEGORIA ===
    const categoriaMap = categories.reduce((acc, cat) => {
      acc[cat.id] = { name: cat.name, type: cat.type, color: cat.color || '#6b7280' };
      return acc;
    }, {} as Record<string, any>);

    const transacoesPorCategoria = transactions.reduce((acc, transaction) => {
      const categoria = categoriaMap[transaction.category_id];
      if (!categoria) return acc;

      const existing = acc.find(item => item.categoria === categoria.name);
      if (existing) {
        existing.valor += parseFloat(transaction.amount) || 0;
      } else {
        acc.push({
          categoria: categoria.name,
          valor: parseFloat(transaction.amount) || 0,
          tipo: transaction.type,
          color: categoria.color
        });
      }
      return acc;
    }, [] as any[]);

    // === EVOLUÇÃO MENSAL (últimos 6 meses) ===
    const evolucaoMensal = [];
    
    for (let i = 5; i >= 0; i--) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const mes = data.getMonth();
      const ano = data.getFullYear();
      
      const transacoesMes = transactions.filter(transaction => {
        if (!transaction.date) return false;
        const dataTransacao = new Date(transaction.date);
        return dataTransacao.getMonth() === mes && dataTransacao.getFullYear() === ano;
      });

      const receitasMes = transacoesMes
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

      const despesasMes = transacoesMes
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

      const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      evolucaoMensal.push({
        mes: nomesMeses[mes],
        receitas: receitasMes,
        despesas: despesasMes,
        liquido: receitasMes - despesasMes
      });
    }

    // === ÚLTIMAS TRANSAÇÕES ===
    const ultimasTransacoes = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(transaction => ({
        id: transaction.id,
        descricao: transaction.description || 'Transação',
        valor: parseFloat(transaction.amount) || 0,
        tipo: transaction.type,
        data: transaction.date,
        categoria: categoriaMap[transaction.category_id]?.name || 'Sem categoria'
      }));

    console.log('✅ Dados financeiros processados:', {
      saldoTotal,
      receitasMesAtual,
      despesasMesAtual,
      fluxoLiquido,
      contasBancarias: contasBancarias.length,
      transacoesPorCategoria: transacoesPorCategoria.length,
      ultimasTransacoes: ultimasTransacoes.length
    });

    return {
      saldoTotal,
      receitasMesAtual,
      despesasMesAtual,
      fluxoLiquido,
      crescimentoReceitas: Math.round(crescimentoReceitas * 10) / 10,
      crescimentoDespesas: Math.round(crescimentoDespesas * 10) / 10,
      contasBancarias,
      transacoesPorCategoria,
      evolucaoMensal,
      ultimasTransacoes
    };
  };

  const getEmptyFinancialData = (): FinancialData => {
    return {
      saldoTotal: 0,
      receitasMesAtual: 0,
      despesasMesAtual: 0,
      fluxoLiquido: 0,
      crescimentoReceitas: 0,
      crescimentoDespesas: 0,
      contasBancarias: [],
      transacoesPorCategoria: [],
      evolucaoMensal: [],
      ultimasTransacoes: []
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFinancialData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  useEffect(() => {
    fetchFinancialData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando dados financeiros...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Erro ao carregar dados financeiros</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Financeiro</h2>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.saldoTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {data.contasBancarias.length} conta{data.contasBancarias.length !== 1 ? 's' : ''} bancária{data.contasBancarias.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(data.receitasMesAtual)}</div>
            <p className="text-xs text-muted-foreground">
              {data.crescimentoReceitas > 0 ? '+' : ''}{data.crescimentoReceitas.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(data.despesasMesAtual)}</div>
            <p className="text-xs text-muted-foreground">
              {data.crescimentoDespesas > 0 ? '+' : ''}{data.crescimentoDespesas.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxo Líquido</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.fluxoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.fluxoLiquido)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mensagem quando não há dados */}
      {data.saldoTotal === 0 && data.receitasMesAtual === 0 && data.despesasMesAtual === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado financeiro encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Para começar a ver seus dados financeiros, cadastre suas contas bancárias e registre suas transações.
            </p>
            <Button onClick={() => window.location.href = '/configuracoes'}>
              Configurar Contas Bancárias
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardFinanceiro;
