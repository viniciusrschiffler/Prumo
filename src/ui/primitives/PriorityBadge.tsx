import type { Priority } from '@/domain/schemas/primitives'
import { classNames } from './classNames'

type PriorityBadgeProps = {
  priority: Priority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span className={classNames('font-mono text-body tabular-nums', className)}>{priority}</span>
  )
}
