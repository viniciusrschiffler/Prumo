import { describe, expect, it } from 'vitest'
import {
  buildUniqueNotePath,
  isInsideNotesRoot,
  isMarkdownPath,
  joinNotePath,
  noteBaseName,
  noteDepth,
  noteFileName,
  noteFolderOf,
  toNoteSlug,
} from './notePath'

describe('joinNotePath', () => {
  it('Should join segments with a single separator', () => {
    expect(joinNotePath('notas', 'projetos', 'x.md')).toBe('notas/projetos/x.md')
  })

  it('Should flatten segments that already carry separators', () => {
    expect(joinNotePath('notas/projetos', '/x.md')).toBe('notas/projetos/x.md')
  })

  it('Should drop empty segments', () => {
    expect(joinNotePath('notas', '', 'x.md')).toBe('notas/x.md')
  })
})

describe('noteFolderOf and noteFileName', () => {
  it('Should split the last segment off the folder', () => {
    expect(noteFolderOf('notas/time/1-1-rafael.md')).toBe('notas/time')
    expect(noteFileName('notas/time/1-1-rafael.md')).toBe('1-1-rafael.md')
  })

  it('Should give an empty folder to a single segment', () => {
    expect(noteFolderOf('notas')).toBe('')
  })
})

describe('noteBaseName', () => {
  it('Should drop the markdown extension', () => {
    expect(noteBaseName('notas/retro-agosto.md')).toBe('retro-agosto')
  })

  it('Should keep a name without extension', () => {
    expect(noteBaseName('notas/time')).toBe('time')
  })
})

describe('isMarkdownPath', () => {
  it('Should accept .md in any case and refuse anything else', () => {
    expect(isMarkdownPath('notas/x.md')).toBe(true)
    expect(isMarkdownPath('notas/x.MD')).toBe(true)
    expect(isMarkdownPath('notas/x.txt')).toBe(false)
  })
})

describe('isInsideNotesRoot', () => {
  it('Should only accept a path rooted at notas', () => {
    expect(isInsideNotesRoot('notas/x.md')).toBe(true)
    expect(isInsideNotesRoot('export/x.md')).toBe(false)
  })
})

describe('noteDepth', () => {
  it('Should count levels below the notes root, which is not drawn', () => {
    expect(noteDepth('notas/leituras.md')).toBe(0)
    expect(noteDepth('notas/time')).toBe(0)
    expect(noteDepth('notas/time/1-1-rafael.md')).toBe(1)
    expect(noteDepth('notas/projetos/migracao/adr.md')).toBe(2)
  })
})

describe('toNoteSlug', () => {
  it('Should strip accents, case and punctuation', () => {
    expect(toNoteSlug('Migração do gateway')).toBe('migracao-do-gateway')
    expect(toNoteSlug('ADR 004 — roteador de pagamentos')).toBe('adr-004-roteador-de-pagamentos')
  })

  it('Should not leave dashes on the edges', () => {
    expect(toNoteSlug('  1:1 com Rafael  ')).toBe('1-1-com-rafael')
  })

  it('Should fall back when nothing survives', () => {
    expect(toNoteSlug('···')).toBe('nota')
  })
})

describe('buildUniqueNotePath', () => {
  it('Should keep the plain name when it is free', () => {
    expect(buildUniqueNotePath('notas', 'nota-nova', new Set())).toBe('notas/nota-nova.md')
  })

  it('Should number the name up until it is free', () => {
    const taken = new Set(['notas/nota-nova.md', 'notas/nota-nova-2.md'])

    expect(buildUniqueNotePath('notas', 'nota-nova', taken)).toBe('notas/nota-nova-3.md')
  })
})
