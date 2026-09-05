import type { ProjectStatus } from '@/domain/schemas/projectSchema'
import type { TaskStatus } from '@/domain/schemas/taskSchema'
import { PROJECT_STATUS_LABELS, TASK_STATUS_LABELS } from '@/ui/labels/entityLabels'
import { Badge, type BadgeSize, type BadgeTone, type BadgeVariant } from './Badge'

type BadgeLook = {
  tone: BadgeTone
  variant: BadgeVariant
}

const PROJECT_STATUS_LOOK: Record<ProjectStatus, BadgeLook> = {
  discovery: { tone: 'neutral', variant: 'soft' },
  active: { tone: 'ok', variant: 'soft' },
  blocked: { tone: 'danger', variant: 'soft' },
  paused: { tone: 'warn', variant: 'soft' },
  completed: { tone: 'info', variant: 'soft' },
  cancelled: { tone: 'neutral', variant: 'cancelled' },
}

const TASK_STATUS_LOOK: Record<TaskStatus, BadgeLook> = {
  todo: { tone: 'neutral', variant: 'soft' },
  in_progress: { tone: 'accent', variant: 'soft' },
  done: { tone: 'ok', variant: 'soft' },
  blocked: { tone: 'danger', variant: 'soft' },
  cancelled: { tone: 'neutral', variant: 'cancelled' },
}

type ProjectStatusBadgeProps = {
  status: ProjectStatus
  size?: BadgeSize
  dot?: boolean
  uppercase?: boolean
}

export function ProjectStatusBadge({
  status,
  size = 'default',
  dot = true,
  uppercase = false,
}: ProjectStatusBadgeProps) {
  const look = PROJECT_STATUS_LOOK[status]

  return (
    <Badge tone={look.tone} variant={look.variant} size={size} dot={dot} uppercase={uppercase}>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  )
}

type TaskStatusBadgeProps = {
  status: TaskStatus
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const look = TASK_STATUS_LOOK[status]

  return (
    <Badge tone={look.tone} variant={look.variant} size="small">
      {TASK_STATUS_LABELS[status]}
    </Badge>
  )
}
