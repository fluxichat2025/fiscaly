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
  Zap,
  MapPin,
  Phone
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

type CompanyInfo = {
  id: string
  user_id: string
  razao_social?: string | null
  nome_fantasia?: string | null
  cnpj?: string | null
  logo_url?: string | null
  cep?: string | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  telefone?: string | null
  email_corporativo?: string | null
  website?: string | null
  inscricao_estadual?: string | null
  inscricao_municipal?: string | null
  regime_tributario?: string | null
  banco_principal?: string | null
  agencia?: string | null
  conta?: string | null
  atividade_principal?: string | null
  capital_social?: number | null
  data_abertura?: string | null
  created_at: string
  updated_at: string
}

type UserRole = 'administrador' | 'usuario' | 'contador' | 'visualizador'

type CompanyUser = {
  id: string
  user_id: string
  company_id: string
  role: UserRole
  is_active: boolean
  invited_by?: string | null
  invited_at: string
  joined_at?: string | null
  created_at: string
  updated_at: string
  profiles?: {
    id: string
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    avatar_url?: string | null
    phone?: string | null
  }
}

type UserInvitation = {
  id: string
  email: string
  company_id: string
  role: UserRole
  invited_by: string
  invitation_token: string
  expires_at: string
  accepted_at?: string | null
  created_at: string
}

