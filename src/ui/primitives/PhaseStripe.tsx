import { classNames } from './classNames'
import { phaseColorStyle } from './phaseColorStyle'

// A fase sem cor é a tarefa sem fase: o traço continua desenhado, em neutro, para a linha não
// perder o alinhamento da coluna.
export type PhaseStripeSize = 'default' | 'small'

const SIZE_CLASSES: Record<PhaseStripeSize, string> = {
  default: 'h-3',
  small: 'h-[11px]',
}

type PhaseStripeProps = {
  color: string | null
  size?: PhaseStripeSize
  className?: string
}

export function PhaseStripe({ color, size = 'default', className }: PhaseStripeProps) {
  return (
    <span
      aria-hidden
      style={color === null ? undefined : phaseColorStyle(color)}
      className={classNames(
        'w-[3px] flex-none rounded-[2px]',
        SIZE_CLASSES[size],
        color === null ? 'bg-border-strong' : 'phase-tinted bg-[var(--phase-tone)]',
        className,
      )}
    />
  )
}
