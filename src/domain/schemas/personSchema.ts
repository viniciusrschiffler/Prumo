import { z } from 'zod'
import { entityIdSchema } from './primitives'

export const personSchema = z.object({
  id: entityIdSchema,
  name: z.string().min(1),
  initials: z.string().min(1).max(4),
  role: z.string().nullable(),
  weeklyCapacityHours: z.number().nonnegative(),
  active: z.boolean(),
})

export type Person = z.infer<typeof personSchema>
