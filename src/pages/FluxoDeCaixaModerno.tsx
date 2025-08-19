import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Plus, 
  Download, 
  Upload,
  RefreshCw,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Zap,
  Target,
  AlertTriangle,
  Eye,
  EyeOff,
  Maximize2,
  Settings,
  Palette,
  FileImage,
  FileText,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar as CalendarIcon,
  Clock,
  Layers
} from 'lucide-react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
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
  CandlestickChart,
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
import { motion, AnimatePresence } from 'framer-motion'
import { HeatmapChart, CandlestickChart, useTrendAnalysis } from '@/components/AdvancedCharts'

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
  attachment_url: string | null
  invoice_id: string | null
  transfer_group_id: string | null
}

interface ChartData {
  date: string
  entradas: number
  saidas: number
  saldo: number
  saldoAcumulado: number
  categoria?: string
  periodo?: string
}

interface KPIData {
  saldoAtual: number
  totalEntradas: number
  totalSaidas: number
  saldoProjetado: number
  variacaoMensal: number
  metaMensal: number
  diasRestantes: number
  ticketMedio: number
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
    danger: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)'
  }
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

const FluxoDeCaixaModerno = () => {
  const { profile } = useAuth()
  const { toast } = useToast()

  // Estados principais
  const [txs, setTxs] = useState<FinanceTx[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Estados de visualização
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'pie' | 'candlestick' | 'heatmap'>('bar')
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [showAnimations, setShowAnimations] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [showLegend, setShowLegend] = useState(true)

  // Estados de filtros
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [amountRange, setAmountRange] = useState({ min: '', max: '' })

  // Estados de comparação
  const [compareMode, setCompareMode] = useState(false)
  const [comparePeriod, setComparePeriod] = useState<'previous_month' | 'previous_year' | 'custom'>('previous_month')

  // Estados do modal de novo lançamento
  const [showNewTxModal, setShowNewTxModal] = useState(false)
  const [newTx, setNewTx] = useState({
    type: 'entrada' as 'entrada' | 'saida',
    amount: '',
    category: '',
    contact: '',
    notes: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'previsto' as 'previsto' | 'realizado'
  })

  // Carregar dados
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔄 Carregando transações financeiras...')

      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .gte('due_date', dateRange.start)
        .lte('due_date', dateRange.end)
        .order('due_date', { ascending: true })

      if (error) throw error

      setTxs(data || [])
      console.log('✅ Transações carregadas:', data?.length || 0)

    } catch (error: any) {
      console.error('❌ Erro ao carregar transações:', error)
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [dateRange, toast])

  // Atualizar dados
  const refreshData = useCallback(async () => {
    setRefreshing(true)
    await fetchTransactions()
    setRefreshing(false)
    
    toast({
      title: 'Dados atualizados',
      description: 'Fluxo de caixa atualizado com sucesso'
    })
  }, [fetchTransactions, toast])

  // Processar dados para gráficos
  const chartData = useMemo(() => {
    if (!txs.length) return []

    const processedData: ChartData[] = []
    const groupedData = new Map<string, { entradas: number; saidas: number; transactions: FinanceTx[] }>()

    // Agrupar por período
    txs.forEach(tx => {
      let key: string
      const date = new Date(tx.due_date)

      switch (viewMode) {
        case 'daily':
          key = date.toISOString().split('T')[0]
          break
        case 'weekly':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'quarterly':
          const quarter = Math.floor(date.getMonth() / 3) + 1
          key = `${date.getFullYear()}-Q${quarter}`
          break
        case 'yearly':
          key = date.getFullYear().toString()
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      if (!groupedData.has(key)) {
        groupedData.set(key, { entradas: 0, saidas: 0, transactions: [] })
      }

      const group = groupedData.get(key)!
      group.transactions.push(tx)

      if (tx.type === 'entrada') {
        group.entradas += tx.amount
      } else if (tx.type === 'saida') {
        group.saidas += tx.amount
      }
    })

    // Converter para array e calcular saldos
    let saldoAcumulado = 0
    Array.from(groupedData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, data]) => {
        const saldo = data.entradas - data.saidas
        saldoAcumulado += saldo

        processedData.push({
          date: key,
          entradas: data.entradas,
          saidas: data.saidas,
          saldo,
          saldoAcumulado,
          periodo: key
        })
      })

    return processedData
  }, [txs, viewMode])

  // Calcular KPIs
  const kpis = useMemo((): KPIData => {
    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

    const txsMes = txs.filter(tx => {
      const dataTx = new Date(tx.due_date)
      return dataTx >= inicioMes && dataTx <= fimMes
    })

    const totalEntradas = txsMes.filter(tx => tx.type === 'entrada').reduce((sum, tx) => sum + tx.amount, 0)
    const totalSaidas = txsMes.filter(tx => tx.type === 'saida').reduce((sum, tx) => sum + tx.amount, 0)
    const saldoAtual = totalEntradas - totalSaidas

    // Calcular projeção baseada na média diária
    const diasDecorridos = hoje.getDate()
    const diasRestantes = fimMes.getDate() - diasDecorridos
    const mediaDiariaEntradas = totalEntradas / diasDecorridos
    const mediaDiariaSaidas = totalSaidas / diasDecorridos
    const projecaoEntradas = mediaDiariaEntradas * diasRestantes
    const projecaoSaidas = mediaDiariaSaidas * diasRestantes
    const saldoProjetado = saldoAtual + (projecaoEntradas - projecaoSaidas)

    // Variação mensal (comparar com mês anterior)
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
    const txsMesAnterior = txs.filter(tx => {
      const dataTx = new Date(tx.due_date)
      return dataTx >= mesAnterior && dataTx <= fimMesAnterior
    })
    const saldoMesAnterior = txsMesAnterior.reduce((sum, tx) => 
      sum + (tx.type === 'entrada' ? tx.amount : -tx.amount), 0
    )
    const variacaoMensal = saldoMesAnterior !== 0 ? ((saldoAtual - saldoMesAnterior) / Math.abs(saldoMesAnterior)) * 100 : 0

    const ticketMedio = txsMes.length > 0 ? (totalEntradas + totalSaidas) / txsMes.length : 0

    return {
      saldoAtual,
      totalEntradas,
      totalSaidas,
      saldoProjetado,
      variacaoMensal,
      metaMensal: 10000, // Meta configurável
      diasRestantes,
      ticketMedio
    }
  }, [txs])

  // Dados para gráfico de pizza (categorias)
  const pieData = useMemo(() => {
    const categoryTotals = new Map<string, number>()
    
    txs.forEach(tx => {
      const category = tx.category || 'Sem categoria'
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + tx.amount)
    })

    return Array.from(categoryTotals.entries()).map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))
  }, [txs])

  // Formatação de valores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatCompactCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    } else if (Math.abs(value) >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`
    } else {
      return `R$ ${value.toFixed(0)}`
    }
  }

  // Adicionar novo lançamento
  const handleAddTransaction = async () => {
    try {
      if (!newTx.amount || !newTx.due_date) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha valor e data de vencimento',
          variant: 'destructive'
        })
        return
      }

      const { error } = await supabase
        .from('finance_transactions')
        .insert([{
          type: newTx.type,
          amount: parseFloat(newTx.amount),
          category: newTx.category || null,
          contact: newTx.contact || null,
          notes: newTx.notes || null,
          due_date: newTx.due_date,
          status: newTx.status,
          account_id: 'default' // Conta padrão
        }])

      if (error) throw error

      toast({
        title: 'Lançamento adicionado',
        description: 'Transação criada com sucesso'
      })

      setShowNewTxModal(false)
      setNewTx({
        type: 'entrada',
        amount: '',
        category: '',
        contact: '',
        notes: '',
        due_date: new Date().toISOString().split('T')[0],
        status: 'previsto'
      })

      await fetchTransactions()

    } catch (error: any) {
      console.error('❌ Erro ao adicionar transação:', error)
      toast({
        title: 'Erro ao adicionar lançamento',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Exportar gráfico
  const exportChart = (format: 'png' | 'pdf' | 'svg') => {
    // Implementação da exportação seria feita aqui
    toast({
      title: 'Exportação iniciada',
      description: `Gráfico será exportado em formato ${format.toUpperCase()}`
    })
  }

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return (
    <Layout>
      <div className="space-y-6 p-6">
        {/* Header com controles */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Fluxo de Caixa Moderno
            </h1>
            <p className="text-muted-foreground">
              Análise avançada com visualizações interativas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={refreshData}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <Dialog open={showNewTxModal} onOpenChange={setShowNewTxModal}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lançamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Lançamento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={newTx.type} onValueChange={(value: 'entrada' | 'saida') => 
                        setNewTx(prev => ({ ...prev, type: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        placeholder="0,00"
                        value={newTx.amount}
                        onChange={(e) => setNewTx(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Data de Vencimento</Label>
                    <Input
                      type="date"
                      value={newTx.due_date}
                      onChange={(e) => setNewTx(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Input
                      placeholder="Ex: Vendas, Despesas operacionais..."
                      value={newTx.category}
                      onChange={(e) => setNewTx(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Contato</Label>
                    <Input
                      placeholder="Cliente ou fornecedor"
                      value={newTx.contact}
                      onChange={(e) => setNewTx(prev => ({ ...prev, contact: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      placeholder="Detalhes adicionais..."
                      value={newTx.notes}
                      onChange={(e) => setNewTx(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newTx.status === 'realizado'}
                      onCheckedChange={(checked) => 
                        setNewTx(prev => ({ ...prev, status: checked ? 'realizado' : 'previsto' }))
                      }
                    />
                    <Label>Marcar como realizado</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewTxModal(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddTransaction}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* KPIs Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Saldo Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(kpis.saldoAtual)}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {kpis.variacaoMensal >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={kpis.variacaoMensal >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(kpis.variacaoMensal).toFixed(1)}% vs mês anterior
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Total Entradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(kpis.totalEntradas)}
              </div>
              <div className="text-xs text-muted-foreground">
                Ticket médio: {formatCurrency(kpis.ticketMedio)}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                Total Saídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(kpis.totalSaidas)}
              </div>
              <div className="text-xs text-muted-foreground">
                {kpis.diasRestantes} dias restantes no mês
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4" />
                Projeção Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.saldoProjetado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(kpis.saldoProjetado)}
              </div>
              <div className="text-xs text-muted-foreground">
                Meta: {formatCurrency(kpis.metaMensal)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Controles de Visualização */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Controles de Visualização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tipo de Gráfico */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Gráfico</Label>
                  <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Barras
                        </div>
                      </SelectItem>
                      <SelectItem value="line">
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
                      <SelectItem value="pie">
                        <div className="flex items-center gap-2">
                          <PieChart className="h-4 w-4" />
                          Pizza
                        </div>
                      </SelectItem>
                      <SelectItem value="candlestick">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Candlestick
                        </div>
                      </SelectItem>
                      <SelectItem value="heatmap">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          Heatmap
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Período */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Período</Label>
                  <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Categoria */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Categoria</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="vendas">Vendas</SelectItem>
                      <SelectItem value="despesas">Despesas</SelectItem>
                      <SelectItem value="investimentos">Investimentos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="realizado">Realizado</SelectItem>
                      <SelectItem value="previsto">Previsto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Range de Datas */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Período de Análise</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Opções de Visualização */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Opções</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showAnimations}
                        onCheckedChange={setShowAnimations}
                        id="animations"
                      />
                      <Label htmlFor="animations" className="text-xs">Animações</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showGrid}
                        onCheckedChange={setShowGrid}
                        id="grid"
                      />
                      <Label htmlFor="grid" className="text-xs">Grade</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showLegend}
                        onCheckedChange={setShowLegend}
                        id="legend"
                      />
                      <Label htmlFor="legend" className="text-xs">Legenda</Label>
                    </div>
                  </div>
                </div>

                {/* Comparação */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Comparação</Label>
                  <div className="flex items-center space-x-2 mb-2">
                    <Switch
                      checked={compareMode}
                      onCheckedChange={setCompareMode}
                      id="compare"
                    />
                    <Label htmlFor="compare" className="text-xs">Ativar comparação</Label>
                  </div>
                  {compareMode && (
                    <Select value={comparePeriod} onValueChange={(value: any) => setComparePeriod(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="previous_month">Mês Anterior</SelectItem>
                        <SelectItem value="previous_year">Ano Anterior</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => exportChart('png')}>
                  <FileImage className="h-4 w-4 mr-2" />
                  PNG
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportChart('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportChart('svg')}>
                  <Download className="h-4 w-4 mr-2" />
                  SVG
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gráficos Principais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Gráfico Principal */}
          <div className="lg:col-span-2">
            <Card className="h-[500px]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {chartType === 'bar' && <BarChart3 className="h-5 w-5" />}
                    {chartType === 'line' && <LineChart className="h-5 w-5" />}
                    {chartType === 'area' && <Activity className="h-5 w-5" />}
                    {chartType === 'pie' && <PieChart className="h-5 w-5" />}
                    {chartType === 'candlestick' && <Zap className="h-5 w-5" />}
                    {chartType === 'heatmap' && <Layers className="h-5 w-5" />}
                    Fluxo de Caixa - {chartType === 'bar' ? 'Barras' :
                                      chartType === 'line' ? 'Linhas' :
                                      chartType === 'area' ? 'Área' :
                                      chartType === 'pie' ? 'Distribuição' :
                                      chartType === 'candlestick' ? 'Candlestick' : 'Heatmap'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {viewMode === 'daily' ? 'Diário' :
                       viewMode === 'weekly' ? 'Semanal' :
                       viewMode === 'monthly' ? 'Mensal' :
                       viewMode === 'quarterly' ? 'Trimestral' : 'Anual'}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="space-y-4 w-full">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
                      <p className="text-muted-foreground">
                        Adicione transações para visualizar o fluxo de caixa
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' && (
                      <RechartsBarChart data={chartData}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                          tickFormatter={formatCompactCurrency}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any, name: string) => [
                            formatCurrency(value),
                            name === 'entradas' ? 'Entradas' :
                            name === 'saidas' ? 'Saídas' :
                            name === 'saldo' ? 'Saldo' : name
                          ]}
                        />
                        {showLegend && <Legend />}
                        <Bar
                          dataKey="entradas"
                          fill={COLORS.success}
                          name="Entradas"
                          radius={[4, 4, 0, 0]}
                          animationDuration={showAnimations ? 1000 : 0}
                        />
                        <Bar
                          dataKey="saidas"
                          fill={COLORS.danger}
                          name="Saídas"
                          radius={[4, 4, 0, 0]}
                          animationDuration={showAnimations ? 1000 : 0}
                        />
                        <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                      </RechartsBarChart>
                    )}

                    {chartType === 'line' && (
                      <RechartsLineChart data={chartData}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                          tickFormatter={formatCompactCurrency}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any, name: string) => [
                            formatCurrency(value),
                            name === 'entradas' ? 'Entradas' :
                            name === 'saidas' ? 'Saídas' :
                            name === 'saldoAcumulado' ? 'Saldo Acumulado' : name
                          ]}
                        />
                        {showLegend && <Legend />}
                        <Line
                          type="monotone"
                          dataKey="entradas"
                          stroke={COLORS.success}
                          strokeWidth={3}
                          name="Entradas"
                          dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
                          animationDuration={showAnimations ? 1500 : 0}
                        />
                        <Line
                          type="monotone"
                          dataKey="saidas"
                          stroke={COLORS.danger}
                          strokeWidth={3}
                          name="Saídas"
                          dot={{ fill: COLORS.danger, strokeWidth: 2, r: 4 }}
                          animationDuration={showAnimations ? 1500 : 0}
                        />
                        <Line
                          type="monotone"
                          dataKey="saldoAcumulado"
                          stroke={COLORS.primary}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Saldo Acumulado"
                          dot={{ fill: COLORS.primary, strokeWidth: 2, r: 3 }}
                          animationDuration={showAnimations ? 1500 : 0}
                        />
                        <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                      </RechartsLineChart>
                    )}

                    {chartType === 'area' && (
                      <AreaChart data={chartData}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                          tickFormatter={formatCompactCurrency}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any, name: string) => [
                            formatCurrency(value),
                            name === 'saldoAcumulado' ? 'Saldo Acumulado' : name
                          ]}
                        />
                        {showLegend && <Legend />}
                        <defs>
                          <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="saldoAcumulado"
                          stroke={COLORS.primary}
                          strokeWidth={2}
                          fill="url(#colorSaldo)"
                          name="Saldo Acumulado"
                          animationDuration={showAnimations ? 2000 : 0}
                        />
                        <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                      </AreaChart>
                    )}

                    {chartType === 'pie' && (
                      <RechartsPieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          animationDuration={showAnimations ? 1000 : 0}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [formatCurrency(value), 'Valor']}
                        />
                        {showLegend && <Legend />}
                      </RechartsPieChart>
                    )}

                    {chartType === 'candlestick' && (
                      <CandlestickChart
                        data={chartData}
                        showGrid={showGrid}
                        showAnimations={showAnimations}
                      />
                    )}

                    {chartType === 'heatmap' && (
                      <HeatmapChart
                        data={chartData}
                        showGrid={showGrid}
                        showAnimations={showAnimations}
                      />
                    )}
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Painel Lateral com Métricas */}
          <div className="space-y-4">
            {/* Resumo Rápido */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo do Período</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Entradas</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatCompactCurrency(kpis.totalEntradas)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">Saídas</span>
                  </div>
                  <span className="font-semibold text-red-600">
                    {formatCompactCurrency(kpis.totalSaidas)}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Saldo Líquido</span>
                  </div>
                  <span className={`font-semibold ${kpis.saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCompactCurrency(kpis.saldoAtual)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Alertas e Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {kpis.saldoAtual < 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      Saldo Negativo
                    </div>
                    <p className="text-sm text-red-600">
                      Seu saldo atual está negativo. Considere revisar as despesas.
                    </p>
                  </div>
                )}

                {kpis.variacaoMensal > 20 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                      <TrendingUp className="h-4 w-4" />
                      Crescimento Acelerado
                    </div>
                    <p className="text-sm text-green-600">
                      Excelente! Crescimento de {kpis.variacaoMensal.toFixed(1)}% vs mês anterior.
                    </p>
                  </div>
                )}

                {kpis.saldoProjetado < kpis.metaMensal && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700 font-medium mb-1">
                      <Target className="h-4 w-4" />
                      Meta em Risco
                    </div>
                    <p className="text-sm text-yellow-600">
                      Projeção abaixo da meta mensal. Faltam {formatCurrency(kpis.metaMensal - kpis.saldoProjetado)}.
                    </p>
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
                    <Clock className="h-4 w-4" />
                    Projeção
                  </div>
                  <p className="text-sm text-blue-600">
                    Com base no ritmo atual, você deve fechar o mês com {formatCurrency(kpis.saldoProjetado)}.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowNewTxModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Transação
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => exportChart('pdf')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Relatório
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={refreshData}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Dados
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}

export default FluxoDeCaixaModerno
