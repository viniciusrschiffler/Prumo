import { create } from 'zustand'

export type DatabaseStatus = 'idle' | 'opening' | 'ready' | 'error'

type DatabaseState = {
  status: DatabaseStatus
  schemaVersion: number | null
  errorMessage: string | null
  markOpening: () => void
  markReady: (schemaVersion: number) => void
  markFailed: (errorMessage: string) => void
}

export const useDatabaseStore = create<DatabaseState>((set) => ({
  status: 'idle',
  schemaVersion: null,
  errorMessage: null,
  markOpening: () => set(() => ({ status: 'opening', errorMessage: null })),
  markReady: (schemaVersion) => set(() => ({ status: 'ready', schemaVersion, errorMessage: null })),
  markFailed: (errorMessage) => set(() => ({ status: 'error', errorMessage })),
}))
