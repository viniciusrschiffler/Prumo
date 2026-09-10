import { describe, expect, it } from 'vitest'
import { buildProjectEvent } from '@/domain/testing/entityBuilders'
import type { Note } from '@/domain/schemas/noteSchema'
import { listProjectNoteCards } from './projectNotes'

const NOTES: Note[] = [
  {
    path: 'notas/decisoes/provedor.md',
    projectId: 'gateway',
    projectEventId: 'ev-decisao',
    updatedAt: '2026-08-12T10:30:00Z',
  },
  {
    path: 'notas/gateway/runbook-cutover.md',
    projectId: 'gateway',
    projectEventId: null,
    updatedAt: '2026-09-01T09:00:00Z',
  },
  {
    path: 'notas/pessoal/leituras.md',
    projectId: null,
    projectEventId: null,
    updatedAt: '2026-09-05T09:00:00Z',
  },
]

const EVENTS = [buildProjectEvent({ id: 'ev-decisao', type: 'decision', title: 'Manter provedor' })]

describe('listProjectNoteCards', () => {
  it('Should bring only the notes this project carries, newest first', () => {
    expect(listProjectNoteCards(NOTES, EVENTS, 'gateway').map((card) => card.title)).toEqual([
      'runbook-cutover',
      'provedor',
    ])
  })

  it('Should split the file name from the folder that holds it', () => {
    const [card] = listProjectNoteCards(NOTES, EVENTS, 'gateway')

    expect(card).toMatchObject({
      title: 'runbook-cutover',
      folderPath: 'notas/gateway',
      path: 'notas/gateway/runbook-cutover.md',
    })
  })

  it('Should resolve the event of a note linked to one, and leave the other null', () => {
    const byTitle = new Map(
      listProjectNoteCards(NOTES, EVENTS, 'gateway').map((card) => [card.title, card.event]),
    )

    expect(byTitle.get('provedor')?.title).toBe('Manter provedor')
    expect(byTitle.get('runbook-cutover')).toBeNull()
  })

  it('Should give an empty list to a project with no note', () => {
    expect(listProjectNoteCards(NOTES, EVENTS, 'portal')).toEqual([])
  })
})
