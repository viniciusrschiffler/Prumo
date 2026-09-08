import type { IsoDate } from '@/domain/schemas/primitives'

const DISPLAY_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/
const EMPTY_MARK = '—'
const MAX_DATE_DIGITS = 8

export function formatIsoDate(date: IsoDate | null): string {
  if (date === null) {
    return EMPTY_MARK
  }

  const [year, month, day] = date.split('-')

  return `${day}/${month}/${year}`
}

export function formatIsoDayMonth(date: IsoDate | null): string {
  if (date === null) {
    return EMPTY_MARK
  }

  const [, month, day] = date.split('-')

  return `${day}/${month}`
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

// O campo de data é texto, e obrigar a digitar a barra é trabalho que o teclado devolve de
// graça. O separador só entra quando o grupo seguinte já tem dígito: acrescentá-lo assim que
// o grupo fecha faria apagar o primeiro dígito do mês devolver a barra e prender o cursor.
export function maskDisplayDate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, MAX_DATE_DIGITS)

  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
    .filter((group) => group !== '')
    .join('/')
}
