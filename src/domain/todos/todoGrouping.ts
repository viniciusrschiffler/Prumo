import { toIsoDateOf, weekPeriod } from '@/domain/dates/isoDateMath'
import type { WeekStart } from '@/domain/settings/appSettings'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId, IsoDate, Priority } from '@/domain/schemas/primitives'
import { PRIORITIES } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'
import { TODO_BOARD_STATUSES, type TodoBoardStatus } from '@/domain/schemas/todoSchema'
import type { ProjectWithPhase, TodoRow } from './todoRow'

export const TODO_GROUP_MODES = ['status', 'due', 'project', 'priority'] as const

export type TodoGroupMode = (typeof TODO_GROUP_MODES)[number]

export const DUE_BUCKETS = ['late', 'today', 'week', 'later', 'none'] as const

export type DueBucket = (typeof DUE_BUCKETS)[number]

export const DUE_GROUP_BUCKETS = [...DUE_BUCKETS, 'doneToday', 'doneBefore'] as const

export type DueGroupBucket = (typeof DUE_GROUP_BUCKETS)[number]

export type TodoGroup =
  | { id: string; kind: 'status'; status: TodoBoardStatus; items: readonly TodoRow[] }
  | { id: string; kind: 'due'; bucket: DueGroupBucket; items: readonly TodoRow[] }
  | {
      id: string
      kind: 'project'
      project: Project | null
      phase: Phase | null
      items: readonly TodoRow[]
    }
  | { id: string; kind: 'priority'; priority: Priority; items: readonly TodoRow[] }

export type TodoGroupingContext = {
  today: IsoDate
  weekStart: WeekStart
}

const WITHOUT_PROJECT_ID = 'sem-projeto'

export function endOfCurrentWeek({ today, weekStart }: TodoGroupingContext): IsoDate {
  return weekPeriod(today, weekStart).end
}

// O mockup fecha "Esta semana" em hoje+3, que só por coincidência bate com o domingo de
// 06/09. Fechar no fim da semana corrente é o que respeita o início de semana das Configurações.
export function classifyDue(
  dueDate: IsoDate | null,
  context: TodoGroupingContext,
): DueBucket {
  if (dueDate === null) {
    return 'none'
  }

  if (dueDate < context.today) {
    return 'late'
  }

  if (dueDate === context.today) {
    return 'today'
  }

  return dueDate <= endOfCurrentWeek(context) ? 'week' : 'later'
}

export function isDone(row: TodoRow): boolean {
  return row.todo.status === 'done'
}

// "Em aberto" é tudo que ainda pede trabalho, não só a coluna Backlog: quem está em progresso
// ou bloqueado continua aberto.
export function isOpen(row: TodoRow): boolean {
  return row.todo.status !== 'done' && row.todo.status !== 'cancelled'
}

export function boardStatusOf(row: TodoRow): TodoBoardStatus | null {
  return row.todo.status === 'cancelled' ? null : row.todo.status
}

// O botão revela todo concluído, de qualquer data, e o mockup só desenha "Concluídos hoje" —
// nome que mentiria sobre os mais antigos, por isso eles têm grupo próprio.
function classifyDueGroup(row: TodoRow, context: TodoGroupingContext): DueGroupBucket {
  if (!isDone(row)) {
    return classifyDue(row.todo.dueDate, context)
  }

  const completedOn = row.todo.completedAt === null ? null : toIsoDateOf(row.todo.completedAt)

  return completedOn === context.today ? 'doneToday' : 'doneBefore'
}

const PRIORITY_ORDER = new Map<Priority, number>(
  PRIORITIES.map((priority, index) => [priority, index]),
)

function compareRows(first: TodoRow, second: TodoRow): number {
  const firstDue = first.todo.dueDate
  const secondDue = second.todo.dueDate

  if (firstDue !== secondDue) {
    if (firstDue === null) {
      return 1
    }

    if (secondDue === null) {
      return -1
    }

    return firstDue < secondDue ? -1 : 1
  }

  const byPriority =
    (PRIORITY_ORDER.get(first.todo.priority) ?? 0) -
    (PRIORITY_ORDER.get(second.todo.priority) ?? 0)

  return byPriority === 0
    ? first.todo.title.localeCompare(second.todo.title, 'pt-BR')
    : byPriority
}

function collect<TKey>(rows: readonly TodoRow[], toKey: (row: TodoRow) => TKey) {
  const groups = new Map<TKey, TodoRow[]>()

  for (const row of rows) {
    const key = toKey(row)

    groups.set(key, [...(groups.get(key) ?? []), row])
  }

  return groups
}

function sorted(rows: readonly TodoRow[] | undefined): TodoRow[] {
  return (rows ?? []).toSorted(compareRows)
}

function groupByStatus(rows: readonly TodoRow[]): TodoGroup[] {
  const byStatus = collect(rows, boardStatusOf)

  return TODO_BOARD_STATUSES.map((status) => ({
    id: `status-${status}`,
    kind: 'status',
    status,
    items: sorted(byStatus.get(status)),
  }))
}

function groupByDue(rows: readonly TodoRow[], context: TodoGroupingContext): TodoGroup[] {
  const byBucket = collect(rows, (row) => classifyDueGroup(row, context))

  return DUE_GROUP_BUCKETS.map((bucket) => ({
    id: `due-${bucket}`,
    kind: 'due',
    bucket,
    items: sorted(byBucket.get(bucket)),
  }))
}

function groupByProject(
  rows: readonly TodoRow[],
  projects: readonly ProjectWithPhase[],
): TodoGroup[] {
  const byProject = collect(rows, (row) => row.todo.projectId ?? WITHOUT_PROJECT_ID)

  const named = projects.map<TodoGroup>((entry) => ({
    id: `project-${entry.project.id}`,
    kind: 'project',
    project: entry.project,
    phase: entry.phase,
    items: sorted(byProject.get(entry.project.id)),
  }))

  // Todo preso a projeto arquivado não tem grupo próprio, e sumir com ele esconderia
  // trabalho em aberto.
  const knownIds = new Set<EntityId>(projects.map((entry) => entry.project.id))
  const orphans = rows.filter(
    (row) => row.todo.projectId === null || !knownIds.has(row.todo.projectId),
  )

  return [
    ...named,
    {
      id: `project-${WITHOUT_PROJECT_ID}`,
      kind: 'project',
      project: null,
      phase: null,
      items: sorted(orphans),
    },
  ]
}

function groupByPriority(rows: readonly TodoRow[]): TodoGroup[] {
  const byPriority = collect(rows, (row) => row.todo.priority)

  return PRIORITIES.map((priority) => ({
    id: `priority-${priority}`,
    kind: 'priority',
    priority,
    items: sorted(byPriority.get(priority)),
  }))
}

// A lista e o quadro partem das mesmas divisões; quem decide o que fazer com a divisão vazia
// é cada um deles.
export function buildTodoGroups(
  rows: readonly TodoRow[],
  mode: TodoGroupMode,
  context: TodoGroupingContext,
  projects: readonly ProjectWithPhase[],
): TodoGroup[] {
  if (mode === 'status') {
    return groupByStatus(rows)
  }

  if (mode === 'project') {
    return groupByProject(rows, projects)
  }

  return mode === 'priority' ? groupByPriority(rows) : groupByDue(rows, context)
}

export function groupTodos(
  rows: readonly TodoRow[],
  mode: TodoGroupMode,
  context: TodoGroupingContext,
  projects: readonly ProjectWithPhase[],
): TodoGroup[] {
  return buildTodoGroups(rows, mode, context, projects).filter(
    (group) => group.items.length > 0,
  )
}
