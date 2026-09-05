import type { Baseline, BaselineTask } from '@/domain/schemas/baselineSchema'

export type BaselineRepository = {
  listAll(): Promise<Baseline[]>
  listTasks(): Promise<BaselineTask[]>
}