type UserAuditLog = {
  id: string
  company_id: string
  performed_by?: string | null
  target_user_id?: string | null
  action: string
  details: any
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
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
  const { profile, user } = useAuth()
  const { toast } = useToast()

  // Estados principais
  const [settings, setSettings] = useState<AppSetting[]>([])
  const [preferences, setPreferences] = useState<UserPreference | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [accounts, setAccounts] = useState<FinanceAccount[]>([])
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [userInvitations, setUserInvitations] = useState<UserInvitation[]>([])
  const [userAuditLogs, setUserAuditLogs] = useState<UserAuditLog[]>([])
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Estados de modais
  const [isNewAccountOpen, setIsNewAccountOpen] = useState(false)
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false)
  const [isNewUserOpen, setIsNewUserOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null)

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

  const [userForm, setUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'usuario' as UserRole
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

        // Carregar dados da empresa
        const { data: companyData, error: companyError } = await supabase
          .from('company_info')
          .select('*')
          .eq('user_id', profile?.id)
          .single()

        if (companyError && companyError.code !== 'PGRST116') {
          throw companyError
        }
        setCompanyInfo(companyData as CompanyInfo)

        // Verificar se o usuário é administrador
        if (companyData?.id && profile?.id) {
          console.log('🔍 Verificando permissões de admin para:', {
            user_id: profile.id,
            company_id: companyData.id,
            profile_user_type: profile.user_type,
            profile_role: profile.role
          })

          // Primeiro, verificar se já é admin pelo perfil
          const isProfileAdmin = profile.user_type === 'admin' || profile.role === 'admin'
          console.log('👤 Admin pelo perfil:', isProfileAdmin)

          // Verificar na tabela user_companies
          const { data: adminCheck, error: adminError } = await supabase
            .from('user_companies')
            .select('role, is_active')
            .eq('user_id', profile.id)
            .eq('company_id', companyData.id)

          console.log('📊 Resultado da verificação user_companies:', { adminCheck, adminError })

          // Se não encontrou na user_companies, criar entrada
          if (adminError && adminError.code === 'PGRST116') {
            console.log('⚠️ Usuário não encontrado em user_companies, criando entrada...')

            const { data: newUserCompany, error: insertError } = await supabase
              .from('user_companies')
              .insert([{
                user_id: profile.id,
                company_id: companyData.id,
                role: isProfileAdmin ? 'administrador' : 'usuario',
                is_active: true
              }])
              .select()
              .single()

            if (!insertError) {
              console.log('✅ Entrada criada em user_companies:', newUserCompany)
            }
          }

          // Verificar múltiplas condições para admin
          const isAdmin = isProfileAdmin ||
                         adminCheck?.role === 'administrador' ||
                         adminCheck?.role === 'admin'

          console.log('🛡️ Status final de admin:', isAdmin)
          setIsUserAdmin(isAdmin)

          // Carregar usuários da empresa (apenas se for admin)
          if (isAdmin) {
            const { data: usersData, error: usersError } = await supabase
              .from('user_companies')
              .select(`
                *,
                profiles:user_id (
                  id,
                  first_name,
                  last_name,
                  email,
                  avatar_url,
                  phone
                )
              `)
              .eq('company_id', companyData.id)
              .order('created_at', { ascending: false })

            if (usersError) throw usersError
            setCompanyUsers(usersData as CompanyUser[])

            // Carregar convites pendentes
            const { data: invitationsData, error: invitationsError } = await supabase
              .from('user_invitations')
              .select('*')
              .eq('company_id', companyData.id)
              .is('accepted_at', null)
              .order('created_at', { ascending: false })

            if (invitationsError) throw invitationsError
            setUserInvitations(invitationsData as UserInvitation[])

            // Carregar logs de auditoria (últimos 50)
            const { data: logsData, error: logsError } = await supabase
              .from('user_audit_logs')
              .select('*')
              .eq('company_id', companyData.id)
              .order('created_at', { ascending: false })
              .limit(50)

            if (logsError) throw logsError
            setUserAuditLogs(logsData as UserAuditLog[])
          }
        }

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

  // Função para adicionar usuário
  const addUser = async () => {
    if (!companyInfo?.id || !isUserAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem adicionar usuários',
        variant: 'destructive'
      })
      return
    }

    if (!userForm.email || !userForm.first_name) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e email são obrigatórios',
        variant: 'destructive'
      })
      return
    }

    try {
      // Verificar se o email já está em uso na empresa
      const { data: existingUser } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('email', userForm.email)
        .eq('company_id', companyInfo.id)
        .single()

      if (existingUser) {
        toast({
          title: 'Email já convidado',
          description: 'Este email já foi convidado para a empresa',
          variant: 'destructive'
        })
        return
      }

      // Criar convite
      const { data: invitation, error: inviteError } = await supabase
        .from('user_invitations')
        .insert({
          email: userForm.email,
          company_id: companyInfo.id,
          role: userForm.role,
          invited_by: user?.id
        })
        .select()
        .single()

      if (inviteError) throw inviteError

      // Registrar log de auditoria
      await supabase.rpc('log_user_action', {
        p_company_id: companyInfo.id,
        p_performed_by: user?.id,
        p_target_user_id: null,
        p_action: 'convidou usuário',
        p_details: {
          email: userForm.email,
          role: userForm.role,
          name: `${userForm.first_name} ${userForm.last_name}`.trim()
        }
      })

      // Atualizar lista de convites
      setUserInvitations(prev => [invitation, ...prev])

      // Limpar formulário e fechar modal
      setUserForm({
        first_name: '',
        last_name: '',
        email: '',
        role: 'usuario'
      })
      setIsAddUserOpen(false)

      toast({
        title: 'Usuário convidado!',
        description: `Convite enviado para ${userForm.email}`
      })

    } catch (error: any) {
      toast({
        title: 'Erro ao convidar usuário',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Função para editar usuário
  const updateUser = async () => {
    if (!editingUser || !companyInfo?.id || !isUserAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem editar usuários',
        variant: 'destructive'
      })
      return
    }

    try {
      // Atualizar dados na tabela user_companies
      const { error: updateError } = await supabase
        .from('user_companies')
        .update({
          role: userForm.role,
          is_active: editingUser.is_active
        })
        .eq('id', editingUser.id)

      if (updateError) throw updateError

      // Atualizar dados do perfil se fornecidos
      if (userForm.first_name || userForm.last_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: userForm.first_name || editingUser.profiles?.first_name,
            last_name: userForm.last_name || editingUser.profiles?.last_name
          })
          .eq('id', editingUser.user_id)

        if (profileError) throw profileError
      }

      // Registrar log de auditoria
      await supabase.rpc('log_user_action', {
        p_company_id: companyInfo.id,
        p_performed_by: user?.id,
        p_target_user_id: editingUser.user_id,
        p_action: 'editou usuário',
        p_details: {
          role: userForm.role,
          name: `${userForm.first_name} ${userForm.last_name}`.trim()
        }
      })

      // Atualizar lista local
      setCompanyUsers(prev => prev.map(u =>
        u.id === editingUser.id
          ? {
              ...u,
              role: userForm.role,
              profiles: {
                ...u.profiles!,
                first_name: userForm.first_name || u.profiles?.first_name,
                last_name: userForm.last_name || u.profiles?.last_name
              }
            }
          : u
      ))

      // Limpar formulário e fechar modal
      setUserForm({
        first_name: '',
        last_name: '',
        email: '',
        role: 'usuario'
      })
      setEditingUser(null)
      setIsEditUserOpen(false)

      toast({
        title: 'Usuário atualizado!',
        description: 'Dados do usuário foram atualizados com sucesso'
      })

    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Função para ativar/desativar usuário
  const toggleUserStatus = async (companyUser: CompanyUser) => {
    if (!companyInfo?.id || !isUserAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem alterar status de usuários',
        variant: 'destructive'
      })
      return
    }

    try {
      const newStatus = !companyUser.is_active

      const { error } = await supabase
        .from('user_companies')
        .update({ is_active: newStatus })
        .eq('id', companyUser.id)

      if (error) throw error

      // Registrar log de auditoria
      await supabase.rpc('log_user_action', {
        p_company_id: companyInfo.id,
        p_performed_by: user?.id,
        p_target_user_id: companyUser.user_id,
        p_action: newStatus ? 'ativou usuário' : 'desativou usuário',
        p_details: {
          email: companyUser.profiles?.email,
          name: `${companyUser.profiles?.first_name || ''} ${companyUser.profiles?.last_name || ''}`.trim()
        }
      })

      // Atualizar lista local
      setCompanyUsers(prev => prev.map(u =>
        u.id === companyUser.id ? { ...u, is_active: newStatus } : u
      ))

      toast({
        title: `Usuário ${newStatus ? 'ativado' : 'desativado'}!`,
        description: `${companyUser.profiles?.first_name} foi ${newStatus ? 'ativado' : 'desativado'} com sucesso`
      })

    } catch (error: any) {
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Função para salvar dados da empresa
  const saveCompanyInfo = async (field: string, value: any) => {
    try {
      if (companyInfo) {
        const { error } = await supabase
          .from('company_info')
          .update({ [field]: value })
          .eq('user_id', profile?.id)

        if (error) throw error

        setCompanyInfo(prev => prev ? { ...prev, [field]: value } : null)
      } else {
        const { data, error } = await supabase
          .from('company_info')
          .insert([{
            user_id: profile?.id,
            [field]: value
          }])
          .select()
          .single()

        if (error) throw error
        setCompanyInfo(data as CompanyInfo)
      }

      toast({ title: 'Dados da empresa salvos com sucesso' })

    } catch (error: any) {
      toast({
        title: 'Erro ao salvar dados da empresa',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Função para criar nova conta bancária
  const createAccount = async () => {
    if (!accountForm.name) {
      toast({
        title: 'Campo obrigatório',
        description: 'Nome da conta é obrigatório',
        variant: 'destructive'
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .insert([{
          name: accountForm.name,
          opening_balance: accountForm.opening_balance,
          created_by: user?.id
        }])
        .select()
        .single()

      if (error) throw error

      setAccounts(prev => [...prev, data as FinanceAccount])
      setAccountForm({ name: '', bank: '', agency: '', account: '', type: 'checking', opening_balance: 0 })
      setIsNewAccountOpen(false)

      toast({ title: 'Conta bancária criada com sucesso' })

    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta bancária',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Função para criar nova categoria
  const createCategory = async () => {
    if (!categoryForm.name) {
      toast({
        title: 'Campo obrigatório',
        description: 'Nome da categoria é obrigatório',
        variant: 'destructive'
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: categoryForm.name,
          type: categoryForm.type,
          color: categoryForm.color,
          icon: categoryForm.icon,
          created_by: user?.id
        }])
        .select()
        .single()

      if (error) throw error

      setCategories(prev => [...prev, data as Category])
      setCategoryForm({ name: '', type: 'income', color: '#3b82f6', icon: 'folder' })
      setIsNewCategoryOpen(false)

      toast({ title: 'Categoria criada com sucesso' })

    } catch (error: any) {
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Função para excluir conta bancária
  const deleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('finance_accounts')
        .delete()
        .eq('id', accountId)

      if (error) throw error

      setAccounts(prev => prev.filter(acc => acc.id !== accountId))
      toast({ title: 'Conta bancária excluída com sucesso' })

    } catch (error: any) {
      toast({
        title: 'Erro ao excluir conta bancária',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Função para excluir categoria
  const deleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      setCategories(prev => prev.filter(cat => cat.id !== categoryId))
      toast({ title: 'Categoria excluída com sucesso' })

    } catch (error: any) {
      toast({
        title: 'Erro ao excluir categoria',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Função para buscar CEP
  const fetchCEP = async (cep: string) => {
    try {
      const cleanCEP = cep.replace(/\D/g, '')
      if (cleanCEP.length !== 8) return

      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast({
          title: 'CEP não encontrado',
          variant: 'destructive'
        })
        return
      }

      // Atualizar múltiplos campos
      const updates = {
        endereco: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf
      }

      if (companyInfo) {
        const { error } = await supabase
          .from('company_info')
          .update(updates)
          .eq('user_id', profile?.id)

        if (error) throw error
        setCompanyInfo(prev => prev ? { ...prev, ...updates } : null)
      } else {
        const { data: newData, error } = await supabase
          .from('company_info')
          .insert([{
            user_id: profile?.id,
            cep: cleanCEP,
            ...updates
          }])
          .select()
          .single()

        if (error) throw error
        setCompanyInfo(newData as CompanyInfo)
      }

      toast({ title: 'Endereço preenchido automaticamente' })

    } catch (error: any) {
      toast({
        title: 'Erro ao buscar CEP',
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
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="avatar-upload"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file || !profile?.id) return

                          try {
                            // Upload para Supabase Storage
                            const fileExt = file.name.split('.').pop()
                            const fileName = `${profile.id}.${fileExt}`

                            const { error: uploadError } = await supabase.storage
                              .from('avatars')
                              .upload(fileName, file, { upsert: true })

                            if (uploadError) throw uploadError

                            // Obter URL pública
                            const { data: { publicUrl } } = supabase.storage
                              .from('avatars')
                              .getPublicUrl(fileName)

                            // Atualizar perfil
                            const { error: updateError } = await supabase
                              .from('profiles')
                              .update({ avatar_url: publicUrl })
                              .eq('id', profile.id)

                            if (updateError) throw updateError

                            toast({ title: 'Foto atualizada com sucesso!' })
                            window.location.reload() // Recarregar para mostrar nova foto

                          } catch (error: any) {
                            toast({
                              title: 'Erro ao atualizar foto',
                              description: error.message,
                              variant: 'destructive'
                            })
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Alterar Foto
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium">Nome Completo</label>
                      <Input
                        value={profile?.first_name || ''}
                        onChange={async (e) => {
                          const value = e.target.value
                          try {
                            const { error } = await supabase
                              .from('profiles')
                              .update({ first_name: value })
                              .eq('id', profile?.id)

                            if (error) throw error
                            toast({ title: 'Nome atualizado com sucesso!' })
                          } catch (error: any) {
                            toast({
                              title: 'Erro ao atualizar nome',
                              description: error.message,
                              variant: 'destructive'
                            })
                          }
                        }}
                        placeholder="Digite seu nome completo"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input value={profile?.email || ''} readOnly className="bg-muted" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Para alterar o email, entre em contato com o suporte
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Telefone</label>
                      <Input
                        value={profile?.phone || ''}
                        onChange={async (e) => {
                          const value = e.target.value
                          try {
                            const { error } = await supabase
                              .from('profiles')
                              .update({ phone: value })
                              .eq('id', profile?.id)

                            if (error) throw error
                            toast({ title: 'Telefone atualizado com sucesso!' })
                          } catch (error: any) {
                            toast({
                              title: 'Erro ao atualizar telefone',
                              description: error.message,
                              variant: 'destructive'
                            })
                          }
                        }}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Cargo/Função</label>
                      <Input
                        value={profile?.role || ''}
                        onChange={async (e) => {
                          const value = e.target.value
                          try {
                            const { error } = await supabase
                              .from('profiles')
                              .update({ role: value })
                              .eq('id', profile?.id)

                            if (error) throw error
                            toast({ title: 'Cargo atualizado com sucesso!' })
                          } catch (error: any) {
                            toast({
                              title: 'Erro ao atualizar cargo',
                              description: error.message,
                              variant: 'destructive'
                            })
                          }
                        }}
                        placeholder="Ex: Contador, Gerente Financeiro"
                      />
                    </div>
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

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium">Autenticação de Dois Fatores (2FA)</p>
                        <p className="text-xs text-muted-foreground">
                          Adicione uma camada extra de segurança à sua conta
                        </p>
                      </div>
                      <Switch
                        checked={profile?.two_factor_enabled || false}
                        onCheckedChange={async (checked) => {
                          try {
                            const { error } = await supabase
                              .from('profiles')
                              .update({ two_factor_enabled: checked })
                              .eq('id', profile?.id)

                            if (error) throw error

                            toast({
                              title: checked ? '2FA ativado!' : '2FA desativado!',
                              description: checked
                                ? 'Sua conta agora está mais segura'
                                : 'Recomendamos manter o 2FA ativado'
                            })
                          } catch (error: any) {
                            toast({
                              title: 'Erro ao alterar 2FA',
                              description: error.message,
                              variant: 'destructive'
                            })
                          }
                        }}
                      />
                    </div>
                    {profile?.two_factor_enabled && (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        2FA está ativo e protegendo sua conta
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-3">Sessões Ativas</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Globe className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Sessão Atual</p>
                            <p className="text-xs text-muted-foreground">
                              {navigator.userAgent.includes('Chrome') ? 'Chrome' :
                               navigator.userAgent.includes('Firefox') ? 'Firefox' :
                               navigator.userAgent.includes('Safari') ? 'Safari' : 'Navegador'} -
                              {Intl.DateTimeFormat().resolvedOptions().timeZone}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Último acesso: {new Date().toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Ativa
                        </Badge>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={async () => {
                        if (confirm('Tem certeza que deseja encerrar todas as outras sessões?')) {
                          try {
                            await supabase.auth.signOut({ scope: 'others' })
                            toast({ title: 'Outras sessões encerradas com sucesso!' })
                          } catch (error: any) {
                            toast({
                              title: 'Erro ao encerrar sessões',
                              description: error.message,
                              variant: 'destructive'
                            })
                          }
                        }
                      }}
                    >
                      Encerrar Outras Sessões
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Informações de Segurança</p>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Conta criada em:</span>
                        <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Último login:</span>
                        <span>{profile?.last_sign_in_at ? new Date(profile.last_sign_in_at).toLocaleString('pt-BR') : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email verificado:</span>
                        <span className={profile?.email_verified ? 'text-green-600' : 'text-orange-600'}>
                          {profile?.email_verified ? '✓ Verificado' : '⚠ Não verificado'}
                        </span>
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
              {/* Dados Básicos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Dados Básicos da Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                      {companyInfo?.logo_url ? (
                        <img
                          src={companyInfo.logo_url}
                          alt="Logo da empresa"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="logo-upload"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file || !profile?.id) return

                          try {
                            const fileExt = file.name.split('.').pop()
                            const fileName = `${profile.id}/logo.${fileExt}`

                            const { error: uploadError } = await supabase.storage
                              .from('company-logos')
                              .upload(fileName, file, { upsert: true })

                            if (uploadError) throw uploadError

                            const { data: { publicUrl } } = supabase.storage
                              .from('company-logos')
                              .getPublicUrl(fileName)

                            await saveCompanyInfo('logo_url', publicUrl)
                            toast({ title: 'Logo atualizado com sucesso!' })

                          } catch (error: any) {
                            toast({
                              title: 'Erro ao atualizar logo',
                              description: error.message,
                              variant: 'destructive'
                            })
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium">Razão Social *</label>
                      <Input
                        value={companyInfo?.razao_social || ''}
                        onChange={(e) => saveCompanyInfo('razao_social', e.target.value)}
                        placeholder="Nome completo da empresa"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nome Fantasia</label>
                      <Input
                        value={companyInfo?.nome_fantasia || ''}
                        onChange={(e) => saveCompanyInfo('nome_fantasia', e.target.value)}
                        placeholder="Nome comercial da empresa"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">CNPJ *</label>
                      <Input
                        value={companyInfo?.cnpj || ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '')
                          value = value.replace(/^(\d{2})(\d)/, '$1.$2')
                          value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                          value = value.replace(/\.(\d{3})(\d)/, '.$1/$2')
                          value = value.replace(/(\d{4})(\d)/, '$1-$2')
                          saveCompanyInfo('cnpj', value)
                        }}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Atividade Principal</label>
                      <Input
                        value={companyInfo?.atividade_principal || ''}
                        onChange={(e) => saveCompanyInfo('atividade_principal', e.target.value)}
                        placeholder="Ex: Serviços de contabilidade"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">Capital Social</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={companyInfo?.capital_social || ''}
                          onChange={(e) => saveCompanyInfo('capital_social', parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Data de Abertura</label>
                        <Input
                          type="date"
                          value={companyInfo?.data_abertura || ''}
                          onChange={(e) => saveCompanyInfo('data_abertura', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Endereço */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço da Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-sm font-medium">CEP *</label>
                      <Input
                        value={companyInfo?.cep || ''}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '')
                          value = value.replace(/^(\d{5})(\d)/, '$1-$2')
                          saveCompanyInfo('cep', value)
                        }}
                        onBlur={(e) => {
                          const cep = e.target.value.replace(/\D/g, '')
                          if (cep.length === 8) {
                            fetchCEP(cep)
                          }
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Estado</label>
                      <Input
                        value={companyInfo?.estado || ''}
                        onChange={(e) => saveCompanyInfo('estado', e.target.value.toUpperCase())}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Endereço *</label>
                    <Input
                      value={companyInfo?.endereco || ''}
                      onChange={(e) => saveCompanyInfo('endereco', e.target.value)}
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-sm font-medium">Número</label>
                      <Input
                        value={companyInfo?.numero || ''}
                        onChange={(e) => saveCompanyInfo('numero', e.target.value)}
                        placeholder="123"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Complemento</label>
                      <Input
                        value={companyInfo?.complemento || ''}
                        onChange={(e) => saveCompanyInfo('complemento', e.target.value)}
                        placeholder="Sala, Andar, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Bairro</label>
                      <Input
                        value={companyInfo?.bairro || ''}
                        onChange={(e) => saveCompanyInfo('bairro', e.target.value)}
                        placeholder="Centro"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Cidade</label>
                      <Input
                        value={companyInfo?.cidade || ''}
                        onChange={(e) => saveCompanyInfo('cidade', e.target.value)}
                        placeholder="São Paulo"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contatos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contatos da Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Telefone Principal</label>
                    <Input
                      value={companyInfo?.telefone || ''}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '')
                        value = value.replace(/^(\d{2})(\d)/, '($1) $2')
                        value = value.replace(/(\d{5})(\d)/, '$1-$2')
                        saveCompanyInfo('telefone', value)
                      }}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email Corporativo</label>
                    <Input
                      type="email"
                      value={companyInfo?.email_corporativo || ''}
                      onChange={(e) => saveCompanyInfo('email_corporativo', e.target.value)}
                      placeholder="contato@empresa.com.br"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Website</label>
                    <Input
                      value={companyInfo?.website || ''}
                      onChange={(e) => saveCompanyInfo('website', e.target.value)}
                      placeholder="https://www.empresa.com.br"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Dados Fiscais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Dados Fiscais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Regime Tributário</label>
                    <Select
                      value={companyInfo?.regime_tributario || 'simples_nacional'}
                      onValueChange={(value) => saveCompanyInfo('regime_tributario', value)}
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
                    <Input
                      value={companyInfo?.inscricao_estadual || ''}
                      onChange={(e) => saveCompanyInfo('inscricao_estadual', e.target.value)}
                      placeholder="000.000.000.000"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Inscrição Municipal</label>
                    <Input
                      value={companyInfo?.inscricao_municipal || ''}
                      onChange={(e) => saveCompanyInfo('inscricao_municipal', e.target.value)}
                      placeholder="00000000-0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Dados Bancários */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Dados Bancários
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Banco Principal</label>
                    <Input
                      value={companyInfo?.banco_principal || ''}
                      onChange={(e) => saveCompanyInfo('banco_principal', e.target.value)}
                      placeholder="Ex: Banco do Brasil, Itaú, Bradesco"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Agência</label>
                      <Input
                        value={companyInfo?.agencia || ''}
                        onChange={(e) => saveCompanyInfo('agencia', e.target.value)}
                        placeholder="0000"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Conta</label>
                      <Input
                        value={companyInfo?.conta || ''}
                        onChange={(e) => saveCompanyInfo('conta', e.target.value)}
                        placeholder="00000-0"
                      />
                    </div>
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteAccount(account.id)}
                              >
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
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteCategory(category.id)}
                              >
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
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteCategory(category.id)}
                              >
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
            {!isUserAdmin ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
                  <p className="text-muted-foreground text-center">
                    Apenas administradores podem gerenciar usuários da empresa.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm text-muted-foreground">Total de Usuários</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">
                      {loading ? <Skeleton className="h-8 w-16" /> : companyUsers.length}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm text-muted-foreground">Usuários Ativos</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold text-green-600">
                      {loading ? <Skeleton className="h-8 w-16" /> : companyUsers.filter(u => u.is_active).length}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm text-muted-foreground">Administradores</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold text-blue-600">
                      {loading ? <Skeleton className="h-8 w-16" /> : companyUsers.filter(u => u.role === 'administrador').length}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm text-muted-foreground">Convites Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold text-orange-600">
                      {loading ? <Skeleton className="h-8 w-16" /> : userInvitations.length}
                    </CardContent>
                  </Card>
                </div>

                {/* Tabela de Usuários */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Usuários da Empresa
                    </CardTitle>
                    <Button onClick={() => setIsAddUserOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Convidar Usuário
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ingressou em</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            </TableRow>
                          ))
                        ) : companyUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Nenhum usuário encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          companyUsers.map(companyUser => (
                            <TableRow key={companyUser.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                    {companyUser.profiles?.first_name?.[0] || companyUser.profiles?.email?.[0] || '?'}
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {companyUser.profiles?.first_name || 'Nome não informado'}
                                      {companyUser.profiles?.last_name && ` ${companyUser.profiles.last_name}`}
                                    </div>
                                    {companyUser.profiles?.phone && (
                                      <div className="text-xs text-muted-foreground">
                                        {companyUser.profiles.phone}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{companyUser.profiles?.email}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  companyUser.role === 'administrador' ? 'default' :
                                  companyUser.role === 'contador' ? 'secondary' :
                                  companyUser.role === 'usuario' ? 'outline' : 'destructive'
                                }>
                                  {companyUser.role === 'administrador' ? 'Admin' :
                                   companyUser.role === 'contador' ? 'Contador' :
                                   companyUser.role === 'usuario' ? 'Usuário' : 'Visualizador'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={companyUser.is_active ? 'default' : 'secondary'}>
                                  {companyUser.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {companyUser.joined_at
                                  ? new Date(companyUser.joined_at).toLocaleDateString('pt-BR')
                                  : 'Pendente'
                                }
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingUser(companyUser)
                                      setUserForm({
                                        first_name: companyUser.profiles?.first_name || '',
                                        last_name: companyUser.profiles?.last_name || '',
                                        email: companyUser.profiles?.email || '',
                                        role: companyUser.role
                                      })
                                      setIsEditUserOpen(true)
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => toggleUserStatus(companyUser)}
                                  >
                                    {companyUser.is_active ? (
                                      <Eye className="h-3 w-3" />
                                    ) : (
                                      <CheckCircle className="h-3 w-3" />
                                    )}
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

                {/* Convites Pendentes */}
                {userInvitations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Convites Pendentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Convidado por</TableHead>
                            <TableHead>Enviado em</TableHead>
                            <TableHead>Expira em</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userInvitations.map(invitation => (
                            <TableRow key={invitation.id}>
                              <TableCell className="font-medium">{invitation.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {invitation.role === 'administrador' ? 'Admin' :
                                   invitation.role === 'contador' ? 'Contador' :
                                   invitation.role === 'usuario' ? 'Usuário' : 'Visualizador'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {companyUsers.find(u => u.user_id === invitation.invited_by)?.profiles?.first_name || 'Admin'}
                              </TableCell>
                              <TableCell>
                                {new Date(invitation.created_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <span className={new Date(invitation.expires_at) < new Date() ? 'text-red-600' : 'text-muted-foreground'}>
                                  {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Logs de Auditoria */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Log de Atividades
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead>Detalhes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            </TableRow>
                          ))
                        ) : userAuditLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Nenhuma atividade registrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          userAuditLogs.slice(0, 10).map(log => (
                            <TableRow key={log.id}>
                              <TableCell>
                                {new Date(log.created_at).toLocaleString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                {companyUsers.find(u => u.user_id === log.performed_by)?.profiles?.first_name || 'Sistema'}
                              </TableCell>
                              <TableCell>{log.action}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {log.details?.email && `Email: ${log.details.email}`}
                                {log.details?.name && ` | Nome: ${log.details.name}`}
                                {log.details?.role && ` | Role: ${log.details.role}`}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
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
                <Button onClick={createAccount}>
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
                <Button onClick={createCategory}>
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

        {/* Modal Alterar Senha */}
        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Alterar Senha
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Senha Atual</label>
                <Input
                  type="password"
                  placeholder="Digite sua senha atual"
                  id="current-password"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nova Senha</label>
                <Input
                  type="password"
                  placeholder="Digite a nova senha"
                  id="new-password"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mínimo 8 caracteres, incluindo letras e números
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Confirmar Nova Senha</label>
                <Input
                  type="password"
                  placeholder="Confirme a nova senha"
                  id="confirm-password"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsChangePasswordOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  const currentPassword = (document.getElementById('current-password') as HTMLInputElement)?.value
                  const newPassword = (document.getElementById('new-password') as HTMLInputElement)?.value
                  const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement)?.value

                  if (!currentPassword || !newPassword || !confirmPassword) {
                    toast({
                      title: 'Erro',
                      description: 'Preencha todos os campos',
                      variant: 'destructive'
                    })
                    return
                  }

                  if (newPassword !== confirmPassword) {
                    toast({
                      title: 'Erro',
                      description: 'As senhas não coincidem',
                      variant: 'destructive'
                    })
                    return
                  }

                  if (newPassword.length < 8) {
                    toast({
                      title: 'Erro',
                      description: 'A senha deve ter pelo menos 8 caracteres',
                      variant: 'destructive'
                    })
                    return
                  }

                  try {
                    // Verificar senha atual fazendo login
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                      email: profile?.email || '',
                      password: currentPassword
                    })

                    if (signInError) {
                      toast({
                        title: 'Erro',
                        description: 'Senha atual incorreta',
                        variant: 'destructive'
                      })
                      return
                    }

                    // Atualizar senha
                    const { error: updateError } = await supabase.auth.updateUser({
                      password: newPassword
                    })

                    if (updateError) throw updateError

                    toast({
                      title: 'Senha alterada com sucesso!',
                      description: 'Sua senha foi atualizada'
                    })

                    setIsChangePasswordOpen(false)

                    // Limpar campos
                    ;(document.getElementById('current-password') as HTMLInputElement).value = ''
                    ;(document.getElementById('new-password') as HTMLInputElement).value = ''
                    ;(document.getElementById('confirm-password') as HTMLInputElement).value = ''

                  } catch (error: any) {
                    toast({
                      title: 'Erro ao alterar senha',
                      description: error.message,
                      variant: 'destructive'
                    })
                  }
                }}
              >
                <Key className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Adicionar Usuário */}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Convidar Usuário
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={userForm.first_name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sobrenome</label>
                <Input
                  value={userForm.last_name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Sobrenome do usuário"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={userForm.role}
                  onValueChange={(value: UserRole) => setUserForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="contador">Contador</SelectItem>
                    <SelectItem value="usuario">Usuário</SelectItem>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {userForm.role === 'administrador' && 'Acesso total ao sistema'}
                  {userForm.role === 'contador' && 'Acesso a relatórios e dados fiscais'}
                  {userForm.role === 'usuario' && 'Acesso padrão às funcionalidades'}
                  {userForm.role === 'visualizador' && 'Apenas visualização de dados'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddUserOpen(false)
                  setUserForm({
                    first_name: '',
                    last_name: '',
                    email: '',
                    role: 'usuario'
                  })
                }}
              >
                Cancelar
              </Button>
              <Button onClick={addUser}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Convite
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Editar Usuário */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Editar Usuário
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={userForm.first_name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sobrenome</label>
                <Input
                  value={userForm.last_name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Sobrenome do usuário"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={userForm.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O email não pode ser alterado
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={userForm.role}
                  onValueChange={(value: UserRole) => setUserForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="contador">Contador</SelectItem>
                    <SelectItem value="usuario">Usuário</SelectItem>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditUserOpen(false)
                  setEditingUser(null)
                  setUserForm({
                    first_name: '',
                    last_name: '',
                    email: '',
                    role: 'usuario'
                  })
                }}
              >
                Cancelar
              </Button>
              <Button onClick={updateUser}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

export default Configuracoes
