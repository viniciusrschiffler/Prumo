import { classNames } from '@/ui/primitives/classNames'
import { HEAT_LEGEND_LEVELS, HEAT_SURFACE_CLASSES } from './capacityHeatStyle'

const SWATCH_CLASSES = 'h-[11px] w-6 rounded-[2px] border'

export function CapacityLegend() {
  return (
    <div className="flex items-center gap-3.5 text-label font-normal tracking-normal text-text2">
      <span className="inline-flex items-center gap-1.5">
        <span className="text-text3">livre</span>
        {HEAT_LEGEND_LEVELS.map((level) => (
          <span
            key={level}
            aria-hidden
            className={classNames(
              SWATCH_CLASSES,
              level === 'free' ? 'border-border bg-sunken' : HEAT_SURFACE_CLASSES[level],
            )}
          />
        ))}
        <span className="text-text3">&gt;100%</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className={classNames(SWATCH_CLASSES, 'border-dashed border-border-strong bg-neutral-soft')}
        />
        pessoa inativa
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="h-3 w-0.5 bg-accent" />
        semana atual
      </span>
      <span className="ml-auto text-text3">clique numa célula para ver as alocações da semana</span>
    </div>
  )
}
