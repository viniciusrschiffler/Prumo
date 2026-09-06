import { toIsoDateOf } from '@/domain/dates/isoDateMath'
import { deriveCurrentPhase } from '@/domain/derived/deriveCurrentPhase'
import { derivePeopleSummary } from '@/domain/derived/derivePeopleSummary'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { Phase } from '@/domain/schemas/phaseSchema'
import { PRIORITIES, type EntityId, type IsoDate, type Priority } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import type { Todo } from '@/domain/schemas/todoSchema'

export type DueTodoRow = {
  todo: Todo
  project: Project | null
  phase: Phase | null
}

export type TodayTaskKind = 'start' | 'end' | 'late'

export type TaskAssignment = {
  person: Person
  percentage: number
}

export type TodayTaskRow = {
  task: Task
  project: Project
  phase: Phase | null
  assignments: readonly TaskAssignment[]
  hasOnlyEndedAllocations: boolean
  kind: TodayTaskKind
}

export type TodayAgenda = {
  dueTodos: readonly DueTodoRow[]
  starting: readonly TodayTaskRow[]
  ending: readonly TodayTaskRow[]
}

export type TodayAgendaInput = {
  todos: readonly Todo[]
  tasks: readonly Task[]
  projects: readonly Project[]
  phases: readonly Phase[]
  people: readonly Person[]
  allocations: readonly Allocation[]
  today: IsoDate
}

export type TodayCountInput = {
  todos: readonly Todo[]
  tasks: readonly Task[]
  projects: readonly Project[]
  today: IsoDate
}

const PRIORITY_ORDER = new Map<Priority, number>(
  PRIORITIES.map((priority, index) => [priority, index]),
)

const PLANNABLE_STATUSES = new Set<Task['status']>(['todo', 'in_progress', 'blocked'])

function isCompletedOn(todo: Todo, date: IsoDate): boolean {
  return todo.completedAt !== null && toIsoDateOf(todo.completedAt) === date
}

// Marcar a caixa não pode fazer a linha sumir debaixo do cursor, então o que foi concluído
// hoje continua na lista — é justamente a linha riscada que o mockup desenha.
function isDueToday(todo: Todo, today: IsoDate): boolean {
  if (todo.status === 'done') {
    return isCompletedOn(todo, today)
  }

  return todo.status === 'open' && todo.dueDate !== null && todo.dueDate <= today
}

function priorityIndex(priority: Priority): number {
  return PRIORITY_ORDER.get(priority) ?? PRIORITIES.length
}

function compareTodos(first: Todo, second: Todo): number {
  if (first.status !== second.status) {
    return first.status === 'done' ? 1 : -1
  }

  if (first.dueDate !== second.dueDate) {
    return (first.dueDate ?? '') < (second.dueDate ?? '') ? -1 : 1
  }

  const byPriority = priorityIndex(first.priority) - priorityIndex(second.priority)

  return byPriority === 0 ? first.title.localeCompare(second.title, 'pt-BR') : byPriority
}

export function selectDueTodos(todos: readonly Todo[], today: IsoDate): Todo[] {
  return todos.filter((todo) => isDueToday(todo, today)).toSorted(compareTodos)
}

function listPlannableTasks(
  tasks: readonly Task[],
  projects: readonly Project[],
): Task[] {
  const openProjectIds = new Set(
    projects.filter((project) => project.archivedAt === null).map((project) => project.id),
  )

  return tasks.filter(
    (task) => PLANNABLE_STATUSES.has(task.status) && openProjectIds.has(task.projectId),
  )
}

export function selectStartingTasks(
  tasks: readonly Task[],
  projects: readonly Project[],
  today: IsoDate,
): Task[] {
  return listPlannableTasks(tasks, projects).filter((task) => task.plannedStart === today)
}

// O mockup põe a aprovação jurídica, vencida em março, no grupo "Terminam" com o selo de
// atraso: o que já deveria ter terminado precisa de decisão hoje tanto quanto o que fecha hoje.
export function selectEndingTasks(
  tasks: readonly Task[],
  projects: readonly Project[],
  today: IsoDate,
): Task[] {
  return listPlannableTasks(tasks, projects).filter(
    (task) => task.plannedEnd !== null && task.plannedEnd <= today,
  )
}

