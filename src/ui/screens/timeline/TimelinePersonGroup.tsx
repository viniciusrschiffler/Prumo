import { toBarGeometry } from '@/domain/timeline/timelineGeometry'
import type {
  TimelineAllocationRow,
  TimelinePersonRow,
} from '@/domain/timeline/timelinePersonRows'
import type { TimelineWindow } from '@/domain/timeline/timelineWindow'
import { Badge } from '@/ui/primitives/Badge'
import { classNames } from '@/ui/primitives/classNames'
import { PersonAvatar } from '@/ui/primitives/PersonAvatar'
import { formatOverloadLabel } from './timelineLabels'
import { TimelineBar } from './TimelineBar'
import { MINIMUM_BAR_WIDTH, toBarStyle } from './timelineBarStyle'
import { PhaseStripe, TimelineRow } from './TimelineRow'

function AllocationRow({
  allocation,
  window,
}: {
  allocation: TimelineAllocationRow
  window: TimelineWindow
}) {
  const geometry = toBarGeometry(window, allocation.period)

  return (
    <TimelineRow
      className="h-[30px] bg-bg"
      labelClassName="pl-7"
      label={
        <>
          <PhaseStripe color={allocation.phaseColor} className="h-[11px]" />
          <span
            title={`${allocation.projectName} — ${allocation.taskTitle}`}
            className="truncate text-support text-text2"
          >
            {allocation.projectName} — {allocation.taskTitle}
          </span>
          {allocation.isEnded && (
            <span className="ml-auto flex-none font-mono text-micro text-text3">encerrada</span>
          )}
        </>
      }
    >
      {geometry !== null && (
        <div
          style={toBarStyle(geometry, allocation.phaseColor)}
          className={classNames(
            'phase-tinted absolute top-2 flex h-3.5 items-center rounded-[3px] bg-[var(--phase-tone)] px-[5px]',
            MINIMUM_BAR_WIDTH,
            allocation.isEnded ? 'opacity-45' : '',
          )}
        >
          <span className="font-mono text-[9px] font-semibold text-accent-fg">
            {allocation.percentage}%
          </span>
        </div>
      )}
    </TimelineRow>
  )
}

export function TimelinePersonGroup({
  row,
  window,
  isExpanded,
  onToggle,
}: {
  row: TimelinePersonRow
  window: TimelineWindow
  isExpanded: boolean
  onToggle: () => void
}) {
  const isOverloaded = row.overloads.length > 0
  const firstOverload = row.overloads[0]

  return (
    <>
      <TimelineRow
        className="h-9 bg-sunken"
        labelClassName="p-0"
        label={
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={onToggle}
            className="flex h-full w-full min-w-0 items-center gap-2 px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <PersonAvatar
              initials={row.initials}
              size="small"
              tone={isOverloaded ? 'danger' : 'default'}
            />
            <span className="truncate text-body font-semibold">{row.name}</span>
            {firstOverload === undefined ? (
              <span className="ml-auto flex-none font-mono text-micro text-text3">
                {row.weeklyCapacityHours}h/sem
              </span>
            ) : (
              <Badge tone="danger" size="small" className="ml-auto flex-none whitespace-nowrap">
                {formatOverloadLabel(firstOverload.percentage, firstOverload.period.start)}
              </Badge>
            )}
          </button>
        }
      >
        {row.overloads.map((overload) => {
          const geometry = toBarGeometry(window, overload.period)

          return (
            geometry !== null && (
              <TimelineBar
                key={overload.period.start}
                geometry={geometry}
                tone="blocked"
                size="group"
                className="top-[11px]"
              />
            )
          )
        })}
      </TimelineRow>

      {isExpanded &&
        row.allocations.map((allocation) => (
          <AllocationRow key={allocation.id} allocation={allocation} window={window} />
        ))}
    </>
  )
}
