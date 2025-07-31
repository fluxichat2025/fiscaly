import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Search, 
  Filter, 
  Trash2, 
  Send, 
  RefreshCw,
  Calendar,
  Building2,
  DollarSign
} from 'lucide-react';

interface Invoice {
  id: string;
  numero_nota: string;
  valor_total: number;
  descricao_servicos: string;
  data_emissao: string;
  status: 'rascunho' | 'emitida' | 'cancelada' | 'erro';
  webhook_sent: boolean;
  created_at: string;
  companies: {
    razao_social: string;
    cnpj_cpf: string;
  };
}

interface InvoiceListProps {
  onEdit?: (invoice: Invoice) => void;
  refreshTrigger?: number;
}

export function InvoiceList({ onEdit, refreshTrigger }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, [refreshTrigger]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('invoices')
        .select(`
          *,
          companies (
            razao_social,
            cnpj_cpf
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'rascunho' | 'emitida' | 'cancelada' | 'erro');
      }

      if (dateFrom) {
        query = query.gte('data_emissao', dateFrom);
      }

      if (dateTo) {
        query = query.lte('data_emissao', dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by search term
      const filteredData = data?.filter(invoice =>
        invoice.numero_nota.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.companies?.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.companies?.cnpj_cpf.includes(searchTerm) ||
        invoice.descricao_servicos.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];

      setInvoices(filteredData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar notas fiscais",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta nota fiscal?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Nota fiscal excluída",
        description: "Nota fiscal removida com sucesso",
      });

      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir nota fiscal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendWebhook = async (invoiceId: string) => {
    const webhookUrl = prompt('Digite a URL do webhook N8n:');
    if (!webhookUrl) return;

    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-webhook', {
        body: { 
          invoiceId,
          webhookUrl: webhookUrl.trim()
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Webhook enviado",
          description: "Nota fiscal enviada com sucesso para o N8n",
        });
        fetchInvoices();
      } else {
        throw new Error(data.message || 'Erro ao enviar webhook');
      }
    } catch (error: any) {
      toast({
        title: "Erro no webhook",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, webhookSent: boolean) => {
    const statusMap = {
      'rascunho': { label: 'Rascunho', variant: 'secondary' as const },
      'emitida': { label: 'Emitida', variant: 'default' as const },
      'cancelada': { label: 'Cancelada', variant: 'destructive' as const },
      'erro': { label: 'Erro', variant: 'destructive' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.rascunho;
    
    return (
      <div className="flex flex-col gap-1">
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        {webhookSent && (
          <Badge variant="outline" className="text-xs">
            <Send className="h-3 w-3 mr-1" />
            Enviada
          </Badge>
        )}
      </div>
    );
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Notas Fiscais
        </CardTitle>
        <CardDescription>
          Gerencie todas as notas fiscais emitidas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="emitida">Emitida</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
              <SelectItem value="erro">Erro</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder="Data inicial"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />

          <Input
            type="date"
            placeholder="Data final"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <Button onClick={fetchInvoices} variant="outline" className="mb-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.numero_nota}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.companies?.razao_social}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.companies?.cnpj_cpf}
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
                      {getStatusBadge(invoice.status, invoice.webhook_sent)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!invoice.webhook_sent && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendWebhook(invoice.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteInvoice(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Nenhuma nota fiscal encontrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {invoices.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{invoices.length}</div>
                <div className="text-sm text-muted-foreground">Total de Notas</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(invoices.reduce((sum, inv) => sum + Number(inv.valor_total), 0))}
                </div>
                <div className="text-sm text-muted-foreground">Valor Total</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {invoices.filter(inv => inv.webhook_sent).length}
                </div>
                <div className="text-sm text-muted-foreground">Enviadas</div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}