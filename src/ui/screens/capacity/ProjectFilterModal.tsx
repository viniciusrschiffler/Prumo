import type { EntityId } from '@/domain/schemas/primitives'
import type { Project } from '@/domain/schemas/projectSchema'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { Modal } from '@/ui/primitives/Modal'

type ProjectFilterModalProps = {
  projects: readonly Project[]
  selectedProjectId: EntityId | null
  onClose: () => void
  onSelect: (projectId: EntityId | null) => void
}

type OptionProps = {
  label: string
  isSelected: boolean
  onSelect: () => void
}

function ProjectOption({ label, isSelected, onSelect }: OptionProps) {
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
      {label}
    </button>
  )
}

export function ProjectFilterModal({
  projects,
  selectedProjectId,
  onClose,
  onSelect,
}: ProjectFilterModalProps) {
  return (
    <Modal open title="Filtrar projeto" tone="accent" onClose={onClose}>
      <div className="grid gap-1.5">
        <ProjectOption
          label="Todos os projetos"
          isSelected={selectedProjectId === null}
          onSelect={() => onSelect(null)}
        />
        {projects.map((project) => (
          <ProjectOption
            key={project.id}
            label={project.name}
            isSelected={project.id === selectedProjectId}
            onSelect={() => onSelect(project.id)}
          />
        ))}
      </div>
    </Modal>
  )
}
