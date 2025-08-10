import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, Over } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { ReactNode } from 'react'

export function SortableList({ ids, children }: { ids: string[]; children: ReactNode }) {
  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  )
}

type Props = {
  ids: string[]
  onDragEnd: (activeId: string, overId: string | null, overContainerId?: string | null) => void
  onDragOverContainer?: (over: Over | null) => void
  containerId?: string
  children: ReactNode
}

export function SortableColumn({ ids, onDragEnd, children, onDragOverContainer, containerId }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )
  const handleDragEnd = (e: DragEndEvent) => {
    onDragEnd(String(e.active?.id), e.over ? String(e.over.id) : null, e.over?.id ? String(e.over.id) : null)
  }
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragOver={(e)=> onDragOverContainer?.(e.over)}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay />
    </DndContext>
  )
}

export function SortableRow({ ids, children }: { ids: string[]; children: ReactNode }) {
  return (
    <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
      {children}
    </SortableContext>
  )
}

