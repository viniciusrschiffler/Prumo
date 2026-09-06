import { z } from 'zod'
import {
  entityIdSchema,
  isoDateSchema,
  isoDateTimeSchema,
  isOrderedPeriod,
  prioritySchema,
} from './primitives'

export const PROJECT_STATUSES = [
  'discovery',
  'active',
  'blocked',
  'paused',
  'completed',
  'cancelled',
] as const

export const projectStatusSchema = z.enum(PROJECT_STATUSES)

export const projectSchema = z
  .object({
    id: entityIdSchema,
    name: z.string().min(1),
    description: z.string().nullable(),
    status: projectStatusSchema,
    priority: prioritySchema,
    ownerPersonId: entityIdSchema.nullable(),
    plannedStart: isoDateSchema.nullable(),
    plannedEnd: isoDateSchema.nullable(),
    createdAt: isoDateTimeSchema,
    archivedAt: isoDateTimeSchema.nullable(),
    pausedAt: isoDateTimeSchema.nullable(),
  })
  .refine((project) => isOrderedPeriod(project.plannedStart, project.plannedEnd), {
    message: 'O fim previsto não pode ser anterior ao início previsto.',
    path: ['plannedEnd'],
  })

export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type Project = z.infer<typeof projectSchema>
