import type { RefObject } from 'react'
import type { TimelineWindow } from '@/domain/timeline/timelineWindow'
import { classNames } from '@/ui/primitives/classNames'
import { formatTickLabel } from './timelineLabels'
import { ROW_GRID } from './TimelineRow'

type TimelineAxisProps = {
  window: TimelineWindow
  label: string
}

export function TimelineAxis({ window, label }: TimelineAxisProps) {
  return (
    <div className={classNames(ROW_GRID, 'sticky top-0 z-30 bg-sunken')}>
      <div className="sticky left-0 z-10 h-full border-r border-border bg-inherit px-3 py-1.5 text-column uppercase text-text2">
        {label}
      </div>
      <div className="flex">
        {window.ticks.map((tick) => (
          <div
            key={tick.start}
            style={{ width: `${(tick.days / window.spanDays) * 100}%` }}
            className={classNames(
              'truncate border-l border-border px-2 py-1.5 font-mono text-meta',
              tick.isCurrent ? 'font-semibold text-text' : 'text-text2',
            )}
          >
            {formatTickLabel(tick, window.zoom)}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TimelineGridLines({
  window,
  todayPercent,
  todayRef,
}: {
  window: TimelineWindow
  todayPercent: number | null
  todayRef: RefObject<HTMLDivElement>
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 left-[260px] z-10"
    >
      {window.ticks.map((tick) => (
        <div
          key={tick.start}
          style={{ left: `${(tick.offsetDays / window.spanDays) * 100}%` }}
          className="absolute inset-y-0 w-px bg-border"
        />
      ))}
      {todayPercent !== null && (
        <div
          ref={todayRef}
          style={{ left: `${todayPercent}%` }}
          className="absolute inset-y-0 w-0.5 bg-accent"
        />
      )}
    </div>
  )
}
