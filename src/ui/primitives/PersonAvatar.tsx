import { classNames } from './classNames'

export type PersonAvatarSize = 'default' | 'small' | 'tiny'

const SIZE_CLASSES: Record<PersonAvatarSize, string> = {
  default: 'h-[22px] w-[22px] text-micro',
  small: 'h-5 w-5 text-[9px]',
  tiny: 'h-4 w-4 text-[8px]',
}

type PersonAvatarProps = {
  initials: string
  name?: string
  overallocated?: boolean
  size?: PersonAvatarSize
  className?: string
}

export function PersonAvatar({
  initials,
  name,
  overallocated = false,
  size = 'default',
  className,
}: PersonAvatarProps) {
  return (
    <span
      title={name}
      className={classNames(
        'inline-flex flex-none items-center justify-center rounded-badge border font-mono font-semibold',
        overallocated
          ? 'border-danger bg-danger-soft text-danger'
          : 'border-border bg-neutral-soft text-text2',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {initials}
    </span>
  )
}
