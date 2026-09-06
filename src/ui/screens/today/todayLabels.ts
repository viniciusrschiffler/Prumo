import { formatIsoDayMonth } from '@/domain/format/displayDate'
import type { ConsistencyAlert } from '@/domain/today/consistencyAlerts'
import type { AllocatedPerson, PendingDecision } from '@/domain/today/pendingDecisions'
import type { AlertLevel } from '@/ui/primitives/Alert'

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function describeDecisionReason(decision: PendingDecision): string {
  if (decision.kind === 'paused') {
    return `Pausado desde ${formatIsoDayMonth(decision.sinceDate)}.`
  }

  return `${decision.blockEvent?.title ?? 'Bloqueado sem motivo registrado'}.`
}

export function describeOverdueResume(overdueResumeDays: number | null): string {
  if (overdueResumeDays === null) {
    return '.'
  }

  return ` — venceu há ${pluralize(overdueResumeDays, 'dia', 'dias')}.`
}

export function describeAllocatedPeople(people: readonly AllocatedPerson[]): string {
  if (people.length === 0) {
    return ''
  }

  const names = people
    .map((entry) => `${entry.person.name} segue ${entry.percentage}% alocado`)
    .join(', ')

  return ` ${names}.`
}

export const ALERT_LEVELS: Record<ConsistencyAlert['kind'], AlertLevel> = {
  overload: 'danger',
  unassigned: 'warn',
  stale: 'info',
}

export function describeAlertTitle(alert: ConsistencyAlert): string {
  if (alert.kind === 'overload') {
    return `${alert.person.name} em ${alert.totalPercentage}%`
  }

  if (alert.kind === 'unassigned') {
    return `${pluralize(alert.tasks.length, 'tarefa', 'tarefas')} sem responsável`
  }

  return `${alert.project.name} sem atualização`
}

export function describeAlertMeta(alert: ConsistencyAlert): string {
  if (alert.kind === 'overload') {
    return `S${alert.firstWeekNumber}–S${alert.lastWeekNumber}`
  }

  return alert.kind === 'unassigned' ? 'hoje' : `${alert.idleDays}d`
}

export function describeAlertBody(alert: ConsistencyAlert): string {
  if (alert.kind === 'overload') {
    const parts = alert.contributions.map(
      (contribution) => `${contribution.allocation.percentage}% em ${contribution.taskTitle}`,
    )

    return `${parts.join(' e ')} ao mesmo tempo. Capacidade ${alert.person.weeklyCapacityHours}h/semana.`
  }

  if (alert.kind === 'unassigned') {
    const titles = alert.tasks.map((entry) => `“${entry.task.title}”`).join(', ')

    return `${titles} ${alert.tasks.length === 1 ? 'começa' : 'começam'} hoje sem ninguém alocado.`
  }

  if (alert.lastActivityDate === null) {
    return 'Nenhum evento, tarefa concluída ou nota desde que o projeto nasceu.'
  }

  return `Nenhum evento, tarefa concluída ou nota desde ${formatIsoDayMonth(alert.lastActivityDate)}.`
}
