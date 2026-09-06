import { z } from 'zod'
import { entityIdSchema, isoDateSchema, isoDateTimeSchema } from './primitives'

export const PROJECT_EVENT_TYPES = [
  'decision',
  'scope_change',
  'replan',
  'block',
  'unblock',
  'reallocation',
  'risk',
  'note',
] as const

export const projectEventTypeSchema = z.enum(PROJECT_EVENT_TYPES)

export const projectEventSchema = z.object({
  id: entityIdSchema,
  projectId: entityIdSchema,
  type: projectEventTypeSchema,
  eventDate: isoDateSchema,
  title: z.string().min(1),
  bodyMarkdown: z.string().nullable(),
  revertsEventId: entityIdSchema.nullable(),
  riskOpen: z.boolean(),
  expectedResumeAt: isoDateSchema.nullable(),
  createdAt: isoDateTimeSchema,
})

export const projectEventTaskSchema = z.object({
  projectEventId: entityIdSchema,
  taskId: entityIdSchema,
})

export type ProjectEventType = z.infer<typeof projectEventTypeSchema>
export type ProjectEvent = z.infer<typeof projectEventSchema>
export type ProjectEventTask = z.infer<typeof projectEventTaskSchema>
