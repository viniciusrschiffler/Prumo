import { describe, expect, it } from 'vitest'
import type { Phase } from '@/domain/schemas/phaseSchema'
import { buildTask } from '@/domain/testing/entityBuilders'
import { deriveCurrentPhase } from './deriveCurrentPhase'

const PHASES: Phase[] = [
  { id: 'development', name: 'Desenvolvimento', sortOrder: 1, color: 'oklch(0.545 0.16 292)', active: true },
  { id: 'internal_homologation', name: 'Homologação interna', sortOrder: 2, color: 'oklch(0.55 0.11 212)', active: true },
  { id: 'production', name: 'Produção', sortOrder: 4, color: 'oklch(0.52 0.115 152)', active: true },
]

describe('deriveCurrentPhase', () => {
  it('Should return no phase for a project with no task', () => {
    expect(deriveCurrentPhase([], PHASES)).toBeNull()
  })

  it('Should return the phase of the earliest task still open', () => {
    const phase = deriveCurrentPhase(
      [
        buildTask({ id: 'a', phaseId: 'development', status: 'done', sortOrder: 1 }),
        buildTask({ id: 'b', phaseId: 'internal_homologation', status: 'in_progress', sortOrder: 2 }),
        buildTask({ id: 'c', phaseId: 'production', status: 'todo', sortOrder: 3 }),
      ],
      PHASES,
    )

    expect(phase?.id).toBe('internal_homologation')
  })

  it('Should follow the configured phase order, not the order the tasks arrive in', () => {
    const phase = deriveCurrentPhase(
      [
        buildTask({ id: 'a', phaseId: 'production', status: 'todo', sortOrder: 1 }),
        buildTask({ id: 'b', phaseId: 'development', status: 'todo', sortOrder: 2 }),
      ],
      PHASES,
    )

    expect(phase?.id).toBe('development')
  })

  it('Should treat a blocked task as open', () => {
    const phase = deriveCurrentPhase(
      [buildTask({ phaseId: 'internal_homologation', status: 'blocked' })],
      PHASES,
    )

    expect(phase?.id).toBe('internal_homologation')
  })

  it('Should keep the last phase reached when every task is done', () => {
    const phase = deriveCurrentPhase(
      [
        buildTask({ id: 'a', phaseId: 'development', status: 'done', sortOrder: 1 }),
        buildTask({ id: 'b', phaseId: 'production', status: 'done', sortOrder: 2 }),
      ],
      PHASES,
    )

    expect(phase?.id).toBe('production')
  })

  it('Should return no phase for a project whose only task was cancelled', () => {
    expect(deriveCurrentPhase([buildTask({ status: 'cancelled' })], PHASES)).toBeNull()
  })

  it('Should break a tie inside the same phase by the task order', () => {
    const phase = deriveCurrentPhase(
      [
        buildTask({ id: 'a', phaseId: 'development', status: 'todo', sortOrder: 2 }),
        buildTask({ id: 'b', phaseId: 'development', status: 'todo', sortOrder: 1 }),
      ],
      PHASES,
    )

    expect(phase?.id).toBe('development')
  })
})
