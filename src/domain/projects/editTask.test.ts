import { describe, expect, it } from 'vitest'
import type { Allocation } from '@/domain/schemas/allocationSchema'
import { buildAllocation, buildTask } from '@/domain/testing/entityBuilders'
import type { NewTaskDraft } from './newTask'
import { buildTaskUpdate, TASK_EDIT_ALLOCATION_REASON, toTaskDraft } from './editTask'

const NOW = '2026-09-07T09:00:00Z'

const task = buildTask()
const anaAllocation = buildAllocation({ id: 'al-ana', personId: 'ana', percentage: 50 })

function update(
  draftOverrides: Partial<NewTaskDraft>,
  allocations: readonly Allocation[] = [anaAllocation],
) {
  const draft = { ...toTaskDraft({ task, allocations }), ...draftOverrides }

  return buildTaskUpdate({
    context: { task, allocations },
    draft,
    ids: { eventId: 'ev-1', allocationIds: ['al-nova'] },
    now: NOW,
  })
}

describe('toTaskDraft', () => {
  it('Should bring only the open allocations as the assigned people', () => {
    const draft = toTaskDraft({
      task,
      allocations: [
        anaAllocation,
        buildAllocation({
          id: 'al-rafael',
          personId: 'rafael',
          endedAt: '2026-05-01T09:00:00Z',
          endedReason: 'realocação',
        }),
      ],
    })

    expect(draft.assignees).toEqual([{ personId: 'ana', percentage: 50 }])
  })

  it('Should bring the description as text, because the field is one and the column is nullable', () => {
    expect(toTaskDraft({ task, allocations: [] }).description).toBe('')
    expect(
      toTaskDraft({ task: buildTask({ description: 'Sem planilha' }), allocations: [] }).description,
    ).toBe('Sem planilha')
  })

  it('Should bring the status the task carries, so the form opens on it', () => {
    expect(toTaskDraft({ task: buildTask({ status: 'blocked' }), allocations: [] }).status).toBe(
      'blocked',
    )
  })
})

describe('buildTaskUpdate', () => {
  it('Should leave the allocations alone when only the title changed', () => {
    const result = update({ title: 'Outro título' })

    expect(result.endedAllocationIds).toEqual([])
    expect(result.openedAllocations).toEqual([])
    expect(result.event).toBeNull()
    expect(result.task.title).toBe('Outro título')
  })

  it('Should store the status and the description the form asked about', () => {
    const result = update({ status: 'done', description: '  Virada no domingo  ' })

    expect(result.task.status).toBe('done')
    expect(result.task.description).toBe('Virada no domingo')
    expect(result.event).toBeNull()
  })

  it('Should clear the description when the field was emptied', () => {
    const result = update({ description: '   ' })

    expect(result.task.description).toBeNull()
  })

  it('Should end the allocation of whoever left, never delete it', () => {
    const result = update({ assignees: [] })

    expect(result.endedAllocationIds).toEqual(['al-ana'])
    expect(result.endedAt).toBe(NOW)
    expect(result.endedReason).toBe(TASK_EDIT_ALLOCATION_REASON)
    expect(result.openedAllocations).toEqual([])
  })

  it('Should open an allocation over the task window for whoever came in', () => {
    const result = update({
      assignees: [
        { personId: 'ana', percentage: 50 },
        { personId: 'rafael', percentage: 30 },
      ],
    })

    expect(result.endedAllocationIds).toEqual([])
    expect(result.openedAllocations).toEqual([
      {
        id: 'al-nova',
        taskId: 'task-1',
        personId: 'rafael',
        startDate: '2026-03-01',
        endDate: '2026-03-10',
        percentage: 30,
        endedAt: null,
        endedReason: null,
      },
    ])
  })

  it('Should end the old allocation and open another when the percentage changed', () => {
    const result = update({ assignees: [{ personId: 'ana', percentage: 80 }] })

    expect(result.endedAllocationIds).toEqual(['al-ana'])
    expect(result.openedAllocations.map((allocation) => allocation.percentage)).toEqual([80])
  })

  it('Should register the replan when the planned window moved', () => {
    const result = update({ plannedEnd: '2026-03-20' })

    expect(result.event?.type).toBe('replan')
    expect(result.event?.bodyMarkdown).toBe('Fim 10/03 → 20/03')
    expect(result.endedAllocationIds).toEqual([])
  })

  it('Should not open an allocation when the task has no window to allocate over', () => {
    const result = update({
      plannedStart: null,
      plannedEnd: null,
      assignees: [{ personId: 'rafael', percentage: 30 }],
    })

    expect(result.openedAllocations).toEqual([])
    expect(result.endedAllocationIds).toEqual(['al-ana'])
  })
})
