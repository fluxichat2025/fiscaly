import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Task {
  id: string
  title: string
  description?: string
  priority: string
  status: string
  due_date?: string
  created_at: string
  column: {
    name: string
    color?: string
  }
  board: {
    name: string
  }
}

interface TasksWidgetProps {
  limit?: number
}

export function TasksWidget({ limit = 5 }: TasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchRecentTasks()
      
      // Realtime para atualizações instantâneas - apenas boards do usuário
      const channel = supabase.channel(`dashboard-tasks-${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tasks'
        }, (payload) => {
          console.log('Dashboard task change:', payload)
          fetchRecentTasks() // Refetch para garantir filtros corretos
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'board_columns'
        }, () => {
          fetchRecentTasks() // Refetch quando colunas mudam
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'boards'
        }, () => {
          fetchRecentTasks() // Refetch quando boards mudam
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [user])

  const fetchRecentTasks = async () => {
    try {
      if (!user) return

      // Buscar tarefas dos boards que o usuário possui ou tem acesso
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          priority,
          status,
          due_date,
          created_at,
          board_id,
          column_id,
          board_columns!inner(name, color, board_id),
          boards!inner(name, owner_id)
        `)
        .eq('is_archived', false)
        .eq('boards.owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Transformar os dados para o formato esperado
      const transformedTasks = (data || []).map(task => ({
        ...task,
        column: {
          name: task.board_columns?.name || 'Sem coluna',
          color: task.board_columns?.color
        },
        board: {
          name: task.boards?.name || 'Sem board'
        }
      }))

      setTasks(transformedTasks)
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'baixa': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'concluida': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'em_andamento': return <Clock className="h-4 w-4 text-blue-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Tarefas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Tarefas Recentes
        </CardTitle>
        <Link to="/tarefas">
          <Button variant="outline" size="sm">
            Ver todas
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nenhuma tarefa encontrada</p>
            <Link to="/tarefas">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira tarefa
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm truncate">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {task.board?.name}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.column?.name}
                        </Badge>
                        {task.priority && (
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex-shrink-0">
                      {task.due_date ? formatDate(task.due_date) : formatDate(task.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
