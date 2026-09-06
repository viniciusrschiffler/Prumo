import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { AllocationIndex } from '@/domain/capacity/allocationDetails'
import type { CapacityWindow } from '@/domain/capacity/capacityWindow'
import {
  listRemovableAllocations,
  REMOVAL_WEEK_OPTIONS,
  simulateReallocation,
  type ReallocationSimulation,
} from '@/domain/capacity/reallocationImpact'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { ToastTone } from '@/ui/primitives/Toast'
import { ImpactSimulatorModal, type SimulatorDraft } from './ImpactSimulatorModal'

const DEFAULT_WEEKS_REMOVED = REMOVAL_WEEK_OPTIONS[2]

type UseImpactSimulatorInput = {
  snapshot: ProjectsSnapshot
  index: AllocationIndex
  window: CapacityWindow
  today: IsoDate
  applyReallocation: (simulation: ReallocationSimulation) => Promise<void>
  notify: (message: string, tone?: ToastTone) => void
}

export type ImpactSimulator = {
  open: (personId: EntityId | null, allocationId?: EntityId) => void
  modal: ReactNode
}

export function useImpactSimulator({
  snapshot,
  index,
  window,
  today,
  applyReallocation,
  notify,
}: UseImpactSimulatorInput): ImpactSimulator {
  const [draft, setDraft] = useState<SimulatorDraft | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  const people = useMemo(
    () => snapshot.people.filter((person) => person.active),
    [snapshot.people],
  )

  const removableAllocations = useMemo(() => {
    if (draft === null) {
      return []
    }

    return listRemovableAllocations(draft.personId, snapshot.allocations, index, today)
  }, [draft, snapshot.allocations, index, today])

  const open = useCallback(
    (personId: EntityId | null, allocationId?: EntityId) => {
      const person = people.find((candidate) => candidate.id === personId) ?? people[0]

      if (person === undefined) {
        notify('Não há pessoa ativa para simular uma realocação.', 'danger')
        return
      }

      const options = listRemovableAllocations(person.id, snapshot.allocations, index, today)
      const chosen = options.find((option) => option.allocation.id === allocationId) ?? options[0]

      setDraft({
        personId: person.id,
        allocationId: chosen?.allocation.id ?? '',
        weeksRemoved: DEFAULT_WEEKS_REMOVED,
      })
    },
    [people, snapshot.allocations, index, today, notify],
  )

  // Trocar de pessoa invalida a alocação escolhida, então a primeira dela entra no lugar em
  // vez de deixar o formulário apontando para trabalho de outra pessoa.
  const change = useCallback(
    (next: SimulatorDraft) => {
      if (draft !== null && next.personId !== draft.personId) {
        const options = listRemovableAllocations(next.personId, snapshot.allocations, index, today)

        setDraft({ ...next, allocationId: options[0]?.allocation.id ?? '' })
        return
      }

      setDraft(next)
    },
    [draft, snapshot.allocations, index, today],
  )

  const simulation = useMemo(() => {
    const person = people.find((candidate) => candidate.id === draft?.personId)

    if (draft === null || person === undefined || draft.allocationId === '') {
      return null
    }

    return simulateReallocation({
      person,
      allocationId: draft.allocationId,
      weeksRemoved: draft.weeksRemoved,
      allocations: snapshot.allocations,
      tasks: snapshot.tasks,
      people: snapshot.people,
      index,
      today,
      weeks: window.weeks.map((week) => week.period),
    })
  }, [draft, people, snapshot.allocations, snapshot.tasks, snapshot.people, index, today, window])

  function apply() {
    if (simulation === null || isApplying) {
      return
    }

    setIsApplying(true)

    applyReallocation(simulation)
      .then(() => {
        setDraft(null)
        notify('Realocação aplicada, com evento e baseline nova no histórico.')
      })
      .catch((cause: unknown) => {
        console.error('Não foi possível aplicar a realocação.', cause)
        notify(toPublicMessage(cause), 'danger')
      })
      .finally(() => setIsApplying(false))
  }

  return {
    open,
    modal:
      draft === null ? null : (
        <ImpactSimulatorModal
          draft={draft}
          people={people}
          removableAllocations={removableAllocations}
          simulation={simulation}
          isApplying={isApplying}
          onChange={change}
          onClose={() => setDraft(null)}
          onApply={apply}
        />
      ),
  }
}
