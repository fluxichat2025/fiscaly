import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Tipos baseados na documentação da API Focus NFe
export interface FocusNFeEmpresa {
  id: number;
  nome: string;
  nome_fantasia: string;
  cnpj: string;
  cpf?: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  bairro: string;
  cep: string;
  codigo_municipio: string;
  codigo_pais: string;
  codigo_uf: string;
  complemento: string;
  cpf_cnpj_contabilidade: string;
  cpf_responsavel: string;
  discrimina_impostos: boolean;
  email: string;
  enviar_email_destinatario: boolean;
  enviar_email_homologacao: boolean;
  habilita_nfce: boolean;
  habilita_nfe: boolean;
  habilita_nfse: boolean;
  habilita_nfsen_producao: boolean;
  habilita_nfsen_homologacao: boolean;
  habilita_cte: boolean;
  habilita_mdfe: boolean;
  habilita_manifestacao: boolean;
  habilita_manifestacao_homologacao: boolean;
  habilita_manifestacao_cte: boolean;
  habilita_manifestacao_cte_homologacao: boolean;
  logradouro: string;
  municipio: string;
  nome_responsavel: string;
  numero: string;
  pais: string;
  regime_tributario: string;
  telefone: string;
  uf: string;
  certificado_valido_ate: string | null;
  certificado_valido_de: string | null;
  certificado_cnpj: string;
  certificado_especifico: boolean;
  data_ultima_emissao: string | null;
  token_producao: string;
  token_homologacao: string;
  mostrar_danfse_badge: boolean;
}

export interface EmpresaListItem {
  id: string;
  nome: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  ultima_emissao: string | null;
  certificado_status: string | null;
  actions: string[];
}

