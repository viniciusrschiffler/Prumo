import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { classNames } from './classNames'
import { FOCUS_RING } from './focusRing'

export type IconButtonSize = 'default' | 'compact' | 'small'

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  default:
    'h-7 w-7 rounded-button border border-border-strong bg-panel text-body text-text2 hover:bg-sunken hover:text-text',
  compact:
    'h-[22px] w-[22px] rounded-[5px] border border-border bg-panel text-support text-text2 hover:border-border-strong hover:text-text',
  small:
    'h-4 w-4 rounded-[3px] border border-transparent bg-transparent text-label font-semibold leading-none text-text2 hover:bg-neutral-soft hover:text-text',
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  size?: IconButtonSize
  children: ReactNode
}

export function IconButton({
  label,
  size = 'default',
  children,
  className,
  type = 'button',
  ...buttonProps
}: IconButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      title={label}
      aria-label={label}
      className={classNames(
        'inline-flex flex-none items-center justify-center font-mono',
        SIZE_CLASSES[size],
        FOCUS_RING,
        className,
      )}
    >
      {children}
    </button>
  )
}
