import type { Priority } from '@/domain/schemas/primitives'
import { Badge, type BadgeTone } from './Badge'
import { classNames } from './classNames'

// A tela de Projetos separa crítico de não crítico, o recorte da visão salva do produto, e
// pinta P0 e P1 do mesmo vermelho. A de TodoList gradua a urgência e dá âmbar ao P1.
const CRITICAL_TONES: Record<Priority, BadgeTone> = {
  P0: 'danger',
  P1: 'danger',
  P2: 'neutral',
  P3: 'neutral',
}

const GRADED_TONES: Record<Priority, BadgeTone> = {
  P0: 'danger',
  P1: 'warn',
  P2: 'neutral',
  P3: 'neutral',
}

export type PriorityBadgeVariant = 'plain' | 'pill'
export type PriorityBadgeScale = 'critical' | 'graded'

const TONES_BY_SCALE: Record<PriorityBadgeScale, Record<Priority, BadgeTone>> = {
  critical: CRITICAL_TONES,
  graded: GRADED_TONES,
}

type PriorityBadgeProps = {
  priority: Priority
  variant?: PriorityBadgeVariant
  scale?: PriorityBadgeScale
  size?: 'default' | 'small'
  muted?: boolean
  className?: string
}

export function PriorityBadge({
  priority,
  variant = 'plain',
  scale = 'critical',
  size = 'default',
  muted = false,
  className,
}: PriorityBadgeProps) {
  if (variant === 'pill') {
    return (
      <Badge
        tone={muted ? 'neutral' : TONES_BY_SCALE[scale][priority]}
        size={size}
        subdued={muted}
        className={classNames('font-mono', className)}
      >
        {priority}
      </Badge>
    )
  }

  return (
    <span className={classNames('font-mono text-body tabular-nums', className)}>{priority}</span>
  )
}
