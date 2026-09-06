import type { NewTask } from '@/domain/projects/newTask'
import type { Task, TaskDependency } from '@/domain/schemas/taskSchema'
import type { TaskReschedule } from '@/domain/timeline/timelineSchedule'

export type TaskRepository = {
  listAll(): Promise<Task[]>
  listDependencies(): Promise<TaskDependency[]>
  create(newTask: NewTask): Promise<void>
  reschedule(change: TaskReschedule): Promise<void>
}
