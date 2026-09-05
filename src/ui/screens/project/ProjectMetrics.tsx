import type { BaselineComparison } from '@/domain/projects/baselineOptions'
import type { ProjectRow } from '@/domain/projects/projectRow'
import { formatDeviation } from '@/domain/format/formatDeviation'
import { formatIsoDate } from '@/domain/format/displayDate'
import { MetricCell, MetricStrip, MetricValue } from '@/ui/primitives/MetricStrip'
import { PersonAvatar } from '@/ui/primitives/PersonAvatar'
import { ProgressBar } from '@/ui/primitives/ProgressBar'

const MAX_VISIBLE_PEOPLE = 4
const PERCENT_SCALE = 100

function SumLabel({ children }: { children: string }) {
  return (
    <>
      {children} <span className="font-mono">∑</span>
    </>
  )
}

type ProjectMetricsProps = {
  row: ProjectRow
  comparison: BaselineComparison
}

export function ProjectMetrics({ row, comparison }: ProjectMetricsProps) {
  const visiblePeople = row.people.slice(0, MAX_VISIBLE_PEOPLE)
  const progressPercent = Math.round(row.hoursProgress.ratio * PERCENT_SCALE)

  return (
    <MetricStrip label="Totais do projeto">
      <MetricCell label={<SumLabel>Esforço</SumLabel>}>
        <MetricValue>{row.effortHours}h</MetricValue>
      </MetricCell>

      <MetricCell label={<SumLabel>Pessoas</SumLabel>}>
        <div className="flex items-center gap-1">
          {visiblePeople.map((person) => (
            <PersonAvatar
              key={person.id}
              initials={person.initials}
              name={person.name}
              size="compact"
            />
          ))}
          <span className="font-mono text-body font-semibold tabular-nums text-text2">
            {row.people.length}
          </span>
        </div>
      </MetricCell>

      <MetricCell label={<SumLabel>Início</SumLabel>}>
        <MetricValue>{formatIsoDate(row.period?.start ?? null)}</MetricValue>
      </MetricCell>

      <MetricCell label={<SumLabel>Fim previsto</SumLabel>}>
        <MetricValue>{formatIsoDate(row.period?.end ?? null)}</MetricValue>
      </MetricCell>

      <MetricCell
        label={
          comparison.baseline === null
            ? 'sem baseline'
            : `vs baseline v${comparison.baseline.version}`
        }
      >
        <MetricValue
          tone={
            comparison.deviationInDays === null || comparison.deviationInDays === 0
              ? 'default'
              : comparison.isDelayed
                ? 'danger'
                : 'ok'
          }
        >
          {formatDeviation(comparison.deviationInDays)}
        </MetricValue>
      </MetricCell>

      <MetricCell
        label={
          <span className="flex items-baseline justify-between">
            Progresso
            <span className="font-mono text-body font-semibold tabular-nums normal-case tracking-normal text-text">
              {progressPercent}%
            </span>
          </span>
        }
        className="gap-1"
      >
        <ProgressBar value={row.hoursProgress.ratio} />
        <span className="text-micro text-text3">ponderado por horas</span>
      </MetricCell>
    </MetricStrip>
  )
}
