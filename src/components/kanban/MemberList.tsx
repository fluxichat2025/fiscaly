import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'

type Row = { user_id: string; role: 'owner' | 'member'; first_name?: string; email?: string }

export default function MemberList({ boardId }: { boardId: string }) {
  const [rows, setRows] = useState<Row[]>([])

  const load = async () => {
    const { data } = await supabase
      .from('board_members')
      .select('user_id, role, profiles(first_name,email)')
      .eq('board_id', boardId)
    const mapped = (data||[]).map((r: any) => ({ user_id: r.user_id, role: r.role, first_name: r.profiles?.first_name, email: r.profiles?.email }))
    setRows(mapped)
  }

  useEffect(() => { load() }, [boardId])

  const removeMember = async (uid: string) => {
    await supabase.from('board_members').delete().eq('board_id', boardId).eq('user_id', uid)
    load()
  }

  return (
    <div className="mt-2 space-y-1">
      {rows.map(r => (
        <div key={r.user_id} className="flex items-center justify-between text-sm">
          <div>
            <span className="font-medium">{r.first_name || r.email}</span>
            <span className="text-muted-foreground ml-2">({r.role})</span>
          </div>
          <Button variant="outline" onClick={()=>removeMember(r.user_id)}>Remover</Button>
        </div>
      ))}
      {rows.length===0 && <div className="text-sm text-muted-foreground">Nenhum membro</div>}
    </div>
  )
}

