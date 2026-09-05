import { classNames } from './classNames'
import { PersonAvatar, type PersonAvatarSize, type PersonAvatarTone } from './PersonAvatar'

export type StackedPerson = {
  id: string
  initials: string
  name: string
  tone?: PersonAvatarTone
}

type PersonStackProps = {
  people: readonly StackedPerson[]
  maxVisible?: number
  size?: PersonAvatarSize
  className?: string
}

export function PersonStack({
  people,
  maxVisible = 4,
  size = 'small',
  className,
}: PersonStackProps) {
  const visible = people.slice(0, maxVisible)
  const hiddenCount = people.length - visible.length

  return (
    <div className={classNames('flex items-center gap-[3px]', className)}>
      {visible.map((person) => (
        <PersonAvatar
          key={person.id}
          initials={person.initials}
          name={person.name}
          tone={person.tone}
          size={size}
        />
      ))}
      {hiddenCount > 0 && (
        <span className="self-center font-mono text-label tabular-nums text-text3">
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}
