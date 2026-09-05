import type { Task } from '@/domain/schemas/taskSchema'

export type TaskRepository = {
  listAll(): Promise<Task[]>
}
