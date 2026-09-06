import { toBarGeometry } from '@/domain/timeline/timelineGeometry'
import type {
  TimelinePhaseProjectRow,
  TimelinePhaseRow,
} from '@/domain/timeline/timelinePhaseRows'
import type { TimelineWindow } from '@/domain/timeline/timelineWindow'
import { Badge } from '@/ui/primitives/Badge'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { TimelineBar } from './TimelineBar'
import { OverlayBars } from './TimelineProjectGroup'
import { PhaseStripe, TimelineRow } from './TimelineRow'

function PhaseProjectRow({
  entry,
  phaseColor,
  window,
}: {
  entry: TimelinePhaseProjectRow
  phaseColor: string
  window: TimelineWindow
}) {
  const geometry = entry.period === null ? null : toBarGeometry(window, entry.period)

  return (
    <TimelineRow
      className="h-[30px] bg-bg"
      labelClassName="pl-7"
      label={
        <>
          <span title={entry.name} className="truncate text-support text-text2">
            {entry.name}
          </span>
          {entry.isBlocked && (
            <Badge tone="danger" size="small" className="ml-auto flex-none">
              bloqueado
            </Badge>
          )}
          {!entry.isBlocked && entry.pausedPeriod !== null && (
            <Badge tone="warn" size="small" className="ml-auto flex-none">
              pausado
            </Badge>
          )}
        </>
      }
    >
      {geometry !== null && (
        <TimelineBar
          geometry={geometry}
          tone="phase"
          size="group"
          phaseColor={phaseColor}
          className="top-2"
        />
      )}
      <OverlayBars overlays={entry} window={window} size="item" />
    </TimelineRow>
  )
}

export function TimelinePhaseGroup({
  row,
  window,
  isExpanded,
  onToggle,
}: {
  row: TimelinePhaseRow
  window: TimelineWindow
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <TimelineRow
        className="phase-tinted h-[34px] bg-[var(--phase-tone-soft)]"
        labelClassName="p-0"
        style={phaseColorStyle(row.color)}
        label={
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={onToggle}
            className="flex h-full w-full min-w-0 items-center gap-2 px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <PhaseStripe color={row.color} className="h-3.5" />
            <span title={row.name} className="truncate text-body font-semibold">
              {row.name}
            </span>
            <span className="ml-auto flex-none font-mono text-micro text-text2">
              {row.taskCount} tar · {row.effortHours}h
            </span>
          </button>
        }
      />

      {isExpanded &&
        row.projects.map((entry) => (
          <PhaseProjectRow key={entry.id} entry={entry} phaseColor={row.color} window={window} />
        ))}
    </>
  )
}
