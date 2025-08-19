import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Eye,
  Edit,
  Check,
  CreditCard,
  X,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  Building2
} from 'lucide-react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, PieChart as RPieChart, Cell, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts'

type Supplier = {
  id: string
  company_name: string
  cnpj: string | null
  email: string | null
  phone: string | null
  bank_data: any
  created_at: string
  updated_at: string
}

type AccountPayable = {
  id: string
  supplier_id: string
  description: string
  amount: number
  due_date: string
  status: 'pending' | 'approved' | 'paid' | 'overdue' | 'cancelled'
  category: string | null
  notes: string | null
  attachment_url: string | null
  payment_date: string | null
  payment_method: string | null
  created_at: string
  updated_at: string
  supplier?: Supplier
}

type PaymentApproval = {
  id: string
  account_payable_id: string
  approved_by: string
  approved_at: string
  notes: string | null
}

const ContasPagar = () => {
  const { profile } = useAuth()
  const { toast } = useToast()

  // Estados principais
  const [accounts, setAccounts] = useState<AccountPayable[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [approvals, setApprovals] = useState<PaymentApproval[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de modais
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false)
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null)

  // Estados de filtros
  const [filters, setFilters] = useState({
    period_start: '',
    period_end: '',
    supplier_id: 'all',
    status: 'all',
    min_amount: '',
    max_amount: '',
    search: ''
  })

  // Estados para ações em lote
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Estado para confirmação de aprovação
  const [approvalConfirm, setApprovalConfirm] = useState<{
    isOpen: boolean
    account: AccountPayable | null
    isBulk: boolean
    accountIds: string[]
  }>({
    isOpen: false,
    account: null,
    isBulk: false,
    accountIds: []
  })

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)

  // Estados de formulários
  const [accountForm, setAccountForm] = useState({
    supplier_id: '',
    description: '',
    amount: 0,
    due_date: '',
    category: '',
    notes: ''
  })

  const [supplierForm, setSupplierForm] = useState({
    company_name: '',
    cnpj: '',
    email: '',
    phone: '',
    bank_data: {}
  })

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Carregar contas a pagar com fornecedores
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts_payable')
          .select(`
            *,
            supplier:suppliers(*)
          `)
          .order('due_date', { ascending: true })

        if (accountsError) throw accountsError
        setAccounts(accountsData as AccountPayable[])

        // Carregar fornecedores
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('suppliers')
          .select('*')
          .order('company_name', { ascending: true })

        if (suppliersError) throw suppliersError
        setSuppliers(suppliersData as Supplier[])

        // Carregar aprovações
        const { data: approvalsData, error: approvalsError } = await supabase
          .from('payment_approvals')
          .select('*')

        if (approvalsError) throw approvalsError
        setApprovals(approvalsData as PaymentApproval[])

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

  // Filtrar contas
  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      if (filters.period_start && new Date(account.due_date) < new Date(filters.period_start)) return false
      if (filters.period_end && new Date(account.due_date) > new Date(filters.period_end)) return false
      if (filters.supplier_id !== 'all' && account.supplier_id !== filters.supplier_id) return false
      if (filters.status !== 'all' && account.status !== filters.status) return false
      if (filters.min_amount && account.amount < Number(filters.min_amount)) return false
      if (filters.max_amount && account.amount > Number(filters.max_amount)) return false
      if (filters.search) {
        const search = filters.search.toLowerCase()
        const searchableText = `${account.description} ${account.supplier?.company_name || ''}`.toLowerCase()
        if (!searchableText.includes(search)) return false
      }
      return true
    })
  }, [accounts, filters])

  // KPIs do Dashboard
  const dashboardKPIs = useMemo(() => {
    const today = new Date()
    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    const totalAPagar = accounts
      .filter(a => a.status !== 'paid' && a.status !== 'cancelled')
      .reduce((sum, a) => sum + a.amount, 0)

    const vencidos = accounts.filter(a => 
      new Date(a.due_date) < today && 
      a.status !== 'paid' && 
      a.status !== 'cancelled'
    )
    const vencidosValor = vencidos.reduce((sum, a) => sum + a.amount, 0)
    const vencidosQtd = vencidos.length

    const pagosNoMes = accounts
      .filter(a => {
        if (!a.payment_date) return false
        const paymentDate = new Date(a.payment_date)
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
      })
      .reduce((sum, a) => sum + a.amount, 0)

    const proximos7Dias = accounts
      .filter(a => {
        const dueDate = new Date(a.due_date)
        return dueDate >= today && dueDate <= next7Days && a.status !== 'paid' && a.status !== 'cancelled'
      })
      .reduce((sum, a) => sum + a.amount, 0)

    return {
      totalAPagar,
      vencidosValor,
      vencidosQtd,
      pagosNoMes,
      proximos7Dias
    }
  }, [accounts])

  // Maiores fornecedores por valor pendente
  const topSuppliers = useMemo(() => {
    const supplierTotals = new Map<string, { supplier: Supplier; total: number }>()
    
    accounts
      .filter(a => a.status !== 'paid' && a.status !== 'cancelled')
      .forEach(account => {
        if (account.supplier) {
          const current = supplierTotals.get(account.supplier_id) || { supplier: account.supplier, total: 0 }
          current.total += account.amount
          supplierTotals.set(account.supplier_id, current)
        }
      })

    return Array.from(supplierTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [accounts])

  // Status badge colors
  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Paginação
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAccounts, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage)

  // Ações em lote
  const toggleSelectAll = useCallback(() => {
    if (selectedAccounts.size === paginatedAccounts.length) {
      setSelectedAccounts(new Set())
    } else {
      setSelectedAccounts(new Set(paginatedAccounts.map(a => a.id)))
    }
  }, [selectedAccounts.size, paginatedAccounts])

  const toggleSelectAccount = useCallback((accountId: string) => {
    const newSelected = new Set(selectedAccounts)
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId)
    } else {
      newSelected.add(accountId)
    }
    setSelectedAccounts(newSelected)
  }, [selectedAccounts])

  useEffect(() => {
    setShowBulkActions(selectedAccounts.size > 0)
  }, [selectedAccounts.size])

  // Criar nova conta a pagar
  const handleCreateAccount = async () => {
    if (!accountForm.supplier_id || !accountForm.description || !accountForm.amount || !accountForm.due_date) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
      return
    }

    try {
      const { data, error } = await supabase
        .from('accounts_payable')
        .insert([{
          supplier_id: accountForm.supplier_id,
          description: accountForm.description,
          amount: accountForm.amount,
          due_date: accountForm.due_date,
          category: accountForm.category,
          notes: accountForm.notes,
          status: accountForm.amount > 1000 ? 'pending' : 'approved' // Aprovação automática para valores <= R$ 1.000
        }])
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .single()

      if (error) throw error

      setAccounts(prev => [data as AccountPayable, ...prev])
      setIsNewAccountOpen(false)
      setAccountForm({
        supplier_id: '',
        description: '',
        amount: 0,
        due_date: '',
        category: '',
        notes: ''
      })
      toast({ title: 'Conta a pagar criada com sucesso' })

    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Criar novo fornecedor
  const handleCreateSupplier = async () => {
    if (!supplierForm.company_name) {
      toast({ title: 'Preencha o nome da empresa', variant: 'destructive' })
      return
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierForm])
        .select()
        .single()

      if (error) throw error

      setSuppliers(prev => [data as Supplier, ...prev])
      setIsNewSupplierOpen(false)
      setSupplierForm({
        company_name: '',
        cnpj: '',
        email: '',
        phone: '',
        bank_data: {}
      })
      toast({ title: 'Fornecedor criado com sucesso' })

    } catch (error: any) {
      toast({
        title: 'Erro ao criar fornecedor',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Abrir confirmação de aprovação
  const openApprovalConfirm = (account: AccountPayable) => {
    setApprovalConfirm({
      isOpen: true,
      account,
      isBulk: false,
      accountIds: []
    })
  }

  // Aprovar conta (após confirmação)
  const handleApproveAccount = async (accountId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId)

      if (error) throw error

      // Registrar aprovação com log detalhado
      await supabase
        .from('payment_approvals')
        .insert([{
          account_payable_id: accountId,
          approved_by: profile?.id,
          notes: notes || 'Aprovação manual',
          approved_at: new Date().toISOString()
        }])

      setAccounts(prev => prev.map(a =>
        a.id === accountId ? { ...a, status: 'approved' as const } : a
      ))

      toast({
        title: 'Conta aprovada com sucesso',
        description: `Conta aprovada e registrada no log de auditoria`
      })

    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar conta',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Marcar como pago
  const handleMarkAsPaid = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'manual'
        })
        .eq('id', accountId)

      if (error) throw error

      setAccounts(prev => prev.map(a =>
        a.id === accountId ? {
          ...a,
          status: 'paid' as const,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'manual'
        } : a
      ))

      toast({ title: 'Conta marcada como paga' })

    } catch (error: any) {
      toast({
        title: 'Erro ao marcar como pago',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Ações em lote
  // Abrir confirmação de aprovação em lote
  const openBulkApprovalConfirm = () => {
    const ids = Array.from(selectedAccounts)
    setApprovalConfirm({
      isOpen: true,
      account: null,
      isBulk: true,
      accountIds: ids
    })
  }

  const handleBulkApprove = async (accountIds?: string[], notes?: string) => {
    try {
      const ids = accountIds || Array.from(selectedAccounts)
      const { error } = await supabase
        .from('accounts_payable')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .in('id', ids)

      if (error) throw error

      // Registrar aprovações individuais no log
      const approvals = ids.map(id => ({
        account_payable_id: id,
        approved_by: profile?.id,
        notes: notes || 'Aprovação em lote',
        approved_at: new Date().toISOString()
      }))

      await supabase
        .from('payment_approvals')
        .insert(approvals)

      setAccounts(prev => prev.map(a =>
        ids.includes(a.id) ? { ...a, status: 'approved' as const } : a
      ))
      setSelectedAccounts(new Set())
      toast({
        title: `${ids.length} conta(s) aprovada(s)`,
        description: `Aprovações registradas no log de auditoria`
      })

    } catch (error: any) {
      toast({
        title: 'Erro ao aprovar contas',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleBulkMarkAsPaid = async () => {
    try {
      const ids = Array.from(selectedAccounts)
      const { error } = await supabase
        .from('accounts_payable')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'bulk'
        })
        .in('id', ids)

      if (error) throw error

      setAccounts(prev => prev.map(a =>
        ids.includes(a.id) ? {
          ...a,
          status: 'paid' as const,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'bulk'
        } : a
      ))
      setSelectedAccounts(new Set())
      toast({ title: `${ids.length} conta(s) marcada(s) como paga(s)` })

    } catch (error: any) {
      toast({
        title: 'Erro ao marcar contas como pagas',
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
            <h1 className="text-2xl font-semibold">Contas a Pagar</h1>
            <p className="text-sm text-muted-foreground">Gestão completa de fornecedores e pagamentos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setIsNewAccountOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Tabs principais */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="contas" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contas
            </TabsTrigger>
            <TabsTrigger value="fornecedores" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Fornecedores
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Tab Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPIs Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total a Pagar
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-red-600">
                  {loading ? <Skeleton className="h-8 w-24" /> :
                    dashboardKPIs.totalAPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  }
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Vencidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-red-600">
                    {loading ? <Skeleton className="h-8 w-24" /> :
                      dashboardKPIs.vencidosValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {dashboardKPIs.vencidosQtd} conta(s)
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Pagos no Mês
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-green-600">
                  {loading ? <Skeleton className="h-8 w-24" /> :
                    dashboardKPIs.pagosNoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  }
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Próximos 7 dias
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-orange-600">
                  {loading ? <Skeleton className="h-8 w-24" /> :
                    dashboardKPIs.proximos7Dias.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  }
                </CardContent>
              </Card>
            </div>

            {/* Alertas e Top Fornecedores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Alertas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                    </div>
                  ) : dashboardKPIs.vencidosQtd === 0 ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      Nenhuma conta vencida
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        {dashboardKPIs.vencidosQtd} conta(s) vencida(s)
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total: {dashboardKPIs.vencidosValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Maiores Fornecedores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topSuppliers.map((item, idx) => (
                        <div key={item.supplier.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-muted rounded-full w-6 h-6 flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-medium">{item.supplier.company_name}</span>
                          </div>
                          <span className="text-sm font-semibold text-red-600">
                            {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Contas */}
          <TabsContent value="contas" className="space-y-6">
            {/* Barra de ações em lote */}
            {showBulkActions && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedAccounts.size} conta(s) selecionada(s)
                    </span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={openBulkApprovalConfirm}>
                        <Check className="h-4 w-4 mr-1" />
                        Aprovar Selecionados
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleBulkMarkAsPaid}>
                        <CreditCard className="h-4 w-4 mr-1" />
                        Marcar como Pago
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filtros */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                  <Select value={filters.supplier_id} onValueChange={value => setFilters(prev => ({ ...prev, supplier_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filters.status} onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
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
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição ou fornecedor..."
                    value={filters.search}
                    onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setFilters({
                    period_start: '',
                    period_end: '',
                    supplier_id: 'all',
                    status: 'all',
                    min_amount: '',
                    max_amount: '',
                    search: ''
                  })}>
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Contas */}
            <Card>
              <CardHeader>
                <CardTitle>Contas a Pagar ({filteredAccounts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedAccounts.size === paginatedAccounts.length && paginatedAccounts.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredAccounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileText className="h-8 w-8" />
                            <p>Nenhuma conta encontrada</p>
                            <p className="text-xs">Ajuste os filtros ou crie uma nova conta</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedAccounts.map(account => (
                        <TableRow key={account.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedAccounts.has(account.id)}
                              onCheckedChange={() => toggleSelectAccount(account.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {account.supplier?.company_name || '—'}
                          </TableCell>
                          <TableCell>{account.description}</TableCell>
                          <TableCell className="font-semibold">
                            {account.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell>
                            {new Date(account.due_date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(account.status)}>
                              {account.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              {account.status === 'pending' && account.amount > 1000 && (
                                <Button size="sm" variant="outline" onClick={() => openApprovalConfirm(account)}>
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              {account.status === 'approved' && (
                                <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(account.id)}>
                                  <CreditCard className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredAccounts.length)} de {filteredAccounts.length} contas
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
          </TabsContent>

          {/* Tab Fornecedores */}
          <TabsContent value="fornecedores" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Fornecedores</h2>
              <Button onClick={() => setIsNewSupplierOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Button>
            </div>

            {/* KPIs Fornecedores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Total de Fornecedores</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {loading ? <Skeleton className="h-8 w-16" /> : suppliers.length}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Maior Credor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    {loading ? <Skeleton className="h-6 w-24" /> :
                      topSuppliers[0]?.supplier.company_name || '—'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {topSuppliers[0]?.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Prazo Médio</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {loading ? <Skeleton className="h-8 w-16" /> : '30 dias'}
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Fornecedores */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Fornecedores</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Total em Aberto</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      suppliers.map(supplier => {
                        const supplierTotal = topSuppliers.find(t => t.supplier.id === supplier.id)?.total || 0
                        return (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.company_name}</TableCell>
                            <TableCell>{supplier.cnpj || '—'}</TableCell>
                            <TableCell className="font-semibold text-red-600">
                              {supplierTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </TableCell>
                            <TableCell>{supplier.email || supplier.phone || '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Relatórios */}
          <TabsContent value="relatorios" className="space-y-6">
            <h2 className="text-xl font-semibold">Relatórios</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Total Pago no Período</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-green-600">
                  {loading ? <Skeleton className="h-8 w-24" /> :
                    dashboardKPIs.pagosNoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  }
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Maior Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {loading ? <Skeleton className="h-8 w-24" /> : 'R$ 0,00'}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Fornecedor + Transações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    {loading ? <Skeleton className="h-6 w-24" /> :
                      topSuppliers[0]?.supplier.company_name || '—'
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center py-8 text-muted-foreground">
              <PieChart className="h-12 w-12 mx-auto mb-4" />
              <p>Gráficos de relatórios em desenvolvimento</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal: Nova Conta a Pagar */}
        <Dialog open={isNewAccountOpen} onOpenChange={setIsNewAccountOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nova Conta a Pagar</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={accountForm.supplier_id} onValueChange={value => setAccountForm(prev => ({ ...prev, supplier_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Categoria"
                value={accountForm.category}
                onChange={e => setAccountForm(prev => ({ ...prev, category: e.target.value }))}
              />
              <Input
                placeholder="Descrição"
                value={accountForm.description}
                onChange={e => setAccountForm(prev => ({ ...prev, description: e.target.value }))}
                className="md:col-span-2"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Valor"
                value={accountForm.amount || ''}
                onChange={e => setAccountForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
              />
              <Input
                type="date"
                placeholder="Data de vencimento"
                value={accountForm.due_date}
                onChange={e => setAccountForm(prev => ({ ...prev, due_date: e.target.value }))}
              />
              <Textarea
                placeholder="Observações"
                value={accountForm.notes}
                onChange={e => setAccountForm(prev => ({ ...prev, notes: e.target.value }))}
                className="md:col-span-2"
              />
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewAccountOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAccount}>
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Novo Fornecedor */}
        <Dialog open={isNewSupplierOpen} onOpenChange={setIsNewSupplierOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Novo Fornecedor</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Razão Social"
                value={supplierForm.company_name}
                onChange={e => setSupplierForm(prev => ({ ...prev, company_name: e.target.value }))}
                className="md:col-span-2"
              />
              <Input
                placeholder="CNPJ"
                value={supplierForm.cnpj}
                onChange={e => setSupplierForm(prev => ({ ...prev, cnpj: e.target.value }))}
              />
              <Input
                placeholder="Email"
                type="email"
                value={supplierForm.email}
                onChange={e => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder="Telefone"
                value={supplierForm.phone}
                onChange={e => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                className="md:col-span-2"
              />
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewSupplierOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSupplier}>
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Aprovação */}
        <AlertDialog open={approvalConfirm.isOpen} onOpenChange={(open) =>
          setApprovalConfirm(prev => ({ ...prev, isOpen: open }))
        }>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Confirmar Aprovação
              </AlertDialogTitle>
              <AlertDialogDescription>
                {approvalConfirm.isBulk ? (
                  <>
                    Você está prestes a aprovar <strong>{approvalConfirm.accountIds.length} conta(s)</strong> a pagar.
                    <br />
                    Esta ação será registrada no log de auditoria e não pode ser desfeita.
                  </>
                ) : (
                  <>
                    Você está prestes a aprovar a conta:
                    <br />
                    <strong>{approvalConfirm.account?.description}</strong>
                    <br />
                    Valor: <strong>{approvalConfirm.account?.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    <br />
                    Esta ação será registrada no log de auditoria e não pode ser desfeita.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Observações (opcional):</label>
              <Textarea
                placeholder="Adicione observações sobre esta aprovação..."
                className="mt-2"
                id="approval-notes"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const notes = (document.getElementById('approval-notes') as HTMLTextAreaElement)?.value

                  if (approvalConfirm.isBulk) {
                    handleBulkApprove(approvalConfirm.accountIds, notes)
                  } else if (approvalConfirm.account) {
                    handleApproveAccount(approvalConfirm.account.id, notes)
                  }

                  setApprovalConfirm({
                    isOpen: false,
                    account: null,
                    isBulk: false,
                    accountIds: []
                  })
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar Aprovação
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  )
}

export default ContasPagar
