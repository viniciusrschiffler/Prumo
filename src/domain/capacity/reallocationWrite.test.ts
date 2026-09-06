import { describe, expect, it } from 'vitest'
import type { Baseline } from '@/domain/schemas/baselineSchema'
import { buildAllocation, buildPerson, buildTask } from '@/domain/testing/entityBuilders'
import { buildProject } from '@/domain/testing/projectRowBuilders'
import { buildAllocationIndex } from './allocationDetails'
import { buildCapacityWindow } from './capacityWindow'
import { simulateReallocation, type ReallocationSimulation } from './reallocationImpact'
import { buildReallocation, REALLOCATION_REASON } from './reallocationWrite'

const TODAY = '2026-09-03'
const NOW = '2026-09-03T12:00:00Z'
const WEEKS = buildCapacityWindow(TODAY, 'monday').weeks.map((week) => week.period)

const RAFAEL = buildPerson({
  id: 'rafael',
  name: 'Rafael Brito',
  initials: 'RB',
  weeklyCapacityHours: 40,
})

const COLLECT_TASK = buildTask({
  id: 'ob-inst',
  projectId: 'observabilidade',
  title: 'Observabilidade — coleta',
  plannedStart: '2026-08-31',
  plannedEnd: '2026-10-30',
  estimatedHours: 80,
})
const CUTOVER_TASK = buildTask({
  id: 'ob-cut',
  projectId: 'observabilidade',
  title: 'Janela de cutover',
  plannedStart: '2026-09-03',
  plannedEnd: '2026-09-11',
  estimatedHours: 16,
})

const TASKS = [COLLECT_TASK, CUTOVER_TASK]

const INDEX = buildAllocationIndex({
  tasks: TASKS,
  projects: [buildProject({ id: 'observabilidade', name: 'Observabilidade' })],
  phases: [],
  weekStart: 'monday',
})

const ALLOCATION = buildAllocation({
  id: 'al-ob-1',
  personId: 'rafael',
  taskId: 'ob-inst',
  startDate: '2026-08-31',
  endDate: '2026-10-30',
  percentage: 100,
})

const BASELINES: Baseline[] = [
  {
    id: 'bl-ob-1',
    projectId: 'observabilidade',
    version: 1,
    createdAt: '2026-05-10T09:00:00Z',
    reason: 'plano inicial',
  },
]

const IDS = {
  eventId: 'ev-new',
  baselineId: 'bl-new',
  resumedAllocationId: 'al-new',
}

function simulationOf(weeksRemoved: number): ReallocationSimulation {
  const simulation = simulateReallocation({
    person: RAFAEL,
    allocationId: 'al-ob-1',
    weeksRemoved,
    allocations: [ALLOCATION],
    tasks: TASKS,
    people: [RAFAEL],
    index: INDEX,
    today: TODAY,
    weeks: WEEKS,
  })

  if (simulation === null) {
    throw new Error('A simulação do teste precisa existir.')
  }

  return simulation
}

function reallocationOf(weeksRemoved: number) {
  return buildReallocation({
    simulation: simulationOf(weeksRemoved),
    tasks: TASKS,
    baselines: BASELINES,
    ids: IDS,
    now: NOW,
  })
}

describe('buildReallocation', () => {
  it('Should end the allocation instead of deleting it, with a reason on the record', () => {
    const reallocation = reallocationOf(3)

    expect(reallocation.endedAllocationId).toBe('al-ob-1')
    expect(reallocation.endedAt).toBe(NOW)
    expect(reallocation.endedReason).toBe(REALLOCATION_REASON)
  })

  it('Should bring the person back the day after the absence, up to the new task end', () => {
    const reallocation = reallocationOf(3)

    expect(reallocation.resumedAllocation).toMatchObject({
      id: 'al-new',
      taskId: 'ob-inst',
      personId: 'rafael',
      startDate: '2026-09-24',
      endDate: '2026-11-20',
      percentage: 100,
      endedAt: null,
    })
  })

  // Sozinha na tarefa, a pessoa sempre volta antes do fim: o fim anda junto com o afastamento
  // dela. O caso só existe quando alguém fica para absorver as horas e o atraso fica menor.
  it('Should open no new allocation when the absence outlasts the task', () => {
    const covering = buildAllocation({
      id: 'al-ana',
      personId: 'ana',
      taskId: 'ob-inst',
      startDate: '2026-08-31',
      endDate: '2026-10-30',
      percentage: 100,
    })
    const light = { ...ALLOCATION, percentage: 25 }

    const simulation = simulateReallocation({
      person: RAFAEL,
      allocationId: 'al-ob-1',
      weeksRemoved: 12,
      allocations: [light, covering],
      tasks: TASKS,
      people: [RAFAEL, buildPerson({ id: 'ana', weeklyCapacityHours: 40 })],
      index: INDEX,
      today: TODAY,
      weeks: WEEKS,
    })

    const reallocation = buildReallocation({
      simulation: simulation as ReallocationSimulation,
      tasks: TASKS,
      baselines: BASELINES,
      ids: IDS,
      now: NOW,
    })

    expect(simulation?.delayInDays).toBe(21)
    expect(reallocation.resumedAllocation).toBeNull()
  })

  it('Should move the planned end of the task by the delay', () => {
    expect(reallocationOf(3).taskPeriod).toEqual({ start: '2026-08-31', end: '2026-11-20' })
  })

  it('Should register a reallocation event on the project of the task', () => {
    const { event } = reallocationOf(3)

    expect(event.type).toBe('reallocation')
    expect(event.projectId).toBe('observabilidade')
    expect(event.eventDate).toBe('2026-09-03')
    expect(event.expectedResumeAt).toBe('2026-09-24')
    expect(event.bodyMarkdown).toContain('3 semanas')
    expect(event.bodyMarkdown).toContain('21 dias')
  })

  it('Should freeze the next baseline version of the project', () => {
    const { baseline } = reallocationOf(3)

    expect(baseline.projectId).toBe('observabilidade')
    expect(baseline.version).toBe(2)
    expect(baseline.reason).toBe('realocação')
  })

  it('Should snapshot every task of the project already with the new dates', () => {
    const { baselineTasks } = reallocationOf(3)

    expect(baselineTasks).toHaveLength(2)
    expect(baselineTasks[0]).toEqual({
      baselineId: 'bl-new',
      taskId: 'ob-inst',
      plannedStart: '2026-08-31',
      plannedEnd: '2026-11-20',
      estimatedHours: 80,
    })
    expect(baselineTasks[1]?.plannedEnd).toBe('2026-09-11')
  })

  it('Should start the baseline at version one when the project has none', () => {
    const reallocation = buildReallocation({
      simulation: simulationOf(3),
      tasks: TASKS,
      baselines: [],
      ids: IDS,
      now: NOW,
    })

    expect(reallocation.baseline.version).toBe(1)
  })
})
