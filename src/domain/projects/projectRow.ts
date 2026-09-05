import { groupBy } from '@/domain/collections/groupBy'
import { buildPlannedWindow } from '@/domain/derived/buildPlannedWindow'
import { calculateDeviationInDays, isDelayed } from '@/domain/derived/calculateDeviationInDays'
import { calculateProgress, type ProjectProgress } from '@/domain/derived/calculateProgress'
import { calculateTaskProgress, type TaskProgress } from '@/domain/derived/calculateTaskProgress'
import { calculateTotalEffort } from '@/domain/derived/calculateTotalEffort'
import { deriveCurrentPhase } from '@/domain/derived/deriveCurrentPhase'
import { derivePeopleSummary } from '@/domain/derived/derivePeopleSummary'
import { deriveBaselinePeriod, deriveProjectPeriod } from '@/domain/derived/deriveProjectPeriod'
import { hasOpenRisk } from '@/domain/derived/hasOpenRisk'
import { selectCurrentBaseline } from '@/domain/derived/selectCurrentBaseline'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import type { Baseline, BaselineTask } from '@/domain/schemas/baselineSchema'
import type { Note } from '@/domain/schemas/noteSchema'
import type { Person } from '@/domain/schemas/personSchema'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import type { ProjectEvent, ProjectEventTask } from '@/domain/schemas/projectEventSchema'
import type { Project } from '@/domain/schemas/projectSchema'
import type { ProjectTag, Tag } from '@/domain/schemas/tagSchema'
import type { Task, TaskDependency } from '@/domain/schemas/taskSchema'
import type { DatePeriod } from '@/domain/types/DatePeriod'

export type ProjectsSnapshot = {
  projects: readonly Project[]
  tasks: readonly Task[]
  taskDependencies: readonly TaskDependency[]
  phases: readonly Phase[]
  people: readonly Person[]
  allocations: readonly Allocation[]
  baselines: readonly Baseline[]
  baselineTasks: readonly BaselineTask[]
  events: readonly ProjectEvent[]
  eventTasks: readonly ProjectEventTask[]
  notes: readonly Note[]
  tags: readonly Tag[]
  projectTags: readonly ProjectTag[]
}

export type ProjectTaskRow = {
  task: Task
  phase: Phase | null
  people: readonly Person[]
  hasOnlyEndedAllocations: boolean
  deviationInDays: number | null
  isPlanned: boolean
}

export type ProjectRow = {
  project: Project
  currentPhase: Phase | null
  people: readonly Person[]
  hasOnlyEndedAllocations: boolean
  tagNames: readonly string[]
  effortHours: number
  countedTaskCount: number
  hoursProgress: ProjectProgress
  taskProgress: TaskProgress
  period: DatePeriod | null
  deviationInDays: number | null
  isDelayed: boolean
  hasOpenRisk: boolean
  tasks: readonly ProjectTaskRow[]
}

function currentEndOf(task: Task): string | null {
  return task.actualEnd ?? task.plannedEnd
}

function buildTaskRow(
  task: Task,
  snapshot: ProjectsSnapshot,
  baselineTasksByTaskId: Map<EntityId, BaselineTask>,
): ProjectTaskRow {
  const summary = derivePeopleSummary([task.id], snapshot.allocations, snapshot.people)

  return {
    task,
    phase: snapshot.phases.find((phase) => phase.id === task.phaseId) ?? null,
    people: summary.people,
    hasOnlyEndedAllocations: summary.hasOnlyEndedAllocations,
    deviationInDays: calculateDeviationInDays(
      currentEndOf(task),
      baselineTasksByTaskId.get(task.id)?.plannedEnd ?? null,
    ),
    isPlanned: buildPlannedWindow(task.plannedStart, task.plannedEnd) !== null,
  }
}

function buildRow(project: Project, snapshot: ProjectsSnapshot, index: ProjectIndex): ProjectRow {
  const tasks = index.tasksByProject.get(project.id) ?? []
  const countedTasks = tasks.filter((task) => task.status !== 'cancelled')
  const currentBaseline = selectCurrentBaseline(index.baselinesByProject.get(project.id) ?? [])
  const baselineTasks = index.baselineTasksByBaseline.get(currentBaseline?.id ?? '') ?? []
  const baselineTasksByTaskId = new Map(baselineTasks.map((entry) => [entry.taskId, entry]))
  const summary = derivePeopleSummary(
    countedTasks.map((task) => task.id),
    snapshot.allocations,
    snapshot.people,
  )
  const period = deriveProjectPeriod(tasks)
  const deviationInDays = calculateDeviationInDays(
    period?.end ?? null,
    deriveBaselinePeriod(baselineTasks)?.end ?? null,
  )

  return {
    project,
    currentPhase: deriveCurrentPhase(tasks, snapshot.phases),
    people: summary.people,
    hasOnlyEndedAllocations: summary.hasOnlyEndedAllocations,
    tagNames: (index.tagsByProject.get(project.id) ?? []).map((tag) => tag.name),
    effortHours: calculateTotalEffort(tasks),
    countedTaskCount: countedTasks.length,
    hoursProgress: calculateProgress(tasks),
    taskProgress: calculateTaskProgress(tasks),
    period,
    deviationInDays,
    isDelayed: isDelayed(deviationInDays),
    hasOpenRisk: hasOpenRisk(index.eventsByProject.get(project.id) ?? []),
    tasks: tasks.map((task) => buildTaskRow(task, snapshot, baselineTasksByTaskId)),
  }
}

type ProjectIndex = {
  tasksByProject: Map<EntityId, Task[]>
  baselinesByProject: Map<EntityId, Baseline[]>
  baselineTasksByBaseline: Map<EntityId, BaselineTask[]>
  eventsByProject: Map<EntityId, ProjectEvent[]>
  tagsByProject: Map<EntityId, Tag[]>
}

function buildIndex(snapshot: ProjectsSnapshot): ProjectIndex {
  const tagsById = new Map(snapshot.tags.map((tag) => [tag.id, tag]))
  const namedProjectTags = snapshot.projectTags
    .map((link) => ({ projectId: link.projectId, tag: tagsById.get(link.tagId) }))
    .filter((link): link is { projectId: EntityId; tag: Tag } => link.tag !== undefined)

  return {
    tasksByProject: groupBy(snapshot.tasks, (task) => task.projectId),
    baselinesByProject: groupBy(snapshot.baselines, (baseline) => baseline.projectId),
    baselineTasksByBaseline: groupBy(snapshot.baselineTasks, (entry) => entry.baselineId),
    eventsByProject: groupBy(snapshot.events, (event) => event.projectId),
    tagsByProject: new Map(
      [...groupBy(namedProjectTags, (link) => link.projectId)].map(([projectId, links]) => [
        projectId,
        links.map((link) => link.tag),
      ]),
    ),
  }
}

export function buildProjectRows(snapshot: ProjectsSnapshot): ProjectRow[] {
  const index = buildIndex(snapshot)

  return snapshot.projects.map((project) => buildRow(project, snapshot, index))
}
