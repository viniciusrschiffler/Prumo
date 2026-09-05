import type { IsoDate } from '@/domain/schemas/primitives'

const DISPLAY_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/
const EMPTY_MARK = '—'

export function formatIsoDate(date: IsoDate | null): string {
  if (date === null) {
    return EMPTY_MARK
  }

  const [year, month, day] = date.split('-')

  return `${day}/${month}/${year}`
}

// O Date aceita 30/02 e devolve 02/03, então a única prova de que a data existe é o ida e
// volta: só é válida a entrada que sobrevive à normalização sem mudar de dia.
export function parseDisplayDate(text: string): IsoDate | null {
  const match = DISPLAY_DATE_PATTERN.exec(text.trim())

  if (match === null) {
    return null
  }

  const [, day, month, year] = match
  const candidate = `${year}-${month}-${day}`
  const normalized = new Date(`${candidate}T00:00:00Z`)

  if (Number.isNaN(normalized.getTime()) || normalized.toISOString().slice(0, 10) !== candidate) {
    return null
  }

  return candidate
}
