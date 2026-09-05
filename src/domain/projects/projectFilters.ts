import { z } from 'zod'
import { prioritySchema } from '@/domain/schemas/primitives'
import { projectStatusSchema, type ProjectStatus } from '@/domain/schemas/projectSchema'
import type { ProjectRow } from './projectRow'

export const ALL_STATUSES = 'all'

export type ProjectStatusFilter = ProjectStatus | typeof ALL_STATUSES

// O filtro de uma visão salva é texto livre no banco. Chave desconhecida é tolerada de
// propósito: uma visão gravada por uma versão futura continua legível pelas chaves que
// esta versão entende.
export const projectsViewFiltersSchema = z.object({
  status: z.array(projectStatusSchema).optional(),
  priority: z.array(prioritySchema).optional(),
  withoutOwner: z.boolean().optional(),
  delayed: z.boolean().optional(),
  atRisk: z.boolean().optional(),
})

export type ProjectsViewFilters = z.infer<typeof projectsViewFiltersSchema>

// Texto que não é JSON é resultado esperado aqui, não falha a reportar: quem chama devolve
// null para a tela listar a visão como ilegível, do mesmo jeito que faz com preferência torta.
function readJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export function parseProjectsViewFilters(filtersJson: string): ProjectsViewFilters | null {
  const filters = projectsViewFiltersSchema.safeParse(readJson(filtersJson))

  return filters.success ? filters.data : null
}

function matchesViewFilters(row: ProjectRow, filters: ProjectsViewFilters): boolean {
  if (filters.status !== undefined && !filters.status.includes(row.project.status)) {
    return false
  }

  if (filters.priority !== undefined && !filters.priority.includes(row.project.priority)) {
    return false
  }

  if (filters.withoutOwner === true && row.project.ownerPersonId !== null) {
    return false
  }

  if (filters.delayed === true && !row.isDelayed) {
    return false
  }

  return !(filters.atRisk === true && !row.hasOpenRisk)
}

function matchesSearch(row: ProjectRow, search: string): boolean {
  const needle = search.trim().toLocaleLowerCase('pt-BR')

  if (needle === '') {
    return true
  }

  return (
    row.project.name.toLocaleLowerCase('pt-BR').includes(needle) ||
    row.tagNames.some((tag) => tag.toLocaleLowerCase('pt-BR').includes(needle))
  )
}

export type ProjectFilter = {
  status: ProjectStatusFilter
  search: string
  viewFilters: ProjectsViewFilters | null
}

export function filterProjectRows(
  rows: readonly ProjectRow[],
  filter: ProjectFilter,
): ProjectRow[] {
  return rows
    .filter((row) => filter.status === ALL_STATUSES || row.project.status === filter.status)
    .filter((row) => matchesSearch(row, filter.search))
    .filter((row) => filter.viewFilters === null || matchesViewFilters(row, filter.viewFilters))
}

export function countProjectsByStatus(
  rows: readonly ProjectRow[],
): Map<ProjectStatusFilter, number> {
  const counts = new Map<ProjectStatusFilter, number>([[ALL_STATUSES, rows.length]])

  for (const row of rows) {
    counts.set(row.project.status, (counts.get(row.project.status) ?? 0) + 1)
  }

  return counts
}

export function countProjectsMatchingView(
  rows: readonly ProjectRow[],
  filters: ProjectsViewFilters,
): number {
  return rows.filter((row) => matchesViewFilters(row, filters)).length
}
