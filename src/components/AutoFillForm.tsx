import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  MapPin, 
  Building2, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { fetchCnpjData, fetchCepData, fetchBanksList, suggestCategories } from '@/services/publicApisService'
import { useToast } from '@/hooks/use-toast'

interface AutoFillFormProps {
  onDataFilled: (data: any) => void
  type: 'cnpj' | 'cep' | 'category'
  placeholder?: string
  label?: string
  historicalData?: any[]
}

const AutoFillForm = ({ onDataFilled, type, placeholder, label, historicalData }: AutoFillFormProps) => {
  const { toast } = useToast()
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [lastFetchedData, setLastFetchedData] = useState<any>(null)

  const handleSearch = async () => {
    if (!inputValue.trim()) return

    setLoading(true)
    setSuggestions([])

    try {
      let data = null

      switch (type) {
        case 'cnpj':
          data = await fetchCnpjData(inputValue)
          if (data) {
            setLastFetchedData(data)
            onDataFilled({
              cnpj: data.cnpj,
              razao_social: data.razao_social,
              nome_fantasia: data.nome_fantasia,
              situacao: data.situacao,
              endereco: {
                logradouro: data.logradouro,
                numero: data.numero,
                complemento: data.complemento,
                bairro: data.bairro,
                municipio: data.municipio,
                uf: data.uf,
                cep: data.cep
              },
              telefone: data.telefone,
              email: data.email,
              atividade_principal: data.atividade_principal,
              atividades_secundarias: data.atividades_secundarias,
              capital_social: data.capital_social,
              data_abertura: data.data_abertura
            })
            
            toast({
              title: 'Dados preenchidos automaticamente',
              description: `Empresa: ${data.razao_social}`,
            })
          }
          break

        case 'cep':
          data = await fetchCepData(inputValue)
          if (data) {
            setLastFetchedData(data)
            onDataFilled({
              cep: data.cep,
              logradouro: data.logradouro,
              complemento: data.complemento,
              bairro: data.bairro,
              localidade: data.localidade,
              uf: data.uf,
              ibge: data.ibge
            })
            
            toast({
              title: 'Endereço preenchido automaticamente',
              description: `${data.logradouro}, ${data.localidade} - ${data.uf}`,
            })
          }
          break

        case 'category':
          const categories = await suggestCategories(inputValue, historicalData)
          setSuggestions(categories)
          if (categories.length > 0) {
            toast({
              title: 'Categorias sugeridas',
              description: `${categories.length} sugestões encontradas`,
            })
          }
          break
      }

    } catch (error: any) {
      console.error('Erro no preenchimento automático:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onDataFilled({ category: suggestion })
    setSuggestions([])
    setInputValue('')
    
    toast({
      title: 'Categoria selecionada',
      description: suggestion,
    })
  }

  const getPlaceholderText = () => {
    switch (type) {
      case 'cnpj': return placeholder || 'Digite o CNPJ (apenas números)'
      case 'cep': return placeholder || 'Digite o CEP (apenas números)'
      case 'category': return placeholder || 'Digite a descrição para sugerir categorias'
      default: return placeholder || 'Digite para buscar'
    }
  }

  const getLabelText = () => {
    switch (type) {
      case 'cnpj': return label || 'Buscar por CNPJ'
      case 'cep': return label || 'Buscar por CEP'
      case 'category': return label || 'Sugerir Categorias'
      default: return label || 'Buscar'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'cnpj': return <Building2 className="h-4 w-4" />
      case 'cep': return <MapPin className="h-4 w-4" />
      case 'category': return <Sparkles className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          {getIcon()}
          {getLabelText()}
        </Label>
        
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={getPlaceholderText()}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          
          <Button 
            onClick={handleSearch} 
            disabled={loading || !inputValue.trim()}
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Sugestões de categorias */}
      {type === 'category' && suggestions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Categorias sugeridas:</Label>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dados preenchidos - CNPJ */}
      {type === 'cnpj' && lastFetchedData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-700 font-medium">
            <CheckCircle className="h-4 w-4" />
            Dados da Receita Federal
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><strong>Razão Social:</strong> {lastFetchedData.razao_social}</div>
            <div><strong>Nome Fantasia:</strong> {lastFetchedData.nome_fantasia || 'N/A'}</div>
            <div><strong>Situação:</strong> {lastFetchedData.situacao}</div>
            <div><strong>Porte:</strong> {lastFetchedData.porte}</div>
            <div className="md:col-span-2">
              <strong>Endereço:</strong> {lastFetchedData.logradouro}, {lastFetchedData.numero} - {lastFetchedData.bairro}, {lastFetchedData.municipio}/{lastFetchedData.uf}
            </div>
            <div><strong>CEP:</strong> {lastFetchedData.cep}</div>
            <div><strong>Telefone:</strong> {lastFetchedData.telefone || 'N/A'}</div>
          </div>
        </div>
      )}

      {/* Dados preenchidos - CEP */}
      {type === 'cep' && lastFetchedData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-700 font-medium">
            <CheckCircle className="h-4 w-4" />
            Endereço encontrado
          </div>
          <div className="text-sm">
            <div><strong>Logradouro:</strong> {lastFetchedData.logradouro}</div>
            <div><strong>Bairro:</strong> {lastFetchedData.bairro}</div>
            <div><strong>Cidade:</strong> {lastFetchedData.localidade}</div>
            <div><strong>UF:</strong> {lastFetchedData.uf}</div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {type === 'cnpj' && 'Consultando Receita Federal...'}
            {type === 'cep' && 'Consultando CEP...'}
            {type === 'category' && 'Analisando descrição...'}
          </div>
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      )}

      {/* Dicas de uso */}
      <div className="text-xs text-muted-foreground">
        {type === 'cnpj' && (
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Digite apenas os números do CNPJ (14 dígitos)
          </div>
        )}
        {type === 'cep' && (
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Digite apenas os números do CEP (8 dígitos)
          </div>
        )}
        {type === 'category' && (
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Digite uma descrição detalhada para melhores sugestões
          </div>
        )}
      </div>
    </div>
  )
}

export default AutoFillForm
