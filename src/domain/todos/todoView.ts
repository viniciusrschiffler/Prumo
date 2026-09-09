export const TODO_VIEWS = ['list', 'board'] as const

export type TodoView = (typeof TODO_VIEWS)[number]
