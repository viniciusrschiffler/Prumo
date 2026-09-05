import { classNames } from './classNames'
import { FOCUS_RING } from './focusRing'

export type SegmentedOption<TValue extends string> = {
  value: TValue
  label: string
}

export type SegmentedControlSize = 'default' | 'wide'

const SIZE_CLASSES: Record<SegmentedControlSize, string> = {
  default: 'px-2.5 py-1',
  wide: 'px-3 py-[5px]',
}

type SegmentedControlProps<TValue extends string> = {
  options: readonly SegmentedOption<TValue>[]
  value: TValue
  onChange: (value: TValue) => void
  label: string
  size?: SegmentedControlSize
  className?: string
}

export function SegmentedControl<TValue extends string>({
  options,
  value,
  onChange,
  label,
  size = 'default',
  className,
}: SegmentedControlProps<TValue>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={classNames(
        'flex w-max gap-0.5 rounded-button border border-border bg-sunken p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={classNames(
              'rounded-badge text-label font-medium tracking-normal',
              SIZE_CLASSES[size],
              isSelected ? 'bg-panel text-text' : 'bg-transparent text-text2 hover:text-text',
              FOCUS_RING,
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
