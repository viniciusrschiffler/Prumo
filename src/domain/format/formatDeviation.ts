const EMPTY_MARK = '—'
const MINUS_SIGN = '−'

export function formatDeviation(deviationInDays: number | null): string {
  if (deviationInDays === null || deviationInDays === 0) {
    return EMPTY_MARK
  }

  if (deviationInDays > 0) {
    return `+${deviationInDays}d`
  }

  return `${MINUS_SIGN}${Math.abs(deviationInDays)}d`
}
