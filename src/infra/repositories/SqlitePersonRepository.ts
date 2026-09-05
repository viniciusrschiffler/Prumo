import { z } from 'zod'
import { PrumoError } from '@/domain/errors/PrumoError'
import type { PersonRepository } from '@/domain/repositories/PersonRepository'
import { personSchema, type Person } from '@/domain/schemas/personSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import { parseRow, parseRows } from '@/infra/database/parseRow'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_COLUMNS = 'id, name, initials, role, weekly_capacity_hours, active'

const SELECT_ALL = `SELECT ${SELECT_COLUMNS} FROM person ORDER BY name`
const SELECT_BY_ID = `SELECT ${SELECT_COLUMNS} FROM person WHERE id = ?`
const COUNT_ALLOCATIONS = 'SELECT count(*) AS total FROM allocation WHERE person_id = ?'
const DELETE_BY_ID = 'DELETE FROM person WHERE id = ?'
const UPSERT = `
  INSERT INTO person (id, name, initials, role, weekly_capacity_hours, active)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET
    name = excluded.name,
    initials = excluded.initials,
    role = excluded.role,
    weekly_capacity_hours = excluded.weekly_capacity_hours,
    active = excluded.active
`

const personRowSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    initials: z.string(),
    role: z.string().nullable(),
    weekly_capacity_hours: z.number(),
    active: z.number(),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    initials: row.initials,
    role: row.role,
    weeklyCapacityHours: row.weekly_capacity_hours,
    active: row.active !== 0,
  }))
  .pipe(personSchema)

function toRowValues(person: Person): unknown[] {
  return [
    person.id,
    person.name,
    person.initials,
    person.role,
    person.weeklyCapacityHours,
    person.active ? 1 : 0,
  ]
}

export class SqlitePersonRepository implements PersonRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Person[]> {
    const rows = await this.#gateway.select<unknown[]>(SELECT_ALL)

    return parseRows(personRowSchema, 'person', rows)
  }

  async findById(id: EntityId): Promise<Person | null> {
    const rows = await this.#gateway.select<unknown[]>(SELECT_BY_ID, [id])
    const row = rows[0]

    if (row === undefined) {
      return null
    }

    return parseRow(personRowSchema, 'person', row)
  }

  async save(person: Person): Promise<void> {
    await this.#gateway.executeBatch([{ query: UPSERT, values: toRowValues(person) }])
  }

  async remove(id: EntityId): Promise<void> {
    const rows = await this.#gateway.select<{ total: number }[]>(COUNT_ALLOCATIONS, [id])

    if ((rows[0]?.total ?? 0) > 0) {
      throw new PrumoError(
        'PERSON_HAS_HISTORY',
        `pessoa ${id} tem alocações e não pode ser removida`,
      )
    }

    await this.#gateway.executeBatch([{ query: DELETE_BY_ID, values: [id] }])
  }
}
