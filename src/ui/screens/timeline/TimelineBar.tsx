import type { ReactNode } from 'react'
import type { BarGeometry } from '@/domain/timeline/timelineGeometry'
import { classNames } from '@/ui/primitives/classNames'
import { MINIMUM_BAR_WIDTH, toBarStyle } from './timelineBarStyle'

export type TimelineBarTone = 'phase' | 'blocked' | 'paused' | 'baseline'
export type TimelineBarSize = 'group' | 'item' | 'ghost' | 'ghostItem'

const HATCH = 'bg-[repeating-linear-gradient(45deg,transparent_0_3px,var(--hatch)_3px_6px)]'
const HATCH_NEUTRAL =
  'bg-[repeating-linear-gradient(45deg,transparent_0_3px,var(--hatch-neutral)_3px_6px)]'

const TONE_CLASSES: Record<TimelineBarTone, string> = {
  phase: 'bg-[var(--phase-tone)]',
  blocked: `border border-danger bg-danger-soft ${HATCH}`,
  paused: `border border-dashed border-border-strong bg-neutral-soft ${HATCH_NEUTRAL}`,
  baseline: 'bg-border-strong',
}

const SIZE_CLASSES: Record<TimelineBarSize, string> = {
  group: 'h-3.5 rounded-[3px]',
  item: 'h-3 rounded-[2px]',
  ghost: 'h-1 rounded-[2px]',
  ghostItem: 'h-[3px] rounded-[2px]',
}

type TimelineBarProps = {
  geometry: BarGeometry
  tone: TimelineBarTone
  size: TimelineBarSize
  phaseColor?: string | null
  className?: string
  children?: ReactNode
}

export function TimelineBar({
  geometry,
  tone,
  size,
  phaseColor,
  className,
  children,
}: TimelineBarProps) {
  return (
    <div
      style={toBarStyle(geometry, phaseColor)}
      className={classNames(
        'phase-tinted absolute',
        MINIMUM_BAR_WIDTH,
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </div>
  )
}
