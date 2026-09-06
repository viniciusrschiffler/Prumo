import type { ReactNode } from 'react'
import { formatIsoDayMonth } from '@/domain/format/displayDate'
import type { IsoDate } from '@/domain/schemas/primitives'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'

const HATCH = 'bg-[repeating-linear-gradient(45deg,transparent_0_3px,var(--hatch)_3px_6px)]'
const HATCH_NEUTRAL =
  'bg-[repeating-linear-gradient(45deg,transparent_0_3px,var(--hatch-neutral)_3px_6px)]'

function LegendItem({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {swatch}
      {children}
    </span>
  )
}

export function TimelineLegend({
  today,
  currentPhaseColor,
}: {
  today: IsoDate
  currentPhaseColor: string | null
}) {
  return (
    <div className="flex items-center gap-4 text-label font-normal tracking-normal text-text2">
      <LegendItem
        swatch={
          <span
            style={currentPhaseColor === null ? undefined : phaseColorStyle(currentPhaseColor)}
            className={
              currentPhaseColor === null
                ? 'h-2.5 w-[22px] rounded-[3px] bg-text3'
                : 'phase-tinted h-2.5 w-[22px] rounded-[3px] bg-[var(--phase-tone)]'
            }
          />
        }
      >
        período atual — cor da fase
      </LegendItem>
      <LegendItem swatch={<span className="h-1 w-[22px] rounded-[2px] bg-border-strong" />}>
        baseline original
      </LegendItem>
      <LegendItem
        swatch={
          <span
            className={`h-2.5 w-[22px] rounded-[3px] border border-danger bg-danger-soft ${HATCH}`}
          />
        }
      >
        bloqueado
      </LegendItem>
      <LegendItem
        swatch={
          <span
            className={`h-2.5 w-[22px] rounded-[3px] border border-dashed border-border-strong bg-neutral-soft ${HATCH_NEUTRAL}`}
          />
        }
      >
        pausado
      </LegendItem>
      <LegendItem swatch={<span className="h-3 w-0.5 bg-accent" />}>
        hoje {formatIsoDayMonth(today)}
      </LegendItem>
      <span className="ml-auto text-text3">
        arraste a barra da tarefa para mover · arraste as bordas para mudar início e fim
      </span>
    </div>
  )
}
