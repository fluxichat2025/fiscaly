import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Tarefa, TarefaInsert } from '@/types/database';
import { 
  CheckSquare, 
  Plus, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function AreaTarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [novaTarefa, setNovaTarefa] = useState<Partial<TarefaInsert>>({
    titulo: '',
    descricao: '',
    prioridade: 'media',
    status: 'pendente'
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTarefas();
    }
  }, [user, filtroStatus]);

  const fetchTarefas = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Tentar carregar do localStorage primeiro
      const tarefasLocal = JSON.parse(localStorage.getItem('tarefas_locais') || '[]');
      
      if (tarefasLocal.length > 0) {
        let tarefasFiltradas = tarefasLocal;
        if (filtroStatus !== 'todas') {
          tarefasFiltradas = tarefasLocal.filter((t: Tarefa) => t.status === filtroStatus);
        }
        setTarefas(tarefasFiltradas);
      } else {
        // Usar dados de exemplo
        const tarefasExemplo: Tarefa[] = [
          {
            id: 'exemplo-1',
            titulo: 'Revisar NFSe do cliente ABC',
            descricao: 'Verificar se todas as NFSe foram emitidas corretamente',
            status: 'pendente',
            prioridade: 'alta',
            data_criacao: new Date().toISOString(),
            data_vencimento: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            usuario_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'exemplo-2',
            titulo: 'Preparar relatório mensal',
            descricao: 'Compilar dados fiscais do mês anterior',
            status: 'em_andamento',
            prioridade: 'media',
            data_criacao: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            data_vencimento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            usuario_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        if (filtroStatus === 'todas') {
          setTarefas(tarefasExemplo);
        } else {
          setTarefas(tarefasExemplo.filter(t => t.status === filtroStatus));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCriarTarefa = async () => {
    if (!user || !novaTarefa.titulo) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Título da tarefa é obrigatório",
      });
      return;
    }

    try {
      const novaTarefaCompleta: Tarefa = {
        id: `local-${Date.now()}`,
        titulo: novaTarefa.titulo!,
        descricao: novaTarefa.descricao || '',
        status: novaTarefa.status || 'pendente',
        prioridade: novaTarefa.prioridade || 'media',
        data_criacao: new Date().toISOString(),
        data_vencimento: novaTarefa.data_vencimento,
        usuario_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Adicionar à lista atual
      setTarefas(prev => [novaTarefaCompleta, ...prev]);

      // Salvar no localStorage
      const tarefasLocal = JSON.parse(localStorage.getItem('tarefas_locais') || '[]');
      tarefasLocal.unshift(novaTarefaCompleta);
      localStorage.setItem('tarefas_locais', JSON.stringify(tarefasLocal));

      toast({
        title: "Tarefa criada",
        description: "A tarefa foi criada com sucesso",
      });

      setIsDialogOpen(false);
      setNovaTarefa({
        titulo: '',
        descricao: '',
        prioridade: 'media',
        status: 'pendente'
      });
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar a tarefa",
      });
    }
  };

  const handleAtualizarStatus = (tarefaId: string, novoStatus: Tarefa['status']) => {
    try {
      // Atualizar na lista atual
      setTarefas(prev => prev.map(tarefa => {
        if (tarefa.id === tarefaId) {
          const tarefaAtualizada = {
            ...tarefa,
            status: novoStatus,
            updated_at: new Date().toISOString()
          };
          
          if (novoStatus === 'concluida') {
            tarefaAtualizada.data_conclusao = new Date().toISOString();
          }
          
          return tarefaAtualizada;
        }
        return tarefa;
      }));

      // Atualizar no localStorage
      const tarefasLocal = JSON.parse(localStorage.getItem('tarefas_locais') || '[]');
      const tarefasAtualizadas = tarefasLocal.map((tarefa: Tarefa) => {
        if (tarefa.id === tarefaId) {
          const tarefaAtualizada = {
            ...tarefa,
            status: novoStatus,
            updated_at: new Date().toISOString()
          };
          
          if (novoStatus === 'concluida') {
            tarefaAtualizada.data_conclusao = new Date().toISOString();
          }
          
          return tarefaAtualizada;
        }
        return tarefa;
      });
      
      localStorage.setItem('tarefas_locais', JSON.stringify(tarefasAtualizadas));

      toast({
        title: "Status atualizado",
        description: "O status da tarefa foi atualizado",
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status",
      });
    }
  };

  const getStatusIcon = (status: Tarefa['status']) => {
    switch (status) {
      case 'pendente': return <Clock className="h-4 w-4" />;
      case 'em_andamento': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'concluida': return <CheckCircle className="h-4 w-4" />;
      case 'cancelada': return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Tarefa['status']) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'em_andamento': return 'bg-blue-100 text-blue-800';
      case 'concluida': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
    }
  };

  const getPrioridadeColor = (prioridade: Tarefa['prioridade']) => {
    switch (prioridade) {
      case 'baixa': return 'bg-gray-100 text-gray-800';
      case 'media': return 'bg-blue-100 text-blue-800';
      case 'alta': return 'bg-orange-100 text-orange-800';
      case 'urgente': return 'bg-red-100 text-red-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Tarefas
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie suas atividades
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
              <DialogDescription>
                Adicione uma nova tarefa à sua lista
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input
                  value={novaTarefa.titulo || ''}
                  onChange={(e) => setNovaTarefa({...novaTarefa, titulo: e.target.value})}
                  placeholder="Digite o título da tarefa"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={novaTarefa.descricao || ''}
                  onChange={(e) => setNovaTarefa({...novaTarefa, descricao: e.target.value})}
                  placeholder="Descreva a tarefa (opcional)"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <Select 
                    value={novaTarefa.prioridade || 'media'} 
                    onValueChange={(value) => setNovaTarefa({...novaTarefa, prioridade: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Data de Vencimento</label>
                  <Input
                    type="date"
                    value={novaTarefa.data_vencimento?.split('T')[0] || ''}
                    onChange={(e) => setNovaTarefa({...novaTarefa, data_vencimento: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriarTarefa} disabled={!novaTarefa.titulo}>
                Criar Tarefa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="concluida">Concluídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {tarefas.length > 0 ? (
          tarefas.map((tarefa) => (
            <Card key={tarefa.id} className="shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(tarefa.status)}
                      <h3 className="font-medium text-sm">{tarefa.titulo}</h3>
                      <Badge className={`text-xs ${getStatusColor(tarefa.status)}`}>
                        {tarefa.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`text-xs ${getPrioridadeColor(tarefa.prioridade)}`}>
                        {tarefa.prioridade}
                      </Badge>
                    </div>
                    {tarefa.descricao && (
                      <p className="text-xs text-muted-foreground mb-2">{tarefa.descricao}</p>
                    )}
                    {tarefa.data_vencimento && (
                      <p className="text-xs text-muted-foreground">
                        Vencimento: {new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {tarefa.status === 'pendente' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAtualizarStatus(tarefa.id, 'em_andamento')}
                        className="text-xs"
                      >
                        Iniciar
                      </Button>
                    )}
                    {tarefa.status === 'em_andamento' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAtualizarStatus(tarefa.id, 'concluida')}
                        className="text-xs"
                      >
                        Concluir
                      </Button>
                    )}
                    {(tarefa.status === 'pendente' || tarefa.status === 'em_andamento') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAtualizarStatus(tarefa.id, 'cancelada')}
                        className="text-xs"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Nenhuma tarefa encontrada
              </p>
              <p className="text-sm text-muted-foreground">
                Clique em "Nova Tarefa" para começar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
