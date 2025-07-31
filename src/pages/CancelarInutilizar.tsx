import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFocusNFeAPI } from '@/hooks/useFocusNFeAPI';
import { supabase } from '@/integrations/supabase/client';
import {
  XCircle,
  AlertTriangle,
  Search,
  FileX,
  Trash2,
  Loader2,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  Download,
  ExternalLink
} from 'lucide-react';

// Tipos para NFSe
interface NFSeItem {
  id: string;
  referencia: string;
  numero_nfse?: string;
  rps_numero?: string;
  data_emissao: string;
  valor_servicos: number;
  status: string;
  prestador_razao_social?: string;
  tomador_razao_social?: string;
  tomador_cnpj?: string;
  tomador_cpf?: string;
  discriminacao?: string;
  cnpj_prestador: string;
  razao_social?: string;
  url_pdf?: string;
  url_xml?: string;
  xml_completo?: string;
  json_dados?: any;
  fonte: 'supabase' | 'focus_api';
}

// Tipos para histórico de cancelamento
interface HistoricoCancelamento {
  id: string;
  referencia: string;
  numero_nfse?: string;
  motivo: string;
  data_cancelamento: string;
  status: 'processando' | 'cancelado' | 'erro';
  mensagem_erro?: string;
  usuario: string;
}

