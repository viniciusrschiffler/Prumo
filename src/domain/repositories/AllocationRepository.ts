import type { Reallocation } from '@/domain/capacity/reallocationWrite'
import type { Allocation } from '@/domain/schemas/allocationSchema'

export type AllocationRepository = {
  listAll(): Promise<Allocation[]>
  applyReallocation(reallocation: Reallocation): Promise<void>
}
