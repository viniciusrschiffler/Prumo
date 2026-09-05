import type { ReactNode } from 'react'
import { classNames } from './classNames'

type FieldGroupProps = {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}

export function FieldGroup({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: FieldGroupProps) {
  const hasError = error !== undefined

  return (
    <div className={classNames('grid gap-1', className)}>
      <label htmlFor={htmlFor} className={hasError ? 'text-label font-normal text-danger' : 'text-label font-normal text-text2'}>
        {label}
      </label>
      {children}
      {hasError ? (
        <span className="text-label font-normal text-danger">{error}</span>
      ) : (
        hint !== undefined && <span className="text-label font-normal text-text3">{hint}</span>
      )}
    </div>
  )
}
