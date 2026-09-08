import type { ProjectAllocationRow } from '@/domain/dashboards/allocationByProject'
import { classNames } from '@/ui/primitives/classNames'
import { PhaseStripe } from '@/ui/primitives/PhaseStripe'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { ChartCard } from './ChartCard'
import { formatPercentage, pluralize } from './dashboardLabels'

const HATCH_CLASSES =
  'bg-[repeating-linear-gradient(45deg,transparent_0_3px,var(--hatch)_3px_6px)]'
const FULL_ALLOCATION_PERCENTAGE = 100

type AllocationByProjectChartProps = {
  rows: readonly ProjectAllocationRow[]
  allocationCount: number
}

function valueToneClasses(row: ProjectAllocationRow): string {
  if (row.isBlocked) {
    return 'text-danger'
  }

  return row.isPaused ? 'text-warn' : 'text-text2'
}

function AllocationRow({ row, scale }: { row: ProjectAllocationRow; scale: number }) {
  return (
    <div className="grid grid-cols-[150px_1fr_76px] items-center gap-2.5">
      <span className="inline-flex items-center gap-[7px] overflow-hidden text-support text-text2">
        <PhaseStripe color={row.phaseColor} />
        <span className="truncate">{row.name}</span>
      </span>
      <div className="flex h-4 overflow-hidden rounded-[3px] bg-sunken">
        <div
          style={{
            width: `${(row.peakPercentage / scale) * FULL_ALLOCATION_PERCENTAGE}%`,
            ...(row.phaseColor === null ? {} : phaseColorStyle(row.phaseColor)),
          }}
          className={classNames(
            'flex items-center pl-1.5 font-mono text-[9px] font-semibold text-accent-fg',
            row.phaseColor === null ? 'bg-border-strong' : 'phase-tinted bg-[var(--phase-tone)]',
            row.isBlocked ? HATCH_CLASSES : '',
          )}
        >
          {row.personCount > 0 && pluralize(row.personCount, 'pessoa', 'pessoas')}
        </div>
      </div>
      <span
        className={classNames(
          'text-right font-mono text-meta tabular-nums',
          valueToneClasses(row),
        )}
      >
        {row.peakPercentage === 0 ? 'encerradas' : formatPercentage(row.peakPercentage)}
      </span>
    </div>
  )
}

export function AllocationByProjectChart({
  rows,
  allocationCount,
}: AllocationByProjectChartProps) {
  const scale = Math.max(
    FULL_ALLOCATION_PERCENTAGE,
    ...rows.map((row) => row.peakPercentage),
  )

  return (
    <ChartCard
      title="Pessoas alocadas por projeto"
      note="soma de percentuais · barras por fase"
      total={`${pluralize(allocationCount, 'alocação ativa', 'alocações ativas')}`}
    >
      <div className="grid gap-[9px]">
        {rows.map((row) => (
          <AllocationRow key={row.projectId} row={row} scale={scale} />
        ))}
      </div>
    </ChartCard>
  )
}
