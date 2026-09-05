import type { IsoDateTime } from '@/domain/schemas/primitives'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function isSameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}

// O design mostra só a hora, o que só é honesto para arquivo tocado hoje. Nos outros dias
// a hora sozinha enganaria, então sai a data.
export function formatModifiedAt(isoDateTime: IsoDateTime | null, now: Date): string {
  if (isoDateTime === null) {
    return '—'
  }

  const moment = new Date(isoDateTime)

  if (Number.isNaN(moment.getTime())) {
    return '—'
  }

  if (isSameDay(moment, now)) {
    return `${pad(moment.getHours())}:${pad(moment.getMinutes())}`
  }

  return `${pad(moment.getDate())}/${pad(moment.getMonth() + 1)}/${moment.getFullYear()}`
}
