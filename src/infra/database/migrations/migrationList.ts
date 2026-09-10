import initialSchema from './001_initial.sql?raw'
import seedDefaultPhases from './002_seed_default_phases.sql?raw'
import replanAndPausedAt from './003_replan_and_paused_at.sql?raw'
import todoBoardStatus from './004_todo_board_status.sql?raw'
import taskDescription from './005_task_description.sql?raw'

export type Migration = {
  version: number
  name: string
  sql: string
}

export const MIGRATION_LIST: readonly Migration[] = [
  { version: 1, name: 'initial', sql: initialSchema },
  { version: 2, name: 'seed_default_phases', sql: seedDefaultPhases },
  { version: 3, name: 'replan_and_paused_at', sql: replanAndPausedAt },
  { version: 4, name: 'todo_board_status', sql: todoBoardStatus },
  { version: 5, name: 'task_description', sql: taskDescription },
]
