import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { bootstrapDatabase } from '@/app/bootstrapDatabase'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { useNavigationCountsStore } from '@/app/stores/useNavigationCountsStore'
import type { Screen } from '@/domain/schemas/savedViewSchema'
import { resolveDataFolderPath } from '@/infra/config/resolveDataFolderPath'
import type { Shortcut } from '@/ui/shortcuts/shortcutRegistry'
import { ShortcutListener } from '@/ui/shortcuts/ShortcutListener'
import { useShortcuts } from '@/ui/shortcuts/useShortcuts'
import { ThemeProvider } from '@/ui/theme/ThemeProvider'
import { resolveScreenFromPath, SCREEN_META } from './screenMeta'
import { Sidebar } from './Sidebar'
import { ToastRegion } from './ToastRegion'

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const databaseStatus = useDatabaseStore((state) => state.status)
  const errorMessage = useDatabaseStore((state) => state.errorMessage)
  const counts = useNavigationCountsStore((state) => state.counts)
  const refreshCounts = useNavigationCountsStore((state) => state.refresh)
  const [dataFolderPath, setDataFolderPath] = useState<string | null>(null)

  const currentScreen = resolveScreenFromPath(location.pathname)

  const navigationShortcuts = useMemo<Shortcut[]>(() => {
    return Object.values(SCREEN_META)
      .filter((meta) => meta.navigationKeys !== null)
      .map((meta) => ({
        id: `navigate-${meta.screen}`,
        keys: meta.navigationKeys as string,
        scope: 'global',
        description: `Ir para ${meta.title}`,
        run: () => void navigate(meta.path),
      }))
  }, [navigate])

  useShortcuts(navigationShortcuts)

  useEffect(() => {
    void resolveDataFolderPath().then(setDataFolderPath)
    void bootstrapDatabase(null)
  }, [])

  useEffect(() => {
    if (databaseStatus !== 'ready') {
      return
    }

    void refreshCounts()
  }, [databaseStatus, refreshCounts])

  const sidebarCounts: Partial<Record<Screen, number>> =
    counts === null ? {} : { projects: counts.projects, todos: counts.todos }

  return (
    <ThemeProvider>
      <div className="grid h-screen grid-cols-[216px_1fr] overflow-hidden bg-bg text-text">
        <Sidebar
          currentScreen={currentScreen}
          counts={sidebarCounts}
          dataFolderPath={dataFolderPath}
          showShortcutHints
        />
        <main className="overflow-hidden">
          {errorMessage !== null && (
            <div className="border-b border-danger bg-danger-soft px-7 py-2 text-support text-danger">
              {errorMessage}
            </div>
          )}
          <Outlet />
        </main>
        <ShortcutListener />
        <ToastRegion />
      </div>
    </ThemeProvider>
  )
}
