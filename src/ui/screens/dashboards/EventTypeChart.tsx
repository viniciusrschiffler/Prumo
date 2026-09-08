import type { EventTypeCount } from '@/domain/dashboards/eventCounts'
import { classNames } from '@/ui/primitives/classNames'
import { TONE_BACKGROUND_CLASSES } from '@/ui/primitives/toneClasses'
import { PROJECT_EVENT_LABELS, PROJECT_EVENT_TONES } from '@/ui/labels/entityLabels'
import { ChartCard } from './ChartCard'
import { pluralize } from './dashboardLabels'

const TALLEST_BAR_PIXELS = 60
const SHORTEST_BAR_PIXELS = 3

type EventTypeChartProps = {
  counts: readonly EventTypeCount[]
  eventCount: number
}

export function EventTypeChart({ counts, eventCount }: EventTypeChartProps) {
  const scale = Math.max(1, ...counts.map((entry) => entry.count))

  return (
    <ChartCard
      title="Eventos registrados por tipo"
      note="o que mudou no período — mudança é evento, não exceção"
      total={pluralize(eventCount, 'evento', 'eventos')}
    >
      <div className="grid grid-cols-8 gap-2.5">
        {counts.map((entry) => (
          <div key={entry.type} className="grid gap-1.5">
            <div className="flex h-16 items-end">
              <div
                style={{
                  height: `${Math.max(SHORTEST_BAR_PIXELS, (entry.count / scale) * TALLEST_BAR_PIXELS)}px`,
                }}
                className={classNames(
                  'w-full rounded-[3px]',
                  entry.count === 0 ? 'bg-border' : TONE_BACKGROUND_CLASSES[PROJECT_EVENT_TONES[entry.type]],
                )}
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-body font-semibold tabular-nums">
                {entry.count}
              </span>
              <span className="truncate text-meta text-text2">
                {PROJECT_EVENT_LABELS[entry.type]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
