import { z } from 'zod'
import { entityIdSchema } from './primitives'

// A cor vai para o CSS como valor de custom property; aceitar texto livre abriria injeção de regra.
const OKLCH_COLOR_PATTERN = /^oklch\([0-9. ]+(\/ ?[0-9.]+)?\)$/

export const phaseColorSchema = z.string().regex(OKLCH_COLOR_PATTERN)

export const phaseSchema = z.object({
  id: entityIdSchema,
  name: z.string().min(1),
  sortOrder: z.number().int(),
  color: phaseColorSchema,
  active: z.boolean(),
})

export type Phase = z.infer<typeof phaseSchema>
