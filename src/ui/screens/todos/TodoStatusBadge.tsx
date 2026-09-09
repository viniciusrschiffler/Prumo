import { isBoardStatus, type TodoStatus } from '@/domain/schemas/todoSchema'
import { TODO_STATUS_LABELS, TODO_STATUS_TONES } from '@/ui/labels/entityLabels'
import { Badge } from '@/ui/primitives/Badge'

type TodoStatusBadgeProps = {
  status: TodoStatus
  className?: string
}

export function TodoStatusBadge({ status, className }: TodoStatusBadgeProps) {
  if (!isBoardStatus(status)) {
    return (
      <Badge variant="cancelled" size="small" className={className}>
        Cancelado
      </Badge>
    )
  }

  return (
    <Badge
      dot
      tone={TODO_STATUS_TONES[status]}
      size="small"
      className={className}
    >
      {TODO_STATUS_LABELS[status]}
    </Badge>
  )
}
