import type { Task } from '@/domain/schemas/taskSchema'

export function calculateTotalEffort(tasks: readonly Task[]): number {
  return tasks
    .filter((task) => task.status !== 'cancelled')
    .reduce((total, task) => total + (task.estimatedHours ?? 0), 0)
}
