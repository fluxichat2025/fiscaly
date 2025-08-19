import { useState, useEffect, useMemo } from 'react'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  FileText,
  Calendar,
  Building2,
  DollarSign,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

interface NFSeData {
  id: string
  referencia_rps: string
  referencia_nfse?: string
  numero_nfse?: string
  status: string
  status_processamento: string
  data_emissao: string
  valor_dos_servicos: number
  valor_liquido_nfse: number
  cpf_cnpj_prestador: string
  cpf_cnpj_tomador: string
  nome_tomador: string
  discriminacao: string
  url?: string
  url_danfse?: string
  empresa_id: string
  created_at: string
}

interface Company {
  id: string
  name: string
  cnpj: string
}

const ConsultarNotasGeral = () => {
  const { profile } = useAuth()
  const { toast } = useToast()

  // Estados principais
  const [notas, setNotas] = useState<NFSeData[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de filtros
  const [filters, setFilters] = useState({
    search: '',
    empresa_id: 'all',
    status: 'all',
    data_inicio: '',
    data_fim: '',
    valor_min: '',
    valor_max: ''
  })

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      // Carregar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, cnpj')
        .order('name')

      if (companiesError) throw companiesError
      setCompanies(companiesData || [])

      // Carregar notas emitidas
      const { data: notasData, error: notasError } = await supabase
        .from('nfse_emitidas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (notasError) throw notasError
      setNotas(notasData || [])

      console.log('📄 Notas carregadas:', notasData?.length || 0)

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

  // Filtrar notas
  const filteredNotas = useMemo(() => {
    return notas.filter(nota => {
      // Filtro de busca (referência, número, tomador, CNPJ/CPF)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchableText = `
          ${nota.referencia_rps || ''} 
          ${nota.referencia_nfse || ''} 
          ${nota.numero_nfse || ''} 
          ${nota.nome_tomador || ''} 
          ${nota.cpf_cnpj_tomador || ''} 
          ${nota.cpf_cnpj_prestador || ''}
        `.toLowerCase()
        
        if (!searchableText.includes(searchLower)) return false
      }

      // Filtro de empresa
      if (filters.empresa_id !== 'all' && nota.empresa_id !== filters.empresa_id) {
        return false
      }

      // Filtro de status
      if (filters.status !== 'all' && nota.status_processamento !== filters.status) {
        return false
      }

      // Filtro de data
      if (filters.data_inicio) {
        const dataEmissao = new Date(nota.data_emissao)
        const dataInicio = new Date(filters.data_inicio)
        if (dataEmissao < dataInicio) return false
      }

      if (filters.data_fim) {
        const dataEmissao = new Date(nota.data_emissao)
        const dataFim = new Date(filters.data_fim)
        if (dataEmissao > dataFim) return false
      }

      // Filtro de valor
      if (filters.valor_min) {
        const valorMin = parseFloat(filters.valor_min)
        if (nota.valor_liquido_nfse < valorMin) return false
      }

      if (filters.valor_max) {
        const valorMax = parseFloat(filters.valor_max)
        if (nota.valor_liquido_nfse > valorMax) return false
      }

      return true
    })
  }, [notas, filters])

  // Paginação
  const paginatedNotas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredNotas.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredNotas, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredNotas.length / itemsPerPage)

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      search: '',
      empresa_id: 'all',
      status: 'all',
      data_inicio: '',
      data_fim: '',
      valor_min: '',
      valor_max: ''
    })
    setCurrentPage(1)
  }

  // Exportar dados
  const exportData = () => {
    const csvContent = [
      ['Referência', 'Número NFSe', 'Data Emissão', 'Status', 'Tomador', 'CNPJ/CPF', 'Valor', 'Discriminação'].join(','),
      ...filteredNotas.map(nota => [
        nota.referencia_rps || '',
        nota.numero_nfse || '',
        new Date(nota.data_emissao).toLocaleDateString('pt-BR'),
        nota.status_processamento || '',
        nota.nome_tomador || '',
        nota.cpf_cnpj_tomador || '',
        nota.valor_liquido_nfse.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        `"${nota.discriminacao || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `notas-fiscais-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Status badge
  const getStatusBadge = (status: string) => {
    const colors = {
      'autorizado': 'bg-green-100 text-green-800',
      'processando': 'bg-yellow-100 text-yellow-800',
      'cancelada': 'bg-red-100 text-red-800',
      'erro': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Consultar Notas Fiscais</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todas as notas fiscais emitidas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadInitialData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total de Notas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {loading ? <Skeleton className="h-8 w-16" /> : filteredNotas.length}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                filteredNotas.reduce((sum, nota) => sum + nota.valor_liquido_nfse, 0)
                  .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {loading ? <Skeleton className="h-8 w-12" /> : companies.length}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                filteredNotas.filter(nota => {
                  const dataEmissao = new Date(nota.data_emissao)
                  const hoje = new Date()
                  return dataEmissao.getMonth() === hoje.getMonth() && 
                         dataEmissao.getFullYear() === hoje.getFullYear()
                }).length
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Buscar por referência, número, tomador, CNPJ/CPF..."
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full"
                />
              </div>

              <Select value={filters.empresa_id} onValueChange={value => 
                setFilters(prev => ({ ...prev, empresa_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={value => 
                setFilters(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="autorizado">Autorizado</SelectItem>
                  <SelectItem value="processando">Processando</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Data início"
                value={filters.data_inicio}
                onChange={e => setFilters(prev => ({ ...prev, data_inicio: e.target.value }))}
              />

              <Input
                type="date"
                placeholder="Data fim"
                value={filters.data_fim}
                onChange={e => setFilters(prev => ({ ...prev, data_fim: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-4 mt-4">
              <Input
                type="number"
                placeholder="Valor mínimo"
                value={filters.valor_min}
                onChange={e => setFilters(prev => ({ ...prev, valor_min: e.target.value }))}
                className="w-32"
              />
              <Input
                type="number"
                placeholder="Valor máximo"
                value={filters.valor_max}
                onChange={e => setFilters(prev => ({ ...prev, valor_max: e.target.value }))}
                className="w-32"
              />
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Notas */}
        <Card>
          <CardHeader>
            <CardTitle>
              Notas Fiscais ({filteredNotas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Número NFSe</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tomador</TableHead>
                    <TableHead>CNPJ/CPF</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Ações</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : paginatedNotas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">Nenhuma nota fiscal encontrada</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedNotas.map(nota => (
                      <TableRow key={nota.id}>
                        <TableCell className="font-medium">
                          {nota.referencia_rps}
                        </TableCell>
                        <TableCell>
                          {nota.numero_nfse || '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(nota.data_emissao).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(nota.status_processamento)}>
                            {nota.status_processamento}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-32 truncate" title={nota.nome_tomador}>
                            {nota.nome_tomador || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {nota.cpf_cnpj_tomador || '-'}
                        </TableCell>
                        <TableCell>
                          {nota.valor_liquido_nfse.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {nota.url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={nota.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                            {nota.url_danfse && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={nota.url_danfse} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredNotas.length)} de {filteredNotas.length} notas
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
      </div>
    </Layout>
  )
}

export default ConsultarNotasGeral
