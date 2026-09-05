import { z } from 'zod'
import type { SavedViewRepository } from '@/domain/repositories/SavedViewRepository'
import { savedViewSchema, type SavedView, type Screen } from '@/domain/schemas/savedViewSchema'
import { parseRows } from '@/infra/database/parseRow'
import type { SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_BY_SCREEN = `
  SELECT id, name, screen, filters_json, sort_order
  FROM saved_view
  WHERE screen = ?
  ORDER BY sort_order, name
`

const savedViewRowSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    screen: z.string(),
    filters_json: z.string(),
    sort_order: z.number(),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    screen: row.screen,
    filtersJson: row.filters_json,
    sortOrder: row.sort_order,
  }))
  .pipe(savedViewSchema)

export class SqliteSavedViewRepository implements SavedViewRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async listByScreen(screen: Screen): Promise<SavedView[]> {
    return parseRows(
      savedViewRowSchema,
      'saved_view',
      await this.#gateway.select<unknown[]>(SELECT_BY_SCREEN, [screen]),
    )
  }
}
