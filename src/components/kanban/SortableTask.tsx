import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ReactNode } from 'react'

type Props = {
  id: string
  children: ReactNode
}

export default function SortableTask({ id, children }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id,
    data: { type: 'task' }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    zIndex: isDragging ? 1000 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'shadow-lg scale-105 rotate-2' : ''} transition-all duration-200`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

