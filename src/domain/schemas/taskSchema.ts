import { z } from 'zod'
import { entityIdSchema, isoDateSchema, isOrderedPeriod } from './primitives'

export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'blocked', 'cancelled'] as const

export const taskStatusSchema = z.enum(TASK_STATUSES)

export const taskSchema = z
  .object({
    id: entityIdSchema,
    projectId: entityIdSchema,
    phaseId: entityIdSchema,
    title: z.string().min(1),
    description: z.string().nullable(),
    status: taskStatusSchema,
    plannedStart: isoDateSchema.nullable(),
    plannedEnd: isoDateSchema.nullable(),
    actualStart: isoDateSchema.nullable(),
    actualEnd: isoDateSchema.nullable(),
    estimatedHours: z.number().nonnegative().nullable(),
    sortOrder: z.number().int(),
  })
  .refine((task) => isOrderedPeriod(task.plannedStart, task.plannedEnd), {
    message: 'O fim planejado não pode ser anterior ao início planejado.',
    path: ['plannedEnd'],
  })
  .refine((task) => isOrderedPeriod(task.actualStart, task.actualEnd), {
    message: 'O fim real não pode ser anterior ao início real.',
    path: ['actualEnd'],
  })

export const taskDependencySchema = z
  .object({
    taskId: entityIdSchema,
    dependsOnTaskId: entityIdSchema,
  })
  .refine((dependency) => dependency.taskId !== dependency.dependsOnTaskId, {
    message: 'Uma tarefa não pode depender de si mesma.',
    path: ['dependsOnTaskId'],
  })

export type TaskStatus = z.infer<typeof taskStatusSchema>
export type Task = z.infer<typeof taskSchema>
export type TaskDependency = z.infer<typeof taskDependencySchema>
