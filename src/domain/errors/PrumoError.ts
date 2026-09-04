import { ERROR_CATALOG, type ErrorCode } from './errorCatalog'

type PrumoErrorOptions = {
  cause?: unknown
}

export class PrumoError extends Error {
  readonly code: ErrorCode
  readonly publicMessage: string

  constructor(code: ErrorCode, internalMessage: string, options?: PrumoErrorOptions) {
    super(internalMessage, { cause: options?.cause })
    this.name = 'PrumoError'
    this.code = code
    this.publicMessage = ERROR_CATALOG[code]
  }
}

export function toPublicMessage(error: unknown): string {
  if (error instanceof PrumoError) {
    return error.publicMessage
  }

  return 'Algo deu errado. Tente novamente.'
}
