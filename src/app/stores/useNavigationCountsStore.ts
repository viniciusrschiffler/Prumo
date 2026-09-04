import { create } from 'zustand'
import type { NavigationCounts } from '@/domain/repositories/NavigationCountsRepository'
import { getSqlGateway } from '@/infra/database/DatabaseConnection'
import { SqliteNavigationCountsRepository } from '@/infra/repositories/SqliteNavigationCountsRepository'

type NavigationCountsState = {
  counts: NavigationCounts | null
  refresh: () => Promise<void>
}

export const useNavigationCountsStore = create<NavigationCountsState>((set) => ({
  counts: null,
  refresh: async () => {
    const repository = new SqliteNavigationCountsRepository(getSqlGateway())

    try {
      const counts = await repository.read()

      set(() => ({ counts }))
    } catch (cause) {
      console.error('Não foi possível ler os contadores da navegação.', cause)
    }
  },
}))
