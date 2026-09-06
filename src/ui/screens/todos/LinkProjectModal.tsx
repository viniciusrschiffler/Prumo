import type { EntityId } from '@/domain/schemas/primitives'
import type { ProjectWithPhase } from '@/domain/todos/todoRow'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { Modal } from '@/ui/primitives/Modal'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'

type LinkProjectModalProps = {
  todoTitle: string
  projects: readonly ProjectWithPhase[]
  selectedProjectId: EntityId | null
  onClose: () => void
  onSelect: (projectId: EntityId | null) => void
}

type OptionProps = {
  label: string
  color: string | null
  isSelected: boolean
  onSelect: () => void
}

function ProjectOption({ label, color, isSelected, onSelect }: OptionProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={classNames(
        'flex items-center gap-2 rounded-button border px-2.5 py-2 text-left text-support',
        isSelected
          ? 'border-accent bg-accent-soft text-text'
          : 'border-border bg-panel text-text2 hover:bg-sunken hover:text-text',
        FOCUS_RING,
      )}
    >
      <span
        style={color === null ? undefined : phaseColorStyle(color)}
        className={classNames(
          'h-3 w-[3px] flex-none rounded-[2px]',
          color === null ? 'bg-border-strong' : 'phase-tinted bg-[var(--phase-tone)]',
        )}
      />
      {label}
    </button>
  )
}

export function LinkProjectModal({
  todoTitle,
  projects,
  selectedProjectId,
  onClose,
  onSelect,
}: LinkProjectModalProps) {
  return (
    <Modal open title="Vincular projeto" tone="accent" note={todoTitle} onClose={onClose}>
      <div className="grid gap-1.5">
        <ProjectOption
          label="Sem projeto"
          color={null}
          isSelected={selectedProjectId === null}
          onSelect={() => onSelect(null)}
        />
        {projects.map((entry) => (
          <ProjectOption
            key={entry.project.id}
            label={entry.project.name}
            color={entry.phase?.color ?? null}
            isSelected={entry.project.id === selectedProjectId}
            onSelect={() => onSelect(entry.project.id)}
          />
        ))}
      </div>
    </Modal>
  )
}
