export const CAPACITY_HEAT_LEVELS = ['inactive', 'free', 'light', 'medium', 'heavy', 'over'] as const

export type CapacityHeatLevel = (typeof CAPACITY_HEAT_LEVELS)[number]

const FULL_ALLOCATION_PERCENTAGE = 100
const HEAVY_THRESHOLD = 90
const MEDIUM_THRESHOLD = 60

export function toHeatLevel(percentage: number, isActive: boolean): CapacityHeatLevel {
  if (!isActive) {
    return 'inactive'
  }

  if (percentage > FULL_ALLOCATION_PERCENTAGE) {
    return 'over'
  }

  if (percentage === 0) {
    return 'free'
  }

  if (percentage >= HEAVY_THRESHOLD) {
    return 'heavy'
  }

  return percentage >= MEDIUM_THRESHOLD ? 'medium' : 'light'
}

export function isOverCapacity(percentage: number): boolean {
  return percentage > FULL_ALLOCATION_PERCENTAGE
}

export function toHours(percentage: number, weeklyCapacityHours: number): number {
  return (percentage / FULL_ALLOCATION_PERCENTAGE) * weeklyCapacityHours
}
