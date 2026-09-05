import type { TaskStatus } from '@/domain/schemas/taskSchema'
import type { ProjectTaskRow } from './projectRow'

export const TASK_FILTERS = ['all', 'open', 'delayed', 'unassigned'] as const

export type TaskFilter = (typeof TASK_FILTERS)[number]

export type TaskFilterCounts = Record<TaskFilter, number>

const OPEN_STATUSES = new Set<TaskStatus>(['todo', 'in_progress', 'blocked'])

function isOpen(row: ProjectTaskRow): boolean {
  return OPEN_STATUSES.has(row.task.status)
}

function isDelayed(row: ProjectTaskRow): boolean {
  return row.deviationInDays !== null && row.deviationInDays > 0
}

// Encerrar toda alocação não devolve a tarefa a "sem responsável": o histórico registra que
// alguém esteve nela, e o design reserva a marca amarela para quem nunca teve ninguém.
function isUnassigned(row: ProjectTaskRow): boolean {
  return row.people.length === 0 && !row.hasOnlyEndedAllocations
}

const MATCHERS: Record<TaskFilter, (row: ProjectTaskRow) => boolean> = {
  all: () => true,
  open: isOpen,
  delayed: isDelayed,
  unassigned: isUnassigned,
}

function matchesSearch(row: ProjectTaskRow, search: string): boolean {
  const term = search.trim().toLocaleLowerCase('pt-BR')

  if (term === '') {
    return true
  }

  return row.task.title.toLocaleLowerCase('pt-BR').includes(term)
}

export function filterTaskRows(
  rows: readonly ProjectTaskRow[],
  filter: TaskFilter,
  search: string,
): ProjectTaskRow[] {
  return rows.filter((row) => MATCHERS[filter](row) && matchesSearch(row, search))
}

export function countTasksByFilter(rows: readonly ProjectTaskRow[]): TaskFilterCounts {
  return {
    all: rows.length,
    open: rows.filter(isOpen).length,
    delayed: rows.filter(isDelayed).length,
    unassigned: rows.filter(isUnassigned).length,
  }
}
