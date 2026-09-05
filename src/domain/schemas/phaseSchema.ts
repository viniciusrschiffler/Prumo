import { z } from 'zod'
import { entityIdSchema } from './primitives'

// A cor vai para o CSS como valor de custom property; aceitar texto livre abriria injeção de regra.
const OKLCH_COLOR_PATTERN = /^oklch\([0-9. ]+(\/ ?[0-9.]+)?\)$/

export const phaseColorSchema = z.string().regex(OKLCH_COLOR_PATTERN)

// Paleta de cores oferecida na tela de Configurações. São valores de cor, não fases: a fase
// é configurável e a cor dela vive no banco. Espelha as cores das quatro fases semeadas.
export const PHASE_COLOR_PALETTE = [
  'oklch(0.545 0.16 292)',
  'oklch(0.55 0.11 212)',
  'oklch(0.6 0.115 62)',
  'oklch(0.52 0.115 152)',
] as const

export const phaseSchema = z.object({
  id: entityIdSchema,
  name: z.string().min(1),
  sortOrder: z.number().int(),
  color: phaseColorSchema,
  active: z.boolean(),
})

export type Phase = z.infer<typeof phaseSchema>
