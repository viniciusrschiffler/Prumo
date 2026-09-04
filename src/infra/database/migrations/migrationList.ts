import initialSchema from './001_initial.sql?raw'
import seedDefaultPhases from './002_seed_default_phases.sql?raw'

export type Migration = {
  version: number
  name: string
  sql: string
}

export const MIGRATION_LIST: readonly Migration[] = [
  { version: 1, name: 'initial', sql: initialSchema },
  { version: 2, name: 'seed_default_phases', sql: seedDefaultPhases },
]
