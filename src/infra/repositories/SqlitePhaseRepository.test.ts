import { beforeEach, describe, expect, it } from 'vitest'
import { PrumoError } from '@/domain/errors/PrumoError'
import type { Phase } from '@/domain/schemas/phaseSchema'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { SqlitePhaseRepository } from './SqlitePhaseRepository'

let gateway: SqlGateway
let repository: SqlitePhaseRepository

function buildPhase(overrides: Partial<Phase> = {}): Phase {
  return {
    id: 'discovery',
    name: 'Descoberta',
    sortOrder: 5,
    color: 'oklch(0.545 0.16 292)',
    active: true,
    ...overrides,
  }
}

async function seedTaskInPhase(phaseId: string): Promise<void> {
  await gateway.executeBatch([
    {
      query: 'INSERT INTO project (id, name, status, priority, created_at) VALUES (?, ?, ?, ?, ?)',
      values: ['project-1', 'Migração do gateway', 'active', 'P1', '2026-03-01T12:00:00Z'],
    },
    {
      query: 'INSERT INTO task (id, project_id, phase_id, title, status) VALUES (?, ?, ?, ?, ?)',
      values: ['task-1', 'project-1', phaseId, 'Provisionar ambiente', 'todo'],
    },
  ])
}

beforeEach(() => {
  gateway = createInMemoryGateway()
  repository = new SqlitePhaseRepository(gateway)
})

describe('SqlitePhaseRepository', () => {
  it('Should list the seeded phases in the configured order', async () => {
    expect((await repository.listAll()).map((phase) => phase.id)).toEqual([
      'development',
      'internal_homologation',
      'external_homologation',
      'production',
    ])
  })

  it('Should store a phase and read it back with the same values', async () => {
    const phase = buildPhase()

    await repository.save(phase)

    expect(await repository.findById('discovery')).toEqual(phase)
  })

  it('Should round trip a boolean through the integer column', async () => {
    await repository.save(buildPhase({ active: false }))

    expect((await repository.findById('discovery'))?.active).toBe(false)
  })

  it('Should return null for an unknown id', async () => {
    expect(await repository.findById('inexistente')).toBeNull()
  })

  it('Should update in place instead of duplicating on a second save', async () => {
    await repository.save(buildPhase({ name: 'Descoberta' }))
    await repository.save(buildPhase({ name: 'Descoberta técnica' }))

    const found = await repository.findById('discovery')

    expect(found?.name).toBe('Descoberta técnica')
  })

  it('Should renumber the order from one following the received sequence', async () => {
    await repository.reorder([
      'production',
      'development',
      'external_homologation',
      'internal_homologation',
    ])

    expect((await repository.listAll()).map((phase) => [phase.id, phase.sortOrder])).toEqual([
      ['production', 1],
      ['development', 2],
      ['external_homologation', 3],
      ['internal_homologation', 4],
    ])
  })

  it('Should remove a phase that has no task', async () => {
    await repository.remove('production')

    expect((await repository.listAll()).map((phase) => phase.id)).not.toContain('production')
  })

  it('Should refuse to remove a phase that has tasks', async () => {
    await seedTaskInPhase('development')

    await expect(repository.remove('development')).rejects.toThrow(PrumoError)
    expect(await repository.findById('development')).not.toBeNull()
  })

  it('Should report a public message when the removal is refused', async () => {
    await seedTaskInPhase('development')

    await expect(repository.remove('development')).rejects.toMatchObject({
      code: 'PHASE_HAS_TASKS',
      publicMessage: expect.stringContaining('Mova as tarefas'),
    })
  })

  it('Should count a cancelled task as a reason to refuse the removal', async () => {
    await gateway.executeBatch([
      {
        query:
          'INSERT INTO project (id, name, status, priority, created_at) VALUES (?, ?, ?, ?, ?)',
        values: ['project-1', 'ERP', 'active', 'P1', '2026-03-01T12:00:00Z'],
      },
      {
        query: 'INSERT INTO task (id, project_id, phase_id, title, status) VALUES (?, ?, ?, ?, ?)',
        values: ['task-1', 'project-1', 'development', 'Mapear integrações', 'cancelled'],
      },
    ])

    await expect(repository.remove('development')).rejects.toMatchObject({
      code: 'PHASE_HAS_TASKS',
    })
  })

  it('Should reject a colour that is not an oklch value', async () => {
    await gateway.executeBatch([
      {
        query: 'INSERT INTO phase (id, name, sort_order, color, active) VALUES (?, ?, ?, ?, ?)',
        values: ['torta', 'Torta', 9, 'javascript:alert(1)', 1],
      },
    ])

    await expect(repository.listAll()).rejects.toMatchObject({ code: 'INVALID_RECORD_SHAPE' })
  })
})
