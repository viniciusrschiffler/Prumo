import { useEffect, type ReactNode } from 'react'
import { useResolvedTheme } from './useResolvedTheme'

type ThemeProviderProps = {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const resolvedTheme = useResolvedTheme()

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  return <>{children}</>
}
