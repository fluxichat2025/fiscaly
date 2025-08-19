import { useEffect, useMemo, useRef, useState } from 'react'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RichTextEditor } from '@/components/RichTextEditor'
import { FileUpload, UploadedFile } from '@/components/FileUpload'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Filter, Loader2, Search, Layers, Users, Calendar, Archive, Tag, GripVertical, Settings, MoreVertical, Grid3X3, FileText, X, Save, UserPlus, Hash, Activity, CalendarDays, Timer, Send, Clock, MessageSquare, Paperclip, Edit, Trash2, Eye, CheckSquare } from 'lucide-react'
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { SortableList, SortableRow } from '@/components/kanban/DndWrappers'
import SortableTask from '@/components/kanban/SortableTask'
import SortableColumnItem from '@/components/kanban/SortableColumnItem'
import ColumnDroppable from '@/components/kanban/ColumnDroppable'
import TemplateList from '@/components/kanban/TemplateList'
import { Switch } from '@/components/ui/switch'
import AddMemberForm from '@/components/kanban/AddMemberForm'
import MemberList from '@/components/kanban/MemberList'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Tipos simplificados para o Kanban
type UUID = string

type Board = { id: UUID; name: string; description?: string | null; is_archived: boolean; owner_id?: UUID | null; settings?: any }
type Column = { id: UUID; board_id: UUID; name: string; position: number; wip_limit?: number | null; color?: string | null }
type Task = {
  id: UUID
  board_id: UUID
  column_id: UUID | null
  title: string
  description?: string | null
  priority: 'baixa' | 'media' | 'alta' | 'urgente'
  start_at?: string | null
  due_at?: string | null
  end_at?: string | null
  tags: string[] | null
  progress: number
  is_archived: boolean
  sort_order: number
  created_by?: UUID | null
  assigned_to?: UUID | null
  category?: string | null
  dependencies?: UUID[] | null
  estimated_hours?: number | null
  actual_hours?: number | null
}

type TaskComment = { id: UUID; task_id: UUID; user_id: UUID | null; content: string; created_at: string }

type Checklist = { id: UUID; task_id: UUID; title: string }
type BoardLabel = { id: string; name: string; color: string }


type ChecklistItem = { id: UUID; checklist_id: UUID; title: string; is_done: boolean; position: number }

// Novos tipos para sistema avançado
type TaskLabel = {
  id: UUID
  name: string
  color: string
  board_id: UUID
}

type TaskMember = {
  id: UUID
  task_id: UUID
  user_id: UUID
  assigned_at: string
}

type TaskLabelAssignment = {
  id: UUID
  task_id: UUID
  label_id: UUID
}

type TaskAttachment = {
  id: UUID
  task_id: UUID
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  uploaded_by: UUID
  created_at: string
}

type TaskActivity = {
  id: UUID
  task_id: UUID
  user_id?: UUID | null
  action: string
  details: any
  created_at: string
}

type UserProfile = {
  id: UUID
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  avatar_url?: string | null
}

// Utilidades
const priorities: Array<Task['priority']> = ['baixa', 'media', 'alta', 'urgente']

const getPriorityColor = (priority: Task['priority']) => {
  const colors = {
    'baixa': 'bg-green-100 text-green-800 border-green-200',
    'media': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'alta': 'bg-orange-100 text-orange-800 border-orange-200',
    'urgente': 'bg-red-100 text-red-800 border-red-200'
  }
  return colors[priority] || colors.media
}

const getDueDateStatus = (dueDate: string | null) => {
  if (!dueDate) return null

  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { status: 'overdue', days: Math.abs(diffDays), color: 'text-red-600', icon: '🔴' }
  if (diffDays === 0) return { status: 'today', days: 0, color: 'text-orange-600', icon: '🟡' }
  if (diffDays <= 3) return { status: 'soon', days: diffDays, color: 'text-yellow-600', icon: '🟠' }
  return { status: 'normal', days: diffDays, color: 'text-gray-600', icon: '📅' }
}

const getTaskUrgencyScore = (task: Task) => {
  let score = 0

  // Prioridade
  const priorityScores = { 'baixa': 1, 'media': 2, 'alta': 3, 'urgente': 4 }
  score += priorityScores[task.priority] * 10

  // Vencimento
  const dueDateStatus = getDueDateStatus(task.due_at)
  if (dueDateStatus?.status === 'overdue') score += 50
  else if (dueDateStatus?.status === 'today') score += 30
  else if (dueDateStatus?.status === 'soon') score += 20

  // Progresso (tarefas com pouco progresso e prazo apertado são mais urgentes)
  if (task.progress < 25 && dueDateStatus?.days && dueDateStatus.days <= 3) score += 15

  return score
}

