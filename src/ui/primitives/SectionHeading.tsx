import type { ReactNode } from 'react'
import { classNames } from './classNames'

export type SectionHeadingCountTone = 'default' | 'danger'

const COUNT_TONE_CLASSES: Record<SectionHeadingCountTone, string> = {
  default: 'text-text3',
  danger: 'text-danger',
}

type SectionHeadingProps = {
  title: string
  count?: number
  countTone?: SectionHeadingCountTone
  // O fio que atravessa até a margem é da coluna principal; a coluna contextual imprime o
  // mesmo rótulo sem ele, e com um respiro menor.
  rule?: boolean
  trailing?: ReactNode
  className?: string
}

export function SectionHeading({
  title,
  count,
  countTone = 'default',
  rule = false,
  trailing,
  className,
}: SectionHeadingProps) {
  return (
    <div className={classNames('flex items-center', rule ? 'gap-2.5' : 'gap-2', className)}>
      <h2 className="text-label uppercase text-text2">{title}</h2>
      {count !== undefined && (
        <span
          className={classNames(
            'font-mono text-label font-normal tabular-nums tracking-normal',
            COUNT_TONE_CLASSES[countTone],
          )}
        >
          {count}
        </span>
      )}
      {rule && <div className="h-px flex-1 bg-border" />}
      {trailing !== undefined && (
        <span className={rule ? undefined : 'ml-auto'}>{trailing}</span>
      )}
    </div>
  )
}
