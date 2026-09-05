import { useRef } from 'react'
import { classNames } from './classNames'
import { FOCUS_RING } from './focusRing'
import { phaseColorStyle } from './phaseColorStyle'

const PREVIOUS_KEYS = new Set(['ArrowLeft', 'ArrowUp'])
const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown'])

type ColorSwatchPickerProps = {
  colors: readonly string[]
  value: string
  onChange: (color: string) => void
  label: string
  className?: string
}

export function ColorSwatchPicker({
  colors,
  value,
  onChange,
  label,
  className,
}: ColorSwatchPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedIndex = colors.indexOf(value)

  function moveSelection(from: number, step: number) {
    const target = (from + step + colors.length) % colors.length
    const color = colors[target]

    if (color === undefined) {
      return
    }

    onChange(color)
    containerRef.current?.querySelectorAll('button')[target]?.focus()
  }

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={label}
      className={classNames('flex gap-[5px]', className)}
    >
      {colors.map((color, index) => {
        const isSelected = index === selectedIndex

        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Cor ${index + 1} de ${colors.length}`}
            tabIndex={isSelected || (selectedIndex === -1 && index === 0) ? 0 : -1}
            style={phaseColorStyle(color)}
            onClick={() => onChange(color)}
            onKeyDown={(event) => {
              if (PREVIOUS_KEYS.has(event.key)) {
                event.preventDefault()
                moveSelection(index, -1)
                return
              }

              if (NEXT_KEYS.has(event.key)) {
                event.preventDefault()
                moveSelection(index, 1)
              }
            }}
            className={classNames(
              'phase-tinted h-5 w-5 rounded-[5px] border-2 bg-[var(--phase-tone)] p-0',
              isSelected ? 'border-text2' : 'border-transparent',
              FOCUS_RING,
            )}
          />
        )
      })}
    </div>
  )
}
