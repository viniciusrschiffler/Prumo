import { z } from 'zod'

export const PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const

export const entityIdSchema = z.string().min(1)
export const isoDateSchema = z.iso.date()
export const isoDateTimeSchema = z.iso.datetime()
export const prioritySchema = z.enum(PRIORITIES)

export type EntityId = z.infer<typeof entityIdSchema>
export type IsoDate = z.infer<typeof isoDateSchema>
export type IsoDateTime = z.infer<typeof isoDateTimeSchema>
export type Priority = z.infer<typeof prioritySchema>

export function isOrderedPeriod(start: IsoDate | null, end: IsoDate | null): boolean {
  if (start === null || end === null) {
    return true
  }

  return end >= start
}
