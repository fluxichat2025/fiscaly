import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useFocusNFeAPI } from '@/hooks/useFocusNFeAPI';
import { useNFSeMonitoring } from '@/hooks/useNFSeMonitoring';
import { FileText, Building, Calculator, Loader2, CheckCircle, AlertCircle, User, Briefcase, Settings, Clock, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface NFSeFormData {
  // Dados do Prestador (empresa)
  empresa_id: string;
  cnpj_prestador: string;
  inscricao_municipal: string;
  codigo_municipio_prestador: string;

  // Dados do Tomador
  tipo_documento: 'cpf' | 'cnpj';
  documento_tomador: string;
  razao_social_tomador: string;
  email_tomador: string;
  telefone_tomador?: string;
  logradouro_tomador: string;
  numero_tomador: string;
  complemento_tomador?: string;
  bairro_tomador: string;
  municipio_tomador: string;
  codigo_municipio_tomador: string;
  uf_tomador: string;
  cep_tomador: string;

  // Dados do Serviço
  discriminacao: string;
  item_lista_servico: string;
  codigo_tributario_municipio: string;
  quantidade: number;
  valor_unitario: number;
  valor_servicos: number;
  aliquota: number;
  aliquota_iss: number; // Para compatibilidade com cálculos
  valor_iss: number;
  iss_retido: boolean;

  // Configurações da NFSe
  natureza_operacao: string;
  regime_tributacao: string;
  optante_simples_nacional: boolean;
  incentivador_cultural: boolean;

  // Configurações de envio
  enviar_email: boolean;
  gerar_pdf: boolean;
}

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  inscricao_municipal: string;
  municipio: string;
  uf: string;
}

