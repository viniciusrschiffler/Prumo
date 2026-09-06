import type { PointerEvent } from 'react'
import { formatIsoDayMonth } from '@/domain/format/displayDate'
import { formatDeviation } from '@/domain/format/formatDeviation'
import { toBarGeometry } from '@/domain/timeline/timelineGeometry'
import type { TimelineProjectRow, TimelineTaskRow } from '@/domain/timeline/timelineProjectRows'
import { applyScheduleEdit, type ScheduleEditMode } from '@/domain/timeline/timelineSchedule'
import type { TimelineWindow } from '@/domain/timeline/timelineWindow'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import { Badge } from '@/ui/primitives/Badge'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { formatBlockedBadge } from './timelineLabels'
import { TimelineBar } from './TimelineBar'
import { PhaseStripe, TimelineRow } from './TimelineRow'
import { TimelineTaskBar } from './TimelineTaskBar'
import { readPendingOffset, type PendingScheduleEdit } from './useTimelineSchedule'

type Overlays = Pick<TimelineProjectRow, 'blockedPeriods' | 'pausedPeriod'>

export function OverlayBars({
  overlays,
  window,
  size,
}: {
  overlays: Overlays
  window: TimelineWindow
  size: 'group' | 'item'
}) {
  const placement = size === 'group' ? 'top-2.5' : 'top-2'
  const pausedGeometry =
    overlays.pausedPeriod === null ? null : toBarGeometry(window, overlays.pausedPeriod)

  return (
    <>
      {overlays.blockedPeriods.map((period) => {
        const geometry = toBarGeometry(window, period)

        return (
          geometry !== null && (
            <TimelineBar
              key={`blocked-${period.start}`}
              geometry={geometry}
              tone="blocked"
              size="group"
              className={placement}
            />
          )
        )
      })}
      {pausedGeometry !== null && (
        <TimelineBar geometry={pausedGeometry} tone="paused" size="group" className={placement} />
      )}
    </>
  )
}

function DeviationMark({ deviationInDays }: { deviationInDays: number | null }) {
  return (
    <span
      className={classNames(
        'ml-auto flex-none font-mono text-meta tabular-nums',
        deviationInDays === null || deviationInDays === 0
          ? 'text-text3'
          : deviationInDays > 0
            ? 'text-danger'
            : 'text-ok',
      )}
    >
      {formatDeviation(deviationInDays)}
    </span>
  )
}

// O selo conta o que está acontecendo agora; a hachura conta o que já aconteceu. Um bloqueio
// já desfeito continua desenhado na barra e sai do selo, senão o desvio nunca apareceria em
// projeto que um dia esteve parado.
function ProjectMark({ row }: { row: TimelineProjectRow }) {
  if (row.isBlocked) {
    return (
      <Badge tone="danger" size="small" className="ml-auto flex-none whitespace-nowrap">
        {formatBlockedBadge(row.blockedDays)}
      </Badge>
    )
  }

  if (row.pausedPeriod !== null) {
    return (
      <Badge tone="warn" size="small" className="ml-auto flex-none">
        pausado
      </Badge>
    )
  }

  return <DeviationMark deviationInDays={row.deviationInDays} />
}

function TaskDates({ period }: { period: DatePeriod | null }) {
  if (period === null) {
    return <span className="ml-auto flex-none font-mono text-micro text-text3">sem data</span>
  }

  return (
    <span className="ml-auto flex-none font-mono text-micro tabular-nums text-text3">
      {formatIsoDayMonth(period.start)} → {formatIsoDayMonth(period.end)}
    </span>
  )
}

type TaskRowProps = {
  task: TimelineTaskRow
  window: TimelineWindow
  showBaseline: boolean
  pending: PendingScheduleEdit | null
  onBeginDrag: (event: PointerEvent<HTMLElement>, taskId: string, mode: ScheduleEditMode) => void
  onNudge: (taskId: string, mode: ScheduleEditMode, days: number) => void
  onConfirm: () => void
  onCancel: () => void
}

function TaskRow({
  task,
  window,
  showBaseline,
  pending,
  onBeginDrag,
  onNudge,
  onConfirm,
  onCancel,
}: TaskRowProps) {
  const ownPending = readPendingOffset(pending, task.id)
  const shownPeriod =
    task.period === null || ownPending === null
      ? task.period
      : applyScheduleEdit(task.period, ownPending.mode, ownPending.offsetDays)
  const baselineGeometry =
    !showBaseline || task.baselinePeriod === null
      ? null
      : toBarGeometry(window, task.baselinePeriod)

  return (
    <TimelineRow
      className="h-7 bg-sunken"
      labelClassName="pl-7"
      label={
        <>
          <PhaseStripe color={task.phaseColor} className="h-[11px]" />
          <span title={task.title} className="truncate text-support text-text2">
            {task.title}
          </span>
          <TaskDates period={shownPeriod} />
          {task.hasAssignee ? (
            task.deviationInDays !== null &&
            task.deviationInDays !== 0 && (
              <span
                className={classNames(
                  'flex-none font-mono text-micro tabular-nums',
                  task.deviationInDays > 0 ? 'text-danger' : 'text-ok',
                )}
              >
                {formatDeviation(task.deviationInDays)}
              </span>
            )
          ) : (
            <Badge
              tone="warn"
              size="small"
              variant="outline"
              dashed
              weight="normal"
              className="flex-none whitespace-nowrap"
            >
              sem resp.
            </Badge>
          )}
        </>
      }
    >
      <TimelineTaskBar
        task={task}
        window={window}
        pending={ownPending}
        label={task.title}
        onBeginDrag={(event, mode) => onBeginDrag(event, task.id, mode)}
        onNudge={(mode, days) => onNudge(task.id, mode, days)}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
      {baselineGeometry !== null && (
        <TimelineBar
          geometry={baselineGeometry}
          tone="baseline"
          size="ghostItem"
          className="top-5"
        />
      )}
    </TimelineRow>
  )
}

type TimelineProjectGroupProps = Omit<TaskRowProps, 'task'> & {
  row: TimelineProjectRow
  isExpanded: boolean
  onToggle: () => void
}

export function TimelineProjectGroup({
  row,
  window,
  showBaseline,
  isExpanded,
  onToggle,
  ...taskProps
}: TimelineProjectGroupProps) {
  const geometry = row.period === null ? null : toBarGeometry(window, row.period)
  const baselineGeometry =
    !showBaseline || row.baselinePeriod === null ? null : toBarGeometry(window, row.baselinePeriod)

  return (
    <>
      <TimelineRow
        className="h-11 bg-bg hover:bg-sunken"
        labelClassName="p-0"
        label={
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={onToggle}
            className={classNames(
              'flex h-full w-full min-w-0 items-center gap-[7px] px-3 text-left',
              FOCUS_RING,
            )}
          >
            <PhaseStripe color={row.phaseColor} className="h-3.5" />
            <span title={row.name} className="truncate text-body font-medium">
              {row.name}
            </span>
            <ProjectMark row={row} />
          </button>
        }
      >
        {geometry !== null && (
          <TimelineBar
            geometry={geometry}
            tone="phase"
            size="group"
            phaseColor={row.phaseColor}
            className="top-2.5"
          />
        )}
        <OverlayBars overlays={row} window={window} size="group" />
        {baselineGeometry !== null && (
          <TimelineBar geometry={baselineGeometry} tone="baseline" size="ghost" className="top-6" />
        )}
      </TimelineRow>

      {isExpanded &&
        row.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            window={window}
            showBaseline={showBaseline}
            {...taskProps}
          />
        ))}
    </>
  )
}
