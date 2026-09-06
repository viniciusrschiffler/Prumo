import { addDays } from '@/domain/dates/isoDateMath'
import { formatIsoDayMonth } from '@/domain/format/displayDate'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Baseline, BaselineTask } from '@/domain/schemas/baselineSchema'
import type { EntityId, IsoDateTime } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'
import type { ReallocationSimulation } from './reallocationImpact'

export const REALLOCATION_REASON = 'realocação aplicada no simulador de impacto'
const BASELINE_REASON = 'realocação'

export type ReallocationIds = {
  eventId: EntityId
  baselineId: EntityId
  resumedAllocationId: EntityId
}

export type Reallocation = {
  endedAllocationId: EntityId
  endedAt: IsoDateTime
  endedReason: string
  resumedAllocation: Allocation | null
  taskId: EntityId
  taskPeriod: DatePeriod | null
  event: ProjectEvent
  baseline: Baseline
  baselineTasks: readonly BaselineTask[]
}

export type ReallocationInput = {
  simulation: ReallocationSimulation
  tasks: readonly Task[]
  baselines: readonly Baseline[]
  ids: ReallocationIds
  now: IsoDateTime
}

function nextBaselineVersion(baselines: readonly Baseline[], projectId: EntityId): number {
  return baselines
    .filter((baseline) => baseline.projectId === projectId)
    .reduce((highest, baseline) => Math.max(highest, baseline.version), 0) + 1
}

// A pessoa volta no dia seguinte ao fim do afastamento e fica até o novo fim da tarefa. Se o
// afastamento passar do fim, não há a que voltar e a alocação nova não nasce.
function buildResumedAllocation(
  input: ReallocationInput,
  taskPeriod: DatePeriod | null,
): Allocation | null {
  const { simulation, ids } = input
  const resumeStart = addDays(simulation.removalPeriod.end, 1)

  if (taskPeriod === null || resumeStart > taskPeriod.end) {
    return null
  }

  return {
    id: ids.resumedAllocationId,
    taskId: simulation.removed.allocation.taskId,
    personId: simulation.person.id,
    startDate: resumeStart,
    endDate: taskPeriod.end,
    percentage: simulation.removed.allocation.percentage,
    endedAt: null,
    endedReason: null,
  }
}

function describeReallocation(input: ReallocationInput): string {
  const { simulation } = input
  const weeks = simulation.weeksRemoved === 1 ? '1 semana' : `${simulation.weeksRemoved} semanas`
  const window = `${formatIsoDayMonth(simulation.removalPeriod.start)} → ${formatIsoDayMonth(
    simulation.removalPeriod.end,
  )}`
  const delay =
    simulation.delayInDays === 0
      ? 'sem deslocamento do fim previsto.'
      : `desloca o fim da tarefa em ${simulation.delayInDays} dias.`

  return `${simulation.person.name} sai de ${simulation.removed.task.title} por ${weeks} (${window}) e ${delay}`
}

function buildBaselineTasks(
  input: ReallocationInput,
  baselineId: EntityId,
  taskPeriod: DatePeriod | null,
): BaselineTask[] {
  const { simulation } = input

  return input.tasks
    .filter((task) => task.projectId === simulation.removed.project.id)
    .map((task) => {
      const isShifted = task.id === simulation.removed.task.id && taskPeriod !== null

      return {
        baselineId,
        taskId: task.id,
        plannedStart: isShifted ? taskPeriod.start : task.plannedStart,
        plannedEnd: isShifted ? taskPeriod.end : task.plannedEnd,
        estimatedHours: task.estimatedHours,
      }
    })
}

// A baseline congela o plano com que o projeto passa a se comparar, então ela nasce já com as
// datas novas: gravá-la antes do deslocamento faria o desvio nascer diferente de zero.
export function buildReallocation(input: ReallocationInput): Reallocation {
  const { simulation, ids } = input
  const taskPeriod = simulation.taskPeriodAfter

  return {
    endedAllocationId: simulation.removed.allocation.id,
    endedAt: input.now,
    endedReason: REALLOCATION_REASON,
    resumedAllocation: buildResumedAllocation(input, taskPeriod),
    taskId: simulation.removed.task.id,
    taskPeriod,
    event: {
      id: ids.eventId,
      projectId: simulation.removed.project.id,
      type: 'reallocation',
      eventDate: input.now.slice(0, 10),
      title: `${simulation.person.name} sai de ${simulation.removed.task.title}`,
      bodyMarkdown: describeReallocation(input),
      revertsEventId: null,
      riskOpen: false,
      expectedResumeAt: addDays(simulation.removalPeriod.end, 1),
      createdAt: input.now,
    },
    baseline: {
      id: ids.baselineId,
      projectId: simulation.removed.project.id,
      version: nextBaselineVersion(input.baselines, simulation.removed.project.id),
      createdAt: input.now,
      reason: BASELINE_REASON,
    },
    baselineTasks: buildBaselineTasks(input, ids.baselineId, taskPeriod),
  }
}
