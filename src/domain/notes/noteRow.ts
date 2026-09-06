import { deriveCurrentPhase } from '@/domain/derived/deriveCurrentPhase'
import type { Note } from '@/domain/schemas/noteSchema'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Project } from '@/domain/schemas/projectSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import { deriveNoteKind, type NoteKind } from './noteDocument'
import type { NoteEntry } from './noteTree'

export const ALL_NOTES_FILTER = 'all'
export const WITHOUT_PROJECT_FILTER = 'sem-projeto'

export type NotesSnapshot = {
  entries: readonly NoteEntry[]
  notes: readonly Note[]
  projects: readonly Project[]
  tasks: readonly Task[]
  phases: readonly Phase[]
  events: readonly ProjectEvent[]
}

export type NoteRow = {
  entry: NoteEntry
  note: Note | null
  project: Project | null
  phase: Phase | null
  event: ProjectEvent | null
  kind: NoteKind
}

export type NoteProjectOption = {
  id: string
  project: Project | null
  phase: Phase | null
  count: number
}

function buildPhasesByProject(snapshot: NotesSnapshot): Map<EntityId, Phase | null> {
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

// Quem manda na lista é o disco: o arquivo `.md` existe mesmo sem linha na tabela `note`, e é
// a linha que acrescenta o vínculo com projeto e com evento, nunca o contrário.
export function buildNoteRows(snapshot: NotesSnapshot): NoteRow[] {
  const notesByPath = new Map(snapshot.notes.map((note) => [note.path, note]))
  const projectsById = new Map(snapshot.projects.map((project) => [project.id, project]))
  const eventsById = new Map(snapshot.events.map((event) => [event.id, event]))
  const phasesByProject = buildPhasesByProject(snapshot)

  return snapshot.entries
    .filter((entry) => entry.kind === 'file')
    .map((entry) => {
      const note = notesByPath.get(entry.path) ?? null
      const project = note?.projectId === undefined || note.projectId === null
        ? null
        : projectsById.get(note.projectId) ?? null

      return {
        entry,
        note,
        project,
        phase: project === null ? null : phasesByProject.get(project.id) ?? null,
        event:
          note?.projectEventId === undefined || note.projectEventId === null
            ? null
            : eventsById.get(note.projectEventId) ?? null,
        kind: deriveNoteKind(note),
      }
    })
}

// Só entra na barra lateral o projeto que carrega alguma nota, e "Sem projeto" só aparece
// quando existe nota sem vínculo — mesma regra das tags da TodoList.
export function listNoteProjectOptions(rows: readonly NoteRow[]): NoteProjectOption[] {
  const withoutProject = rows.filter((row) => row.project === null).length
  const byProject = new Map<EntityId, NoteProjectOption>()

  for (const row of rows) {
    if (row.project === null) {
      continue
    }

    const existing = byProject.get(row.project.id)

    byProject.set(row.project.id, {
      id: row.project.id,
      project: row.project,
      phase: row.phase,
      count: (existing?.count ?? 0) + 1,
    })
  }

  const projectOptions = [...byProject.values()].toSorted((first, second) =>
    (first.project?.name ?? '').localeCompare(second.project?.name ?? '', 'pt-BR'),
  )

  return [
    { id: ALL_NOTES_FILTER, project: null, phase: null, count: rows.length },
    ...projectOptions,
    ...(withoutProject === 0
      ? []
      : [{ id: WITHOUT_PROJECT_FILTER, project: null, phase: null, count: withoutProject }]),
  ]
}

export function selectPathsForFilter(
  rows: readonly NoteRow[],
  filterId: string,
): ReadonlySet<string> | null {
  if (filterId === ALL_NOTES_FILTER) {
    return null
  }

  const matching = rows.filter((row) =>
    filterId === WITHOUT_PROJECT_FILTER
      ? row.project === null
      : row.project?.id === filterId,
  )

  return new Set(matching.map((row) => row.entry.path))
}

export type LinkableProject = {
  project: Project
  phase: Phase | null
}

// O arquivado sai da lista de vínculo pelo mesmo critério da TodoList: não se liga trabalho
// novo a projeto encerrado. Uma nota já ligada a ele mantém o vínculo, que é histórico.
export function listLinkableProjects(snapshot: NotesSnapshot): LinkableProject[] {
  const phasesByProject = buildPhasesByProject(snapshot)

  return snapshot.projects
    .filter((project) => project.archivedAt === null)
    .map((project) => ({ project, phase: phasesByProject.get(project.id) ?? null }))
    .toSorted((first, second) => first.project.name.localeCompare(second.project.name, 'pt-BR'))
}

export function findNoteRow(rows: readonly NoteRow[], path: string | null): NoteRow | null {
  return rows.find((row) => row.entry.path === path) ?? null
}
