import type { IsoDate } from '@/domain/schemas/primitives'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

// toISOString devolve UTC, o que troca o dia de madrugada. O planejamento é do dia local.
export function todayIsoDate(): IsoDate {
  const now = new Date()

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
