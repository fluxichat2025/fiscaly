import { useEffect, useMemo, useRef, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Filter, Loader2, Search, Layers, Users, Calendar, Archive, Tag, GripVertical, Settings } from 'lucide-react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableList, SortableRow } from '@/components/kanban/DndWrappers'
import SortableTask from '@/components/kanban/SortableTask'
import SortableColumnItem from '@/components/kanban/SortableColumnItem'
import ColumnDroppable from '@/components/kanban/ColumnDroppable'
import TemplateList from '@/components/kanban/TemplateList'
import { Switch } from '@/components/ui/switch'
import AddMemberForm from '@/components/kanban/AddMemberForm'
import MemberList from '@/components/kanban/MemberList'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Tipos simplificados para o Kanban
type UUID = string

type Board = { id: UUID; name: string; description?: string | null; is_archived: boolean; owner_id?: UUID | null }
type Column = { id: UUID; board_id: UUID; name: string; position: number; wip_limit?: number | null; color?: string | null }
type Task = {
  id: UUID
  board_id: UUID
  column_id: UUID | null
  title: string
  description?: string | null
  priority: 'baixa' | 'media' | 'alta'
  start_at?: string | null
  due_at?: string | null
  end_at?: string | null
  tags: string[] | null
  progress: number
  is_archived: boolean
  sort_order: number
  created_by?: UUID | null
}

type TaskComment = { id: UUID; task_id: UUID; user_id: UUID | null; content: string; created_at: string }

type Checklist = { id: UUID; task_id: UUID; title: string }

type ChecklistItem = { id: UUID; checklist_id: UUID; title: string; is_done: boolean; position: number }

// Utilidades
const priorities: Array<Task['priority']> = ['baixa', 'media', 'alta']
const priorityBadge = (p: Task['priority']) =>
  p === 'alta' ? 'bg-red-100 text-red-700' : p === 'media' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'

const formatDateTimeLocal = (iso?: string | null) => {
  if (!iso) return ''
  try { return new Date(iso).toISOString().slice(0,16) } catch { return '' }
}


