import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { FileText, Search, Download, ExternalLink, Loader2, Copy, X, Eye } from 'lucide-react';

interface NFSeData {
  cnpj_prestador: string;
  ref: string;
  numero_rps: string;
  serie_rps: string;
  tipo_rps: string;
  status: string;
  numero: string;
  codigo_verificacao: string;
  data_emissao: string;
  url: string;
  caminho_xml_nota_fiscal: string;
  url_danfse: string;
}

interface DadosXML {
  prestador: {
    razao_social: string;
    cnpj: string;
    inscricao_municipal: string;
    endereco: string;
    numero: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  tomador: {
    razao_social: string;
    cnpj_cpf: string;
    endereco: string;
    numero: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
    email: string;
  };
  servico: {
    discriminacao: string;
    valor_servicos: number;
    aliquota: number;
    item_lista_servico: string;
    codigo_cnae: string;
    codigo_tributario_municipio: string;
    quantidade: number;
    valor_unitario: number;
  };
}

export default function ConsultarNFSeSimples() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [referencia, setReferencia] = useState('');
  const [loading, setLoading] = useState(false);
  const [nfseData, setNfseData] = useState<NFSeData | null>(null);
  const [dadosXML, setDadosXML] = useState<DadosXML | null>(null);
  const [loadingXML, setLoadingXML] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  // Função para extrair dados do XML
  const extrairDadosXML = async (caminhoXml: string): Promise<DadosXML | null> => {
    try {
      setLoadingXML(true);
      const response = await fetch(`/api/focusnfe${caminhoXml}`, {
        headers: {
          'Authorization': 'Basic UWlDZ1EwZlFNdTVSRGZFcW5WTVdLcnVSamhKZVBDb2U6'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao obter XML');
      }

      const xmlText = await response.text();
      
      // Função auxiliar para extrair texto de tags XML
      const extrairTexto = (xml: string, tag: string): string => {
        // Tentar várias variações da tag
        const variations = [tag, tag.toLowerCase(), tag.toUpperCase()];

        for (const variation of variations) {
          const regex = new RegExp(`<${variation}[^>]*>([^<]*)</${variation}>`, 'i');
          const match = xml.match(regex);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return '';
      };

      // Função auxiliar para extrair número
      const extrairNumero = (xml: string, tag: string): number => {
        const texto = extrairTexto(xml, tag);
        if (!texto) return 0;

        // Limpar e converter o número
        const numeroLimpo = texto.replace(/[^\d,.-]/g, '').replace(',', '.');
        const numero = parseFloat(numeroLimpo);
        return isNaN(numero) ? 0 : numero;
      };

      // Extrair dados do prestador
      let prestadorMatch = xmlText.match(/<Prestador>(.*?)<\/Prestador>/s);
      let prestadorXml = prestadorMatch ? prestadorMatch[1] : '';
      
      if (!prestadorXml) {
        prestadorMatch = xmlText.match(/<IdentificacaoPrestador>(.*?)<\/IdentificacaoPrestador>/s);
        prestadorXml = prestadorMatch ? prestadorMatch[1] : '';
      }

      // Extrair endereço do prestador
      const prestadorEnderecoMatch = prestadorXml.match(/<Endereco>(.*?)<\/Endereco>/s);
      const prestadorEnderecoXml = prestadorEnderecoMatch ? prestadorEnderecoMatch[1] : '';

      const prestador = {
        razao_social: extrairTexto(prestadorXml, 'RazaoSocial') || extrairTexto(prestadorXml, 'NomeFantasia'),
        cnpj: extrairTexto(prestadorXml, 'Cnpj') || extrairTexto(prestadorXml, 'CpfCnpj'),
        inscricao_municipal: extrairTexto(prestadorXml, 'InscricaoMunicipal'),
        endereco: extrairTexto(prestadorEnderecoXml, 'Endereco') || extrairTexto(prestadorEnderecoXml, 'Logradouro'),
        numero: extrairTexto(prestadorEnderecoXml, 'Numero'),
        bairro: extrairTexto(prestadorEnderecoXml, 'Bairro'),
        municipio: extrairTexto(prestadorEnderecoXml, 'Cidade') || extrairTexto(prestadorEnderecoXml, 'Municipio'),
        uf: extrairTexto(prestadorEnderecoXml, 'Uf'),
        cep: extrairTexto(prestadorEnderecoXml, 'Cep')
      };

      // Extrair dados do tomador
      const tomadorMatch = xmlText.match(/<Tomador>(.*?)<\/Tomador>/s);
      const tomadorXml = tomadorMatch ? tomadorMatch[1] : '';

      // Extrair endereço do tomador
      const tomadorEnderecoMatch = tomadorXml.match(/<Endereco>(.*?)<\/Endereco>/s);
      const tomadorEnderecoXml = tomadorEnderecoMatch ? tomadorEnderecoMatch[1] : '';

      const tomador = {
        razao_social: extrairTexto(tomadorXml, 'RazaoSocial') ||
                     extrairTexto(tomadorXml, 'NomeFantasia') ||
                     extrairTexto(tomadorXml, 'Nome'),
        cnpj_cpf: extrairTexto(tomadorXml, 'Cnpj') ||
                 extrairTexto(tomadorXml, 'Cpf') ||
                 extrairTexto(tomadorXml, 'CpfCnpj') ||
                 extrairTexto(tomadorXml, 'Documento'),
        endereco: extrairTexto(tomadorEnderecoXml, 'Endereco') ||
                 extrairTexto(tomadorEnderecoXml, 'Logradouro') ||
                 extrairTexto(tomadorEnderecoXml, 'Rua'),
        numero: extrairTexto(tomadorEnderecoXml, 'Numero') ||
               extrairTexto(tomadorEnderecoXml, 'NumeroEndereco'),
        bairro: extrairTexto(tomadorEnderecoXml, 'Bairro'),
        municipio: extrairTexto(tomadorEnderecoXml, 'Cidade') ||
                  extrairTexto(tomadorEnderecoXml, 'Municipio') ||
                  extrairTexto(tomadorEnderecoXml, 'NomeMunicipio'),
        uf: extrairTexto(tomadorEnderecoXml, 'Uf') ||
           extrairTexto(tomadorEnderecoXml, 'Estado'),
        cep: extrairTexto(tomadorEnderecoXml, 'Cep') ||
            extrairTexto(tomadorEnderecoXml, 'CodigoPostal'),
        email: extrairTexto(tomadorXml, 'Email') ||
              extrairTexto(tomadorXml, 'EnderecoEletronico')
      };

      // Extrair dados do serviço
      const servicoMatch = xmlText.match(/<Servico>(.*?)<\/Servico>/s);
      const servicoXml = servicoMatch ? servicoMatch[1] : '';

      const servico = {
        discriminacao: extrairTexto(servicoXml, 'Discriminacao') ||
                      extrairTexto(servicoXml, 'DescricaoServico') ||
                      extrairTexto(servicoXml, 'Descricao'),
        valor_servicos: extrairNumero(servicoXml, 'ValorServicos') ||
                       extrairNumero(servicoXml, 'ValorTotal') ||
                       extrairNumero(servicoXml, 'Valor'),
        aliquota: extrairNumero(servicoXml, 'Aliquota') ||
                 extrairNumero(servicoXml, 'AliquotaServicos') ||
                 extrairNumero(servicoXml, 'PercentualAliquota'),
        item_lista_servico: extrairTexto(servicoXml, 'ItemListaServico') ||
                           extrairTexto(servicoXml, 'ItemLista') ||
                           extrairTexto(servicoXml, 'CodigoItemListaServico'),
        codigo_cnae: extrairTexto(servicoXml, 'CodigoCnae') ||
                    extrairTexto(servicoXml, 'Cnae'),
        codigo_tributario_municipio: extrairTexto(servicoXml, 'CodigoTributacaoMunicipio') ||
                                   extrairTexto(servicoXml, 'CodigoTributario') ||
                                   extrairTexto(servicoXml, 'CodigoServico'),
        quantidade: extrairNumero(servicoXml, 'Quantidade') || 1,
        valor_unitario: extrairNumero(servicoXml, 'ValorUnitario') ||
                       extrairNumero(servicoXml, 'ValorServicos') ||
                       extrairNumero(servicoXml, 'Valor')
      };

      console.log('📄 Dados extraídos do XML:', {
        prestador,
        tomador,
        servico,
        xmlLength: xmlText.length
      });

      return { prestador, tomador, servico };
    } catch (error) {
      console.error('Erro ao extrair dados do XML:', error);
      return null;
    } finally {
      setLoadingXML(false);
    }
  };

  const consultarNFSe = async () => {
    if (!referencia.trim()) {
      toast({
        variant: "destructive",
        title: "Referência obrigatória",
        description: "Informe a referência da NFSe para consultar.",
      });
      return;
    }

    setLoading(true);
    setNfseData(null);
    setDadosXML(null);

    try {
      const response = await fetch(`/api/focusnfe/v2/nfse/${referencia}`, {
        headers: {
          'Authorization': 'Basic UWlDZ1EwZlFNdTVSRGZFcW5WTVdLcnVSamhKZVBDb2U6'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNfseData(data);
        
        // Extrair dados do XML se disponível
        if (data.caminho_xml_nota_fiscal) {
          const xmlData = await extrairDadosXML(data.caminho_xml_nota_fiscal);
          setDadosXML(xmlData);
        }
        
        toast({
          title: "NFSe encontrada",
          description: `NFSe ${data.numero || referencia} consultada com sucesso!`,
        });
      } else if (response.status === 404) {
        toast({
          variant: "destructive",
          title: "NFSe não encontrada",
          description: "NFSe não encontrada. Verifique a referência e tente novamente.",
        });
      } else if (response.status === 401 || response.status === 403) {
        toast({
          variant: "destructive",
          title: "Erro de autenticação",
          description: "Erro de autenticação com a Focus NFe. Verifique o token de acesso.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro na consulta');
      }
    } catch (error) {
      console.error('Erro ao consultar NFSe:', error);
      toast({
        variant: "destructive",
        title: "Erro na consulta",
        description: error instanceof Error ? error.message : "Não foi possível consultar a NFSe.",
      });
    } finally {
      setLoading(false);
    }
  };

  const baixarPDF = () => {
    if (nfseData?.url_danfse) {
      window.open(nfseData.url_danfse, '_blank');
    }
  };

  const baixarXML = async () => {
    if (!nfseData?.caminho_xml_nota_fiscal) return;

    try {
      const response = await fetch(`/api/focusnfe${nfseData.caminho_xml_nota_fiscal}`, {
        headers: {
          'Authorization': 'Basic UWlDZ1EwZlFNdTVSRGZFcW5WTVdLcnVSamhKZVBDb2U6'
        }
      });

      if (response.ok) {
        const xmlContent = await response.text();
        const blob = new Blob([xmlContent], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NFSe_${nfseData.numero || nfseData.ref}.xml`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "XML baixado",
          description: "O arquivo XML foi baixado com sucesso.",
        });
      } else {
        throw new Error('Erro ao baixar XML');
      }
    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      toast({
        variant: "destructive",
        title: "Erro ao baixar XML",
        description: "Não foi possível baixar o arquivo XML.",
      });
    }
  };

  const duplicarNFSe = () => {
    if (!nfseData || !dadosXML) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Não é possível duplicar sem os dados completos da NFSe.",
      });
      return;
    }

    // Preparar dados para preencher na página de emissão
    const dadosParaDuplicar = {
      // Dados do tomador
      tipo_documento: dadosXML.tomador.cnpj_cpf.length === 11 ? 'cpf' : 'cnpj',
      documento_tomador: dadosXML.tomador.cnpj_cpf,
      razao_social_tomador: dadosXML.tomador.razao_social,
      email_tomador: dadosXML.tomador.email,
      logradouro_tomador: dadosXML.tomador.endereco,
      numero_tomador: dadosXML.tomador.numero,
      bairro_tomador: dadosXML.tomador.bairro,
      municipio_tomador: dadosXML.tomador.municipio,
      uf_tomador: dadosXML.tomador.uf,
      cep_tomador: dadosXML.tomador.cep,

      // Dados do serviço
      discriminacao: dadosXML.servico.discriminacao,
      valor_servicos: dadosXML.servico.valor_servicos,
      aliquota: dadosXML.servico.aliquota,
      aliquota_iss: dadosXML.servico.aliquota, // Mesmo valor da alíquota
      item_lista_servico: dadosXML.servico.item_lista_servico,
      codigo_tributario_municipio: dadosXML.servico.codigo_tributario_municipio || '',

      // Valores extraídos ou padrão
      quantidade: dadosXML.servico.quantidade,
      valor_unitario: dadosXML.servico.valor_unitario,
      valor_iss: (dadosXML.servico.valor_servicos * dadosXML.servico.aliquota) / 100,
      iss_retido: false,

      // Configurações padrão
      natureza_operacao: '1', // Tributação no município
      regime_tributacao: '1', // Microempresa municipal
      optante_simples_nacional: false,
      incentivador_cultural: false,
      enviar_email: true,
      gerar_pdf: true
    };

    console.log('🔄 Dados extraídos do XML para duplicação:', {
      dadosXML,
      dadosParaDuplicar
    });

    // Verificar se todos os campos obrigatórios estão preenchidos
    const camposObrigatorios = [
      'documento_tomador',
      'razao_social_tomador',
      'discriminacao',
      'valor_servicos'
    ];

    const camposFaltando = camposObrigatorios.filter(campo =>
      !dadosParaDuplicar[campo as keyof typeof dadosParaDuplicar] ||
      dadosParaDuplicar[campo as keyof typeof dadosParaDuplicar] === ''
    );

    if (camposFaltando.length > 0) {
      console.warn('⚠️ Campos obrigatórios faltando:', camposFaltando);
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: `Campos faltando: ${camposFaltando.join(', ')}. Alguns dados podem não ser preenchidos.`,
      });
    }

    // Armazenar dados no localStorage para preencher na página de emissão
    localStorage.setItem('dadosParaDuplicar', JSON.stringify(dadosParaDuplicar));
    
    toast({
      title: "Redirecionando...",
      description: "Abrindo página de emissão com dados preenchidos.",
    });

    // Navegar para página de emissão
    navigate('/notas/nfse');
  };

  const cancelarNFSe = async () => {
    if (!nfseData) return;

    const confirmacao = confirm(
      `Deseja realmente cancelar esta NFSe?\n\n` +
      `Referência: ${nfseData.ref}\n` +
      `Número: ${nfseData.numero}\n\n` +
      `Esta ação não pode ser desfeita.`
    );
    
    if (!confirmacao) {
      return;
    }

    setCancelando(true);

    try {
      const response = await fetch(`/api/focusnfe/v2/nfse/${nfseData.ref}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic UWlDZ1EwZlFNdTVSRGZFcW5WTVdLcnVSamhKZVBDb2U6'
        }
      });

      if (response.ok) {
        toast({
          title: "NFSe cancelada",
          description: `NFSe ${nfseData.numero} foi cancelada com sucesso.`,
        });
        
        // Atualizar status da NFSe
        setNfseData(prev => prev ? { ...prev, status: 'cancelado' } : null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cancelar NFSe');
      }
    } catch (error) {
      console.error('Erro ao cancelar NFSe:', error);
      toast({
        variant: "destructive",
        title: "Erro ao cancelar NFSe",
        description: error instanceof Error ? error.message : "Não foi possível cancelar a NFSe.",
      });
    } finally {
      setCancelando(false);
    }
  };

  const formatarData = (dataISO: string) => {
    try {
      return new Date(dataISO).toLocaleString('pt-BR');
    } catch {
      return dataISO;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'autorizado': {
        color: 'bg-green-100 text-green-700',
        label: 'Autorizado'
      },
      'processando': {
        color: 'bg-yellow-100 text-yellow-700',
        label: 'Processando'
      },
      'erro': {
        color: 'bg-red-100 text-red-700',
        label: 'Erro'
      },
      'cancelado': {
        color: 'bg-gray-100 text-gray-700',
        label: 'Cancelado'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: 'bg-gray-100 text-gray-700',
      label: status
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <TooltipProvider>
      <Layout>
        <div className="p-4 space-y-4">
          {/* Header Compacto */}
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Consultar NFSe</h1>
          </div>

          {/* Formulário de Consulta Compacto */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Digite a referência da NFSe (ex: 616529A)"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && consultarNFSe()}
                    className="h-9"
                  />
                </div>
                <Button
                  onClick={consultarNFSe}
                  disabled={loading}
                  size="sm"
                  className="px-4"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-1" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultado da Consulta - Bloco Único Compacto */}
          {nfseData && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {/* Informações Principais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Referência</Label>
                    <p className="text-sm font-semibold">{nfseData.ref}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Número NFSe</Label>
                    <p className="text-sm font-mono">{nfseData.numero}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(nfseData.status)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Data de Emissão</Label>
                    <p className="text-sm">{formatarData(nfseData.data_emissao)}</p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center gap-2 pt-3 border-t">
                  {/* Visualizar Informações */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={baixarPDF}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar PDF (DANFSE)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={baixarXML}>
                        <Download className="h-4 w-4 mr-2" />
                        Visualizar XML
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Duplicar */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={duplicarNFSe}
                        disabled={!dadosXML}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Duplicar NFSe</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Cancelar */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={cancelarNFSe}
                        disabled={cancelando || nfseData.status === 'cancelado'}
                        className="text-destructive hover:text-destructive"
                      >
                        {cancelando ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cancelar NFSe</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Loading XML */}
                  {loadingXML && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Carregando dados...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </TooltipProvider>
  );
}
