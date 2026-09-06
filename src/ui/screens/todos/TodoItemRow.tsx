import type { KeyboardEvent } from 'react'
import { formatCompletedLabel, formatDueLabel } from '@/domain/format/dueLabel'
import type { EntityId } from '@/domain/schemas/primitives'
import { classifyDue, type TodoGroupingContext } from '@/domain/todos/todoGrouping'
import type { TodoRow } from '@/domain/todos/todoRow'
import { Badge } from '@/ui/primitives/Badge'
import { Checkbox } from '@/ui/primitives/Checkbox'
import { classNames } from '@/ui/primitives/classNames'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { PriorityBadge } from '@/ui/primitives/PriorityBadge'

const WITHOUT_PROJECT = 'sem projeto'

type TodoItemRowProps = {
  row: TodoRow
  context: TodoGroupingContext
  registerRef: (id: EntityId, element: HTMLDivElement | null) => void
  onToggle: (id: EntityId) => void
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

export function TodoItemRow({
  row,
  context,
  registerRef,
  onToggle,
  onKeyDown,
}: TodoItemRowProps) {
  const { todo } = row
  const isDone = todo.status === 'done'

  return (
    <div
      role="listitem"
      ref={(element) => registerRef(todo.id, element)}
      onKeyDown={(event) => onKeyDown(event, todo.id)}
      className="grid grid-cols-[24px_1fr_auto_auto_auto] items-center gap-2.5 border-b border-border px-3 py-2 last:border-b-0 hover:bg-sunken"
    >
      <Checkbox
        boxSize="large"
        checked={isDone}
        aria-label={todo.title}
        onChange={() => onToggle(todo.id)}
      />

      <span
        className={classNames(
          'truncate text-body',
          isDone ? 'text-text3 line-through' : 'text-text',
        )}
      >
        {todo.title}
      </span>

      <span className="flex gap-1">
        {row.tags.map((tag) => (
          <Badge key={tag.id} variant="outline" size="small" weight="normal">
            {tag.name}
          </Badge>
        ))}
      </span>

      <span
        className={classNames(
          'inline-flex items-center gap-[5px] whitespace-nowrap text-label font-normal tracking-normal',
          row.project === null ? 'text-text3' : 'text-text2',
        )}
      >
        {row.project !== null && (
          <span
            style={row.phase === null ? undefined : phaseColorStyle(row.phase.color)}
            className={classNames(
              'h-[11px] w-[3px] flex-none rounded-[2px]',
              row.phase === null ? 'bg-border-strong' : 'phase-tinted bg-[var(--phase-tone)]',
            )}
          />
        )}
        {row.project?.name ?? WITHOUT_PROJECT}
      </span>

      <span className="inline-flex items-center gap-2">
        <PriorityBadge
          priority={todo.priority}
          variant="pill"
          scale="graded"
          size="small"
          muted={isDone}
        />
        <span
          className={classNames(
            'min-w-[52px] text-right font-mono text-label font-normal tabular-nums tracking-normal',
            toDueClassName(row, context),
          )}
        >
          {isDone
            ? formatCompletedLabel(todo.completedAt, context.today)
            : formatDueLabel(todo.dueDate, context.today)}
        </span>
      </span>
    </div>
  )
}
