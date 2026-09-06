import { describe, expect, it } from 'vitest'
import {
  applyScheduleEdit,
  buildTaskReschedule,
  describeScheduleChange,
  hasScheduleChanged,
} from './timelineSchedule'

const PERIOD = { start: '2026-09-01', end: '2026-09-29' }

describe('applyScheduleEdit', () => {
  it('Should slide both ends when the whole bar moves', () => {
    expect(applyScheduleEdit(PERIOD, 'move', 4)).toEqual({
      start: '2026-09-05',
      end: '2026-10-03',
    })
    expect(applyScheduleEdit(PERIOD, 'move', -4)).toEqual({
      start: '2026-08-28',
      end: '2026-09-25',
    })
  })

  it('Should move only the edge that was grabbed', () => {
    expect(applyScheduleEdit(PERIOD, 'start', 3)).toEqual({ ...PERIOD, start: '2026-09-04' })
    expect(applyScheduleEdit(PERIOD, 'end', 3)).toEqual({ ...PERIOD, end: '2026-10-02' })
  })

  it('Should stop the start at the end instead of inverting the bar', () => {
    expect(applyScheduleEdit(PERIOD, 'start', 90)).toEqual({
      start: '2026-09-29',
      end: '2026-09-29',
    })
  })

  it('Should stop the end at the start instead of inverting the bar', () => {
    expect(applyScheduleEdit(PERIOD, 'end', -90)).toEqual({
      start: '2026-09-01',
      end: '2026-09-01',
    })
  })

  it('Should leave the period untouched when nothing was dragged', () => {
    expect(applyScheduleEdit(PERIOD, 'move', 0)).toEqual(PERIOD)
    expect(hasScheduleChanged(PERIOD, applyScheduleEdit(PERIOD, 'move', 0))).toBe(false)
  })
})

describe('describeScheduleChange', () => {
  it('Should name only the edge that really moved', () => {
    expect(describeScheduleChange(PERIOD, applyScheduleEdit(PERIOD, 'end', 4))).toBe(
      'Fim 29/09 → 03/10',
    )
    expect(describeScheduleChange(PERIOD, applyScheduleEdit(PERIOD, 'start', -2))).toBe(
      'Início 01/09 → 30/08',
    )
  })

  it('Should name both edges when the bar moved whole', () => {
    expect(describeScheduleChange(PERIOD, applyScheduleEdit(PERIOD, 'move', 7))).toBe(
      'Início 01/09 → 08/09 · Fim 29/09 → 06/10',
    )
  })
})

describe('buildTaskReschedule', () => {
  it('Should record the move as a replan event on the day it was made', () => {
    const reschedule = buildTaskReschedule({
      taskId: 'gw-cut',
      projectId: 'gateway',
      taskTitle: 'Cutover em produção',
      before: PERIOD,
      after: applyScheduleEdit(PERIOD, 'move', 7),
      eventId: 'ev-1',
      now: '2026-09-06T12:00:00Z',
    })

    expect(reschedule.period).toEqual({ start: '2026-09-08', end: '2026-10-06' })
    expect(reschedule.event).toEqual({
      id: 'ev-1',
      projectId: 'gateway',
      type: 'replan',
      eventDate: '2026-09-06',
      title: 'Cutover em produção',
      bodyMarkdown: 'Início 01/09 → 08/09 · Fim 29/09 → 06/10',
      revertsEventId: null,
      riskOpen: false,
      expectedResumeAt: null,
      createdAt: '2026-09-06T12:00:00Z',
    })
  })
})
