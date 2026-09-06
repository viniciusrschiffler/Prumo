import { differenceInDays, weekdayIndex } from '@/domain/dates/isoDateMath'
import type { IsoDate, IsoDateTime } from '@/domain/schemas/primitives'

const WITHOUT_DATE = 'sem data'

export function formatShortDate(date: IsoDate): string {
  const [, month, day] = date.split('-')

  return `${day}/${month}`
}

const WEEKDAY_ABBREVIATIONS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const

export function formatWeekdayAbbreviation(date: IsoDate): string {
  return WEEKDAY_ABBREVIATIONS[weekdayIndex(date)] ?? ''
}

export function formatWeekdayShortDate(date: IsoDate): string {
  return `${formatWeekdayAbbreviation(date)}, ${formatShortDate(date)}`
}

export function formatDueLabel(dueDate: IsoDate | null, today: IsoDate): string {
  if (dueDate === null) {
    return WITHOUT_DATE
  }

  const days = differenceInDays(today, dueDate)

  if (days < 0) {
    return `+${Math.abs(days)}d`
  }

  if (days === 0) {
    return 'hoje'
  }

  if (days === 1) {
    return 'amanhã'
  }

  return formatShortDate(dueDate)
}

const TIME_PART_LENGTH = 2

function pad(value: number): string {
  return String(value).padStart(TIME_PART_LENGTH, '0')
}

function toLocalIsoDate(moment: Date): IsoDate {
  return `${moment.getFullYear()}-${pad(moment.getMonth() + 1)}-${pad(moment.getDate())}`
}

// A mesma razão do formatModifiedAt: hora sozinha só é honesta para o que foi concluído hoje.
export function formatCompletedLabel(completedAt: IsoDateTime | null, today: IsoDate): string {
  if (completedAt === null) {
    return WITHOUT_DATE
  }

  const moment = new Date(completedAt)

  if (Number.isNaN(moment.getTime())) {
    return WITHOUT_DATE
  }

  return toLocalIsoDate(moment) === today
    ? `${pad(moment.getHours())}:${pad(moment.getMinutes())}`
    : formatShortDate(toLocalIsoDate(moment))
}
