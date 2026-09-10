import { describe, expect, it } from 'vitest'
import { isPathRemovedBy, planNoteDeletion } from './noteDeletion'
import type { NoteEntry } from './noteTree'

function folder(path: string): NoteEntry {
  return { path, kind: 'folder', sizeBytes: null, modifiedAt: null }
}

function file(path: string): NoteEntry {
  return { path, kind: 'file', sizeBytes: 1000, modifiedAt: '2026-09-03T09:00:00Z' }
}

const ENTRIES: NoteEntry[] = [
  file('notas/leituras.md'),
  folder('notas/projetos'),
  file('notas/projetos/adr-roteador.md'),
  folder('notas/projetos/gateway'),
  file('notas/projetos/gateway/cutover.md'),
  folder('notas/time'),
]

describe('planNoteDeletion', () => {
  it('Should take only the file itself when the target is a note', () => {
    const plan = planNoteDeletion(
      ENTRIES,
      { path: 'notas/leituras.md', kind: 'file' },
      'leituras.md',
    )

    expect(plan.filePaths).toEqual(['notas/leituras.md'])
    expect(plan.folderCount).toBe(0)
  })

  it('Should gather every note of the folder, at any depth', () => {
    const plan = planNoteDeletion(ENTRIES, { path: 'notas/projetos', kind: 'folder' }, 'projetos')

    expect(plan.filePaths).toEqual([
      'notas/projetos/adr-roteador.md',
      'notas/projetos/gateway/cutover.md',
    ])
    expect(plan.folderCount).toBe(1)
  })

  it('Should report an empty folder with nothing to take out of the index', () => {
    const plan = planNoteDeletion(ENTRIES, { path: 'notas/time', kind: 'folder' }, 'time')

    expect(plan.filePaths).toEqual([])
    expect(plan.folderCount).toBe(0)
  })

  // A pasta irmã começa com o mesmo texto e não pode entrar no lote: `notas/projetos-antigos`
  // sobrevive a apagar `notas/projetos`.
  it('Should not catch the sibling folder whose name starts the same', () => {
    const entries = [...ENTRIES, folder('notas/projetos-antigos'), file('notas/projetos-antigos/x.md')]
    const plan = planNoteDeletion(entries, { path: 'notas/projetos', kind: 'folder' }, 'projetos')

    expect(plan.filePaths).not.toContain('notas/projetos-antigos/x.md')
  })
})

describe('isPathRemovedBy', () => {
  const plan = planNoteDeletion(ENTRIES, { path: 'notas/projetos', kind: 'folder' }, 'projetos')

  it('Should say the open note inside the folder is gone', () => {
    expect(isPathRemovedBy(plan, 'notas/projetos/gateway/cutover.md')).toBe(true)
  })

  it('Should say the folder itself is gone', () => {
    expect(isPathRemovedBy(plan, 'notas/projetos')).toBe(true)
  })

  it('Should leave the note outside the folder open', () => {
    expect(isPathRemovedBy(plan, 'notas/leituras.md')).toBe(false)
  })
})
