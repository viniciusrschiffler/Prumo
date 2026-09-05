import type { EventFilter } from '@/domain/projects/eventFilters'
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
