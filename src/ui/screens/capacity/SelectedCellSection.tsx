import type { AllocationDetail } from '@/domain/capacity/allocationDetails'
import type { CapacityCell } from '@/domain/capacity/capacityMatrix'
import type { Person } from '@/domain/schemas/personSchema'
import { Button } from '@/ui/primitives/Button'
import { classNames } from '@/ui/primitives/classNames'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { ProgressBar } from '@/ui/primitives/ProgressBar'
import {
  describeAllocation,
  describeCellLoad,
  formatAllocationPeriod,
  formatHours,
  formatPercentage,
  formatWeek,
} from './capacityLabels'
import { PanelSection } from './PanelSection'

const FULL_ALLOCATION_PERCENTAGE = 100

type SelectedCellSectionProps = {
  person: Person
  weekNumber: number
  cell: CapacityCell
  allocations: readonly AllocationDetail[]
  onSimulate: () => void
}

function AllocationLine({ detail }: { detail: AllocationDetail }) {
  return (
    <div className="grid gap-[5px] border-b border-border px-[11px] py-2.5 last:border-b-0">
      <div className="flex items-center gap-[7px]">
        <span
          aria-hidden
          style={detail.phaseColor === null ? undefined : phaseColorStyle(detail.phaseColor)}
          className={classNames(
            'h-3 w-[3px] flex-none rounded-[2px]',
            detail.phaseColor === null ? 'bg-border-strong' : 'phase-tinted bg-[var(--phase-tone)]',
          )}
        />
        <span className="truncate text-support font-semibold">{detail.task.title}</span>
        <span className="ml-auto font-mono text-meta tabular-nums text-text2">
          {formatPercentage(detail.allocation.percentage)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-label font-normal tracking-normal text-text3">
        <span className="truncate">{describeAllocation(detail)}</span>
        <span className="ml-auto font-mono tabular-nums">{formatAllocationPeriod(detail)}</span>
      </div>
      <ProgressBar
        size="dense"
        segments={[
          {
            ratio: detail.allocation.percentage / FULL_ALLOCATION_PERCENTAGE,
            color: detail.phaseColor ?? undefined,
          },
        ]}
      />
    </div>
  )
}

export function SelectedCellSection({
  person,
  weekNumber,
  cell,
  allocations,
  onSimulate,
}: SelectedCellSectionProps) {
  const firstName = person.name.split(' ')[0] ?? person.name

  return (
    <PanelSection
      title={`${firstName} · ${formatWeek(weekNumber)}`}
      note={
        <span
          className={classNames(
            'font-mono text-meta font-semibold tabular-nums',
            cell.level === 'over' ? 'text-danger' : 'text-text2',
          )}
        >
          {`${formatPercentage(cell.percentage)} · ${formatHours(cell.hours)}`}
        </span>
      }
    >
      <div className="overflow-hidden rounded-card border border-border bg-panel">
        {allocations.length === 0 ? (
          <p className="px-[11px] py-2.5 text-label font-normal tracking-normal text-text3">
            Nenhuma alocação nesta semana.
          </p>
        ) : (
          allocations.map((detail) => (
            <AllocationLine key={detail.allocation.id} detail={detail} />
          ))
        )}
        <div className="flex items-center gap-2 border-t border-border px-[11px] py-[9px]">
          <span className="text-label font-normal tracking-normal text-text3">
            {describeCellLoad(cell.percentage, person.active)}
          </span>
          <Button
            size="small"
            className="ml-auto"
            disabled={allocations.length === 0}
            onClick={onSimulate}
          >
            Simular remoção
          </Button>
        </div>
      </div>
    </PanelSection>
  )
}
