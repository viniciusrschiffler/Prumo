import type { CSSProperties } from 'react'
import type { BarGeometry } from '@/domain/timeline/timelineGeometry'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'

// A barra de uma tarefa de um dia só tem largura zero por construção, porque ela termina no
// começo do dia de fim. O piso é de pixel e não de dia: alargá-la no cálculo deslocaria a borda
// direita de toda barra vizinha.
export const MINIMUM_BAR_WIDTH = 'min-w-[3px]'

export function toBarStyle(geometry: BarGeometry, phaseColor?: string | null): CSSProperties {
  return {
    left: `${geometry.leftPercent}%`,
    width: `${geometry.widthPercent}%`,
    ...(phaseColor == null ? {} : phaseColorStyle(phaseColor)),
  }
}
