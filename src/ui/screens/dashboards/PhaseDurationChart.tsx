import type { PhaseBottleneck, PhaseDurationRow } from '@/domain/dashboards/phaseDurations'
import { findSlowestPhaseId } from '@/domain/dashboards/phaseDurations'
import { classNames } from '@/ui/primitives/classNames'
import { PhaseStripe } from '@/ui/primitives/PhaseStripe'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { ChartCard } from './ChartCard'
import { formatBottleneck } from './dashboardLabels'

const FULL_WIDTH_PERCENTAGE = 100

type PhaseDurationChartProps = {
  rows: readonly PhaseDurationRow[]
  bottleneck: PhaseBottleneck | null
}

function formatAverage(averageDays: number | null): string {
  if (averageDays === null) {
    return '—'
  }

  return `${Math.round(averageDays)}d`
}

export function PhaseDurationChart({ rows, bottleneck }: PhaseDurationChartProps) {
  const scale = Math.max(1, ...rows.map((row) => row.averageDays ?? 0))
  const slowestPhaseId = findSlowestPhaseId(rows)

  return (
    <ChartCard title="Tempo médio em cada fase" total="dias">
      <div className="grid gap-2">
        {rows.map((row) => (
          <div
            key={row.phase.id}
            className="grid grid-cols-[110px_1fr_58px] items-center gap-[9px]"
          >
            <span className="inline-flex items-center gap-1.5 overflow-hidden text-support text-text2">
              <PhaseStripe color={row.phase.color} size="small" />
              <span className="truncate">{row.phase.name}</span>
            </span>
            <div className="h-3 overflow-hidden rounded-[3px] bg-sunken">
              <div
                style={{
                  width: `${((row.averageDays ?? 0) / scale) * FULL_WIDTH_PERCENTAGE}%`,
                  ...phaseColorStyle(row.phase.color),
                }}
                className="phase-tinted h-full bg-[var(--phase-tone)]"
              />
            </div>
            <span
              className={classNames(
                'text-right font-mono text-meta tabular-nums',
                row.phase.id === slowestPhaseId ? 'text-danger' : 'text-text2',
              )}
            >
              {formatAverage(row.averageDays)}
            </span>
          </div>
        ))}
      </div>
      {bottleneck !== null && (
        <p className="m-0 text-pretty text-meta text-text3">{formatBottleneck(bottleneck)}</p>
      )}
    </ChartCard>
  )
}
