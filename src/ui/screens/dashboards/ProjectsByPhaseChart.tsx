import type { PhaseProjectCount } from '@/domain/dashboards/projectsByPhase'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { ChartCard } from './ChartCard'
import { pluralize } from './dashboardLabels'

const TALLEST_BAR_PIXELS = 96
const SHORTEST_BAR_PIXELS = 6

type ProjectsByPhaseChartProps = {
  counts: readonly PhaseProjectCount[]
}

function barHeight(projectCount: number, scale: number): string {
  return `${Math.max(SHORTEST_BAR_PIXELS, (projectCount / scale) * TALLEST_BAR_PIXELS)}px`
}

export function ProjectsByPhaseChart({ counts }: ProjectsByPhaseChartProps) {
  const scale = Math.max(1, ...counts.map((entry) => entry.projectCount))
  const total = counts.reduce((sum, entry) => sum + entry.projectCount, 0)

  return (
    <ChartCard
      title="Projetos por fase"
      total={pluralize(total, 'projeto', 'projetos')}
    >
      <div className="flex h-[132px] items-end gap-3 px-1">
        {counts.map((entry) => (
          <div
            key={entry.phase.id}
            className="grid h-full flex-1 content-end justify-items-center gap-[5px]"
          >
            <span className="font-mono text-meta font-semibold tabular-nums">
              {entry.projectCount}
            </span>
            <div
              style={{
                height: barHeight(entry.projectCount, scale),
                ...phaseColorStyle(entry.phase.color),
              }}
              className="phase-tinted w-full rounded-t-[3px] bg-[var(--phase-tone)]"
            />
            <span className="text-center text-micro leading-tight text-text2">
              {entry.phase.name}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
