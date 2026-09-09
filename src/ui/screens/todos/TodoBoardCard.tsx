import type { DragEvent, KeyboardEvent } from 'react'
import { formatCompletedLabel, formatDueLabel } from '@/domain/format/dueLabel'
import type { EntityId } from '@/domain/schemas/primitives'
import { classifyDue, type TodoGroupingContext } from '@/domain/todos/todoGrouping'
import type { TodoRow } from '@/domain/todos/todoRow'
import { Badge } from '@/ui/primitives/Badge'
import { Checkbox } from '@/ui/primitives/Checkbox'
import { classNames } from '@/ui/primitives/classNames'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { PriorityBadge } from '@/ui/primitives/PriorityBadge'
import { TodoStatusBadge } from './TodoStatusBadge'

const PRIORITY_EDGE_CLASSES: Record<string, string> = {
  P0: 'border-l-danger',
  P1: 'border-l-warn',
  P2: 'border-l-border-strong',
  P3: 'border-l-border-strong',
}

type TodoBoardCardProps = {
  row: TodoRow
  context: TodoGroupingContext
  showStatus: boolean
  isDragging: boolean
  draggable: boolean
  registerRef: (id: EntityId, element: HTMLDivElement | null) => void
  onDragStart: (event: DragEvent<HTMLElement>, id: EntityId) => void
  onDragEnd: () => void
  onToggle: (id: EntityId) => void
  onEdit: (id: EntityId) => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>, id: EntityId) => void
}

function toDueClassName(row: TodoRow, context: TodoGroupingContext): string {
  if (row.todo.status === 'done') {
    return 'text-text3'
  }

  const bucket = classifyDue(row.todo.dueDate, context)

  if (bucket === 'late') {
    return 'text-danger'
  }

  return bucket === 'today' ? 'text-text' : 'text-text2'
}

export function TodoBoardCard({
  row,
  context,
  showStatus,
  isDragging,
  draggable,
  registerRef,
  onDragStart,
  onDragEnd,
  onToggle,
  onEdit,
  onKeyDown,
}: TodoBoardCardProps) {
  const { todo } = row
  const isDone = todo.status === 'done'

  return (
    <div
      role="listitem"
      draggable={draggable}
      ref={(element) => registerRef(todo.id, element)}
      onDragStart={(event) => onDragStart(event, todo.id)}
      onDragEnd={onDragEnd}
      onKeyDown={(event) => onKeyDown(event, todo.id)}
      className={classNames(
        'grid gap-[7px] rounded-card border border-l-[3px] border-border bg-panel px-2.5 py-[9px] shadow-card hover:border-border-strong',
        PRIORITY_EDGE_CLASSES[todo.priority] ?? 'border-l-border-strong',
        draggable ? 'cursor-grab' : '',
        isDragging ? 'opacity-45' : '',
      )}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          className="mt-px"
          boxSize="large"
          checked={isDone}
          aria-label={todo.title}
          onChange={() => onToggle(todo.id)}
        />

        {/* O foco do cartão mora na caixa de marcar, como na linha da lista: o título não
            entra na ordem do Tab e quem navega pelo teclado edita pelo E. */}
        <button
          type="button"
          tabIndex={-1}
          title={`Editar ${todo.title}`}
          onClick={() => onEdit(todo.id)}
          className={classNames(
            'text-pretty text-left text-support leading-[1.35] hover:underline',
            isDone ? 'text-text3 line-through' : 'text-text',
          )}
        >
          {todo.title}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge
          priority={todo.priority}
          variant="pill"
          scale="graded"
          size="small"
          muted={isDone}
        />
        {showStatus && <TodoStatusBadge status={todo.status} />}
        {row.tags.map((tag) => (
          <Badge key={tag.id} variant="outline" size="small" weight="normal">
            {tag.name}
          </Badge>
        ))}
        <span
          className={classNames(
            'ml-auto font-mono text-label font-normal tabular-nums tracking-normal',
            toDueClassName(row, context),
          )}
        >
          {isDone
            ? formatCompletedLabel(todo.completedAt, context.today)
            : formatDueLabel(todo.dueDate, context.today)}
        </span>
      </div>

      {row.project !== null && (
        <div className="flex items-center gap-1.5 border-t border-border pt-1.5">
          <span
            style={row.phase === null ? undefined : phaseColorStyle(row.phase.color)}
            className={classNames(
              'h-[11px] w-[3px] flex-none rounded-[2px]',
              row.phase === null ? 'bg-border-strong' : 'phase-tinted bg-[var(--phase-tone)]',
            )}
          />
          <span className="truncate text-label font-normal tracking-normal text-text2">
            {row.project.name}
          </span>
        </div>
      )}
    </div>
  )
}
