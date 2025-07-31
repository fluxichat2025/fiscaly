// Cliente simplificado da Focus NFe usando fetch nativo
import {
  FocusNFeConfig,
  FocusNFeEmpresa,
  FocusNFeEmpresaCreate,
  FocusNFeNFSe,
  FocusNFeNFSeResponse,
  FocusNFeApiResponse,
  FocusNFeError,
  FocusNFeErrorClass,
  FocusNFeWebhook,
  FOCUS_NFE_ENDPOINTS,
  FOCUS_NFE_PATHS
} from './types'

export class FocusNFeClient {
  private config: FocusNFeConfig

  constructor(config: FocusNFeConfig) {
    this.config = config
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<FocusNFeApiResponse<T>> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`
      const token = btoa(`${this.config.token}:`)
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${token}`,
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new FocusNFeErrorClass(
          data.message || `HTTP ${response.status}`,
          response.status,
          'api_error',
          data
        )
      }

      return {
        success: true,
        data,
        status: response.status
      }
    } catch (error: any) {
      return {
        success: false,
        error: error as FocusNFeError,
        status: error.statusCode || 500
      }
    }
  }

  // Métodos HTTP básicos
  async get<T = any>(url: string): Promise<FocusNFeApiResponse<T>> {
    return this.makeRequest<T>(url, { method: 'GET' })
  }

  async post<T = any>(url: string, data: any): Promise<FocusNFeApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put<T = any>(url: string, data: any): Promise<FocusNFeApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete<T = any>(url: string, data?: any): Promise<FocusNFeApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // Métodos específicos da Focus NFe
  async criarEmpresa(dados: FocusNFeEmpresaCreate): Promise<FocusNFeApiResponse<FocusNFeEmpresa>> {
    return this.post<FocusNFeEmpresa>(FOCUS_NFE_PATHS.EMPRESAS, dados)
  }

  async atualizarEmpresa(cnpj: string, dados: Partial<FocusNFeEmpresaCreate>): Promise<FocusNFeApiResponse<FocusNFeEmpresa>> {
    const cnpjSanitized = cnpj.replace(/\D/g, '')
    return this.put<FocusNFeEmpresa>(`${FOCUS_NFE_PATHS.EMPRESAS}/${cnpjSanitized}`, dados)
  }

  async consultarEmpresa(cnpj: string): Promise<FocusNFeApiResponse<FocusNFeEmpresa>> {
    const cnpjSanitized = cnpj.replace(/\D/g, '')
    return this.get<FocusNFeEmpresa>(`${FOCUS_NFE_PATHS.EMPRESAS}/${cnpjSanitized}`)
  }

  async listarEmpresas(): Promise<FocusNFeApiResponse<FocusNFeEmpresa[]>> {
    return this.get<FocusNFeEmpresa[]>(FOCUS_NFE_PATHS.EMPRESAS)
  }

  async emitirNFSe(ref: string, dados: FocusNFeNFSe): Promise<FocusNFeApiResponse<FocusNFeNFSeResponse>> {
    return this.post<FocusNFeNFSeResponse>(`${FOCUS_NFE_PATHS.NFSE}?ref=${ref}`, dados)
  }

  async consultarNFSe(ref: string): Promise<FocusNFeApiResponse<FocusNFeNFSeResponse>> {
    return this.get<FocusNFeNFSeResponse>(`${FOCUS_NFE_PATHS.NFSE}/${ref}`)
  }

  async cancelarNFSe(ref: string, justificativa: string): Promise<FocusNFeApiResponse<any>> {
    if (!justificativa || justificativa.length < 15) {
      throw new FocusNFeErrorClass('Justificativa para cancelamento deve ter pelo menos 15 caracteres')
    }
    return this.delete(`${FOCUS_NFE_PATHS.NFSE}/${ref}`, { justificativa })
  }

  async verificarStatus(): Promise<FocusNFeApiResponse<any>> {
    return this.get(FOCUS_NFE_PATHS.NFSE_STATUS)
  }
}

// Função helper para criar instância do cliente
export function createFocusNFeClient(token: string, ambiente: 'homologacao' | 'producao' = 'homologacao'): FocusNFeClient {
  const baseUrl = ambiente === 'producao' ? FOCUS_NFE_ENDPOINTS.PRODUCAO : FOCUS_NFE_ENDPOINTS.HOMOLOGACAO
  
  return new FocusNFeClient({
    baseUrl,
    token,
    ambiente
  })
}