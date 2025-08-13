import { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'

type Props = { id: string; children: ReactNode }

export default function ColumnDroppable({ id, children }: Props) {
  // Extract column ID from the prefixed ID (column-{columnId})
  const columnId = id.startsWith('column-') ? id.replace('column-', '') : id
  const { setNodeRef, isOver, active } = useDroppable({
    id,
    data: { type: 'column', columnId }
  })

  const isDraggingTask = active?.data?.current?.type === 'task'

  return (
    <div
      ref={setNodeRef}
      className={`
        transition-all duration-200 ease-in-out
        ${isOver && isDraggingTask ? 'ring-2 ring-primary bg-primary/5 rounded-md' : ''}
        ${isOver && isDraggingTask ? 'scale-[1.02]' : ''}
      `}
    >
      {children}
    </div>
  )
}

