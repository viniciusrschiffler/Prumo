import { PRIORITIES } from '@/domain/schemas/primitives'
import type { ProjectRow } from './projectRow'

export const PROJECT_SORT_KEYS = ['priority', 'deviation', 'plannedEnd', 'effort'] as const

export type ProjectSortKey = (typeof PROJECT_SORT_KEYS)[number]

const PRIORITY_POSITION = new Map(PRIORITIES.map((priority, index) => [priority, index]))

function compareByName(first: ProjectRow, second: ProjectRow): number {
  return first.project.name.localeCompare(second.project.name, 'pt-BR')
}

// Projeto sem o dado da ordenação vai para o fim em qualquer critério: ele não é o menor,
// ele é o que não tem o número, e misturá-lo com os menores esconderia os extremos reais.
function compareNullableDescending(first: number | null, second: number | null): number {
  if (first === second) {
    return 0
  }

  if (first === null) {
    return 1
  }

  if (second === null) {
    return -1
  }

  return second - first
}

function compareNullableTextAscending(first: string | null, second: string | null): number {
  if (first === second) {
    return 0
  }

  if (first === null) {
    return 1
  }

  if (second === null) {
    return -1
  }

  return first < second ? -1 : 1
}

const COMPARATORS: Record<ProjectSortKey, (first: ProjectRow, second: ProjectRow) => number> = {
  priority: (first, second) =>
    (PRIORITY_POSITION.get(first.project.priority) ?? PRIORITIES.length) -
    (PRIORITY_POSITION.get(second.project.priority) ?? PRIORITIES.length),
  deviation: (first, second) =>
    compareNullableDescending(first.deviationInDays, second.deviationInDays),
  plannedEnd: (first, second) =>
    compareNullableTextAscending(first.period?.end ?? null, second.period?.end ?? null),
  effort: (first, second) => second.effortHours - first.effortHours,
}

export function sortProjectRows(
  rows: readonly ProjectRow[],
  sortKey: ProjectSortKey,
): ProjectRow[] {
  const compare = COMPARATORS[sortKey]

  return rows.toSorted((first, second) => compare(first, second) || compareByName(first, second))
}
