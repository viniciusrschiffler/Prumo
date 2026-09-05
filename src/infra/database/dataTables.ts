// Pais antes de filhos. A exportação percorre nesta ordem e o apagar percorre ao contrário,
// que é o que respeita o ON DELETE RESTRICT de task.phase_id e de allocation.person_id.
export const TABLES_IN_DEPENDENCY_ORDER = [
  'person',
  'phase',
  'tag',
  'project',
  'project_tag',
  'task',
  'task_dependency',
  'allocation',
  'project_event',
  'project_event_task',
  'baseline',
  'baseline_task',
  'todo_recurrence',
  'todo',
  'todo_tag',
  'note',
  'saved_view',
  'setting',
] as const

export type DataTable = (typeof TABLES_IN_DEPENDENCY_ORDER)[number]
