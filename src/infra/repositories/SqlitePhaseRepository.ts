import { z } from 'zod'
import { PrumoError } from '@/domain/errors/PrumoError'
import type { PhaseRepository } from '@/domain/repositories/PhaseRepository'
import { phaseSchema, type Phase } from '@/domain/schemas/phaseSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import { parseRow, parseRows } from '@/infra/database/parseRow'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_COLUMNS = 'id, name, sort_order, color, active'

const SELECT_ALL = `SELECT ${SELECT_COLUMNS} FROM phase ORDER BY sort_order, name`
const SELECT_BY_ID = `SELECT ${SELECT_COLUMNS} FROM phase WHERE id = ?`
const COUNT_TASKS = 'SELECT count(*) AS total FROM task WHERE phase_id = ?'
const DELETE_BY_ID = 'DELETE FROM phase WHERE id = ?'
const UPDATE_SORT_ORDER = 'UPDATE phase SET sort_order = ? WHERE id = ?'
const UPSERT = `
  INSERT INTO phase (id, name, sort_order, color, active)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET
    name = excluded.name,
    sort_order = excluded.sort_order,
    color = excluded.color,
    active = excluded.active
`

const phaseRowSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    sort_order: z.number(),
    color: z.string(),
    active: z.number(),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    color: row.color,
    active: row.active !== 0,
  }))
  .pipe(phaseSchema)

function toRowValues(phase: Phase): unknown[] {
  return [phase.id, phase.name, phase.sortOrder, phase.color, phase.active ? 1 : 0]
}

export class SqlitePhaseRepository implements PhaseRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listAll(): Promise<Phase[]> {
    const rows = await this.#gateway.select<unknown[]>(SELECT_ALL)

    return parseRows(phaseRowSchema, 'phase', rows)
  }

  async findById(id: EntityId): Promise<Phase | null> {
    const rows = await this.#gateway.select<unknown[]>(SELECT_BY_ID, [id])
    const row = rows[0]

    if (row === undefined) {
      return null
    }

    return parseRow(phaseRowSchema, 'phase', row)
  }

  async save(phase: Phase): Promise<void> {
    await this.#gateway.executeBatch([{ query: UPSERT, values: toRowValues(phase) }])
  }

  async reorder(orderedIds: readonly EntityId[]): Promise<void> {
    await this.#gateway.executeBatch(
      orderedIds.map((id, index) => ({
        query: UPDATE_SORT_ORDER,
        values: [index + 1, id],
      })),
    )
  }

  async remove(id: EntityId): Promise<void> {
    const rows = await this.#gateway.select<{ total: number }[]>(COUNT_TASKS, [id])

    if ((rows[0]?.total ?? 0) > 0) {
      throw new PrumoError('PHASE_HAS_TASKS', `fase ${id} tem tarefas e não pode ser removida`)
    }

    await this.#gateway.executeBatch([{ query: DELETE_BY_ID, values: [id] }])
  }
}
