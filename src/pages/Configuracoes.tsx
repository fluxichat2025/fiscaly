import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  User, 
  Building2, 
  DollarSign, 
  Users, 
  Plug, 
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Shield,
  Bell,
  Palette,
  Globe,
  Clock,
  CreditCard,
  Tag,
  Target,
  Key,
  Mail,
  Database,
  Activity,
  FileText,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

type AppSetting = {
  id: string
  key: string
  value: any
  category: string
  description: string | null
  created_at: string
  updated_at: string
}

type UserPreference = {
  id: string
  user_id: string
  theme: string
  language: string
  timezone: string
  notifications: any
  created_at: string
  updated_at: string
}

type Category = {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
  active: boolean
  created_at: string
  updated_at: string
}

type CostCenter = {
  id: string
  name: string
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
}

type AuditLog = {
  id: string
  user_id: string | null
  action: string
  details: any
  ip_address: string | null
  created_at: string
}

type FinanceAccount = {
  id: string
  name: string
  opening_balance: number
  created_at: string
  updated_at: string
}

const Configuracoes = () => {
  const { profile } = useAuth()
  const { toast } = useToast()

  // Estados principais
  const [settings, setSettings] = useState<AppSetting[]>([])
  const [preferences, setPreferences] = useState<UserPreference | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [accounts, setAccounts] = useState<FinanceAccount[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de modais
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false)
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false)
  const [isNewUserOpen, setIsNewUserOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

  // Estado de busca global
  const [globalSearch, setGlobalSearch] = useState('')

  // Estados de formulários
  const [accountForm, setAccountForm] = useState({
    name: '',
    bank: '',
    agency: '',
    account: '',
    type: 'checking',
    opening_balance: 0
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'income' as 'income' | 'expense',
    color: '#3b82f6',
    icon: 'folder'
  })

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Carregar configurações do sistema
        const { data: settingsData, error: settingsError } = await supabase
          .from('app_settings')
          .select('*')
          .order('category', { ascending: true })

        if (settingsError) throw settingsError
        setSettings(settingsData as AppSetting[])

        // Carregar preferências do usuário
        const { data: preferencesData, error: preferencesError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', profile?.id)
          .single()

        if (preferencesError && preferencesError.code !== 'PGRST116') {
          throw preferencesError
        }
        setPreferences(preferencesData as UserPreference)

        // Carregar categorias
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('type', { ascending: true })

        if (categoriesError) throw categoriesError
        setCategories(categoriesData as Category[])

        // Carregar centros de custo
        const { data: costCentersData, error: costCentersError } = await supabase
          .from('cost_centers')
          .select('*')
          .order('name', { ascending: true })

        if (costCentersError) throw costCentersError
        setCostCenters(costCentersData as CostCenter[])

        // Carregar logs de auditoria
        const { data: auditLogsData, error: auditLogsError } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        if (auditLogsError) throw auditLogsError
        setAuditLogs(auditLogsData as AuditLog[])

        // Carregar contas bancárias
        const { data: accountsData, error: accountsError } = await supabase
          .from('finance_accounts')
          .select('*')
          .order('name', { ascending: true })

        if (accountsError) throw accountsError
        setAccounts(accountsData as FinanceAccount[])

      } catch (error: any) {
        toast({
          title: 'Erro ao carregar configurações',
          description: error.message,
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    if (profile?.id) {
      loadData()
    }
  }, [profile?.id])

  // Função para salvar configuração
  const saveSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: JSON.stringify(value) })
        .eq('key', key)

      if (error) throw error

      setSettings(prev => prev.map(s => 
        s.key === key ? { ...s, value } : s
      ))

      toast({ title: 'Configuração salva com sucesso' })

    } catch (error: any) {
      toast({
        title: 'Erro ao salvar configuração',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Função para salvar preferência do usuário
  const savePreference = async (field: string, value: any) => {
    try {
      if (preferences) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ [field]: value })
          .eq('user_id', profile?.id)

        if (error) throw error

        setPreferences(prev => prev ? { ...prev, [field]: value } : null)
      } else {
        const { data, error } = await supabase
          .from('user_preferences')
          .insert([{
            user_id: profile?.id,
            [field]: value
          }])
          .select()
          .single()

        if (error) throw error
        setPreferences(data as UserPreference)
      }

      toast({ title: 'Preferência salva com sucesso' })

    } catch (error: any) {
      toast({
        title: 'Erro ao salvar preferência',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Obter valor de configuração
  const getSetting = (key: string) => {
    const setting = settings.find(s => s.key === key)
    return setting ? setting.value : null
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Configurações</h1>
            <p className="text-sm text-muted-foreground">Gerencie as configurações do sistema</p>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar configurações..." 
              value={globalSearch} 
              onChange={e => setGlobalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs principais */}
        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="perfil" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="empresa" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="integracoes" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          {/* Tab Perfil */}
          <TabsContent value="perfil" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dados Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Dados Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Alterar Foto
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <Input value={profile?.first_name || ''} readOnly />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input value={profile?.email || ''} readOnly />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Telefone</label>
                      <Input placeholder="(11) 99999-9999" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferências */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Preferências
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tema</label>
                    <Select
                      value={preferences?.theme || 'light'}
                      onValueChange={value => savePreference('theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Idioma</label>
                    <Select
                      value={preferences?.language || 'pt-BR'}
                      onValueChange={value => savePreference('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fuso Horário</label>
                    <Select
                      value={preferences?.timezone || 'America/Sao_Paulo'}
                      onValueChange={value => savePreference('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Notificações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Notificações por Email</p>
                      <p className="text-xs text-muted-foreground">Receber alertas por email</p>
                    </div>
                    <Switch
                      checked={preferences?.notifications?.email || false}
                      onCheckedChange={checked => {
                        const newNotifications = { ...preferences?.notifications, email: checked }
                        savePreference('notifications', newNotifications)
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Notificações Push</p>
                      <p className="text-xs text-muted-foreground">Receber notificações no navegador</p>
                    </div>
                    <Switch
                      checked={preferences?.notifications?.push || false}
                      onCheckedChange={checked => {
                        const newNotifications = { ...preferences?.notifications, push: checked }
                        savePreference('notifications', newNotifications)
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Frequência</label>
                    <Select
                      value={preferences?.notifications?.frequency || 'daily'}
                      onValueChange={value => {
                        const newNotifications = { ...preferences?.notifications, frequency: value }
                        savePreference('notifications', newNotifications)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Imediata</SelectItem>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Segurança */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsChangePasswordOpen(true)}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Ativar 2FA
                  </Button>
                  <div>
                    <p className="text-sm font-medium mb-2">Sessões Ativas</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="text-xs font-medium">Sessão Atual</p>
                          <p className="text-xs text-muted-foreground">Chrome - São Paulo</p>
                        </div>
                        <Badge variant="secondary">Ativa</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Empresa */}
          <TabsContent value="empresa" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dados Corporativos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Dados Corporativos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium">Razão Social</label>
                      <Input
                        value={getSetting('company_name') || ''}
                        onChange={e => saveSetting('company_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">CNPJ</label>
                      <Input
                        value={getSetting('company_cnpj') || ''}
                        onChange={e => saveSetting('company_cnpj', e.target.value)}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Endereço</label>
                      <Input
                        value={getSetting('company_address')?.street || ''}
                        placeholder="Rua, número, bairro"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">Cidade</label>
                        <Input
                          value={getSetting('company_address')?.city || ''}
                          placeholder="Cidade"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">CEP</label>
                        <Input
                          value={getSetting('company_address')?.zip || ''}
                          placeholder="00000-000"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configurações Fiscais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Configurações Fiscais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Regime Tributário</label>
                    <Select
                      value={getSetting('tax_regime') || 'simples_nacional'}
                      onValueChange={value => saveSetting('tax_regime', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                        <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                        <SelectItem value="lucro_real">Lucro Real</SelectItem>
                        <SelectItem value="mei">MEI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Inscrição Estadual</label>
                    <Input placeholder="000.000.000.000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Inscrição Municipal</label>
                    <Input placeholder="00000000-0" />
                  </div>
                </CardContent>
              </Card>

              {/* Localização */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Localização
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Formato de Moeda</label>
                    <Select
                      value={getSetting('currency_format') || 'BRL'}
                      onValueChange={value => saveSetting('currency_format', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                        <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Separador Decimal</label>
                    <Select defaultValue="comma">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comma">Vírgula (,)</SelectItem>
                        <SelectItem value="dot">Ponto (.)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Timezone da Empresa</label>
                    <Select defaultValue="America/Sao_Paulo">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Backup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Backup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Backup Automático</p>
                      <p className="text-xs text-muted-foreground">Realizar backup automaticamente</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Frequência</label>
                    <Select
                      value={getSetting('backup_frequency') || 'daily'}
                      onValueChange={value => saveSetting('backup_frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Financeiro */}
          <TabsContent value="financeiro" className="space-y-6">
            {/* Contas Bancárias */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Contas Bancárias
                </CardTitle>
                <Button onClick={() => setIsNewAccountOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conta
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Saldo Inicial</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : accounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-8 w-8" />
                            <p>Nenhuma conta bancária cadastrada</p>
                            <p className="text-xs">Clique em "Nova Conta" para começar</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      accounts.map(account => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.name}</TableCell>
                          <TableCell>—</TableCell>
                          <TableCell>
                            {account.opening_balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-3 w-3" />
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

            {/* Categorias */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Categorias de Receita
                  </CardTitle>
                  <Button size="sm" onClick={() => setIsNewCategoryOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-2 border rounded">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                      ))
                    ) : (
                      categories
                        .filter(c => c.type === 'income')
                        .map(category => (
                          <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-sm">{category.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Categorias de Despesa
                  </CardTitle>
                  <Button size="sm" onClick={() => setIsNewCategoryOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-2 border rounded">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                      ))
                    ) : (
                      categories
                        .filter(c => c.type === 'expense')
                        .map(category => (
                          <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-sm">{category.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Centros de Custo */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Centros de Custo
                </CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Centro
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      costCenters.map(center => (
                        <TableRow key={center.id}>
                          <TableCell className="font-medium">{center.name}</TableCell>
                          <TableCell>{center.description || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={center.active ? 'default' : 'secondary'}>
                              {center.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-3 w-3" />
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
          </TabsContent>

          {/* Tab Usuários */}
          <TabsContent value="usuarios" className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Total de Usuários</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {loading ? <Skeleton className="h-8 w-16" /> : '1'}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Usuários Ativos</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-green-600">
                  {loading ? <Skeleton className="h-8 w-16" /> : '1'}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Administradores</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold text-blue-600">
                  {loading ? <Skeleton className="h-8 w-16" /> : '1'}
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Usuários */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuários do Sistema
                </CardTitle>
                <Button onClick={() => setIsNewUserOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">{profile?.first_name || 'Usuário'}</TableCell>
                      <TableCell>{profile?.email}</TableCell>
                      <TableCell>
                        <Badge>Admin</Badge>
                      </TableCell>
                      <TableCell>Agora</TableCell>
                      <TableCell>
                        <Badge variant="default">Ativo</Badge>
                      </TableCell>
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
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Auditoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Log de Acessos Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      auditLogs.slice(0, 10).map(log => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>Usuário</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell>
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Sucesso
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Integrações */}
          <TabsContent value="integracoes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Focus NFe */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Focus NFe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Token Produção</label>
                    <Input
                      type="password"
                      value={getSetting('focus_nfe_token_prod') || ''}
                      onChange={e => saveSetting('focus_nfe_token_prod', e.target.value)}
                      placeholder="Token de produção"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Token Homologação</label>
                    <Input
                      type="password"
                      value={getSetting('focus_nfe_token_homolog') || ''}
                      onChange={e => saveSetting('focus_nfe_token_homolog', e.target.value)}
                      placeholder="Token de homologação"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Conectado</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Testar Conexão
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* E-mail */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Configurações de E-mail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Servidor SMTP</label>
                    <Input
                      value={getSetting('smtp_server') || ''}
                      onChange={e => saveSetting('smtp_server', e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Porta</label>
                    <Input
                      type="number"
                      value={getSetting('smtp_port') || '587'}
                      onChange={e => saveSetting('smtp_port', e.target.value)}
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Usuário</label>
                    <Input
                      value={getSetting('smtp_user') || ''}
                      onChange={e => saveSetting('smtp_user', e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Senha</label>
                    <Input
                      type="password"
                      value={getSetting('smtp_password') || ''}
                      onChange={e => saveSetting('smtp_password', e.target.value)}
                      placeholder="Senha do email"
                    />
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Testar Envio
                  </Button>
                </CardContent>
              </Card>

              {/* Open Banking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Open Banking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum banco conectado</p>
                    <p className="text-xs">Conecte seus bancos para sincronização automática</p>
                  </div>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Conectar Novo Banco
                  </Button>
                </CardContent>
              </Card>

              {/* APIs Externas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    APIs Externas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Última Sync</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Focus NFe</TableCell>
                        <TableCell>
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        </TableCell>
                        <TableCell>Há 2 horas</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Receita Federal</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        </TableCell>
                        <TableCell>—</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Sistema */}
          <TabsContent value="sistema" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded">
                      <p className="text-2xl font-semibold">2.1 GB</p>
                      <p className="text-xs text-muted-foreground">Storage Usado</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded">
                      <p className="text-2xl font-semibold">1,247</p>
                      <p className="text-xs text-muted-foreground">API Calls (Mês)</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Limite de Storage</span>
                      <span>5 GB</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Backup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Backup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Último Backup</span>
                      <span>Hoje, 03:00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Próximo Agendado</span>
                      <span>Amanhã, 03:00</span>
                    </div>
                  </div>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Backup Manual
                  </Button>
                </CardContent>
              </Card>

              {/* Manutenção */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Manutenção
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Zap className="h-4 w-4 mr-2" />
                    Limpar Cache
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Reindexar Dados
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verificar Integridade
                  </Button>
                </CardContent>
              </Card>

              {/* Logs do Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Logs do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {auditLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="text-xs p-2 bg-muted rounded">
                        <div className="flex justify-between">
                          <span className="font-mono">{log.action}</span>
                          <span className="text-muted-foreground">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal: Alterar Senha */}
        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Senha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Senha Atual</label>
                <Input type="password" placeholder="Digite sua senha atual" />
              </div>
              <div>
                <label className="text-sm font-medium">Nova Senha</label>
                <Input type="password" placeholder="Digite a nova senha" />
              </div>
              <div>
                <label className="text-sm font-medium">Confirmar Nova Senha</label>
                <Input type="password" placeholder="Confirme a nova senha" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                  Cancelar
                </Button>
                <Button>
                  Alterar Senha
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Nova Conta Bancária */}
        <Dialog open={isNewAccountOpen} onOpenChange={setIsNewAccountOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conta Bancária</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome da Conta</label>
                <Input
                  value={accountForm.name}
                  onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Conta Corrente Principal"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Banco</label>
                <Select
                  value={accountForm.bank}
                  onValueChange={value => setAccountForm(prev => ({ ...prev, bank: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="001">Banco do Brasil</SelectItem>
                    <SelectItem value="104">Caixa Econômica</SelectItem>
                    <SelectItem value="237">Bradesco</SelectItem>
                    <SelectItem value="341">Itaú</SelectItem>
                    <SelectItem value="033">Santander</SelectItem>
                    <SelectItem value="260">Nu Pagamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Agência</label>
                <Input
                  value={accountForm.agency}
                  onChange={e => setAccountForm(prev => ({ ...prev, agency: e.target.value }))}
                  placeholder="0000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Conta</label>
                <Input
                  value={accountForm.account}
                  onChange={e => setAccountForm(prev => ({ ...prev, account: e.target.value }))}
                  placeholder="00000-0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={accountForm.type}
                  onValueChange={value => setAccountForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Saldo Inicial</label>
                <Input
                  type="number"
                  step="0.01"
                  value={accountForm.opening_balance || ''}
                  onChange={e => setAccountForm(prev => ({ ...prev, opening_balance: Number(e.target.value) }))}
                  placeholder="0,00"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewAccountOpen(false)}>
                  Cancelar
                </Button>
                <Button>
                  Salvar Conta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Nova Categoria */}
        <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome da Categoria</label>
                <Input
                  value={categoryForm.name}
                  onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Marketing Digital"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={categoryForm.type}
                  onValueChange={value => setCategoryForm(prev => ({ ...prev, type: value as 'income' | 'expense' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Cor</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={categoryForm.color}
                    onChange={e => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={categoryForm.color}
                    onChange={e => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Ícone</label>
                <Select
                  value={categoryForm.icon}
                  onValueChange={value => setCategoryForm(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="folder">📁 Pasta</SelectItem>
                    <SelectItem value="trending-up">📈 Crescimento</SelectItem>
                    <SelectItem value="briefcase">💼 Maleta</SelectItem>
                    <SelectItem value="truck">🚚 Caminhão</SelectItem>
                    <SelectItem value="receipt">🧾 Recibo</SelectItem>
                    <SelectItem value="users">👥 Usuários</SelectItem>
                    <SelectItem value="home">🏠 Casa</SelectItem>
                    <SelectItem value="plus-circle">➕ Mais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewCategoryOpen(false)}>
                  Cancelar
                </Button>
                <Button>
                  Salvar Categoria
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Novo Usuário */}
        <Dialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome Completo</label>
                <Input placeholder="João Silva" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="joao@empresa.com" />
              </div>
              <div>
                <label className="text-sm font-medium">Perfil</label>
                <Select defaultValue="readonly">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="financial">Financeiro</SelectItem>
                    <SelectItem value="readonly">Consulta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Senha Temporária</label>
                <Input type="password" placeholder="Senha inicial" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Permissões Específicas</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="perm-nfe" />
                    <label htmlFor="perm-nfe" className="text-sm">Notas Fiscais</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="perm-financial" />
                    <label htmlFor="perm-financial" className="text-sm">Financeiro</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="perm-reports" />
                    <label htmlFor="perm-reports" className="text-sm">Relatórios</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="perm-settings" />
                    <label htmlFor="perm-settings" className="text-sm">Configurações</label>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewUserOpen(false)}>
                  Cancelar
                </Button>
                <Button>
                  Criar Usuário
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

export default Configuracoes
