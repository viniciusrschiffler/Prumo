import { describe, expect, it } from 'vitest'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { buildTodoRow } from '@/domain/testing/todoBuilders'
import type {
  DueGroupBucket,
  TodoGroup,
  TodoGroupingContext,
} from '@/domain/todos/todoGrouping'
import { buildGroupHeader } from './todoGroupStyles'

const CONTEXT: TodoGroupingContext = { today: '2026-09-03', weekStart: 'monday' }

function buildDueGroup(bucket: DueGroupBucket): TodoGroup {
  return { id: `due-${bucket}`, kind: 'due', bucket, items: [buildTodoRow()] }
}

describe('buildGroupHeader', () => {
  it('Should write the meta of each due group as the design prints it', () => {
    expect(buildGroupHeader(buildDueGroup('late'), CONTEXT).meta).toBe('resolver ou adiar')
    expect(buildGroupHeader(buildDueGroup('today'), CONTEXT).meta).toBe('qui, 03/09')
    expect(buildGroupHeader(buildDueGroup('week'), CONTEXT).meta).toBe('até 06/09')
    expect(buildGroupHeader(buildDueGroup('none'), CONTEXT).meta).toBe('backlog pessoal')
    expect(buildGroupHeader(buildDueGroup('later'), CONTEXT).meta).toBeNull()
  })

  it('Should paint the late group in danger and the today group in accent', () => {
    expect(buildGroupHeader(buildDueGroup('late'), CONTEXT).tone).toBe('danger')
    expect(buildGroupHeader(buildDueGroup('today'), CONTEXT).tone).toBe('accent')
    expect(buildGroupHeader(buildDueGroup('today'), CONTEXT).titleTone).toBe('default')
  })

  it('Should title the priority group with the priority and its label', () => {
    const group: TodoGroup = {
      id: 'priority-P0',
      kind: 'priority',
      priority: 'P0',
      items: [buildTodoRow()],
    }

    expect(buildGroupHeader(group, CONTEXT).title).toBe('P0 · urgente')
    expect(buildGroupHeader(group, CONTEXT).tone).toBe('danger')
  })

  it('Should take the bar color of a project group from its current phase', () => {
    const group: TodoGroup = {
      id: 'project-gateway',
      kind: 'project',
      project: buildProject({ id: 'gateway', name: 'Migração do gateway' }),
      phase: {
        id: 'development',
        name: 'Desenvolvimento',
        sortOrder: 1,
        color: 'oklch(0.545 0.16 292)',
        active: true,
      },
      items: [buildTodoRow()],
    }

    expect(buildGroupHeader(group, CONTEXT)).toEqual({
      title: 'Migração do gateway',
      meta: null,
      tone: 'phase',
      titleTone: 'muted',
      phaseColor: 'oklch(0.545 0.16 292)',
    })
  })

  it('Should fall back to a neutral bar for the group without a project', () => {
    const group: TodoGroup = {
      id: 'project-sem-projeto',
      kind: 'project',
      project: null,
      phase: null,
      items: [buildTodoRow()],
    }

    expect(buildGroupHeader(group, CONTEXT).title).toBe('Sem projeto')
    expect(buildGroupHeader(group, CONTEXT).tone).toBe('neutral')
  })
})
