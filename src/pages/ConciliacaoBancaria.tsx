import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calculator,
  Clock,
  Sparkles,
  ArrowRight,
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText,
  Upload,
  Download,
  Zap,
  Target,
  Users,
  Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const ConciliacaoBancaria = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('roadmap')
  const [betaSignup, setBetaSignup] = useState({ name: '', email: '', company: '' })

  // Dados do roadmap
  const roadmapItems = [
    {
      phase: 'Fase 1',
      title: 'Importação de Extratos',
      status: 'in-progress',
      progress: 75,
      deadline: '2025-02-15',
      features: [
        'Upload de arquivos OFX, CSV, PDF',
        'Integração com Open Banking',
        'Processamento automático de extratos',
        'Validação de dados bancários'
      ]
    },
    {
      phase: 'Fase 2',
      title: 'Conciliação Automática',
      status: 'planned',
      progress: 25,
      deadline: '2025-03-30',
      features: [
        'Matching automático por valor e data',
        'Algoritmos de similaridade',
        'Sugestões inteligentes',
        'Regras personalizáveis'
      ]
    },
    {
      phase: 'Fase 3',
      title: 'Relatórios e Dashboards',
      status: 'planned',
      progress: 10,
      deadline: '2025-04-30',
      features: [
        'Relatórios de conciliação',
        'Dashboard em tempo real',
        'Alertas de divergências',
        'Exportação de dados'
      ]
    },
    {
      phase: 'Fase 4',
      title: 'Integrações Avançadas',
      status: 'planned',
      progress: 0,
      deadline: '2025-06-30',
      features: [
        'API para sistemas externos',
        'Webhooks para notificações',
        'Integração com ERPs',
        'Automação completa'
      ]
    }
  ]

  const handleBetaSignup = () => {
    if (!betaSignup.name || !betaSignup.email) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome e email para se inscrever no beta',
        variant: 'destructive'
      })
      return
    }

    // Aqui seria enviado para o backend
    console.log('Beta signup:', betaSignup)

    toast({
      title: 'Inscrição realizada!',
      description: 'Você será notificado quando o beta estiver disponível',
    })

    setBetaSignup({ name: '', email: '', company: '' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'planned': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in-progress': return <Clock className="h-4 w-4" />
      case 'planned': return <Calendar className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Conciliação Bancária</h1>
            <p className="text-sm text-muted-foreground">Automatize a conciliação das suas contas bancárias</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            Em Desenvolvimento
          </Badge>
        </div>

        {/* Tabs principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="beta">Beta Testing</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Tab: Roadmap */}
          <TabsContent value="roadmap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Cronograma de Desenvolvimento
                </CardTitle>
                <p className="text-muted-foreground">
                  Acompanhe o progresso e as datas de lançamento das funcionalidades
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {roadmapItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{item.phase}</span>
                        </Badge>
                        <h3 className="font-semibold">{item.title}</h3>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Prazo: {new Date(item.deadline).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progresso</span>
                        <span>{item.progress}%</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2 text-sm">
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Beta Testing */}
          <TabsContent value="beta" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Programa Beta
                </CardTitle>
                <p className="text-muted-foreground">
                  Seja um dos primeiros a testar a conciliação bancária automática
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">Beta Fechado - Março 2025</h3>
                  </div>
                  <p className="text-blue-700 mb-4">
                    Participe do teste beta e ajude a moldar o futuro da conciliação bancária no sistema.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-900">Benefícios do Beta:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          Acesso antecipado gratuito
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          Suporte direto da equipe
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          Influência no desenvolvimento
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          Desconto na versão final
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-900">Requisitos:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Empresa ativa no sistema
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Movimentação bancária regular
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Disponibilidade para feedback
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Aceitar termos de teste
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Formulário de inscrição */}
                  <div className="bg-white rounded-lg p-4 space-y-4">
                    <h4 className="font-medium">Inscreva-se para o Beta:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Nome *</label>
                        <Input
                          value={betaSignup.name}
                          onChange={(e) => setBetaSignup(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email *</label>
                        <Input
                          type="email"
                          value={betaSignup.email}
                          onChange={(e) => setBetaSignup(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="seu@email.com"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium">Empresa</label>
                        <Input
                          value={betaSignup.company}
                          onChange={(e) => setBetaSignup(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Nome da sua empresa"
                        />
                      </div>
                    </div>
                    <Button onClick={handleBetaSignup} className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Inscrever-se no Beta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Preview */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Preview da Interface
                </CardTitle>
                <p className="text-muted-foreground">
                  Veja como será a interface da conciliação bancária
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mockup da interface */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="space-y-4">
                    {/* Header mockup */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-6 bg-gray-300 rounded w-48"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-blue-300 rounded w-24"></div>
                        <div className="h-8 bg-green-300 rounded w-20"></div>
                      </div>
                    </div>

                    {/* Filtros mockup */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded border">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-100 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-100 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-8 bg-gray-100 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-18"></div>
                        <div className="h-8 bg-gray-100 rounded"></div>
                      </div>
                    </div>

                    {/* Tabela mockup */}
                    <div className="bg-white rounded border">
                      <div className="grid grid-cols-6 gap-4 p-4 border-b bg-gray-50">
                        <div className="h-4 bg-gray-300 rounded w-16"></div>
                        <div className="h-4 bg-gray-300 rounded w-20"></div>
                        <div className="h-4 bg-gray-300 rounded w-24"></div>
                        <div className="h-4 bg-gray-300 rounded w-18"></div>
                        <div className="h-4 bg-gray-300 rounded w-16"></div>
                        <div className="h-4 bg-gray-300 rounded w-20"></div>
                      </div>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-green-200 rounded w-full"></div>
                          <div className="h-4 bg-blue-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Importação de Extratos
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Suporte a arquivos OFX, CSV, PDF
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Processamento automático
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Validação de dados
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Integração Open Banking
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Conciliação Inteligente
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Matching automático
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Sugestões inteligentes
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Regras personalizáveis
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Relatórios detalhados
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Interface em Desenvolvimento
                  </div>
                  <p className="text-sm text-amber-600">
                    Esta é uma prévia da interface. O design final pode sofrer alterações baseadas no feedback dos usuários beta.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

export default ConciliacaoBancaria
