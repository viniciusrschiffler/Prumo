import { z } from 'zod'
import { entityIdSchema } from './primitives'

export const SCREENS = [
  'today',
  'projects',
  'project',
  'timeline',
  'capacity',
  'todos',
  'notes',
  'dashboards',
  'settings',
] as const

export const screenSchema = z.enum(SCREENS)

export const savedViewSchema = z.object({
  id: entityIdSchema,
  name: z.string().min(1),
  screen: screenSchema,
  filtersJson: z.string().min(1),
  sortOrder: z.number().int(),
})

export type Screen = z.infer<typeof screenSchema>
export type SavedView = z.infer<typeof savedViewSchema>
