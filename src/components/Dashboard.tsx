import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { TasksWidget } from '@/components/TasksWidget';
import {
  FileText,
  Building2,
  TrendingUp,
  DollarSign,
  CalendarDays,
  Users,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  totalInvoices: number;
  totalValue: number;
  totalCompanies: number;
  monthlyInvoices: number;
  monthlyValue: number;
  recentInvoices: Array<{
    id: string;
    numero_nota: string;
    valor_total: number;
    data_emissao: string;
    status: string;
    company: {
      razao_social: string;
    };
  }>;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalValue: 0,
    totalCompanies: 0,
    monthlyInvoices: 0,
    monthlyValue: 0,
    recentInvoices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get total invoices and value
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('valor_total, data_emissao');

      if (invoicesError) throw invoicesError;

      // Get total companies
      const { count: companiesCount, error: companiesError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      if (companiesError) throw companiesError;

      // Get recent invoices with company info
      const { data: recentInvoices, error: recentError } = await supabase
        .from('invoices')
        .select(`
          id,
          numero_nota,
          valor_total,
          data_emissao,
          status,
          companies (
            razao_social
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Calculate stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const totalValue = invoices?.reduce((sum, invoice) => sum + Number(invoice.valor_total || 0), 0) || 0;
      
      const monthlyInvoices = invoices?.filter(invoice => {
        const invoiceDate = new Date(invoice.data_emissao);
        return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
      }) || [];
      
      const monthlyValue = monthlyInvoices.reduce((sum, invoice) => sum + Number(invoice.valor_total || 0), 0);

      setStats({
        totalInvoices: invoices?.length || 0,
        totalValue,
        totalCompanies: companiesCount || 0,
        monthlyInvoices: monthlyInvoices.length,
        monthlyValue,
        recentInvoices: recentInvoices?.map(invoice => ({
          ...invoice,
          company: { razao_social: invoice.companies?.razao_social || 'N/A' }
        })) || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'rascunho': { label: 'Rascunho', variant: 'secondary' as const },
      'emitida': { label: 'Emitida', variant: 'default' as const },
      'cancelada': { label: 'Cancelada', variant: 'destructive' as const },
      'erro': { label: 'Erro', variant: 'destructive' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.rascunho;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das atividades fiscais
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Notas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Todas as notas fiscais
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Volume total emitido
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestadores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Empresas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.monthlyInvoices}</div>
            <p className="text-xs text-success">
              {formatCurrency(stats.monthlyValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Notas Fiscais Recentes
            </CardTitle>
            <CardDescription>
              Últimas 5 notas fiscais emitidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentInvoices.length > 0 ? (
                stats.recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{invoice.numero_nota}</p>
                      <p className="text-xs text-muted-foreground">{invoice.company.razao_social}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatCurrency(Number(invoice.valor_total))}</p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma nota fiscal encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumo Mensal
            </CardTitle>
            <CardDescription>
              Performance do mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Notas Emitidas</span>
                <span className="font-medium">{stats.monthlyInvoices}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor Total</span>
                <span className="font-medium">{formatCurrency(stats.monthlyValue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ticket Médio</span>
                <span className="font-medium">
                  {stats.monthlyInvoices > 0 
                    ? formatCurrency(stats.monthlyValue / stats.monthlyInvoices)
                    : formatCurrency(0)
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prestadores Ativos</span>
                <span className="font-medium">{stats.totalCompanies}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget de Tarefas */}
        <TasksWidget limit={5} />
      </div>
    </div>
  );
}