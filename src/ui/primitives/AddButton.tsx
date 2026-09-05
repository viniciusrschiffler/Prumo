import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { classNames } from './classNames'
import { FOCUS_RING } from './focusRing'
import { KeyHint } from './KeyHint'

type AddButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  keys?: string
  children: ReactNode
}

export function AddButton({
  keys,
  children,
  className,
  type = 'button',
  ...buttonProps
}: AddButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      className={classNames(
        'inline-flex h-[22px] items-center gap-1.5 rounded-[5px] border border-dashed border-border-strong bg-transparent px-[7px] text-label font-medium text-text3 hover:border-text3 hover:text-text',
        FOCUS_RING,
        className,
      )}
    >
      {children}
      {keys !== undefined && <KeyHint keys={keys} variant="inline" />}
    </button>
  )
}
