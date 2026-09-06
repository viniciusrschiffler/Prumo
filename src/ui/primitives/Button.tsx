import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { classNames } from './classNames'
import { FOCUS_RING } from './focusRing'
import { KeyHint } from './KeyHint'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'default' | 'small'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-accent text-accent-fg hover:bg-accent-hover',
  secondary: 'border-border-strong bg-panel text-text hover:bg-sunken',
  ghost: 'border-transparent bg-transparent text-text2 hover:bg-neutral-soft hover:text-text',
  danger: 'border-danger bg-transparent text-danger hover:bg-danger-soft',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: 'h-7 px-2.5 text-support',
  small: 'h-6 px-2 text-label',
}

const PRESSED_CLASSES: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-accent-hover text-accent-fg',
  secondary: 'border-border-strong bg-accent-soft text-accent',
  ghost: 'border-transparent bg-neutral-soft text-text',
  danger: 'border-danger bg-danger-soft text-danger',
}

const DISABLED_CLASSES =
  'disabled:cursor-not-allowed disabled:border-border disabled:bg-sunken disabled:text-text3 disabled:hover:bg-sunken disabled:hover:text-text3'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  pressed?: boolean
  keys?: string
  children: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'default',
  pressed,
  keys,
  children,
  className,
  type = 'button',
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      aria-pressed={pressed}
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-button border font-medium',
        pressed === true ? PRESSED_CLASSES[variant] : VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        DISABLED_CLASSES,
        FOCUS_RING,
        className,
      )}
    >
      {children}
      {keys !== undefined && <KeyHint keys={keys} variant="inline" />}
    </button>
  )
}
