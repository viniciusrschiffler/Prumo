import type { Priority } from '@/domain/schemas/primitives'
import { Badge, type BadgeTone } from './Badge'
import { classNames } from './classNames'

// P0 e P1 são as críticas — é o recorte que a visão salva do próprio produto usa. Só elas
// ganham o vermelho da pílula; as outras ficam neutras.
const TONE_BY_PRIORITY: Record<Priority, BadgeTone> = {
  P0: 'danger',
  P1: 'danger',
  P2: 'neutral',
  P3: 'neutral',
}

export type PriorityBadgeVariant = 'plain' | 'pill'

type PriorityBadgeProps = {
  priority: Priority
  variant?: PriorityBadgeVariant
  className?: string
}

export function PriorityBadge({ priority, variant = 'plain', className }: PriorityBadgeProps) {
  if (variant === 'pill') {
    return (
      <Badge tone={TONE_BY_PRIORITY[priority]} className={classNames('font-mono', className)}>
        {priority}
      </Badge>
    )
  }

  return (
    <span className={classNames('font-mono text-body tabular-nums', className)}>{priority}</span>
  )
}
