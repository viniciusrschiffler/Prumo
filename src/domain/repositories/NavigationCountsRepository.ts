export type NavigationCounts = {
  projects: number
  todos: number
}

export type NavigationCountsRepository = {
  read(): Promise<NavigationCounts>
}
