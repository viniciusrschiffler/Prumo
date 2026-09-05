import type { ProjectsTotals } from '@/domain/projects/projectTotals'
import { KeyHint } from '@/ui/primitives/KeyHint'

type ProjectsFooterProps = {
  totals: ProjectsTotals
}

function DerivedCounters({ totals }: ProjectsFooterProps) {
  if (totals.delayedCount === 0 && totals.atRiskCount === 0) {
    return <span className="font-mono text-text3">nenhum atraso, nenhum risco em aberto</span>
  }

  return (
    <span className="font-mono text-danger">
      {totals.delayedCount} atrasados · {totals.atRiskCount} em risco
    </span>
  )
}

export function ProjectsFooter({ totals }: ProjectsFooterProps) {
  return (
    <footer className="flex flex-none items-center gap-4 border-t border-border bg-panel px-5 py-2 text-label font-normal tracking-normal text-text2">
      <span className="font-mono tabular-nums">
        ∑ {totals.effortHours}h · {totals.taskCount} tarefas · {totals.projectCount} projetos
      </span>

      <span className="text-text3">
        selecione linhas com <KeyHint keys="shift+click" variant="muted" /> para bloquear ou
        repriorizar em lote
      </span>

      <span className="ml-auto inline-flex items-center gap-2">
        <DerivedCounters totals={totals} />
      </span>
    </footer>
  )
}
