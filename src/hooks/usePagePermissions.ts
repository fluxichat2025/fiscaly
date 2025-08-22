import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export type PermissionLevel = 'none' | 'view' | 'edit'

export type PagePermission = {
  page_key: string
  permission: PermissionLevel
}

export type PagePermissions = Record<string, PermissionLevel>

// Mapeamento de páginas do sistema
export const APP_PAGES = [
  { key: 'dashboard', label: 'Dashboard', url: '/' },
  { key: 'notas_nfe', label: 'Emitir NFe', url: '/notas/nfe' },
  { key: 'notas_nfse', label: 'Emitir NFSe', url: '/notas/nfse' },
  { key: 'notas_consultar', label: 'Consultar Notas', url: '/notas' },
  { key: 'notas_empresas', label: 'Empresas', url: '/notas/empresas' },
  { key: 'notas_cancelar', label: 'Cancelar/Inutilizar', url: '/notas/cancelar' },
  { key: 'financeiro_fluxo_caixa', label: 'Fluxo de Caixa', url: '/financeiro/fluxo-caixa' },
  { key: 'financeiro_recebimentos', label: 'Recebimentos', url: '/financeiro/recebimentos' },
  { key: 'financeiro_relatorios', label: 'Relatórios Financeiros', url: '/financeiro/relatorios' },
  { key: 'financeiro_contas_pagar', label: 'Contas a Pagar', url: '/financeiro/contas-pagar' },
  { key: 'financeiro_conciliacao', label: 'Conciliação Bancária', url: '/financeiro/conciliacao' },
  { key: 'imposto_renda', label: 'Imposto de Renda', url: '/imposto-renda' },
  { key: 'relatorios', label: 'Relatórios', url: '/relatorios' },
  { key: 'tarefas', label: 'Tarefas', url: '/tarefas' },
  { key: 'configuracoes', label: 'Configurações', url: '/configuracoes' },
] as const

export const usePagePermissions = () => {
  const { user, profile } = useAuth()
  const [permissions, setPermissions] = useState<PagePermissions>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para carregar permissões do usuário
  const loadPermissions = useCallback(async () => {
    if (!user?.id || !profile?.user_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Verificar se é admin global
      const isGlobalAdmin = profile.user_type === 'admin' || profile.role === 'admin'
      
      if (isGlobalAdmin) {
        // Admin global tem acesso total a tudo
        const adminPermissions: PagePermissions = {}
        APP_PAGES.forEach(page => {
          adminPermissions[page.key] = 'edit'
        })
        setPermissions(adminPermissions)
        setLoading(false)
        return
      }

      // Buscar empresa ativa do usuário
      const { data: userCompany, error: companyError } = await (supabase as any)
        .from('user_companies')
        .select('company_id, role, is_active')
        .eq('user_id', profile.user_id)
        .eq('is_active', true)
        .single()

      if (companyError || !userCompany) {
        console.warn('Usuário sem empresa ativa:', companyError)
        // Usuário sem empresa = sem permissões
        const noPermissions: PagePermissions = {}
        APP_PAGES.forEach(page => {
          noPermissions[page.key] = 'none'
        })
        setPermissions(noPermissions)
        setLoading(false)
        return
      }

      // Verificar se é admin da empresa
      const isCompanyAdmin = userCompany.role === 'administrador'
      
      if (isCompanyAdmin) {
        // Admin da empresa tem acesso total
        const adminPermissions: PagePermissions = {}
        APP_PAGES.forEach(page => {
          adminPermissions[page.key] = 'edit'
        })
        setPermissions(adminPermissions)
        setLoading(false)
        return
      }

      // Carregar permissões específicas do usuário
      const { data: userPermissions, error: permissionsError } = await (supabase as any)
        .from('user_page_permissions')
        .select('page_key, permission')
        .eq('company_id', userCompany.company_id)
        .eq('user_id', profile.user_id)

      if (permissionsError) {
        throw new Error(`Erro ao carregar permissões: ${permissionsError.message}`)
      }

      // Montar objeto de permissões
      const userPagePermissions: PagePermissions = {}
      
      // Inicializar todas as páginas com 'none'
      APP_PAGES.forEach(page => {
        userPagePermissions[page.key] = 'none'
      })

      // Aplicar permissões específicas
      if (userPermissions) {
        userPermissions.forEach((perm: any) => {
          userPagePermissions[perm.page_key] = perm.permission
        })
      }

      setPermissions(userPagePermissions)

    } catch (err: any) {
      console.error('Erro ao carregar permissões:', err)
      setError(err.message)
      
      // Em caso de erro, negar acesso a tudo
      const noPermissions: PagePermissions = {}
      APP_PAGES.forEach(page => {
        noPermissions[page.key] = 'none'
      })
      setPermissions(noPermissions)
    } finally {
      setLoading(false)
    }
  }, [user?.id, profile?.user_id, profile?.user_type, profile?.role])

  // Carregar permissões quando o usuário mudar
  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  // Função para verificar se tem permissão para uma página
  const hasPermission = useCallback((pageKey: string, requiredLevel: PermissionLevel = 'view'): boolean => {
    const userPermission = permissions[pageKey] || 'none'
    
    if (requiredLevel === 'view') {
      return userPermission === 'view' || userPermission === 'edit'
    }
    
    if (requiredLevel === 'edit') {
      return userPermission === 'edit'
    }
    
    return userPermission !== 'none'
  }, [permissions])

  // Função para verificar se pode visualizar uma página
  const canView = useCallback((pageKey: string): boolean => {
    return hasPermission(pageKey, 'view')
  }, [hasPermission])

  // Função para verificar se pode editar uma página
  const canEdit = useCallback((pageKey: string): boolean => {
    return hasPermission(pageKey, 'edit')
  }, [hasPermission])

  // Função para obter o nível de permissão de uma página
  const getPermissionLevel = useCallback((pageKey: string): PermissionLevel => {
    return permissions[pageKey] || 'none'
  }, [permissions])

  // Função para recarregar permissões
  const refreshPermissions = useCallback(() => {
    loadPermissions()
  }, [loadPermissions])

  return {
    permissions,
    loading,
    error,
    hasPermission,
    canView,
    canEdit,
    getPermissionLevel,
    refreshPermissions
  }
}
