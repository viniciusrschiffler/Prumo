import type { ProjectsTotals } from '@/domain/projects/projectTotals'
import { PRIORITIES, type Priority } from '@/domain/schemas/primitives'
import { Button } from '@/ui/primitives/Button'
import { KeyHint } from '@/ui/primitives/KeyHint'
import { Select } from '@/ui/primitives/Select'

const NO_PRIORITY = ''

type ProjectsFooterProps = {
  totals: ProjectsTotals
  selectedCount: number
  onBlock: () => void
  onReprioritize: (priority: Priority) => void
  onClearSelection: () => void
}

function DerivedCounters({ totals }: { totals: ProjectsTotals }) {
  if (totals.delayedCount === 0 && totals.atRiskCount === 0) {
    return <span className="font-mono text-text3">nenhum atraso, nenhum risco em aberto</span>
  }

  return (
    <span className="font-mono text-danger">
      {totals.delayedCount} atrasados · {totals.atRiskCount} em risco
    </span>
  )
}

function SelectionActions({
  selectedCount,
  onBlock,
  onReprioritize,
  onClearSelection,
}: Omit<ProjectsFooterProps, 'totals'>) {
  return (
    <>
      <span className="font-mono tabular-nums text-text">
        {selectedCount} {selectedCount === 1 ? 'selecionado' : 'selecionados'}
      </span>
      <Button variant="danger" size="small" onClick={onBlock}>
        Bloquear
      </Button>
      <label className="flex items-center gap-1.5 text-text3">
        Prioridade
        <Select
          value={NO_PRIORITY}
          aria-label="Repriorizar os projetos selecionados"
          onChange={(event) => {
            if (event.target.value !== NO_PRIORITY) {
              onReprioritize(event.target.value as Priority)
            }
          }}
          className="h-6 text-label font-normal tracking-normal"
        >
          <option value={NO_PRIORITY}>—</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </Select>
      </label>
      <Button size="small" onClick={onClearSelection}>
        Limpar
      </Button>
    </>
  )
}

export function ProjectsFooter({
  totals,
  selectedCount,
  onBlock,
  onReprioritize,
  onClearSelection,
}: ProjectsFooterProps) {
  return (
    <footer className="flex flex-none items-center gap-4 border-t border-border bg-panel px-5 py-2 text-label font-normal tracking-normal text-text2">
      <span className="font-mono tabular-nums">
        ∑ {totals.effortHours}h · {totals.taskCount} tarefas · {totals.projectCount} projetos
      </span>

      {selectedCount > 0 ? (
        <SelectionActions
          selectedCount={selectedCount}
          onBlock={onBlock}
          onReprioritize={onReprioritize}
          onClearSelection={onClearSelection}
        />
      ) : (
        <span className="text-text3">
          selecione linhas com <KeyHint keys="shift+click" variant="muted" /> para bloquear ou
          repriorizar em lote
        </span>
      )}

      <span className="ml-auto inline-flex items-center gap-2">
        <DerivedCounters totals={totals} />
      </span>
    </footer>
  )
}
