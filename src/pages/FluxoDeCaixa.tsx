import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarIcon, Upload, Plus, Download, AlertTriangle, TrendingDown, TrendingUp, RefreshCw, Search, X, CheckSquare, Square, Trash2, Clock, Target, BarChart3 } from 'lucide-react'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart as RLineChart, Line, CartesianGrid, XAxis, YAxis, BarChart, Bar, ResponsiveContainer } from 'recharts'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'

type FinanceAccount = { id: string; name: string; opening_balance: number }
type Category = { id: string; name: string; type: 'income' | 'expense'; color: string; icon: string }

type FinanceTx = {
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
type WeekPoint = { week: string; base: number; melhor: number; pior: number }





const FluxoDeCaixa = () => {
  // Estados
  const { profile } = useAuth()
  const { toast } = useToast()

  // Refs/estados auxiliares
  const fileRef = useRef<HTMLInputElement>(null)
  const [toAccountId, setToAccountId] = useState<string>('')
  const [isSyncOpen, setIsSyncOpen] = useState(false)
  const [syncAccountId, setSyncAccountId] = useState<string>('')
  const [file, setFile] = useState<File|null>(null)

  const getSignedUrl = async (path: string) => {
    const { data, error } = await supabase.storage.from('finance-attachments').createSignedUrl(path, 60)
    if (error) return null
    return data?.signedUrl || null
  }

  const defaultForm = { type: undefined as any, status: 'previsto' as 'previsto'|'realizado', account_id: '', due_date: '', payment_date: null as string|null, amount: 0, category: '', contact: '', notes: '' }
  const [form, setForm] = useState(defaultForm)

  const [isLancamentoOpen, setIsLancamentoOpen] = useState(false)
  const [isConciliacaoOpen, setIsConciliacaoOpen] = useState(false)

  const [accounts, setAccounts] = useState<FinanceAccount[]>([])
  const [txs, setTxs] = useState<FinanceTx[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // Filtros expandidos
  const [fAccount, setFAccount] = useState<string>('todas')
  const [fStatus, setFStatus] = useState<string>('todos')
  const [fType, setFType] = useState<string>('todos')
  const [fCategory, setFCategory] = useState<string>('')
  const [fFrom, setFFrom] = useState<string>('')
  const [fTo, setFTo] = useState<string>('')
  const [fSearch, setFSearch] = useState<string>('')

  // Estados para ações em lote
  const [selectedTxs, setSelectedTxs] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)

  // Estados para loading
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const { data: accData, error: accErr } = await supabase.from('finance_accounts').select('id,name,opening_balance')
        if (accErr) {
          toast({ title: 'Erro ao carregar contas', description: accErr.message, variant: 'destructive' })
        } else {
          setAccounts(accData as any)
        }
        // Carregar lançamentos básicos
        const { data: txData, error: txErr } = await supabase
          .from('finance_transactions')
          .select('*')
          .order('due_date', { ascending: true })
          .limit(1000) // Aumentado para suportar mais dados
        if (txErr) {
          toast({ title: 'Erro ao carregar lançamentos', description: txErr.message, variant: 'destructive' })
        } else {
          setTxs((txData || []) as any)
        }

        // Carregar categorias
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('active', true)
          .order('name', { ascending: true })

        if (categoriesError) {
          console.warn('Erro ao carregar categorias:', categoriesError.message)
        } else {
          setCategories(categoriesData as any)
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // Debounce para busca
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(fSearch), 300)
    return () => clearTimeout(timer)
  }, [fSearch])

  const filteredTxs = useMemo(() => {
    return txs.filter(t => {
      if (fAccount !== 'todas' && t.account_id !== fAccount) return false
      if (fStatus !== 'todos' && t.status !== fStatus) return false
      if (fType !== 'todos' && t.type !== fType) return false
      if (fCategory && (t.category || '').toLowerCase().indexOf(fCategory.toLowerCase()) === -1) return false
      if (fFrom && new Date(t.due_date) < new Date(fFrom)) return false
      if (fTo && new Date(t.due_date) > new Date(fTo)) return false
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase()
        const searchableText = `${t.notes || ''} ${t.category || ''} ${t.contact || ''}`.toLowerCase()
        if (!searchableText.includes(search)) return false
      }
      return true
    })
  }, [txs, fAccount, fStatus, fType, fCategory, fFrom, fTo, debouncedSearch])

  // KPIs expandidos
  const today = new Date()
  const month = today.getMonth()
  const year = today.getFullYear()
  const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  const inMonth = filteredTxs.filter(t => {
    const d = new Date(t.due_date)
    return d.getMonth() === month && d.getFullYear() === year
  })
  const entradasMes = inMonth.filter(t => t.type === 'entrada').reduce((s, t) => s + t.amount, 0)
  const saidasMes = inMonth.filter(t => t.type === 'saida').reduce((s, t) => s + t.amount, 0)

  const saldoConsolidado = useMemo(() => {
    const realized = txs.filter(t => t.status === 'realizado')
    const porConta = new Map<string, number>()
    accounts.forEach(a => porConta.set(a.id, a.opening_balance || 0))
    realized.forEach(t => {
      const mult = t.type === 'saida' ? -1 : 1
      porConta.set(t.account_id, (porConta.get(t.account_id) || 0) + mult * t.amount)
    })
    return Array.from(porConta.values()).reduce((s, v) => s + v, 0)
  }, [accounts, txs])

  // Novos KPIs
  const valoresVencidos = useMemo(() => {
    return txs.filter(t => t.status === 'previsto' && new Date(t.due_date) < today)
      .reduce((sum, t) => sum + (t.type === 'entrada' ? t.amount : -t.amount), 0)
  }, [txs, today])

  const saldoProjetado30Dias = useMemo(() => {
    const previstos30Dias = txs.filter(t =>
      t.status === 'previsto' &&
      new Date(t.due_date) >= today &&
      new Date(t.due_date) <= next30Days
    )
    const entradas = previstos30Dias.filter(t => t.type === 'entrada').reduce((s, t) => s + t.amount, 0)
    const saidas = previstos30Dias.filter(t => t.type === 'saida').reduce((s, t) => s + t.amount, 0)
    return saldoConsolidado + entradas - saidas
  }, [txs, today, next30Days, saldoConsolidado])

  // Projeção 13 semanas (cenário base e ±10%)
  const projectionData: WeekPoint[] = useMemo(()=>{
    // saldo inicial = soma por conta (opening + realizados até hoje)
    const porConta = new Map<string, number>()
    accounts.forEach(a=> porConta.set(a.id, a.opening_balance||0))
    txs.filter(t=> t.status==='realizado').forEach(t=>{
      const mult = t.type==='saida' ? -1 : 1
      porConta.set(t.account_id, (porConta.get(t.account_id)||0) + mult*t.amount)
    })
    let saldoInicial = Array.from(porConta.values()).reduce((s,v)=>s+v,0)

    const hoje = new Date()
    const start = new Date(hoje)
    start.setDate(start.getDate() - start.getDay()) // domingo da semana atual

    const pontos: WeekPoint[] = []
    let saldoAcumulado = saldoInicial
    for (let w=0; w<13; w++) {
      const ini = new Date(start)
      ini.setDate(ini.getDate() + w*7)
      const fim = new Date(ini)
      fim.setDate(fim.getDate() + 6)

      const semanaPrevistas = txs.filter(t=> t.status==='previsto' && new Date(t.due_date) >= ini && new Date(t.due_date) <= fim)
      const entradas = semanaPrevistas.filter(t=> t.type==='entrada').reduce((s,t)=> s+t.amount, 0)
      const saidas   = semanaPrevistas.filter(t=> t.type==='saida').reduce((s,t)=> s+t.amount, 0)

      const delta = entradas - saidas
      const base = saldoAcumulado + delta
      const melhor = saldoAcumulado + (delta * 1.1)
      const pior   = saldoAcumulado + (delta * 0.9)

      pontos.push({ week: `${ini.toLocaleDateString('pt-BR')} - ${fim.toLocaleDateString('pt-BR')}`, base, melhor, pior })
      saldoAcumulado = base
    }
    return pontos
  }, [accounts, txs])

  // Regras de categorização (substring)
  // Gráfico de barras - Entradas vs Saídas (6 meses)
  const barChartData = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

      const monthTxs = txs.filter(t => {
        const txDate = new Date(t.due_date)
        return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear()
      })

      const entradas = monthTxs.filter(t => t.type === 'entrada').reduce((s, t) => s + t.amount, 0)
      const saidas = monthTxs.filter(t => t.type === 'saida').reduce((s, t) => s + t.amount, 0)

      months.push({ month: monthName, entradas, saidas })
    }
    return months
  }, [txs])

  // Alertas inteligentes
  const alerts = useMemo(() => {
    const alertList = []

    // Saldo negativo projetado
    if (saldoProjetado30Dias < 0) {
      alertList.push({
        type: 'error',
        icon: AlertTriangle,
        message: `Saldo projetado negativo em 30 dias: ${saldoProjetado30Dias.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      })
    }

    // Valores vencidos
    if (valoresVencidos < 0) {
      alertList.push({
        type: 'warning',
        icon: Clock,
        message: `Valores vencidos: ${Math.abs(valoresVencidos).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      })
    }

    // Vencimentos próximos (7 dias)
    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const vencendoEm7Dias = txs.filter(t =>
      t.status === 'previsto' &&
      new Date(t.due_date) >= today &&
      new Date(t.due_date) <= next7Days
    ).length

    if (vencendoEm7Dias > 0) {
      alertList.push({
        type: 'info',
        icon: Target,
        message: `${vencendoEm7Dias} lançamento(s) vencendo nos próximos 7 dias`
      })
    }

    return alertList
  }, [saldoProjetado30Dias, valoresVencidos, txs, today])

  // Paginação
  const paginatedTxs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredTxs.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredTxs, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredTxs.length / itemsPerPage)

  // Funções para ações em lote
  const toggleSelectAll = useCallback(() => {
    if (selectedTxs.size === paginatedTxs.length) {
      setSelectedTxs(new Set())
    } else {
      setSelectedTxs(new Set(paginatedTxs.map(t => t.id)))
    }
  }, [selectedTxs.size, paginatedTxs])

  const toggleSelectTx = useCallback((txId: string) => {
    const newSelected = new Set(selectedTxs)
    if (newSelected.has(txId)) {
      newSelected.delete(txId)
    } else {
      newSelected.add(txId)
    }
    setSelectedTxs(newSelected)
  }, [selectedTxs])

  useEffect(() => {
    setShowBulkActions(selectedTxs.size > 0)
  }, [selectedTxs.size])

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setFAccount('todas')
    setFStatus('todos')
    setFType('todos')
    setFCategory('')
    setFFrom('')
    setFTo('')
    setFSearch('')
    setCurrentPage(1)
  }, [])
  const [rules, setRules] = useState<{ id: string; rule_text: string; category: string|null }[]>([])
  useEffect(()=>{
    supabase.from('finance_rules').select('id,rule_text,category').then(({data})=>{
      setRules((data||[]) as any)
    })
  },[])

  // CSV import / conciliação
  type BankRow = { date: string; description: string; value: number; balance?: number }
  const [bankRows, setBankRows] = useState<BankRow[]>([])
  const [ignored, setIgnored] = useState<Set<number>>(new Set())
  const [concAccountId, setConcAccountId] = useState<string>('')
  useEffect(()=>{
    // default conc account = filtro selecionado ou primeira conta
    if (!concAccountId) {
      if (fAccount !== 'todas') setConcAccountId(fAccount)
      else if (accounts[0]) setConcAccountId(accounts[0].id)
    }
  },[fAccount, accounts])

  const parseCurrency = (s: string) => {
    const n = s.replace(/\s+/g,'').replace(/\./g,'').replace(/,/g,'.')
    const v = Number(n)
    return isNaN(v) ? 0 : v
  }
  const toISODate = (s: string) => {
    const t = s.trim()
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) {
      const [dd,mm,yyyy] = t.split('/')
      return `${yyyy}-${mm}-${dd}`
    }
    // try Date
    const d = new Date(t)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0,10)
    return ''
  }

  const onCSVSelected = async (file: File) => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0)
    if (lines.length < 2) { setBankRows([]); return }
    const headers = lines[0].split(';').length > 1 ? lines[0].split(';') : lines[0].split(',')
    const norm = headers.map(h=>h.trim().toLowerCase())
    const iDate = norm.findIndex(h=> h.includes('data'))

    const iDesc = norm.findIndex(h=> h.includes('descr') || h.includes('hist'))
    const iValue = norm.findIndex(h=> h.includes('valor'))
    const iBal = norm.findIndex(h=> h.includes('saldo'))
    const rows: BankRow[] = []
    for (let i=1;i<lines.length;i++){
      const parts = lines[i].split(';').length > 1 ? lines[i].split(';') : lines[i].split(',')
      const dateStr = iDate>=0 ? parts[iDate]||'' : ''
      const descStr = iDesc>=0 ? parts[iDesc]||'' : ''
      const valStr  = iValue>=0 ? parts[iValue]||'' : ''
      const balStr  = iBal>=0 ? parts[iBal]||'' : ''
      const iso = toISODate(dateStr)
      const val = parseCurrency(valStr)
      if (!iso || !valStr) continue
      rows.push({ date: iso, description: descStr, value: val, balance: balStr ? parseCurrency(balStr) : undefined })
    }
    setBankRows(rows)
    setIgnored(new Set())
  }

  const within2Days = (a: string, b: string) => {
    const da = new Date(a).getTime(), db = new Date(b).getTime()
    const diff = Math.abs(db - da)
    return diff <= 2*24*60*60*1000
  }

  // Exportação CSV simples
  const exportCsv = () => {
    const cols = ['tipo','status','conta','vencimento','pagamento','valor','categoria','contato']
    const lines = [cols.join(';')]
    filteredTxs.forEach(t=>{
      const acc = accounts.find(a=>a.id===t.account_id)
      lines.push([
        t.type,
        t.status,
        acc?.name||'',
        t.due_date,
        t.payment_date||'',
        t.amount.toFixed(2).replace('.',','),
        t.category||'',
        t.contact||''
      ].join(';'))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lancamentos_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const suggestCategory = (desc: string) => {
    const low = (desc||'').toLowerCase()
    const rule = rules.find(r=> low.includes((r.rule_text||'').toLowerCase()))
    return rule?.category || null
  }

  const reconcileExisting = async (t: FinanceTx, row: BankRow) => {
    const { error } = await supabase.from('finance_transactions').update({ status: 'realizado', payment_date: row.date }).eq('id', t.id)
    if (error) throw error
    setTxs(prev=> prev.map(x=> x.id===t.id ? { ...x, status: 'realizado', payment_date: row.date } : x))
  }

  const createFromRow = async (row: BankRow) => {
    if (!concAccountId) throw new Error('Selecione a conta para conciliação')
    const type = row.value >= 0 ? 'entrada' : 'saida'
    const payload = {
      type,
      status: 'realizado',
      account_id: concAccountId,
      due_date: row.date,
      payment_date: row.date,
      amount: Math.abs(row.value),
      category: suggestCategory(row.description),
      contact: null,
      notes: row.description,
      attachment_url: null,
      invoice_id: null,
      transfer_group_id: null,
    }
    const { data, error } = await supabase.from('finance_transactions').insert([payload]).select('*').single()
    if (error) throw error
    setTxs(prev=> [data as any, ...prev])
  }


  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Fluxo de Caixa</h1>
            <p className="text-sm text-muted-foreground">Visão geral do saldo atual, projeções e conciliação</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={()=>setIsSyncOpen(true)}><RefreshCw className="h-4 w-4 mr-2"/>Sincronizar Notas</Button>
            <Button onClick={()=>setIsConciliacaoOpen(true)} variant="outline"><Upload className="h-4 w-4 mr-2"/>Importar Extrato (CSV)</Button>
            <Button onClick={()=>setIsLancamentoOpen(true)}><Plus className="h-4 w-4 mr-2"/>Novo Lançamento</Button>
          </div>
        </div>

        {/* Filtros robustos */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Filtros
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Select value={fAccount} onValueChange={setFAccount}>
                <SelectTrigger><SelectValue placeholder="Conta"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger><SelectValue placeholder="Status"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="previsto">Previsto</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fType} onValueChange={setFType}>
                <SelectTrigger><SelectValue placeholder="Tipo"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Categoria" value={fCategory} onChange={e=>setFCategory(e.target.value)} />
              <Input type="date" value={fFrom} onChange={e=>setFFrom(e.target.value)} placeholder="Data de" />
              <Input type="date" value={fTo} onChange={e=>setFTo(e.target.value)} placeholder="Data até" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar em observações, categoria, contato..."
                value={fSearch}
                onChange={e=>setFSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cards de saldo */}
        {/* Dialog: Sincronizar Notas (criar a receber previsto D+X) */}
        <Dialog open={isSyncOpen} onOpenChange={setIsSyncOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Sincronizar Notas → Contas a Receber (Previsto)</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select value={syncAccountId} onValueChange={setSyncAccountId}>
                <SelectTrigger><SelectValue placeholder="Conta de destino"/></SelectTrigger>
                <SelectContent>
                  {accounts.map(a=> <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={async ()=>{
                if (!syncAccountId) return toast({ title:'Selecione a conta', variant:'destructive' })
                try {
                  // Buscar invoices emitidas sem lançamento vinculado
                  const { data: invs, error } = await supabase
                    .from('invoices')
                    .select('id, company_id, valor_total, data_emissao, status')
                    .eq('status','emitida')
                    .order('data_emissao', { ascending: true })
                  if (error) throw error

                  // Buscar companies configs (prazo)
                  const { data: companies } = await supabase.from('companies').select('id, finance_settings')
                  const mapSettings = new Map<string, any>()
                  ;(companies||[]).forEach(c=> mapSettings.set(c.id, c.finance_settings||{}))

                  // Buscar transações já vinculadas (para evitar duplicatas)
                  const { data: existing } = await supabase.from('finance_transactions').select('invoice_id').not('invoice_id','is',null)
                  const exSet = new Set((existing||[]).map((e:any)=> e.invoice_id))

                  const payloads: any[] = []
                  ;(invs||[]).forEach((inv:any) => {
                    if (exSet.has(inv.id)) return
                    const settings = mapSettings.get(inv.company_id) || {}
                    const days = Number(settings.default_receivable_terms_days) || 15
                    const due = new Date(inv.data_emissao)
                    due.setDate(due.getDate() + days)
                    payloads.push({
                      type: 'entrada',
                      status: 'previsto',
                      account_id: syncAccountId,
                      due_date: due.toISOString().slice(0,10),
                      payment_date: null,
                      amount: Number(inv.valor_total),
                      category: 'a receber',
                      contact: null,
                      notes: `Invoice ${inv.id}`,
                      attachment_url: null,
                      invoice_id: inv.id,
                      transfer_group_id: null,
                    })
                  })
                  if (payloads.length>0){
                    const { error: insErr } = await supabase.from('finance_transactions').insert(payloads)
                    if (insErr) throw insErr
                  }
                  toast({ title:`Sincronização concluída`, description: `${payloads.length} lançamentos criados` })
                  setIsSyncOpen(false)
                  // refresh lançamentos
                  const { data: txData } = await supabase.from('finance_transactions').select('*').order('due_date', { ascending: true }).limit(500)
                  setTxs((txData||[]) as any)
                } catch(err:any){
                  toast({ title:'Erro na sincronização', description: String(err?.message||err), variant:'destructive' })
                }
              }}>Sincronizar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cards de saldo expandidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Saldo Consolidado
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">
              {isLoading ? <Skeleton className="h-6 w-24" /> : saldoConsolidado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Saldo Projetado (30d)
              </CardTitle>
            </CardHeader>
            <CardContent className={`text-xl font-semibold ${saldoProjetado30Dias < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {isLoading ? <Skeleton className="h-6 w-24" /> : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      {saldoProjetado30Dias.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Saldo atual + entradas previstas - saídas previstas (próximos 30 dias)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Entradas (Mês)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold text-emerald-600">
              {isLoading ? <Skeleton className="h-6 w-24" /> : entradasMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Saídas (Mês)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold text-rose-600">
              {isLoading ? <Skeleton className="h-6 w-24" /> : saidasMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Valores Vencidos
              </CardTitle>
            </CardHeader>
            <CardContent className={`text-xl font-semibold ${valoresVencidos < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {isLoading ? <Skeleton className="h-6 w-24" /> : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      {Math.abs(valoresVencidos).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Lançamentos previstos com vencimento anterior a hoje</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Variação Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">
              {isLoading ? <Skeleton className="h-6 w-16" /> : `${((entradasMes - saidasMes) / Math.max(saidasMes, 1) * 100).toFixed(1)}%`}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico Entradas vs Saídas (6 meses) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Entradas vs Saídas (Últimos 6 Meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              entradas: { color: 'hsl(var(--emerald-500))', label: 'Entradas' },
              saidas: { color: 'hsl(var(--rose-500))', label: 'Saídas' }
            }}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} width={80} />
                <Bar dataKey="entradas" fill="var(--color-entradas)" />
                <Bar dataKey="saidas" fill="var(--color-saidas)" />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Projeção 13 semanas */}
        <Card>
          <CardHeader><CardTitle>Projeção (13 semanas)</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="base">
              <TabsList>
                <TabsTrigger value="base">Cenário Base</TabsTrigger>
                <TabsTrigger value="melhor">Melhor Caso (+10%)</TabsTrigger>
                <TabsTrigger value="pior">Pior Caso (-10%)</TabsTrigger>
              </TabsList>
              <TabsContent value="base">
                <ChartContainer config={{ base: { color: 'hsl(var(--primary))', label: 'Base' } }}>
                  <RLineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" hide tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tickFormatter={(v)=> v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} width={80} />
                    <Line type="monotone" dataKey="base" stroke="var(--color-base)" dot={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RLineChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="melhor">
                <ChartContainer config={{ melhor: { color: 'hsl(var(--emerald-500))', label: 'Melhor' } }}>
                  <RLineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" hide tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tickFormatter={(v)=> v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} width={80} />
                    <Line type="monotone" dataKey="melhor" stroke="var(--color-melhor)" dot={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RLineChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="pior">
                <ChartContainer config={{ pior: { color: 'hsl(var(--rose-500))', label: 'Pior' } }}>
                  <RLineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" hide tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tickFormatter={(v)=> v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} width={80} />
                    <Line type="monotone" dataKey="pior" stroke="var(--color-pior)" dot={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RLineChart>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Alertas inteligentes */}
        <Card>
          <CardHeader><CardTitle>Alertas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckSquare className="h-4 w-4" />
                Nenhum alerta no momento
              </div>
            ) : (
              alerts.map((alert, idx) => {
                const Icon = alert.icon
                const colorClass = {
                  error: 'text-red-600 bg-red-50 border-red-200',
                  warning: 'text-amber-600 bg-amber-50 border-amber-200',
                  info: 'text-blue-600 bg-blue-50 border-blue-200'
                }[alert.type]

                return (
                  <div key={idx} className={`flex items-center gap-2 p-3 rounded-lg border ${colorClass}`}>
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{alert.message}</span>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Barra de ações em lote */}
        {showBulkActions && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedTxs.size} item(s) selecionado(s)
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={async () => {
                    try {
                      const ids = Array.from(selectedTxs)
                      const { error } = await supabase
                        .from('finance_transactions')
                        .update({ status: 'realizado', payment_date: new Date().toISOString().slice(0,10) })
                        .in('id', ids)
                      if (error) throw error
                      setTxs(prev => prev.map(x => ids.includes(x.id) ? { ...x, status: 'realizado', payment_date: new Date().toISOString().slice(0,10) } : x))
                      setSelectedTxs(new Set())
                      toast({ title: `${ids.length} lançamento(s) marcado(s) como pago` })
                    } catch (error: any) {
                      toast({ title: 'Erro ao marcar como pago', description: error.message, variant: 'destructive' })
                    }
                  }}>
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Marcar como Pago
                  </Button>
                  <Button size="sm" variant="destructive" onClick={async () => {
                    try {
                      const ids = Array.from(selectedTxs)
                      const { error } = await supabase.from('finance_transactions').delete().in('id', ids)
                      if (error) throw error
                      setTxs(prev => prev.filter(x => !ids.includes(x.id)))
                      setSelectedTxs(new Set())
                      toast({ title: `${ids.length} lançamento(s) excluído(s)` })
                    } catch (error: any) {
                      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
                    }
                  }}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de lançamentos com ações em lote */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lançamentos ({filteredTxs.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2"/>Exportar CSV</Button>
              <Button onClick={()=>setIsLancamentoOpen(true)}><Plus className="h-4 w-4 mr-2"/>Novo</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTxs.size === paginatedTxs.length && paginatedTxs.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedTxs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <BarChart3 className="h-8 w-8" />
                        <p>Nenhum lançamento encontrado</p>
                        <p className="text-xs">Tente ajustar os filtros ou criar um novo lançamento</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTxs.map((t) => {
                    const acc = accounts.find(a => a.id === t.account_id)
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTxs.has(t.id)}
                            onCheckedChange={() => toggleSelectTx(t.id)}
                          />
                        </TableCell>
                        <TableCell className="capitalize">{t.type}</TableCell>
                        <TableCell className="capitalize">{t.status}</TableCell>
                        <TableCell>{acc?.name || '—'}</TableCell>
                        <TableCell>{new Date(t.due_date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{t.payment_date ? new Date(t.payment_date).toLocaleDateString('pt-BR') : '—'}</TableCell>
                        <TableCell>{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                        <TableCell>{t.category || '—'}</TableCell>
                        <TableCell>{t.contact || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {t.status !== 'realizado' && (
                              <Button size="sm" variant="outline" onClick={async () => {
                                const { error } = await supabase.from('finance_transactions').update({ status: 'realizado', payment_date: new Date().toISOString().slice(0, 10) }).eq('id', t.id)
                                if (error) return toast({ title: 'Erro ao marcar pago', description: error.message, variant: 'destructive' })
                                setTxs(prev => prev.map(x => x.id === t.id ? { ...x, status: 'realizado', payment_date: new Date().toISOString().slice(0, 10) } : x))
                              }}>Marcar Pago</Button>
                            )}
                            <Button size="sm" variant="outline" onClick={async () => {
                              const clone = { ...t, id: undefined, status: t.status, payment_date: null }
                              const { data, error } = await supabase.from('finance_transactions').insert([{
                                type: clone.type,
                                status: clone.status,
                                account_id: clone.account_id,
                                due_date: clone.due_date,
                                payment_date: clone.payment_date,
                                amount: clone.amount,
                                category: clone.category,
                                contact: clone.contact,
                                notes: clone.notes,
                                attachment_url: null,
                                invoice_id: null,
                                transfer_group_id: null,
                              }]).select('*').single()
                              if (error) return toast({ title: 'Erro ao duplicar', description: error.message, variant: 'destructive' })
                              setTxs(prev => [data as any, ...prev])
                            }}>Duplicar</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredTxs.length)} de {filteredTxs.length} lançamentos
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog: Novo Lançamento (skeleton) */}
        <Dialog open={isLancamentoOpen} onOpenChange={setIsLancamentoOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Novo Lançamento</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* estados do form simples */}
              {/* Para V0 mantemos sem react-hook-form para acelerar */}
              {/* Em V0.1 podemos evoluir validações */}

              <Select onValueChange={(v)=>setForm(prev=>({...prev, type: v as any}))}>
                <SelectTrigger><SelectValue placeholder="Tipo"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="previsto" onValueChange={(v)=>setForm(prev=>({...prev, status: v as any}))}>
                <SelectTrigger><SelectValue placeholder="Status"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="previsto">Previsto</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={(v)=>setForm(prev=>({...prev, account_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Conta"/></SelectTrigger>
                <SelectContent>
                  {accounts.map(a=> (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" placeholder="Data de Vencimento" onChange={e=>setForm(prev=>({...prev, due_date: e.target.value}))} />
              <Input type="date" placeholder="Data de Pagamento" onChange={e=>setForm(prev=>({...prev, payment_date: e.target.value||null}))} />
              <Input type="number" step="0.01" placeholder="Valor" onChange={e=>setForm(prev=>({...prev, amount: Number(e.target.value||0)}))} />
              <Select value={form.category} onValueChange={value => setForm(prev => ({...prev, category: value}))}>
                <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => c.type === (form.type === 'entrada' ? 'income' : 'expense'))
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <Input placeholder="Contato" onChange={e=>setForm(prev=>({...prev, contact: e.target.value}))} />
              <Input placeholder="Observações" onChange={e=>setForm(prev=>({...prev, notes: e.target.value}))} />
              <div className="md:col-span-2">
                <input ref={fileRef} type="file" className="hidden" onChange={(e)=> setFile(e.target.files?.[0]||null)} />
                <Button variant="outline" type="button" onClick={()=>fileRef.current?.click()}>Anexar Comprovante</Button>
                {file && <span className="ml-2 text-xs text-muted-foreground">{file.name}</span>}
              </div>

              {/* Transferência: escolher conta de destino quando type=transferencia */}
              {form.type==='transferencia' && (
                <Select value={toAccountId} onValueChange={setToAccountId}>
                  <SelectTrigger><SelectValue placeholder="Conta destino"/></SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a=>a.id!==form.account_id).map(a=> (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button className="col-span-full" onClick={async ()=>{
                if (!form.type || !form.status || !form.account_id || !form.due_date || !form.amount){
                  return toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
                }
                try {
                  if (form.type==='transferencia'){
                    if (!toAccountId) return toast({ title:'Selecione a conta destino', variant:'destructive' })
                    const group = (typeof window !== 'undefined' && (window as any).crypto && 'randomUUID' in (window as any).crypto)
                      ? (window as any).crypto.randomUUID()
                      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`
                    const base = {
                      status: form.status,
                      due_date: form.due_date,
                      payment_date: form.payment_date,
                      amount: form.amount,
                      category: form.category,
                      contact: form.contact,
                      notes: form.notes,
                      attachment_url: null,
                      invoice_id: null,
                      transfer_group_id: group,
                    }
                    const payloads = [
                      { ...base, type:'saida', account_id: form.account_id },
                      { ...base, type:'entrada', account_id: toAccountId }
                    ]
                    const { error: errIns } = await supabase.from('finance_transactions').insert(payloads)
                    if (errIns) throw errIns
                    toast({ title:'Transferência criada' })
                  } else {
                    // Upload do comprovante (opcional)
                    let attachment_url: string | null = null
                    if (file){
                      const path = `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g,'_')}`
                      const { error: upErr } = await supabase.storage.from('finance-attachments').upload(path, file, { upsert: false })
                      if (upErr) throw upErr
                      attachment_url = path
                    }
                    const payload = { ...form, attachment_url, invoice_id: null, transfer_group_id: null }
                    const { data, error } = await supabase.from('finance_transactions').insert([payload]).select('*').single()
                    if (error) throw error
                    setTxs(prev=> [data as any, ...prev])
                  }
                  // refresh
                  const { data: txData } = await supabase.from('finance_transactions').select('*').order('due_date', { ascending: true }).limit(500)
                  setTxs((txData||[]) as any)
                  setIsLancamentoOpen(false)
                  setForm(defaultForm)
                  setToAccountId('')
                } catch(err:any){
                  toast({ title:'Erro ao salvar', description: String(err?.message||err), variant:'destructive' })
                }
              }}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog: Conciliação (skeleton) */}
        <Dialog open={isConciliacaoOpen} onOpenChange={setIsConciliacaoOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Importar Extrato (CSV)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Input type="file" accept=".csv" onChange={e=>{ const f=e.target.files?.[0]; if (f) onCSVSelected(f).catch(err=>toast({ title:'Erro ao ler CSV', description: String(err), variant:'destructive'})) }} />
                </div>
                <Select value={concAccountId} onValueChange={setConcAccountId}>
                  <SelectTrigger><SelectValue placeholder="Conta para conciliar"/></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a=> <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">Esperado: data, descrição, valor, saldo do dia</div>
              <div className="border rounded p-3 text-sm max-h-72 overflow-auto">
                {bankRows.length===0 ? (
                  <div className="text-muted-foreground">Pré-visualização aparecerá aqui</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Match</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankRows.map((r, idx)=>{
                        if (ignored.has(idx)) return null
                        // matching: valor exato, data ±2 dias na mesma conta
                        const matches = txs.filter(t => t.account_id===concAccountId && t.status==='previsto' && t.amount===Math.abs(r.value) && within2Days(t.due_date, r.date))
                        const m = matches[0]
                        return (
                          <TableRow key={idx}>
                            <TableCell>{new Date(r.date).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{r.description}</TableCell>
                            <TableCell>{Math.abs(r.value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</TableCell>
                            <TableCell>{m ? `Previsto ${new Date(m.due_date).toLocaleDateString('pt-BR')}` : '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {m && (
                                  <Button size="sm" variant="outline" onClick={async()=>{
                                    try {
                                      await reconcileExisting(m, r)
                                      setIgnored(prev=> new Set([...prev, idx]))
                                    } catch(err:any){
                                      toast({ title:'Erro ao conciliar', description: String(err?.message||err), variant:'destructive' })
                                    }
                                  }}>Conciliar</Button>
                                )}
                                {!m && (
                                  <Button size="sm" variant="outline" onClick={async()=>{
                                    try {
                                      await createFromRow(r)
                                      setIgnored(prev=> new Set([...prev, idx]))
                                    } catch(err:any){
                                      toast({ title:'Erro ao criar lançamento', description: String(err?.message||err), variant:'destructive' })
                                    }
                                  }}>Criar Lançamento</Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={()=> setIgnored(prev=> new Set([...prev, idx]))}>Ignorar</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

export default FluxoDeCaixa

