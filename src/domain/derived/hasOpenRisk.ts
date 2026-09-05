import type { ProjectEvent } from '@/domain/schemas/projectEventSchema'

// Risco é derivado da existência de evento com risk_open, nunca de um status gravado.
export function hasOpenRisk(events: readonly ProjectEvent[]): boolean {
  return events.some((event) => event.riskOpen)
}
