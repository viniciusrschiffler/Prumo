import { create } from 'zustand'
import type { ThemePreference } from '@/domain/settings/appSettings'

export type { ThemePreference }

type ThemeState = {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  setPreference: (preference) => set(() => ({ preference })),
}))
