import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildNotes } from '../../../scripts/seed/seedData.ts'
import { DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { extractDocumentTitle, parseMarkdown } from './markdownBlocks'
import { countLines, countWords } from './noteDocument'
import { noteBaseName } from './notePath'
import {
  ALL_NOTES_FILTER,
  buildNoteRows,
  findNoteRow,
  listNoteProjectOptions,
  selectPathsForFilter,
  type NoteRow,
  type NotesSnapshot,
} from './noteRow'
import { buildNoteTree, filterNoteTree, type NoteEntry } from './noteTree'

// O seed grava os arquivos no disco e as linhas no banco a partir da mesma lista, então a
// árvore do teste nasce dela: é o que a varredura da pasta encontraria.
function buildDiskEntries(): NoteEntry[] {
  return buildNotes().map((note) => ({
    path: note.path,
    kind: 'file' as const,
    sizeBytes: Buffer.byteLength(note.content, 'utf8'),
    modifiedAt: `${DESIGN_TODAY}T09:00:00Z`,
  }))
}

let snapshot: NotesSnapshot
let rows: NoteRow[]

beforeAll(() => {
  const database: DatabaseSync = openSeedDatabase()
  const projects = readProjectsSnapshot(database)

  snapshot = {
    entries: buildDiskEntries(),
    notes: projects.notes,
    projects: projects.projects,
    tasks: projects.tasks,
    phases: projects.phases,
    events: projects.events,
  }
  rows = buildNoteRows(snapshot)
})

// O mockup desenha 9 arquivos em 5 pastas; o seed tem 3 arquivos e nenhuma pasta. Vale o
// derivado, e a árvore fica plana até alguém criar uma pasta.
describe('A árvore de Notas sobre o seed', () => {
  it('Should list three flat markdown files and no folder', () => {
    const tree = buildNoteTree(snapshot.entries)

    expect(tree.map((node) => node.name)).toEqual([
      'decisao-provedor.md',
      'migracao-do-gateway.md',
      'portal-do-parceiro.md',
    ])
    expect(tree.every((node) => node.kind === 'file' && node.depth === 0)).toBe(true)
  })
})

describe('O filtro por projeto da barra lateral', () => {
  it('Should count 3 in all, 2 in the gateway and 1 in the portal', () => {
    expect(listNoteProjectOptions(rows).map((option) => [option.id, option.count])).toEqual([
      [ALL_NOTES_FILTER, 3],
      ['gateway', 2],
      ['parceiro', 1],
    ])
  })

  // O mockup mostra "Sem projeto 4"; no seed toda nota está vinculada.
  it('Should leave "sem projeto" out, because every note is linked', () => {
    expect(rows.filter((row) => row.project === null)).toHaveLength(0)
  })

  it('Should keep only the two gateway notes under the gateway filter', () => {
    const allowed = selectPathsForFilter(rows, 'gateway')
    const filtered = filterNoteTree(buildNoteTree(snapshot.entries), allowed)

    expect(filtered.map((node) => node.name)).toEqual([
      'decisao-provedor.md',
      'migracao-do-gateway.md',
    ])
  })
})

describe('O tipo de cada nota do seed', () => {
  it('Should call the provider decision an event note, by the event it links to', () => {
    const row = findNoteRow(rows, 'notas/decisao-provedor.md')

    expect(row?.kind).toBe('event')
    expect(row?.event?.id).toBe('ev-gw-dec2')
    expect(row?.event?.type).toBe('decision')
    expect(row?.event?.eventDate).toBe('2026-08-05')
  })

  it('Should call the other two project notes', () => {
    expect(findNoteRow(rows, 'notas/migracao-do-gateway.md')?.kind).toBe('project')
    expect(findNoteRow(rows, 'notas/portal-do-parceiro.md')?.kind).toBe('project')
  })

  it('Should paint the row with the current phase of its project', () => {
    expect(findNoteRow(rows, 'notas/migracao-do-gateway.md')?.phase?.id).toBe('development')
    expect(findNoteRow(rows, 'notas/portal-do-parceiro.md')?.phase?.id).toBe(
      'external_homologation',
    )
  })
})

describe('O preview e o rodapé sobre o conteúdo do seed', () => {
  it('Should take the title of the note out of its first heading', () => {
    const note = buildNotes().find((candidate) => candidate.path === 'notas/decisao-provedor.md')
    const { title, body } = extractDocumentTitle(
      parseMarkdown(note?.content ?? ''),
      noteBaseName(note?.path ?? ''),
    )

    expect(title).toBe('Manter o provedor atual no piloto')
    expect(body.every((block) => !(block.kind === 'heading' && block.level === 1))).toBe(true)
  })

  it('Should count the words and lines the status bar prints', () => {
    const note = buildNotes().find((candidate) => candidate.path === 'notas/portal-do-parceiro.md')

    expect(countWords(note?.content ?? '')).toBe(20)
    expect(countLines(note?.content ?? '')).toBe(6)
  })
})
