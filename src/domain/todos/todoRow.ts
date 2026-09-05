import { deriveCurrentPhase } from '@/domain/derived/deriveCurrentPhase'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'
import type { Tag } from '@/domain/schemas/tagSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import type { Todo, TodoRecurrence, TodoTag } from '@/domain/schemas/todoSchema'

export type TodosSnapshot = {
  todos: readonly Todo[]
  todoTags: readonly TodoTag[]
  recurrences: readonly TodoRecurrence[]
  projects: readonly Project[]
  tasks: readonly Task[]
  phases: readonly Phase[]
  tags: readonly Tag[]
}

export type TodoRow = {
  todo: Todo
  project: Project | null
  phase: Phase | null
  tags: readonly Tag[]
}

export type ProjectWithPhase = {
  project: Project
  phase: Phase | null
}

function buildPhasesByProject(snapshot: TodosSnapshot): Map<EntityId, Phase | null> {
  return new Map(
    snapshot.projects.map((project) => [
      project.id,
      deriveCurrentPhase(
        snapshot.tasks.filter((task) => task.projectId === project.id),
        snapshot.phases,
      ),
    ]),
  )
}

export function listProjectsWithPhase(snapshot: TodosSnapshot): ProjectWithPhase[] {
  const phasesByProject = buildPhasesByProject(snapshot)

  return snapshot.projects
    .filter((project) => project.archivedAt === null)
    .map((project) => ({ project, phase: phasesByProject.get(project.id) ?? null }))
}

export function buildTodoRows(snapshot: TodosSnapshot): TodoRow[] {
  const projectsById = new Map(snapshot.projects.map((project) => [project.id, project]))
  const tagsById = new Map(snapshot.tags.map((tag) => [tag.id, tag]))
  const phasesByProject = buildPhasesByProject(snapshot)

  return snapshot.todos.map((todo) => {
    const project = todo.projectId === null ? null : projectsById.get(todo.projectId) ?? null

    return {
      todo,
      project,
      phase: project === null ? null : phasesByProject.get(project.id) ?? null,
      tags: snapshot.todoTags
        .filter((link) => link.todoId === todo.id)
        .flatMap((link) => {
          const tag = tagsById.get(link.tagId)

          return tag === undefined ? [] : [tag]
        })
        .toSorted((first, second) => first.name.localeCompare(second.name, 'pt-BR')),
    }
  })
}

export function listTodoRecurrences(snapshot: TodosSnapshot): TodoRecurrence[] {
  return snapshot.recurrences.filter((recurrence) => recurrence.active)
}
