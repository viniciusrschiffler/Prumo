import { describe, expect, it } from 'vitest'
import { buildNewProject, validateNewProject, type NewProjectDraft } from './newProject'

const IDS = { projectId: 'novo', baselineId: 'bl-novo' }
const NOW = '2026-09-05T12:00:00Z'

function buildDraft(overrides: Partial<NewProjectDraft> = {}): NewProjectDraft {
  return {
    name: 'Portal do cliente',
    ownerPersonId: 'ana',
    tagNames: ['financeiro', 'web'],
    plannedStart: '2026-09-14',
    plannedEnd: '2026-12-18',
    description: null,
    ...overrides,
  }
}

describe('validateNewProject', () => {
  it('Should accept the draft the design fills in', () => {
    expect(validateNewProject(buildDraft())).toEqual({})
  })

  it('Should refuse a project with no name', () => {
    expect(validateNewProject(buildDraft({ name: '   ' })).name).toBeDefined()
  })

  it('Should refuse an end that precedes the start', () => {
    const errors = validateNewProject(
      buildDraft({ plannedStart: '2026-12-18', plannedEnd: '2026-09-14' }),
    )

    expect(errors.plannedEnd).toBeDefined()
  })

  it('Should accept a project with no window at all', () => {
    expect(validateNewProject(buildDraft({ plannedStart: null, plannedEnd: null }))).toEqual({})
  })

  it('Should accept a project with only one end of the window', () => {
    expect(validateNewProject(buildDraft({ plannedEnd: null }))).toEqual({})
  })
})

describe('buildNewProject', () => {
  it('Should start the project in discovery, as the modal announces', () => {
    expect(buildNewProject(buildDraft(), IDS, NOW).project.status).toBe('discovery')
  })

  it('Should create the first baseline with the initial plan as its reason', () => {
    expect(buildNewProject(buildDraft(), IDS, NOW).baseline).toEqual({
      id: 'bl-novo',
      projectId: 'novo',
      version: 1,
      createdAt: NOW,
      reason: 'plano inicial',
    })
  })

  it('Should trim the name and keep the planned window', () => {
    const created = buildNewProject(buildDraft({ name: '  Portal  ' }), IDS, NOW)

    expect(created.project.name).toBe('Portal')
    expect(created.project.plannedStart).toBe('2026-09-14')
    expect(created.project.plannedEnd).toBe('2026-12-18')
  })

  it('Should store an empty description as no description', () => {
    expect(buildNewProject(buildDraft({ description: '  ' }), IDS, NOW).project.description).toBeNull()
  })

  it('Should drop repeated and empty tags', () => {
    const created = buildNewProject(
      buildDraft({ tagNames: ['web', 'web', ' ', 'financeiro'] }),
      IDS,
      NOW,
    )

    expect(created.tagNames).toEqual(['web', 'financeiro'])
  })

  it('Should stamp the project and its baseline with the same instant', () => {
    const created = buildNewProject(buildDraft(), IDS, NOW)

    expect(created.project.createdAt).toBe(created.baseline.createdAt)
  })
})