const priorityBadge = (p: Task['priority']) => getPriorityColor(p)

function BoardLabelsEditor({ board, onSave }: { board: Board; onSave: (labels: BoardLabel[]) => void }) {
  const [labels, setLabels] = useState<BoardLabel[]>(() => (board.settings?.labels || []))
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <Input placeholder="Nome da tag" value={name} onChange={(e)=>setName(e.target.value)} className="h-9" />
        <input type="color" value={color} onChange={(e)=>setColor(e.target.value)} className="h-9 w-12 rounded" aria-label="Cor da tag" />
        <Button
          onClick={()=>{
            if (!name.trim()) return
            const id = crypto.randomUUID()
            setLabels(prev=> [...prev, { id, name: name.trim(), color }])
            setName('')
          }}
        >Adicionar</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {labels.map(l => (
          <div key={l.id} className="flex items-center gap-2 px-2 py-1 rounded border" style={{ backgroundColor: l.color + '22', borderColor: l.color }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="text-sm">{l.name}</span>
            <Button size="sm" variant="ghost" onClick={()=> setLabels(prev=> prev.filter(x=>x.id!==l.id))}>Remover</Button>
          </div>
        ))}
      </div>
      <div className="pt-2">
        <Button onClick={()=> onSave(labels)}>Salvar Tags</Button>
      </div>
    </div>
  )
}

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

  // Estado para drag overlay
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Estados para sistema avançado de tarefas
  const [taskLabels, setTaskLabels] = useState<TaskLabel[]>([])
  const [taskMembers, setTaskMembers] = useState<TaskMember[]>([])
  const [taskLabelAssignments, setTaskLabelAssignments] = useState<TaskLabelAssignment[]>([])
  const [taskAttachments, setTaskAttachments] = useState<TaskAttachment[]>([])
  const [taskActivities, setTaskActivities] = useState<TaskActivity[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])

  // Estados do formulário de tarefa
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    priority: 'media' as Task['priority']
  })
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [taskFiles, setTaskFiles] = useState<UploadedFile[]>([])
  const [newComment, setNewComment] = useState('')
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6')

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

  // Carregar dados do sistema avançado
  const loadAdvancedTaskData = async (boardId: UUID) => {
    try {
      const [
        { data: labels },
        { data: profiles },
        { data: members },
        { data: labelAssignments },
        { data: attachments },
        { data: activities }
      ] = await Promise.all([
        supabase.from('task_labels').select('*').eq('board_id', boardId),
        supabase.from('profiles').select('id, first_name, last_name, email, avatar_url'),
        supabase.from('task_members').select('*'),
        supabase.from('task_label_assignments').select('*'),
        supabase.from('task_attachments').select('*'),
        supabase.from('task_activities').select('*').order('created_at', { ascending: false }).limit(50)
      ])

      setTaskLabels(labels || [])
      setUserProfiles(profiles || [])
      setTaskMembers(members || [])
      setTaskLabelAssignments(labelAssignments || [])
      setTaskAttachments(attachments || [])
      setTaskActivities(activities || [])
    } catch (error: any) {
      console.error('Erro ao carregar dados avançados:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: error.message
      })
    }
  }

  useEffect(() => {
    if (!boardId) return
    setLoading(true)
    Promise.all([
      fetchBoardData(boardId),
      loadAdvancedTaskData(boardId)
    ]).finally(() => setLoading(false))

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
        distance: 3,
        delay: 50,
        tolerance: 2
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

    // Limpar formulário para nova tarefa
    setEditingTask(null)
    setTaskForm({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      priority: 'media'
    })
    setSelectedMembers([])
    setSelectedLabels([])
    setTaskFiles([])
    setNewComment('')
    setChecklists([])
    setChecklistItems([])
    setComments([])
    setAttachments([])

    // Criar uma tarefa temporária para o modal
    const tempTask: Task = {
      id: crypto.randomUUID(),
      board_id: boardId,
      column_id,
      title: '',
      description: '',
      priority: 'media',
      start_at: null,
      due_at: null,
      end_at: null,
      tags: [],
      progress: 0,
      is_archived: false,
      sort_order: (tasksByColumn[column_id]?.length || 0) + 1,
      created_by: user?.id || null
    }

    setEditingTask(tempTask)
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
    const title = editingTask?.title || taskForm.title
    const description = editingTask?.description || taskForm.description

    if (!title?.trim()) {
      toast({ variant: 'destructive', title: 'Título obrigatório' });
      return
    }

    if (!boardId || !columns.length) {
      toast({ variant: 'destructive', title: 'Selecione um quadro primeiro' });
      return
    }

    try {
      // Preparar dados da tarefa
      const taskData = {
        id: editingTask?.id,
        board_id: boardId,
        column_id: editingTask?.column_id || columns[0]?.id,
        title: title.trim(),
        description: description || null,
        priority: editingTask?.priority || taskForm.priority,
        start_date: editingTask?.start_at || (taskForm.start_date ? new Date(taskForm.start_date).toISOString() : null),
        end_date: editingTask?.end_at || (taskForm.end_date ? new Date(taskForm.end_date).toISOString() : null),
        sort_order: editingTask?.sort_order || 0,
        created_by: editingTask?.created_by || user?.id || null,
      }

      // Salvar tarefa
      const { data: savedTask, error: taskError } = await supabase
        .from('tasks')
        .upsert(taskData)
        .select('*')
        .single()

      if (taskError) throw taskError

      const taskId = savedTask.id

      // Salvar membros
      if (selectedMembers.length > 0) {
        // Remover membros existentes
        await supabase.from('task_members').delete().eq('task_id', taskId)

        // Adicionar novos membros
        const memberData = selectedMembers.map(userId => ({
          task_id: taskId,
          user_id: userId
        }))

        const { error: membersError } = await supabase
          .from('task_members')
          .insert(memberData)

        if (membersError) throw membersError
      }

      // Salvar etiquetas
      if (selectedLabels.length > 0) {
        // Remover etiquetas existentes
        await supabase.from('task_label_assignments').delete().eq('task_id', taskId)

        // Adicionar novas etiquetas
        const labelData = selectedLabels.map(labelId => ({
          task_id: taskId,
          label_id: labelId
        }))

        const { error: labelsError } = await supabase
          .from('task_label_assignments')
          .insert(labelData)

        if (labelsError) throw labelsError
      }

      // Salvar checklists
      if (checklists.length > 0) {
        // Remover checklists existentes
        await supabase.from('task_checklists').delete().eq('task_id', taskId)

        // Salvar novos checklists
        for (const checklist of checklists) {
          const { data: savedChecklist, error: checklistError } = await supabase
            .from('task_checklists')
            .insert({
              task_id: taskId,
              title: checklist.title,
              position: checklist.position
            })
            .select('*')
            .single()

          if (checklistError) throw checklistError

          // Salvar itens do checklist
          const items = checklistItems.filter(item => item.checklist_id === checklist.id)
          if (items.length > 0) {
            const itemData = items.map(item => ({
              checklist_id: savedChecklist.id,
              text: item.title,
              completed: item.is_done,
              start_date: item.start_date,
              end_date: item.end_date,
              position: item.position
            }))

            const { error: itemsError } = await supabase
              .from('checklist_items')
              .insert(itemData)

            if (itemsError) throw itemsError
          }
        }
      }

      // Registrar atividade
      await supabase.rpc('log_task_activity', {
        p_task_id: taskId,
        p_user_id: user?.id,
        p_action: editingTask?.id ? 'atualizou a tarefa' : 'criou a tarefa',
        p_details: { title: title.trim() }
      })

      // Recarregar dados
      if (boardId) {
        await Promise.all([
          fetchBoardData(boardId),
          loadAdvancedTaskData(boardId)
        ])
      }

      setTaskDialogOpen(false)
      setEditingTask(null)
      toast({ title: editingTask?.id ? 'Tarefa atualizada!' : 'Tarefa criada!' })

    } catch (error: any) {
      console.error('Erro ao salvar tarefa:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar tarefa',
        description: error.message
      })
    }
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
      className={`
        rounded-md border bg-card p-3
        hover:shadow-md hover:scale-[1.02]
        cursor-grab active:cursor-grabbing
        transition-all duration-200 ease-in-out
        ${selectedIds.includes(t.id) ? 'ring-2 ring-primary' : ''}
      `}
      onDoubleClick={async () => {
        setEditingTask(t);
        setTaskDialogOpen(true);
        await loadTaskDetails(t.id);

        // Carregar dados avançados da tarefa
        try {
          const [
            { data: members },
            { data: labelAssignments },
            { data: taskChecklists },
            { data: taskChecklistItems },
            { data: taskComments },
            { data: taskAttachments }
          ] = await Promise.all([
            supabase.from('task_members').select('user_id').eq('task_id', t.id),
            supabase.from('task_label_assignments').select('label_id').eq('task_id', t.id),
            supabase.from('task_checklists').select('*').eq('task_id', t.id).order('position'),
            supabase.from('checklist_items').select('*').order('position'),
            supabase.from('task_comments').select('*').eq('task_id', t.id).order('created_at'),
            supabase.from('task_attachments').select('*').eq('task_id', t.id).order('created_at')
          ])

          setSelectedMembers(members?.map(m => m.user_id) || [])
          setSelectedLabels(labelAssignments?.map(la => la.label_id) || [])
          setChecklists(taskChecklists || [])

          // Filtrar itens de checklist para esta tarefa
          const taskChecklistIds = (taskChecklists || []).map(c => c.id)
          setChecklistItems((taskChecklistItems || []).filter(item =>
            taskChecklistIds.includes(item.checklist_id)
          ))

          setComments(taskComments || [])
          setTaskAttachments(taskAttachments || [])

        } catch (error) {
          console.error('Erro ao carregar dados avançados da tarefa:', error)
        }
      }}
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
      {/* Cabeçalho fixo com kebab menu */}
      <div className="bg-background border-b sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 md:px-5 xl:px-6 py-3 min-h-[56px]">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Tarefas</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Kebab Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 hover:bg-muted focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Menu de ações"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <div className="flex items-center">
                    <Layers className="mr-2 h-4 w-4" />
                    <Select value={boardId || ''} onValueChange={(v) => setBoardId(v)}>
                      <SelectTrigger className="border-none shadow-none p-0 h-auto focus:ring-0 flex-1">
                        <SelectValue placeholder="Meu Quadro" />
                      </SelectTrigger>
                      <SelectContent>
                        {boards.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setBoardDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Novo Quadro</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setColumnDialogOpen(true)}
                  disabled={!boardId}
                >
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  <span>Nova Coluna</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTemplateDialogOpen(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Modelos</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setBoardSettingsOpen(true)}
                  disabled={!boardId}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurar Quadro</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openNewTask(columns[0]?.id)}
                  disabled={!columns.length}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Nova Tarefa</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Barra de filtros fixa */}
      <div className="bg-background border-b sticky top-[56px] z-30">
        <div className="px-4 md:px-5 xl:px-6 py-3">
          <div className="flex flex-col md:flex-row md:flex-wrap items-start md:items-center gap-3 lg:gap-4">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Pesquisar tarefas"
                className="pl-8 w-full md:w-64 h-10 text-sm"
              />
            </div>
            <Select value={priority || '__all__'} onValueChange={(v) => setPriority(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-28 h-10 text-sm">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assigneeFilter || '__all__'} onValueChange={(v) => setAssigneeFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-28 h-10 text-sm">
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
              className="w-24 h-10 text-sm"
            />
            <Input
              type="date"
              value={dueFrom}
              onChange={e => setDueFrom(e.target.value)}
              className="w-36 h-10 text-sm"
            />
            <Input
              type="date"
              value={dueTo}
              onChange={e => setDueTo(e.target.value)}
              className="w-36 h-10 text-sm"
            />
            <Button
              variant={onlyMine ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOnlyMine(v => !v)}
              className={`h-10 ${onlyMine ? 'bg-blue-50' : ''}`}
            >
              <Users className="h-4 w-4 mr-2" />
              Minhas
            </Button>
            <Button
              variant={showArchived ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowArchived(v => !v)}
              className={`h-10 ${showArchived ? 'bg-blue-50' : ''}`}
            >
              <Archive className="h-4 w-4 mr-2" />
              Arquivadas
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com scroll */}
      <div className="flex-1 overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mx-4 md:mx-5 xl:mx-6 mt-6 mb-4">
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
            <DndContext
              sensors={sensors}
              onDragStart={(e) => {
                const activeId = String(e.active?.id)
                const task = tasks.find(t => t.id === activeId)
                if (task) {
                  setActiveTask(task)
                }
              }}
              onDragEnd={async (e)=>{
                setActiveTask(null)
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

          <div className="overflow-x-auto px-4 md:px-5 xl:px-6 mt-6 lg:mt-8">
            <div className="flex gap-4 md:gap-6 pb-6 min-h-[500px]">
              {columns.map(col => (
                <SortableColumnItem id={col.id} key={col.id}>
                  <Card className="min-w-[320px] w-[320px] min-h-[240px]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
                      <CardTitle className="text-base flex items-center gap-2 w-full">
                        <span className="block w-full whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px]">{col.name}</span>
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
                    <CardContent className="space-y-2 min-h-[200px] p-4">
                      <ColumnDroppable id={`column-${col.id}`}>
                        <div className="min-h-[180px] w-full">
                          <SortableList ids={(tasksByColumn[col.id] || []).map(t=>t.id)}>
                            {(tasksByColumn[col.id] || []).map(t=> (
                              <SortableTask id={t.id} key={t.id}>
                                {renderTaskCard(t)}
                              </SortableTask>
                            ))}
                          </SortableList>
                          {(tasksByColumn[col.id] || []).length === 0 && (
                            <div className="text-center text-muted-foreground text-sm py-8 min-h-[120px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg transition-all duration-200 hover:border-primary/50 hover:bg-primary/5" data-testid={`drop-zone-${col.id}`}>
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                  <span className="text-lg">📋</span>
                                </div>
                                <span>Arraste tarefas aqui</span>
                              </div>
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

          <DragOverlay>
            {activeTask ? (
              <div className="transform rotate-3 scale-105 shadow-2xl">
                {renderTaskCard(activeTask)}
              </div>
            ) : null}
          </DragOverlay>

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
      {/* Dialog Configurar Quadro */}
      <Dialog open={isBoardSettingsOpen} onOpenChange={setBoardSettingsOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Configurar Quadro</DialogTitle>
          </DialogHeader>
          {boardId ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Renomear quadro</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Nome do quadro"
                    value={boards.find(b=>b.id===boardId)?.name || ''}
                    onChange={(e)=>{
                      const name = e.target.value
                      setBoards(prev=> prev.map(b=> b.id===boardId ? { ...b, name } as Board : b))
                    }}
                  />
                  <Button onClick={async()=>{
                    const b = boards.find(b=>b.id===boardId)
                    if (!b) return
                    const { error } = await supabase.from('boards').update({ name: b.name }).eq('id', boardId)
                    if (error) return toast({ variant:'destructive', title:'Erro', description: error.message })
                    toast({ title:'Nome atualizado' })
                  }}>Salvar</Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-xs text-muted-foreground">Descrição</label>
                <Textarea
                  placeholder="Descrição do quadro"
                  value={boards.find(b=>b.id===boardId)?.description || ''}
                  onChange={(e)=>{
                    const description = e.target.value
                    setBoards(prev=> prev.map(b=> b.id===boardId ? { ...b, description } as Board : b))
                  }}
                />
                <div className="mt-2">
                  <Button variant="outline" onClick={async()=>{
                    const b = boards.find(b=>b.id===boardId)
                    if (!b) return
                    const { error } = await supabase.from('boards').update({ description: b.description }).eq('id', boardId)
                    if (error) return toast({ variant:'destructive', title:'Erro', description: error.message })
                    toast({ title:'Descrição atualizada' })
                  }}>Salvar descrição</Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-xs text-muted-foreground">Arquivar quadro</label>
                <p className="text-xs text-muted-foreground">Isto oculta o quadro da lista principal. Você pode reativá-lo depois.</p>
                <div className="flex gap-2 mt-2">
                  <Button variant="destructive" onClick={async()=>{
                    if (!confirm('Arquivar este quadro?')) return
                    const { error } = await supabase.from('boards').update({ is_archived: true }).eq('id', boardId)
                    if (error) return toast({ variant:'destructive', title:'Erro', description: error.message })
                    toast({ title:'Quadro arquivado' })
                    setBoardSettingsOpen(false)
                    // Recarregar lista de quadros
                    const { data } = await supabase.from('boards').select('*').order('created_at', { ascending: true })
                    setBoards(data || [])
                  }}>Arquivar Quadro</Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-xs text-muted-foreground">Tags do quadro</label>
                <p className="text-xs text-muted-foreground">Use cores para organizar. (Armazenado em boards.settings.labels)</p>
                <BoardLabelsEditor
                  board={boards.find(b=>b.id===boardId)!}
                  onSave={async (labels)=>{
                    const b = boards.find(b=>b.id===boardId)
                    if (!b) return
                    const settings = { ...(b.settings||{}), labels }
                    const { error } = await supabase.from('boards').update({ settings }).eq('id', boardId)
                    if (error) return toast({ variant:'destructive', title:'Erro', description: error.message })
                    setBoards(prev=> prev.map(x=> x.id===boardId ? { ...x, settings } as Board : x))
                    toast({ title:'Tags salvas' })
                  }}
                />
              </div>
            </div>
          ) : (
            <div>Selecione um quadro.</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={()=>setBoardSettingsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

        {/* Dialog Tarefa Avançado */}
        <Dialog open={isTaskDialogOpen} onOpenChange={(o)=> {
          setTaskDialogOpen(o);
          if (!o) {
            setEditingTask(null)
            setTaskForm({ title: '', description: '', start_date: '', end_date: '', priority: 'media' })
            setSelectedMembers([])
            setSelectedLabels([])
            setTaskFiles([])
            setNewComment('')
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                {editingTask?.id ? 'Editar Tarefa' : 'Nova Tarefa'}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTaskDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna Principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Título */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Título da Tarefa *</label>
                  <Input
                    placeholder="Digite o título da tarefa..."
                    value={editingTask?.title || taskForm.title}
                    onChange={e => {
                      const value = e.target.value
                      if (editingTask) {
                        setEditingTask({...editingTask, title: value})
                      } else {
                        setTaskForm(prev => ({...prev, title: value}))
                      }
                    }}
                    className="text-lg"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Descrição</label>
                  <RichTextEditor
                    value={editingTask?.description || taskForm.description}
                    onChange={(value) => {
                      if (editingTask) {
                        setEditingTask({...editingTask, description: value})
                      } else {
                        setTaskForm(prev => ({...prev, description: value}))
                      }
                    }}
                    placeholder="Descreva os detalhes da tarefa..."
                  />
                </div>

                {/* Checklist Avançado */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">Checklist</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newChecklist = {
                          id: Math.random().toString(36).substr(2, 9),
                          task_id: editingTask?.id || '',
                          title: 'Nova Lista',
                          position: checklists.length
                        }
                        setChecklists(prev => [...prev, newChecklist])
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nova Lista
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {checklists.map((checklist, checklistIndex) => (
                      <div key={checklist.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Input
                            value={checklist.title}
                            onChange={(e) => {
                              const updatedChecklists = [...checklists]
                              updatedChecklists[checklistIndex].title = e.target.value
                              setChecklists(updatedChecklists)
                            }}
                            className="font-medium border-none p-0 h-auto focus-visible:ring-0"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setChecklists(prev => prev.filter(c => c.id !== checklist.id))
                              setChecklistItems(prev => prev.filter(i => i.checklist_id !== checklist.id))
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {checklistItems
                            .filter(item => item.checklist_id === checklist.id)
                            .map((item, itemIndex) => (
                              <div key={item.id} className="flex items-center gap-3 p-2 border rounded">
                                <input
                                  type="checkbox"
                                  checked={item.is_done}
                                  onChange={(e) => {
                                    const updatedItems = [...checklistItems]
                                    const globalIndex = updatedItems.findIndex(i => i.id === item.id)
                                    if (globalIndex !== -1) {
                                      updatedItems[globalIndex].is_done = e.target.checked
                                      setChecklistItems(updatedItems)
                                    }
                                  }}
                                  className="rounded"
                                />
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <Input
                                    value={item.title}
                                    onChange={(e) => {
                                      const updatedItems = [...checklistItems]
                                      const globalIndex = updatedItems.findIndex(i => i.id === item.id)
                                      if (globalIndex !== -1) {
                                        updatedItems[globalIndex].title = e.target.value
                                        setChecklistItems(updatedItems)
                                      }
                                    }}
                                    placeholder="Descrição do item..."
                                    className={item.is_done ? 'line-through text-muted-foreground' : ''}
                                  />
                                  <div>
                                    <label className="text-xs text-muted-foreground">Início</label>
                                    <Input
                                      type="datetime-local"
                                      value={item.start_date ? new Date(item.start_date).toISOString().slice(0, 16) : ''}
                                      onChange={(e) => {
                                        const updatedItems = [...checklistItems]
                                        const globalIndex = updatedItems.findIndex(i => i.id === item.id)
                                        if (globalIndex !== -1) {
                                          updatedItems[globalIndex].start_date = e.target.value ? new Date(e.target.value).toISOString() : null
                                          setChecklistItems(updatedItems)
                                        }
                                      }}
                                      className="text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-muted-foreground">Término</label>
                                    <Input
                                      type="datetime-local"
                                      value={item.end_date ? new Date(item.end_date).toISOString().slice(0, 16) : ''}
                                      onChange={(e) => {
                                        const updatedItems = [...checklistItems]
                                        const globalIndex = updatedItems.findIndex(i => i.id === item.id)
                                        if (globalIndex !== -1) {
                                          updatedItems[globalIndex].end_date = e.target.value ? new Date(e.target.value).toISOString() : null
                                          setChecklistItems(updatedItems)
                                        }
                                      }}
                                      className="text-xs"
                                    />
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setChecklistItems(prev => prev.filter(i => i.id !== item.id))
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newItem = {
                                id: Math.random().toString(36).substr(2, 9),
                                checklist_id: checklist.id,
                                title: '',
                                is_done: false,
                                start_date: null,
                                end_date: null,
                                position: checklistItems.filter(i => i.checklist_id === checklist.id).length
                              }
                              setChecklistItems(prev => [...prev, newItem])
                            }}
                            className="w-full border-dashed border-2"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Item
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Anexos */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Anexos</label>
                  <FileUpload
                    onFilesChange={setTaskFiles}
                    existingFiles={taskFiles}
                    maxFiles={10}
                    maxSize={10}
                  />
                </div>
              </div>

              {/* Coluna Lateral */}
              <div className="space-y-6">
                {/* Datas */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Datas e Horários</label>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Data/Hora de Início</label>
                      <Input
                        type="datetime-local"
                        value={editingTask?.start_at ? new Date(editingTask.start_at).toISOString().slice(0, 16) : taskForm.start_date}
                        onChange={e => {
                          const value = e.target.value
                          if (editingTask) {
                            setEditingTask({...editingTask, start_at: value ? new Date(value).toISOString() : null})
                          } else {
                            setTaskForm(prev => ({...prev, start_date: value}))
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Data/Hora de Término</label>
                      <Input
                        type="datetime-local"
                        value={editingTask?.end_at ? new Date(editingTask.end_at).toISOString().slice(0, 16) : taskForm.end_date}
                        onChange={e => {
                          const value = e.target.value
                          if (editingTask) {
                            setEditingTask({...editingTask, end_at: value ? new Date(value).toISOString() : null})
                          } else {
                            setTaskForm(prev => ({...prev, end_date: value}))
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Prioridade */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Prioridade</label>
                  <Select
                    value={editingTask?.priority || taskForm.priority}
                    onValueChange={(v) => {
                      const priority = v as Task['priority']
                      if (editingTask) {
                        setEditingTask({...editingTask, priority})
                      } else {
                        setTaskForm(prev => ({...prev, priority}))
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(p => (
                        <SelectItem key={p} value={p}>
                          <div className="flex items-center gap-2">
                            {priorityBadge(p)}
                            <span className="capitalize">{p}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Membros */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Membros da Tarefa</label>
                  <div className="space-y-3">
                    <Select
                      value=""
                      onValueChange={(userId) => {
                        if (!selectedMembers.includes(userId)) {
                          setSelectedMembers(prev => [...prev, userId])
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Adicionar membro..." />
                      </SelectTrigger>
                      <SelectContent>
                        {userProfiles
                          .filter(profile => !selectedMembers.includes(profile.id))
                          .map(profile => (
                            <SelectItem key={profile.id} value={profile.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                  {(profile.first_name?.[0] || profile.email?.[0] || '?').toUpperCase()}
                                </div>
                                <span>{profile.first_name || profile.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {selectedMembers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedMembers.map(userId => {
                          const profile = userProfiles.find(p => p.id === userId)
                          return (
                            <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                                {(profile?.first_name?.[0] || profile?.email?.[0] || '?').toUpperCase()}
                              </div>
                              <span className="text-xs">{profile?.first_name || profile?.email}</span>
                              <button
                                onClick={() => setSelectedMembers(prev => prev.filter(id => id !== userId))}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Etiquetas */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Etiquetas</label>
                  <div className="space-y-3">
                    <Select
                      value=""
                      onValueChange={(labelId) => {
                        if (!selectedLabels.includes(labelId)) {
                          setSelectedLabels(prev => [...prev, labelId])
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Adicionar etiqueta..." />
                      </SelectTrigger>
                      <SelectContent>
                        {taskLabels
                          .filter(label => !selectedLabels.includes(label.id))
                          .map(label => (
                            <SelectItem key={label.id} value={label.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: label.color }}
                                />
                                <span>{label.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {/* Criar nova etiqueta */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nova etiqueta..."
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        className="flex-1"
                      />
                      <input
                        type="color"
                        value={newLabelColor}
                        onChange={(e) => setNewLabelColor(e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={async () => {
                          if (!newLabelName.trim() || !boardId) return

                          try {
                            const { data, error } = await supabase
                              .from('task_labels')
                              .insert({
                                name: newLabelName.trim(),
                                color: newLabelColor,
                                board_id: boardId
                              })
                              .select()
                              .single()

                            if (error) throw error

                            setTaskLabels(prev => [...prev, data])
                            setNewLabelName('')
                            setNewLabelColor('#3b82f6')
                            toast({ title: 'Etiqueta criada com sucesso!' })
                          } catch (error: any) {
                            toast({
                              variant: 'destructive',
                              title: 'Erro ao criar etiqueta',
                              description: error.message
                            })
                          }
                        }}
                        disabled={!newLabelName.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {selectedLabels.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedLabels.map(labelId => {
                          const label = taskLabels.find(l => l.id === labelId)
                          if (!label) return null
                          return (
                            <Badge
                              key={labelId}
                              className="flex items-center gap-1"
                              style={{ backgroundColor: label.color, color: 'white' }}
                            >
                              <span className="text-xs">{label.name}</span>
                              <button
                                onClick={() => setSelectedLabels(prev => prev.filter(id => id !== labelId))}
                                className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção de Comentários e Atividades */}
            {editingTask?.id && (
              <div className="mt-6 border-t pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Comentários */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="h-4 w-4" />
                      <h3 className="font-medium">Comentários</h3>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                      {comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {userProfiles.find(p => p.id === comment.user_id)?.first_name?.[0] || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {userProfiles.find(p => p.id === comment.user_id)?.first_name || 'Usuário'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Escrever um comentário..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && newComment.trim() && editingTask?.id) {
                            try {
                              const { error } = await supabase
                                .from('task_comments')
                                .insert({
                                  task_id: editingTask.id,
                                  user_id: user?.id,
                                  content: newComment.trim()
                                })

                              if (error) throw error

                              setNewComment('')
                              if (editingTask.id) loadTaskDetails(editingTask.id)
                              toast({ title: 'Comentário adicionado!' })
                            } catch (error: any) {
                              toast({
                                variant: 'destructive',
                                title: 'Erro ao adicionar comentário',
                                description: error.message
                              })
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={async () => {
                          if (!newComment.trim() || !editingTask?.id) return

                          try {
                            const { error } = await supabase
                              .from('task_comments')
                              .insert({
                                task_id: editingTask.id,
                                user_id: user?.id,
                                content: newComment.trim()
                              })

                            if (error) throw error

                            setNewComment('')
                            if (editingTask.id) loadTaskDetails(editingTask.id)
                            toast({ title: 'Comentário adicionado!' })
                          } catch (error: any) {
                            toast({
                              variant: 'destructive',
                              title: 'Erro ao adicionar comentário',
                              description: error.message
                            })
                          }
                        }}
                        disabled={!newComment.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Atividades */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="h-4 w-4" />
                      <h3 className="font-medium">Atividades</h3>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {taskActivities
                        .filter(activity => activity.task_id === editingTask.id)
                        .map(activity => (
                          <div key={activity.id} className="flex gap-3 p-2 text-sm">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <Activity className="h-3 w-3" />
                            </div>
                            <div className="flex-1">
                              <p>
                                <span className="font-medium">
                                  {userProfiles.find(p => p.id === activity.user_id)?.first_name || 'Sistema'}
                                </span>
                                {' '}
                                <span>{activity.action}</span>
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {new Date(activity.created_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer com ações */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {editingTask?.id && (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Criado em {new Date(editingTask.created_at || '').toLocaleDateString('pt-BR')}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {editingTask?.id && (
                  <Button
                    variant="outline"
                    onClick={() => deleteTask(editingTask)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setTaskDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={saveTask}>
                  <Save className="h-4 w-4 mr-1" />
                  {editingTask?.id ? 'Atualizar' : 'Criar'} Tarefa
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
    </Layout>
  )
}

