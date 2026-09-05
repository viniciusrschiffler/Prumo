import type { ReactNode } from 'react'
import { classNames } from './classNames'
import { FOCUS_RING } from './focusRing'

type FilterChipProps = {
  label: string
  count?: number
  selected: boolean
  onSelect: () => void
  className?: string
}

export function FilterChip({ label, count, selected, onSelect, className }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-[5px] border px-[9px] py-[3px] text-label font-medium tracking-normal',
        selected
          ? 'border-border-strong bg-panel text-text'
          : 'border-border bg-transparent text-text2 hover:text-text',
        FOCUS_RING,
        className,
      )}
    >
      {label}
      {count !== undefined && (
        <span className="font-mono font-normal tabular-nums opacity-70">{count}</span>
      )}
    </button>
  )
}

type FilterChipGroupProps = {
  label: string
  children: ReactNode
  className?: string
}

export function FilterChipGroup({ label, children, className }: FilterChipGroupProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={classNames('flex flex-wrap items-center gap-1.5', className)}
    >
      {children}
    </div>
  )
}
