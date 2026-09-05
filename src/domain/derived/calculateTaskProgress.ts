import type { Task } from '@/domain/schemas/taskSchema'

export type TaskProgress = {
  doneCount: number
  countedCount: number
  ratio: number
}

export function calculateTaskProgress(tasks: readonly Task[]): TaskProgress {
  const countedTasks = tasks.filter((task) => task.status !== 'cancelled')
  const doneCount = countedTasks.filter((task) => task.status === 'done').length

  return {
    doneCount,
    countedCount: countedTasks.length,
    ratio: countedTasks.length === 0 ? 0 : doneCount / countedTasks.length,
  }
}
