import { z } from 'zod'
import { entityIdSchema, isoDateSchema, isoDateTimeSchema, prioritySchema } from './primitives'

// `cancelled` nasceu com a tabela e nenhum caminho do app o escreve; ele fica no enum porque
// o banco o aceita, mas não é coluna do quadro nem opção do formulário.
export const TODO_STATUSES = ['open', 'in_progress', 'blocked', 'done', 'cancelled'] as const

// A ordem é a do quadro: backlog, o que anda, o que travou e o que fechou.
export const TODO_BOARD_STATUSES = ['open', 'in_progress', 'blocked', 'done'] as const

export const todoStatusSchema = z.enum(TODO_STATUSES)

export const todoBoardStatusSchema = z.enum(TODO_BOARD_STATUSES)

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
export type TodoBoardStatus = z.infer<typeof todoBoardStatusSchema>
export type Todo = z.infer<typeof todoSchema>
export type TodoRecurrence = z.infer<typeof todoRecurrenceSchema>
export type TodoTag = z.infer<typeof todoTagSchema>

export function isBoardStatus(status: TodoStatus): status is TodoBoardStatus {
  return status !== 'cancelled'
}