const CancelarInutilizar = () => {
  const [activeTab, setActiveTab] = useState('cancelar');
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<any[]>([]);

  // Estados para busca de NFSe
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const [referenciaBusca, setReferenciaBusca] = useState('');
  const [numeroNFSeBusca, setNumeroNFSeBusca] = useState('');
  const [nfseSelecionada, setNfseSelecionada] = useState<NFSeItem | null>(null);

  // Estados para cancelamento
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [observacaoCancelamento, setObservacaoCancelamento] = useState('');
  const [loadingCancelamento, setLoadingCancelamento] = useState(false);

  // Estados para histórico
  const [historicoCancelamentos, setHistoricoCancelamentos] = useState<HistoricoCancelamento[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);

  const { toast } = useToast();
  const { makeRequest } = useFocusNFeAPI();

  // Carregar empresas do Supabase
  useEffect(() => {
    carregarEmpresas();
    carregarHistoricoCancelamentos();
  }, []);

  const carregarEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('razao_social');

      if (error) throw error;

      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar empresas",
        description: "Não foi possível carregar a lista de empresas",
      });
    }
  };

  // Buscar NFSe por referência ou número
  const buscarNFSe = async () => {
    if (!empresaSelecionada) {
      toast({
        variant: "destructive",
        title: "Empresa obrigatória",
        description: "Selecione uma empresa para buscar a NFSe",
      });
      return;
    }

    if (!referenciaBusca && !numeroNFSeBusca) {
      toast({
        variant: "destructive",
        title: "Parâmetro obrigatório",
        description: "Informe a referência ou número da NFSe",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Buscando NFSe para cancelamento...');

      // Primeiro buscar no Supabase
      let nfseEncontrada: NFSeItem | null = null;

      const { data: supabaseData, error } = await supabase
        .from('notas_fiscais')
        .select(`
          *,
          url_pdf,
          url_xml,
          xml_completo,
          json_dados,
          prestador_razao_social,
          tomador_razao_social,
          tomador_cnpj,
          tomador_cpf,
          discriminacao
        `)
        .eq('empresa_id', empresaSelecionada)
        .or(
          referenciaBusca ? `referencia.eq.${referenciaBusca}` :
          numeroNFSeBusca ? `numero_nfse.eq.${numeroNFSeBusca}` : ''
        )
        .single();

      if (!error && supabaseData) {
        nfseEncontrada = {
          ...supabaseData,
          fonte: 'supabase'
        };
        console.log('✅ NFSe encontrada no Supabase:', nfseEncontrada);
      } else {
        // Se não encontrou no Supabase, buscar na API Focus NFe
        try {
          const referencia = referenciaBusca || numeroNFSeBusca;
          const response = await makeRequest(`/nfse/${referencia}`);

          if (response && response.status) {
            nfseEncontrada = {
              id: response.ref || referencia,
              referencia: response.ref || referencia,
              numero_nfse: response.numero,
              data_emissao: response.data_emissao,
              valor_servicos: response.servico?.valor_servicos || response.valor_servicos || 0,
              status: response.status,
              prestador_razao_social: response.prestador?.razao_social,
              tomador_razao_social: response.tomador?.razao_social,
              tomador_cnpj: response.tomador?.cnpj,
              tomador_cpf: response.tomador?.cpf,
              discriminacao: response.servico?.discriminacao || response.discriminacao,
              cnpj_prestador: response.prestador?.cnpj || '',
              url_pdf: response.url_pdf,
              url_xml: response.url_xml,
              xml_completo: response.xml,
              json_dados: response,
              fonte: 'focus_api'
            };
            console.log('✅ NFSe encontrada na Focus API:', nfseEncontrada);
          }
        } catch (apiError) {
          console.log('❌ NFSe não encontrada na Focus API:', apiError);
        }
      }

      if (nfseEncontrada) {
        // Verificar se a NFSe pode ser cancelada
        if (nfseEncontrada.status === 'cancelado') {
          toast({
            variant: "destructive",
            title: "NFSe já cancelada",
            description: "Esta NFSe já foi cancelada anteriormente",
          });
          return;
        }

        if (nfseEncontrada.status !== 'autorizado') {
          toast({
            variant: "destructive",
            title: "NFSe não pode ser cancelada",
            description: `Apenas NFSe com status "autorizado" podem ser canceladas. Status atual: ${nfseEncontrada.status}`,
          });
          return;
        }

        setNfseSelecionada(nfseEncontrada);
        toast({
          title: "NFSe encontrada",
          description: `NFSe ${nfseEncontrada.numero_nfse || nfseEncontrada.referencia} localizada com sucesso`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "NFSe não encontrada",
          description: "Não foi possível localizar a NFSe com os dados informados",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao buscar NFSe:', error);
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: "Ocorreu um erro ao buscar a NFSe",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cancelar NFSe
  const cancelarNFSe = async () => {
    if (!nfseSelecionada) {
      toast({
        variant: "destructive",
        title: "NFSe não selecionada",
        description: "Busque e selecione uma NFSe antes de cancelar",
      });
      return;
    }

    if (!motivoCancelamento) {
      toast({
        variant: "destructive",
        title: "Motivo obrigatório",
        description: "Selecione o motivo do cancelamento",
      });
      return;
    }

    if (!observacaoCancelamento || observacaoCancelamento.length < 15) {
      toast({
        variant: "destructive",
        title: "Observação obrigatória",
        description: "A observação deve ter pelo menos 15 caracteres",
      });
      return;
    }

    setLoadingCancelamento(true);
    try {
      console.log('🚫 Iniciando cancelamento de NFSe...');

      // Dados para cancelamento conforme documentação Focus NFe
      const dadosCancelamento = {
        justificativa: observacaoCancelamento
      };

      // Fazer requisição de cancelamento para a Focus NFe
      const response = await makeRequest(`/nfse/${nfseSelecionada.referencia}`, {
        method: 'DELETE',
        body: JSON.stringify(dadosCancelamento)
      });

      console.log('📤 Resposta do cancelamento:', response);

      // Salvar no histórico de cancelamentos
      const { error: historicoError } = await supabase
        .from('historico_cancelamentos')
        .insert({
          referencia: nfseSelecionada.referencia,
          numero_nfse: nfseSelecionada.numero_nfse,
          motivo: motivoCancelamento,
          justificativa: observacaoCancelamento,
          data_cancelamento: new Date().toISOString(),
          status: response?.status === 'cancelado' ? 'cancelado' : 'processando',
          mensagem_erro: response?.mensagem_erro || null,
          usuario: 'Sistema', // Aqui você pode pegar o usuário logado
          empresa_id: empresaSelecionada
        });

      if (historicoError) {
        console.error('❌ Erro ao salvar histórico:', historicoError);
      }

      // Atualizar status no Supabase se a NFSe veio de lá
      if (nfseSelecionada.fonte === 'supabase') {
        const { error: updateError } = await supabase
          .from('notas_fiscais')
          .update({
            status: response?.status || 'cancelamento_solicitado',
            updated_at: new Date().toISOString()
          })
          .eq('referencia', nfseSelecionada.referencia);

        if (updateError) {
          console.error('❌ Erro ao atualizar status:', updateError);
        }
      }

      if (response?.status === 'cancelado') {
        toast({
          title: "NFSe cancelada com sucesso",
          description: `A NFSe ${nfseSelecionada.numero_nfse || nfseSelecionada.referencia} foi cancelada`,
        });

        // Limpar formulário
        setNfseSelecionada(null);
        setMotivoCancelamento('');
        setObservacaoCancelamento('');
        setReferenciaBusca('');
        setNumeroNFSeBusca('');

        // Recarregar histórico
        carregarHistoricoCancelamentos();
      } else {
        toast({
          title: "Cancelamento solicitado",
          description: "O cancelamento foi enviado para processamento. Verifique o status posteriormente.",
        });
      }

    } catch (error) {
      console.error('❌ Erro ao cancelar NFSe:', error);

      // Salvar erro no histórico
      const { error: historicoError } = await supabase
        .from('historico_cancelamentos')
        .insert({
          referencia: nfseSelecionada.referencia,
          numero_nfse: nfseSelecionada.numero_nfse,
          motivo: motivoCancelamento,
          justificativa: observacaoCancelamento,
          data_cancelamento: new Date().toISOString(),
          status: 'erro',
          mensagem_erro: error instanceof Error ? error.message : 'Erro desconhecido',
          usuario: 'Sistema',
          empresa_id: empresaSelecionada
        });

      toast({
        variant: "destructive",
        title: "Erro no cancelamento",
        description: "Ocorreu um erro ao tentar cancelar a NFSe. Verifique os dados e tente novamente.",
      });
    } finally {
      setLoadingCancelamento(false);
    }
  };

  // Carregar histórico de cancelamentos
  const carregarHistoricoCancelamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('historico_cancelamentos')
        .select('*')
        .order('data_cancelamento', { ascending: false })
        .limit(50);

      if (error) throw error;

      setHistoricoCancelamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  // Mapear status para badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      case 'processando':
        return <Badge className="bg-yellow-100 text-yellow-800">Processando</Badge>;
      case 'erro':
        return <Badge className="bg-gray-100 text-gray-800">Erro</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Limpar formulário
  const limparFormulario = () => {
    setNfseSelecionada(null);
    setMotivoCancelamento('');
    setObservacaoCancelamento('');
    setReferenciaBusca('');
    setNumeroNFSeBusca('');
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-destructive" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Cancelar NFSe</h1>
              <p className="text-muted-foreground">
                Cancelamento de Notas Fiscais de Serviços Eletrônicas
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowHistorico(true)}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Histórico
            </Button>
            <Button
              variant="outline"
              onClick={carregarHistoricoCancelamentos}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Alert de aviso */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> O cancelamento de NFSe é uma ação irreversível.
            Certifique-se de que realmente deseja prosseguir. Apenas NFSe com status "autorizado" podem ser canceladas.
          </AlertDescription>
        </Alert>

        {/* Formulário de busca e cancelamento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Buscar NFSe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar NFSe para Cancelamento
              </CardTitle>
              <CardDescription>
                Localize a NFSe que deseja cancelar por referência ou número
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa *</Label>
                <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.razao_social} - {empresa.cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referencia">Referência</Label>
                <Input
                  id="referencia"
                  placeholder="Digite a referência da NFSe"
                  value={referenciaBusca}
                  onChange={(e) => setReferenciaBusca(e.target.value)}
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">
                OU
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero-nfse">Número da NFSe</Label>
                <Input
                  id="numero-nfse"
                  placeholder="Digite o número da NFSe"
                  value={numeroNFSeBusca}
                  onChange={(e) => setNumeroNFSeBusca(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={buscarNFSe}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar NFSe
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Dados da NFSe encontrada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileX className="h-5 w-5" />
                Dados da NFSe
              </CardTitle>
              <CardDescription>
                Informações da NFSe selecionada para cancelamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nfseSelecionada ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Referência</Label>
                      <p className="font-medium">{nfseSelecionada.referencia}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Número NFSe</Label>
                      <p className="font-medium">{nfseSelecionada.numero_nfse || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data Emissão</Label>
                      <p className="font-medium">
                        {new Date(nfseSelecionada.data_emissao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Valor dos Serviços</Label>
                      <p className="font-medium text-lg text-green-600">
                        R$ {nfseSelecionada.valor_servicos?.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }) || '0,00'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Prestador de Serviços</Label>
                    <p className="font-medium">
                      {nfseSelecionada.prestador_razao_social || nfseSelecionada.razao_social || '-'}
                    </p>
                    {nfseSelecionada.cnpj_prestador && (
                      <p className="text-sm text-muted-foreground">
                        CNPJ: {nfseSelecionada.cnpj_prestador}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tomador de Serviços</Label>
                    <p className="font-medium">
                      {nfseSelecionada.tomador_razao_social || '-'}
                    </p>
                    {(nfseSelecionada.tomador_cnpj || nfseSelecionada.tomador_cpf) && (
                      <p className="text-sm text-muted-foreground">
                        {nfseSelecionada.tomador_cnpj ? 'CNPJ: ' : 'CPF: '}
                        {nfseSelecionada.tomador_cnpj || nfseSelecionada.tomador_cpf}
                      </p>
                    )}
                  </div>

                  {nfseSelecionada.discriminacao && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Discriminação dos Serviços</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded border">
                        {nfseSelecionada.discriminacao}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-muted-foreground">Status:</Label>
                    <Badge className={
                      nfseSelecionada.status === 'autorizado' ? 'bg-green-100 text-green-800' :
                      nfseSelecionada.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {nfseSelecionada.status}
                    </Badge>
                    <Badge variant={nfseSelecionada.fonte === 'supabase' ? 'default' : 'secondary'}>
                      {nfseSelecionada.fonte === 'supabase' ? 'Local' : 'Focus API'}
                    </Badge>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2 pt-2">
                    {nfseSelecionada.url_pdf && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(nfseSelecionada.url_pdf, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                    )}
                    {nfseSelecionada.url_xml && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(nfseSelecionada.url_xml, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Visualizar XML
                      </Button>
                    )}
                    {!nfseSelecionada.url_pdf && !nfseSelecionada.url_xml && (
                      <p className="text-sm text-muted-foreground italic">
                        Arquivos PDF/XML não disponíveis
                      </p>
                    )}
                  </div>

                  {nfseSelecionada.status === 'autorizado' && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Esta NFSe pode ser cancelada. Preencha o motivo e observação abaixo.
                      </AlertDescription>
                    </Alert>
                  )}

                  {nfseSelecionada.status !== 'autorizado' && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Esta NFSe não pode ser cancelada. Apenas NFSe com status "autorizado" podem ser canceladas.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma NFSe selecionada
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use o formulário ao lado para buscar uma NFSe
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulário de cancelamento */}
        {nfseSelecionada && nfseSelecionada.status === 'autorizado' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Cancelamento da NFSe
              </CardTitle>
              <CardDescription>
                Informe o motivo e observação para o cancelamento da NFSe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo do Cancelamento *</Label>
                <Select value={motivoCancelamento} onValueChange={setMotivoCancelamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="duplicidade_nota">Cancelar Nota Fiscal - Duplicidade da Nota</SelectItem>
                    <SelectItem value="erro_emissao">Cancelar Nota Fiscal - Erro na Emissão</SelectItem>
                    <SelectItem value="servico_nao_prestado">Cancelar Nota Fiscal - Serviço Não Prestado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacao">Observação *</Label>
                <Textarea
                  id="observacao"
                  placeholder="Descreva detalhadamente o motivo do cancelamento (mínimo 15 caracteres)"
                  rows={4}
                  value={observacaoCancelamento}
                  onChange={(e) => setObservacaoCancelamento(e.target.value)}
                />
                <div className="text-xs text-muted-foreground">
                  {observacaoCancelamento.length}/15 caracteres mínimos
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Confirmação necessária:</strong> O cancelamento da NFSe é irreversível.
                  Após confirmado, a nota será cancelada no sistema da prefeitura e não poderá ser revertida.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={cancelarNFSe}
                  disabled={loadingCancelamento || !motivoCancelamento || observacaoCancelamento.length < 15}
                >
                  {loadingCancelamento ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar NFSe
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={limparFormulario}
                  disabled={loadingCancelamento}
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Histórico */}
        <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico de Cancelamentos</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {historicoCancelamentos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Referência</TableHead>
                      <TableHead>Número NFSe</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicoCancelamentos.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {new Date(item.data_cancelamento).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.referencia}
                        </TableCell>
                        <TableCell>
                          {item.numero_nfse || '-'}
                        </TableCell>
                        <TableCell>
                          {item.motivo}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell>
                          {item.usuario}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum cancelamento encontrado
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default CancelarInutilizar;