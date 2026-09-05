import { beforeEach, describe, expect, it } from 'vitest'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { SqliteSavedViewRepository } from './SqliteSavedViewRepository'

const INSERT_SAVED_VIEW =
  'INSERT INTO saved_view (id, name, screen, filters_json, sort_order) VALUES (?, ?, ?, ?, ?)'

let gateway: SqlGateway
let repository: SqliteSavedViewRepository

async function seedSavedView(values: readonly unknown[]): Promise<void> {
  await gateway.executeBatch([{ query: INSERT_SAVED_VIEW, values }])
}

beforeEach(() => {
  gateway = createInMemoryGateway()
  repository = new SqliteSavedViewRepository(gateway)
})

describe('SqliteSavedViewRepository', () => {
  it('Should return only the views of the requested screen', async () => {
    await seedSavedView(['sv-criticos', 'Críticos P0 e P1', 'projects', '{"priority":["P0"]}', 1])
    await seedSavedView(['sv-semana', 'Esta semana', 'todos', '{"due":"week"}', 1])

    expect((await repository.listByScreen('projects')).map((view) => view.id)).toEqual([
      'sv-criticos',
    ])
  })

  it('Should order the views by their configured position', async () => {
    await seedSavedView(['sv-sem-responsavel', 'Sem responsável', 'projects', '{}', 2])
    await seedSavedView(['sv-criticos', 'Críticos P0 e P1', 'projects', '{}', 1])

    expect((await repository.listByScreen('projects')).map((view) => view.name)).toEqual([
      'Críticos P0 e P1',
      'Sem responsável',
    ])
  })

  it('Should hand the filters over as the raw text the screen parses', async () => {
    await seedSavedView([
      'sv-criticos',
      'Críticos P0 e P1',
      'projects',
      '{"priority":["P0","P1"],"status":["active","blocked"]}',
      1,
    ])

    expect((await repository.listByScreen('projects'))[0]?.filtersJson).toBe(
      '{"priority":["P0","P1"],"status":["active","blocked"]}',
    )
  })

  it('Should return an empty list for a screen with no saved view', async () => {
    expect(await repository.listByScreen('capacity')).toEqual([])
  })
})
