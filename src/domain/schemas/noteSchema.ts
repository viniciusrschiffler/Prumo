import { z } from 'zod'
import { entityIdSchema, isoDateTimeSchema } from './primitives'

export const noteSchema = z.object({
  path: z.string().min(1),
  projectId: entityIdSchema.nullable(),
  projectEventId: entityIdSchema.nullable(),
  updatedAt: isoDateTimeSchema,
})

export type Note = z.infer<typeof noteSchema>
