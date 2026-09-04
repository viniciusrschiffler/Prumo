import { z } from 'zod'
import { entityIdSchema, isoDateSchema, isoDateTimeSchema, isOrderedPeriod } from './primitives'

export const baselineSchema = z.object({
  id: entityIdSchema,
  projectId: entityIdSchema,
  version: z.number().int().positive(),
  createdAt: isoDateTimeSchema,
  reason: z.string().min(1),
})

export const baselineTaskSchema = z
  .object({
    baselineId: entityIdSchema,
    taskId: entityIdSchema,
    plannedStart: isoDateSchema.nullable(),
    plannedEnd: isoDateSchema.nullable(),
    estimatedHours: z.number().nonnegative().nullable(),
  })
  .refine((baselineTask) => isOrderedPeriod(baselineTask.plannedStart, baselineTask.plannedEnd), {
    message: 'O fim planejado não pode ser anterior ao início planejado.',
    path: ['plannedEnd'],
  })

export type Baseline = z.infer<typeof baselineSchema>
export type BaselineTask = z.infer<typeof baselineTaskSchema>
