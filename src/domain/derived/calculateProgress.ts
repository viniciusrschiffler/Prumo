import type { Task } from '@/domain/schemas/taskSchema'

export type ProjectProgress = {
  completedHours: number
  totalHours: number
  ratio: number
}

export function calculateProgress(tasks: readonly Task[]): ProjectProgress {
  const countedTasks = tasks.filter((task) => task.status !== 'cancelled')

  const totalHours = countedTasks.reduce((total, task) => total + (task.estimatedHours ?? 0), 0)
  const completedHours = countedTasks
    .filter((task) => task.status === 'done')
    .reduce((total, task) => total + (task.estimatedHours ?? 0), 0)

  return {
    completedHours,
    totalHours,
    ratio: totalHours === 0 ? 0 : completedHours / totalHours,
  }
}
