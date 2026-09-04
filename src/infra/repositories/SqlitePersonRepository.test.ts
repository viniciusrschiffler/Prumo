import { beforeEach, describe, expect, it } from 'vitest'
import { PrumoError } from '@/domain/errors/PrumoError'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { buildPerson } from '@/domain/testing/entityBuilders'
import { SqlitePersonRepository } from './SqlitePersonRepository'

let gateway: SqlGateway
let repository: SqlitePersonRepository

async function seedProjectWithAllocation(personId: string): Promise<void> {
  await gateway.executeBatch([
    {
      query:
        'INSERT INTO project (id, name, status, priority, created_at) VALUES (?, ?, ?, ?, ?)',
      values: ['project-1', 'Migração do gateway', 'active', 'P1', '2026-03-01T12:00:00Z'],
    },
    {
      query:
        'INSERT INTO task (id, project_id, phase_id, title, status) VALUES (?, ?, ?, ?, ?)',
      values: ['task-1', 'project-1', 'development', 'Provisionar ambiente', 'todo'],
    },
    {
      query:
        'INSERT INTO allocation (id, task_id, person_id, start_date, end_date, percentage) VALUES (?, ?, ?, ?, ?, ?)',
      values: ['allocation-1', 'task-1', personId, '2026-03-01', '2026-03-31', 50],
    },
  ])
}

beforeEach(() => {
  gateway = createInMemoryGateway()
  repository = new SqlitePersonRepository(gateway)
})

describe('SqlitePersonRepository', () => {
  it('Should store a person and read it back with the same values', async () => {
    const person = buildPerson({ id: 'ana', name: 'Ana Nogueira', weeklyCapacityHours: 32 })

    await repository.save(person)

    expect(await repository.findById('ana')).toEqual(person)
  })

  it('Should round trip a boolean through the integer column', async () => {
    await repository.save(buildPerson({ id: 'ana', active: false }))

    expect((await repository.findById('ana'))?.active).toBe(false)
  })

  it('Should round trip a null role', async () => {
    await repository.save(buildPerson({ id: 'ana', role: null }))

    expect((await repository.findById('ana'))?.role).toBeNull()
  })

  it('Should return null for an unknown id', async () => {
    expect(await repository.findById('ninguem')).toBeNull()
  })

  it('Should list people ordered by name', async () => {
    await repository.save(buildPerson({ id: 'rafael', name: 'Rafael Brito' }))
    await repository.save(buildPerson({ id: 'ana', name: 'Ana Nogueira' }))

    expect((await repository.listAll()).map((person) => person.name)).toEqual([
      'Ana Nogueira',
      'Rafael Brito',
    ])
  })

  it('Should update in place instead of duplicating on a second save', async () => {
    await repository.save(buildPerson({ id: 'ana', weeklyCapacityHours: 40 }))
    await repository.save(buildPerson({ id: 'ana', weeklyCapacityHours: 20 }))

    const people = await repository.listAll()

    expect(people).toHaveLength(1)
    expect(people[0]?.weeklyCapacityHours).toBe(20)
  })

  it('Should remove a person who has no allocation', async () => {
    await repository.save(buildPerson({ id: 'ana' }))

    await repository.remove('ana')

    expect(await repository.listAll()).toEqual([])
  })

  it('Should refuse to remove a person who has allocations', async () => {
    await repository.save(buildPerson({ id: 'ana' }))
    await seedProjectWithAllocation('ana')

    await expect(repository.remove('ana')).rejects.toThrow(PrumoError)
    expect(await repository.findById('ana')).not.toBeNull()
  })

  it('Should report a public message when the removal is refused', async () => {
    await repository.save(buildPerson({ id: 'ana' }))
    await seedProjectWithAllocation('ana')

    await expect(repository.remove('ana')).rejects.toMatchObject({
      code: 'PERSON_HAS_HISTORY',
      publicMessage: expect.stringContaining('inativa'),
    })
  })

  it('Should reject a row that does not satisfy the domain schema', async () => {
    await gateway.executeBatch([
      {
        query:
          'INSERT INTO person (id, name, initials, role, weekly_capacity_hours, active) VALUES (?, ?, ?, ?, ?, ?)',
        values: ['torto', '', 'AN', null, 40, 1],
      },
    ])

    await expect(repository.listAll()).rejects.toMatchObject({ code: 'INVALID_RECORD_SHAPE' })
  })
})
