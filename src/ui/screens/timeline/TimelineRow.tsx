import type { CSSProperties, ReactNode } from 'react'
import { classNames } from '@/ui/primitives/classNames'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'

export const LABEL_COLUMN_WIDTH = 260

export const ROW_GRID = 'grid grid-cols-[260px_minmax(0,1fr)] items-center border-b border-border'

type TimelineRowProps = {
  label: ReactNode
  className?: string
  labelClassName?: string
  trackLabel?: string
  style?: CSSProperties
  children?: ReactNode
}

export function TimelineRow({
  label,
  className,
  labelClassName,
  trackLabel,
  style,
  children,
}: TimelineRowProps) {
  return (
    <div style={style} className={classNames(ROW_GRID, className)}>
      <div
        className={classNames(
          'sticky left-0 z-20 flex h-full min-w-0 items-center gap-[7px] border-r border-border bg-inherit px-3',
          labelClassName,
        )}
      >
        {label}
      </div>
      <div data-timeline-track aria-label={trackLabel} className="relative h-full">
        {children}
      </div>
    </div>
  )
}

// A cor da fase vem de uma coluna só, e o tema escuro deriva a variante clara dela em CSS. Pintar
// o valor cru aqui deixaria a listra fora de sintonia com a barra que ela anuncia.
export function PhaseStripe({ color, className }: { color: string | null; className?: string }) {
  if (color === null) {
    return null
  }

  return (
    <span
      style={phaseColorStyle(color)}
      aria-hidden
      className={classNames(
        'phase-tinted w-[3px] flex-none rounded-[2px] bg-[var(--phase-tone)]',
        className,
      )}
    />
  )
}
