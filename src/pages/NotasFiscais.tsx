import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, FileText, Download, Eye, Calendar, ChevronLeft, ChevronRight, ExternalLink, Mail } from 'lucide-react';
import { useNFSeConsulta, NFSeConsultaFiltros, NFSeItem } from '@/hooks/useNFSeConsulta';
import { useFocusNFeAPI } from '@/hooks/useFocusNFeAPI';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FiltrosPesquisa {
  empresa_id: string;
  cnpj_tomador: string;
  referencia: string;
  numero_nfse: string;
  numero_rps: string;
  status: string;
  data_inicio: string;
  data_fim: string;
  periodo: string;
  valor_min: string;
  valor_max: string;
}

// Função para mapear status do banco para status da interface
const mapearStatusNFSe = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'processando_autorizacao': 'PROCESSANDO',
    'processando': 'PROCESSANDO',
    'autorizado': 'AUTORIZADO',
    'erro_autorizacao': 'ERRO',
    'erro': 'ERRO',
    'rejeitado': 'REJEITADO',
    'cancelado': 'CANCELADO'
  };
  return statusMap[status] || status.toUpperCase();
};

// Função para obter cor do badge baseada no status
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'autorizado':
      return 'bg-green-100 text-green-800';
    case 'cancelado':
      return 'bg-red-100 text-red-800';
    case 'erro':
    case 'rejeitado':
      return 'bg-red-100 text-red-800';
    case 'processando':
    case 'processando_autorizacao':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const NotasFiscais = () => {
  const [filtros, setFiltros] = useState<FiltrosPesquisa>({
    empresa_id: '',
    cnpj_tomador: '',
    referencia: '',
    numero_nfse: '',
    numero_rps: '',
    status: '',
    data_inicio: '',
    data_fim: '',
    periodo: 'ultimo_mes',
    valor_min: '',
    valor_max: ''
  });

  const [nfseItems, setNfseItems] = useState<NFSeItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedNFSe, setSelectedNFSe] = useState<NFSeItem | null>(null);

  const { consultarHibrida, loading } = useNFSeConsulta();
  const { makeRequest } = useFocusNFeAPI();

  // Função para exportar dados para CSV
  const exportarCSV = (dados: NFSeItem[]) => {
    const headers = [
      'Referência',
      'Empresa',
      'CNPJ Prestador',
      'Data Emissão',
      'Número NFSe',
      'Número RPS',
      'Tomador',
      'CNPJ/CPF Tomador',
      'Valor Serviços',
      'Status',
      'Fonte'
    ];

    const csvContent = [
      headers.join(','),
      ...dados.map(nfse => [
        nfse.referencia,
        nfse.razao_social || nfse.prestador_razao_social || '',
        nfse.cnpj_prestador,
        new Date(nfse.data_emissao).toLocaleDateString('pt-BR'),
        nfse.numero_nfse || '',
        nfse.rps_numero || '',
        nfse.tomador_razao_social || '',
        nfse.tomador_cnpj || nfse.tomador_cpf || '',
        nfse.valor_servicos?.toFixed(2) || '0,00',
        mapearStatusNFSe(nfse.status),
        nfse.fonte === 'supabase' ? 'Local' : 'API'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `nfse_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para reenviar NFSe por email
  const reenviarPorEmail = async (nfse: NFSeItem) => {
    try {
      // Implementar reenvio por email via API Focus NFe
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "O reenvio por email será implementado em breve.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no reenvio",
        description: "Não foi possível reenviar a NFSe por email.",
      });
    }
  };

  // Função para carregar empresas manualmente (removido useEffect automático)
  const carregarEmpresasManual = async () => {
    try {
      console.log('🏢 Carregando empresas do Supabase (não da Focus NFe)...');
      // Usar buscarEmpresasSupabase em vez de makeRequest para evitar chamadas à Focus NFe
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('razao_social');

      if (error) {
        console.error('❌ Erro ao buscar empresas:', error);
        throw error;
      }

      const empresasArray = data || [];
      setEmpresas(empresasArray.map(emp => ({
        id: emp.id,
        nome: emp.razao_social,
        cnpj_cpf: emp.cnpj,
        ultima_emissao: null,
        certificado_status: null,
        actions: []
      })));

      console.log('✅ Empresas carregadas do Supabase:', empresasArray.length);
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar empresas",
        description: "Não foi possível carregar as empresas do banco de dados",
      });
    }
  };

  // Carregar empresas apenas no carregamento inicial da página
  useEffect(() => {
    carregarEmpresasManual();
  }, []); // Sem dependências para executar apenas uma vez

  useEffect(() => {
    const hoje = new Date();
    let dataInicio = new Date();

    switch (filtros.periodo) {
      case 'hoje':
        dataInicio = hoje;
        break;
      case 'ultima_semana':
        dataInicio.setDate(hoje.getDate() - 7);
        break;
      case 'ultimo_mes':
        dataInicio.setMonth(hoje.getMonth() - 1);
        break;
      case 'ultimos_3_meses':
        dataInicio.setMonth(hoje.getMonth() - 3);
        break;
      case 'personalizado':
        return;
    }

    setFiltros(prev => ({
      ...prev,
      dataInicio: dataInicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0]
    }));
  }, [filtros.periodo]);

  const handleFiltroChange = (campo: keyof FiltrosPesquisa, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      empresa_id: '',
      cnpj_tomador: '',
      referencia: '',
      numero_nfse: '',
      numero_rps: '',
      status: '',
      data_inicio: '',
      data_fim: '',
      periodo: 'ultimo_mes',
      valor_min: '',
      valor_max: ''
    });
    setNfseItems([]);
    setCurrentPage(1);
    setTotalPages(0);
    setTotalItems(0);
  };

  const pesquisarRequisicoes = async () => {
    setLoading(true);
    try {
      console.log('🔍 Iniciando pesquisa de NFSe...');

      // Dados de exemplo para demonstração (já que a tabela nfse_history não existe ainda)
      const dadosExemplo: Requisicao[] = [
        {
          id: '1',
          emitente: 'Azeredo Assessoria Empresarial Sorocaba LTDA',
          dataEmissao: '28/07/2025 16:49',
          numero: '14810',
          destinatario: '40.341.982 CARLOS ROBERTO LAURIANO',
          valor: 10.00,
          referencia: '474',
          status: 'CANCELADO'
        },
        {
          id: '2',
          emitente: 'LEONARDO ALVES GUSMAO 92117167820',
          dataEmissao: '28/07/2025 13:37',
          numero: '208',
          destinatario: 'SCHAEFFLER BRASIL LTDA.',
          valor: 5000.00,
          referencia: '473',
          status: 'AUTORIZADO'
        },
        {
          id: '3',
          emitente: 'LEONARDO ALVES GUSMAO 92117167820',
          dataEmissao: '28/07/2025 12:02',
          numero: '207',
          destinatario: 'SCHAEFFLER BRASIL LTDA.',
          valor: 10.00,
          referencia: '472',
          status: 'CANCELADO'
        },
        {
          id: '4',
          emitente: 'DNA SOLDAGEM LTDA',
          dataEmissao: '25/07/2025 11:19',
          numero: '170',
          destinatario: 'SAT SISTEMAS DE AUTOMACAO E TECNOLOGIA LTDA',
          valor: 555.00,
          referencia: '471',
          status: 'AUTORIZADO'
        },
        {
          id: '5',
          emitente: 'DNA SOLDAGEM LTDA',
          dataEmissao: '24/07/2025 17:17',
          numero: '258',
          destinatario: 'ASSEMF ASSESSORIA EMPRESARIAL SOROCABA LTDA',
          valor: 10.00,
          referencia: '469',
          status: 'CANCELADO'
        }
      ];

      let dadosFiltrados = dadosExemplo;

      // Aplicar filtros
      if (filtros.referencia) {
        dadosFiltrados = dadosFiltrados.filter(req =>
          req.referencia.includes(filtros.referencia)
        );
      }

      if (filtros.numero) {
        dadosFiltrados = dadosFiltrados.filter(req =>
          req.numero.includes(filtros.numero)
        );
      }

      // Filtro por data
      if (filtros.dataInicio || filtros.dataFim) {
        dadosFiltrados = dadosFiltrados.filter(req => {
          // Converter data de emissão para formato comparável (DD/MM/YYYY -> YYYY-MM-DD)
          const [dataParte] = req.dataEmissao.split(' ');
          const [dia, mes, ano] = dataParte.split('/');
          const dataEmissaoFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

          let dentroDoIntervalo = true;

          if (filtros.dataInicio) {
            dentroDoIntervalo = dentroDoIntervalo && dataEmissaoFormatada >= filtros.dataInicio;
          }

          if (filtros.dataFim) {
            dentroDoIntervalo = dentroDoIntervalo && dataEmissaoFormatada <= filtros.dataFim;
          }

          return dentroDoIntervalo;
        });
      }

      console.log('📋 NFSe filtradas:', dadosFiltrados);

      setRequisicoes(dadosFiltrados);

      toast({
        title: "Pesquisa realizada",
        description: `${dadosFiltrados.length} requisições encontradas`,
      });
    } catch (error) {
      console.error('Erro ao pesquisar requisições:', error);
      toast({
        title: "Erro na pesquisa",
        description: "Não foi possível realizar a pesquisa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Nova função de pesquisa híbrida
  const pesquisarNFSe = async (page: number = 1) => {
    try {
      console.log('🔍 Iniciando pesquisa híbrida de NFSe...');

      // Preparar filtros para a consulta
      const filtrosConsulta: NFSeConsultaFiltros = {
        page,
        limit: 20
      };

      if (filtros.empresa_id) {
        filtrosConsulta.empresa_id = filtros.empresa_id;
      }

      if (filtros.cnpj_tomador) {
        filtrosConsulta.cnpj_tomador = filtros.cnpj_tomador;
      }

      if (filtros.referencia) {
        filtrosConsulta.referencia = filtros.referencia;
      }

      if (filtros.numero_nfse) {
        filtrosConsulta.numero_nfse = filtros.numero_nfse;
      }

      if (filtros.numero_rps) {
        filtrosConsulta.numero_rps = filtros.numero_rps;
      }

      if (filtros.status && filtros.status !== 'todos') {
        filtrosConsulta.status = filtros.status;
      }

      if (filtros.data_inicio) {
        filtrosConsulta.data_inicio = filtros.data_inicio;
      }

      if (filtros.data_fim) {
        filtrosConsulta.data_fim = filtros.data_fim;
      }

      if (filtros.valor_min) {
        filtrosConsulta.valor_min = parseFloat(filtros.valor_min);
      }

      if (filtros.valor_max) {
        filtrosConsulta.valor_max = parseFloat(filtros.valor_max);
      }

      const resultado = await consultarHibrida(filtrosConsulta);

      setNfseItems(resultado.items);
      setCurrentPage(resultado.page);
      setTotalPages(resultado.totalPages);
      setTotalItems(resultado.total);

      toast({
        title: "Pesquisa concluída",
        description: `${resultado.total} NFSe encontradas`,
      });
    } catch (error) {
      console.error('❌ Erro na pesquisa:', error);
      toast({
        variant: "destructive",
        title: "Erro na pesquisa",
        description: "Ocorreu um erro ao pesquisar as NFSe. Tente novamente.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'AUTORIZADO': { variant: 'default' as const, color: 'bg-blue-500', text: 'AUTORIZADO' },
      'CANCELADO': { variant: 'secondary' as const, color: 'bg-gray-500', text: 'CANCELADO' },
      'ERRO': { variant: 'destructive' as const, color: 'bg-red-500', text: 'ERRO' },
      'PROCESSANDO': { variant: 'outline' as const, color: 'bg-yellow-500', text: 'PROCESSANDO' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ERRO;

    return (
      <Badge variant={config.variant} className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notas Fiscais</h1>
            <p className="text-muted-foreground">
              Gerencie todas as notas fiscais emitidas
            </p>
          </div>
        </div>

        {/* Pesquisa de Requisições */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Pesquisa de Requisições
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Select
                    value={filtros.empresa}
                    onValueChange={(value) => handleFiltroChange('empresa', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as empresas</SelectItem>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id.toString()}>
                          {empresa.nome || empresa.razao_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referencia">Referência</Label>
                  <Input
                    id="referencia"
                    placeholder="Digite a referência"
                    value={filtros.referencia}
                    onChange={(e) => handleFiltroChange('referencia', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero_nfse">Número NFSe</Label>
                  <Input
                    id="numero_nfse"
                    placeholder="Digite o número da NFSe"
                    value={filtros.numero_nfse}
                    onChange={(e) => handleFiltroChange('numero_nfse', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero_rps">Número RPS</Label>
                  <Input
                    id="numero_rps"
                    placeholder="Digite o número RPS"
                    value={filtros.numero_rps}
                    onChange={(e) => handleFiltroChange('numero_rps', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj_tomador">CNPJ/CPF Tomador</Label>
                  <Input
                    id="cnpj_tomador"
                    placeholder="Digite o CNPJ/CPF do tomador"
                    value={filtros.cnpj_tomador}
                    onChange={(e) => handleFiltroChange('cnpj_tomador', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filtros.status}
                    onValueChange={(value) => handleFiltroChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="autorizado">Autorizado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="erro">Erro</SelectItem>
                      <SelectItem value="rejeitado">Rejeitado</SelectItem>
                      <SelectItem value="processando">Processando</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_min">Valor Mínimo</Label>
                  <Input
                    id="valor_min"
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={filtros.valor_min}
                    onChange={(e) => handleFiltroChange('valor_min', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_max">Valor Máximo</Label>
                  <Input
                    id="valor_max"
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={filtros.valor_max}
                    onChange={(e) => handleFiltroChange('valor_max', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodo">Período</Label>
                  <Select
                    value={filtros.periodo}
                    onValueChange={(value) => handleFiltroChange('periodo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="ultima_semana">Última semana</SelectItem>
                      <SelectItem value="ultimo_mes">Último mês</SelectItem>
                      <SelectItem value="ultimos_3_meses">Últimos 3 meses</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data Início</Label>
                  <div className="relative">
                    <Input
                      id="data_inicio"
                      type="date"
                      value={filtros.data_inicio}
                      onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
                      disabled={filtros.periodo !== 'personalizado'}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_fim">Data Fim</Label>
                  <div className="relative">
                    <Input
                      id="data_fim"
                      type="date"
                      value={filtros.data_fim}
                      onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
                      disabled={filtros.periodo !== 'personalizado'}
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={limparFiltros}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  LIMPAR FILTROS
                </Button>
                <Button
                  onClick={() => pesquisarNFSe(1)}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? 'PESQUISANDO...' : 'PESQUISAR'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          {nfseItems.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    NFSe Encontradas ({totalItems})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportarCSV(nfseItems)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Data Emissão</TableHead>
                        <TableHead>NFSe</TableHead>
                        <TableHead>RPS</TableHead>
                        <TableHead>Tomador</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Fonte</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nfseItems.map((nfse, index) => (
                        <TableRow key={nfse.id}>
                          <TableCell>
                            <div className="font-medium text-sm">
                              {nfse.razao_social || nfse.prestador_razao_social}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {nfse.cnpj_prestador}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(nfse.data_emissao).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {nfse.numero_nfse || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {nfse.rps_numero || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{nfse.tomador_razao_social || '-'}</div>
                            <div className="text-xs text-muted-foreground">
                              {nfse.tomador_cnpj || nfse.tomador_cpf || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            R$ {nfse.valor_servicos?.toFixed(2) || '0,00'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(nfse.status)}>
                              {mapearStatusNFSe(nfse.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={nfse.fonte === 'supabase' ? 'default' : 'secondary'}>
                              {nfse.fonte === 'supabase' ? 'Local' : 'API'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                title="Visualizar Detalhes"
                                onClick={() => setSelectedNFSe(nfse)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {nfse.url_pdf && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  title="Download PDF"
                                  onClick={() => window.open(nfse.url_pdf, '_blank')}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              {nfse.url_xml && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  title="Download XML"
                                  onClick={() => window.open(nfse.url_xml, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                title="Reenviar por Email"
                                onClick={() => reenviarPorEmail(nfse)}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages} ({totalItems} itens)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pesquisarNFSe(currentPage - 1)}
                        disabled={currentPage <= 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pesquisarNFSe(currentPage + 1)}
                        disabled={currentPage >= totalPages || loading}
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 mb-4 text-muted-foreground">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Realize uma busca para visualizar os resultados
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use os filtros acima para encontrar as requisições desejadas
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Detalhes da NFSe */}
      {selectedNFSe && (
        <Dialog open={!!selectedNFSe} onOpenChange={() => setSelectedNFSe(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Detalhes da NFSe - {selectedNFSe.numero_nfse || selectedNFSe.referencia}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Prestador</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Razão Social:</strong> {selectedNFSe.razao_social || selectedNFSe.prestador_razao_social}</div>
                    <div><strong>CNPJ:</strong> {selectedNFSe.cnpj_prestador}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Tomador</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Nome/Razão Social:</strong> {selectedNFSe.tomador_razao_social || '-'}</div>
                    <div><strong>CNPJ/CPF:</strong> {selectedNFSe.tomador_cnpj || selectedNFSe.tomador_cpf || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Informações da NFSe */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">NFSe</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Número:</strong> {selectedNFSe.numero_nfse || '-'}</div>
                    <div><strong>RPS:</strong> {selectedNFSe.rps_numero || '-'}</div>
                    <div><strong>Referência:</strong> {selectedNFSe.referencia}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Valores</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Valor Serviços:</strong> R$ {selectedNFSe.valor_servicos?.toFixed(2) || '0,00'}</div>
                    <div><strong>Status:</strong>
                      <Badge className={`ml-2 ${getStatusColor(selectedNFSe.status)}`}>
                        {mapearStatusNFSe(selectedNFSe.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Datas</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Emissão:</strong> {new Date(selectedNFSe.data_emissao).toLocaleDateString('pt-BR')}</div>
                    <div><strong>Fonte:</strong>
                      <Badge variant={selectedNFSe.fonte === 'supabase' ? 'default' : 'secondary'} className="ml-2">
                        {selectedNFSe.fonte === 'supabase' ? 'Local' : 'API Focus NFe'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrição do Serviço */}
              {selectedNFSe.discriminacao && (
                <div>
                  <h4 className="font-semibold mb-2">Descrição do Serviço</h4>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    {selectedNFSe.discriminacao}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedNFSe.url_pdf && (
                  <Button
                    onClick={() => window.open(selectedNFSe.url_pdf, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                )}

                {selectedNFSe.url_xml && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedNFSe.url_xml, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Download XML
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => reenviarPorEmail(selectedNFSe)}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Reenviar por Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
};

export default NotasFiscais;