type RowIndex = {
  projectsById: Map<EntityId, Project>
  phasesById: Map<EntityId, Phase>
  currentPhaseByProject: Map<EntityId, Phase | null>
}

function buildIndex(input: TodayAgendaInput): RowIndex {
  return {
    projectsById: new Map(input.projects.map((project) => [project.id, project])),
    phasesById: new Map(input.phases.map((phase) => [phase.id, phase])),
    currentPhaseByProject: new Map(
      input.projects.map((project) => [
        project.id,
        deriveCurrentPhase(
          input.tasks.filter((task) => task.projectId === project.id),
          input.phases,
        ),
      ]),
    ),
  }
}

function toDueTodoRow(todo: Todo, index: RowIndex): DueTodoRow {
  const project = todo.projectId === null ? null : (index.projectsById.get(todo.projectId) ?? null)

  return {
    todo,
    project,
    phase: project === null ? null : (index.currentPhaseByProject.get(project.id) ?? null),
  }
}

// A coluna de pessoas fala da linha: o percentual é o que aquela alocação consome nesta
// tarefa, não a soma de tudo que a pessoa faz.
function listAssignments(task: Task, input: TodayAgendaInput): TaskAssignment[] {
  const percentageByPerson = new Map<EntityId, number>()

  for (const allocation of input.allocations) {
    if (allocation.taskId !== task.id || allocation.endedAt !== null) {
      continue
    }

    percentageByPerson.set(
      allocation.personId,
      (percentageByPerson.get(allocation.personId) ?? 0) + allocation.percentage,
    )
  }

  return input.people
    .filter((person) => percentageByPerson.has(person.id))
    .map((person) => ({ person, percentage: percentageByPerson.get(person.id) ?? 0 }))
    .toSorted((first, second) => first.person.name.localeCompare(second.person.name, 'pt-BR'))
}

function toTaskRow(
  task: Task,
  kind: TodayTaskKind,
  input: TodayAgendaInput,
  index: RowIndex,
): TodayTaskRow | null {
  const project = index.projectsById.get(task.projectId)

  if (project === undefined) {
    return null
  }

  const summary = derivePeopleSummary([task.id], input.allocations, input.people)

  return {
    task,
    project,
    phase: index.phasesById.get(task.phaseId) ?? null,
    assignments: listAssignments(task, input),
    hasOnlyEndedAllocations: summary.hasOnlyEndedAllocations,
    kind,
  }
}

function compareTaskRows(first: TodayTaskRow, second: TodayTaskRow): number {
  const byProject = first.project.name.localeCompare(second.project.name, 'pt-BR')

  return byProject === 0 ? first.task.sortOrder - second.task.sortOrder : byProject
}

function compareEndingRows(first: TodayTaskRow, second: TodayTaskRow): number {
  const firstEnd = first.task.plannedEnd ?? ''
  const secondEnd = second.task.plannedEnd ?? ''

  return firstEnd === secondEnd ? compareTaskRows(first, second) : firstEnd.localeCompare(secondEnd)
}

export function buildTodayAgenda(input: TodayAgendaInput): TodayAgenda {
  const index = buildIndex(input)
  const toRows = (tasks: readonly Task[], toKind: (task: Task) => TodayTaskKind) =>
    tasks
      .map((task) => toTaskRow(task, toKind(task), input, index))
      .filter((row) => row !== null)

  return {
    dueTodos: selectDueTodos(input.todos, input.today).map((todo) => toDueTodoRow(todo, index)),
    starting: toRows(selectStartingTasks(input.tasks, input.projects, input.today), () => 'start')
      .toSorted(compareTaskRows),
    ending: toRows(selectEndingTasks(input.tasks, input.projects, input.today), (task) =>
      task.plannedEnd === input.today ? 'end' : 'late',
    ).toSorted(compareEndingRows),
  }
}

export function countTodayItems(input: TodayCountInput): number {
  return (
    selectDueTodos(input.todos, input.today).length +
    selectStartingTasks(input.tasks, input.projects, input.today).length +
    selectEndingTasks(input.tasks, input.projects, input.today).length
  )
}
