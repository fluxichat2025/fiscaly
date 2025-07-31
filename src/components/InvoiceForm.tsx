import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Send } from 'lucide-react';

interface Company {
  id: string;
  cnpj_cpf: string;
  razao_social: string;
  nome_fantasia?: string;
}

interface InvoiceFormData {
  numero_nota: string;
  company_id: string;
  valor_total: number;
  descricao_servicos: string;
  data_emissao: string;
}

interface InvoiceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InvoiceForm({ onSuccess, onCancel }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<InvoiceFormData>({
    defaultValues: {
      data_emissao: new Date().toISOString().split('T')[0],
    }
  });

  const selectedCompanyId = watch('company_id');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, cnpj_cpf, razao_social, nome_fantasia')
        .order('razao_social');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj_cpf.includes(searchTerm) ||
    (company.nome_fantasia && company.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const onSubmit = async (data: InvoiceFormData) => {
    setIsLoading(true);

    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          ...data,
          created_by: user?.id,
          status: 'rascunho',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Nota fiscal criada",
        description: "Nota fiscal salva como rascunho com sucesso",
      });

      // If webhook URL is provided, send immediately
      if (webhookUrl.trim()) {
        await sendWebhook(invoice.id);
      }

      reset();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro ao criar nota fiscal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendWebhook = async (invoiceId: string) => {
    if (!webhookUrl.trim()) {
      toast({
        title: "URL do webhook obrigatória",
        description: "Digite a URL do webhook N8n para emitir a nota",
        variant: "destructive",
      });
      return;
    }

    setIsSendingWebhook(true);

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
          title: "Nota fiscal emitida",
          description: "Nota fiscal enviada com sucesso para o N8n",
        });
      } else {
        throw new Error(data.message || 'Erro ao enviar webhook');
      }
    } catch (error: any) {
      toast({
        title: "Erro no webhook",
        description: error.message || "Erro ao enviar nota para o N8n",
        variant: "destructive",
      });
    } finally {
      setIsSendingWebhook(false);
    }
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    
    const invoiceNumber = `NF${year}${month}${day}${time}`;
    setValue('numero_nota', invoiceNumber);
    
    toast({
      title: "Número gerado",
      description: `Número da nota: ${invoiceNumber}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emissão de Nota Fiscal</CardTitle>
        <CardDescription>
          Preencha os dados para emitir uma nova nota fiscal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Invoice Number */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="numero_nota">Número da Nota *</Label>
              <Input
                id="numero_nota"
                {...register('numero_nota', { required: 'Número da nota é obrigatório' })}
                placeholder="Ex: NF202412140001"
              />
              {errors.numero_nota && (
                <p className="text-sm text-destructive mt-1">{errors.numero_nota.message}</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={generateInvoiceNumber}
              className="mt-6"
            >
              Gerar Número
            </Button>
          </div>

          {/* Company Selection */}
          <div className="space-y-2">
            <Label>Prestador/Empresa *</Label>
            <Input
              placeholder="Buscar empresa por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <Select onValueChange={(value) => setValue('company_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {filteredCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div>
                      <div className="font-medium">{company.razao_social}</div>
                      <div className="text-sm text-muted-foreground">
                        {company.cnpj_cpf} {company.nome_fantasia && `• ${company.nome_fantasia}`}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedCompanyId && (
              <p className="text-sm text-destructive">Selecione uma empresa</p>
            )}
          </div>

          {/* Value and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor_total">Valor Total (R$) *</Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                {...register('valor_total', { 
                  required: 'Valor é obrigatório',
                  min: { value: 0.01, message: 'Valor deve ser maior que zero' }
                })}
                placeholder="0,00"
              />
              {errors.valor_total && (
                <p className="text-sm text-destructive mt-1">{errors.valor_total.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="data_emissao">Data de Emissão *</Label>
              <Input
                id="data_emissao"
                type="date"
                {...register('data_emissao', { required: 'Data é obrigatória' })}
              />
              {errors.data_emissao && (
                <p className="text-sm text-destructive mt-1">{errors.data_emissao.message}</p>
              )}
            </div>
          </div>

          {/* Service Description */}
          <div>
            <Label htmlFor="descricao_servicos">Descrição dos Serviços *</Label>
            <Textarea
              id="descricao_servicos"
              {...register('descricao_servicos', { required: 'Descrição é obrigatória' })}
              placeholder="Descreva os serviços prestados..."
              rows={4}
            />
            {errors.descricao_servicos && (
              <p className="text-sm text-destructive mt-1">{errors.descricao_servicos.message}</p>
            )}
          </div>

          {/* Webhook URL */}
          <div>
            <Label htmlFor="webhook_url">URL do Webhook N8n (opcional)</Label>
            <Input
              id="webhook_url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://seu-n8n.com/webhook/..."
            />
            <p className="text-sm text-muted-foreground mt-1">
              Se preenchido, a nota será enviada automaticamente após criação
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading || isSendingWebhook} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {webhookUrl.trim() ? 'Criar e Emitir Nota' : 'Salvar como Rascunho'}
            </Button>
            
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>

          {isSendingWebhook && (
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Enviando para N8n...</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}