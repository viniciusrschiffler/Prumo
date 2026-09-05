import { useMemo, useState } from 'react'
import {
  paginateEventFeed,
  type EventFeedEntry,
} from '@/domain/projects/eventFeed'
import {
  countEventsByFilter,
  EVENT_FILTERS,
  filterEventFeed,
  type EventFilter,
} from '@/domain/projects/eventFilters'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import { EVENT_FILTER_LABELS } from '@/ui/labels/entityLabels'
import { Button } from '@/ui/primitives/Button'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { FilterChip, FilterChipGroup } from '@/ui/primitives/FilterChip'
import { ProjectEventCard } from './ProjectEventCard'

const FIRST_PAGE = 1

type ProjectHistoryProps = {
  feed: readonly EventFeedEntry[]
  tasks: readonly Task[]
  phases: readonly Phase[]
  onRegisterEvent: () => void
}

export function ProjectHistory({ feed, tasks, phases, onRegisterEvent }: ProjectHistoryProps) {
  const [filter, setFilter] = useState<EventFilter>('all')
  const [pageCount, setPageCount] = useState(FIRST_PAGE)

  const counts = useMemo(() => countEventsByFilter(feed), [feed])
  const filtered = useMemo(() => filterEventFeed(feed, filter), [feed, filter])
  const page = paginateEventFeed(filtered, pageCount)

  const phaseColorByTaskId = useMemo(() => {
    const colorByPhase = new Map(phases.map((phase) => [phase.id, phase.color]))

    return new Map(
      tasks
        .map((task) => [task.id, colorByPhase.get(task.phaseId)] as const)
        .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
    )
  }, [tasks, phases])

  function changeFilter(next: EventFilter) {
    setFilter(next)
    setPageCount(FIRST_PAGE)
  }

  return (
    <aside className="flex flex-col overflow-hidden border-l border-border bg-sunken">
      <div className="grid flex-none gap-[9px] border-b border-border px-3.5 pb-2.5 pt-3">
        <div className="flex items-center gap-2">
          <h2 className="text-label uppercase text-text2">Histórico do projeto</h2>
          <span className="font-mono text-label font-normal tracking-normal text-text3">
            {feed.length}
          </span>
          <Button size="small" keys="mod+e" className="ml-auto" onClick={onRegisterEvent}>
            Registrar evento
          </Button>
        </div>
        <FilterChipGroup label="Filtrar o histórico por tipo">
          {EVENT_FILTERS.map((candidate) => (
            <FilterChip
              key={candidate}
              label={EVENT_FILTER_LABELS[candidate]}
              count={counts[candidate]}
              selected={filter === candidate}
              onSelect={() => changeFilter(candidate)}
            />
          ))}
        </FilterChipGroup>
      </div>

      <div className="flex-1 overflow-auto px-3.5 pb-6 pt-3">
        {feed.length === 0 ? (
          <EmptyState
            title="Nada registrado ainda"
            description="Decisões, riscos e mudanças de escopo registrados aqui viram o histórico do projeto."
            action={
              <Button size="small" keys="mod+e" onClick={onRegisterEvent}>
                Registrar evento
              </Button>
            }
          />
        ) : page.visible.length === 0 ? (
          <EmptyState
            title="Nada deste tipo"
            description={`Nenhum evento de ${EVENT_FILTER_LABELS[filter].toLocaleLowerCase('pt-BR')} no histórico deste projeto.`}
            action={<Button size="small" onClick={() => changeFilter('all')}>Ver tudo</Button>}
          />
        ) : (
          <div className="grid gap-2.5">
            {page.visible.map((entry) => (
              <ProjectEventCard
                key={entry.event.id}
                entry={entry}
                phaseColorByTaskId={phaseColorByTaskId}
              />
            ))}
            {page.remainingCount > 0 && (
              <Button onClick={() => setPageCount((current) => current + 1)} className="justify-center">
                Carregar {page.remainingCount}{' '}
                {page.remainingCount === 1 ? 'evento anterior' : 'eventos anteriores'}
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
