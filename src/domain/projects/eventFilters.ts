import type { ProjectEventType } from '@/domain/schemas/projectEventSchema'
import type { EventFeedEntry } from './eventFeed'

export const EVENT_FILTERS = [
  'all',
  'decisions',
  'scope',
  'blocks',
  'reallocations',
  'risks',
] as const

export type EventFilter = (typeof EVENT_FILTERS)[number]

export type EventFilterCounts = Record<EventFilter, number>

// Bloqueio e desbloqueio andam juntos num chip só: separá-los mostraria metade de uma
// história cuja outra metade é o número de dias parados. Nota não tem chip: só aparece em Tudo.
const TYPES_BY_FILTER: Record<EventFilter, readonly ProjectEventType[] | null> = {
  all: null,
  decisions: ['decision'],
  scope: ['scope_change'],
  blocks: ['block', 'unblock'],
  reallocations: ['reallocation'],
  risks: ['risk'],
}

export function filterEventFeed(
  entries: readonly EventFeedEntry[],
  filter: EventFilter,
): EventFeedEntry[] {
  const types = TYPES_BY_FILTER[filter]

  if (types === null) {
    return [...entries]
  }

  return entries.filter((entry) => types.includes(entry.event.type))
}

export function countEventsByFilter(entries: readonly EventFeedEntry[]): EventFilterCounts {
  return Object.fromEntries(
    EVENT_FILTERS.map((filter) => [filter, filterEventFeed(entries, filter).length]),
  ) as EventFilterCounts
}
