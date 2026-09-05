import type { ProjectRow } from '@/domain/projects/projectRow'
import { Badge } from '@/ui/primitives/Badge'
import { PriorityBadge } from '@/ui/primitives/PriorityBadge'
import { ProjectStatusBadge } from '@/ui/primitives/StatusBadge'

// Atrasado e Risco não entram aqui: a faixa de métricas já mostra o desvio contra a baseline
// e o histórico ao lado já traz o risco aberto, com data e motivo.
type ProjectHeaderBadgesProps = {
  row: ProjectRow
}

export function ProjectHeaderBadges({ row }: ProjectHeaderBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <ProjectStatusBadge status={row.project.status} uppercase />
      <PriorityBadge priority={row.project.priority} variant="pill" />
      {row.tagNames.length > 0 && (
        <div className="flex gap-1">
          {row.tagNames.map((name) => (
            <Badge key={name} variant="outline" weight="normal">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
