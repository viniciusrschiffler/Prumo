import type { CSSProperties } from 'react'

export function phaseColorStyle(color: string): CSSProperties {
  return { '--phase-color': color } as CSSProperties
}
