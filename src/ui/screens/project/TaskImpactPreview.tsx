import type { AllocationConflict } from '@/domain/projects/allocationConflicts'
import type { TaskImpact } from '@/domain/projects/newTask'
import { formatIsoDate } from '@/domain/format/displayDate'
import { Alert } from '@/ui/primitives/Alert'

function describeConflict(conflict: AllocationConflict): string {
  return `${conflict.person.name} chega a ${conflict.totalPercentage}% entre ${formatIsoDate(
    conflict.period.start,
  )} e ${formatIsoDate(conflict.period.end)}. Reduza a alocação, mova a janela ou aceite e registre a decisão.`
}

function describeWindowChange(impact: TaskImpact): string {
  if (impact.periodAfter === null) {
    return 'sem janela ainda'
  }

  const after = `${formatIsoDate(impact.periodAfter.start)} → ${formatIsoDate(impact.periodAfter.end)}`

  if (impact.periodBefore === null) {
    return `${after} (primeira janela do projeto)`
  }

  const isUnchanged =
    impact.periodBefore.start === impact.periodAfter.start &&
    impact.periodBefore.end === impact.periodAfter.end

  return isUnchanged ? `${after} (sem mudança)` : `${after} (a tarefa move o fim do projeto)`
}

function PreviewRow({ label, children }: { label: string; children: string }) {
  return (
    <>
      <span className="font-mono text-micro text-text3">{label}</span>
      <span className="min-w-0 font-mono text-label font-normal tabular-nums tracking-normal text-text2">
        {children}
      </span>
    </>
  )
}

type TaskImpactPreviewProps = {
  impact: TaskImpact
  conflicts: readonly AllocationConflict[]
  window: string | null
}

export function TaskImpactPreview({ impact, conflicts, window }: TaskImpactPreviewProps) {
  return (
    <>
      {conflicts.length === 0 ? (
        <Alert level="info" title="Nenhuma pessoa passa de 100% no período">
          {window === null
            ? 'Preencha o início e o fim para conferir a capacidade das pessoas atribuídas.'
            : `A janela ${window} cabe na capacidade atual das pessoas atribuídas.`}
        </Alert>
      ) : (
        conflicts.map((conflict) => (
          <Alert
            key={`${conflict.person.id}-${conflict.period.start}`}
            level="warn"
            title={`${conflict.person.name} passa de 100% no período`}
          >
            {describeConflict(conflict)}
          </Alert>
        ))
      )}

      <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-2.5 gap-y-1.5 border-t border-border pt-2.5">
        <PreviewRow label="esforço ∑">
          {`${impact.effortBefore}h → ${impact.effortAfter}h`}
        </PreviewRow>
        <PreviewRow label="janela">{describeWindowChange(impact)}</PreviewRow>
      </div>
    </>
  )
}
