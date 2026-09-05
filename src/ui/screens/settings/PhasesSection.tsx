import { useState } from 'react'
import { useSettingsStore } from '@/app/stores/useSettingsStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { countTasksByPhase } from '@/domain/derived/countTasksByPhase'
import { moveInOrder } from '@/domain/derived/moveInOrder'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import { PHASE_COLOR_PALETTE, type Phase } from '@/domain/schemas/phaseSchema'
import { Button } from '@/ui/primitives/Button'
import { classNames } from '@/ui/primitives/classNames'
import { ColorSwatchPicker } from '@/ui/primitives/ColorSwatchPicker'
import { EmptyState } from '@/ui/primitives/EmptyState'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { IconButton } from '@/ui/primitives/IconButton'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { SectionCard } from '@/ui/primitives/SectionCard'
import { useListReorder } from '@/ui/primitives/useListReorder'
import { PhaseFormModal } from './PhaseFormModal'

const COLUMNS = 'grid grid-cols-[34px_1fr_200px_120px_90px] items-center gap-2.5 px-3.5'

export function PhasesSection() {
  const phases = useSettingsStore((state) => state.phases)
  const tasks = useSettingsStore((state) => state.tasks)
  const savePhase = useSettingsStore((state) => state.savePhase)
  const removePhase = useSettingsStore((state) => state.removePhase)
  const reorderPhases = useSettingsStore((state) => state.reorderPhases)
  const notify = useToastStore((state) => state.notify)

  const [editing, setEditing] = useState<Phase | null>(null)
  const [isModalOpen, setModalOpen] = useState(false)

  const tasksByPhase = countTasksByPhase(tasks)
  const totalTasks = tasks.length

  async function run(action: () => Promise<void>, success: string) {
    try {
      await action()
      notify(success)
    } catch (cause) {
      console.error('Não foi possível concluir a alteração em Fases.', cause)
      notify(toPublicMessage(cause), 'danger')
    }
  }

  const reorder = useListReorder(phases.length, (from, to) => {
    const orderedIds = moveInOrder(
      phases.map((phase) => phase.id),
      from,
      to,
    )

    void run(() => reorderPhases(orderedIds), 'Ordem das fases gravada.')
  })

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  return (
    <SectionCard
      id="fases"
      title="Fases"
      note="a ordem define a sequência nas telas · a cor é usada em todo o app"
      action={
        <Button variant="primary" size="small" onClick={openNew}>
          Nova fase
        </Button>
      }
    >
      <div role="table" aria-label="Fases">
        <div
          role="row"
          className={classNames(
            COLUMNS,
            'border-b border-border bg-sunken py-[7px] text-column uppercase text-text2',
          )}
        >
          <span role="columnheader">Ordem</span>
          <span role="columnheader">Nome</span>
          <span role="columnheader">Cor</span>
          <span role="columnheader" className="text-right">
            Tarefas
          </span>
          <span role="columnheader" className="text-right">
            Ações
          </span>
        </div>

        {phases.length === 0 ? (
          <div className="p-3.5">
            <EmptyState
              title="Nenhuma fase configurada"
              description="Sem fase não há onde encaixar tarefa. Crie a primeira para começar a planejar."
              action={
                <Button variant="primary" onClick={openNew}>
                  Nova fase
                </Button>
              }
            />
          </div>
        ) : (
          phases.map((phase, index) => {
            const taskCount = tasksByPhase.get(phase.id) ?? 0
            const isDragging = reorder.draggingIndex === index
            const isTarget = reorder.targetIndex === index && !isDragging

            return (
              <div
                key={phase.id}
                role="row"
                {...reorder.getRowProps(index)}
                className={classNames(
                  COLUMNS,
                  'border-b border-border py-2 hover:bg-sunken',
                  isDragging ? 'opacity-50' : '',
                  isTarget ? 'shadow-[inset_0_2px_0_var(--accent)]' : '',
                )}
              >
                <span role="cell" className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    {...reorder.getHandleProps(index)}
                    aria-label={`Mover ${phase.name} — alt e setas`}
                    title="Arraste, ou use alt com as setas"
                    className={classNames(
                      'cursor-grab font-mono text-meta text-text3 active:cursor-grabbing',
                      FOCUS_RING,
                    )}
                  >
                    ⠿
                  </button>
                  <span className="font-mono text-meta tabular-nums text-text2">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </span>

                <span role="cell" className="inline-flex items-center gap-2 overflow-hidden">
                  <span
                    style={phaseColorStyle(phase.color)}
                    className="phase-tinted h-3.5 w-[3px] flex-none rounded-[2px] bg-[var(--phase-tone)]"
                  />
                  <span className="truncate text-body">{phase.name}</span>
                  <span
                    style={phaseColorStyle(phase.color)}
                    className="phase-tinted inline-flex flex-none items-center rounded-badge bg-[var(--phase-tone-soft)] px-1.5 py-px text-micro font-semibold text-[var(--phase-tone)]"
                  >
                    exemplo
                  </span>
                </span>

                <span role="cell">
                  <ColorSwatchPicker
                    colors={PHASE_COLOR_PALETTE}
                    value={phase.color}
                    label={`Cor de ${phase.name}`}
                    onChange={(color) =>
                      void run(
                        () => savePhase({ ...phase, color }),
                        `Cor de ${phase.name} gravada.`,
                      )
                    }
                  />
                </span>

                <span
                  role="cell"
                  className="text-right font-mono text-meta tabular-nums text-text2"
                >
                  {taskCount}
                </span>

                <span role="cell" className="flex justify-end gap-1">
                  <IconButton
                    label={`Editar ${phase.name}`}
                    className="h-6 w-6 rounded-[5px] border-border"
                    onClick={() => {
                      setEditing(phase)
                      setModalOpen(true)
                    }}
                  >
                    ✎
                  </IconButton>
                  <IconButton
                    label={
                      taskCount > 0
                        ? `${phase.name} tem tarefas — mova as tarefas antes`
                        : `Excluir ${phase.name}`
                    }
                    disabled={taskCount > 0}
                    className={classNames(
                      'h-6 w-6 rounded-[5px] border-border',
                      taskCount > 0
                        ? 'text-text3'
                        : 'text-danger hover:border-danger hover:text-danger',
                    )}
                    onClick={() =>
                      void run(() => removePhase(phase.id), `${phase.name} foi excluída.`)
                    }
                  >
                    ✕
                  </IconButton>
                </span>
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-[9px]">
        <span className="text-meta text-text3">
          Fase com tarefas não pode ser excluída — mova as tarefas antes.
        </span>
        <span className="ml-auto font-mono text-meta tabular-nums text-text2">
          {totalTasks} tarefas distribuídas
        </span>
      </div>

      {isModalOpen && (
        <PhaseFormModal
          key={editing?.id ?? 'nova'}
          phase={editing}
          nextSortOrder={phases.length + 1}
          onClose={() => setModalOpen(false)}
          onSubmit={(saved) => {
            setModalOpen(false)
            void run(
              () => savePhase(saved),
              editing === null ? `${saved.name} foi criada.` : `${saved.name} foi salva.`,
            )
          }}
        />
      )}
    </SectionCard>
  )
}
