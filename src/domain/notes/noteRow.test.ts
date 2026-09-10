import { describe, expect, it } from 'vitest'
import type { Note } from '@/domain/schemas/noteSchema'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'
import type { Project } from '@/domain/schemas/projectSchema'
import type { Task } from '@/domain/schemas/taskSchema'
import {
  ALL_NOTES_FILTER,
  buildNoteRows,
  findNoteRow,
  listNoteProjectOptions,
  selectPathsForFilter,
  WITHOUT_PROJECT_FILTER,
  type NotesSnapshot,
} from './noteRow'
import type { NoteEntry } from './noteTree'

const PHASE: Phase = {
  id: 'development',
  name: 'Desenvolvimento',
  sortOrder: 1,
  color: 'oklch(0.545 0.16 292)',
  active: true,
}

function project(id: string, name: string): Project {
  return {
    id,
    name,
    description: null,
    status: 'active',
    priority: 'P2',
    ownerPersonId: null,
    plannedStart: null,
    plannedEnd: null,
    createdAt: '2026-01-01T09:00:00Z',
    archivedAt: null,
    pausedAt: null,
  }
}

function task(id: string, projectId: string): Task {
  return {
    id,
    projectId,
    phaseId: PHASE.id,
    title: id,
    description: null,
    status: 'in_progress',
    plannedStart: null,
    plannedEnd: null,
    actualStart: null,
    actualEnd: null,
    estimatedHours: 8,
    sortOrder: 1,
  }
}

const EVENT: ProjectEvent = {
  id: 'ev-1',
  projectId: 'gateway',
  type: 'decision',
  eventDate: '2026-08-05',
  title: 'Manter o provedor atual',
  bodyMarkdown: null,
  revertsEventId: null,
  riskOpen: false,
  expectedResumeAt: null,
  createdAt: '2026-08-05T14:00:00Z',
}

function file(path: string): NoteEntry {
  return { path, kind: 'file', sizeBytes: 1400, modifiedAt: '2026-09-03T09:00:00Z' }
}

function note(path: string, projectId: string | null, eventId: string | null): Note {
  return { path, projectId, projectEventId: eventId, updatedAt: '2026-09-03T09:00:00Z' }
}

const SNAPSHOT: NotesSnapshot = {
  entries: [
    { path: 'notas/time', kind: 'folder', sizeBytes: null, modifiedAt: null },
    file('notas/decisao-provedor.md'),
    file('notas/migracao-do-gateway.md'),
    file('notas/portal-do-parceiro.md'),
    file('notas/time/leituras.md'),
  ],
  notes: [
    note('notas/decisao-provedor.md', 'gateway', 'ev-1'),
    note('notas/migracao-do-gateway.md', 'gateway', null),
    note('notas/portal-do-parceiro.md', 'parceiro', null),
  ],
  projects: [project('gateway', 'Migração do gateway'), project('parceiro', 'Portal do parceiro')],
  tasks: [task('t-1', 'gateway'), task('t-2', 'parceiro')],
  phases: [PHASE],
  events: [EVENT],
}

describe('buildNoteRows', () => {
  it('Should list the files on disk and leave the folders out', () => {
    expect(buildNoteRows(SNAPSHOT).map((row) => row.entry.path)).toEqual([
      'notas/decisao-provedor.md',
      'notas/migracao-do-gateway.md',
      'notas/portal-do-parceiro.md',
      'notas/time/leituras.md',
    ])
  })

  it('Should keep a file that has no row in the note table', () => {
    const orphan = findNoteRow(buildNoteRows(SNAPSHOT), 'notas/time/leituras.md')

    expect(orphan?.note).toBeNull()
    expect(orphan?.project).toBeNull()
    expect(orphan?.kind).toBe('personal')
  })

  it('Should read the kind from the links, not from a column', () => {
    const rows = buildNoteRows(SNAPSHOT)

    expect(findNoteRow(rows, 'notas/decisao-provedor.md')?.kind).toBe('event')
    expect(findNoteRow(rows, 'notas/migracao-do-gateway.md')?.kind).toBe('project')
  })

  it('Should resolve the linked event and the project phase', () => {
    const row = findNoteRow(buildNoteRows(SNAPSHOT), 'notas/decisao-provedor.md')

    expect(row?.event?.title).toBe('Manter o provedor atual')
    expect(row?.phase?.id).toBe(PHASE.id)
  })
})

describe('listNoteProjectOptions', () => {
  it('Should open with the total and order the projects by name', () => {
    const options = listNoteProjectOptions(buildNoteRows(SNAPSHOT))

    expect(options.map((option) => [option.id, option.count])).toEqual([
      [ALL_NOTES_FILTER, 4],
      ['gateway', 2],
      ['parceiro', 1],
      [WITHOUT_PROJECT_FILTER, 1],
    ])
  })

  it('Should leave "sem projeto" out when every note is linked', () => {
    const linkedOnly = buildNoteRows({
      ...SNAPSHOT,
      entries: SNAPSHOT.entries.filter((entry) => entry.path !== 'notas/time/leituras.md'),
    })

    expect(listNoteProjectOptions(linkedOnly).map((option) => option.id)).toEqual([
      ALL_NOTES_FILTER,
      'gateway',
      'parceiro',
    ])
  })
})

describe('selectPathsForFilter', () => {
  it('Should not filter anything under "todos"', () => {
    expect(selectPathsForFilter(buildNoteRows(SNAPSHOT), ALL_NOTES_FILTER)).toBeNull()
  })

  it('Should select the notes of one project', () => {
    expect([...(selectPathsForFilter(buildNoteRows(SNAPSHOT), 'gateway') ?? [])]).toEqual([
      'notas/decisao-provedor.md',
      'notas/migracao-do-gateway.md',
    ])
  })

  it('Should select what has no project, linked row or not', () => {
    expect([...(selectPathsForFilter(buildNoteRows(SNAPSHOT), WITHOUT_PROJECT_FILTER) ?? [])]).toEqual(
      ['notas/time/leituras.md'],
    )
  })
})
