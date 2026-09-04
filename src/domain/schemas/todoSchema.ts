import { z } from 'zod'
import { entityIdSchema, isoDateSchema, isoDateTimeSchema, prioritySchema } from './primitives'

export const TODO_STATUSES = ['open', 'done', 'cancelled'] as const

export const todoStatusSchema = z.enum(TODO_STATUSES)

export const todoSchema = z
  .object({
    id: entityIdSchema,
    title: z.string().min(1),
    description: z.string().nullable(),
    dueDate: isoDateSchema.nullable(),
    priority: prioritySchema,
    status: todoStatusSchema,
    projectId: entityIdSchema.nullable(),
    taskId: entityIdSchema.nullable(),
    completedAt: isoDateTimeSchema.nullable(),
    recurrenceId: entityIdSchema.nullable(),
  })
  .refine((todo) => todo.completedAt === null || todo.status === 'done', {
    message: 'Só um todo concluído pode ter data de conclusão.',
    path: ['completedAt'],
  })

export const todoRecurrenceSchema = z.object({
  id: entityIdSchema,
  title: z.string().min(1),
  rule: z.string().min(1),
  quantity: z.number().int().positive(),
  lastGeneratedAt: isoDateTimeSchema.nullable(),
  active: z.boolean(),
})

export const todoTagSchema = z.object({
  todoId: entityIdSchema,
  tagId: entityIdSchema,
})

export type TodoStatus = z.infer<typeof todoStatusSchema>
export type Todo = z.infer<typeof todoSchema>
export type TodoRecurrence = z.infer<typeof todoRecurrenceSchema>
export type TodoTag = z.infer<typeof todoTagSchema>
