import { formatModifiedAt } from '@/domain/format/formatModifiedAt'
import type { IsoDateTime } from '@/domain/schemas/primitives'

export type IntegrityReport = {
  checkedAt: IsoDateTime
  problems: readonly string[]
}

export function describeIntegrityReport(report: IntegrityReport | null, now: Date): string {
  if (report === null) {
    return 'nunca verificado'
  }

  const when = formatModifiedAt(report.checkedAt, now)

  if (report.problems.length === 0) {
    return `verificado ${when} · sem erros`
  }

  const count = report.problems.length

  return `verificado ${when} · ${count} ${count === 1 ? 'problema' : 'problemas'}`
}

// O resultado cabe numa linha de setting; "ok" é o caso sem problema, e não um problema
// chamado ok, porque um problema real sempre traz o nome da tabela ou do arquivo.
const NO_PROBLEMS = 'ok'
const PROBLEM_SEPARATOR = ' | '

export function serializeIntegrityProblems(problems: readonly string[]): string {
  return problems.length === 0 ? NO_PROBLEMS : problems.join(PROBLEM_SEPARATOR)
}

export function parseIntegrityProblems(stored: string): string[] {
  return stored === NO_PROBLEMS || stored === '' ? [] : stored.split(PROBLEM_SEPARATOR)
}
