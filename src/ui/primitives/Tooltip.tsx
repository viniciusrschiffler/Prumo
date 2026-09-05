import type { ReactNode } from 'react'
import { classNames } from './classNames'
import { KeyHint } from './KeyHint'

type TooltipProps = {
  label: string
  keys?: string
  children: ReactNode
  className?: string
}

export function Tooltip({ label, keys, children, className }: TooltipProps) {
  return (
    <span className={classNames('group relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-40 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-button border border-border-strong bg-raised px-2 py-[5px] text-support shadow-popover group-hover:inline-flex group-focus-within:inline-flex"
      >
        {label}
        {keys !== undefined && <KeyHint keys={keys} variant="muted" />}
      </span>
    </span>
  )
}
