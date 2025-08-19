import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Activity,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Zap,
  Target,
  AlertTriangle,
  Sun,
  Moon,
  Maximize2,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { ChartExportUtils } from '@/components/ChartExportUtils'
import { useRef } from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Brush,
  ScatterChart,
  Scatter
} from 'recharts'

// Tipos
interface FinanceTx {
  id: string
  type: 'entrada' | 'saida' | 'transferencia'
  status: 'previsto' | 'realizado'
  account_id: string
  due_date: string
  payment_date: string | null
  amount: number
  category: string | null
  contact: string | null
  notes: string | null
}

interface ChartData {
  periodo: string
  entradas: number
  saidas: number
  saldo: number
  saldoAcumulado: number
  meta?: number
  categoria?: string
  timestamp?: number
}

interface KPIData {
  saldoAtual: number
  entradasMes: number
  saidasMes: number
  saldoProjetado: number
  variacaoMensal: number
  metaAtingida: number
}

// Paleta de cores moderna
const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  gradient: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    danger: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  }
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

const FluxoDeCaixaModerno = () => {
  const { profile } = useAuth()
  const { toast } = useToast()
  const chartRef = useRef<HTMLDivElement>(null)

  // Estados principais
  const [txs, setTxs] = useState<FinanceTx[]>([])
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  
  // Estados de filtros e controles
  const [periodo, setPeriodo] = useState('6meses')
  const [tipoGrafico, setTipoGrafico] = useState('barras')
  const [categoria, setCategoria] = useState('todas')
  const [comparacao, setComparacao] = useState('nenhuma')
  const [showProjecao, setShowProjecao] = useState(true)
  const [showMetas, setShowMetas] = useState(true)
  const [metaMensal, setMetaMensal] = useState(10000)

  // Estados de visualização
  const [fullscreen, setFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Carregar dados
  useEffect(() => {
    loadFinanceData()
  }, [])

  const loadFinanceData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Carregando dados financeiros...')

      const { data: transactions, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .order('due_date', { ascending: false })

      if (error) throw error

      setTxs(transactions || [])
      console.log('✅ Dados carregados:', transactions?.length || 0, 'transações')

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error)
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Processar dados para gráficos
  const chartData = useMemo(() => {
    if (!txs.length) return []

    const now = new Date()
    const meses = []
    const numMeses = periodo === '3meses' ? 3 : periodo === '6meses' ? 6 : 12

    for (let i = numMeses - 1; i >= 0; i--) {
      const data = new Date(now)
      data.setMonth(data.getMonth() - i)
      const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      const mesNome = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

      const txsMes = txs.filter(tx => {
        const txDate = new Date(tx.due_date)
        const txMesAno = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`
        return txMesAno === mesAno
      })

      const entradas = txsMes
        .filter(tx => tx.type === 'entrada')
        .reduce((sum, tx) => sum + tx.amount, 0)

      const saidas = txsMes
        .filter(tx => tx.type === 'saida')
        .reduce((sum, tx) => sum + tx.amount, 0)

      const saldo = entradas - saidas
      const saldoAcumulado = meses.length > 0 
        ? meses[meses.length - 1].saldoAcumulado + saldo 
        : saldo

      meses.push({
        periodo: mesNome,
        entradas,
        saidas,
        saldo,
        saldoAcumulado,
        meta: metaMensal,
        timestamp: data.getTime()
      })
    }

    return meses
  }, [txs, periodo, metaMensal])

  // Calcular KPIs
  const kpis = useMemo((): KPIData => {
    const now = new Date()
    const mesAtual = now.getMonth()
    const anoAtual = now.getFullYear()

    const txsMesAtual = txs.filter(tx => {
      const txDate = new Date(tx.due_date)
      return txDate.getMonth() === mesAtual && txDate.getFullYear() === anoAtual
    })

    const entradasMes = txsMesAtual
      .filter(tx => tx.type === 'entrada')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const saidasMes = txsMesAtual
      .filter(tx => tx.type === 'saida')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const saldoAtual = entradasMes - saidasMes

    // Calcular variação mensal
    const mesAnterior = new Date(now)
    mesAnterior.setMonth(mesAnterior.getMonth() - 1)

    const txsMesAnterior = txs.filter(tx => {
      const txDate = new Date(tx.due_date)
      return txDate.getMonth() === mesAnterior.getMonth() && 
             txDate.getFullYear() === mesAnterior.getFullYear()
    })

    const saldoMesAnterior = txsMesAnterior
      .filter(tx => tx.type === 'entrada')
      .reduce((sum, tx) => sum + tx.amount, 0) - 
      txsMesAnterior
      .filter(tx => tx.type === 'saida')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const variacaoMensal = saldoMesAnterior !== 0 
      ? ((saldoAtual - saldoMesAnterior) / Math.abs(saldoMesAnterior)) * 100 
      : 0

    // Projeção simples baseada na média
    const mediaMensal = chartData.length > 0 
      ? chartData.reduce((sum, item) => sum + item.saldo, 0) / chartData.length 
      : 0

    const saldoProjetado = saldoAtual + (mediaMensal * 3) // Próximos 3 meses

    const metaAtingida = metaMensal > 0 ? (saldoAtual / metaMensal) * 100 : 0

    return {
      saldoAtual,
      entradasMes,
      saidasMes,
      saldoProjetado,
      variacaoMensal,
      metaAtingida
    }
  }, [txs, chartData, metaMensal])

  // Dados para gráfico de pizza (categorias)
  const pieData = useMemo(() => {
    const categorias = new Map<string, number>()
    
    txs.forEach(tx => {
      const cat = tx.category || 'Sem categoria'
      const valor = categorias.get(cat) || 0
      categorias.set(cat, valor + Math.abs(tx.amount))
    })

    return Array.from(categorias.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Top 8 categorias
  }, [txs])

  // Formatação de valores
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    } else if (Math.abs(value) >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`
    } else {
      return `R$ ${value.toFixed(2)}`
    }
  }

  const formatYAxis = (value: number) => {
    if (value === 0) return 'R$ 0'
    return formatCurrency(value)
  }



  // Componente de tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-lg shadow-lg border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.name}: {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className={`space-y-6 p-6 transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        {/* Header com controles */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              Fluxo de Caixa Moderno
            </h1>
            <p className="text-muted-foreground mt-1">
              Análise financeira avançada com visualizações interativas
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Toggle modo escuro */}
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
              <Moon className="h-4 w-4" />
            </div>

            {/* Seletor de período */}
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3meses">3 Meses</SelectItem>
                <SelectItem value="6meses">6 Meses</SelectItem>
                <SelectItem value="12meses">12 Meses</SelectItem>
              </SelectContent>
            </Select>

            {/* Botões de ação */}
            <Button onClick={loadFinanceData} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <ChartExportUtils
              chartRef={chartRef}
              filename="fluxo-de-caixa"
              title="Fluxo de Caixa"
            />
          </div>
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`shadow-lg transition-all duration-300 hover:shadow-xl ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                Saldo Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                kpis.saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(kpis.saldoAtual)}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {kpis.variacaoMensal >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span>{Math.abs(kpis.variacaoMensal).toFixed(1)}% vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className={`shadow-lg transition-all duration-300 hover:shadow-xl ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Entradas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(kpis.entradasMes)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Receitas confirmadas
              </div>
            </CardContent>
          </Card>

          <Card className={`shadow-lg transition-all duration-300 hover:shadow-xl ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                Saídas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(kpis.saidasMes)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Despesas confirmadas
              </div>
            </CardContent>
          </Card>

          <Card className={`shadow-lg transition-all duration-300 hover:shadow-xl ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4" />
                Projeção 3 Meses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                kpis.saldoProjetado >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {formatCurrency(kpis.saldoProjetado)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Baseado na tendência atual
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles avançados */}
        <Card className={`shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Controles de Visualização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Tipo de Gráfico</Label>
                <Select value={tipoGrafico} onValueChange={setTipoGrafico}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barras">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Barras
                      </div>
                    </SelectItem>
                    <SelectItem value="linhas">
                      <div className="flex items-center gap-2">
                        <LineChart className="h-4 w-4" />
                        Linhas
                      </div>
                    </SelectItem>
                    <SelectItem value="area">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Área
                      </div>
                    </SelectItem>
                    <SelectItem value="combinado">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Combinado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Comparação</Label>
                <Select value={comparacao} onValueChange={setComparacao}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Nenhuma</SelectItem>
                    <SelectItem value="ano-anterior">Ano Anterior</SelectItem>
                    <SelectItem value="mes-anterior">Mês Anterior</SelectItem>
                    <SelectItem value="media">Média Histórica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="projecao"
                  checked={showProjecao}
                  onCheckedChange={setShowProjecao}
                />
                <Label htmlFor="projecao" className="text-sm">
                  Mostrar Projeção
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="metas"
                  checked={showMetas}
                  onCheckedChange={setShowMetas}
                />
                <Label htmlFor="metas" className="text-sm">
                  Mostrar Metas
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs para diferentes visualizações */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="analysis">Análise Avançada</TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <Card className={`shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Fluxo de Caixa - {tipoGrafico.charAt(0).toUpperCase() + tipoGrafico.slice(1)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFullscreen(!fullscreen)}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={chartRef} className={`${fullscreen ? 'h-96' : 'h-80'} transition-all duration-300`}>
                  <ResponsiveContainer width="100%" height="100%">
                    {tipoGrafico === 'barras' && (
                      <RechartsBarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis
                          dataKey="periodo"
                          tick={{ fontSize: 12, fill: darkMode ? '#d1d5db' : '#6b7280' }}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: darkMode ? '#d1d5db' : '#6b7280' }}
                          axisLine={false}
                          tickFormatter={formatYAxis}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          dataKey="entradas"
                          fill={COLORS.success}
                          name="Entradas"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="saidas"
                          fill={COLORS.danger}
                          name="Saídas"
                          radius={[4, 4, 0, 0]}
                        />
                        {showMetas && (
                          <ReferenceLine
                            y={metaMensal}
                            stroke={COLORS.warning}
                            strokeDasharray="5 5"
                            label="Meta"
                          />
                        )}
                      </RechartsBarChart>
                    )}

                    {tipoGrafico === 'linhas' && (
                      <RechartsLineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis
                          dataKey="periodo"
                          tick={{ fontSize: 12, fill: darkMode ? '#d1d5db' : '#6b7280' }}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: darkMode ? '#d1d5db' : '#6b7280' }}
                          axisLine={false}
                          tickFormatter={formatYAxis}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="entradas"
                          stroke={COLORS.success}
                          strokeWidth={3}
                          name="Entradas"
                          dot={{ fill: COLORS.success, strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="saidas"
                          stroke={COLORS.danger}
                          strokeWidth={3}
                          name="Saídas"
                          dot={{ fill: COLORS.danger, strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="saldoAcumulado"
                          stroke={COLORS.primary}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Saldo Acumulado"
                          dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                        />
                      </RechartsLineChart>
                    )}

                    {tipoGrafico === 'area' && (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis
                          dataKey="periodo"
                          tick={{ fontSize: 12, fill: darkMode ? '#d1d5db' : '#6b7280' }}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: darkMode ? '#d1d5db' : '#6b7280' }}
                          axisLine={false}
                          tickFormatter={formatYAxis}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="entradas"
                          stroke={COLORS.success}
                          fillOpacity={1}
                          fill="url(#colorEntradas)"
                          name="Entradas"
                        />
                        <Area
                          type="monotone"
                          dataKey="saidas"
                          stroke={COLORS.danger}
                          fillOpacity={1}
                          fill="url(#colorSaidas)"
                          name="Saídas"
                        />
                      </AreaChart>
                    )}

                    {tipoGrafico === 'combinado' && (
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis
                          dataKey="periodo"
                          tick={{ fontSize: 12, fill: darkMode ? '#d1d5db' : '#6b7280' }}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: darkMode ? '#d1d5db' : '#6b7280' }}
                          axisLine={false}
                          tickFormatter={formatYAxis}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          dataKey="entradas"
                          fill={COLORS.success}
                          name="Entradas"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="saidas"
                          fill={COLORS.danger}
                          name="Saídas"
                          radius={[4, 4, 0, 0]}
                        />
                        <Line
                          type="monotone"
                          dataKey="saldoAcumulado"
                          stroke={COLORS.primary}
                          strokeWidth={3}
                          name="Saldo Acumulado"
                          dot={{ fill: COLORS.primary, strokeWidth: 2, r: 6 }}
                        />
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Tendências */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de tendência com projeção */}
              <Card className={`shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Tendência de Saldo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis
                          dataKey="periodo"
                          tick={{ fontSize: 12, fill: darkMode ? '#d1d5db' : '#6b7280' }}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: darkMode ? '#d1d5db' : '#6b7280' }}
                          axisLine={false}
                          tickFormatter={formatYAxis}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="saldo"
                          stroke={COLORS.primary}
                          strokeWidth={4}
                          name="Saldo Mensal"
                          dot={{ fill: COLORS.primary, strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="saldoAcumulado"
                          stroke={COLORS.secondary}
                          strokeWidth={2}
                          strokeDasharray="8 4"
                          name="Saldo Acumulado"
                          dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
                        />
                        {showMetas && (
                          <ReferenceLine
                            y={metaMensal}
                            stroke={COLORS.warning}
                            strokeDasharray="5 5"
                            label="Meta Mensal"
                          />
                        )}
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Indicadores de performance */}
              <Card className={`shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Indicadores de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Meta Atingida</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-700">
                          {kpis.metaAtingida.toFixed(1)}%
                        </div>
                        <div className="text-xs text-green-600">
                          {formatCurrency(metaMensal)} meta
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">Eficiência</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-700">
                          {kpis.saidasMes > 0 ? ((kpis.entradasMes / kpis.saidasMes) * 100).toFixed(0) : 0}%
                        </div>
                        <div className="text-xs text-blue-600">
                          Entradas/Saídas
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium">Crescimento</span>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          kpis.variacaoMensal >= 0 ? 'text-purple-700' : 'text-red-700'
                        }`}>
                          {kpis.variacaoMensal >= 0 ? '+' : ''}{kpis.variacaoMensal.toFixed(1)}%
                        </div>
                        <div className="text-xs text-purple-600">
                          vs mês anterior
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm font-medium">Projeção</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-700">
                          {formatCurrency(kpis.saldoProjetado)}
                        </div>
                        <div className="text-xs text-orange-600">
                          Próximos 3 meses
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Categorias */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de pizza */}
              <Card className={`shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Distribuição por Categorias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [formatCurrency(value), 'Valor']}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de categorias */}
              <Card className={`shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Top Categorias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pieData.slice(0, 6).map((categoria, index) => (
                      <div key={categoria.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="font-medium">{categoria.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(categoria.value)}</div>
                          <div className="text-xs text-muted-foreground">
                            {((categoria.value / pieData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Análise Avançada */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Gráfico de dispersão para análise de correlação */}
              <Card className={`shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Análise de Correlação: Entradas vs Saídas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis
                          type="number"
                          dataKey="entradas"
                          name="Entradas"
                          tick={{ fontSize: 12, fill: darkMode ? '#d1d5db' : '#6b7280' }}
                          axisLine={false}
                          tickFormatter={formatYAxis}
                        />
                        <YAxis
                          type="number"
                          dataKey="saidas"
                          name="Saídas"
                          tick={{ fontSize: 12, fill: darkMode ? '#d1d5db' : '#6b7280' }}
                          axisLine={false}
                          tickFormatter={formatYAxis}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value: any, name: string) => [formatCurrency(value), name]}
                        />
                        <Scatter
                          name="Períodos"
                          data={chartData}
                          fill={COLORS.primary}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Alertas e insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={`shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Alertas Financeiros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {kpis.saldoAtual < 0 && (
                        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="font-medium text-red-800">Saldo Negativo</div>
                            <div className="text-sm text-red-600">
                              Saldo atual: {formatCurrency(kpis.saldoAtual)}
                            </div>
                          </div>
                        </div>
                      )}

                      {kpis.metaAtingida < 50 && (
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <Target className="h-5 w-5 text-yellow-600" />
                          <div>
                            <div className="font-medium text-yellow-800">Meta Baixa</div>
                            <div className="text-sm text-yellow-600">
                              Apenas {kpis.metaAtingida.toFixed(1)}% da meta atingida
                            </div>
                          </div>
                        </div>
                      )}

                      {kpis.variacaoMensal < -20 && (
                        <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <TrendingDown className="h-5 w-5 text-orange-600" />
                          <div>
                            <div className="font-medium text-orange-800">Queda Significativa</div>
                            <div className="text-sm text-orange-600">
                              Redução de {Math.abs(kpis.variacaoMensal).toFixed(1)}% vs mês anterior
                            </div>
                          </div>
                        </div>
                      )}

                      {kpis.saldoAtual >= 0 && kpis.metaAtingida >= 80 && kpis.variacaoMensal >= 0 && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium text-green-800">Performance Excelente</div>
                            <div className="text-sm text-green-600">
                              Todos os indicadores estão positivos
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className={`shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Insights Automáticos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-800">Padrão Sazonal</div>
                        <div className="text-sm text-blue-600">
                          {chartData.length > 0 && (
                            `Melhor mês: ${chartData.reduce((max, item) =>
                              item.saldo > max.saldo ? item : max
                            ).periodo}`
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="font-medium text-purple-800">Média Móvel</div>
                        <div className="text-sm text-purple-600">
                          {chartData.length > 0 && (
                            `Saldo médio: ${formatCurrency(
                              chartData.reduce((sum, item) => sum + item.saldo, 0) / chartData.length
                            )}`
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <div className="font-medium text-indigo-800">Volatilidade</div>
                        <div className="text-sm text-indigo-600">
                          {chartData.length > 1 && (
                            `Variação: ${(
                              Math.sqrt(
                                chartData.reduce((sum, item, index) => {
                                  if (index === 0) return 0
                                  const diff = item.saldo - chartData[index - 1].saldo
                                  return sum + (diff * diff)
                                }, 0) / (chartData.length - 1)
                              ) / 1000
                            ).toFixed(1)}k`
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

export default FluxoDeCaixaModerno
