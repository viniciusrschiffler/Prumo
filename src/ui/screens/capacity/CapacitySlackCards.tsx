import type { CapacityMatrix } from '@/domain/capacity/capacityMatrix'
import type { MostAvailablePerson } from '@/domain/capacity/capacitySlack'
import type { CapacityWindow } from '@/domain/capacity/capacityWindow'
import { StatCard } from '@/ui/primitives/StatCard'
import { formatHours, formatPercentage, formatWeek, pluralize } from './capacityLabels'

type CapacitySlackCardsProps = {
  matrix: CapacityMatrix
  window: CapacityWindow
  mostAvailable: MostAvailablePerson | null
}

function describeOverloadSpread(peopleCount: number): string {
  if (peopleCount === 0) {
    return 'Ninguém passa da capacidade na janela.'
  }

  return peopleCount === 1
    ? 'todas concentradas em 1 pessoa'
    : `espalhadas por ${pluralize(peopleCount, 'pessoa', 'pessoas')}`
}

function describeAvailability(
  mostAvailable: MostAvailablePerson,
  window: CapacityWindow,
): string {
  if (mostAvailable.firstFreeWeekIndex === null) {
    return `${formatHours(mostAvailable.freeHours)} livres na janela`
  }

  const week = window.weeks[mostAvailable.firstFreeWeekIndex]

  return `100% livre a partir de ${formatWeek(week?.number ?? 0)}`
}

export function CapacitySlackCards({ matrix, window, mostAvailable }: CapacitySlackCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <StatCard
        label="Folga do time no período"
        hint={`${formatPercentage(matrix.freePercentage)} da capacidade total`}
      >
        {formatHours(matrix.freeHours)}
      </StatCard>

      <StatCard
        label="Semanas com sobrealocação"
        tone={matrix.overloadedWeekCount > 0 ? 'danger' : 'default'}
        hint={describeOverloadSpread(matrix.overloadedPeopleCount)}
      >
        {matrix.overloadedWeekCount}
      </StatCard>

      <div className="grid content-start gap-0.5 rounded-card border border-border bg-panel p-2.5">
        <span className="text-label font-normal tracking-normal text-text2">
          Quem tem mais folga
        </span>
        <span className="text-section-title">{mostAvailable?.person.name ?? '—'}</span>
        <span className="text-label font-normal tracking-normal text-text3">
          {mostAvailable === null
            ? 'Ninguém tem hora sobrando na janela.'
            : describeAvailability(mostAvailable, window)}
        </span>
      </div>
    </div>
  )
}
