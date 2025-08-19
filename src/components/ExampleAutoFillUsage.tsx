import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import AutoFillForm from '@/components/AutoFillForm'
import { Building2, MapPin, Sparkles, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Exemplo de como usar o AutoFillForm em formulários
const ExampleAutoFillUsage = () => {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    // Dados da empresa
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    situacao: '',
    telefone: '',
    email: '',
    
    // Dados de endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    
    // Categoria
    category: '',
    description: ''
  })

  // Dados históricos para sugestão de categorias (exemplo)
  const historicalData = [
    { description: 'Compra de material de escritório', category: 'Escritório' },
    { description: 'Pagamento de combustível', category: 'Transporte' },
    { description: 'Almoço de negócios', category: 'Alimentação' },
    { description: 'Consultoria em marketing', category: 'Marketing' },
    { description: 'Licença de software', category: 'Tecnologia' }
  ]

  // Função para receber dados do CNPJ
  const handleCnpjData = (data: any) => {
    setFormData(prev => ({
      ...prev,
      cnpj: data.cnpj || '',
      razao_social: data.razao_social || '',
      nome_fantasia: data.nome_fantasia || '',
      situacao: data.situacao || '',
      telefone: data.telefone || '',
      email: data.email || '',
      // Endereço
      cep: data.endereco?.cep || '',
      logradouro: data.endereco?.logradouro || '',
      numero: data.endereco?.numero || '',
      complemento: data.endereco?.complemento || '',
      bairro: data.endereco?.bairro || '',
      cidade: data.endereco?.municipio || '',
      uf: data.endereco?.uf || ''
    }))
  }

  // Função para receber dados do CEP
  const handleCepData = (data: any) => {
    setFormData(prev => ({
      ...prev,
      cep: data.cep || '',
      logradouro: data.logradouro || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || ''
    }))
  }

  // Função para receber categoria sugerida
  const handleCategoryData = (data: any) => {
    setFormData(prev => ({
      ...prev,
      category: data.category || ''
    }))
  }

  const handleSave = () => {
    console.log('Dados do formulário:', formData)
    toast({
      title: 'Formulário salvo!',
      description: 'Dados salvos com preenchimento automático',
    })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Exemplo: Preenchimento Automático</h1>
        <p className="text-muted-foreground">
          Demonstração de como usar APIs públicas para automatizar formulários
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: AutoFill Components */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Busca por CNPJ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AutoFillForm
                type="cnpj"
                onDataFilled={handleCnpjData}
                placeholder="Digite o CNPJ da empresa"
                label="Consultar Receita Federal"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Busca por CEP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AutoFillForm
                type="cep"
                onDataFilled={handleCepData}
                placeholder="Digite o CEP"
                label="Consultar Endereço"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Sugestão de Categorias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Descrição da despesa</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: Compra de material de escritório"
                  />
                </div>
                <AutoFillForm
                  type="category"
                  onDataFilled={handleCategoryData}
                  placeholder="Digite a descrição para sugerir categorias"
                  label="Sugerir Categorias"
                  historicalData={historicalData}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Formulário Preenchido */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Preenchidos Automaticamente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dados da Empresa */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Dados da Empresa</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-xs">CNPJ</Label>
                    <Input value={formData.cnpj} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label className="text-xs">Razão Social</Label>
                    <Input value={formData.razao_social} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label className="text-xs">Nome Fantasia</Label>
                    <Input value={formData.nome_fantasia} readOnly className="bg-gray-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Situação</Label>
                      <Input value={formData.situacao} readOnly className="bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-xs">Telefone</Label>
                      <Input value={formData.telefone} readOnly className="bg-gray-50" />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dados de Endereço */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Endereço</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">CEP</Label>
                      <Input value={formData.cep} readOnly className="bg-gray-50" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Logradouro</Label>
                      <Input value={formData.logradouro} readOnly className="bg-gray-50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Número</Label>
                      <Input 
                        value={formData.numero} 
                        onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                        placeholder="Nº"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Complemento</Label>
                      <Input 
                        value={formData.complemento} 
                        onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                        placeholder="Complemento"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Bairro</Label>
                      <Input value={formData.bairro} readOnly className="bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-xs">Cidade</Label>
                      <Input value={formData.cidade} readOnly className="bg-gray-50" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">UF</Label>
                    <Input value={formData.uf} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Categoria */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Categoria</h3>
                <div>
                  <Label className="text-xs">Categoria Sugerida</Label>
                  <Input value={formData.category} readOnly className="bg-gray-50" />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Formulário
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Informações sobre as APIs */}
      <Card>
        <CardHeader>
          <CardTitle>APIs Públicas Utilizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Receita Federal</h4>
              <p className="text-muted-foreground">
                Consulta dados de CNPJ diretamente da Receita Federal, incluindo razão social, endereço e situação cadastral.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">ViaCEP</h4>
              <p className="text-muted-foreground">
                Busca endereços completos através do CEP, preenchendo automaticamente logradouro, bairro e cidade.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Sugestões Inteligentes</h4>
              <p className="text-muted-foreground">
                Analisa descrições e histórico para sugerir categorias automaticamente, reduzindo erros de classificação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ExampleAutoFillUsage
