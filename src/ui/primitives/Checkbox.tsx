import type { InputHTMLAttributes, ReactNode } from 'react'
import { classNames } from './classNames'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  children: ReactNode
}

export function Checkbox({ children, className, disabled, ...inputProps }: CheckboxProps) {
  return (
    <label
      className={classNames(
        'inline-flex items-center gap-1.5 text-support',
        disabled ? 'cursor-not-allowed text-text3' : 'cursor-pointer',
        className,
      )}
    >
      <input {...inputProps} type="checkbox" disabled={disabled} className="peer sr-only" />
      <span className="inline-flex h-3.5 w-3.5 flex-none items-center justify-center rounded-[3px] border border-border-strong bg-bg text-[9px] leading-none text-transparent peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-fg peer-focus-visible:ring-[3px] peer-focus-visible:ring-accent-soft">
        ✓
      </span>
      {children}
    </label>
  )
}
