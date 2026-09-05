import type { TodoRecurrence } from '@/domain/schemas/todoSchema'

export const RECURRENCE_WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

export type RecurrenceWeekday = (typeof RECURRENCE_WEEKDAYS)[number]

export type RecurrenceRule = {
  frequency: 'weekly'
  weekday: RecurrenceWeekday
}

const WEEKLY_KEYWORD = 'semanal'
const RULE_SEPARATOR = '-'

const WEEKDAY_BY_CODE: Readonly<Record<string, RecurrenceWeekday>> = {
  dom: 'sunday',
  seg: 'monday',
  ter: 'tuesday',
  qua: 'wednesday',
  qui: 'thursday',
  sex: 'friday',
  sab: 'saturday',
}

export function parseRecurrenceRule(rule: string): RecurrenceRule | null {
  const [frequency, weekdayCode] = rule.split(RULE_SEPARATOR)

  if (frequency !== WEEKLY_KEYWORD || weekdayCode === undefined) {
    return null
  }

  const weekday = WEEKDAY_BY_CODE[weekdayCode]

  return weekday === undefined ? null : { frequency: 'weekly', weekday }
}

export function parseRecurrenceRules(
  recurrences: readonly TodoRecurrence[],
): { recurrence: TodoRecurrence; rule: RecurrenceRule | null }[] {
  return recurrences.map((recurrence) => ({
    recurrence,
    rule: parseRecurrenceRule(recurrence.rule),
  }))
}
