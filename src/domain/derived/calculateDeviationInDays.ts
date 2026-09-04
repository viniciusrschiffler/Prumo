import { differenceInDays } from '@/domain/dates/isoDateMath'
import type { IsoDate } from '@/domain/schemas/primitives'

export function calculateDeviationInDays(
  currentEnd: IsoDate | null,
  baselineEnd: IsoDate | null,
): number | null {
  if (currentEnd === null || baselineEnd === null) {
    return null
  }

  return differenceInDays(baselineEnd, currentEnd)
}

export function isDelayed(deviationInDays: number | null): boolean {
  return deviationInDays !== null && deviationInDays > 0
}
