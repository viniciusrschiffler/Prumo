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
