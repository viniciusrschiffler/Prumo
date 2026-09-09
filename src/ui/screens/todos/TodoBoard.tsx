import { useState, type DragEvent, type KeyboardEvent } from 'react'
import type { EntityId } from '@/domain/schemas/primitives'
import type { TodoBoardColumn as BoardColumn, TodoBoardDrop } from '@/domain/todos/todoBoard'
import type { TodoGroupingContext } from '@/domain/todos/todoGrouping'
import { AddButton } from '@/ui/primitives/AddButton'
import { buildGroupHeader } from './todoGroupStyles'
import { TodoBoardCard } from './TodoBoardCard'
import { TodoBoardColumn } from './TodoBoardColumn'
import type { TodoRowFocus } from './useTodoRowFocus'

const DRAG_MIME = 'text/plain'

type TodoBoardProps = {
  columns: readonly BoardColumn[]
  context: TodoGroupingContext
  showStatus: boolean
  rowFocus: TodoRowFocus
  onDrop: (todoId: EntityId, drop: TodoBoardDrop) => void
  onAdd: (drop: TodoBoardDrop | null) => void
  onToggle: (todoId: EntityId) => void
  onEdit: (todoId: EntityId) => void
  onRowKeyDown: (event: KeyboardEvent<HTMLElement>, todoId: EntityId) => void
}

export function TodoBoard({
  columns,
  context,
  showStatus,
  rowFocus,
  onDrop,
  onAdd,
  onToggle,
  onEdit,
  onRowKeyDown,
}: TodoBoardProps) {
  const [draggingId, setDraggingId] = useState<EntityId | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  function handleDragStart(event: DragEvent<HTMLElement>, todoId: EntityId) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(DRAG_MIME, todoId)
    setDraggingId(todoId)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setOverColumnId(null)
  }

  return (
    <div className="flex h-full min-h-0 items-stretch gap-3 overflow-x-auto px-5 pb-5 pt-3.5">
      {columns.map((column) => {
        const header = buildGroupHeader(column.group, context)
        const { drop } = column

        return (
          <TodoBoardColumn
            key={column.group.id}
            title={header.title}
            count={column.group.items.length}
            tone={header.tone}
            titleTone={header.titleTone}
            phaseColor={header.phaseColor}
            isDropTarget={drop !== null}
            isOver={overColumnId === column.group.id}
            onDragOver={(event) => {
              if (drop === null || draggingId === null) {
                return
              }

              // Sem o preventDefault o navegador recusa a soltura e o onDrop nunca chega.
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              setOverColumnId(column.group.id)
            }}
            onDragLeave={(event) => {
              // O ponteiro atravessa os filhos da coluna o tempo todo; só a saída real conta.
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                return
              }

              setOverColumnId((current) => (current === column.group.id ? null : current))
            }}
            onDrop={(event) => {
              event.preventDefault()

              const todoId = event.dataTransfer.getData(DRAG_MIME) || draggingId

              handleDragEnd()

              if (drop !== null && todoId !== '' && todoId !== null) {
                onDrop(todoId, drop)
              }
            }}
            footer={
              <AddButton size="medium" centered onClick={() => onAdd(drop)}>
                + Novo item
              </AddButton>
            }
          >
            {column.group.items.map((row) => (
              <TodoBoardCard
                key={row.todo.id}
                row={row}
                context={context}
                showStatus={showStatus}
                draggable={drop !== null || columns.some((other) => other.drop !== null)}
                isDragging={draggingId === row.todo.id}
                registerRef={rowFocus.registerRef}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onToggle={onToggle}
                onEdit={onEdit}
                onKeyDown={onRowKeyDown}
              />
            ))}
          </TodoBoardColumn>
        )
      })}
    </div>
  )
}
