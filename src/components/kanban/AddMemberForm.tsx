import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export default function AddMemberForm({ boardId }: { boardId: string }) {
  const [profiles, setProfiles] = useState<Array<{ user_id: string; first_name: string; email: string }>>([])
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<'member' | 'owner'>('member')

  useEffect(() => {
    supabase.from('profiles').select('user_id, first_name, email').then(({ data }) => setProfiles(data || []))
  }, [])

  const add = async () => {
    if (!userId) return
    await supabase.from('board_members').insert({ board_id: boardId, user_id: userId, role })
    setUserId('')
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={userId} onValueChange={setUserId}>
        <SelectTrigger className="w-[240px]"><SelectValue placeholder="Selecionar usuário" /></SelectTrigger>
        <SelectContent>
          {profiles.map(p=> <SelectItem key={p.user_id} value={p.user_id}>{p.first_name || p.email}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={role} onValueChange={(v)=> setRole(v as any)}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Papel" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="member">Membro</SelectItem>
          <SelectItem value="owner">Dono</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={add}>Adicionar</Button>
    </div>
  )
}

