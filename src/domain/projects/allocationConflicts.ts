import { addDays } from '@/domain/dates/isoDateMath'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { EntityId, IsoDate } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'

const FULL_ALLOCATION_PERCENTAGE = 100

export type ConflictContribution = {
  allocation: Allocation
  taskTitle: string
  projectName: string
  isSameProject: boolean
}

export type AllocationConflict = {
  person: Person
  period: DatePeriod
  totalPercentage: number
  contributions: readonly ConflictContribution[]
}

export type PersonOverload = {
  person: Person
  period: DatePeriod
  totalPercentage: number
  allocations: readonly Allocation[]
}

type Segment = {
  period: DatePeriod
  allocations: readonly Allocation[]
}

// Encerrar uma alocação num dia é substituí-la nesse dia, não somar as duas: a realocação do
// seed abre a nova alocação na mesma data em que fecha a antiga, e contar o dia duas vezes
// inventaria um conflito de 24 horas que nunca existiu.
function effectiveEnd(allocation: Allocation): IsoDate {
  if (allocation.endedAt === null) {
    return allocation.endDate
  }

  const endedOn = addDays(allocation.endedAt.slice(0, 10), -1)

  return endedOn < allocation.endDate ? endedOn : allocation.endDate
}

function isLiveOn(allocation: Allocation, date: IsoDate): boolean {
  return allocation.startDate <= date && date <= effectiveEnd(allocation)
}

function collectBoundaries(allocations: readonly Allocation[]): IsoDate[] {
  const boundaries = new Set<IsoDate>()

  for (const allocation of allocations) {
    boundaries.add(allocation.startDate)
    boundaries.add(addDays(effectiveEnd(allocation), 1))
  }

  return [...boundaries].toSorted()
}

function sumPercentage(allocations: readonly Allocation[]): number {
  return allocations.reduce((total, allocation) => total + allocation.percentage, 0)
}

function toSignature(allocations: readonly Allocation[]): string {
  return allocations
    .map((allocation) => allocation.id)
    .toSorted()
    .join('|')
}

function collectOverloadedSegments(allocations: readonly Allocation[]): Segment[] {
  const boundaries = collectBoundaries(allocations)
  const segments: Segment[] = []

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index]
    const nextStart = boundaries[index + 1]

    if (start === undefined || nextStart === undefined) {
      continue
    }

    const live = allocations.filter((allocation) => isLiveOn(allocation, start))

    if (sumPercentage(live) <= FULL_ALLOCATION_PERCENTAGE) {
      continue
    }

    segments.push({ period: { start, end: addDays(nextStart, -1) }, allocations: live })
  }

  return segments
}

function mergeAdjacent(segments: readonly Segment[]): Segment[] {
  return segments.reduce<Segment[]>((merged, segment) => {
    const previous = merged[merged.length - 1]
    const isContinuation =
      previous !== undefined &&
      addDays(previous.period.end, 1) === segment.period.start &&
      toSignature(previous.allocations) === toSignature(segment.allocations)

    if (!isContinuation) {
      return [...merged, segment]
    }

    return [
      ...merged.slice(0, -1),
      { period: { start: previous.period.start, end: segment.period.end }, allocations: segment.allocations },
    ]
  }, [])
}

type ConflictIndex = {
  tasksById: Map<EntityId, Task>
  projectsById: Map<EntityId, Project>
}

function toContribution(
  allocation: Allocation,
  projectId: EntityId,
  index: ConflictIndex,
): ConflictContribution {
  const task = index.tasksById.get(allocation.taskId) ?? null
  const project = task === null ? null : (index.projectsById.get(task.projectId) ?? null)

  return {
    allocation,
    taskTitle: task?.title ?? '',
    projectName: project?.name ?? '',
    isSameProject: task?.projectId === projectId,
  }
}

function compareByPeriodStart(
  first: { period: DatePeriod },
  second: { period: DatePeriod },
): number {
  return first.period.start.localeCompare(second.period.start)
}

// A sobrecarga é da pessoa, não do projeto: a Timeline pinta todas, e a tela de Projeto filtra
// depois as que tocam as tarefas dela.
export function findPersonOverloads(
  people: readonly Person[],
  allocations: readonly Allocation[],
): PersonOverload[] {
  return people
    .flatMap((person) => {
      const own = allocations.filter(
        (allocation) =>
          allocation.personId === person.id && allocation.startDate <= effectiveEnd(allocation),
      )

      return mergeAdjacent(collectOverloadedSegments(own)).map((segment) => ({
        person,
        period: segment.period,
        totalPercentage: sumPercentage(segment.allocations),
        allocations: segment.allocations,
      }))
    })
    .toSorted(compareByPeriodStart)
}

export type AllocationConflictInput = {
  projectId: EntityId
  taskIds: readonly EntityId[]
  allocations: readonly Allocation[]
  tasks: readonly Task[]
  projects: readonly Project[]
  people: readonly Person[]
}

// Só entra o conflito de que as tarefas pedidas participam: quem soma acima de 100% fora
// delas é problema da tela de Capacidade, e a prévia do modal passa só a tarefa que vai nascer.
export function findAllocationConflicts(input: AllocationConflictInput): AllocationConflict[] {
  const taskIdSet = new Set(input.taskIds)
  const index: ConflictIndex = {
    tasksById: new Map(input.tasks.map((task) => [task.id, task])),
    projectsById: new Map(input.projects.map((project) => [project.id, project])),
  }
  const personIds = new Set(
    input.allocations
      .filter((allocation) => taskIdSet.has(allocation.taskId))
      .map((allocation) => allocation.personId),
  )

  return findPersonOverloads(
    input.people.filter((person) => personIds.has(person.id)),
    input.allocations,
  )
    .map((overload) => ({
      person: overload.person,
      period: overload.period,
      totalPercentage: overload.totalPercentage,
      contributions: overload.allocations.map((allocation) =>
        toContribution(allocation, input.projectId, index),
      ),
    }))
    .filter((conflict) =>
      conflict.contributions.some((contribution) => taskIdSet.has(contribution.allocation.taskId)),
    )
}
