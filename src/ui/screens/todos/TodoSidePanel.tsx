import type { ReactNode } from 'react'
import { formatShortDate } from '@/domain/format/dueLabel'
import type { TodoRecurrence } from '@/domain/schemas/todoSchema'
import { parseRecurrenceRule, type RecurrenceRule } from '@/domain/todos/todoRecurrence'
import type { TodoProjectCount, TodoSummary } from '@/domain/todos/todoSummary'
import { toIsoDateOf } from '@/domain/dates/isoDateMath'
import {
  RECURRENCE_WEEKDAY_ABBREVIATIONS,
  RECURRENCE_WEEKDAY_LABELS,
} from '@/ui/labels/entityLabels'
import { classNames } from '@/ui/primitives/classNames'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { StatCard } from '@/ui/primitives/StatCard'

type TodoSidePanelProps = {
  summary: TodoSummary
  projectCounts: readonly TodoProjectCount[]
  recurrences: readonly TodoRecurrence[]
}

type PanelSectionProps = {
  title: string
  children: ReactNode
}

function PanelSection({ title, children }: PanelSectionProps) {
  return (
    <section className="grid gap-2">
      <h2 className="text-label uppercase text-text2">{title}</h2>
      {children}
    </section>
  )
}

function describeRecurrence(recurrence: TodoRecurrence, rule: RecurrenceRule | null): string {
  const items = `${recurrence.quantity} ${recurrence.quantity === 1 ? 'todo' : 'todos'}`
  const every = rule === null ? '' : ` toda ${RECURRENCE_WEEKDAY_LABELS[rule.weekday]}`
  const lastGenerated =
    recurrence.lastGeneratedAt === null
      ? 'Ainda não gerou nenhum.'
      : `Último gerado em ${formatShortDate(toIsoDateOf(recurrence.lastGeneratedAt))}.`

  return `Gera ${items}${every}. ${lastGenerated}`
}

export function TodoSidePanel({ summary, projectCounts, recurrences }: TodoSidePanelProps) {
  return (
    <div className="grid content-start gap-3.5 overflow-auto border-l border-border bg-sunken p-3.5">
      <PanelSection title="Esta semana">
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Concluídos" tone="ok">
            {summary.doneThisWeek}
          </StatCard>
          <StatCard label="Atrasados" tone="danger">
            {summary.late}
          </StatCard>
          <StatCard label="Em aberto">{summary.open}</StatCard>
          <StatCard label="Sem projeto" tone="muted">
            {summary.withoutProject}
          </StatCard>
        </div>
      </PanelSection>

      <PanelSection title="Por projeto">
        <div className="overflow-hidden rounded-card border border-border bg-panel">
          {projectCounts.map((entry) => (
            <div
              key={entry.project?.id ?? 'sem-projeto'}
              className="flex items-center gap-2 border-b border-border px-[11px] py-2 last:border-b-0 hover:bg-sunken"
            >
              <span
                style={entry.phase === null ? undefined : phaseColorStyle(entry.phase.color)}
                className={classNames(
                  'h-3 w-[3px] flex-none rounded-[2px]',
                  entry.phase === null ? 'bg-border-strong' : 'phase-tinted bg-[var(--phase-tone)]',
                )}
              />
              <span
                className={classNames(
                  'truncate text-support',
                  entry.project === null ? 'text-text2' : 'text-text',
                )}
              >
                {entry.project?.name ?? 'Sem projeto'}
              </span>
              <span className="ml-auto font-mono text-label font-normal tabular-nums tracking-normal text-text2">
                {entry.openCount}
              </span>
            </div>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Recorrentes">
        <div className="overflow-hidden rounded-card border border-border bg-panel">
          {recurrences.length === 0 ? (
            <p className="px-[11px] py-2 text-label font-normal tracking-normal text-text3">
              Nenhuma recorrente ativa.
            </p>
          ) : (
            recurrences.map((recurrence) => {
              const rule = parseRecurrenceRule(recurrence.rule)

              return (
                <div
                  key={recurrence.id}
                  className="grid gap-[3px] border-b border-border px-[11px] py-[9px] last:border-b-0"
                >
                  <div className="flex items-center gap-[7px]">
                    <span className="truncate text-support font-semibold">{recurrence.title}</span>
                    {rule !== null && (
                      <span className="ml-auto font-mono text-micro text-text3">
                        {RECURRENCE_WEEKDAY_ABBREVIATIONS[rule.weekday]}
                      </span>
                    )}
                  </div>
                  <div className="text-label font-normal tracking-normal text-text3">
                    {describeRecurrence(recurrence, rule)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </PanelSection>
    </div>
  )
}
