import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calculator,
  Clock,
  Sparkles,
  ArrowRight,
  FileText,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
  Target,
  Users,
  DollarSign,
  PieChart
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const ImpostoRenda = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('roadmap')
  const [betaSignup, setBetaSignup] = useState({ name: '', email: '', company: '' })

  // Dados do roadmap para IR
  const roadmapItems = [
    {
      phase: 'Fase 1',
      title: 'Importação de Dados',
      status: 'in-progress',
      progress: 60,
      deadline: '2025-03-15',
      features: [
        'Importação de NFSe emitidas',
        'Dados de recebimentos',
        'Despesas dedutíveis',
        'Integração com sistema contábil'
      ]
    },
    {
      phase: 'Fase 2',
      title: 'Cálculos Automáticos',
      status: 'planned',
      progress: 30,
      deadline: '2025-04-15',
      features: [
        'Cálculo de IR devido',
        'Carnê-leão automático',
        'Apuração mensal',
        'Simulações de cenários'
      ]
    },
    {
      phase: 'Fase 3',
      title: 'Declaração DIRPF',
      status: 'planned',
      progress: 15,
      deadline: '2025-04-30',
      features: [
        'Preenchimento automático DIRPF',
        'Validação de dados',
        'Otimização de deduções',
        'Transmissão eletrônica'
      ]
    },
    {
      phase: 'Fase 4',
      title: 'Relatórios e Planejamento',
      status: 'planned',
      progress: 5,
      deadline: '2025-05-30',
      features: [
        'Relatórios gerenciais',
        'Planejamento tributário',
        'Alertas de vencimento',
        'Histórico de declarações'
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

    console.log('IR Beta signup:', betaSignup)

    toast({
      title: 'Inscrição realizada!',
      description: 'Você será notificado quando o beta de IR estiver disponível',
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
            <h1 className="text-2xl font-semibold">Imposto de Renda</h1>
            <p className="text-sm text-muted-foreground">Gestão completa do seu Imposto de Renda</p>
          </div>
          <Badge className="bg-green-100 text-green-800">
            Em Desenvolvimento
          </Badge>
        </div>

        {/* Tabs principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="beta">Beta Testing</TabsTrigger>
            <TabsTrigger value="calculator">Calculadora</TabsTrigger>
          </TabsList>

          {/* Tab: Roadmap */}
          <TabsContent value="roadmap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Cronograma de Desenvolvimento - IR 2025
                </CardTitle>
                <p className="text-muted-foreground">
                  Acompanhe o desenvolvimento do módulo completo de Imposto de Renda
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

                {/* Cronograma especial para IR 2025 */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">Cronograma IR 2025</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-900">Marcos Importantes:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          <strong>Março 2025:</strong> Beta fechado
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <strong>Abril 2025:</strong> Lançamento oficial
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <strong>30/04/2025:</strong> Prazo DIRPF
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <strong>Maio 2025:</strong> Relatórios finais
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-900">Funcionalidades Prioritárias:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Importação automática de NFSe
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Cálculo de IR mensal
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Preenchimento DIRPF
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Otimização de deduções
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Beta Testing */}
          <TabsContent value="beta" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Programa Beta - IR 2025
                </CardTitle>
                <p className="text-muted-foreground">
                  Participe do teste beta do módulo de Imposto de Renda
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Calculator className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">Beta Fechado - Março 2025</h3>
                  </div>
                  <p className="text-green-700 mb-4">
                    Seja um dos primeiros a testar o módulo completo de Imposto de Renda e ajude a aperfeiçoar a ferramenta.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-900">Benefícios do Beta:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          Acesso gratuito durante o beta
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          Suporte especializado em IR
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          Consultoria tributária básica
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          Desconto na versão final
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-green-900">Requisitos:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Pessoa física ou jurídica
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Obrigatoriedade de declarar IR
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Disponibilidade para testes
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Feedback detalhado
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Formulário de inscrição */}
                  <div className="bg-white rounded-lg p-4 space-y-4">
                    <h4 className="font-medium">Inscreva-se para o Beta de IR:</h4>
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
                        <label className="text-sm font-medium">Empresa/Atividade</label>
                        <Input
                          value={betaSignup.company}
                          onChange={(e) => setBetaSignup(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Sua empresa ou atividade principal"
                        />
                      </div>
                    </div>
                    <Button onClick={handleBetaSignup} className="w-full">
                      <Calculator className="h-4 w-4 mr-2" />
                      Inscrever-se no Beta de IR
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Calculadora */}
          <TabsContent value="calculator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Calculadora de IR - Preview
                </CardTitle>
                <p className="text-muted-foreground">
                  Prévia da calculadora de Imposto de Renda que estará disponível
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mockup da calculadora */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="space-y-6">
                    {/* Header da calculadora */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Calculadora de IR 2025</h3>
                      <p className="text-sm text-muted-foreground">Simule seu Imposto de Renda</p>
                    </div>

                    {/* Campos mockup */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-10 bg-gray-100 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                        <div className="h-10 bg-gray-100 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-36"></div>
                        <div className="h-10 bg-gray-100 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-10 bg-gray-100 rounded"></div>
                      </div>
                    </div>

                    {/* Botão calcular mockup */}
                    <div className="text-center">
                      <div className="h-10 bg-green-200 rounded w-32 mx-auto"></div>
                    </div>

                    {/* Resultado mockup */}
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="h-4 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
                          <div className="h-6 bg-green-200 rounded w-24 mx-auto"></div>
                        </div>
                        <div className="text-center">
                          <div className="h-4 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                          <div className="h-6 bg-red-200 rounded w-28 mx-auto"></div>
                        </div>
                        <div className="text-center">
                          <div className="h-4 bg-gray-200 rounded w-28 mx-auto mb-2"></div>
                          <div className="h-6 bg-blue-200 rounded w-32 mx-auto"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Cálculos Automáticos
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Imposto devido mensal
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Carnê-leão automático
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Simulação de cenários
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Otimização de deduções
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Integração com Sistema
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Importação de NFSe
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Dados de recebimentos
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Despesas dedutíveis
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-yellow-600" />
                        Relatórios automáticos
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Calculadora em Desenvolvimento
                  </div>
                  <p className="text-sm text-amber-600">
                    Esta é uma prévia da calculadora de IR. A versão final incluirá todos os cálculos oficiais da Receita Federal e será validada por especialistas tributários.
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

export default ImpostoRenda
