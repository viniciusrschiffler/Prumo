import { z } from 'zod'
import { entityIdSchema } from './primitives'

export const tagSchema = z.object({
  id: entityIdSchema,
  name: z.string().min(1),
})

export const projectTagSchema = z.object({
  projectId: entityIdSchema,
  tagId: entityIdSchema,
})

export type Tag = z.infer<typeof tagSchema>
export type ProjectTag = z.infer<typeof projectTagSchema>
