import { addDays, weekdayIndex } from '@/domain/dates/isoDateMath'
import { parseDisplayDate } from '@/domain/format/displayDate'
import type { IsoDate, Priority } from '@/domain/schemas/primitives'
import { PRIORITIES } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'

export const TAG_PREFIX = '#'
export const PROJECT_PREFIX = '@'
export const PRIORITY_PREFIX = '!'

const DAY_AND_MONTH_PATTERN = /^(\d{1,2})\/(\d{1,2})$/
const FULL_DATE_PATTERN = /^\d{1,2}\/\d{1,2}\/\d{4}$/
const DIACRITICS_PATTERN = /\p{Diacritic}/gu
const DATE_PART_LENGTH = 2

const TODAY_TOKEN = 'hoje'
const TOMORROW_TOKEN = 'amanha'

const WEEKDAY_TOKENS: Readonly<Record<string, number>> = {
  dom: 0,
  domingo: 0,
  seg: 1,
  segunda: 1,
  ter: 2,
  terca: 2,
  qua: 3,
  quarta: 3,
  qui: 4,
  quinta: 4,
  sex: 5,
  sexta: 5,
  sab: 6,
  sabado: 6,
}

const DAYS_IN_WEEK = 7

export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(DIACRITICS_PATTERN, '').toLocaleLowerCase('pt-BR')
}

function pad(value: string): string {
  return value.padStart(DATE_PART_LENGTH, '0')
}

function nextWeekday(today: IsoDate, weekday: number): IsoDate {
  return addDays(today, (weekday - weekdayIndex(today) + DAYS_IN_WEEK) % DAYS_IN_WEEK)
}

// Sem ano o usuário quer a próxima ocorrência: "12/09" digitado em dezembro é do ano que vem.
function parseDayAndMonth(day: string, month: string, today: IsoDate): IsoDate | null {
  const year = Number(today.slice(0, DATE_PART_LENGTH + DATE_PART_LENGTH))
  const thisYear = parseDisplayDate(`${pad(day)}/${pad(month)}/${year}`)

  if (thisYear === null) {
    return null
  }

  return thisYear >= today ? thisYear : parseDisplayDate(`${pad(day)}/${pad(month)}/${year + 1}`)
}

export function parseDateToken(token: string, today: IsoDate): IsoDate | null {
  const normalized = normalizeText(token)

  if (normalized === TODAY_TOKEN) {
    return today
  }

  if (normalized === TOMORROW_TOKEN) {
    return addDays(today, 1)
  }

  const weekday = WEEKDAY_TOKENS[normalized]

  if (weekday !== undefined) {
    return nextWeekday(today, weekday)
  }

  if (FULL_DATE_PATTERN.test(normalized)) {
    const [day, month, year] = normalized.split('/')

    return parseDisplayDate(`${pad(day ?? '')}/${pad(month ?? '')}/${year ?? ''}`)
  }

  const dayAndMonth = DAY_AND_MONTH_PATTERN.exec(normalized)

  return dayAndMonth === null
    ? null
    : parseDayAndMonth(dayAndMonth[1] ?? '', dayAndMonth[2] ?? '', today)
}

export function parsePriorityToken(token: string): Priority | null {
  const normalized = normalizeText(token).toLocaleUpperCase('pt-BR')

  return PRIORITIES.find((priority) => priority === normalized) ?? null
}

// "@gateway" precisa achar "Migração do gateway": o usuário digita a palavra que reconhece,
// não o nome inteiro.
export function findProjectByToken(
  token: string,
  projects: readonly Project[],
): Project | null {
  const normalized = normalizeText(token)

  if (normalized === '') {
    return null
  }

  const startsWithToken = projects.find((project) =>
    normalizeText(project.name).startsWith(normalized),
  )

  if (startsWithToken !== undefined) {
    return startsWithToken
  }

  return (
    projects.find((project) =>
      normalizeText(project.name)
        .split(' ')
        .some((word) => word.startsWith(normalized)),
    ) ?? null
  )
}
