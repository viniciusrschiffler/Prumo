import { beforeEach, describe, expect, it } from 'vitest'
import type { SqlGateway } from '@/infra/database/SqlGateway'
import { createInMemoryGateway } from '@/infra/testing/createInMemoryGateway'
import { SqliteSettingRepository } from './SqliteSettingRepository'

let gateway: SqlGateway
let repository: SqliteSettingRepository

beforeEach(() => {
  gateway = createInMemoryGateway()
  repository = new SqliteSettingRepository(gateway)
})

describe('SqliteSettingRepository', () => {
  it('Should return null for a key that was never written', () => {
    return expect(repository.read('theme_preference')).resolves.toBeNull()
  })

  it('Should write a key and read it back', async () => {
    await repository.write('theme_preference', 'dark')

    expect(await repository.read('theme_preference')).toBe('dark')
  })

  it('Should overwrite the value of an existing key', async () => {
    await repository.write('theme_preference', 'dark')
    await repository.write('theme_preference', 'light')

    expect(await repository.read('theme_preference')).toBe('light')
    expect(Object.keys(await repository.readAll())).toHaveLength(1)
  })

  it('Should write several preferences in a single call', async () => {
    await repository.writeMany([
      { key: 'week_start', value: 'sunday' },
      { key: 'stale_project_alert_days', value: '21' },
    ])

    expect(await repository.readAll()).toEqual({
      week_start: 'sunday',
      stale_project_alert_days: '21',
    })
  })

  it('Should refuse a key with no name instead of writing it', async () => {
    await expect(repository.writeMany([{ key: '', value: 'x' }])).rejects.toMatchObject({
      code: 'INVALID_RECORD_SHAPE',
    })
    expect(await repository.readAll()).toEqual({})
  })

  it('Should read the whole table as a plain object', async () => {
    await repository.write('a', '1')
    await repository.write('b', '2')

    expect(await repository.readAll()).toEqual({ a: '1', b: '2' })
  })
})
