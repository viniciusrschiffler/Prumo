import type { ReactNode } from 'react'
import { classNames } from './classNames'

// O rótulo do sistema de design tem 11px; o do modal largo, os 10px maiúsculos do
// --text-column. São dois usos, não dois descuidos.
export type FieldGroupVariant = 'default' | 'column'

const LABEL_CLASSES: Record<FieldGroupVariant, string> = {
  default: 'text-meta',
  column: 'text-column uppercase',
}

type FieldGroupProps = {
  label: ReactNode
  htmlFor?: string
  hint?: string
  error?: string
  variant?: FieldGroupVariant
  children: ReactNode
  className?: string
}

export function FieldGroup({
  label,
  htmlFor,
  hint,
  error,
  variant = 'default',
  children,
  className,
}: FieldGroupProps) {
  const hasError = error !== undefined

  return (
    <div className={classNames('grid min-w-0 gap-[5px]', className)}>
      <label
        htmlFor={htmlFor}
        className={classNames(
          LABEL_CLASSES[variant],
          hasError ? 'text-danger' : variant === 'column' ? 'text-text3' : 'text-text2',
        )}
      >
        {label}
      </label>
      {children}
      {hasError ? (
        <span className="text-meta text-danger">{error}</span>
      ) : (
        hint !== undefined && <span className="text-meta text-text3">{hint}</span>
      )}
    </div>
  )
}
