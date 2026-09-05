const MILLISECONDS_PER_DAY = 86_400_000

// As telas do design estão ancoradas nesta data. O seed desloca tudo para o hoje real,
// preservando as distâncias, para a tela Hoje ter conteúdo em qualquer dia que rodar.
export const DESIGN_TODAY = '2026-09-03'

function toUtcTimestamp(date: string): number {
  const [year, month, day] = date.split('-').map(Number)

  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

function toIsoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

export function todayIsoDate(): string {
  return toIsoDate(Date.now())
}

export function addDays(date: string, days: number): string {
  return toIsoDate(toUtcTimestamp(date) + days * MILLISECONDS_PER_DAY)
}

export function differenceInDays(from: string, to: string): number {
  return (toUtcTimestamp(to) - toUtcTimestamp(from)) / MILLISECONDS_PER_DAY
}

export type DateShifter = {
  date: (designDate: string) => string
  timestamp: (designDate: string, time?: string) => string
  offsetDays: number
}

export function createDateShifter(target: string): DateShifter {
  const offsetDays = differenceInDays(DESIGN_TODAY, target)

  return {
    offsetDays,
    date: (designDate) => addDays(designDate, offsetDays),
    timestamp: (designDate, time = '12:00:00') => `${addDays(designDate, offsetDays)}T${time}Z`,
  }
}
