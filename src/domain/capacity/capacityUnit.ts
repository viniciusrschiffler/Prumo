export const CAPACITY_UNITS = ['percentage', 'hours'] as const

export type CapacityUnit = (typeof CAPACITY_UNITS)[number]
