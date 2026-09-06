import { create } from 'zustand'
import { todayIsoDate } from '@/app/clock'
import type { NavigationCounts } from '@/domain/repositories/NavigationCountsRepository'
import { countTodayItems } from '@/domain/today/todayAgenda'
import { getSqlGateway } from '@/infra/database/DatabaseConnection'
import { SqliteNavigationCountsRepository } from '@/infra/repositories/SqliteNavigationCountsRepository'
import { SqliteProjectRepository } from '@/infra/repositories/SqliteProjectRepository'
import { SqliteTaskRepository } from '@/infra/repositories/SqliteTaskRepository'
import { SqliteTodoRepository } from '@/infra/repositories/SqliteTodoRepository'

export type SidebarCounts = NavigationCounts & {
  today: number
}

type NavigationCountsState = {
  counts: SidebarCounts | null
  refresh: () => Promise<void>
}

// Projeto e todo se contam com um SELECT count(*); o de Hoje é derivado, então ele sai das
// mesmas funções que a tela usa, sobre as linhas cruas.
async function readCounts(): Promise<SidebarCounts> {
  const gateway = getSqlGateway()

  const [counts, todos, tasks, projects] = await Promise.all([
    new SqliteNavigationCountsRepository(gateway).read(),
    new SqliteTodoRepository(gateway).listAll(),
    new SqliteTaskRepository(gateway).listAll(),
    new SqliteProjectRepository(gateway).listAll(),
  ])

  return {
    ...counts,
    today: countTodayItems({ todos, tasks, projects, today: todayIsoDate() }),
  }
}

export const useNavigationCountsStore = create<NavigationCountsState>((set) => ({
  counts: null,
  refresh: async () => {
    try {
      const counts = await readCounts()

      set(() => ({ counts }))
    } catch (cause) {
      console.error('Não foi possível ler os contadores da navegação.', cause)
    }
  },
}))
