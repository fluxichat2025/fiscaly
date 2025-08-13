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
  Filter,
  Calendar as CalendarIcon,
  Check,
  Layers,
  Columns3,
  Pencil
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
type HomeTask = Tarefa & { board_id?: string; column_id?: string }

import { useAuth } from '@/hooks/useAuth';

export function AreaTarefas() {
  const [tarefas, setTarefas] = useState<HomeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [novaTarefa, setNovaTarefa] = useState<Partial<TarefaInsert>>({
    titulo: '',
    descricao: '',
    prioridade: 'media',
    status: 'pendente'
  });
  // Mapas auxiliares para exibir nome/cores
  const [boardMap, setBoardMap] = useState<Record<string, { id: string; name: string; settings?: any }>>({})
  const [columnMap, setColumnMap] = useState<Record<string, { id: string; name: string; board_id: string }>>({})
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [tarefaEditando, setTarefaEditando] = useState<Tarefa | null>(null)

  // Kanban integration
  const [boards, setBoards] = useState<Array<{ id: string; name: string }>>([])
  const [columns, setColumns] = useState<Array<{ id: string; name: string; board_id: string }>>([])
  const [selectedBoard, setSelectedBoard] = useState<string>('')
  const [selectedColumn, setSelectedColumn] = useState<string>('')

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBoardsAndTarefas();
    }
  }, [user, filtroStatus, selectedBoard]);

  const fetchBoardsAndTarefas = async () => {
    if (!user) return
    try {
      setLoading(true)
      // 1) Boards do usuário
      const { data: memberships } = await supabase
        .from('board_members')
        .select('board_id')
        .eq('user_id', user.id)
      const boardIds: string[] = (memberships || []).map((m: any) => m.board_id)
      if (boardIds.length === 0) { setBoards([]); setColumns([]); setTarefas([]); return }
      const { data: boardsData } = await supabase
        .from('boards')
        .select('id,name,settings')
        .in('id', boardIds)
        .eq('is_archived', false)
        .order('name')
      setBoards(boardsData || [])
      if (!selectedBoard && boardsData && boardsData[0]) setSelectedBoard(boardsData[0].id)

      // 2) Carregar colunas do board selecionado (apenas para o formulário)
      if (selectedBoard) {
        const { data: cols } = await supabase.from('board_columns').select('id,name,board_id').eq('board_id', selectedBoard).order('position')
        setColumns(cols || [])
      // Preenche mapas de boards/colunas para exibição
      const bmap: Record<string, { id: string; name: string; settings?: any }> = {}
      ;(boardsData || []).forEach((b:any)=> bmap[b.id] = b)
      setBoardMap(bmap)
      const { data: colsAll } = await supabase.from('board_columns').select('id,name,board_id').in('board_id', boardIds)
      const cmap: Record<string, { id: string; name: string; board_id: string }> = {}
      ;(colsAll || []).forEach((c:any)=> cmap[c.id] = c)
      setColumnMap(cmap)

      } else {
        setColumns([])
      }

      // 3) Tarefas de todos os boards
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id,board_id,column_id,title,description,priority,start_at,due_at,end_at,created_at,updated_at,created_by,is_archived,tags')
        .in('board_id', boardIds)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      const mapped: HomeTask[] = (tasks || []).map((t: any) => ({
        id: t.id,
        titulo: t.title || 'Sem título',
        descricao: t.description || '',
        status: t.end_at ? 'concluida' : (t.start_at ? 'em_andamento' : 'pendente'),
        prioridade: (t.priority as any) || 'media',
        data_criacao: t.created_at,
        data_vencimento: t.due_at || undefined,
        data_conclusao: t.end_at || undefined,
        usuario_id: t.created_by || user.id,
        created_at: t.created_at,
        updated_at: t.updated_at,
        board_id: t.board_id,
        column_id: t.column_id,
        tags: t.tags || []
      }))

      const filtered = filtroStatus === 'todas' ? mapped : mapped.filter(t => t.status === filtroStatus)
      setTarefas(filtered)

    } catch (error) {
      console.error('Erro ao buscar boards/tarefas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCriarTarefa = async () => {
    if (!user || !novaTarefa.titulo) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Título da tarefa é obrigatório' });
      return;
    }
    if (!selectedBoard || !selectedColumn) {
      toast({ variant: 'destructive', title: 'Selecione o quadro e a coluna' });
      return;
    }
    try {
      const { data, error } = await supabase.from('tasks').insert({
        board_id: selectedBoard,
        column_id: selectedColumn,
        title: novaTarefa.titulo,
        description: novaTarefa.descricao || '',
        priority: (novaTarefa.prioridade || 'media') as any,
        start_at: null,
        due_at: novaTarefa.data_vencimento || null,
        end_at: null,
        tags: [],
        progress: 0,
        is_archived: false,
        sort_order: 9999,
        created_by: user.id
      }).select('*').single()
      if (error) throw error

      toast({ title: 'Tarefa criada' })
      setIsDialogOpen(false)
      setNovaTarefa({ titulo: '', descricao: '', prioridade: 'media', status: 'pendente' })
      setSelectedColumn('')
      // Recarregar
      fetchBoardsAndTarefas()
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error)
      toast({ variant: 'destructive', title: 'Erro', description: error.message || 'Não foi possível criar a tarefa' })
    }
  }

  const handleAtualizarStatus = async (tarefaId: string, novoStatus: Tarefa['status']) => {
    try {
      // Mapeia status para campos start/end
      let patch: any = {}
      if (novoStatus === 'pendente') patch = { start_at: null, end_at: null }
      if (novoStatus === 'em_andamento') patch = { start_at: new Date().toISOString(), end_at: null }
      if (novoStatus === 'concluida') patch = { end_at: new Date().toISOString() }
      if (novoStatus === 'cancelada') patch = { is_archived: true }

      const { error } = await supabase.from('tasks').update(patch).eq('id', tarefaId)
      if (error) throw error

      // Atualiza UI local
      setTarefas(prev => prev.map(t => t.id === tarefaId ? { ...t, status: novoStatus, updated_at: new Date().toISOString(), data_conclusao: novoStatus==='concluida' ? new Date().toISOString() : t.data_conclusao } : t))
      toast({ title: 'Status atualizado' })
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast({ variant: 'destructive', title: 'Erro', description: error.message || 'Não foi possível atualizar o status' })
    }
  }

  const getStatusIcon = (status: Tarefa['status']) => {
    switch (status) {
      case 'pendente': return <Clock className="h-4 w-4" />;
      case 'em_andamento': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'concluida': return <CheckCircle className="h-4 w-4" />;
      case 'cancelada': return <XCircle className="h-4 w-4" />;


    }
  };

  const priorityPill = (p: Tarefa['prioridade']) => (
    <Badge className={`text-xs ${getPrioridadeColor(p)}`}>{p}</Badge>
  )

  const statusChip = (s: Tarefa['status']) => (
    <Badge className={`text-xs ${getStatusColor(s)}`}>{s.replace('_',' ')}</Badge>
  )

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
  // Cor da tag (busca em boards.settings.labels pelo nome/id)
  const getTagColor = (boardId?: string, tag?: string) => {
    if (!boardId || !tag) return '#94a3b8'
    const labels = boardMap[boardId]?.settings?.labels || []
    const found = labels.find((l: any) => (
      (typeof tag === 'string' && (l.name?.toLowerCase?.() === tag.toLowerCase() || l.id === tag))
    ))
    return found?.color || '#94a3b8'
  }


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
              {/* Quadro e Coluna (coleta antes de criar) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Quadro</label>
                  <Select value={selectedBoard} onValueChange={(v)=>{ setSelectedBoard(v); setSelectedColumn(''); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o quadro" />
                    </SelectTrigger>
                    <SelectContent>
                      {boards.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Coluna</label>
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.filter(c => !selectedBoard || c.board_id===selectedBoard).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
      {/* Dialog Editar Tarefa (Home) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          {tarefaEditando && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input value={tarefaEditando.titulo}
                       onChange={(e)=> setTarefaEditando({ ...tarefaEditando, titulo: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea value={tarefaEditando.descricao||''}
                          onChange={(e)=> setTarefaEditando({ ...tarefaEditando, descricao: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <Select value={tarefaEditando.prioridade}
                          onValueChange={(v)=> setTarefaEditando({ ...tarefaEditando, prioridade: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Vencimento</label>
                  <Input type="date" value={tarefaEditando.data_vencimento?.split('T')[0] || ''}
                         onChange={(e)=> setTarefaEditando({ ...tarefaEditando, data_vencimento: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=> setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={async()=>{
              if (!tarefaEditando) return
              try {
                const patch:any = {
                  title: tarefaEditando.titulo,
                  description: tarefaEditando.descricao || null,
                  priority: tarefaEditando.prioridade,
                  due_at: tarefaEditando.data_vencimento || null,
                }
                const { error } = await supabase.from('tasks').update(patch).eq('id', tarefaEditando.id)
                if (error) throw error
                toast({ title:'Tarefa atualizada' })
                setIsEditOpen(false)
                fetchBoardsAndTarefas()
              } catch (e:any) {
                toast({ variant:'destructive', title:'Erro', description: e.message })
              }
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>

      {/* Lista de Tarefas - sem barra de rolagem */}
      <div className="space-y-3">
        {tarefas.length > 0 ? (
          tarefas.map((tarefa) => (
            <Card key={tarefa.id} className="shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(tarefa.status)}
                      <h3 className="font-medium text-sm">{tarefa.titulo}</h3>
                      {statusChip(tarefa.status)}
                      {priorityPill(tarefa.prioridade)}

                      {/* Tags do Kanban como bolinhas com tooltip */}
                      {Array.isArray((tarefa as any).tags) && (tarefa as any).tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            {(tarefa as any).tags.map((tag: string, idx: number) => (
                              <Tooltip key={idx}>
                                <TooltipTrigger asChild>
                                  <span
                                    className="inline-block w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: getTagColor(tarefa.board_id, tag) }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>{tag}</TooltipContent>
                              </Tooltip>
                            ))}
                          </TooltipProvider>
                        </div>
                      )}

                      {/* Metadados compactos com ícones */}
                      {tarefa.data_vencimento && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" /> {new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}
                        </span>
                      )}

                    </div>
                    {tarefa.descricao && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{tarefa.descricao}</p>
                    )}
                  </div>
                  {/* Ações compactas apenas com ícones */}
                  <div className="flex items-center gap-2">
                    {tarefa.status !== 'concluida' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleAtualizarStatus(tarefa.id, 'concluida')}
                        title="Marcar como concluída"
                      >
                        <Check className="h-4 w-4" />
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
