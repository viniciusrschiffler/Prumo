import { beforeEach, describe, expect, it } from 'vitest'
import type { SqlGateway } from './SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { eraseAllData } from './eraseAllData'
import { TABLES_IN_DEPENDENCY_ORDER } from './dataTables'

let gateway: SqlGateway

async function countRows(table: string): Promise<number> {
  const rows = await gateway.select<{ total: number }[]>(`SELECT count(*) AS total FROM ${table}`)

  return rows[0]?.total ?? 0
}

async function seedProjectWithEverything(): Promise<void> {
  await gateway.executeBatch([
    {
      query:
        'INSERT INTO person (id, name, initials, weekly_capacity_hours, active) VALUES (?, ?, ?, ?, ?)',
      values: ['ana', 'Ana Nogueira', 'AN', 40, 1],
    },
    {
      query: 'INSERT INTO project (id, name, status, priority, created_at) VALUES (?, ?, ?, ?, ?)',
      values: ['gateway', 'Migração do gateway', 'active', 'P1', '2026-02-20T09:00:00Z'],
    },
    {
      query: 'INSERT INTO task (id, project_id, phase_id, title, status) VALUES (?, ?, ?, ?, ?)',
      values: ['gw-prov', 'gateway', 'development', 'Provisionar', 'todo'],
    },
    {
      query: `
        INSERT INTO allocation (id, task_id, person_id, start_date, end_date, percentage)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      values: ['al-1', 'gw-prov', 'ana', '2026-03-12', '2026-03-27', 50],
    },
    {
      query: `
        INSERT INTO project_event (id, project_id, type, event_date, title, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      values: ['ev-1', 'gateway', 'block', '2026-07-22', 'Bloqueio', '2026-07-22T16:40:00Z'],
    },
    {
      query: 'INSERT INTO note (path, project_id, updated_at) VALUES (?, ?, ?)',
      values: ['notas/decisao.md', 'gateway', '2026-07-22T16:40:00Z'],
    },
    {
      query: 'INSERT INTO note_search (path, content) VALUES (?, ?)',
      values: ['notas/decisao.md', 'conteúdo da nota'],
    },
    { query: 'INSERT INTO setting (key, value) VALUES (?, ?)', values: ['theme_preference', 'dark'] },
  ])
}

beforeEach(async () => {
  gateway = createInMemoryGateway()
  await seedProjectWithEverything()
})

describe('eraseAllData', () => {
  it('Should leave every data table empty apart from the reseeded phases', async () => {
    await eraseAllData(gateway)

    for (const table of TABLES_IN_DEPENDENCY_ORDER) {
      if (table === 'phase') {
        continue
      }

      expect(await countRows(table), `${table} deveria estar vazia`).toBe(0)
    }
  })

  it('Should put the four default phases back', async () => {
    await eraseAllData(gateway)

    const rows = await gateway.select<{ id: string }[]>('SELECT id FROM phase ORDER BY sort_order')

    expect(rows.map((row) => row.id)).toEqual([
      'development',
      'internal_homologation',
      'external_homologation',
      'production',
    ])
  })

  it('Should clear the standalone note search index', async () => {
    await eraseAllData(gateway)

    expect(await countRows('note_search')).toBe(0)
  })

  it('Should not trip over the restricted foreign keys', async () => {
    await expect(eraseAllData(gateway)).resolves.toBeGreaterThan(0)
  })

  it('Should run again on an already empty database', async () => {
    await eraseAllData(gateway)

    await expect(eraseAllData(gateway)).resolves.toBeGreaterThan(0)
  })
})
