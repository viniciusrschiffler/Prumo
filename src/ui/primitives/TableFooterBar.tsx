import type { ReactNode } from 'react'
import { classNames } from './classNames'

type TableFooterBarProps = {
  totals: string
  hint?: ReactNode
  children?: ReactNode
  className?: string
}

export function TableFooterBar({ totals, hint, children, className }: TableFooterBarProps) {
  return (
    <footer
      className={classNames('flex items-center gap-4 px-2.5 py-2 text-support text-text2', className)}
    >
      <span className="font-mono tabular-nums">{totals}</span>
      {hint !== undefined && <span className="text-text3">{hint}</span>}
      {children !== undefined && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </footer>
  )
}
