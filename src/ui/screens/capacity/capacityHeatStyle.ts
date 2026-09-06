import type { CapacityHeatLevel } from '@/domain/capacity/capacityHeat'

// A célula pinta a borda inteira pelo grau de calor e a divisória de coluna por cima dela,
// então a cor da direita vai em estilo inline: duas utilidades de cor de borda na mesma
// string dependeriam da ordem na folha de estilo para decidir quem vence.
export const HEAT_SURFACE_CLASSES: Record<CapacityHeatLevel, string> = {
  inactive: 'border-dashed border-border-strong bg-neutral-soft text-text3',
  free: 'border-transparent bg-sunken text-text3',
  light: 'heat-light border-transparent text-text',
  medium: 'heat-medium border-transparent text-text',
  heavy: 'heat-heavy border-transparent font-semibold text-text',
  over: 'border-danger bg-danger font-semibold text-accent-fg',
}

export const HEAT_LEGEND_LEVELS: readonly CapacityHeatLevel[] = [
  'free',
  'light',
  'medium',
  'heavy',
  'over',
]
