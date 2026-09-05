import type { Person } from '@/domain/schemas/personSchema'

export function sumTeamWeeklyCapacity(people: readonly Person[]): number {
  return people
    .filter((person) => person.active)
    .reduce((total, person) => total + person.weeklyCapacityHours, 0)
}

export function countActivePeople(people: readonly Person[]): number {
  return people.filter((person) => person.active).length
}
