import type { InputHTMLAttributes, ReactNode } from 'react'
import { classNames } from './classNames'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  description?: string
  children: ReactNode
}

export function Checkbox({
  description,
  children,
  className,
  disabled,
  ...inputProps
}: CheckboxProps) {
  const hasDescription = description !== undefined

  return (
    <label
      className={classNames(
        'inline-flex text-support',
        hasDescription ? 'items-start gap-[9px]' : 'items-center gap-1.5',
        disabled ? 'cursor-not-allowed text-text3' : 'cursor-pointer',
        className,
      )}
    >
      <input {...inputProps} type="checkbox" disabled={disabled} className="peer sr-only" />
      <span
        className={classNames(
          'inline-flex flex-none items-center justify-center border border-border-strong bg-bg text-[9px] leading-none text-transparent peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-fg peer-focus-visible:ring-[3px] peer-focus-visible:ring-accent-soft',
          hasDescription
            ? 'mt-px h-[15px] w-[15px] rounded-badge'
            : 'h-3.5 w-3.5 rounded-[3px]',
        )}
      >
        ✓
      </span>
      {hasDescription ? (
        <span className="grid gap-px">
          <span className="font-medium">{children}</span>
          <span className="text-pretty text-meta text-text3">{description}</span>
        </span>
      ) : (
        children
      )}
    </label>
  )
}
