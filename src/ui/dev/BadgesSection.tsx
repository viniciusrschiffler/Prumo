import { PROJECT_STATUSES } from '@/domain/schemas/projectSchema'
import { TASK_STATUSES } from '@/domain/schemas/taskSchema'
import { PRIORITIES } from '@/domain/schemas/primitives'
import { DelayedBadge, RiskBadge } from '@/ui/primitives/DerivedBadge'
import { PhaseBadge } from '@/ui/primitives/PhaseBadge'
import { PriorityBadge } from '@/ui/primitives/PriorityBadge'
import { ProjectStatusBadge, TaskStatusBadge } from '@/ui/primitives/StatusBadge'
import { GalleryRow, GallerySection } from './GallerySection'
import { SAMPLE_PHASES } from './samplePhases'

export function BadgesSection() {
  return (
    <GallerySection title="Status, fase e prioridade" note="fase e status são as únicas fontes de cor">
      <GalleryRow label="projeto">
        {PROJECT_STATUSES.map((status) => (
          <ProjectStatusBadge key={status} status={status} uppercase />
        ))}
      </GalleryRow>

      <GalleryRow label="tarefa">
        {TASK_STATUSES.map((status) => (
          <TaskStatusBadge key={status} status={status} />
        ))}
      </GalleryRow>

      <GalleryRow label="derivado">
        <DelayedBadge />
        <RiskBadge />
      </GalleryRow>

      <GalleryRow label="fase · badge">
        {SAMPLE_PHASES.map((phase) => (
          <PhaseBadge key={phase.id} name={phase.name} color={phase.color} />
        ))}
      </GalleryRow>

      <GalleryRow label="fase · inline">
        {SAMPLE_PHASES.map((phase) => (
          <PhaseBadge key={phase.id} name={phase.name} color={phase.color} variant="inline" />
        ))}
      </GalleryRow>

      <GalleryRow label="prioridade">
        {PRIORITIES.map((priority) => (
          <PriorityBadge key={priority} priority={priority} />
        ))}
      </GalleryRow>
    </GallerySection>
  )
}
