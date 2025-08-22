import React from 'react'
import { Navigate } from 'react-router-dom'
import { usePagePermissions, PermissionLevel } from '@/hooks/usePagePermissions'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProtectedRouteProps {
  children: React.ReactNode
  pageKey: string
  requiredPermission?: PermissionLevel
  fallbackPath?: string
  // Manter compatibilidade com o código existente
  adminOnly?: boolean
}

const AccessDeniedPage: React.FC<{
  pageKey: string,
  requiredPermission: PermissionLevel,
  onGoBack: () => void
}> = ({ pageKey, requiredPermission, onGoBack }) => {
  const permissionText = {
    'view': 'visualizar',
    'edit': 'editar',
    'none': 'acessar'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-red-100 p-3 mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso Negado
          </h1>

          <p className="text-gray-600 mb-6">
            Você não tem permissão para {permissionText[requiredPermission]} esta página.
            Entre em contato com o administrador para solicitar acesso.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 w-full">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Página: {pageKey}</p>
                <p>Permissão necessária: {permissionText[requiredPermission]}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={onGoBack}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

const LoadingPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Verificando permissões...</p>
      </CardContent>
    </Card>
  </div>
)

export default function ProtectedRoute({
  children,
  pageKey,
  requiredPermission = 'view',
  fallbackPath = '/',
  adminOnly = false
}: ProtectedRouteProps) {
  const { user, profile, loading: authLoading } = useAuth()
  const { hasPermission, loading: permissionsLoading } = usePagePermissions()

  // Se ainda está carregando autenticação ou permissões
  if (authLoading || permissionsLoading) {
    return <LoadingPage />
  }

  // Se não está logado, redirecionar para login
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Compatibilidade com adminOnly (modo legado)
  if (adminOnly && profile?.role !== 'admin') {
    return (
      <AccessDeniedPage
        pageKey="admin_only"
        requiredPermission="edit"
        onGoBack={() => window.history.back()}
      />
    )
  }

  // Se pageKey não foi fornecido, usar modo legado
  if (!pageKey) {
    return <>{children}</>
  }

  // Verificar se tem permissão
  const hasAccess = hasPermission(pageKey, requiredPermission)

  if (!hasAccess) {
    return (
      <AccessDeniedPage
        pageKey={pageKey}
        requiredPermission={requiredPermission}
        onGoBack={() => window.history.back()}
      />
    )
  }

  // Se tem permissão, renderizar o componente
  return <>{children}</>
}

// Hook para usar dentro de componentes para verificar permissões
export const useRoutePermission = (pageKey: string, requiredPermission: PermissionLevel = 'view') => {
  const { hasPermission, loading } = usePagePermissions()

  return {
    hasAccess: hasPermission(pageKey, requiredPermission),
    loading
  }
}