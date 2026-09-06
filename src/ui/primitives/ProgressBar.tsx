import type { CSSProperties } from 'react'
import { classNames } from './classNames'
import { phaseColorStyle } from './phaseColorStyle'

const HATCH_CLASSES = 'bg-[repeating-linear-gradient(45deg,transparent_0_3px,var(--hatch)_3px_6px)]'

export type ProgressTone = 'default' | 'muted' | 'ok'
export type ProgressTrack = 'sunken' | 'border' | 'danger'

const TONE_CLASSES: Record<ProgressTone, string> = {
  default: 'bg-text2',
  muted: 'bg-text3',
  ok: 'bg-ok',
}

// A tabela densa desenha a barra em 5px; o cartão de progresso do sistema de design, em 6px.
export type ProgressSize = 'default' | 'dense' | 'wide' | 'thick'

const SIZE_CLASSES: Record<ProgressSize, string> = {
  default: 'h-1.5',
  dense: 'h-[5px]',
  wide: 'h-2.5',
  thick: 'h-3',
}

const TRACK_CLASSES: Record<ProgressTrack, string> = {
  sunken: 'bg-sunken',
  border: 'bg-border',
  danger: 'bg-danger-soft',
}

export type ProgressSegment = {
  ratio: number
  color?: string
}

type ProgressBarProps = {
  value?: number
  segments?: readonly ProgressSegment[]
  tone?: ProgressTone
  track?: ProgressTrack
  size?: ProgressSize
  hatched?: boolean
  className?: string
}

function toWidth(ratio: number): string {
  return `${Math.max(0, Math.min(1, ratio)) * 100}%`
}

function toSegmentStyle(segment: ProgressSegment): CSSProperties {
  const base: CSSProperties = { width: toWidth(segment.ratio) }

  if (segment.color === undefined) {
    return base
  }

  return { ...base, ...phaseColorStyle(segment.color) }
}

export function ProgressBar({
  value,
  segments,
  tone = 'default',
  track = 'sunken',
  size = 'default',
  hatched = false,
  className,
}: ProgressBarProps) {
  const parts = segments ?? (value === undefined ? [] : [{ ratio: value }])

  return (
    <div
      className={classNames(
        'flex overflow-hidden rounded-[3px]',
        SIZE_CLASSES[size],
        TRACK_CLASSES[track],
        hatched ? HATCH_CLASSES : '',
        className,
      )}
    >
      {parts.map((segment, index) => (
        <div
          key={index}
          style={toSegmentStyle(segment)}
          className={classNames(
            'h-full',
            segment.color === undefined
              ? TONE_CLASSES[tone]
              : 'phase-tinted bg-[var(--phase-tone)]',
          )}
        />
      ))}
    </div>
  )
}