export default function Tarefas() {
  const { toast } = useToast()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [boards, setBoards] = useState<Board[]>([])
  const [boardId, setBoardId] = useState<UUID | null>(null)
  const [isBoardSettingsOpen, setBoardSettingsOpen] = useState(false)
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false)

  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  // Filtros
  const [q, setQ] = useState('')
  const [priority, setPriority] = useState<string>('')
  const [onlyMine, setOnlyMine] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [assigneeFilter, setAssigneeFilter] = useState<string>('')
  const [tagFilter, setTagFilter] = useState<string>('')
  const [dueFrom, setDueFrom] = useState<string>('')
  const [dueTo, setDueTo] = useState<string>('')

  // Modais
  const [isBoardDialogOpen, setBoardDialogOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')

  const [isColumnDialogOpen, setColumnDialogOpen] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isTaskDialogOpen, setTaskDialogOpen] = useState(false)

  // Atribuições e perfis
  const [profiles, setProfiles] = useState<Array<{ user_id: string; first_name: string; email: string }>>([])
  const [assignSelected, setAssignSelected] = useState<string[]>([])
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, string[]>>({})

  const draggingTaskId = useRef<UUID | null>(null)

  // Carregar boards e selecionar um
  // Detalhes da tarefa ativa
  const [attachments, setAttachments] = useState<Array<{ id: UUID; file_name: string; public_url: string | null }>>([])
  const [comments, setComments] = useState<TaskComment[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])

  // Seleção em massa
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.from('boards').select('*').order('created_at', { ascending: true })
        if (error) throw error
        setBoards(data || [])
        if (!data || data.length === 0) {
          // Criar board/colunas default
          const { data: b, error: be } = await supabase
            .from('boards')
            .insert({ name: 'Meu Quadro', owner_id: user?.id })
            .select('*').single()
          if (be) throw be
          setBoards([b])
          setBoardId(b.id)

          // Tornar usuário membro (owner) do quadro recém criado
          await supabase.from('board_members').insert({ board_id: b.id, user_id: user!.id, role: 'owner' })

          await supabase.from('board_columns').insert([
            { board_id: b.id, name: 'A Fazer', position: 1 },
    // Se não houver templates, apenas segue

            { board_id: b.id, name: 'Em Progresso', position: 2 },
            { board_id: b.id, name: 'Concluído', position: 3 },
          ])
        } else {
          setBoardId(data[0].id)
        }
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Erro', description: e.message })
      } finally {
    // Carregar perfis para atribuição
    supabase.from('profiles').select('user_id, first_name, email').then(({ data }) => {
      setProfiles(data || [])
    })

        setLoading(false)
      }
    }
    init()
  }, [])

  // Carregar colunas e tarefas do board selecionado
  const fetchBoardData = async (id: UUID) => {
    try {
      const [{ data: colsData, error: ce }, { data: tks, error: te }] = await Promise.all([
        supabase.from('board_columns').select('*').eq('board_id', id),
        supabase.from('tasks').select('*').eq('board_id', id).order('sort_order'),
      ])
      if (ce) throw ce
      if (te) throw te
      const cols = (colsData || []).slice().sort((a:any,b:any)=> (a.position||0) - (b.position||0))
      setColumns(cols)
      const tasksList = (tks || []).map(t => ({ ...t, tags: t.tags || [] }))
      setTasks(tasksList)

      // Carregar assignments map para filtros e exibição
      const ids = tasksList.map(t=>t.id)
      if (ids.length) {
        const { data: asg } = await supabase.from('task_assignments').select('task_id,user_id').in('task_id', ids)
        const map: Record<string,string[]> = {}
        for (const r of (asg||[])) {
          (map[r.task_id] ||= []).push(r.user_id)
        }
        setAssignmentsMap(map)
      } else {
        setAssignmentsMap({})
      }
    } catch (err:any) {
      console.error('Erro ao carregar quadro:', err)
      toast({ variant:'destructive', title:'Erro ao carregar quadro', description: err.message })
      setColumns([])
      setTasks([])
      setAssignmentsMap({})
    }
  }

  useEffect(() => {
    if (!boardId) return
    setLoading(true)
    fetchBoardData(boardId).finally(() => setLoading(false))

    // Realtime - atualizações instantâneas
    const channel = supabase.channel(`kanban-${boardId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'board_columns',
        filter: `board_id=eq.${boardId}`
      }, (payload) => {
        console.log('Column change:', payload)
        if (payload.eventType === 'INSERT') {
          const newColumn = payload.new as BoardColumn
          setColumns(prev => {
            // Evitar duplicatas
            if (prev.find(c => c.id === newColumn.id)) return prev
            return [...prev, newColumn].sort((a, b) => a.position - b.position)
          })
        } else if (payload.eventType === 'UPDATE') {
          const updatedColumn = payload.new as BoardColumn
          setColumns(prev => prev.map(c => c.id === updatedColumn.id ? updatedColumn : c).sort((a, b) => a.position - b.position))
        } else if (payload.eventType === 'DELETE') {
          const deletedColumn = payload.old as BoardColumn
          setColumns(prev => prev.filter(c => c.id !== deletedColumn.id))
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `board_id=eq.${boardId}`
      }, (payload) => {
        console.log('Task change:', payload)
        if (payload.eventType === 'INSERT') {
          const newTask = payload.new as Task
          setTasks(prev => {
            // Evitar duplicatas
            if (prev.find(t => t.id === newTask.id)) return prev
            return [...prev, newTask].sort((a, b) => a.sort_order - b.sort_order)
          })
        } else if (payload.eventType === 'UPDATE') {
          const updatedTask = payload.new as Task
          setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t).sort((a, b) => a.sort_order - b.sort_order))
        } else if (payload.eventType === 'DELETE') {
          const deletedTask = payload.old as Task
          setTasks(prev => prev.filter(t => t.id !== deletedTask.id))
        }
      })
      .subscribe((status) => {
        console.log('Realtime status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Realtime conectado para board:', boardId)
        }
      })

    // Fallback: refetch periódico para garantir sincronização
    const fallbackInterval = setInterval(() => {
      if (boardId) {
        console.log('Fallback sync for board:', boardId)
        fetchBoardData(boardId)
      }
    }, 30000) // A cada 30 segundos

    return () => {
      supabase.removeChannel(channel)
      clearInterval(fallbackInterval)
    }
  }, [boardId])

  // Filtros aplicados
  const filteredTasks = useMemo(() => {
    let result = tasks
    if (!showArchived) result = result.filter(t => !t.is_archived)
    if (q) result = result.filter(t => t.title.toLowerCase().includes(q.toLowerCase()))
    if (priority) result = result.filter(t => t.priority === priority)
    if (onlyMine) result = result.filter(t => t.created_by === user?.id)
    if (assigneeFilter) {
      const taskIds = Object.entries(assignmentsMap)
        .filter(([tid, uids]) => uids.includes(assigneeFilter))
        .map(([tid]) => tid)
      result = result.filter(t => taskIds.includes(t.id))
    }
    if (tagFilter) {
      result = result.filter(t => (t.tags||[]).some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase())))
    }
    if (dueFrom) result = result.filter(t => t.due_at && new Date(t.due_at) >= new Date(dueFrom))
    if (dueTo) result = result.filter(t => t.due_at && new Date(t.due_at) <= new Date(dueTo))
    return result
  }, [tasks, q, priority, onlyMine, showArchived, user?.id, assigneeFilter, tagFilter, dueFrom, dueTo, assignmentsMap])

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const c of columns) map[c.id] = []
    for (const t of filteredTasks) if (t.column_id) (map[t.column_id] ||= []).push(t)
    for (const cid of Object.keys(map)) map[cid].sort((a,b) => a.sort_order - b.sort_order)
    return map
  }, [columns, filteredTasks])

  // dnd-kit global para tarefas (cross-column)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5
      }
    })
  )

  // CRUD Boards
  const createBoard = async () => {
    if (!newBoardName.trim()) return
    const { data, error } = await supabase.from('boards').insert({ name: newBoardName.trim(), owner_id: user?.id }).select('*').single()
    if (error) { toast({ variant: 'destructive', title: 'Erro', description: error.message }); return }
    // Garantir membresia como owner para respeitar RLS nas colunas
    await supabase.from('board_members').insert({ board_id: data.id, user_id: user!.id, role: 'owner' })
    setBoards(prev => [...prev, data])
    setBoardId(data.id)
    setBoardDialogOpen(false)
    setNewBoardName('')
    // Criar colunas padrão ao criar um novo quadro pelo modal
    await supabase.from('board_columns').insert([
      { board_id: data.id, name: 'A Fazer', position: 1 },
      { board_id: data.id, name: 'Em Progresso', position: 2 },

      { board_id: data.id, name: 'Concluído', position: 3 },
    ])

  }

  // CRUD Columns
  const createColumn = async () => {
    if (!boardId || !newColumnName.trim()) return
    const pos = (columns[columns.length - 1]?.position || 0) + 1
    // Garantir que o usuário é membro do board antes de inserir coluna
    await supabase.from('board_members').upsert({ board_id: boardId, user_id: user!.id, role: 'member' }, { onConflict: 'board_id,user_id' })
    const { error } = await supabase.from('board_columns').insert({ board_id: boardId, name: newColumnName.trim(), position: pos })
    if (error) { toast({ variant: 'destructive', title: 'Erro', description: error.message }); return }
    setNewColumnName('')
    setColumnDialogOpen(false)
  }

  const renameColumn = async (col: Column) => {
    const name = prompt('Novo nome da coluna', col.name)
    if (!name) return
    const { error } = await supabase.from('board_columns').update({ name }).eq('id', col.id)
    if (error) toast({ variant: 'destructive', title: 'Erro', description: error.message })
  }

  const deleteColumn = async (col: Column) => {
    if (!confirm('Excluir esta coluna? As tarefas continuarão no quadro, sem coluna.')) return
    const { error } = await supabase.from('board_columns').delete().eq('id', col.id)
    if (error) toast({ variant: 'destructive', title: 'Erro', description: error.message })
  }

  // CRUD Tasks
  const openNewTask = (column_id: UUID) => {
    if (!boardId) return
    const t: Task = {
      id: crypto.randomUUID(), // temporário; Supabase definirá ao inserir
      board_id: boardId,
      column_id,
      title: '', description: '', priority: 'media',
      start_at: null, due_at: null, end_at: null,
      tags: [], progress: 0, is_archived: false, sort_order: (tasksByColumn[column_id]?.length || 0) + 1,
      created_by: user?.id || null
    }
    setEditingTask(t)
    setAssignSelected([])
    setAttachments([])
    setComments([])
    setChecklists([])
    setChecklistItems([])
    setTaskDialogOpen(true)
  }

  const loadTaskDetails = async (taskId: UUID) => {
    const [{ data: asg }, { data: att }, { data: cmt }, { data: cls }, { data: cli }] = await Promise.all([
      supabase.from('task_assignments').select('*').eq('task_id', taskId),
      supabase.from('task_attachments').select('*').eq('task_id', taskId),
      supabase.from('task_comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true }),
      supabase.from('task_checklists').select('*').eq('task_id', taskId),
      supabase.from('task_checklist_items').select('*').in('checklist_id', (await supabase.from('task_checklists').select('id').eq('task_id', taskId)).data?.map(r=>r.id) || [])
    ])
    setAssignSelected((asg||[]).map((r:any)=>r.user_id))
    setAttachments((att||[]) as any)
    setComments((cmt||[]) as any)
    setChecklists((cls||[]) as any)
    setChecklistItems((cli||[]) as any)
  }

  const saveTask = async () => {
    if (!editingTask) return
    const payload = { ...editingTask, tags: editingTask.tags || [] }
    if (!editingTask.title?.trim()) { toast({ variant: 'destructive', title: 'Título obrigatório' }); return }

    // Upsert por id: se existir (server) atualiza senão insere
    const { data, error } = await supabase.from('tasks')
      .upsert({
        id: editingTask.id,
        board_id: editingTask.board_id,
        column_id: editingTask.column_id,
        title: editingTask.title.trim(),
        description: editingTask.description || null,
        priority: editingTask.priority,
        start_at: editingTask.start_at || null,
        due_at: editingTask.due_at || null,
        end_at: editingTask.end_at || null,
        tags: payload.tags,
        progress: editingTask.progress || 0,
        is_archived: editingTask.is_archived || false,
        sort_order: editingTask.sort_order || 0,
        created_by: editingTask.created_by || user?.id || null,
      })
      .select('*').single()

    if (error) { toast({ variant: 'destructive', title: 'Erro', description: error.message }); return }

    // Sincronizar assignments
    if (data?.id) {
      const { data: existing } = await supabase.from('task_assignments').select('user_id').eq('task_id', data.id)
      const existingIds = new Set((existing||[]).map((r:any)=>r.user_id))
      const desired = new Set(assignSelected)
      const toInsert = [...desired].filter(id=>!existingIds.has(id)).map(user_id=>({ task_id: data.id, user_id }))
      const toDelete = [...existingIds].filter(id=>!desired.has(id))
      if (toInsert.length) await supabase.from('task_assignments').insert(toInsert)
      if (toDelete.length) await supabase.from('task_assignments').delete().eq('task_id', data.id).in('user_id', toDelete)
    }

    setTaskDialogOpen(false); setEditingTask(null)
    toast({ title: 'Tarefa salva' })
  }

  const deleteTask = async (t: Task) => {
    if (!confirm('Excluir esta tarefa?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', t.id)
    if (error) toast({ variant: 'destructive', title: 'Erro', description: error.message })
  }

  // Drag-and-drop simples (HTML5)
  const onDragStart = (id: UUID) => (e: React.DragEvent) => {
    draggingTaskId.current = id
    e.dataTransfer.setData('text/plain', id)
  }
  const onDropOnColumn = (column_id: UUID) => async (e: React.DragEvent) => {
    e.preventDefault()
    const id = draggingTaskId.current || e.dataTransfer.getData('text/plain')
    draggingTaskId.current = null
    if (!id) return
    // calcular nova ordem simples (final da coluna)
    const newOrder = ((tasksByColumn[column_id]?.[tasksByColumn[column_id].length - 1]?.sort_order) || 0) + 1
    // otimista
    setTasks(prev => prev.map(t => t.id === id ? { ...t, column_id, sort_order: newOrder } as any : t))
    const { error } = await supabase.from('tasks').update({ column_id, sort_order: newOrder }).eq('id', id)
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao mover tarefa', description: error.message })
      // rollback: recarrega dados do servidor
      if (boardId) fetchBoardData(boardId)
    }
  }
  const allowDrop = (e: React.DragEvent) => e.preventDefault()

  // Helpers UI
  const taskDueStatus = (t: Task) => {
    if (!t.due_at) return null
    const now = new Date()
    const due = new Date(t.due_at)
    if (t.end_at) return 'done'
    if (due < now) return 'overdue'
    const diff = (due.getTime() - now.getTime()) / (1000*60*60)
    if (diff < 24) return 'soon'
    return 'ok'
  }

  const renderTaskCard = (t: Task) => (
    <div key={t.id}
      className={`rounded-md border bg-card p-3 hover:shadow-sm cursor-grab active:cursor-grabbing ${selectedIds.includes(t.id) ? 'ring-2 ring-primary' : ''}`}
      onDoubleClick={async () => { setEditingTask(t); setTaskDialogOpen(true); await loadTaskDetails(t.id) }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <input type="checkbox" className="mt-0.5" checked={selectedIds.includes(t.id)} onChange={(e)=>{
            setSelectedIds(prev=> e.target.checked ? [...prev, t.id] : prev.filter(id=>id!==t.id))
          }} />
          <div className="font-medium text-sm">{t.title}</div>
        </div>
        <Badge className={`text-xs ${priorityBadge(t.priority)} capitalize`}>{t.priority}</Badge>
      </div>
      {t.description && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.description}</div>}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {t.tags?.map(tag => <Badge key={tag} variant="outline" className="text-[10px] flex items-center gap-1"><Tag className="h-3 w-3" />{tag}</Badge>)}
        {t.due_at && (
          <div className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${
            taskDueStatus(t)==='overdue' ? 'bg-red-50 text-red-700 border-red-200' : taskDueStatus(t)==='soon' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'text-muted-foreground'
          }`}>
            <Calendar className="h-3 w-3" /> {new Date(t.due_at).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Layout>
      {/* Cabeçalho fixo conforme imagem */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Tarefas</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={boardId || ''} onValueChange={(v) => setBoardId(v)}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue placeholder="Meu Quadro" />
              </SelectTrigger>
              <SelectContent>
                {boards.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setBoardDialogOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Novo Quadro
            </Button>
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setTemplateDialogOpen(true)}>
              Modelos
            </Button>
            {boardId && (
              <Button variant="outline" size="sm" onClick={() => setBoardSettingsOpen(true)}>
                <Settings className="h-3 w-3 mr-1" />
                Configurar Quadro
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de filtros fixa */}
      <div className="bg-background border-b sticky top-[49px] z-10">
        <div className="flex items-center justify-between px-6 py-3 gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Pesquisar tarefas"
                className="pl-8 w-64 h-9 text-sm"
              />
            </div>
            <Select value={priority || '__all__'} onValueChange={(v) => setPriority(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-24 h-9 text-sm">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assigneeFilter || '__all__'} onValueChange={(v) => setAssigneeFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-24 h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.first_name || p.email}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              placeholder="Tag"
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              className="w-20 h-9 text-sm"
            />
            <Input
              type="date"
              value={dueFrom}
              onChange={e => setDueFrom(e.target.value)}
              className="w-32 h-9 text-sm"
            />
            <Input
              type="date"
              value={dueTo}
              onChange={e => setDueTo(e.target.value)}
              className="w-32 h-9 text-sm"
            />
            <Button
              variant={onlyMine ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOnlyMine(v => !v)}
              className={onlyMine ? 'bg-blue-50' : ''}
            >
              <Users className="h-3 w-3 mr-1" />
              Minhas
            </Button>
            <Button
              variant={showArchived ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowArchived(v => !v)}
              className={showArchived ? 'bg-blue-50' : ''}
            >
              <Archive className="h-3 w-3 mr-1" />
              Arquivadas
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setColumnDialogOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Nova Coluna
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => openNewTask(columns[0]?.id)}
              disabled={!columns.length}
            >
              <Plus className="h-3 w-3 mr-1" />
              Nova Tarefa
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com scroll */}
      <div className="flex-1 overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-6 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{selectedIds.length} tarefa(s) selecionada(s):</span>
              <Select onValueChange={async (destCol) => {
                if (!destCol) return
                const { error } = await supabase.from('tasks').update({ column_id: destCol }).in('id', selectedIds)
                if (error) toast({ variant:'destructive', title:'Erro ao mover', description: error.message })
                setSelectedIds([])
              }}>
                <SelectTrigger className="w-48 h-8 text-sm">
                  <SelectValue placeholder="Mover para..." />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select onValueChange={async (uid) => {
                if (!uid) return
                const rows = selectedIds.map(task_id => ({ task_id, user_id: uid }))
                const { error } = await supabase.from('task_assignments').insert(rows)
                if (error) toast({ variant:'destructive', title:'Erro ao atribuir', description: error.message })
                setSelectedIds([])
              }}>
                <SelectTrigger className="w-48 h-8 text-sm">
                  <SelectValue placeholder="Atribuir a..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.first_name || p.email}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">Selecionadas: {selectedIds.length}</span>
              <Button variant="outline" onClick={async()=>{
                if (!confirm('Arquivar tarefas selecionadas?')) return
                const { error } = await supabase.from('tasks').update({ is_archived: true }).in('id', selectedIds)
                if (error) toast({ variant:'destructive', title:'Erro', description: error.message })
                setSelectedIds([])
              }}>Arquivar</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
            <DndContext sensors={sensors} onDragEnd={async (e)=>{
              const activeId = String(e.active?.id)
              const overId = e.over ? String(e.over.id) : null
              const overData: any = e.over?.data?.current

              if (!activeId) return

              // Verificar se é uma tarefa sendo movida
              const isTask = tasks.some(t => t.id === activeId)
              const isColumn = columns.some(c => c.id === activeId)

              if (isTask) {
                // Encontrar coluna atual da tarefa
                let currentColumnId: string | null = null
                for (const [cid, arr] of Object.entries(tasksByColumn)) {
                  if ((arr as any[]).some(t => t.id === activeId)) {
                    currentColumnId = cid
                    break
                  }
                }

                // Determinar coluna de destino
                let destColumnId: string | null = null

                // Se soltou diretamente na coluna
                if (overData?.type === 'column') {
                  destColumnId = overData.columnId
                } else if (overId) {
                  // Se soltou em cima de outra tarefa, encontrar a coluna
                  for (const [cid, arr] of Object.entries(tasksByColumn)) {
                    if ((arr as any[]).some(t => t.id === overId)) {
                      destColumnId = cid
                      break
                    }
                  }
                }

                // Só mover se for para uma coluna diferente
                if (!destColumnId || destColumnId === currentColumnId) return

                // Calcular nova posição
                let newOrder: number
                if (overId && overData?.type !== 'column') {
                  // Inserir antes da tarefa alvo
                  const arr = tasksByColumn[destColumnId] || []
                  const targetTask = arr.find(t => t.id === overId)
                  newOrder = targetTask ? targetTask.sort_order - 0.001 : ((arr[arr.length - 1]?.sort_order || 0) + 1)
                } else {
                  // Inserir no final da coluna
                  const arr = tasksByColumn[destColumnId] || []
                  newOrder = (arr[arr.length - 1]?.sort_order || 0) + 1
                }

                // Atualização otimista
                setTasks(prev => prev.map(t =>
                  t.id === activeId ? { ...t, column_id: destColumnId as UUID, sort_order: newOrder } : t
                ))

                // Persistir no banco
                const { error } = await supabase.from('tasks').update({
                  column_id: destColumnId,
                  sort_order: newOrder
                }).eq('id', activeId)

                if (error) {
                  toast({ variant:'destructive', title:'Erro ao mover tarefa', description: error.message })
                  // Rollback
                  if (boardId) fetchBoardData(boardId)
                } else {
                  toast({ title:'Tarefa movida com sucesso' })
                }
              } else if (isColumn && overId && activeId !== overId) {
                // Mover coluna
                const cur = [...columns]
                const fromIndex = cur.findIndex(c => c.id === activeId)
                const toIndex = cur.findIndex(c => c.id === overId)

                if (fromIndex >= 0 && toIndex >= 0) {
                  const moved = cur.splice(fromIndex, 1)[0]
                  cur.splice(toIndex, 0, moved)

                  // Atualização otimista
                  const reordered = cur.map((c, idx) => ({ ...c, position: idx + 1 }))
                  setColumns(reordered)

                  // Persistir
                  try {
                    await Promise.all(reordered.map((c, idx) =>
                      supabase.from('board_columns').update({ position: idx + 1 }).eq('id', c.id)
                    ))
                  } catch (e: any) {
                    toast({ variant:'destructive', title:'Erro ao mover coluna', description: e.message })
                    if (boardId) fetchBoardData(boardId)
                  }
                }
              }
            }}>

          <>

            {/* DnD horizontal de colunas */}
          <SortableRow ids={columns.map(c=>c.id)}>

          <div className="overflow-x-auto px-6">
            <div className="flex gap-3 pb-4 min-h-[500px]">
              {columns.map(col => (
                <SortableColumnItem id={col.id} key={col.id}>
                  <Card className="min-w-[320px] w-[320px]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base flex items-center gap-2 w-full">
                        <span className="block w-full whitespace-nowrap overflow-hidden text-ellipsis">{col.name}</span>
                      </CardTitle>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="icon" variant="ghost" aria-label="Ações da lista">⋯</Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-56 p-1">
                          <div className="flex flex-col">
                            <Button variant="ghost" className="justify-start" onClick={()=>openNewTask(col.id)}>Adicionar cartão</Button>
                            <Button variant="ghost" className="justify-start" onClick={async()=>{
                              // Copiar lista: duplica col e tarefas (simples)
                              const pos = (columns[columns.length - 1]?.position || 0) + 1
                              const { data: newCol, error: ce } = await supabase.from('board_columns').insert({ board_id: col.board_id, name: col.name + ' (cópia)', position: pos }).select('*').single()
                              if (ce) { toast({ variant:'destructive', title:'Erro', description: ce.message }); return }
                              const { data: tasksToCopy } = await supabase.from('tasks').select('*').eq('column_id', col.id)
                              if (tasksToCopy?.length) {
                                const rows = tasksToCopy.map((t:any)=> ({ ...t, id: undefined, column_id: newCol.id }))
                                await supabase.from('tasks').insert(rows)
                              }
                            }}>Copiar lista</Button>
                            <Button variant="ghost" className="justify-start" onClick={async()=>{
                              // Mover lista: escolhe destino simples (à direita)
                              const targetPos = (columns[columns.length - 1]?.position || 0) + 1
                              const { error } = await supabase.from('board_columns').update({ position: targetPos }).eq('id', col.id)
                              if (error) toast({ variant:'destructive', title:'Erro', description: error.message })
                            }}>Mover lista</Button>
                            <Button variant="ghost" className="justify-start" onClick={()=>deleteColumn(col)}>Arquivar lista</Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </CardHeader>
                    <CardContent className="space-y-2 min-h-[200px]">
                      <ColumnDroppable id={`column-${col.id}`}>
                        <div className="min-h-[150px] w-full">
                          <SortableList ids={(tasksByColumn[col.id] || []).map(t=>t.id)}>
                            {(tasksByColumn[col.id] || []).map(t=> (
                              <SortableTask id={t.id} key={t.id}>
                                {renderTaskCard(t)}
                              </SortableTask>
                            ))}
                          </SortableList>
                          {(tasksByColumn[col.id] || []).length === 0 && (
                            <div className="text-center text-muted-foreground text-sm py-8" data-testid={`drop-zone-${col.id}`}>
                              Arraste tarefas aqui
                            </div>
                          )}
                        </div>
                      </ColumnDroppable>
                    </CardContent>
                  </Card>
                </SortableColumnItem>
                ))}
              </div>
            </div>

          </SortableRow>

          </>

          </DndContext>


        )}
      </div>

      {/* Dialog Modelos */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modelos de Quadros</DialogTitle></DialogHeader>
          <TemplateList onCreate={async (templateId: string) => {
            try {
              if (!user) throw new Error('Usuário não autenticado')
              const { data: tpl } = await supabase.from('board_templates').select('*').eq('id', templateId).single()
              if (!tpl) throw new Error('Template não encontrado')
              const { data: b, error: be } = await supabase.from('boards').insert({
                name: tpl.name,
                description: tpl.description,
                owner_id: user.id
              }).select('*').single()
              if (be) throw be
              const { data: cols } = await supabase.from('board_template_columns').select('*').eq('template_id', templateId).order('position')
              if (cols?.length) {
                await supabase.from('board_columns').insert(cols.map((c: any) => ({
                  board_id: b.id,
                  name: c.name,
                  position: c.position,
                  color: c.color,
                  wip_limit: c.wip_limit
                })))
              }
              setBoards(prev => [...prev, b])
              setBoardId(b.id)
              setTemplateDialogOpen(false)
              toast({ title: 'Quadro criado a partir do modelo' })
            } catch (e: any) {
              toast({ variant: 'destructive', title: 'Erro', description: e.message })
            }
          }} />
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Quadro */}
        <Dialog open={isBoardDialogOpen} onOpenChange={setBoardDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Quadro</DialogTitle></DialogHeader>
            <Input placeholder="Nome do quadro" value={newBoardName} onChange={e=>setNewBoardName(e.target.value)} />
            <DialogFooter>
              <Button variant="outline" onClick={()=>setBoardDialogOpen(false)}>Cancelar</Button>
              <Button onClick={createBoard}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Nova Coluna */}
        <Dialog open={isColumnDialogOpen} onOpenChange={setColumnDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Coluna</DialogTitle></DialogHeader>
            <Input placeholder="Nome da coluna" value={newColumnName} onChange={e=>setNewColumnName(e.target.value)} />
            <DialogFooter>
              <Button variant="outline" onClick={()=>setColumnDialogOpen(false)}>Cancelar</Button>
              <Button onClick={createColumn}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Tarefa */}
        <Dialog open={isTaskDialogOpen} onOpenChange={(o)=> { setTaskDialogOpen(o); if (!o) setEditingTask(null) }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingTask?.id ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle></DialogHeader>
            {editingTask && (
              <div className="space-y-3">
                <Input placeholder="Título" value={editingTask.title}
                  onChange={e=>setEditingTask({...editingTask, title: e.target.value})} />
                <Textarea placeholder="Descrição" value={editingTask.description || ''}
                  onChange={e=>setEditingTask({...editingTask, description: e.target.value})} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Início</label>
                    <Input type="datetime-local" value={formatDateTimeLocal(editingTask.start_at)} onChange={e=>setEditingTask({...editingTask, start_at: e.target.value ? new Date(e.target.value).toISOString() : null})} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Prazo</label>
                    <Input type="datetime-local" value={formatDateTimeLocal(editingTask.due_at)} onChange={e=>setEditingTask({...editingTask, due_at: e.target.value ? new Date(e.target.value).toISOString() : null})} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Conclusão</label>
                    <Input type="datetime-local" value={formatDateTimeLocal(editingTask.end_at)} onChange={e=>setEditingTask({...editingTask, end_at: e.target.value ? new Date(e.target.value).toISOString() : null})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Prioridade</label>
                    <Select value={editingTask.priority} onValueChange={(v)=> setEditingTask({...editingTask, priority: v as Task['priority']})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {priorities.map(p=> <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
        {/* Dialog Modelos */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Modelos de Quadros</DialogTitle></DialogHeader>
            <TemplateList onCreate={async (templateId: string) => {
              try {
                if (!user) throw new Error('Usuário não autenticado')
                const { data: tpl } = await supabase.from('board_templates').select('*').eq('id', templateId).single()
                if (!tpl) throw new Error('Template não encontrado')
                const { data: b, error: be } = await supabase.from('boards').insert({ name: tpl.name, description: tpl.description }).select('*').single()
                if (be) throw be
                const { data: cols } = await supabase.from('board_template_columns').select('*').eq('template_id', templateId).order('position')
                if (cols?.length) {
                  await supabase.from('board_columns').insert(cols.map((c:any)=> ({ board_id: b.id, name: c.name, position: c.position, color: c.color, wip_limit: c.wip_limit })))
                }
                setBoards(prev => [...prev, b])
                setBoardId(b.id)
                setTemplateDialogOpen(false)
                toast({ title: 'Quadro criado a partir do modelo' })
              } catch (e:any) {
                toast({ variant:'destructive', title:'Erro', description: e.message })
              }
            }} />
          </DialogContent>
        </Dialog>

                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Tags (separe por vírgula)</label>
                    <Input value={(editingTask.tags||[]).join(', ')} onChange={e=> setEditingTask({...editingTask, tags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
                  </div>
                </div>
                {/* Atribuições */}
                <div>
                  <label className="text-xs text-muted-foreground">Atribuídos</label>
                  <Select value="" onValueChange={(v)=> setAssignSelected(prev => prev.includes(v) ? prev : [...prev, v])}>
                    <SelectTrigger><SelectValue placeholder="Adicionar responsável" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map(p=> <SelectItem key={p.user_id} value={p.user_id}>{p.first_name || p.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {assignSelected.map(uid => {
                      const p = profiles.find(px=>px.user_id===uid)
                      return (
                        <Badge key={uid} variant="secondary" className="text-xs">
                          {(p?.first_name || p?.email || uid)}
                          <button className="ml-2" onClick={()=> setAssignSelected(prev=> prev.filter(id=>id!==uid))}>×</button>
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                {/* Anexos (UI básica) */}
                <div>
                  <label className="text-xs text-muted-foreground">Anexos</label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input type="file" onChange={async (e)=>{
                      const file = e.target.files?.[0]
                      if (!file || !editingTask?.id) return
                      const path = `${editingTask.id}/${Date.now()}_${file.name}`
                      const up = await supabase.storage.from('task-attachments').upload(path, file)
                      if (up.error) { toast({ variant:'destructive', title:'Erro no upload', description: up.error.message }); return }
                      const pub = supabase.storage.from('task-attachments').getPublicUrl(path)
                      await supabase.from('task_attachments').insert({ task_id: editingTask.id, file_name: file.name, file_type: file.type, file_size: file.size, storage_path: path, public_url: pub.data.publicUrl })
                      await loadTaskDetails(editingTask.id)
                    }} />
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    {attachments.map(a=> (
                      <div key={a.id} className="flex items-center justify-between">
                        <span>{a.file_name}</span>
                        {a.public_url && <a className="text-primary underline" href={a.public_url} target="_blank">Baixar</a>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comentários */}
                <div>
                  <label className="text-xs text-muted-foreground">Comentários</label>
                  <div className="space-y-2 max-h-32 overflow-auto border rounded p-2">
                    {comments.map(c=> (
                      <div key={c.id} className="text-xs">
                        <span className="text-muted-foreground">{new Date(c.created_at).toLocaleString('pt-BR')}:</span> {c.content}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input placeholder="Adicionar comentário..." onKeyDown={async (e)=>{
                      if (e.key==='Enter' && editingTask?.id) {
                        const v = (e.target as HTMLInputElement).value.trim()
                        if (!v) return
                        const { error } = await supabase.from('task_comments').insert({ task_id: editingTask.id, user_id: user?.id, content: v })
                        if (!error) { (e.target as HTMLInputElement).value=''; loadTaskDetails(editingTask.id) }
                      }
                    }} />
                  </div>
                </div>

                {/* Checklists simples */}
                <div>
                  <label className="text-xs text-muted-foreground">Checklist</label>
                  {checklists.map(cl => (
                    <div key={cl.id} className="mt-2">
                      <div className="text-xs font-medium">{cl.title}</div>
                      {(checklistItems.filter(i=>i.checklist_id===cl.id)).map(it => (
                        <div key={it.id} className="flex items-center gap-2 text-xs mt-1">
                          <input type="checkbox" checked={it.is_done} onChange={async (e)=>{
                            await supabase.from('task_checklist_items').update({ is_done: e.target.checked }).eq('id', it.id)
                            if (editingTask?.id) loadTaskDetails(editingTask.id)
                          }} />
                          <span className={it.is_done ? 'line-through text-muted-foreground':''}>{it.title}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="mt-2 flex gap-2">
                    <Input placeholder="Nova checklist..." onKeyDown={async (e)=>{
                      if (e.key==='Enter' && editingTask?.id) {
                        const v = (e.target as HTMLInputElement).value.trim()
                        if (!v) return
                        const { error } = await supabase.from('task_checklists').insert({ task_id: editingTask.id, title: v })
                        if (!error) { (e.target as HTMLInputElement).value=''; loadTaskDetails(editingTask.id) }
                      }
                    }} />
                    <Input placeholder="Novo item..." onKeyDown={async (e)=>{
                      if (e.key==='Enter' && checklists[0]?.id) {
                        const v = (e.target as HTMLInputElement).value.trim()
                        if (!v) return
                        const { error } = await supabase.from('task_checklist_items').insert({ checklist_id: checklists[0].id, title: v })
                        if (!error && editingTask?.id) { (e.target as HTMLInputElement).value=''; loadTaskDetails(editingTask.id) }
                      }
                    }} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Progresso: {Math.round(editingTask.progress||0)}%</div>
                  <div className="flex items-center gap-2">
                    {editingTask.id && <Button variant="outline" onClick={()=>deleteTask(editingTask)}>Excluir</Button>}
                    <Button onClick={saveTask}>Salvar</Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </Layout>
  )
}

