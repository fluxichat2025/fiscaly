import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TemplateList({ onCreate }: { onCreate: (templateId: string) => void }) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Array<{ id: string; name: string; description?: string }>>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('board_templates').select('id,name,description').order('name')
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Carregando modelos...</div>

  if (!items.length) return <div className="p-4 text-sm text-muted-foreground">Nenhum modelo disponível</div>

  return (
    <div className="grid grid-cols-1 gap-2">
      {items.map(t => (
        <Card key={t.id}>
          <CardHeader className="pb-2"><CardTitle className="text-base">{t.name}</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground flex items-center justify-between">
            <span>{t.description}</span>
            <Button onClick={() => onCreate(t.id)}>Criar a partir deste</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

