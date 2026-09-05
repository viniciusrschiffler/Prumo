import type { Allocation } from '@/domain/schemas/allocationSchema'

export type AllocationRepository = {
  listAll(): Promise<Allocation[]>
}
