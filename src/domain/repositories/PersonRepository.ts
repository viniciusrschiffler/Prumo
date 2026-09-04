import type { Person } from '@/domain/schemas/personSchema'
import type { EntityId } from '@/domain/schemas/primitives'

export type PersonRepository = {
  listAll(): Promise<Person[]>
  findById(id: EntityId): Promise<Person | null>
  save(person: Person): Promise<void>
  remove(id: EntityId): Promise<void>
}
