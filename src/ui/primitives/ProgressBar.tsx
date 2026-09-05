import type { CSSProperties } from 'react'
import { classNames } from './classNames'
import { phaseColorStyle } from './phaseColorStyle'

const HATCH_CLASSES = 'bg-[repeating-linear-gradient(45deg,transparent_0_3px,var(--hatch)_3px_6px)]'

export type ProgressTone = 'default' | 'muted' | 'ok'
export type ProgressTrack = 'sunken' | 'border'

const TONE_CLASSES: Record<ProgressTone, string> = {
  default: 'bg-text2',
  muted: 'bg-text3',
  ok: 'bg-ok',
}

const TRACK_CLASSES: Record<ProgressTrack, string> = {
  sunken: 'bg-sunken',
  border: 'bg-border',
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
  hatched = false,
  className,
}: ProgressBarProps) {
  const parts = segments ?? (value === undefined ? [] : [{ ratio: value }])

  return (
    <div
      className={classNames(
        'flex h-1.5 overflow-hidden rounded-[3px]',
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
