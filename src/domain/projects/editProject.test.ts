import { describe, expect, it } from 'vitest'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { buildProjectUpdate, toProjectDraft } from './editProject'

describe('toProjectDraft', () => {
  it('Should fill the form with what the project already has', () => {
    const project = buildProject({ description: 'Trocar o gateway antigo.' })

    expect(toProjectDraft({ project, tagNames: ['infra'] })).toEqual({
      name: 'Migração do gateway',
      ownerPersonId: 'ana',
      priority: 'P1',
      tagNames: ['infra'],
      plannedStart: '2026-03-12',
      plannedEnd: '2026-09-29',
      description: 'Trocar o gateway antigo.',
    })
  })
})

describe('buildProjectUpdate', () => {
  it('Should keep the status, the archiving and the pause the form never asked about', () => {
    const project = buildProject({ status: 'blocked', pausedAt: '2026-08-20T09:00:00Z' })
    const draft = { ...toProjectDraft({ project, tagNames: [] }), name: 'Gateway v2' }

    expect(buildProjectUpdate(project, draft).project).toEqual({
      ...project,
      name: 'Gateway v2',
    })
  })

  it('Should trim the name and turn a blank description into no description', () => {
    const project = buildProject()
    const draft = {
      ...toProjectDraft({ project, tagNames: [] }),
      name: '  Gateway  ',
      description: '   ',
    }
    const update = buildProjectUpdate(project, draft)

    expect(update.project.name).toBe('Gateway')
    expect(update.project.description).toBeNull()
  })

  it('Should drop the repeated tag, as the creation does', () => {
    const project = buildProject()
    const draft = {
      ...toProjectDraft({ project, tagNames: [] }),
      tagNames: ['infra', ' infra ', ''],
    }

    expect(buildProjectUpdate(project, draft).tagNames).toEqual(['infra'])
  })
})
