import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, FileText, Calendar, Building, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EmpresaFormFocus from '@/components/EmpresaFormFocus';
import FocusNFeDiagnostic from '@/components/FocusNFeDiagnostic';
import { useFocusNFeAPI, EmpresaListItem } from '@/hooks/useFocusNFeAPI';

export default function EmpresasFocus() {
  const {
    empresas: apiEmpresas,
    loading,
    error,
    carregarEmpresas,
    limparCache,
    deleteEmpresa
  } = useFocusNFeAPI();

  const [filteredEmpresas, setFilteredEmpresas] = useState<EmpresaListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [certificadoFilter, setCertificadoFilter] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaListItem | null>(null);
  const { toast } = useToast();

  // Carregar empresas automaticamente quando a página é acessada
  useEffect(() => {
    const carregarEmpresasInicial = async () => {
      try {
        console.log('🏢 Carregando empresas automaticamente...');
        await carregarEmpresas();
      } catch (error) {
        console.error('❌ Erro no carregamento inicial:', error);
        // Em caso de erro, tentar carregar do Supabase como fallback
        toast({
          title: "Carregando dados locais",
          description: "Usando dados do banco local como fallback",
        });
      }
    };

    carregarEmpresasInicial();
  }, []); // Executar apenas uma vez ao montar o componente

  // Filtrar empresas
  useEffect(() => {
    let filtered = apiEmpresas;

    if (searchTerm) {
      filtered = filtered.filter(empresa =>
        empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empresa.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empresa.cnpj_cpf.includes(searchTerm)
      );
    }

    if (certificadoFilter && certificadoFilter !== 'todos') {
      filtered = filtered.filter(empresa => {
        if (certificadoFilter === 'valido') {
          return empresa.certificado_status?.includes('VALIDO_ATE');
        } else if (certificadoFilter === 'vencido') {
          return empresa.certificado_status?.includes('VENCIDO_DESDE');
        }
        return true;
      });
    }

    setFilteredEmpresas(filtered);
  }, [searchTerm, certificadoFilter, apiEmpresas]);

  const handleLimparFiltros = () => {
    setSearchTerm('');
    setCertificadoFilter('');
  };

  const handleAdicionarEmpresa = () => {
    setEditingEmpresa(null);
    setIsFormOpen(true);
  };

  const handleEditarEmpresa = (empresa: EmpresaListItem) => {
    setEditingEmpresa(empresa);
    setIsFormOpen(true);
  };

  const handleExcluirEmpresa = async (empresaId: string) => {
    try {
      await deleteEmpresa(empresaId);
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
    }
  };

  const handleRefreshEmpresas = async () => {
    try {
      // Limpar cache e recarregar
      limparCache();
      await carregarEmpresas();
    } catch (error) {
      console.error('Erro ao atualizar empresas:', error);
    }
  };

  const getCertificadoBadge = (status: string | null) => {
    if (!status) return null;
    
    if (status.includes('VALIDO_ATE')) {
      const date = status.replace('VALIDO_ATE_', '');
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          <FileText className="h-3 w-3 mr-1" />
          VÁLIDO ATÉ {date}
        </Badge>
      );
    } else if (status.includes('VENCIDO_DESDE')) {
      const date = status.replace('VENCIDO_DESDE_', '');
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <Calendar className="h-3 w-3 mr-1" />
          VENCIDO DESDE {date}
        </Badge>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pesquisa de Empresas</h1>
            <p className="text-muted-foreground">
              Gerencie suas empresas cadastradas no Focus NFe
              {loading && <span className="ml-2 text-orange-600">Carregando...</span>}
              {error && <span className="ml-2 text-red-600">Erro: {error}</span>}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshEmpresas}
            disabled={loading}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              console.log('🔍 Testando API Focus NFe...');
              toast({
                title: "Testando API",
                description: "Verificando conectividade com Focus NFe...",
              });

              try {
                const TOKEN_PRODUCAO = 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';
                const auth = btoa(`${TOKEN_PRODUCAO}:`);

                const response = await fetch('/api/focusnfe/v2/empresas', {
                  method: 'GET',
                  headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                  },
                });

                console.log('Status:', response.status);

                if (response.ok) {
                  const data = await response.json();
                  console.log('✅ API funcionando:', data);
                  toast({
                    title: "API funcionando!",
                    description: `Status: ${response.status}. Empresas: ${Array.isArray(data) ? data.length : 'N/A'}`,
                  });
                } else {
                  const errorText = await response.text();
                  console.log('❌ Erro na API:', errorText);
                  toast({
                    variant: "destructive",
                    title: "Erro na API",
                    description: `Status: ${response.status}. ${errorText.substring(0, 100)}`,
                  });
                }
              } catch (error) {
                console.error('❌ Erro:', error);
                toast({
                  variant: "destructive",
                  title: "Erro de conexão",
                  description: error instanceof Error ? error.message : 'Erro desconhecido',
                });
              }
            }}
            disabled={loading}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            Testar API
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="search">Pesquisa</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nome, fantasia ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Certificado</Label>
              <Select value={certificadoFilter} onValueChange={setCertificadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os certificados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="valido">Válidos</SelectItem>
                  <SelectItem value="vencido">Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                onClick={handleLimparFiltros}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                LIMPAR FILTROS
              </Button>
              <Button
                onClick={handleLimparFiltros}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                PESQUISAR
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnóstico da API */}
      <FocusNFeDiagnostic />

      {/* Mensagem de Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm font-semibold">!</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Erro ao carregar empresas
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {error}
                </p>
                {error.includes('Limite de requisições excedido') && (
                  <p className="text-xs text-red-600 mt-2">
                    💡 Dica: O token da API Focus NFe tem limite de 100 requisições por minuto.
                    Aguarde alguns minutos e tente novamente.
                  </p>
                )}
              </div>
              <Button
                onClick={handleRefreshEmpresas}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Empresas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Empresas
          </CardTitle>
          <Button
            onClick={handleAdicionarEmpresa}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            ADICIONAR EMPRESA
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead>CNPJ/CPF</TableHead>
                  <TableHead>Última Emissão</TableHead>
                  <TableHead>Certificado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell className="font-medium">{empresa.nome}</TableCell>
                    <TableCell>{empresa.nome_fantasia}</TableCell>
                    <TableCell>{empresa.cnpj_cpf}</TableCell>
                    <TableCell>
                      {empresa.ultima_emissao || 'Não há emissão'}
                    </TableCell>
                    <TableCell>
                      {getCertificadoBadge(empresa.certificado_status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditarEmpresa(empresa)}
                          disabled={loading}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          EDITAR
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExcluirEmpresa(empresa.id)}
                          disabled={loading}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          EXCLUIR
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {loading && filteredEmpresas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
              <p>Carregando empresas...</p>
            </div>
          )}

          {!loading && filteredEmpresas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma empresa encontrada</p>
              {error && (
                <p className="text-red-600 mt-2">
                  Erro ao carregar: {error}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
          </DialogHeader>
          <EmpresaFormFocus
            empresa={editingEmpresa}
            onSuccess={() => {
              setIsFormOpen(false);
              handleRefreshEmpresas(); // Recarregar lista após sucesso
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}
