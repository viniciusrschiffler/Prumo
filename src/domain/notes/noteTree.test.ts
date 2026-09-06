import { describe, expect, it } from 'vitest'
import {
  buildNoteTree,
  countFilesIn,
  filterNoteTree,
  findFirstFile,
  type NoteEntry,
} from './noteTree'

function folder(path: string): NoteEntry {
  return { path, kind: 'folder', sizeBytes: null, modifiedAt: null }
}

function file(path: string): NoteEntry {
  return { path, kind: 'file', sizeBytes: 1000, modifiedAt: '2026-09-03T09:00:00Z' }
}

const ENTRIES: NoteEntry[] = [
  file('notas/leituras.md'),
  folder('notas/time'),
  file('notas/time/retro-agosto.md'),
  file('notas/time/1-1-rafael.md'),
  folder('notas/projetos'),
  folder('notas/projetos/migracao-gateway'),
  file('notas/projetos/migracao-gateway/adr-roteador.md'),
]

describe('buildNoteTree', () => {
  it('Should place each folder right before what lives inside it', () => {
    expect(buildNoteTree(ENTRIES).map((node) => node.path)).toEqual([
      'notas/projetos',
      'notas/projetos/migracao-gateway',
      'notas/projetos/migracao-gateway/adr-roteador.md',
      'notas/time',
      'notas/time/1-1-rafael.md',
      'notas/time/retro-agosto.md',
      'notas/leituras.md',
    ])
  })

  it('Should indent by the level below the notes root', () => {
    const byPath = new Map(buildNoteTree(ENTRIES).map((node) => [node.path, node.depth]))

    expect(byPath.get('notas/projetos')).toBe(0)
    expect(byPath.get('notas/projetos/migracao-gateway')).toBe(1)
    expect(byPath.get('notas/projetos/migracao-gateway/adr-roteador.md')).toBe(2)
  })

  it('Should count the files of a folder through every level below it', () => {
    const byPath = new Map(buildNoteTree(ENTRIES).map((node) => [node.path, node.fileCount]))

    expect(byPath.get('notas/projetos')).toBe(1)
    expect(byPath.get('notas/time')).toBe(2)
  })

  it('Should ignore anything outside the notes root', () => {
    const tree = buildNoteTree([...ENTRIES, file('export/prumo.json')])

    expect(tree.some((node) => node.path.startsWith('export'))).toBe(false)
  })

  it('Should keep an empty folder, which belongs to the user', () => {
    const tree = buildNoteTree([folder('notas/pessoal')])

    expect(tree.map((node) => node.path)).toEqual(['notas/pessoal'])
    expect(tree[0]?.fileCount).toBe(0)
  })
})

describe('filterNoteTree', () => {
  it('Should pass the whole tree through when there is no filter', () => {
    expect(filterNoteTree(buildNoteTree(ENTRIES), null)).toHaveLength(7)
  })

  it('Should keep the folders that lead to a kept file', () => {
    const filtered = filterNoteTree(
      buildNoteTree(ENTRIES),
      new Set(['notas/projetos/migracao-gateway/adr-roteador.md']),
    )

    expect(filtered.map((node) => node.path)).toEqual([
      'notas/projetos',
      'notas/projetos/migracao-gateway',
      'notas/projetos/migracao-gateway/adr-roteador.md',
    ])
  })

  it('Should recount the folder against what survived the filter', () => {
    const filtered = filterNoteTree(
      buildNoteTree(ENTRIES),
      new Set(['notas/time/retro-agosto.md']),
    )

    expect(filtered.find((node) => node.path === 'notas/time')?.fileCount).toBe(1)
  })

  it('Should drop an empty folder when a filter is on', () => {
    const filtered = filterNoteTree(buildNoteTree([folder('notas/pessoal')]), new Set())

    expect(filtered).toEqual([])
  })
})

describe('countFilesIn', () => {
  it('Should not count the folder itself, only what is under it', () => {
    expect(countFilesIn(ENTRIES, 'notas/projetos')).toBe(1)
    expect(countFilesIn(ENTRIES, 'notas')).toBe(4)
  })
})

describe('findFirstFile', () => {
  it('Should skip the folders', () => {
    expect(findFirstFile(buildNoteTree(ENTRIES))?.path).toBe(
      'notas/projetos/migracao-gateway/adr-roteador.md',
    )
  })

  it('Should give nothing when the tree has no file', () => {
    expect(findFirstFile(buildNoteTree([folder('notas/pessoal')]))).toBeNull()
  })
})
