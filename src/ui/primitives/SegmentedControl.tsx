import { classNames } from './classNames'
import { FOCUS_RING } from './focusRing'

export type SegmentedOption<TValue extends string> = {
  value: TValue
  label: string
}

// O passo de texto anda junto com o de padding, então os dois moram na mesma entrada: o
// agrupamento da Timeline é 12px e o zoom dela, 11px mais estreito que o padrão das outras telas.
export type SegmentedControlSize = 'default' | 'wide' | 'compact' | 'comfortable'

const SIZE_CLASSES: Record<SegmentedControlSize, string> = {
  default: 'px-2.5 py-1 text-label tracking-normal',
  wide: 'px-3 py-[5px] text-label tracking-normal',
  compact: 'px-[9px] py-[3px] text-label tracking-normal',
  comfortable: 'px-[11px] py-1 text-support',
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
              'rounded-badge font-medium',
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
