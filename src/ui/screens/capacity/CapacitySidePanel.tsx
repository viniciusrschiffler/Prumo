import type { AllocationDetail } from '@/domain/capacity/allocationDetails'
import type { InactiveWithFutureWorkAlert } from '@/domain/capacity/capacityAlerts'
import type { CapacityCell, CapacityMatrix } from '@/domain/capacity/capacityMatrix'
import type { ReleaseCandidate } from '@/domain/capacity/capacitySlack'
import type { Person } from '@/domain/schemas/personSchema'
import { Alert } from '@/ui/primitives/Alert'
import { Badge } from '@/ui/primitives/Badge'
import { PersonAvatar } from '@/ui/primitives/PersonAvatar'
import {
  describeAllocation,
  describeOccupation,
  formatHours,
  formatPercentage,
  formatWeek,
  formatWeekSpan,
} from './capacityLabels'
import { PanelSection } from './PanelSection'
import { SelectedCellSection } from './SelectedCellSection'

const COMFORTABLE_FREE_RATIO = 0.5

type CapacitySidePanelProps = {
  matrix: CapacityMatrix
  person: Person
  weekNumber: number
  cell: CapacityCell
  selectedAllocations: readonly AllocationDetail[]
  candidates: readonly ReleaseCandidate[]
  candidateSpan: readonly [number, number]
  inactiveAlerts: readonly InactiveWithFutureWorkAlert[]
  firstFreeWeekNumber: number | null
  onSimulate: () => void
}

function describeCandidateWork(candidate: ReleaseCandidate): string {
  const busiest = candidate.allocations[0]

  if (busiest === undefined) {
    return describeOccupation(candidate.usedPercentage)
  }

  const rest = candidate.allocations.length - 1
  const others = rest === 0 ? '' : ` E mais ${rest === 1 ? '1 alocação' : `${rest} alocações`}.`

  return `${describeOccupation(candidate.usedPercentage)} Maior parte em ${busiest.task.title}, de ${describeAllocation(busiest)}.${others}`
}

function CandidateCard({ candidate }: { candidate: ReleaseCandidate }) {
  const isComfortable =
    candidate.freeHours >= candidate.person.weeklyCapacityHours * COMFORTABLE_FREE_RATIO

  return (
    <div className="grid gap-1.5 border-b border-border px-[11px] py-2.5 last:border-b-0">
      <div className="flex items-center gap-[7px]">
        <PersonAvatar initials={candidate.person.initials} size="small" />
        <span className="truncate text-support font-semibold">{candidate.person.name}</span>
        <Badge size="small" tone={isComfortable ? 'ok' : 'warn'} className="ml-auto">
          {`${formatHours(candidate.freeHours)} livres`}
        </Badge>
      </div>
      <p className="text-pretty text-label font-normal tracking-normal text-text2">
        {describeCandidateWork(candidate)}
      </p>
    </div>
  )
}

export function CapacitySidePanel({
  matrix,
  person,
  weekNumber,
  cell,
  selectedAllocations,
  candidates,
  candidateSpan,
  inactiveAlerts,
  firstFreeWeekNumber,
  onSimulate,
}: CapacitySidePanelProps) {
  return (
    <div className="grid content-start gap-3.5 overflow-auto border-l border-border bg-sunken p-3.5">
      <SelectedCellSection
        person={person}
        weekNumber={weekNumber}
        cell={cell}
        allocations={selectedAllocations}
        onSimulate={onSimulate}
      />

      <PanelSection
        title="Quem eu consigo tirar"
        note={
          <span className="font-mono text-meta text-text3">
            {formatWeekSpan(candidateSpan[0], candidateSpan[1])}
          </span>
        }
      >
        <div className="overflow-hidden rounded-card border border-border bg-panel">
          {candidates.length === 0 ? (
            <p className="px-[11px] py-2.5 text-label font-normal tracking-normal text-text3">
              Ninguém tem hora sobrando no período.
            </p>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard key={candidate.person.id} candidate={candidate} />
            ))
          )}
        </div>
      </PanelSection>

      <PanelSection title="Alertas">
        {inactiveAlerts.map((alert) => (
          <Alert
            key={alert.person.id}
            level="warn"
            title={`${alert.person.name} inativa com alocação futura`}
            className="bg-panel"
          >
            {`${formatPercentage(
              alert.allocations[0]?.allocation.percentage ?? 0,
            )} em ${alert.allocations[0]?.project.name ?? ''} a partir de ${formatWeek(
              alert.firstWeekNumber,
            )}.`}
          </Alert>
        ))}

        <Alert
          level="info"
          title={`Time em ${formatPercentage(matrix.teamAveragePercentage)} de uso médio`}
          className="border-border bg-panel"
        >
          {firstFreeWeekNumber === null
            ? 'A janela inteira tem trabalho alocado.'
            : `Capacidade sobrando de ${formatWeek(firstFreeWeekNumber)} em diante.`}
        </Alert>
      </PanelSection>
    </div>
  )
}
