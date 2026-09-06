import type { DatabaseSync } from 'node:sqlite'
import { beforeAll, describe, expect, it } from 'vitest'
import { DESIGN_TODAY } from '../../../scripts/seed/seedDates.ts'
import type { ProjectsSnapshot } from '@/domain/projects/projectRow'
import { openSeedDatabase } from '@/domain/testing/seedDatabase'
import { readProjectsSnapshot } from '@/domain/testing/seedReaders'
import { toBarGeometry } from './timelineGeometry'
import {
  buildTimelineRows,
  collectRowPeriods,
  countOverloads,
  countVisibleItems,
  type TimelineRows,
} from './timelineRows'
import { buildTimelineWindow } from './timelineWindow'

let database: DatabaseSync
let snapshot: ProjectsSnapshot
let rows: TimelineRows

beforeAll(() => {
  database = openSeedDatabase()
  snapshot = readProjectsSnapshot(database)
  rows = buildTimelineRows(snapshot, DESIGN_TODAY)
})

describe('Janela da Timeline sobre o seed', () => {
  it('Should span the nine whole months that hold every project', () => {
    const window = buildTimelineWindow(collectRowPeriods(rows), 'month', DESIGN_TODAY, 'monday')

    expect(window?.period).toEqual({ start: '2026-02-01', end: '2026-10-31' })
    expect(window?.ticks).toHaveLength(9)
  })
})

describe('Agrupamento por projeto', () => {
  it('Should leave the archived project out and order the rest by when they start', () => {
    expect(rows.project.map((row) => row.name)).toEqual([
      'Portal do parceiro',
      'Migração do gateway',
      'Observabilidade',
      'App de campo v2',
    ])
  })

  it('Should count every task of every expanded project as a visible one', () => {
    const expanded = new Set(rows.project.map((row) => row.id))

    expect(countVisibleItems(rows.project, expanded)).toBe(10)
    expect(countVisibleItems(rows.project, new Set())).toBe(0)
  })

  it('Should put the gateway eleven days past its current baseline', () => {
    const gateway = rows.project.find((row) => row.id === 'gateway')

    expect(gateway?.period).toEqual({ start: '2026-03-12', end: '2026-09-29' })
    expect(gateway?.baselinePeriod).toEqual({ start: '2026-03-12', end: '2026-09-18' })
    expect(gateway?.deviationInDays).toBe(11)
  })

  it('Should hatch the gateway exactly between its block and its unblock', () => {
    expect(rows.project.find((row) => row.id === 'gateway')?.blockedPeriods).toEqual([
      { start: '2026-07-22', end: '2026-07-30' },
    ])
  })

  it('Should hatch the partner portal from the open block up to today, the twenty three days of the badge', () => {
    const partner = rows.project.find((row) => row.id === 'parceiro')

    expect(partner?.blockedPeriods).toEqual([{ start: '2026-08-11', end: DESIGN_TODAY }])
    expect(partner?.blockedDays).toBe(23)
  })

  it('Should hatch the paused project from the moment it was paused', () => {
    const field = rows.project.find((row) => row.id === 'campo')

    expect(field?.pausedPeriod).toEqual({ start: '2026-08-28', end: '2026-10-02' })
    expect(field?.deviationInDays).toBe(-2)
  })

  it('Should refuse to drag what already happened and allow what is still only planned', () => {
    const gateway = rows.project.find((row) => row.id === 'gateway')
    const provisioning = gateway?.tasks.find((task) => task.id === 'gw-prov')
    const rewrite = gateway?.tasks.find((task) => task.id === 'gw-rew')
    const cutover = gateway?.tasks.find((task) => task.id === 'gw-cut')

    expect([provisioning?.canMove, provisioning?.canResizeStart, provisioning?.canResizeEnd]).toEqual([
      false,
      false,
      false,
    ])
    expect([rewrite?.canMove, rewrite?.canResizeStart, rewrite?.canResizeEnd]).toEqual([
      false,
      false,
      true,
    ])
    expect([cutover?.canMove, cutover?.canResizeStart, cutover?.canResizeEnd]).toEqual([
      true,
      true,
      true,
    ])
  })

  it('Should flag the cutover as the task with nobody on it', () => {
    const gateway = rows.project.find((row) => row.id === 'gateway')

    expect(gateway?.tasks.filter((task) => !task.hasAssignee).map((task) => task.id)).toEqual([
      'gw-cut',
    ])
  })

  it('Should leave the undated task without a bar instead of hiding the row', () => {
    const partner = rows.project.find((row) => row.id === 'parceiro')

    expect(partner?.tasks).toHaveLength(2)
    expect(partner?.tasks.find((task) => task.id === 'pp-hom')?.period).toBeNull()
  })
})

describe('Agrupamento por pessoa', () => {
  it('Should list only the active people, keeping the ended allocations in place', () => {
    expect(rows.person.map((row) => row.name)).toEqual([
      'Ana Nogueira',
      'Marcos Teles',
      'Rafael Brito',
    ])
    expect(rows.person.reduce((total, row) => total + row.itemCount, 0)).toBe(12)
  })

  it('Should put Rafael at 150 percent in June, the overload the design flags', () => {
    expect(rows.person.find((row) => row.id === 'rafael')?.overloads).toEqual([
      { period: { start: '2026-06-01', end: '2026-06-26' }, percentage: 150 },
    ])
  })

  it('Should also flag Ana in March, which the mockup has too few allocations to show', () => {
    expect(rows.person.find((row) => row.id === 'ana')?.overloads).toEqual([
      { period: { start: '2026-03-12', end: '2026-03-27' }, percentage: 150 },
    ])
  })

  it('Should count the two conflicts the seed really has', () => {
    expect(countOverloads(rows)).toBe(2)
  })

  it('Should mark as ended the allocations that the block closed', () => {
    const ana = rows.person.find((row) => row.id === 'ana')

    expect(ana?.allocations.filter((allocation) => allocation.isEnded).map((one) => one.id)).toEqual(
      ['al-pp-2', 'al-gw-4'],
    )
  })
})

describe('Agrupamento por fase', () => {
  it('Should sum tasks and effort per phase out of the tasks, never out of a column', () => {
    expect(
      rows.phase.map((row) => [row.name, row.taskCount, row.effortHours, row.itemCount]),
    ).toEqual([
      ['Desenvolvimento', 4, 320, 3],
      ['Homologação interna', 2, 140, 2],
      ['Homologação externa', 2, 168, 1],
      ['Produção', 2, 96, 2],
    ])
  })

  it('Should draw eight bars across the four phases', () => {
    expect(rows.phase.reduce((total, row) => total + row.itemCount, 0)).toBe(8)
  })

  it('Should merge into one bar the tasks a project has inside the same phase', () => {
    const development = rows.phase.find((row) => row.id === 'development')

    expect(development?.projects.find((entry) => entry.projectId === 'gateway')?.period).toEqual({
      start: '2026-03-12',
      end: '2026-05-15',
    })
  })
})

describe('Geometria sobre a janela do seed', () => {
  it('Should place the gateway bar over the nine month window', () => {
    const window = buildTimelineWindow(collectRowPeriods(rows), 'month', DESIGN_TODAY, 'monday')
    const gateway = rows.project.find((row) => row.id === 'gateway')
    const geometry =
      window === null || gateway?.period == null ? null : toBarGeometry(window, gateway.period)

    expect(window?.spanDays).toBe(273)
    expect(Number(geometry?.leftPercent.toFixed(2))).toBe(14.29)
    expect(Number(geometry?.widthPercent.toFixed(2))).toBe(73.63)
  })
})
