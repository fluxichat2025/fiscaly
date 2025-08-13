import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  FileText, 
  PieChart, 
  Download, 
  Filter,
  Calendar,
  Target,
  AlertCircle
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart as RPieChart, 
  Cell, 
  CartesianGrid, 
  XAxis, 
  YAxis,
  ResponsiveContainer
} from 'recharts'

type FinanceTransaction = {
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

type FinanceAccount = {
  id: string
  name: string
  opening_balance: number
}

type Receivable = {
  id: string
  customer_name: string
  due_date: string
  net_amount: number
  status: 'aguardando' | 'vencendo' | 'atrasado' | 'pago' | 'parcelado' | 'cancelado'
}

const RelatoriosFinanceiros = () => {
  const { profile } = useAuth()
  const { toast } = useToast()

  // Estados principais
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [accounts, setAccounts] = useState<FinanceAccount[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de filtros
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Carregar transações
        const { data: txData, error: txError } = await supabase
          .from('finance_transactions')
          .select('*')
          .eq('status', 'realizado')
          .order('due_date', { ascending: false })

        if (txError) throw txError
        setTransactions(txData as FinanceTransaction[])

        // Carregar contas
        const { data: accData, error: accError } = await supabase
          .from('finance_accounts')
          .select('*')

        if (accError) throw accError
        setAccounts(accData as FinanceAccount[])

        // Carregar recebíveis
        const { data: recData, error: recError } = await supabase
          .from('receivables')
          .select('*')

        if (recError) throw recError
        setReceivables(recData as Receivable[])

      } catch (error: any) {
        toast({
          title: 'Erro ao carregar dados',
          description: error.message,
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Calcular período baseado na seleção
  const periodDates = useMemo(() => {
    const today = new Date()
    let start: Date, end: Date

    switch (selectedPeriod) {
      case 'current_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      case 'last_3_months':
        start = new Date(today.getFullYear(), today.getMonth() - 2, 1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      case 'last_6_months':
        start = new Date(today.getFullYear(), today.getMonth() - 5, 1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      case 'current_year':
        start = new Date(today.getFullYear(), 0, 1)
        end = new Date(today.getFullYear(), 11, 31)
        break
      case 'custom':
        start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), 1)
        end = endDate ? new Date(endDate) : today
        break
      default:
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    }

    return { start, end }
  }, [selectedPeriod, startDate, endDate])

  // Filtrar transações por período e filtros
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.payment_date || tx.due_date)
      
      // Filtro de período
      if (txDate < periodDates.start || txDate > periodDates.end) return false
      
      // Filtro de conta
      if (selectedAccount !== 'all' && tx.account_id !== selectedAccount) return false
      
      // Filtro de categoria
      if (selectedCategory && !(tx.category || '').toLowerCase().includes(selectedCategory.toLowerCase())) return false
      
      return true
    })
  }, [transactions, periodDates, selectedAccount, selectedCategory])

  // KPIs do Dashboard Executivo
  const executiveKPIs = useMemo(() => {
    const receitas = filteredTransactions
      .filter(tx => tx.type === 'entrada')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const despesas = filteredTransactions
      .filter(tx => tx.type === 'saida')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const lucroLiquido = receitas - despesas
    const margemLucro = receitas > 0 ? (lucroLiquido / receitas) * 100 : 0

    // Período anterior para comparação
    const periodLength = periodDates.end.getTime() - periodDates.start.getTime()
    const previousStart = new Date(periodDates.start.getTime() - periodLength)
    const previousEnd = new Date(periodDates.end.getTime() - periodLength)

    const previousTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.payment_date || tx.due_date)
      return txDate >= previousStart && txDate <= previousEnd
    })

    const previousReceitas = previousTransactions
      .filter(tx => tx.type === 'entrada')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const previousDespesas = previousTransactions
      .filter(tx => tx.type === 'saida')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const previousLucro = previousReceitas - previousDespesas

    // Calcular variações percentuais
    const receitasVariacao = previousReceitas > 0 ? ((receitas - previousReceitas) / previousReceitas) * 100 : 0
    const despesasVariacao = previousDespesas > 0 ? ((despesas - previousDespesas) / previousDespesas) * 100 : 0
    const lucroVariacao = previousLucro !== 0 ? ((lucroLiquido - previousLucro) / Math.abs(previousLucro)) * 100 : 0

    return {
      receitas,
      despesas,
      lucroLiquido,
      margemLucro,
      receitasVariacao,
      despesasVariacao,
      lucroVariacao
    }
  }, [filteredTransactions, transactions, periodDates])

  // Dados para gráfico de linha temporal (Fluxo Realizado)
  const fluxoChartData = useMemo(() => {
    const monthsData = new Map<string, { entradas: number; saidas: number }>()

    filteredTransactions.forEach(tx => {
      const date = new Date(tx.payment_date || tx.due_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

      if (!monthsData.has(monthKey)) {
        monthsData.set(monthKey, { entradas: 0, saidas: 0 })
      }

      const data = monthsData.get(monthKey)!
      if (tx.type === 'entrada') {
        data.entradas += tx.amount
      } else if (tx.type === 'saida') {
        data.saidas += tx.amount
      }
    })

    return Array.from(monthsData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        month: new Date(key + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        entradas: data.entradas,
        saidas: data.saidas
      }))
  }, [filteredTransactions])

  // Dados para aging de recebíveis
  const agingData = useMemo(() => {
    const today = new Date()
    const aging = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    }

    receivables
      .filter(r => r.status !== 'pago')
      .forEach(r => {
        const dueDate = new Date(r.due_date)
        const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff <= 30) {
          aging['0-30'] += r.net_amount
        } else if (daysDiff <= 60) {
          aging['31-60'] += r.net_amount
        } else if (daysDiff <= 90) {
          aging['61-90'] += r.net_amount
        } else {
          aging['90+'] += r.net_amount
        }
      })

    return Object.entries(aging).map(([range, value]) => ({
      name: range + ' dias',
      value,
      fill: range === '0-30' ? '#10b981' : range === '31-60' ? '#f59e0b' : range === '61-90' ? '#ef4444' : '#7c2d12'
    }))
  }, [receivables])

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Relatórios Financeiros</h1>
            <p className="text-sm text-muted-foreground">Análise completa da performance financeira</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Filtros Globais */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Mês Atual</SelectItem>
                  <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                  <SelectItem value="last_6_months">Últimos 6 Meses</SelectItem>
                  <SelectItem value="current_year">Ano Atual</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {selectedPeriod === 'custom' && (
                <>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    placeholder="Data início"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    placeholder="Data fim"
                  />
                </>
              )}

              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Contas</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Categoria"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Aplicar Filtros
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setSelectedPeriod('current_month')
                  setStartDate('')
                  setEndDate('')
                  setSelectedAccount('all')
                  setSelectedCategory('')
                }}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Executivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-green-600">
                {loading ? <Skeleton className="h-8 w-24" /> : 
                  executiveKPIs.receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
              </div>
              <div className={`text-xs flex items-center gap-1 mt-1 ${
                executiveKPIs.receitasVariacao >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {executiveKPIs.receitasVariacao >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(executiveKPIs.receitasVariacao).toFixed(1)}% vs período anterior
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Despesas Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-red-600">
                {loading ? <Skeleton className="h-8 w-24" /> : 
                  executiveKPIs.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
              </div>
              <div className={`text-xs flex items-center gap-1 mt-1 ${
                executiveKPIs.despesasVariacao <= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {executiveKPIs.despesasVariacao >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(executiveKPIs.despesasVariacao).toFixed(1)}% vs período anterior
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Lucro Líquido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold ${
                executiveKPIs.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {loading ? <Skeleton className="h-8 w-24" /> : 
                  executiveKPIs.lucroLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
              </div>
              <div className={`text-xs flex items-center gap-1 mt-1 ${
                executiveKPIs.lucroVariacao >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {executiveKPIs.lucroVariacao >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(executiveKPIs.lucroVariacao).toFixed(1)}% vs período anterior
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Margem de Lucro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold ${
                executiveKPIs.margemLucro >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {loading ? <Skeleton className="h-8 w-16" /> : 
                  `${executiveKPIs.margemLucro.toFixed(1)}%`
                }
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Lucro / Receita Total
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Relatórios */}
        <Tabs defaultValue="dre" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dre" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              DRE
            </TabsTrigger>
            <TabsTrigger value="fluxo" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Fluxo Realizado
            </TabsTrigger>
            <TabsTrigger value="recebimentos" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Análise de Recebimentos
            </TabsTrigger>
          </TabsList>

          {/* Tab DRE */}
          <TabsContent value="dre" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Demonstração do Resultado do Exercício (DRE)</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-lg font-semibold text-green-600">
                      <span>(+) Receitas</span>
                      <span>{executiveKPIs.receitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-semibold text-red-600">
                      <span>(-) Despesas</span>
                      <span>{executiveKPIs.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <hr className="my-4" />
                    <div className={`flex justify-between items-center text-xl font-bold ${
                      executiveKPIs.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span>(=) Lucro Líquido</span>
                      <span>{executiveKPIs.lucroLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Breakdown por categoria */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Receitas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(
                        filteredTransactions
                          .filter(tx => tx.type === 'entrada')
                          .reduce((acc, tx) => {
                            const cat = tx.category || 'Sem categoria'
                            acc[cat] = (acc[cat] || 0) + tx.amount
                            return acc
                          }, {} as Record<string, number>)
                      ).map(([category, amount]) => (
                        <div key={category} className="flex justify-between text-sm">
                          <span>{category}</span>
                          <span className="font-medium text-green-600">
                            {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(
                        filteredTransactions
                          .filter(tx => tx.type === 'saida')
                          .reduce((acc, tx) => {
                            const cat = tx.category || 'Sem categoria'
                            acc[cat] = (acc[cat] || 0) + tx.amount
                            return acc
                          }, {} as Record<string, number>)
                      ).map(([category, amount]) => (
                        <div key={category} className="flex justify-between text-sm">
                          <span>{category}</span>
                          <span className="font-medium text-red-600">
                            {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Fluxo Realizado */}
          <TabsContent value="fluxo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Fluxo de Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : (
                    <ChartContainer config={{
                      entradas: { color: 'hsl(var(--emerald-500))', label: 'Entradas' },
                      saidas: { color: 'hsl(var(--rose-500))', label: 'Saídas' }
                    }}>
                      <LineChart data={fluxoChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                        <Line type="monotone" dataKey="entradas" stroke="var(--color-entradas)" strokeWidth={2} />
                        <Line type="monotone" dataKey="saidas" stroke="var(--color-saidas)" strokeWidth={2} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </LineChart>
                    </ChartContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabela detalhada */}
            <Card>
              <CardHeader>
                <CardTitle>Movimentações Realizadas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Conta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <AlertCircle className="h-8 w-8" />
                            <p>Nenhuma movimentação encontrada</p>
                            <p className="text-xs">Ajuste os filtros para ver os dados</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.slice(0, 10).map(tx => {
                        const account = accounts.find(a => a.id === tx.account_id)
                        return (
                          <TableRow key={tx.id}>
                            <TableCell>
                              {new Date(tx.payment_date || tx.due_date).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={tx.type === 'entrada' ? 'default' : 'destructive'}>
                                {tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{tx.category || '—'}</TableCell>
                            <TableCell className={tx.type === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                              {tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </TableCell>
                            <TableCell>{account?.name || '—'}</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Análise de Recebimentos */}
          <TabsContent value="recebimentos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">A Receber</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-blue-600">
                    {loading ? <Skeleton className="h-8 w-24" /> :
                      receivables
                        .filter(r => r.status !== 'pago')
                        .reduce((sum, r) => sum + r.net_amount, 0)
                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Vencidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-red-600">
                    {loading ? <Skeleton className="h-8 w-24" /> :
                      receivables
                        .filter(r => r.status === 'atrasado')
                        .reduce((sum, r) => sum + r.net_amount, 0)
                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Recebidos no Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-green-600">
                    {loading ? <Skeleton className="h-8 w-24" /> :
                      receivables
                        .filter(r => r.status === 'pago')
                        .reduce((sum, r) => sum + r.net_amount, 0)
                        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Aging de recebíveis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aging de Recebíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {agingData.map((item) => (
                      <div key={item.name} className="text-center p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground mb-2">{item.name}</div>
                        <div className="text-lg font-semibold" style={{ color: item.fill }}>
                          {loading ? <Skeleton className="h-6 w-16 mx-auto" /> :
                            item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição do Aging</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <Skeleton className="h-48 w-48 rounded-full" />
                      </div>
                    ) : (
                      <ChartContainer config={{
                        aging: { color: 'hsl(var(--primary))', label: 'Aging' }
                      }}>
                        <RPieChart>
                          <ChartTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload[0]) {
                                const data = payload[0].payload
                                return (
                                  <div className="bg-white p-2 border rounded shadow">
                                    <p className="font-medium">{data.name}</p>
                                    <p className="text-sm">
                                      {data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <RPieChart data={agingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                            {agingData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </RPieChart>
                        </RPieChart>
                      </ChartContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

export default RelatoriosFinanceiros
