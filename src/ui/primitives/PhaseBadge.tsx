import { classNames } from './classNames'
import { phaseColorStyle } from './phaseColorStyle'

export type PhaseBadgeVariant = 'badge' | 'inline'

type PhaseBadgeProps = {
  name: string
  color: string
  variant?: PhaseBadgeVariant
  className?: string
}

export function PhaseBadge({ name, color, variant = 'badge', className }: PhaseBadgeProps) {
  return (
    <span
      style={phaseColorStyle(color)}
      className={classNames(
        'phase-tinted inline-flex items-center gap-1.5',
        variant === 'badge'
          ? 'rounded-badge bg-[var(--phase-tone-soft)] px-[7px] py-px text-label font-medium text-[var(--phase-tone)]'
          : 'text-support text-text2',
        className,
      )}
    >
      <span className="h-[7px] w-[7px] flex-none rounded-[2px] bg-[var(--phase-tone)]" />
      {name}
    </span>
  )
}
