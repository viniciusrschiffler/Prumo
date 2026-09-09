import { toIsoDateOf, weekPeriod } from '@/domain/dates/isoDateMath'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { Project } from '@/domain/schemas/projectSchema'
import type { Tag } from '@/domain/schemas/tagSchema'
import { TODO_BOARD_STATUSES, type TodoBoardStatus } from '@/domain/schemas/todoSchema'
import { boardStatusOf, classifyDue, isDone, isOpen, type TodoGroupingContext } from './todoGrouping'
import type { ProjectWithPhase, TodoRow } from './todoRow'

export type TodoSummary = {
  open: number
  inProgress: number
  blocked: number
  late: number
  linkedToProject: number
  withoutProject: number
  doneThisWeek: number
}

export type TodoStatusCount = {
  status: TodoBoardStatus
  count: number
}

export type TodoProjectCount = {
  project: Project | null
  phase: Phase | null
  openCount: number
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
    inProgress: rows.filter((row) => row.todo.status === 'in_progress').length,
    blocked: rows.filter((row) => row.todo.status === 'blocked').length,
    late: open.filter((row) => classifyDue(row.todo.dueDate, context) === 'late').length,
    linkedToProject,
    withoutProject: open.length - linkedToProject,
    doneThisWeek: rows.filter((row) => isDoneThisWeek(row, context)).length,
  }
}

// O contador da barra lateral conta o quadro inteiro, não só o que o filtro em vigor deixou
// passar: ele é o que diz de onde o filtro tira gente.
export function countTodosByStatus(rows: readonly TodoRow[]): TodoStatusCount[] {
  return TODO_BOARD_STATUSES.map((status) => ({
    status,
    count: rows.filter((row) => boardStatusOf(row) === status).length,
  }))
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

// Tag sem nenhum todo viraria um filtro que só sabe esvaziar a tela. A tabela `tag` é
// compartilhada com projeto, então nem toda tag cadastrada aparece aqui.
export function listTagsInUse(rows: readonly TodoRow[], tags: readonly Tag[]): Tag[] {
  const usedIds = new Set(rows.flatMap((row) => row.tags.map((tag) => tag.id)))

  return tags.filter((tag) => usedIds.has(tag.id))
}
