// Serviço para integração com APIs públicas para automatizar preenchimento de formulários
import { toast } from '@/hooks/use-toast'

// Tipos para dados da Receita Federal
interface ReceitaFederalData {
  cnpj: string
  razao_social: string
  nome_fantasia?: string
  situacao: string
  tipo: string
  porte: string
  natureza_juridica: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  municipio: string
  uf: string
  cep: string
  telefone?: string
  email?: string
  atividade_principal: {
    code: string
    text: string
  }
  atividades_secundarias: Array<{
    code: string
    text: string
  }>
  capital_social: string
  data_situacao: string
  data_abertura: string
}

// Tipos para dados bancários
interface BankData {
  code: string
  name: string
  fullName: string
  ispb: string
}

// Tipos para CEP
interface CepData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

class PublicApisService {
  private readonly RECEITA_FEDERAL_API = 'https://receitaws.com.br/v1/cnpj'
  private readonly BANKS_API = 'https://brasilapi.com.br/api/banks/v1'
  private readonly CEP_API = 'https://viacep.com.br/ws'
  private readonly IBGE_API = 'https://servicodados.ibge.gov.br/api/v1'

  // Cache para evitar requisições desnecessárias
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

  /**
   * Busca dados de CNPJ na Receita Federal
   */
  async fetchCnpjData(cnpj: string): Promise<ReceitaFederalData | null> {
    try {
      // Limpar e validar CNPJ
      const cleanCnpj = cnpj.replace(/\D/g, '')
      if (cleanCnpj.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos')
      }

      // Verificar cache
      const cacheKey = `cnpj_${cleanCnpj}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      console.log('🔍 Buscando dados do CNPJ:', cleanCnpj)

      const response = await fetch(`${this.RECEITA_FEDERAL_API}/${cleanCnpj}`)
      
      if (!response.ok) {
        throw new Error(`Erro na API da Receita Federal: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === 'ERROR') {
        throw new Error(data.message || 'CNPJ não encontrado')
      }

      // Mapear dados para nosso formato
      const mappedData: ReceitaFederalData = {
        cnpj: data.cnpj,
        razao_social: data.nome,
        nome_fantasia: data.fantasia,
        situacao: data.situacao,
        tipo: data.tipo,
        porte: data.porte,
        natureza_juridica: data.natureza_juridica,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        municipio: data.municipio,
        uf: data.uf,
        cep: data.cep,
        telefone: data.telefone,
        email: data.email,
        atividade_principal: data.atividade_principal,
        atividades_secundarias: data.atividades_secundarias || [],
        capital_social: data.capital_social,
        data_situacao: data.data_situacao,
        data_abertura: data.abertura
      }

      // Salvar no cache
      this.saveToCache(cacheKey, mappedData)

      console.log('✅ Dados do CNPJ obtidos com sucesso:', mappedData.razao_social)
      return mappedData

    } catch (error: any) {
      console.error('❌ Erro ao buscar dados do CNPJ:', error)
      toast({
        title: 'Erro ao consultar CNPJ',
        description: error.message,
        variant: 'destructive'
      })
      return null
    }
  }

  /**
   * Busca dados de CEP
   */
  async fetchCepData(cep: string): Promise<CepData | null> {
    try {
      const cleanCep = cep.replace(/\D/g, '')
      if (cleanCep.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos')
      }

      const cacheKey = `cep_${cleanCep}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      console.log('🔍 Buscando dados do CEP:', cleanCep)

      const response = await fetch(`${this.CEP_API}/${cleanCep}/json/`)
      
      if (!response.ok) {
        throw new Error(`Erro na API do CEP: ${response.status}`)
      }

      const data = await response.json()

      if (data.erro) {
        throw new Error('CEP não encontrado')
      }

      this.saveToCache(cacheKey, data)

      console.log('✅ Dados do CEP obtidos com sucesso:', data.localidade)
      return data

    } catch (error: any) {
      console.error('❌ Erro ao buscar dados do CEP:', error)
      toast({
        title: 'Erro ao consultar CEP',
        description: error.message,
        variant: 'destructive'
      })
      return null
    }
  }

  /**
   * Busca lista de bancos
   */
  async fetchBanksList(): Promise<BankData[]> {
    try {
      const cacheKey = 'banks_list'
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      console.log('🔍 Buscando lista de bancos')

      const response = await fetch(this.BANKS_API)
      
      if (!response.ok) {
        throw new Error(`Erro na API de bancos: ${response.status}`)
      }

      const data = await response.json()

      // Ordenar por nome
      const sortedBanks = data.sort((a: BankData, b: BankData) => 
        a.name.localeCompare(b.name)
      )

      this.saveToCache(cacheKey, sortedBanks)

      console.log('✅ Lista de bancos obtida com sucesso:', sortedBanks.length, 'bancos')
      return sortedBanks

    } catch (error: any) {
      console.error('❌ Erro ao buscar lista de bancos:', error)
      toast({
        title: 'Erro ao consultar bancos',
        description: error.message,
        variant: 'destructive'
      })
      return []
    }
  }

  /**
   * Busca municípios por UF
   */
  async fetchMunicipiosByUf(uf: string): Promise<Array<{ id: number; nome: string }>> {
    try {
      const cacheKey = `municipios_${uf}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      console.log('🔍 Buscando municípios da UF:', uf)

      const response = await fetch(`${this.IBGE_API}/localidades/estados/${uf}/municipios`)
      
      if (!response.ok) {
        throw new Error(`Erro na API do IBGE: ${response.status}`)
      }

      const data = await response.json()

      // Ordenar por nome
      const sortedMunicipios = data.sort((a: any, b: any) => 
        a.nome.localeCompare(b.nome)
      )

      this.saveToCache(cacheKey, sortedMunicipios)

      console.log('✅ Municípios obtidos com sucesso:', sortedMunicipios.length, 'municípios')
      return sortedMunicipios

    } catch (error: any) {
      console.error('❌ Erro ao buscar municípios:', error)
      toast({
        title: 'Erro ao consultar municípios',
        description: error.message,
        variant: 'destructive'
      })
      return []
    }
  }

  /**
   * Sugere categorias baseado no histórico e descrição
   */
  async suggestCategories(description: string, historicalData?: any[]): Promise<string[]> {
    try {
      const suggestions: string[] = []

      // Categorias baseadas em palavras-chave
      const categoryKeywords = {
        'Alimentação': ['restaurante', 'lanchonete', 'padaria', 'supermercado', 'mercado'],
        'Transporte': ['combustível', 'gasolina', 'uber', 'taxi', 'pedágio', 'estacionamento'],
        'Escritório': ['papelaria', 'material', 'escritório', 'impressão', 'xerox'],
        'Marketing': ['publicidade', 'marketing', 'propaganda', 'anúncio', 'facebook', 'google'],
        'Tecnologia': ['software', 'hardware', 'computador', 'internet', 'hospedagem'],
        'Consultoria': ['consultoria', 'assessoria', 'serviços', 'profissional'],
        'Impostos': ['imposto', 'taxa', 'tributo', 'darf', 'das', 'simples'],
        'Aluguel': ['aluguel', 'locação', 'imóvel', 'sala', 'galpão']
      }

      const descLower = description.toLowerCase()

      // Buscar por palavras-chave
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => descLower.includes(keyword))) {
          suggestions.push(category)
        }
      }

      // Se há dados históricos, analisar padrões
      if (historicalData && historicalData.length > 0) {
        const historicalCategories = historicalData
          .filter(item => item.description && item.category)
          .map(item => ({
            description: item.description.toLowerCase(),
            category: item.category
          }))

        // Buscar por similaridade
        for (const historical of historicalCategories) {
          const similarity = this.calculateSimilarity(descLower, historical.description)
          if (similarity > 0.6 && !suggestions.includes(historical.category)) {
            suggestions.push(historical.category)
          }
        }
      }

      // Limitar a 5 sugestões
      return suggestions.slice(0, 5)

    } catch (error: any) {
      console.error('❌ Erro ao sugerir categorias:', error)
      return []
    }
  }

  /**
   * Calcula similaridade entre duas strings (algoritmo simples)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ')
    const words2 = str2.split(' ')
    
    let matches = 0
    for (const word1 of words1) {
      if (word1.length > 2 && words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        matches++
      }
    }
    
    return matches / Math.max(words1.length, words2.length)
  }

  /**
   * Gerenciamento de cache
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📦 Dados obtidos do cache:', key)
      return cached.data
    }
    return null
  }

  private saveToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ Cache limpo')
  }
}

// Instância singleton
export const publicApisService = new PublicApisService()

// Funções de conveniência para uso direto
export const fetchCnpjData = (cnpj: string) => publicApisService.fetchCnpjData(cnpj)
export const fetchCepData = (cep: string) => publicApisService.fetchCepData(cep)
export const fetchBanksList = () => publicApisService.fetchBanksList()
export const fetchMunicipiosByUf = (uf: string) => publicApisService.fetchMunicipiosByUf(uf)
export const suggestCategories = (description: string, historicalData?: any[]) => 
  publicApisService.suggestCategories(description, historicalData)
