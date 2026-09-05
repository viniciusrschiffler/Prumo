import { classNames } from './classNames'
import { PersonAvatar, type PersonAvatarTone } from './PersonAvatar'

type PersonAllocationChipProps = {
  initials: string
  name: string
  percentage: number
  tone?: PersonAvatarTone
  className?: string
}

export function PersonAllocationChip({
  initials,
  name,
  percentage,
  tone,
  className,
}: PersonAllocationChipProps) {
  return (
    <span
      title={name}
      className={classNames(
        'inline-flex items-center gap-1 rounded-badge border border-border bg-panel py-px pl-0.5 pr-[5px] text-label font-normal text-text2',
        className,
      )}
    >
      <PersonAvatar initials={initials} size="tiny" tone={tone} />
      <span className="font-mono tabular-nums">{percentage}%</span>
    </span>
  )
}

type UnassignedChipProps = {
  className?: string
}

export function UnassignedChip({ className }: UnassignedChipProps) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-badge border border-dashed border-warn bg-warn-soft px-1.5 py-px text-label font-normal text-warn',
        className,
      )}
    >
      sem responsável
    </span>
  )
}
