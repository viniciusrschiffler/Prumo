import type { EventFilter } from '@/domain/projects/eventFilters'
import type { Priority } from '@/domain/schemas/primitives'
import type { DueGroupBucket, TodoGroupMode } from '@/domain/todos/todoGrouping'
import type { RecurrenceWeekday } from '@/domain/todos/todoRecurrence'
import type { ProjectSortKey } from '@/domain/projects/projectSort'
import type { ProjectEventType } from '@/domain/schemas/projectEventSchema'
import type { ProjectStatus } from '@/domain/schemas/projectSchema'
import type { TaskStatus } from '@/domain/schemas/taskSchema'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  discovery: 'Descoberta',
  active: 'Ativo',
  blocked: 'Bloqueado',
  paused: 'Pausado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'A fazer',
  in_progress: 'Em andamento',
  done: 'Concluída',
  blocked: 'Bloqueada',
  cancelled: 'Cancelada',
}

export const PROJECT_SORT_LABELS: Record<ProjectSortKey, string> = {
  priority: 'Prioridade',
  deviation: 'Desvio da baseline',
  plannedEnd: 'Fim previsto',
  effort: 'Esforço total',
}

export const PROJECT_EVENT_LABELS: Record<ProjectEventType, string> = {
  decision: 'Decisão',
  scope_change: 'Mudança de escopo',
  replan: 'Replanejamento',
  block: 'Bloqueio',
  unblock: 'Desbloqueio',
  reallocation: 'Realocação',
  risk: 'Risco',
  note: 'Nota',
}

export const EVENT_FILTER_LABELS: Record<EventFilter, string> = {
  all: 'Tudo',
  decisions: 'Decisões',
  scope: 'Escopo',
  blocks: 'Bloqueios',
  reallocations: 'Realocações',
  risks: 'Riscos',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  P0: 'urgente',
  P1: 'alta',
  P2: 'normal',
  P3: 'baixa',
}

export const TODO_GROUP_MODE_LABELS: Record<TodoGroupMode, string> = {
  due: 'Vencimento',
  project: 'Projeto',
  priority: 'Prioridade',
}

export const DUE_GROUP_LABELS: Record<DueGroupBucket, string> = {
  late: 'Atrasados',
  today: 'Hoje',
  week: 'Esta semana',
  later: 'Depois',
  none: 'Sem data',
  doneToday: 'Concluídos hoje',
  doneBefore: 'Concluídos antes',
}

export const RECURRENCE_WEEKDAY_LABELS: Record<RecurrenceWeekday, string> = {
  sunday: 'domingo',
  monday: 'segunda-feira',
  tuesday: 'terça-feira',
  wednesday: 'quarta-feira',
  thursday: 'quinta-feira',
  friday: 'sexta-feira',
  saturday: 'sábado',
}

export const RECURRENCE_WEEKDAY_ABBREVIATIONS: Record<RecurrenceWeekday, string> = {
  sunday: 'dom',
  monday: 'seg',
  tuesday: 'ter',
  wednesday: 'qua',
  thursday: 'qui',
  friday: 'sex',
  saturday: 'sáb',
}
