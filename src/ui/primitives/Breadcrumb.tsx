import { Fragment } from 'react'
import { classNames } from './classNames'
import { FOCUS_RING } from './focusRing'

export type BreadcrumbStep = {
  label: string
  onNavigate?: () => void
}

type BreadcrumbProps = {
  steps: readonly BreadcrumbStep[]
  className?: string
}

export function Breadcrumb({ steps, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Trilha de navegação"
      className={classNames('flex items-center gap-1.5 text-label font-normal tracking-normal text-text3', className)}
    >
      {steps.map((step, index) => (
        <Fragment key={step.label}>
          {index > 0 && (
            <span aria-hidden="true" className="font-mono">
              /
            </span>
          )}
          {step.onNavigate === undefined ? (
            <span className={index === steps.length - 1 ? 'text-text2' : undefined}>
              {step.label}
            </span>
          ) : (
            <button
              type="button"
              onClick={step.onNavigate}
              className={classNames('rounded-[3px] hover:text-text2', FOCUS_RING)}
            >
              {step.label}
            </button>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
