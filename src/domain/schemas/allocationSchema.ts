import { z } from 'zod'
import { entityIdSchema, isoDateSchema, isoDateTimeSchema, isOrderedPeriod } from './primitives'

export const allocationSchema = z
  .object({
    id: entityIdSchema,
    taskId: entityIdSchema,
    personId: entityIdSchema,
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    percentage: z.number().positive().max(100),
    endedAt: isoDateTimeSchema.nullable(),
    endedReason: z.string().nullable(),
  })
  .refine((allocation) => isOrderedPeriod(allocation.startDate, allocation.endDate), {
    message: 'O fim da alocação não pode ser anterior ao início.',
    path: ['endDate'],
  })
  .refine((allocation) => allocation.endedReason === null || allocation.endedAt !== null, {
    message: 'Uma alocação com motivo de encerramento precisa ter data de encerramento.',
    path: ['endedAt'],
  })

export type Allocation = z.infer<typeof allocationSchema>
