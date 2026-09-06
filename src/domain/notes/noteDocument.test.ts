import { describe, expect, it } from 'vitest'
import type { Note } from '@/domain/schemas/noteSchema'
import { countLines, countWords, deriveNoteKind } from './noteDocument'

function note(projectId: string | null, eventId: string | null): Note {
  return {
    path: 'notas/x.md',
    projectId,
    projectEventId: eventId,
    updatedAt: '2026-09-03T09:00:00Z',
  }
}

describe('countWords', () => {
  it('Should count words separated by any whitespace', () => {
    expect(countWords('uma  nota\nde\tteste')).toBe(4)
  })

  it('Should count nothing in an empty document', () => {
    expect(countWords('   \n  ')).toBe(0)
  })
})

describe('countLines', () => {
  it('Should count the line breaks plus one', () => {
    expect(countLines('a\nb\nc')).toBe(3)
  })

  it('Should count the trailing empty line, which the editor shows', () => {
    expect(countLines('a\n')).toBe(2)
  })

  it('Should count nothing in an empty document', () => {
    expect(countLines('')).toBe(0)
  })
})

describe('deriveNoteKind', () => {
  it('Should call a note linked to an event by the event', () => {
    expect(deriveNoteKind(note('gateway', 'ev-1'))).toBe('event')
  })

  it('Should call a note linked only to a project a project note', () => {
    expect(deriveNoteKind(note('gateway', null))).toBe('project')
  })

  it('Should call an unlinked note personal, row or no row', () => {
    expect(deriveNoteKind(note(null, null))).toBe('personal')
    expect(deriveNoteKind(null)).toBe('personal')
  })
})
