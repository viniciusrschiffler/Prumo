import type { z } from 'zod'
import { PrumoError } from '@/domain/errors/PrumoError'

export function parseRows<TSchema extends z.ZodType>(
  schema: TSchema,
  entityName: string,
  rows: readonly unknown[],
): z.infer<TSchema>[] {
  return rows.map((row) => {
    const result = schema.safeParse(row)

    if (!result.success) {
      throw new PrumoError(
        'INVALID_RECORD_SHAPE',
        `linha de ${entityName} fora do formato: ${result.error.message}`,
        { cause: result.error },
      )
    }

    return result.data as z.infer<TSchema>
  })
}
