import type { KeyboardEvent } from 'react'
import { formatCompletedLabel, formatDueLabel } from '@/domain/format/dueLabel'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { DueTodoRow } from '@/domain/today/todayAgenda'
import { Checkbox } from '@/ui/primitives/Checkbox'
import { classNames } from '@/ui/primitives/classNames'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { PriorityBadge } from '@/ui/primitives/PriorityBadge'
import type { TodoRowFocus } from '../todos/useTodoRowFocus'

const WITHOUT_PROJECT = 'sem projeto'

type DueTodayListProps = {
  rows: readonly DueTodoRow[]
  today: IsoDate
  rowFocus: TodoRowFocus
  onToggle: (todoId: EntityId) => void
  onRowKeyDown: (event: KeyboardEvent<HTMLElement>, todoId: EntityId) => void
}

function toDueClassName(row: DueTodoRow, today: IsoDate): string {
  if (row.todo.status === 'done') {
    return 'text-text3'
  }

  if (row.todo.dueDate !== null && row.todo.dueDate < today) {
    return 'text-danger'
  }

  return 'text-text2'
}

export function DueTodayList({
  rows,
  today,
  rowFocus,
  onToggle,
  onRowKeyDown,
}: DueTodayListProps) {
  return (
    <div
      role="list"
      className="overflow-hidden rounded-card border border-border bg-panel"
    >
      {rows.map((row) => {
        const isDone = row.todo.status === 'done'

        return (
          <div
            key={row.todo.id}
            role="listitem"
            ref={(element) => rowFocus.registerRef(row.todo.id, element)}
            onKeyDown={(event) => onRowKeyDown(event, row.todo.id)}
            className="grid grid-cols-[22px_1fr_auto_auto_auto] items-center gap-2.5 border-b border-border px-3 py-2 last:border-b-0 hover:bg-sunken"
          >
            <Checkbox
              checked={isDone}
              aria-label={row.todo.title}
              onChange={() => onToggle(row.todo.id)}
            />

            <span
              className={classNames(
                'truncate text-body',
                isDone ? 'text-text3 line-through' : 'text-text',
              )}
            >
              {row.todo.title}
            </span>

            <span
              className={classNames(
                'inline-flex items-center gap-[5px] whitespace-nowrap text-label font-normal tracking-normal',
                row.project === null || isDone ? 'text-text3' : 'text-text2',
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

            <PriorityBadge
              priority={row.todo.priority}
              variant="pill"
              scale="graded"
              size="small"
              muted={isDone}
            />

            <span
              className={classNames(
                'min-w-[44px] text-right font-mono text-label font-normal tabular-nums tracking-normal',
                toDueClassName(row, today),
              )}
            >
              {isDone
                ? formatCompletedLabel(row.todo.completedAt, today)
                : formatDueLabel(row.todo.dueDate, today)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
