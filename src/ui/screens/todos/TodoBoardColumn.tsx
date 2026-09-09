import type { DragEvent, ReactNode } from 'react'
import { classNames } from '@/ui/primitives/classNames'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import type { TodoGroupTitleTone, TodoGroupTone } from './TodoGroupSection'

const SQUARE_CLASSES: Record<TodoGroupTone, string> = {
  danger: 'bg-danger',
  accent: 'bg-accent',
  ok: 'bg-ok',
  warn: 'bg-warn',
  info: 'bg-info',
  neutral: 'bg-border-strong',
  phase: 'phase-tinted bg-[var(--phase-tone)]',
}

const TITLE_CLASSES: Record<TodoGroupTitleTone, string> = {
  default: 'text-text',
  muted: 'text-text2',
  danger: 'text-danger',
  ok: 'text-ok',
  info: 'text-info',
}

type TodoBoardColumnProps = {
  title: string
  count: number
  tone: TodoGroupTone
  titleTone: TodoGroupTitleTone
  phaseColor: string | null
  isDropTarget: boolean
  isOver: boolean
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDragLeave: (event: DragEvent<HTMLElement>) => void
  onDrop: (event: DragEvent<HTMLElement>) => void
  footer?: ReactNode
  children: ReactNode
}

export function TodoBoardColumn({
  title,
  count,
  tone,
  titleTone,
  phaseColor,
  isDropTarget,
  isOver,
  onDragOver,
  onDragLeave,
  onDrop,
  footer,
  children,
}: TodoBoardColumnProps) {
  return (
    <section
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={classNames(
        'flex min-h-0 w-[264px] flex-none flex-col overflow-hidden rounded-[10px] border',
        isOver ? 'border-accent bg-accent-soft shadow-popover' : 'border-border bg-sunken',
      )}
    >
      <div className="flex flex-none items-center gap-2 border-b border-border bg-panel px-[11px] pb-[9px] pt-2.5">
        <span
          aria-hidden
          style={phaseColor === null ? undefined : phaseColorStyle(phaseColor)}
          className={classNames('h-2 w-2 flex-none rounded-[2px]', SQUARE_CLASSES[tone])}
        />
        <h2 className={classNames('truncate text-label uppercase', TITLE_CLASSES[titleTone])}>
          {title}
        </h2>
        <span className="ml-auto rounded-badge bg-sunken px-1.5 font-mono text-label font-normal tabular-nums tracking-normal text-text2">
          {count}
        </span>
      </div>

      <div role="list" aria-label={title} className="grid min-h-0 flex-1 content-start gap-2 overflow-auto p-[9px]">
        {children}
        {count === 0 && (
          <p
            className={classNames(
              'flex h-16 items-center justify-center rounded-card border border-dashed border-border-strong text-label font-normal tracking-normal text-text3',
            )}
          >
            {isDropTarget ? 'arraste um card para cá' : 'nada aqui'}
          </p>
        )}
      </div>

      {footer !== undefined && (
        <div className="grid flex-none border-t border-border p-[9px]">{footer}</div>
      )}
    </section>
  )
}
