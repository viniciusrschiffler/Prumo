import type { ReactNode } from 'react'
import { classNames } from '@/ui/primitives/classNames'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'

export type TodoGroupTone = 'danger' | 'accent' | 'ok' | 'warn' | 'neutral' | 'phase'
export type TodoGroupTitleTone = 'default' | 'muted' | 'danger' | 'ok'

const BAR_CLASSES: Record<TodoGroupTone, string> = {
  danger: 'bg-danger',
  accent: 'bg-accent',
  ok: 'bg-ok',
  warn: 'bg-warn',
  neutral: 'bg-border-strong',
  phase: 'phase-tinted bg-[var(--phase-tone)]',
}

const TITLE_CLASSES: Record<TodoGroupTitleTone, string> = {
  default: 'text-text',
  muted: 'text-text2',
  danger: 'text-danger',
  ok: 'text-ok',
}

type TodoGroupSectionProps = {
  title: string
  count: number
  meta: string | null
  tone: TodoGroupTone
  titleTone: TodoGroupTitleTone
  phaseColor: string | null
  children: ReactNode
}

export function TodoGroupSection({
  title,
  count,
  meta,
  tone,
  titleTone,
  phaseColor,
  children,
}: TodoGroupSectionProps) {
  return (
    <section className="grid gap-[7px]">
      <div className="flex items-center gap-[9px]">
        <span
          style={phaseColor === null ? undefined : phaseColorStyle(phaseColor)}
          className={classNames('h-[13px] w-[3px] flex-none rounded-[2px]', BAR_CLASSES[tone])}
        />
        <h2 className={classNames('text-label uppercase', TITLE_CLASSES[titleTone])}>{title}</h2>
        <span className="font-mono text-label font-normal tabular-nums tracking-normal text-text3">
          {count}
        </span>
        <div className="h-px flex-1 bg-border" />
        {meta !== null && <span className="font-mono text-micro text-text3">{meta}</span>}
      </div>
      <div className="overflow-hidden rounded-card border border-border bg-panel">{children}</div>
    </section>
  )
}
