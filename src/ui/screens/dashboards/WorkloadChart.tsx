import { isOverloaded, type WorkloadRow } from '@/domain/dashboards/workloadDistribution'
import { classNames } from '@/ui/primitives/classNames'
import { PersonAvatar } from '@/ui/primitives/PersonAvatar'
import { ChartCard } from './ChartCard'
import { formatPercentage } from './dashboardLabels'

// A barra vai até 150%, como o design a desenha, e a linha de 100% cai em dois terços dela.
const CHART_CEILING_PERCENTAGE = 150
const FULL_ALLOCATION_PERCENTAGE = 100
const FULL_ALLOCATION_MARK = `${(FULL_ALLOCATION_PERCENTAGE / CHART_CEILING_PERCENTAGE) * 100}%`

type WorkloadChartProps = {
  rows: readonly WorkloadRow[]
}

function WorkloadPersonRow({ row }: { row: WorkloadRow }) {
  const isOver = isOverloaded(row)
  const width = Math.min(
    FULL_ALLOCATION_PERCENTAGE,
    (row.averagePercentage / CHART_CEILING_PERCENTAGE) * FULL_ALLOCATION_PERCENTAGE,
  )

  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-[7px]">
        <PersonAvatar
          initials={row.person.initials}
          name={row.person.name}
          size="small"
          tone={isOver ? 'danger' : 'default'}
        />
        <span className="truncate text-support text-text2">{row.person.name}</span>
        <span
          className={classNames(
            'ml-auto font-mono text-meta font-semibold tabular-nums',
            isOver ? 'text-danger' : 'text-text2',
          )}
        >
          {formatPercentage(row.averagePercentage)}
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-[3px] bg-sunken">
        <div
          style={{ width: `${width}%` }}
          className={classNames('h-full', isOver ? 'bg-danger' : 'bg-ok')}
        />
        <div
          aria-hidden
          style={{ left: FULL_ALLOCATION_MARK }}
          className="absolute bottom-0 top-0 w-px bg-border-strong"
        />
      </div>
    </div>
  )
}

export function WorkloadChart({ rows }: WorkloadChartProps) {
  return (
    <ChartCard title="Distribuição de carga" total="média por pessoa">
      <div className="grid gap-[9px]">
        {rows.map((row) => (
          <WorkloadPersonRow key={row.person.id} row={row} />
        ))}
      </div>
      <p className="m-0 text-meta text-text3">A linha marca 100% da capacidade semanal.</p>
    </ChartCard>
  )
}
