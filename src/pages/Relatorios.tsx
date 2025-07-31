import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  DollarSign,
  TrendingUp
} from 'lucide-react';

interface ReportData {
  invoices: Array<{
    id: string;
    numero_nota: string;
    valor_total: number;
    data_emissao: string;
    status: string;
    companies: {
      razao_social: string;
      cnpj_cpf: string;
    };
  }>;
  summary: {
    totalInvoices: number;
    totalValue: number;
    averageValue: number;
    byStatus: Record<string, number>;
    byMonth: Record<string, { count: number; value: number }>;
  };
}

const Relatorios = () => {
  const [reportData, setReportData] = useState<ReportData>({
    invoices: [],
    summary: {
      totalInvoices: 0,
      totalValue: 0,
      averageValue: 0,
      byStatus: {},
      byMonth: {},
    }
  });
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      generateReport();
    }
  }, [dateFrom, dateTo, statusFilter]);

  const generateReport = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          companies (
            razao_social,
            cnpj_cpf
          )
        `)
        .gte('data_emissao', dateFrom)
        .lte('data_emissao', dateTo)
        .order('data_emissao', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'rascunho' | 'emitida' | 'cancelada' | 'erro');
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      // Calculate summary
      const totalValue = invoices?.reduce((sum, inv) => sum + Number(inv.valor_total), 0) || 0;
      const totalInvoices = invoices?.length || 0;
      
      const byStatus = invoices?.reduce((acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const byMonth = invoices?.reduce((acc, inv) => {
        const month = new Date(inv.data_emissao).toISOString().substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { count: 0, value: 0 };
        }
        acc[month].count += 1;
        acc[month].value += Number(inv.valor_total);
        return acc;
      }, {} as Record<string, { count: number; value: number }>) || {};

      setReportData({
        invoices: invoices || [],
        summary: {
          totalInvoices,
          totalValue,
          averageValue: totalInvoices > 0 ? totalValue / totalInvoices : 0,
          byStatus,
          byMonth,
        }
      });

    } catch (error: any) {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Número da Nota', 'Empresa', 'CNPJ/CPF', 'Valor', 'Data de Emissão', 'Status'];
    const csvContent = [
      headers.join(','),
      ...reportData.invoices.map(invoice => [
        invoice.numero_nota,
        `"${invoice.companies.razao_social}"`,
        invoice.companies.cnpj_cpf,
        invoice.valor_total.toString().replace('.', ','),
        new Date(invoice.data_emissao).toLocaleDateString('pt-BR'),
        invoice.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_notas_fiscais_${dateFrom}_${dateTo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório exportado",
      description: "Arquivo CSV baixado com sucesso",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">
              Análise detalhada das atividades fiscais
            </p>
          </div>
          
          <Button
            onClick={exportToCSV}
            disabled={reportData.invoices.length === 0}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="dateFrom">Data Inicial</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="dateTo">Data Final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="emitida">Emitida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                    <SelectItem value="erro">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={generateReport} disabled={loading} className="w-full">
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  )}
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Notas</p>
                  <p className="text-2xl font-bold text-primary">{reportData.summary.totalInvoices}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(reportData.summary.totalValue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(reportData.summary.averageValue)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Período</p>
                  <p className="text-sm font-bold">
                    {dateFrom && dateTo ? 
                      `${formatDate(dateFrom)} - ${formatDate(dateTo)}` : 
                      'Selecione um período'
                    }
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(reportData.summary.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    {getStatusBadge(status)}
                    <span className="font-medium">{count} nota{count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
                {Object.keys(reportData.summary.byStatus).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum dado encontrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(reportData.summary.byMonth)
                  .sort()
                  .reverse()
                  .map(([month, data]) => (
                    <div key={month} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">
                          {new Date(month + '-01').toLocaleDateString('pt-BR', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.count} nota{data.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-success">
                          {formatCurrency(data.value)}
                        </p>
                      </div>
                    </div>
                  ))}
                {Object.keys(reportData.summary.byMonth).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum dado encontrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento das Notas Fiscais</CardTitle>
            <CardDescription>
              Lista completa das notas fiscais no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.invoices.length > 0 ? (
                      reportData.invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.numero_nota}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{invoice.companies.razao_social}</div>
                              <div className="text-sm text-muted-foreground">
                                {invoice.companies.cnpj_cpf}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-success">
                            {formatCurrency(Number(invoice.valor_total))}
                          </TableCell>
                          <TableCell>
                            {formatDate(invoice.data_emissao)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invoice.status)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              Nenhuma nota fiscal encontrada no período
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Relatorios;