// Interface para empresa no Supabase
export interface Company {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_municipal?: string;
  inscricao_estadual?: string;
  codigo_municipio?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  telefone?: string;
  email?: string;
  regime_tributario?: string;
  optante_simples_nacional?: boolean;
  incentivador_cultural?: boolean;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Interface para tomador no Supabase
export interface Tomador {
  id: string;
  company_id: string;
  tipo_documento: 'cpf' | 'cnpj';
  documento: string;
  razao_social: string;
  nome_fantasia?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  codigo_municipio?: string;
  uf?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Interface para dados de CNPJ da ReceitaWS
export interface CNPJData {
  cnpj: string;
  identificador_matriz_filial: number;
  descricao_matriz_filial: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: number;
  descricao_situacao_cadastral: string;
  data_situacao_cadastral: string;
  motivo_situacao_cadastral: number;
  nome_cidade_exterior: string;
  codigo_natureza_juridica: number;
  data_inicio_atividade: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  descricao_tipo_logradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  codigo_municipio: number;
  municipio: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  ddd_fax: string;
  qualificacao_responsavel: number;
  capital_social: number;
  porte: number;
  descricao_porte: string;
  opcao_pelo_simples: boolean;
  data_opcao_pelo_simples: string;
  data_exclusao_do_simples: string;
  opcao_pelo_mei: boolean;
  situacao_especial: string;
  data_situacao_especial: string;
}

// Detectar ambiente e configurar URL base adequada
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const FOCUS_NFE_API_BASE = isProduction
  ? 'https://api.focusnfe.com.br/v2' // URL direta em produção (pode dar CORS, mas tentaremos)
  : (import.meta.env.VITE_FOCUS_NFE_API_BASE || '/api/focusnfe/v2'); // Proxy em desenvolvimento
const TOKEN_PRODUCAO = import.meta.env.VITE_FOCUS_NFE_TOKEN_PRODUCAO || 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// Dados mock para desenvolvimento
const MOCK_EMPRESAS: EmpresaListItem[] = [
  {
    id: '1',
    nome: 'Empresa Exemplo Ltda',
    nome_fantasia: 'Exemplo Corp',
    cnpj_cpf: '12.345.678/0001-90',
    ultima_emissao: '2024-01-15',
    certificado_status: 'VALIDO_ATE_2025-04-01',
    actions: ['EDITAR', 'EXCLUIR']
  },
  {
    id: '2',
    nome: 'Tech Solutions S.A.',
    nome_fantasia: 'TechSol',
    cnpj_cpf: '98.765.432/0001-10',
    ultima_emissao: '2024-01-10',
    certificado_status: 'VALIDO_ATE_2024-12-31',
    actions: ['EDITAR', 'EXCLUIR']
  },
  {
    id: '3',
    nome: 'Serviços Digitais ME',
    nome_fantasia: 'DigiServ',
    cnpj_cpf: '11.222.333/0001-44',
    ultima_emissao: null,
    certificado_status: 'VENCIDO_DESDE_2024-01-01',
    actions: ['EDITAR', 'EXCLUIR']
  }
];

// Cache global para evitar múltiplas requisições
let empresasCache: EmpresaListItem[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

export function useFocusNFeAPI() {
  const [empresas, setEmpresas] = useState<EmpresaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Função para fazer requisições usando Supabase Edge Function (mais confiável)
  const makeRequestViaSupabase = async (endpoint: string): Promise<any> => {
    console.log('🔍 Fazendo requisição via Supabase Edge Function:', endpoint);

    try {
      const { data, error } = await supabase.functions.invoke('focus-empresas', {
        body: { endpoint }
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        throw error;
      }

      console.log('✅ Resposta da Edge Function:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao chamar Edge Function:', error);
      throw error;
    }
  };

  // Função para fazer requisições autenticadas para a API Focus NFe com retry (fallback)
  const makeRequest = async (endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> => {
    // Em produção, tentar usar Edge Function primeiro
    if (isProduction && endpoint === '/empresas') {
      try {
        return await makeRequestViaSupabase(endpoint);
      } catch (edgeFunctionError) {
        console.log('⚠️ Edge Function falhou, tentando API direta...', edgeFunctionError);
        // Continuar com a requisição direta como fallback
      }
    }

    const url = `${FOCUS_NFE_API_BASE}${endpoint}`;
    const maxRetries = 3;

    // Configurar autenticação Basic Auth
    const auth = btoa(`${TOKEN_PRODUCAO}:`);

    console.log('🔍 Debug API Request:', {
      url,
      token: TOKEN_PRODUCAO.substring(0, 10) + '...',
      endpoint,
      auth: auth.substring(0, 20) + '...',
      attempt: retryCount + 1
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'FocusNFe-Integration/1.0',
          ...options.headers,
        },
      });

      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          'rate-limit-limit': response.headers.get('rate-limit-limit'),
          'rate-limit-remaining': response.headers.get('rate-limit-remaining'),
          'rate-limit-reset': response.headers.get('rate-limit-reset')
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);

        // Tratamento específico para erro 429 (Too Many Requests)
        if (response.status === 429) {
          const resetTime = response.headers.get('rate-limit-reset');
          const waitTime = resetTime ? parseInt(resetTime) * 1000 : (retryCount + 1) * 2000;

          if (retryCount < maxRetries) {
            console.log(`⏳ Aguardando ${waitTime}ms antes de tentar novamente...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return makeRequest(endpoint, options, retryCount + 1);
          }

          throw new Error('Limite de requisições excedido. Token temporariamente bloqueado.');
        }

        throw new Error(errorData.mensagem || errorData.codigo || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Success:', data);
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão com a API Focus NFe');
      }
      throw error;
    }
  };

  // Função para verificar status da API com diferentes estratégias
  const checkApiStatus = async (): Promise<boolean> => {
    const strategies = [
      // Estratégia 1: Requisição normal
      async () => {
        console.log('🔍 Tentativa 1: Requisição normal');
        await makeRequest('/empresas');
        return true;
      },

      // Estratégia 2: Tentar com parâmetro de token na URL
      async () => {
        console.log('🔍 Tentativa 2: Token como parâmetro');
        const url = `${FOCUS_NFE_API_BASE}/empresas?token=${TOKEN_PRODUCAO}`;
        const response = await fetch(url, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) return true;
        throw new Error(`Status: ${response.status}`);
      },

      // Estratégia 3: Verificar se é problema de CORS
      async () => {
        console.log('🔍 Tentativa 3: Teste de conectividade');
        const response = await fetch(`${FOCUS_NFE_API_BASE}/empresas`, {
          method: 'HEAD',
          headers: {
            'Authorization': `Basic ${btoa(`${TOKEN_PRODUCAO}:`)}`,
          }
        });
        return response.status !== 429;
      }
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        const result = await strategies[i]();
        if (result) {
          console.log(`✅ Estratégia ${i + 1} funcionou!`);
          return true;
        }
      } catch (error) {
        console.log(`❌ Estratégia ${i + 1} falhou:`, error);

        // Se não for erro 429, continuar tentando
        if (error instanceof Error && !error.message.includes('429')) {
          continue;
        }
      }
    }

    return false;
  };

  // Função principal para carregar empresas (estratégia robusta)
  const carregarEmpresas = async (): Promise<EmpresaListItem[]> => {
    setLoading(true);
    setError(null);

    const now = Date.now();

    // Verificar cache primeiro
    if (empresasCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📦 Usando dados do cache');
      setEmpresas(empresasCache);
      setLoading(false);
      return empresasCache;
    }

    console.log('🌍 Ambiente detectado:', isProduction ? 'Produção' : 'Desenvolvimento');
    console.log('🔗 URL da API:', FOCUS_NFE_API_BASE);

    try {
      // ESTRATÉGIA PRINCIPAL: Sempre tentar Supabase primeiro (mais confiável)
      console.log('🏢 Carregando empresas do Supabase...');
      const empresasSupabase = await buscarEmpresasSupabase();

      if (empresasSupabase && empresasSupabase.length > 0) {
        console.log('✅ Empresas carregadas do Supabase:', empresasSupabase.length);

        const empresasFormatadas: EmpresaListItem[] = empresasSupabase.map((empresa: any) => ({
          id: empresa.id ? empresa.id.toString() : Math.random().toString(),
          nome: empresa.razao_social || 'Nome não informado',
          nome_fantasia: empresa.nome_fantasia || empresa.razao_social || 'Fantasia não informada',
          cnpj_cpf: empresa.cnpj || 'CNPJ não informado',
          ultima_emissao: null,
          certificado_status: null,
          actions: ['EDITAR', 'EXCLUIR']
        }));

        empresasCache = empresasFormatadas;
        cacheTimestamp = now;
        setEmpresas(empresasFormatadas);

        toast({
          title: "Empresas carregadas do banco",
          description: `${empresasFormatadas.length} empresas encontradas`,
        });

        setLoading(false);
        return empresasFormatadas;
      }

      // Se não há dados no Supabase, usar dados mock
      console.log('⚠️ Nenhuma empresa no Supabase, usando dados de exemplo...');
      empresasCache = MOCK_EMPRESAS;
      cacheTimestamp = now;
      setEmpresas(MOCK_EMPRESAS);

      toast({
        title: "Dados de exemplo",
        description: "Nenhuma empresa cadastrada. Mostrando dados de exemplo para demonstração.",
      });

      setLoading(false);
      return MOCK_EMPRESAS;

    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);

      // Fallback final: sempre usar dados mock para não quebrar a interface
      empresasCache = MOCK_EMPRESAS;
      cacheTimestamp = now;
      setEmpresas(MOCK_EMPRESAS);
      setError(null); // Não mostrar erro, já que temos dados mock

      toast({
        title: "Dados de exemplo carregados",
        description: "Erro ao conectar com o banco. Mostrando dados de exemplo.",
      });

      setLoading(false);
      return MOCK_EMPRESAS;
    }
  };

  // Função para buscar todas as empresas com cache (mantida para compatibilidade)
  const fetchEmpresas = async () => {
    // Verificar se há cache válido
    const now = Date.now();
    if (empresasCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      setEmpresas(empresasCache);
      return empresasCache;
    }

    setLoading(true);
    setError(null);

    try {
      // Se modo mock estiver ativado, usar dados mock diretamente
      if (USE_MOCK_DATA) {
        console.log('🎭 Usando dados mock (modo desenvolvimento)');

        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Atualizar cache com dados mock
        empresasCache = MOCK_EMPRESAS;
        cacheTimestamp = now;

        setEmpresas(MOCK_EMPRESAS);

        toast({
          title: "Dados mock carregados",
          description: `${MOCK_EMPRESAS.length} empresas de exemplo (modo desenvolvimento)`,
        });

        return MOCK_EMPRESAS;
      }

      // NOVA ESTRATÉGIA: Em produção, tentar Supabase primeiro
      const isProduction = window.location.hostname !== 'localhost';

      if (isProduction) {
        console.log('🏢 Ambiente de produção detectado, carregando do Supabase...');
        try {
          const empresasSupabase = await buscarEmpresasSupabase();
          if (empresasSupabase && empresasSupabase.length > 0) {
            console.log('✅ Empresas carregadas do Supabase:', empresasSupabase.length);

            const empresasFormatadas: EmpresaListItem[] = empresasSupabase.map((empresa: any) => ({
              id: empresa.id ? empresa.id.toString() : Math.random().toString(),
              nome: empresa.razao_social || 'Nome não informado',
              nome_fantasia: empresa.nome_fantasia || empresa.razao_social || 'Fantasia não informada',
              cnpj_cpf: empresa.cnpj || 'CNPJ não informado',
              ultima_emissao: null,
              certificado_status: null,
              actions: ['EDITAR', 'EXCLUIR']
            }));

            empresasCache = empresasFormatadas;
            cacheTimestamp = now;
            setEmpresas(empresasFormatadas);

            toast({
              title: "Empresas carregadas",
              description: `${empresasFormatadas.length} empresas encontradas no banco de dados`,
            });

            return empresasFormatadas;
          }
        } catch (supabaseError) {
          console.log('⚠️ Erro ao carregar do Supabase, tentando Focus NFe...', supabaseError);
        }
      }

      // Verificar se API está disponível antes de tentar
      console.log('🔍 Verificando status da API Focus NFe...');
      const apiAvailable = await checkApiStatus();

      if (!apiAvailable) {
        console.log('🎭 API indisponível, tentando carregar do Supabase...');

        // Tentar carregar do Supabase como fallback
        try {
          const empresasSupabase = await buscarEmpresasSupabase();
          if (empresasSupabase && empresasSupabase.length > 0) {
            console.log('✅ Empresas carregadas do Supabase:', empresasSupabase.length);

            const empresasFormatadas: EmpresaListItem[] = empresasSupabase.map((empresa: any) => ({
              id: empresa.id ? empresa.id.toString() : Math.random().toString(),
              nome: empresa.razao_social || 'Nome não informado',
              nome_fantasia: empresa.nome_fantasia || empresa.razao_social || 'Fantasia não informada',
              cnpj_cpf: empresa.cnpj || 'CNPJ não informado',
              ultima_emissao: null,
              certificado_status: null,
              actions: ['EDITAR', 'EXCLUIR']
            }));

            empresasCache = empresasFormatadas;
            cacheTimestamp = now;
            setEmpresas(empresasFormatadas);

            toast({
              title: "Empresas carregadas do banco local",
              description: `${empresasFormatadas.length} empresas encontradas (API Focus NFe indisponível)`,
            });

            return empresasFormatadas;
          }
        } catch (supabaseError) {
          console.error('❌ Erro ao carregar do Supabase:', supabaseError);
        }

        // Se Supabase também falhar, usar dados mock
        console.log('🎭 Usando dados mock como último recurso');
        empresasCache = MOCK_EMPRESAS;
        cacheTimestamp = now;

        setEmpresas(MOCK_EMPRESAS);

        toast({
          title: "API temporariamente indisponível",
          description: "Usando dados de exemplo. Tente novamente em alguns minutos.",
        });

        return MOCK_EMPRESAS;
      }

      // Tentar usar a API real
      console.log('✅ API disponível, carregando empresas...');
      const data = await makeRequest('/empresas');

      console.log('📊 Dados recebidos da API:', data);

      // A API Focus NFe retorna um array de empresas
      const empresasArray = Array.isArray(data) ? data : [];

      if (empresasArray.length === 0) {
        console.log('⚠️ Nenhuma empresa encontrada na API Focus NFe, tentando Supabase...');

        // Tentar carregar do Supabase
        try {
          const empresasSupabase = await buscarEmpresasSupabase();
          if (empresasSupabase && empresasSupabase.length > 0) {
            console.log('✅ Empresas carregadas do Supabase:', empresasSupabase.length);

            const empresasFormatadas: EmpresaListItem[] = empresasSupabase.map((empresa: any) => ({
              id: empresa.id ? empresa.id.toString() : Math.random().toString(),
              nome: empresa.razao_social || 'Nome não informado',
              nome_fantasia: empresa.nome_fantasia || empresa.razao_social || 'Fantasia não informada',
              cnpj_cpf: empresa.cnpj || 'CNPJ não informado',
              ultima_emissao: null,
              certificado_status: null,
              actions: ['EDITAR', 'EXCLUIR']
            }));

            empresasCache = empresasFormatadas;
            cacheTimestamp = now;
            setEmpresas(empresasFormatadas);

            toast({
              title: "Empresas carregadas do banco local",
              description: `${empresasFormatadas.length} empresas encontradas`,
            });

            return empresasFormatadas;
          }
        } catch (supabaseError) {
          console.error('❌ Erro ao carregar do Supabase:', supabaseError);
        }

        // Se não há empresas nem no Supabase, usar dados mock
        empresasCache = MOCK_EMPRESAS;
        cacheTimestamp = now;

        setEmpresas(MOCK_EMPRESAS);

        toast({
          title: "Nenhuma empresa cadastrada",
          description: "Não há empresas cadastradas. Mostrando dados de exemplo.",
        });

        return MOCK_EMPRESAS;
      }

      // Converter dados da API para o formato da interface
      const empresasFormatadas: EmpresaListItem[] = empresasArray.map((empresa: any) => ({
        id: empresa.id ? empresa.id.toString() : Math.random().toString(),
        nome: empresa.nome || 'Nome não informado',
        nome_fantasia: empresa.nome_fantasia || empresa.nome || 'Fantasia não informada',
        cnpj_cpf: empresa.cnpj || empresa.cpf || 'Documento não informado',
        ultima_emissao: empresa.data_ultima_emissao || null,
        certificado_status: formatCertificadoStatus(empresa),
        actions: ['EDITAR', 'EXCLUIR']
      }));

      // Atualizar cache
      empresasCache = empresasFormatadas;
      cacheTimestamp = now;

      setEmpresas(empresasFormatadas);

      toast({
        title: "Empresas carregadas",
        description: `${empresasFormatadas.length} empresas encontradas`,
      });

      return empresasFormatadas;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';

      console.log('❌ Erro ao carregar da API Focus NFe:', errorMessage);

      // Tentar carregar do Supabase como fallback para qualquer erro
      try {
        console.log('🔄 Tentando carregar do Supabase como fallback...');
        const empresasSupabase = await buscarEmpresasSupabase();
        if (empresasSupabase && empresasSupabase.length > 0) {
          console.log('✅ Empresas carregadas do Supabase como fallback:', empresasSupabase.length);

          const empresasFormatadas: EmpresaListItem[] = empresasSupabase.map((empresa: any) => ({
            id: empresa.id ? empresa.id.toString() : Math.random().toString(),
            nome: empresa.razao_social || 'Nome não informado',
            nome_fantasia: empresa.nome_fantasia || empresa.razao_social || 'Fantasia não informada',
            cnpj_cpf: empresa.cnpj || 'CNPJ não informado',
            ultima_emissao: null,
            certificado_status: null,
            actions: ['EDITAR', 'EXCLUIR']
          }));

          empresasCache = empresasFormatadas;
          cacheTimestamp = now;
          setEmpresas(empresasFormatadas);
          setError(null); // Limpar erro já que conseguimos dados do Supabase

          toast({
            title: "Empresas carregadas do banco local",
            description: `${empresasFormatadas.length} empresas encontradas (API Focus NFe com problemas)`,
          });

          return empresasFormatadas;
        }
      } catch (supabaseError) {
        console.error('❌ Erro ao carregar do Supabase também:', supabaseError);
      }

      // Se erro 429 ou API indisponível, usar dados mock
      if (errorMessage.includes('Limite de requisições excedido') || errorMessage.includes('429')) {
        console.log('🎭 Usando dados mock como último recurso');

        empresasCache = MOCK_EMPRESAS;
        cacheTimestamp = now;

        setEmpresas(MOCK_EMPRESAS);
        setError(null); // Limpar erro já que temos dados mock

        toast({
          title: "Usando dados de exemplo",
          description: "API temporariamente indisponível. Mostrando dados de exemplo.",
        });

        return MOCK_EMPRESAS;
      }

      // Para outros erros, mostrar mensagem de erro mas não fazer throw
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Erro ao carregar empresas",
        description: `${errorMessage}. Verifique sua conexão e tente novamente.`,
      });

      // Retornar array vazio em vez de fazer throw para não quebrar a interface
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar o status do certificado
  const formatCertificadoStatus = (empresa: any): string => {
    if (!empresa.certificado_valido_ate) {
      return 'CERTIFICADO_NAO_CONFIGURADO';
    }

    try {
      const dataValidade = new Date(empresa.certificado_valido_ate);
      const hoje = new Date();

      if (dataValidade < hoje) {
        return `VENCIDO_DESDE_${dataValidade.toISOString().split('T')[0]}`;
      } else {
        return `VALIDO_ATE_${dataValidade.toISOString().split('T')[0]}`;
      }
    } catch (error) {
      console.warn('Erro ao processar data do certificado:', error);
      return 'DATA_CERTIFICADO_INVALIDA';
    }
  };

  // Função para criar uma nova empresa
  const createEmpresa = async (empresaData: Partial<FocusNFeEmpresa>) => {
    setLoading(true);
    setError(null);

    try {
      const data = await makeRequest('/empresas', {
        method: 'POST',
        body: JSON.stringify(empresaData),
      });

      toast({
        title: "Empresa criada",
        description: "Nova empresa foi criada com sucesso!",
      });

      // Recarregar a lista de empresas
      await fetchEmpresas();
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Erro ao criar empresa",
        description: errorMessage,
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar uma empresa
  const updateEmpresa = async (id: string, empresaData: Partial<FocusNFeEmpresa>) => {
    setLoading(true);
    setError(null);

    try {
      const data = await makeRequest(`/empresas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(empresaData),
      });

      toast({
        title: "Empresa atualizada",
        description: "Dados da empresa foram atualizados com sucesso!",
      });

      // Recarregar a lista de empresas
      await fetchEmpresas();
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Erro ao atualizar empresa",
        description: errorMessage,
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir uma empresa
  const deleteEmpresa = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await makeRequest(`/empresas/${id}`, {
        method: 'DELETE',
      });

      toast({
        title: "Empresa excluída",
        description: "A empresa foi removida com sucesso.",
      });

      // Recarregar a lista de empresas
      await fetchEmpresas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Erro ao excluir empresa",
        description: errorMessage,
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar uma empresa específica
  const getEmpresa = async (id: string): Promise<FocusNFeEmpresa> => {
    setLoading(true);
    setError(null);

    try {
      // Usar o endpoint correto da API Focus NFe para buscar empresa específica
      const data: FocusNFeEmpresa = await makeRequest(`/empresas/${id}`);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);

      toast({
        variant: "destructive",
        title: "Erro ao buscar empresa",
        description: errorMessage,
      });

      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para emitir NFSe
  const emitirNFSe = async (referencia: string, nfseData: any, empresaData: any) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🏢 Dados da empresa recebidos para emissão:', empresaData);

      // Usar o token de produção da empresa ou o token padrão
      const token = empresaData.focus_nfe_token_producao || TOKEN_PRODUCAO;

      if (!token) {
        throw new Error('Token da Focus NFe não configurado para esta empresa');
      }

      console.log('🔑 Usando token para emissão:', token.substring(0, 10) + '...');
      console.log('📤 Enviando dados para Focus NFe:', nfseData);

      const response = await fetch(`${FOCUS_NFE_API_BASE}/nfse?ref=${referencia}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${token}:`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nfseData),
      });

      console.log('📥 Resposta da Focus NFe - Status:', response.status);

      const responseText = await response.text();
      console.log('📥 Resposta da Focus NFe - Body:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse da resposta:', parseError);
        throw new Error(`Resposta inválida da API: ${responseText}`);
      }

      if (!response.ok) {
        const errorMessage = data.mensagem || data.message || `Erro HTTP: ${response.status}`;
        console.error('❌ Erro na API Focus NFe:', data);
        throw new Error(errorMessage);
      }

      console.log('✅ NFSe enviada com sucesso:', data);

      toast({
        title: "NFSe enviada para processamento",
        description: "A NFSe foi enviada e está sendo processada",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro ao emitir NFSe:', err);
      setError(errorMessage);

      toast({
        variant: "destructive",
        title: "Erro ao emitir NFSe",
        description: errorMessage,
      });

      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para consultar NFSe
  const consultarNFSe = async (referencia: string, empresaId: string) => {
    try {
      console.log('🔍 Consultando NFSe:', referencia, 'para empresa:', empresaId);

      // Buscar dados da empresa no Supabase
      const { data: empresaSupabase, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

      if (empresaError || !empresaSupabase) {
        throw new Error('Empresa não encontrada no sistema');
      }

      // Usar o token de produção da empresa ou o token padrão
      const token = empresaSupabase.focus_nfe_token_producao || TOKEN_PRODUCAO;

      if (!token) {
        throw new Error('Token da Focus NFe não configurado para esta empresa');
      }

      const response = await fetch(`${FOCUS_NFE_API_BASE}/nfse/${referencia}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${token}:`)}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Resposta da consulta NFSe - Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na consulta NFSe:', errorData);
        throw new Error(errorData.mensagem || `Erro HTTP: ${response.status}`);
      }

      return response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    }
  };

  // Função para listar empresas (formato simplificado para o componente)
  const listarEmpresas = async () => {
    // Verificar cache primeiro
    const now = Date.now();
    if (empresasCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      return empresasCache.map(empresa => ({
        id: empresa.id,
        nome: empresa.nome,
        cnpj: empresa.cnpj_cpf,
        inscricao_municipal: '', // Será preenchido quando buscar dados completos
        municipio: '',
        uf: ''
      }));
    }

    // Se não há cache válido, buscar dados apenas se não estiver carregando
    if (!loading) {
      const empresasData = await fetchEmpresas();
      return empresasData.map(empresa => ({
        id: empresa.id,
        nome: empresa.nome,
        cnpj: empresa.cnpj_cpf,
        inscricao_municipal: '', // Será preenchido quando buscar dados completos
        municipio: '',
        uf: ''
      }));
    }

    // Retornar array vazio se estiver carregando
    return [];
  };

  // Função para carregar empresas manualmente (sem useEffect)
  const carregarEmpresas = async () => {
    if (loading) return; // Evitar múltiplas requisições simultâneas
    await fetchEmpresas();
  };

  // Função para limpar cache
  const limparCache = () => {
    empresasCache = [];
    cacheTimestamp = 0;
  };

  // Função para buscar empresas do Supabase
  const buscarEmpresasSupabase = async (): Promise<Company[]> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('razao_social');

      if (error) {
        console.error('❌ Erro ao buscar empresas:', error);
        throw new Error(`Erro ao buscar empresas: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar empresas:', error);
      throw error;
    }
  };

  // Função para buscar empresa por ID
  const buscarEmpresaPorId = async (id: string): Promise<Company | null> => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar empresa:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar empresa:', error);
      return null;
    }
  };

  // Função para consultar CNPJ na ReceitaWS
  const consultarCNPJ = async (cnpj: string): Promise<CNPJData | null> => {
    try {
      // Limpar CNPJ (remover pontos, barras e hífens)
      const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

      if (cnpjLimpo.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos');
      }

      console.log('🔍 Consultando CNPJ:', cnpjLimpo);

      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`);

      if (!response.ok) {
        throw new Error('Erro ao consultar CNPJ');
      }

      const data = await response.json();

      if (data.status === 'ERROR') {
        throw new Error(data.message || 'CNPJ não encontrado');
      }

      console.log('✅ Dados do CNPJ:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao consultar CNPJ:', error);
      toast({
        title: "Erro ao consultar CNPJ",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    }
  };

  // Função para buscar tomadores de uma empresa
  const buscarTomadores = async (companyId: string): Promise<Tomador[]> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', companyId)
        .order('razao_social');

      if (error) {
        console.error('❌ Erro ao buscar tomadores:', error);
        throw new Error(`Erro ao buscar tomadores: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar tomadores:', error);
      throw error;
    }
  };

  // Função para salvar tomador
  const salvarTomador = async (tomador: Omit<Tomador, 'id' | 'created_at' | 'updated_at'>): Promise<Tomador | null> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([tomador])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar tomador:', error);
        throw new Error(`Erro ao salvar tomador: ${error.message}`);
      }

      toast({
        title: "Tomador salvo",
        description: "Tomador cadastrado com sucesso",
      });

      return data;
    } catch (error) {
      console.error('❌ Erro ao salvar tomador:', error);
      toast({
        title: "Erro ao salvar tomador",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    }
  };

  // Função para atualizar tomador
  const atualizarTomador = async (id: string, tomador: Partial<Tomador>): Promise<Tomador | null> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...tomador, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar tomador:', error);
        throw new Error(`Erro ao atualizar tomador: ${error.message}`);
      }

      toast({
        title: "Tomador atualizado",
        description: "Dados do tomador atualizados com sucesso",
      });

      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar tomador:', error);
      toast({
        title: "Erro ao atualizar tomador",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    }
  };

  // Função para sincronizar empresas da Focus NFe com o Supabase
  const sincronizarEmpresasFocusNFe = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Iniciando sincronização de empresas da Focus NFe...');

      // Buscar empresas da Focus NFe
      const empresasFocus = await makeRequest('/empresas');

      if (!empresasFocus || !Array.isArray(empresasFocus)) {
        throw new Error('Nenhuma empresa encontrada na Focus NFe');
      }

      console.log(`📋 Encontradas ${empresasFocus.length} empresas na Focus NFe`);

      let empresasInseridas = 0;
      let empresasAtualizadas = 0;
      let erros = 0;

      // Processar cada empresa
      for (const empresaFocus of empresasFocus) {
        try {
          // Verificar se a empresa já existe no Supabase
          const { data: empresaExistente, error: errorBusca } = await supabase
            .from('companies')
            .select('id, focus_nfe_empresa_id')
            .eq('focus_nfe_empresa_id', parseInt(empresaFocus.id))
            .single();

          const dadosEmpresa = {
            focus_nfe_empresa_id: parseInt(empresaFocus.id) || null,
            cnpj_cpf: empresaFocus.cnpj || '',
            razao_social: empresaFocus.razao_social || empresaFocus.nome || '',
            nome_fantasia: empresaFocus.nome_fantasia || '',
            cep: empresaFocus.cep || '',
            logradouro: empresaFocus.logradouro || '',
            numero: empresaFocus.numero || '',
            bairro: empresaFocus.bairro || '',
            cidade: empresaFocus.cidade || '',
            estado_uf: empresaFocus.uf || '',
            codigo_municipio: empresaFocus.codigo_municipio || '',
            inscricao_municipal: empresaFocus.inscricao_municipal || '',
            focus_nfe_token_homologacao: empresaFocus.token_homologacao || '',
            focus_nfe_token_producao: empresaFocus.token_producao || '',
            focus_nfe_habilitado: true,
            updated_at: new Date().toISOString(),
          };

          if (empresaExistente && !errorBusca) {
            // Atualizar empresa existente
            const { error: errorUpdate } = await supabase
              .from('companies')
              .update(dadosEmpresa)
              .eq('id', empresaExistente.id);

            if (errorUpdate) {
              console.error(`❌ Erro ao atualizar empresa ${empresaFocus.razao_social}:`, errorUpdate);
              erros++;
            } else {
              console.log(`✅ Empresa atualizada: ${empresaFocus.razao_social}`);
              empresasAtualizadas++;
            }
          } else {
            // Inserir nova empresa
            const { error: errorInsert } = await supabase
              .from('companies')
              .insert([{
                ...dadosEmpresa,
                created_by: '1e88dc16-5907-4a07-bdf7-005c70fe8941', // ID válido encontrado na base
                created_at: new Date().toISOString(),
              }]);

            if (errorInsert) {
              console.error(`❌ Erro ao inserir empresa ${empresaFocus.razao_social}:`, errorInsert);
              erros++;
            } else {
              console.log(`✅ Nova empresa inserida: ${empresaFocus.razao_social}`);
              empresasInseridas++;
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao processar empresa ${empresaFocus.razao_social || empresaFocus.id}:`, error);
          erros++;
        }
      }

      // Mostrar resultado da sincronização
      const mensagem = `Sincronização concluída: ${empresasInseridas} inseridas, ${empresasAtualizadas} atualizadas`;

      toast({
        title: "Sincronização concluída",
        description: erros > 0 ? `${mensagem}. ${erros} erros encontrados.` : mensagem,
        variant: erros > 0 ? "destructive" : "default",
      });

      console.log(`🎉 ${mensagem}. Erros: ${erros}`);

      // Recarregar cache de empresas
      await buscarEmpresasSupabase();

      return {
        inseridas: empresasInseridas,
        atualizadas: empresasAtualizadas,
        erros: erros,
        total: empresasFocus.length
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro na sincronização:', error);

      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Erro na sincronização",
        description: errorMessage,
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    empresas,
    loading,
    error,
    fetchEmpresas,
    carregarEmpresas,
    limparCache,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    getEmpresa,
    emitirNFSe,
    consultarNFSe,
    listarEmpresas,
    makeRequest,
    // Novas funções
    buscarEmpresasSupabase,
    buscarEmpresaPorId,
    consultarCNPJ,
    buscarTomadores,
    salvarTomador,
    atualizarTomador,
    sincronizarEmpresasFocusNFe,
  };
}