const EmitirNFSe = () => {
  const { toast } = useToast();
  const {
    emitirNFSe,
    consultarNFSe,
    listarEmpresas,
    getEmpresa,
    buscarEmpresasSupabase,
    buscarEmpresaPorId,
    consultarCNPJ,
    buscarTomadores,
    salvarTomador,
    atualizarTomador,
    sincronizarEmpresasFocusNFe,
    loading: loadingFocus
  } = useFocusNFeAPI();

  // Hook para monitoramento automático da NFSe
  const {
    monitoringStatus,
    startMonitoring,
    stopMonitoring,
    isMonitoring
  } = useNFSeMonitoring({
    onComplete: (nfseData) => {
      console.log('✅ NFSe processada com sucesso:', nfseData);
      setNfseStatus('authorized');
      setIsLoading(false);

      // Limpar formulário após sucesso
      reset();
      setNfseReferencia('');
      setActiveTab('prestador');
    },
    onError: (error) => {
      console.error('❌ Erro no monitoramento:', error);
      setNfseStatus('error');
      setIsLoading(false);
    }
  });

  const [activeTab, setActiveTab] = useState('prestador');
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>('');
  const [empresaAtual, setEmpresaAtual] = useState<any>(null);
  const [tomadores, setTomadores] = useState<any[]>([]);
  const [tomadorSelecionado, setTomadorSelecionado] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  const [nfseStatus, setNfseStatus] = useState<'idle' | 'processing' | 'authorized' | 'error'>('idle');
  const [nfseReferencia, setNfseReferencia] = useState<string>('');
  const [dadosPreenchidosManualmente, setDadosPreenchidosManualmente] = useState(false);
  const [showCadastroTomador, setShowCadastroTomador] = useState(false);
  const [empresaCarregada, setEmpresaCarregada] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<NFSeFormData>({
    defaultValues: {
      tipo_documento: 'cpf',
      quantidade: 1,
      valor_unitario: 0,
      valor_servicos: 0,
      aliquota: 5.0,
      aliquota_iss: 5.0,
      valor_iss: 0,
      iss_retido: false,
      natureza_operacao: '1',
      regime_tributacao: '1',
      optante_simples_nacional: true,
      incentivador_cultural: false,
      enviar_email: true,
      gerar_pdf: true
    }
  });

  const watchedValues = watch();

  // Função para salvar NFSe completa no Supabase
  const salvarNFSeCompleta = async (referencia: string, nfseData: any, empresaId: string) => {
    try {
      console.log('💾 Salvando NFSe completa no Supabase:', referencia);

      // Obter user_id atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const nfseRecord = {
        referencia,
        empresa_id: empresaId,
        user_id: user.id,
        cnpj_prestador: nfseData.prestador?.cnpj,
        razao_social: nfseData.prestador?.razao_social,
        rps_numero: nfseData.rps?.numero,
        numero_nfse: nfseData.numero,
        status: nfseData.status,
        data_emissao: nfseData.data_emissao || new Date().toISOString(),
        valor_servicos: nfseData.servico?.valor_servicos || 0,
        xml_completo: nfseData.xml,
        json_dados: nfseData,
        url_xml: nfseData.url_xml,
        url_pdf: nfseData.url_pdf,
        // Campos existentes para compatibilidade
        prestador_cnpj: nfseData.prestador?.cnpj,
        prestador_razao_social: nfseData.prestador?.razao_social,
        tomador_cnpj: nfseData.tomador?.cnpj,
        tomador_cpf: nfseData.tomador?.cpf,
        tomador_razao_social: nfseData.tomador?.razao_social,
        tomador_email: nfseData.tomador?.email,
        discriminacao: nfseData.servico?.discriminacao || '',
        codigo_servico: nfseData.servico?.codigo_servico || '',
        aliquota_iss: nfseData.servico?.aliquota_iss || 0,
        valor_iss: nfseData.servico?.valor_iss || 0,
        valor_liquido: nfseData.servico?.valor_liquido || nfseData.servico?.valor_servicos || 0,
        link_nfse: nfseData.url_pdf,
        xml_nfse: nfseData.xml,
        focus_nfe_ref: referencia
      };

      const { data, error } = await supabase
        .from('notas_fiscais')
        .upsert(nfseRecord, {
          onConflict: 'referencia',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar NFSe no Supabase:', error);
        throw error;
      }

      console.log('✅ NFSe salva com sucesso no Supabase:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao salvar NFSe completa:', error);
      throw error;
    }
  };

  // Carregar empresas do Supabase ao montar o componente
  useEffect(() => {
    let isMounted = true;

    const carregarEmpresas = async () => {
      try {
        console.log('🏢 Carregando empresas do Supabase...');
        const empresasData = await buscarEmpresasSupabase();
        if (isMounted) {
          console.log('✅ Empresas carregadas:', empresasData);
          setEmpresas(empresasData);
          if (empresasData.length > 0) {
            setEmpresaSelecionada(empresasData[0].id);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ Erro ao carregar empresas:', error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível carregar as empresas do banco de dados",
          });
        }
      }
    };

    carregarEmpresas();

    return () => {
      isMounted = false;
    };
  }, []); // Removido buscarEmpresasSupabase das dependências

  // Preencher dados do prestador automaticamente quando empresa for selecionada
  useEffect(() => {
    const carregarDadosEmpresa = async () => {
      if (empresaSelecionada && empresas.length > 0 && empresaCarregada !== empresaSelecionada) {
        const empresaEncontrada = empresas.find(emp => emp.id === empresaSelecionada);
        if (empresaEncontrada) {
          console.log('🏢 Preenchendo dados do prestador:', empresaEncontrada);

          // Preencher campos do prestador
          setValue('empresa_id', empresaEncontrada.id);
          setValue('cnpj_prestador', empresaEncontrada.cnpj_cpf || '');
          setValue('inscricao_municipal', empresaEncontrada.inscricao_municipal || '');
          setValue('codigo_municipio_prestador', empresaEncontrada.codigo_municipio || '');

          // Preencher configurações padrão da empresa
          if (empresaEncontrada.aliquota) {
            setValue('aliquota', Number(empresaEncontrada.aliquota));
          }
          if (empresaEncontrada.natureza_operacao) {
            setValue('natureza_operacao', empresaEncontrada.natureza_operacao);
          }
          if (empresaEncontrada.item_lista_servico) {
            setValue('item_lista_servico', empresaEncontrada.item_lista_servico);
          }
          if (empresaEncontrada.codigo_tributario_municipio) {
            setValue('codigo_tributario_municipio', empresaEncontrada.codigo_tributario_municipio);
          }
          setValue('optante_simples_nacional', empresaEncontrada.optante_simples_nacional || false);
          setValue('incentivador_cultural', empresaEncontrada.incentivador_cultural || false);
          setValue('iss_retido', empresaEncontrada.iss_retido || false);

          // Carregar tomadores da empresa
          try {
            console.log('📋 Carregando tomadores da empresa...');
            const tomadoresData = await buscarTomadores(empresaSelecionada);
            setTomadores(tomadoresData);
            console.log('✅ Tomadores carregados:', tomadoresData);
          } catch (error) {
            console.error('❌ Erro ao carregar tomadores:', error);
          }

          // Marcar empresa como carregada e mostrar toast
          setEmpresaCarregada(empresaSelecionada);
          toast({
            title: "Dados preenchidos",
            description: `Dados do prestador preenchidos automaticamente para ${empresaEncontrada.razao_social}`,
          });
        }
      }
    };

    carregarDadosEmpresa();
  }, [empresaSelecionada, empresas, setValue, empresaCarregada]);

  // Função para consultar CNPJ/CPF e preencher dados automaticamente
  const consultarDocumento = async (documento: string, tipo: 'cpf' | 'cnpj') => {
    if (!documento || documento.length < 11) return;

    // Limpar formatação do documento
    const documentoLimpo = documento.replace(/\D/g, '');

    try {
      setIsLoading(true);
      console.log(`🔍 Consultando ${tipo.toUpperCase()}: ${documentoLimpo}`);

      if (tipo === 'cnpj' && documentoLimpo.length === 14) {
        // Consultar CNPJ na ReceitaWS
        const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${documentoLimpo}`);

        if (response.ok) {
          const data = await response.json();

          if (data.status === 'OK') {
            console.log('✅ Dados do CNPJ encontrados:', data);

            // Preencher campos automaticamente
            setValue('razao_social_tomador', data.nome || '');
            setValue('email_tomador', data.email || '');
            setValue('cep_tomador', data.cep?.replace(/\D/g, '') || '');
            setValue('logradouro_tomador', data.logradouro || '');
            setValue('numero_tomador', data.numero || '');
            setValue('complemento_tomador', data.complemento || '');
            setValue('bairro_tomador', data.bairro || '');
            setValue('codigo_municipio_tomador', data.municipio_codigo || '');
            setValue('uf_tomador', data.uf || '');

            toast({
              title: "CNPJ consultado com sucesso",
              description: `Dados preenchidos para ${data.nome}`,
            });
          } else {
            toast({
              variant: "destructive",
              title: "CNPJ não encontrado",
              description: "Não foi possível encontrar dados para este CNPJ",
            });
          }
        }
      } else if (tipo === 'cpf' && documentoLimpo.length === 11) {
        // Para CPF, apenas validar formato (não há API pública gratuita)
        toast({
          title: "CPF informado",
          description: "Preencha manualmente os dados do tomador",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao consultar documento:', error);
      toast({
        variant: "destructive",
        title: "Erro na consulta",
        description: "Não foi possível consultar os dados. Preencha manualmente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular valores automaticamente
  useEffect(() => {
    const quantidade = watchedValues.quantidade || 0;
    const valorUnitario = watchedValues.valor_unitario || 0;
    const aliquotaIss = watchedValues.aliquota_iss || 0;

    const valorServicos = quantidade * valorUnitario;
    const valorIss = (valorServicos * aliquotaIss) / 100;

    setValue('valor_servicos', valorServicos);
    setValue('valor_iss', valorIss);
    setValue('aliquota', aliquotaIss); // Sincronizar alíquota
  }, [watchedValues.quantidade, watchedValues.valor_unitario, watchedValues.aliquota_iss, setValue]);

  // Função para preencher dados do tomador manualmente
  const preencherDadosTomador = async () => {
    if (!empresaSelecionada) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione uma empresa primeiro",
      });
      return;
    }

    try {
      const empresa = await getEmpresa(empresaSelecionada);

      // Preencher dados do tomador com dados da empresa
      setValue('tipo_documento', empresa.cnpj ? 'cnpj' : 'cpf');
      setValue('documento_tomador', empresa.cnpj || empresa.cpf || '');
      setValue('razao_social_tomador', empresa.nome);
      setValue('email_tomador', empresa.email || '');
      setValue('telefone_tomador', empresa.telefone || '');
      setValue('cep_tomador', empresa.cep || '');
      setValue('logradouro_tomador', empresa.logradouro || '');
      setValue('numero_tomador', empresa.numero || '');
      setValue('complemento_tomador', empresa.complemento || '');
      setValue('bairro_tomador', empresa.bairro || '');
      setValue('municipio_tomador', empresa.municipio || '');
      setValue('uf_tomador', empresa.uf || '');

      setDadosPreenchidosManualmente(false);

      toast({
        title: "Dados preenchidos",
        description: "Dados do tomador preenchidos com base na empresa selecionada.",
      });
    } catch (error) {
      console.error('Erro ao buscar dados da empresa:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados da empresa",
      });
    }
  };

  // Função para consultar CNPJ usando a Brasil API via Supabase
  const consultarCNPJTomador = async (cnpj: string) => {
    if (!cnpj || cnpj.replace(/[^\d]/g, '').length !== 14) {
      return;
    }

    const cnpjLimpo = cnpj.replace(/\D/g, '');
    setIsLoadingCNPJ(true);

    try {
      console.log('🔍 Consultando CNPJ do tomador via Brasil API:', cnpjLimpo);

      // Usar a função Supabase brasil-api para consulta de CNPJ
      const { data, error } = await supabase.functions.invoke('brasil-api', {
        body: { cnpj: cnpjLimpo }
      });

      if (error) {
        console.error('❌ Erro na função brasil-api:', error);
        throw new Error(error.message || 'Erro ao consultar CNPJ');
      }

      if (data && data.razao_social) {
        console.log('✅ Dados do CNPJ encontrados via Brasil API:', data);

        // Preencher campos automaticamente com os dados da Brasil API
        setValue('razao_social_tomador', data.razao_social || '');
        setValue('email_tomador', ''); // Brasil API não retorna email
        setValue('cep_tomador', data.cep?.replace(/\D/g, '') || '');
        setValue('logradouro_tomador', data.logradouro || '');
        setValue('numero_tomador', data.numero || '');
        setValue('complemento_tomador', ''); // Brasil API não tem complemento separado
        setValue('bairro_tomador', data.bairro || '');
        setValue('codigo_municipio_tomador', data.codigo_municipio || '');
        setValue('uf_tomador', data.estado_uf || '');

        toast({
          title: "CNPJ consultado com sucesso",
          description: `Dados preenchidos para ${data.razao_social}`,
        });
      } else {
        // Fallback para ReceitaWS se Brasil API não retornar dados
        await consultarCNPJReceitaWS(cnpjLimpo);
      }
    } catch (error) {
      console.error('❌ Erro ao consultar CNPJ via Brasil API, tentando ReceitaWS:', error);
      // Fallback para ReceitaWS em caso de erro
      await consultarCNPJReceitaWS(cnpjLimpo);
    } finally {
      setIsLoadingCNPJ(false);
    }
  };

  // Função auxiliar para consulta via ReceitaWS (fallback)
  const consultarCNPJReceitaWS = async (cnpjLimpo: string) => {
    try {
      console.log('🔄 Consultando CNPJ via ReceitaWS como fallback:', cnpjLimpo);
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`);

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'OK') {
          console.log('✅ Dados do CNPJ encontrados via ReceitaWS:', data);

          setValue('razao_social_tomador', data.nome || '');
          setValue('email_tomador', data.email || '');
          setValue('cep_tomador', data.cep?.replace(/\D/g, '') || '');
          setValue('logradouro_tomador', data.logradouro || '');
          setValue('numero_tomador', data.numero || '');
          setValue('complemento_tomador', data.complemento || '');
          setValue('bairro_tomador', data.bairro || '');
          setValue('codigo_municipio_tomador', data.municipio_codigo || '');
          setValue('uf_tomador', data.uf || '');

          toast({
            title: "CNPJ consultado com sucesso",
            description: `Dados preenchidos para ${data.nome}`,
          });
        } else {
          throw new Error('CNPJ não encontrado');
        }
      } else {
        throw new Error('Erro na consulta');
      }
    } catch (error) {
      console.error('❌ Erro ao consultar CNPJ via ReceitaWS:', error);
      toast({
        variant: "destructive",
        title: "CNPJ não encontrado",
        description: "Não foi possível encontrar dados para este CNPJ",
      });
    }
  };

  // Função para selecionar tomador cadastrado
  const selecionarTomador = (tomadorId: string) => {
    const tomador = tomadores.find(t => t.id === tomadorId);
    if (tomador) {
      console.log('👤 Selecionando tomador:', tomador);

      setValue('tipo_documento', tomador.tipo_documento);
      setValue('documento_tomador', tomador.documento);
      setValue('razao_social_tomador', tomador.razao_social);
      setValue('email_tomador', tomador.email || '');
      setValue('cep_tomador', tomador.cep || '');
      setValue('logradouro_tomador', tomador.logradouro || '');
      setValue('numero_tomador', tomador.numero || '');
      setValue('complemento_tomador', tomador.complemento || '');
      setValue('bairro_tomador', tomador.bairro || '');
      setValue('codigo_municipio_tomador', tomador.codigo_municipio || '');
      setValue('uf_tomador', tomador.uf || '');

      setTomadorSelecionado(tomadorId);
      setShowCadastroTomador(false);

      toast({
        title: "Tomador selecionado",
        description: `Dados de ${tomador.razao_social} carregados`,
      });
    }
  };

  // Função para salvar novo tomador
  const salvarNovoTomador = async () => {
    if (!empresaSelecionada) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione uma empresa primeiro",
      });
      return;
    }

    const dadosFormulario = watch();

    if (!dadosFormulario.documento_tomador || !dadosFormulario.razao_social_tomador) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha pelo menos o documento e nome do tomador",
      });
      return;
    }

    try {
      const novoTomador = {
        company_id: empresaSelecionada,
        tipo_documento: dadosFormulario.tipo_documento,
        documento: dadosFormulario.documento_tomador,
        razao_social: dadosFormulario.razao_social_tomador,
        email: dadosFormulario.email_tomador,
        cep: dadosFormulario.cep_tomador,
        logradouro: dadosFormulario.logradouro_tomador,
        numero: dadosFormulario.numero_tomador,
        complemento: dadosFormulario.complemento_tomador,
        bairro: dadosFormulario.bairro_tomador,
        codigo_municipio: dadosFormulario.codigo_municipio_tomador,
        uf: dadosFormulario.uf_tomador,
        ativo: true
      };

      const tomadorSalvo = await salvarTomador(novoTomador);
      if (tomadorSalvo) {
        // Recarregar lista de tomadores
        const tomadoresAtualizados = await buscarTomadores(empresaSelecionada);
        setTomadores(tomadoresAtualizados);
        setTomadorSelecionado(tomadorSalvo.id);
        setShowCadastroTomador(false);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar tomador:', error);
    }
  };

  // Função para submeter o formulário
  const onSubmit = async (data: NFSeFormData) => {
    console.log('🎯 onSubmit chamado com dados:', data);
    console.log('🏢 Empresa selecionada:', empresaSelecionada);

    if (!empresaSelecionada) {
      console.log('❌ Empresa não selecionada');
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione uma empresa para emitir a NFSe",
      });
      return;
    }

    setIsLoading(true);
    setNfseStatus('processing');

    try {
      // Gerar referência única com formato sequencial + A (conforme exemplo)
      const numeroSequencial = String(Date.now()).slice(-6); // Últimos 6 dígitos do timestamp
      const referencia = `${numeroSequencial}A`;
      setNfseReferencia(referencia);

      console.log('🚀 Iniciando emissão de NFSe com referência:', referencia);

      // Buscar dados da empresa selecionada
      const empresaSelecionadaData = empresas.find(e => e.id === empresaSelecionada);
      if (!empresaSelecionadaData) {
        throw new Error('Empresa não encontrada');
      }

      // Preparar dados para a API Focus NFe seguindo exatamente a documentação
      const nfseData = {
        data_emissao: new Date().toISOString(),
        prestador: {
          cnpj: empresaSelecionadaData.cnpj_cpf?.replace(/\D/g, ''),
          inscricao_municipal: empresaSelecionadaData.inscricao_municipal,
          codigo_municipio: empresaSelecionadaData.codigo_municipio
        },
        tomador: {
          cnpj: data.documento_tomador.replace(/\D/g, ''),
          razao_social: data.razao_social_tomador,
          email: data.email_tomador,
          endereco: {
            logradouro: data.logradouro_tomador,
            numero: data.numero_tomador,
            complemento: data.complemento_tomador || "",
            bairro: data.bairro_tomador,
            codigo_municipio: data.codigo_municipio_tomador,
            uf: data.uf_tomador,
            cep: data.cep_tomador.replace(/\D/g, '')
          }
        },
        servico: {
          discriminacao: data.discriminacao,
          item_lista_servico: data.item_lista_servico,
          codigo_tributario_municipio: data.codigo_tributario_municipio,
          valor_servicos: parseFloat(data.valor_servicos.toString()),
          codigo_municipio: empresaSelecionadaData.codigo_municipio,
          iss_retido: data.iss_retido ? 1 : 2, // 1 = Sim, 2 = Não (formato numérico)
          aliquota: parseFloat(data.aliquota.toString()) / 100 // Converter para decimal (5% = 0.05)
        },
        natureza_operacao: data.natureza_operacao || "1",
        regime_tributacao: "1", // 1 = Simples Nacional (obrigatório)
        optante_simples_nacional: data.optante_simples_nacional,
        incentivador_cultural: data.incentivador_cultural || false
      };

      console.log('📋 Dados da NFSe preparados:', nfseData);

      // Emitir NFSe
      const resultado = await emitirNFSe(referencia, nfseData, empresaSelecionadaData);

      console.log('✅ Resultado da emissão:', resultado);

      if (resultado.status === 'autorizado') {
        // NFSe já autorizada imediatamente
        setNfseStatus('authorized');
        setIsLoading(false);

        toast({
          title: "NFSe emitida com sucesso!",
          description: `Número: ${resultado.numero}`,
        });

        // Salvar NFSe completa no Supabase
        try {
          await salvarNFSeCompleta(referencia, resultado, empresaSelecionada);
        } catch (error) {
          console.error('❌ Erro ao salvar NFSe no Supabase:', error);
        }

        // Limpar formulário após sucesso
        reset();
        setNfseReferencia('');
        setActiveTab('prestador');
      } else if (resultado.status === 'processando_autorizacao' || resultado.status === 'processando') {
        // Iniciar monitoramento automático
        console.log('🔄 Iniciando monitoramento automático para referência:', referencia);

        toast({
          title: "NFSe enviada para processamento",
          description: "Monitoramento automático iniciado. Aguarde...",
        });

        // Iniciar monitoramento (o loading será controlado pelo hook)
        await startMonitoring(referencia, empresaSelecionada);
      } else {
        setNfseStatus('error');
        setIsLoading(false);

        toast({
          variant: "destructive",
          title: "Erro na emissão da NFSe",
          description: resultado.mensagem_sefaz || resultado.mensagem || "Erro desconhecido",
        });
      }
    } catch (error) {
      console.error('Erro ao emitir NFSe:', error);
      setNfseStatus('error');
      toast({
        variant: "destructive",
        title: "Erro na emissão da NFSe",
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar status da NFSe
  const verificarStatusNFSe = async (referencia: string) => {
    try {
      const status = await consultarNFSe(referencia, empresaSelecionada);

      if (status.status === 'autorizada') {
        setNfseStatus('authorized');
        toast({
          title: "NFSe autorizada!",
          description: `Número: ${status.numero}`,
        });
      } else if (status.status === 'erro_autorizacao') {
        setNfseStatus('error');
        toast({
          variant: "destructive",
          title: "Erro na autorização da NFSe",
          description: status.mensagem,
        });
      } else {
        // Continuar verificando após alguns segundos
        setTimeout(() => verificarStatusNFSe(referencia), 3000);
      }
    } catch (error) {
      console.error('Erro ao consultar status da NFSe:', error);
      setNfseStatus('error');
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Emitir NFSe</h1>
            <p className="text-muted-foreground">
              Emissão de Nota Fiscal de Serviços Eletrônica
            </p>
          </div>
        </div>

        {/* Alert informativo */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A emissão de NFSe requer empresa cadastrada na Focus NFe com inscrição municipal válida.
          </AlertDescription>
        </Alert>

        {/* Formulário de emissão */}
        <Card>
          <CardHeader>
            <CardTitle>Nova NFSe</CardTitle>
            <CardDescription>
              Preencha os dados para emitir uma nova Nota Fiscal de Serviços Eletrônica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="prestador" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Prestador
                  </TabsTrigger>
                  <TabsTrigger value="tomador" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Tomador
                  </TabsTrigger>
                  <TabsTrigger value="servico" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Serviço
                  </TabsTrigger>
                  <TabsTrigger value="finalizacao" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Finalização
                  </TabsTrigger>
                </TabsList>

                {/* Aba Prestador */}
                <TabsContent value="prestador" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="empresa_id">Empresa</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await sincronizarEmpresasFocusNFe();
                          } catch (error) {
                            console.error('Erro na sincronização:', error);
                          }
                        }}
                        disabled={loadingFocus}
                      >
                        {loadingFocus ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sincronizando...
                          </>
                        ) : (
                          <>
                            <Settings className="mr-2 h-4 w-4" />
                            Sincronizar Focus NFe
                          </>
                        )}
                      </Button>
                    </div>
                    <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas.map((empresa) => (
                          <SelectItem key={empresa.id} value={empresa.id}>
                            {empresa.razao_social} - {empresa.cnpj_cpf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj_prestador">CNPJ</Label>
                      <Input
                        id="cnpj_prestador"
                        placeholder="00.000.000/0000-00"
                        {...register('cnpj_prestador', { required: 'CNPJ é obrigatório' })}
                      />
                      {errors.cnpj_prestador && (
                        <p className="text-sm text-red-500">{errors.cnpj_prestador.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                      <Input
                        id="inscricao_municipal"
                        placeholder="123456"
                        {...register('inscricao_municipal', { required: 'Inscrição Municipal é obrigatória' })}
                      />
                      {errors.inscricao_municipal && (
                        <p className="text-sm text-red-500">{errors.inscricao_municipal.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="codigo_municipio_prestador">Código do Município</Label>
                    <Input
                      id="codigo_municipio_prestador"
                      placeholder="3552205"
                      {...register('codigo_municipio_prestador', { required: 'Código do município é obrigatório' })}
                    />
                    {errors.codigo_municipio_prestador && (
                      <p className="text-sm text-red-500">{errors.codigo_municipio_prestador.message}</p>
                    )}
                  </div>
                </TabsContent>

                {/* Aba Tomador */}
                <TabsContent value="tomador" className="space-y-4">
                  {/* Seleção de tomador cadastrado */}
                  {tomadores.length > 0 && (
                    <div className="space-y-2">
                      <Label>Tomadores Cadastrados</Label>
                      <div className="flex gap-2">
                        <Select value={tomadorSelecionado} onValueChange={selecionarTomador}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione um tomador cadastrado" />
                          </SelectTrigger>
                          <SelectContent>
                            {tomadores.map((tomador) => (
                              <SelectItem key={tomador.id} value={tomador.id}>
                                {tomador.razao_social} - {tomador.documento}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCadastroTomador(!showCadastroTomador)}
                        >
                          {showCadastroTomador ? 'Cancelar' : 'Novo Tomador'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Formulário de cadastro/edição de tomador */}
                  {(tomadores.length === 0 || showCadastroTomador) && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo_documento">Tipo de Pessoa</Label>
                      <Select
                        value={watch('tipo_documento')}
                        onValueChange={(value: 'cpf' | 'cnpj') => setValue('tipo_documento', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documento_tomador">CPF/CNPJ</Label>
                      <div className="flex gap-2">
                        <Input
                          id="documento_tomador"
                          placeholder={watch('tipo_documento') === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                          {...register('documento_tomador', { required: 'Documento é obrigatório' })}
                          onBlur={(e) => {
                            if (watch('tipo_documento') === 'cnpj' && e.target.value) {
                              consultarCNPJTomador(e.target.value);
                            }
                          }}
                        />
                        {watch('tipo_documento') === 'cnpj' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isLoadingCNPJ}
                            onClick={() => {
                              const cnpj = watch('documento_tomador');
                              if (cnpj) consultarCNPJTomador(cnpj);
                            }}
                          >
                            {isLoadingCNPJ ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Consultando...
                              </>
                            ) : (
                              'Consultar CNPJ'
                            )}
                          </Button>
                        )}
                      </div>
                      {errors.documento_tomador && (
                        <p className="text-sm text-red-500">{errors.documento_tomador.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="razao_social_tomador">Razão Social/Nome</Label>
                    <Input
                      id="razao_social_tomador"
                      placeholder="Nome completo ou razão social"
                      {...register('razao_social_tomador', { required: 'Nome é obrigatório' })}
                    />
                    {errors.razao_social_tomador && (
                      <p className="text-sm text-red-500">{errors.razao_social_tomador.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email_tomador">E-mail</Label>
                    <Input
                      id="email_tomador"
                      type="email"
                      placeholder="email@exemplo.com"
                      {...register('email_tomador', {
                        required: 'E-mail é obrigatório',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'E-mail inválido'
                        }
                      })}
                    />
                    {errors.email_tomador && (
                      <p className="text-sm text-red-500">{errors.email_tomador.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep_tomador">CEP</Label>
                      <Input
                        id="cep_tomador"
                        placeholder="00000-000"
                        {...register('cep_tomador', { required: 'CEP é obrigatório' })}
                      />
                      {errors.cep_tomador && (
                        <p className="text-sm text-red-500">{errors.cep_tomador.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logradouro_tomador">Endereço</Label>
                      <Input
                        id="logradouro_tomador"
                        placeholder="Rua, Avenida..."
                        {...register('logradouro_tomador', { required: 'Endereço é obrigatório' })}
                      />
                      {errors.logradouro_tomador && (
                        <p className="text-sm text-red-500">{errors.logradouro_tomador.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero_tomador">Número</Label>
                      <Input
                        id="numero_tomador"
                        placeholder="123"
                        {...register('numero_tomador', { required: 'Número é obrigatório' })}
                      />
                      {errors.numero_tomador && (
                        <p className="text-sm text-red-500">{errors.numero_tomador.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="complemento_tomador">Complemento</Label>
                      <Input
                        id="complemento_tomador"
                        placeholder="Apto, Sala..."
                        {...register('complemento_tomador')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro_tomador">Bairro</Label>
                      <Input
                        id="bairro_tomador"
                        placeholder="Centro"
                        {...register('bairro_tomador', { required: 'Bairro é obrigatório' })}
                      />
                      {errors.bairro_tomador && (
                        <p className="text-sm text-red-500">{errors.bairro_tomador.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigo_municipio_tomador">Código Município</Label>
                      <Input
                        id="codigo_municipio_tomador"
                        placeholder="3552205"
                        {...register('codigo_municipio_tomador', { required: 'Código do município é obrigatório' })}
                      />
                      {errors.codigo_municipio_tomador && (
                        <p className="text-sm text-red-500">{errors.codigo_municipio_tomador.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uf_tomador">UF</Label>
                      <Select onValueChange={(value) => setValue('uf_tomador', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SP">SP</SelectItem>
                          <SelectItem value="RJ">RJ</SelectItem>
                          <SelectItem value="MG">MG</SelectItem>
                          {/* Adicionar outros estados conforme necessário */}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Botão para salvar tomador */}
                  {showCadastroTomador && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={salvarNovoTomador}
                        disabled={!watch('documento_tomador') || !watch('razao_social_tomador')}
                      >
                        Salvar Tomador
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowCadastroTomador(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                    </>
                  )}
                </TabsContent>

                {/* Aba Serviço */}
                <TabsContent value="servico" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="discriminacao">Descrição do Serviço</Label>
                    <Textarea
                      id="discriminacao"
                      placeholder="Descreva detalhadamente o serviço prestado"
                      rows={3}
                      {...register('discriminacao', { required: 'Descrição do serviço é obrigatória' })}
                    />
                    {errors.discriminacao && (
                      <p className="text-sm text-red-500">{errors.discriminacao.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item_lista_servico">Item da Lista de Serviços</Label>
                      <Input
                        id="item_lista_servico"
                        placeholder="1406"
                        {...register('item_lista_servico', { required: 'Item da lista é obrigatório' })}
                      />
                      {errors.item_lista_servico && (
                        <p className="text-sm text-red-500">{errors.item_lista_servico.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigo_tributario_municipio">Código Tributário do Município</Label>
                      <Input
                        id="codigo_tributario_municipio"
                        placeholder="332100001"
                        {...register('codigo_tributario_municipio', { required: 'Código tributário é obrigatório' })}
                      />
                      {errors.codigo_tributario_municipio && (
                        <p className="text-sm text-red-500">{errors.codigo_tributario_municipio.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor_servicos">Valor dos Serviços</Label>
                      <Input
                        id="valor_servicos"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register('valor_servicos', {
                          required: 'Valor é obrigatório',
                          min: { value: 0.01, message: 'Valor deve ser maior que zero' }
                        })}
                      />
                      {errors.valor_servicos && (
                        <p className="text-sm text-red-500">{errors.valor_servicos.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aliquota">Alíquota ISS (%)</Label>
                      <Input
                        id="aliquota"
                        type="number"
                        step="0.01"
                        placeholder="5.00"
                        {...register('aliquota', {
                          required: 'Alíquota é obrigatória',
                          min: { value: 0, message: 'Alíquota deve ser maior ou igual a zero' }
                        })}
                      />
                      {errors.aliquota && (
                        <p className="text-sm text-red-500">{errors.aliquota.message}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="iss_retido"
                        {...register('iss_retido')}
                      />
                      <Label htmlFor="iss_retido">ISS Retido na Fonte</Label>
                    </div>
                  </div>
                </TabsContent>

                {/* Aba Finalização */}
                <TabsContent value="finalizacao" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="natureza_operacao">Natureza da Operação</Label>
                      <Select onValueChange={(value) => setValue('natureza_operacao', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Tributação no município</SelectItem>
                          <SelectItem value="2">Tributação fora do município</SelectItem>
                          <SelectItem value="3">Isenção</SelectItem>
                          <SelectItem value="4">Imune</SelectItem>
                          <SelectItem value="5">Exigibilidade suspensa por decisão judicial</SelectItem>
                          <SelectItem value="6">Exigibilidade suspensa por procedimento administrativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="optante_simples_nacional"
                        {...register('optante_simples_nacional')}
                      />
                      <Label htmlFor="optante_simples_nacional">Optante Simples Nacional</Label>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="incentivador_cultural"
                        {...register('incentivador_cultural')}
                      />
                      <Label htmlFor="incentivador_cultural">Incentivador Cultural</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enviar_email"
                        {...register('enviar_email')}
                      />
                      <Label htmlFor="enviar_email">Enviar por e-mail</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="gerar_pdf"
                        {...register('gerar_pdf')}
                      />
                      <Label htmlFor="gerar_pdf">Gerar PDF automaticamente</Label>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Resumo da NFSe</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Valor dos Serviços: R$ {watch('valor_servicos') ? Number(watch('valor_servicos')).toFixed(2) : '0,00'}</div>
                      <div>Alíquota ISS: {watch('aliquota') || 0}%</div>
                      <div>Valor ISS: R$ {watch('valor_servicos') && watch('aliquota') ? (Number(watch('valor_servicos')) * Number(watch('aliquota')) / 100).toFixed(2) : '0,00'}</div>
                      <div className="font-semibold">Total Líquido: R$ {watch('valor_servicos') ? Number(watch('valor_servicos')).toFixed(2) : '0,00'}</div>
                    </div>
                  </div>

                  {/* Status do Monitoramento */}
                  {monitoringStatus.status !== 'idle' && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">Status da NFSe</h4>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Status:</span>
                          <span className="font-medium">
                            {monitoringStatus.currentStatus || 'Processando...'}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span>Tentativas:</span>
                          <span>{monitoringStatus.attempts}/{monitoringStatus.maxAttempts}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span>Tempo decorrido:</span>
                          <span>{Math.floor(monitoringStatus.timeElapsed / 60)}:{(monitoringStatus.timeElapsed % 60).toString().padStart(2, '0')}</span>
                        </div>

                        {monitoringStatus.message && (
                          <div className="text-sm text-blue-700 mt-2">
                            {monitoringStatus.message}
                          </div>
                        )}

                        {monitoringStatus.status === 'monitoring' && (
                          <div className="mt-3">
                            <Progress
                              value={(monitoringStatus.attempts / monitoringStatus.maxAttempts) * 100}
                              className="h-2"
                            />
                          </div>
                        )}

                        {monitoringStatus.status === 'completed' && monitoringStatus.nfseData && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center gap-2 text-green-800">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-medium">NFSe Autorizada!</span>
                            </div>
                            {monitoringStatus.nfseData.numero && (
                              <div className="text-sm text-green-700 mt-1">
                                Número: {monitoringStatus.nfseData.numero}
                              </div>
                            )}
                            {monitoringStatus.nfseData.url_pdf && (
                              <div className="mt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(monitoringStatus.nfseData.url_pdf, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar PDF
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {monitoringStatus.status === 'error' && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                            <div className="flex items-center gap-2 text-red-800">
                              <AlertCircle className="h-4 w-4" />
                              <span className="font-medium">Erro no Processamento</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading || !empresaSelecionada || isMonitoring}
                    >
                      {isLoading || isMonitoring ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isMonitoring ? 'Monitorando NFSe...' : 'Emitindo NFSe...'}
                        </>
                      ) : (
                        'Emitir NFSe'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isLoading || isMonitoring}
                    >
                      Salvar Rascunho
                    </Button>
                    {isMonitoring && (
                      <Button
                        variant="destructive"
                        type="button"
                        onClick={stopMonitoring}
                      >
                        Parar Monitoramento
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EmitirNFSe;