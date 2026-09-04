import { useSyncExternalStore } from 'react'
import { useThemeStore } from '@/app/stores/useThemeStore'

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

export type ResolvedTheme = 'light' | 'dark'

function subscribeToSystemScheme(onSchemeChange: () => void) {
  const mediaQuery = window.matchMedia(DARK_SCHEME_QUERY)
  mediaQuery.addEventListener('change', onSchemeChange)

  return () => mediaQuery.removeEventListener('change', onSchemeChange)
}

function readSystemScheme(): ResolvedTheme {
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? 'dark' : 'light'
}

export function useResolvedTheme(): ResolvedTheme {
  const preference = useThemeStore((state) => state.preference)
  const systemScheme = useSyncExternalStore(subscribeToSystemScheme, readSystemScheme)

  if (preference === 'system') {
    return systemScheme
  }

  return preference
}
