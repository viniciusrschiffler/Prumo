import type { ReactNode } from 'react'
import { classNames } from '@/ui/primitives/classNames'

// O cartão de gráfico não é o `SectionCard`: ali o cabeçalho é uma faixa com fio embaixo, e
// aqui ele divide o mesmo respiro do conteúdo, sem separador.
export type ChartCardTotalTone = 'default' | 'danger'

const TOTAL_TONE_CLASSES: Record<ChartCardTotalTone, string> = {
  default: 'text-text3',
  danger: 'text-danger',
}

type ChartCardProps = {
  title: string
  note?: string
  total?: string
  totalTone?: ChartCardTotalTone
  children: ReactNode
  className?: string
}

export function ChartCard({
  title,
  note,
  total,
  totalTone = 'default',
  children,
  className,
}: ChartCardProps) {
  return (
    <section
      aria-label={title}
      className={classNames(
        'grid content-start gap-[11px] rounded-card border border-border bg-panel p-[13px]',
        className,
      )}
    >
      <div className="flex items-baseline gap-[9px]">
        <h2 className="text-body font-semibold">{title}</h2>
        {note !== undefined && <span className="text-meta text-text3">{note}</span>}
        {total !== undefined && (
          <span
            className={classNames(
              'ml-auto font-mono text-meta tabular-nums',
              TOTAL_TONE_CLASSES[totalTone],
            )}
          >
            {total}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}
