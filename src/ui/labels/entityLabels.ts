import type { ProjectSortKey } from '@/domain/projects/projectSort'
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
