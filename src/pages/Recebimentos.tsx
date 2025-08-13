import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Download, Upload, MessageCircle, Mail, Receipt, CreditCard, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react'
import { useEffect, useMemo, useState, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

type Receivable = {
  id: string
  invoice_id: string | null
  customer_name: string
  due_date: string
  gross_amount: number
  discount_amount: number
  interest_amount: number
  net_amount: number
  status: 'aguardando' | 'vencendo' | 'atrasado' | 'pago' | 'parcelado' | 'cancelado'
  payment_method: 'pix' | 'boleto' | 'manual' | 'ted' | 'cartao' | null
  payment_link: string | null
  qr_code: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

type PaymentReceipt = {
  id: string
  receivable_id: string
  payment_date: string
  amount_received: number
  fees: number
  attachment_url: string | null
  notes: string | null
}

const Recebimentos = () => {
  const { profile } = useAuth()
  const { toast } = useToast()

  // Estados principais
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([])
  const [loading, setLoading] = useState(true)

  // Modais
  const [isNewReceivableOpen, setIsNewReceivableOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isCollectionOpen, setIsCollectionOpen] = useState(false)
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null)

  // Filtros persistentes (localStorage)
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('receivables-filters')
    return saved ? JSON.parse(saved) : {
      period_start: '',
      period_end: '',
      customer: '',
      status: [],
      payment_method: [],
      min_amount: '',
      max_amount: ''
    }
  })

  // Formulário novo recebível
  const defaultForm = {
    customer_name: '',
    due_date: '',
    gross_amount: 0,
    discount_amount: 0,
    interest_amount: 0,
    payment_method: null as any,
    tags: [] as string[]
  }
  const [form, setForm] = useState(defaultForm)

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Carregar recebíveis
        const { data: receivablesData, error: receivablesError } = await supabase
          .from('receivables')
          .select('*')
          .order('due_date', { ascending: true })
          .limit(500)

        if (receivablesError) throw receivablesError
        setReceivables(receivablesData as Receivable[])

        // Carregar comprovantes
        const { data: receiptsData, error: receiptsError } = await supabase
          .from('payment_receipts')
          .select('*')
          .order('payment_date', { ascending: false })

        if (receiptsError) throw receiptsError
        setReceipts(receiptsData as PaymentReceipt[])

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

  // Salvar filtros no localStorage
  useEffect(() => {
    localStorage.setItem('receivables-filters', JSON.stringify(filters))
  }, [filters])

  // Filtrar recebíveis
  const filteredReceivables = useMemo(() => {
    return receivables.filter(r => {
      if (filters.period_start && new Date(r.due_date) < new Date(filters.period_start)) return false
      if (filters.period_end && new Date(r.due_date) > new Date(filters.period_end)) return false
      if (filters.customer && !r.customer_name.toLowerCase().includes(filters.customer.toLowerCase())) return false
      if (filters.status.length > 0 && !filters.status.includes(r.status)) return false
      if (filters.payment_method.length > 0 && r.payment_method && !filters.payment_method.includes(r.payment_method)) return false
      if (filters.min_amount && r.net_amount < Number(filters.min_amount)) return false
      if (filters.max_amount && r.net_amount > Number(filters.max_amount)) return false
      return true
    })
  }, [receivables, filters])

  // KPIs
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const kpis = useMemo(() => {
    const aReceber = filteredReceivables
      .filter(r => r.status !== 'pago' && new Date(r.due_date).getMonth() === currentMonth && new Date(r.due_date).getFullYear() === currentYear)
      .reduce((sum, r) => sum + r.net_amount, 0)

    const atrasados = filteredReceivables
      .filter(r => r.status !== 'pago' && new Date(r.due_date) < today)
      .reduce((sum, r) => sum + r.net_amount, 0)

    const recebidos = receipts
      .filter(r => new Date(r.payment_date).getMonth() === currentMonth && new Date(r.payment_date).getFullYear() === currentYear)
      .reduce((sum, r) => sum + r.amount_received, 0)

    const totalEnviado = filteredReceivables.reduce((sum, r) => sum + r.net_amount, 0)
    const conversao = totalEnviado > 0 ? (recebidos / totalEnviado) * 100 : 0

    return { aReceber, atrasados, recebidos, conversao }
  }, [filteredReceivables, receipts, currentMonth, currentYear, today])

  // Status badge colors
  const getStatusBadge = (status: string) => {
    const colors = {
      aguardando: 'bg-blue-100 text-blue-800',
      vencendo: 'bg-yellow-100 text-yellow-800',
      atrasado: 'bg-red-100 text-red-800',
      pago: 'bg-green-100 text-green-800',
      parcelado: 'bg-purple-100 text-purple-800',
      cancelado: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Criar novo recebível
  const handleCreateReceivable = async () => {
    if (!form.customer_name || !form.due_date || !form.gross_amount) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
      return
    }

    try {
      const { data, error } = await supabase
        .from('receivables')
        .insert([{
          customer_name: form.customer_name,
          due_date: form.due_date,
          gross_amount: form.gross_amount,
          discount_amount: form.discount_amount,
          interest_amount: form.interest_amount,
          payment_method: form.payment_method,
          tags: form.tags
        }])
        .select()
        .single()

      if (error) throw error

      setReceivables(prev => [data as Receivable, ...prev])
      setIsNewReceivableOpen(false)
      setForm(defaultForm)
      toast({ title: 'Recebível criado com sucesso' })

    } catch (error: any) {
      toast({
        title: 'Erro ao criar recebível',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Recebimentos</h1>
            <p className="text-sm text-muted-foreground">Gestão de contas a receber e cobranças</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setIsNewReceivableOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Recebível
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                A Receber (Mês)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-blue-600">
              {kpis.aReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Atrasados
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-red-600">
              {kpis.atrasados.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recebidos (Mês)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-green-600">
              {kpis.recebidos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Conversão
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {kpis.conversao.toFixed(1)}%
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
            <Input
              type="date"
              placeholder="Data início"
              value={filters.period_start}
              onChange={e => setFilters(prev => ({ ...prev, period_start: e.target.value }))}
            />
            <Input
              type="date"
              placeholder="Data fim"
              value={filters.period_end}
              onChange={e => setFilters(prev => ({ ...prev, period_end: e.target.value }))}
            />
            <Input
              placeholder="Cliente"
              value={filters.customer}
              onChange={e => setFilters(prev => ({ ...prev, customer: e.target.value }))}
            />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aguardando">Aguardando</SelectItem>
                <SelectItem value="vencendo">Vencendo</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="parcelado">Parcelado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Valor mín."
              value={filters.min_amount}
              onChange={e => setFilters(prev => ({ ...prev, min_amount: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Valor máx."
              value={filters.max_amount}
              onChange={e => setFilters(prev => ({ ...prev, max_amount: e.target.value }))}
            />
          </CardContent>
        </Card>

        {/* Lista de Recebíveis */}
        <Card>
          <CardHeader>
            <CardTitle>Recebíveis ({filteredReceivables.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor Bruto</TableHead>
                  <TableHead>Desconto/Juros</TableHead>
                  <TableHead>Valor Líquido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Carregando...</TableCell>
                  </TableRow>
                ) : filteredReceivables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Nenhum recebível encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceivables.map(receivable => (
                    <TableRow key={receivable.id}>
                      <TableCell className="font-medium">{receivable.customer_name}</TableCell>
                      <TableCell>{new Date(receivable.due_date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{receivable.gross_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell>
                        {receivable.discount_amount > 0 && (
                          <span className="text-green-600">-{receivable.discount_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        )}
                        {receivable.interest_amount > 0 && (
                          <span className="text-red-600">+{receivable.interest_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {receivable.net_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(receivable.status)}>
                          {receivable.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{receivable.payment_method || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline">
                            <CreditCard className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Receipt className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal: Novo Recebível */}
        <Dialog open={isNewReceivableOpen} onOpenChange={setIsNewReceivableOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Novo Recebível</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Nome do cliente"
                value={form.customer_name}
                onChange={e => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
              />
              <Input
                type="date"
                placeholder="Data de vencimento"
                value={form.due_date}
                onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Valor bruto"
                value={form.gross_amount || ''}
                onChange={e => setForm(prev => ({ ...prev, gross_amount: Number(e.target.value) }))}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Desconto"
                value={form.discount_amount || ''}
                onChange={e => setForm(prev => ({ ...prev, discount_amount: Number(e.target.value) }))}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Juros"
                value={form.interest_amount || ''}
                onChange={e => setForm(prev => ({ ...prev, interest_amount: Number(e.target.value) }))}
              />
              <Select onValueChange={value => setForm(prev => ({ ...prev, payment_method: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Método de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="ted">TED</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <Button className="col-span-full" onClick={handleCreateReceivable}>
                Criar Recebível
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

export default Recebimentos
