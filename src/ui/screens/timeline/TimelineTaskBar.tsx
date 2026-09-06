import type { KeyboardEvent, PointerEvent } from 'react'
import { toBarGeometry } from '@/domain/timeline/timelineGeometry'
import type { TimelineTaskRow } from '@/domain/timeline/timelineProjectRows'
import { applyScheduleEdit, type ScheduleEditMode } from '@/domain/timeline/timelineSchedule'
import type { TimelineWindow } from '@/domain/timeline/timelineWindow'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { MINIMUM_BAR_WIDTH, toBarStyle } from './timelineBarStyle'
import type { PendingScheduleEdit } from './useTimelineSchedule'

const WEEK_STEP_DAYS = 7

const HANDLE_CLASSES =
  'absolute top-px h-2.5 w-[5px] rounded-[2px] border border-border-strong bg-panel'

type TimelineTaskBarProps = {
  task: TimelineTaskRow
  window: TimelineWindow
  pending: PendingScheduleEdit | null
  label: string
  onBeginDrag: (event: PointerEvent<HTMLElement>, mode: ScheduleEditMode) => void
  onNudge: (mode: ScheduleEditMode, days: number) => void
  onConfirm: () => void
  onCancel: () => void
}

function resolveStep(event: KeyboardEvent<HTMLElement>): number {
  const direction = event.key === 'ArrowRight' ? 1 : -1

  return direction * (event.shiftKey ? WEEK_STEP_DAYS : 1)
}

function resolveMode(task: TimelineTaskRow, event: KeyboardEvent<HTMLElement>): ScheduleEditMode | null {
  if (event.altKey) {
    return task.canResizeEnd ? 'end' : null
  }

  if (task.canMove) {
    return 'move'
  }

  return task.canResizeEnd ? 'end' : null
}

export function TimelineTaskBar({
  task,
  window,
  pending,
  label,
  onBeginDrag,
  onNudge,
  onConfirm,
  onCancel,
}: TimelineTaskBarProps) {
  if (task.period === null) {
    return null
  }

  const period =
    pending === null ? task.period : applyScheduleEdit(task.period, pending.mode, pending.offsetDays)
  const geometry = toBarGeometry(window, period)

  if (geometry === null) {
    return null
  }

  const isEditable = task.canMove || task.canResizeStart || task.canResizeEnd

  // Tarefa já concluída não se replaneja: a barra continua desenhada, mas sem parar o Tab num
  // ponto que não responde a nada.
  if (!isEditable) {
    return (
      <div
        style={toBarStyle(geometry, task.phaseColor)}
        className={classNames(
          'phase-tinted absolute top-1.5 h-3 rounded-[2px] bg-[var(--phase-tone)]',
          MINIMUM_BAR_WIDTH,
        )}
      />
    )
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' && pending !== null) {
      event.preventDefault()
      onConfirm()
      return
    }

    if (event.key === 'Escape' && pending !== null) {
      event.preventDefault()
      onCancel()
      return
    }

    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return
    }

    const mode = resolveMode(task, event)

    if (mode === null) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onNudge(mode, resolveStep(event))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      style={toBarStyle(geometry, task.phaseColor)}
      onPointerDown={(event) => task.canMove && onBeginDrag(event, 'move')}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
      className={classNames(
        'phase-tinted absolute top-1.5 h-3 rounded-[2px] bg-[var(--phase-tone)]',
        MINIMUM_BAR_WIDTH,
        FOCUS_RING,
        task.canMove ? 'cursor-grab' : 'cursor-default',
        pending === null ? '' : 'ring-2 ring-accent',
      )}
    >
      {task.canResizeStart && (
        <span
          onPointerDown={(event) => onBeginDrag(event, 'start')}
          className={classNames(HANDLE_CLASSES, '-left-0.5 cursor-ew-resize')}
        />
      )}
      {task.canResizeEnd && (
        <span
          onPointerDown={(event) => onBeginDrag(event, 'end')}
          className={classNames(HANDLE_CLASSES, '-right-0.5 cursor-ew-resize')}
        />
      )}
    </div>
  )
}
