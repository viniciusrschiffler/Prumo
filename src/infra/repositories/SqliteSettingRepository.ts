import { z } from 'zod'
import { PrumoError } from '@/domain/errors/PrumoError'
import type { SettingRepository } from '@/domain/repositories/SettingRepository'
import { settingSchema, type Setting } from '@/domain/schemas/settingSchema'
import type { BatchStatement, SqlGateway } from '@/infra/database/SqlGateway'

const SELECT_ALL = 'SELECT key, value FROM setting'
const SELECT_BY_KEY = 'SELECT key, value FROM setting WHERE key = ?'
const UPSERT = `
  INSERT INTO setting (key, value)
  VALUES (?, ?)
  ON CONFLICT (key) DO UPDATE SET value = excluded.value
`

function parseSettingRow(row: unknown): Setting {
  const result = settingSchema.safeParse(row)

  if (!result.success) {
    throw new PrumoError(
      'INVALID_RECORD_SHAPE',
      `linha de setting fora do formato: ${result.error.message}`,
      { cause: result.error },
    )
  }

  return result.data
}

function toUpsertStatement(setting: Setting): BatchStatement {
  return { query: UPSERT, values: [setting.key, setting.value] }
}

export class SqliteSettingRepository implements SettingRepository {
  readonly #gateway: SqlGateway

  constructor(gateway: SqlGateway) {
    this.#gateway = gateway
  }

  async read(key: string): Promise<string | null> {
    const rows = await this.#gateway.select<unknown[]>(SELECT_BY_KEY, [key])
    const row = rows[0]

    if (row === undefined) {
      return null
    }

    return parseSettingRow(row).value
  }

  async write(key: string, value: string): Promise<void> {
    await this.writeMany([{ key, value }])
  }

  async writeMany(settings: readonly Setting[]): Promise<void> {
    const parsed = z.array(settingSchema).safeParse(settings)

    if (!parsed.success) {
      throw new PrumoError(
        'INVALID_RECORD_SHAPE',
        `preferência fora do formato: ${parsed.error.message}`,
        { cause: parsed.error },
      )
    }

    await this.#gateway.executeBatch(parsed.data.map(toUpsertStatement))
  }

  async readAll(): Promise<Record<string, string>> {
    const rows = await this.#gateway.select<unknown[]>(SELECT_ALL)

    return Object.fromEntries(
      rows.map((row) => {
        const setting = parseSettingRow(row)

        return [setting.key, setting.value]
      }),
    )
  }
}
