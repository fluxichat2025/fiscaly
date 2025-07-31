// Tipos para integração com a API Focus NFe

export interface FocusNFeConfig {
  baseUrl: string
  token: string
  ambiente: 'homologacao' | 'producao'
}

// Interface para empresa com campos obrigatórios da Focus NFe
export interface FocusNFeEmpresa {
  id?: number
  // Dados básicos
  nome: string // Razão social
  nome_fantasia?: string
  cnpj: string
  cpf?: string
  inscricao_estadual?: string
  inscricao_municipal?: string
  
  // Endereço (campos planos conforme documentação)
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  município: string
  uf: string
  cep: string
  
  // Códigos obrigatórios
  codigo_município: string
  codigo_pais?: string // Padrão: '1058' para Brasil
  codigo_uf: string
  
  // Contato
  telefone?: string
  email?: string
  
  // Configurações
  regime_tributario?: string // 1=Simples Nacional, 2=Simples Excesso, 3=Regime Normal
  habilita_nfse?: boolean
  
  // Certificado digital
  arquivo_certificado_base64?: string
  senha_certificado?: string
  token_producao?: string
  token_homologacao?: string
  certificado_valido_ate?: string
  certificado_valido_de?: string
  certificado_cnpj?: string
}

export interface FocusNFeEmpresaCreate {
  // Dados básicos
  nome: string // Razão social
  nome_fantasia?: string
  cnpj: string
  inscricao_estadual?: string
  inscricao_municipal?: string
  
  // Endereço (campos planos conforme documentação)
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  município: string
  uf: string
  cep: string
  
  // Códigos obrigatórios
  codigo_município: string
  codigo_pais?: string // Padrão: '1058' para Brasil
  codigo_uf: string
  
  // Contato
  telefone?: string
  email?: string
  
  // Configurações
  regime_tributario?: string // 1=Simples Nacional, 2=Simples Excesso, 3=Regime Normal
  habilita_nfse?: boolean
  habilita_nfe?: boolean
  habilita_nfce?: boolean
  habilita_cte?: boolean
  habilita_mdfe?: boolean
  
  // Certificado digital
  arquivo_certificado_base64?: string
  senha_certificado?: string
}

// Interface para NFSe com campos obrigatórios
export interface FocusNFeNFSe {
  data_emissao: string
  incentivador_cultural?: boolean
  natureza_operacao?: string
  optante_simples_nacional?: boolean
  
  // Prestador (empresa)
  prestador: {
    cnpj: string
    inscricao_municipal?: string
    codigo_município: string
  }
  
  // Tomador (cliente)
  tomador: {
    cnpj?: string
    cpf?: string
    razao_social: string
    email?: string
    endereco?: {
      logradouro: string
      numero: string
      complemento?: string
      bairro: string
      município: string
      uf: string
      cep?: string
      codigo_município?: string
    }
  }
  
  // Serviço
  servicos: Array<{
    aliquota?: number
    base_calculo?: number
    codigo_cnae?: string
    codigo_tributario_município?: string
    descricao: string
    iss_retido?: boolean
    item_lista_servico?: string
    quantidade?: number
    valor_servicos: number
    valor_unitario?: number
    valor_deducoes?: number
    valor_pis?: number
    valor_cofins?: number
    valor_inss?: number
    valor_ir?: number
    valor_csll?: number
    valor_iss?: number
  }>
}

export interface FocusNFeNFSeResponse {
  ref: string
  status: 'processando_autorizacao' | 'autorizado' | 'erro_autorizacao' | 'cancelado'
  status_sefaz?: string
  mensagem_sefaz?: string
  numero?: string
  codigo_verificacao?: string
  data_emissao?: string
  url?: string
  url_danfse?: string
  caminho_xml_nota_fiscal?: string
  caminho_danfse?: string
  erros?: Array<{
    codigo: string
    mensagem: string
  }>
}

export interface FocusNFeError {
  codigo: string
  mensagem: string
  erros?: Array<{
    codigo: string
    mensagem: string
    campo?: string
  }>
}

export interface FocusNFeApiResponse<T = any> {
  success: boolean
  data?: T
  error?: FocusNFeError
  status?: number
}

// Tipos para status da API
export interface FocusNFeStatusResponse {
  status_servico_municípal: string
  status_servico_nacional?: string
  mensagem?: string
}

// Tipos para consulta de empresas
export interface FocusNFeEmpresaListParams {
  cnpj?: string
  cpf?: string
  offset?: number
}

// Tipos para emissão de NFSe
export interface FocusNFeEmissaoParams {
  ref: string
  data: FocusNFeNFSe
}

// Tipos para consulta de NFSe
export interface FocusNFeConsultaParams {
  ref: string
}

// Tipos para cancelamento de NFSe
export interface FocusNFeCancelamentoParams {
  ref: string
  justificativa: string
}

export interface FocusNFeCancelamentoResponse {
  status: string
  mensagem_sefaz?: string
  data_cancelamento?: string
}

// Configuração de webhook
export interface FocusNFeWebhook {
  url: string
  eventos: string[]
}

// Resposta de webhook
export interface FocusNFeWebhookResponse {
  ref: string
  status: string
  numero?: string
  codigo_verificacao?: string
  data_emissao?: string
  url?: string
  caminho_xml_nota_fiscal?: string
  erros?: Array<{
    codigo: string
    mensagem: string
  }>
  mensagem?: string
  justificativa_cancelamento?: string
  data_cancelamento?: string
}

// Erros específicos da Focus NFe
export class FocusNFeErrorClass extends Error {
  constructor(
    public message: string,
    public statusCode?: number,
    public errorCode?: string,
    public errors?: Array<{ codigo: string; mensagem: string }>
  ) {
    super(message)
    this.name = 'FocusNFeError'
  }
}

// Tipos de eventos de webhook
export type FocusNFeEventType = 
  | 'nfse.autorizada'
  | 'nfse.erro'
  | 'nfse.cancelada'
  | 'nfe.autorizada'
  | 'nfe.erro'
  | 'nfe.cancelada'
  | 'nfce.autorizada'
  | 'nfce.erro'
  | 'nfce.cancelada'

// Constantes da API
export const FOCUS_NFE_ENDPOINTS = {
  HOMOLOGACAO: 'https://homologacao.focusnfe.com.br',
  PRODUCAO: 'https://api.focusnfe.com.br'
} as const

export const FOCUS_NFE_PATHS = {
  EMPRESAS: '/v2/empresas',
  NFSE: '/v2/nfse',
  NFSE_STATUS: '/v2/nfse/status',
  WEBHOOKS: '/v2/hooks'
} as const