import { classNames } from './classNames'

export type PersonAvatarSize = 'default' | 'small' | 'compact' | 'tiny'

// Vermelho é passar da capacidade, como a tela de Capacidade marca. Âmbar é disputar o
// período com outro projeto, que é o alerta de conflito da tela de Projeto — não são o mesmo
// aviso, e a pessoa pode estar num sem estar no outro.
export type PersonAvatarTone = 'default' | 'warn' | 'danger'

const SIZE_CLASSES: Record<PersonAvatarSize, string> = {
  default: 'h-[22px] w-[22px] text-micro',
  small: 'h-5 w-5 text-[9px]',
  compact: 'h-[18px] w-[18px] text-[8px]',
  tiny: 'h-4 w-4 text-[8px]',
}

const TONE_CLASSES: Record<PersonAvatarTone, string> = {
  default: 'border-border bg-neutral-soft text-text2',
  warn: 'border-warn bg-warn-soft text-warn',
  danger: 'border-danger bg-danger-soft text-danger',
}

type PersonAvatarProps = {
  initials: string
  name?: string
  tone?: PersonAvatarTone
  size?: PersonAvatarSize
  className?: string
}

export function PersonAvatar({
  initials,
  name,
  tone = 'default',
  size = 'default',
  className,
}: PersonAvatarProps) {
  return (
    <span
      title={name}
      className={classNames(
        'inline-flex flex-none items-center justify-center rounded-badge border font-mono font-semibold',
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initials}
    </span>
  )
}
