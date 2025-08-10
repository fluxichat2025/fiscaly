import { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'

type Props = { id: string; children: ReactNode }

export default function ColumnDroppable({ id, children }: Props) {
  // Extract column ID from the prefixed ID (column-{columnId})
  const columnId = id.startsWith('column-') ? id.replace('column-', '') : id
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'column', columnId } })
  return (
    <div ref={setNodeRef} className={isOver ? 'ring-2 ring-primary rounded-md' : ''}>
      {children}
    </div>
  )
}

