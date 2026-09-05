import type { ProjectRow } from '@/domain/projects/projectRow'
import { Badge } from '@/ui/primitives/Badge'
import { DelayedBadge, RiskBadge } from '@/ui/primitives/DerivedBadge'
import { PriorityBadge } from '@/ui/primitives/PriorityBadge'
import { ProjectStatusBadge } from '@/ui/primitives/StatusBadge'


type ProjectHeaderBadgesProps = {
  row: ProjectRow
}

export function ProjectHeaderBadges({ row }: ProjectHeaderBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <ProjectStatusBadge status={row.project.status} uppercase />
      <PriorityBadge priority={row.project.priority} variant="pill" />
      {row.isDelayed && <DelayedBadge />}
      {row.hasOpenRisk && <RiskBadge />}
      {row.tagNames.length > 0 && (
        <div className="flex gap-1">
          {row.tagNames.map((name) => (
            <Badge key={name} variant="outline" className="font-normal tracking-normal">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
