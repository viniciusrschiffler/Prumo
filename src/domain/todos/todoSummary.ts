import { toIsoDateOf, weekPeriod } from '@/domain/dates/isoDateMath'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { Project } from '@/domain/schemas/projectSchema'
import { classifyDue, isDone, type TodoGroupingContext } from './todoGrouping'
import type { ProjectWithPhase, TodoRow } from './todoRow'

export type TodoSummary = {
  open: number
  late: number
  linkedToProject: number
  withoutProject: number
  doneThisWeek: number
}

export type TodoProjectCount = {
  project: Project | null
  phase: Phase | null
  openCount: number
}

function isOpen(row: TodoRow): boolean {
  return row.todo.status === 'open'
}

// O mockup soma todo concluído de qualquer data num cartão que se chama "Esta semana".
function isDoneThisWeek(row: TodoRow, context: TodoGroupingContext): boolean {
  if (!isDone(row) || row.todo.completedAt === null) {
    return false
  }

  const week = weekPeriod(context.today, context.weekStart)
  const completedOn = toIsoDateOf(row.todo.completedAt)

  return completedOn >= week.start && completedOn <= week.end
}

export function summarizeTodos(
  rows: readonly TodoRow[],
  context: TodoGroupingContext,
): TodoSummary {
  const open = rows.filter(isOpen)
  const linkedToProject = open.filter((row) => row.todo.projectId !== null).length

  return {
    open: open.length,
    late: open.filter((row) => classifyDue(row.todo.dueDate, context) === 'late').length,
    linkedToProject,
    withoutProject: open.length - linkedToProject,
    doneThisWeek: rows.filter((row) => isDoneThisWeek(row, context)).length,
  }
}

// A ordem é por carga, não alfabética: o painel existe para dizer onde o trabalho se acumula.
export function countOpenTodosByProject(
  rows: readonly TodoRow[],
  projects: readonly ProjectWithPhase[],
): TodoProjectCount[] {
  const open = rows.filter(isOpen)
  const knownIds = new Set(projects.map((entry) => entry.project.id))

  const named = projects
    .map<TodoProjectCount>((entry) => ({
      project: entry.project,
      phase: entry.phase,
      openCount: open.filter((row) => row.todo.projectId === entry.project.id).length,
    }))
    .toSorted((first, second) => {
      const byCount = second.openCount - first.openCount

      return byCount === 0
        ? (first.project?.name ?? '').localeCompare(second.project?.name ?? '', 'pt-BR')
        : byCount
    })

  return [
    ...named,
    {
      project: null,
      phase: null,
      openCount: open.filter(
        (row) => row.todo.projectId === null || !knownIds.has(row.todo.projectId),
      ).length,
    },
  ]
}
