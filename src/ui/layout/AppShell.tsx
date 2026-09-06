import { useEffect, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { bootstrapDatabase } from '@/app/bootstrapDatabase'
import { useCommandPaletteStore } from '@/app/stores/useCommandPaletteStore'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { useDataFolderStore } from '@/app/stores/useDataFolderStore'
import { useNavigationCountsStore } from '@/app/stores/useNavigationCountsStore'
import { useSettingsStore } from '@/app/stores/useSettingsStore'
import type { Screen } from '@/domain/schemas/savedViewSchema'
import type { Shortcut } from '@/ui/shortcuts/shortcutRegistry'
import { ShortcutListener } from '@/ui/shortcuts/ShortcutListener'
import { useShortcuts } from '@/ui/shortcuts/useShortcuts'
import { ThemeProvider } from '@/ui/theme/ThemeProvider'
import { CommandPalette, COMMAND_PALETTE_SHORTCUT_ID } from './CommandPalette'
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
  const dataFolderPath = useDataFolderStore((state) => state.path)
  const resolveDataFolder = useDataFolderStore((state) => state.resolve)
  const showShortcutHints = useSettingsStore((state) => state.settings.showShortcutHints)
  const openCommandPalette = useCommandPaletteStore((state) => state.open)
  const isCommandPaletteOpen = useCommandPaletteStore((state) => state.isOpen)

  const currentScreen = resolveScreenFromPath(location.pathname)

  const globalShortcuts = useMemo<Shortcut[]>(() => {
    const navigation: Shortcut[] = Object.values(SCREEN_META)
      .filter((meta) => meta.navigationKeys !== null)
      .map((meta) => ({
        id: `navigate-${meta.screen}`,
        keys: meta.navigationKeys as string,
        scope: 'global',
        description: `Ir para ${meta.title}`,
        run: () => void navigate(meta.path),
      }))

    return [
      ...navigation,
      {
        id: COMMAND_PALETTE_SHORTCUT_ID,
        keys: 'mod+k',
        scope: 'global',
        description: 'Abrir a paleta de comandos',
        run: openCommandPalette,
      },
    ]
  }, [navigate, openCommandPalette])

  useShortcuts(globalShortcuts)

  useEffect(() => {
    void resolveDataFolder().then((path) => bootstrapDatabase(path))
  }, [resolveDataFolder])

  useEffect(() => {
    if (databaseStatus !== 'ready') {
      return
    }

    void refreshCounts()
  }, [databaseStatus, refreshCounts])

  const sidebarCounts: Partial<Record<Screen, number>> =
    counts === null
      ? {}
      : { today: counts.today, projects: counts.projects, todos: counts.todos }

  return (
    <ThemeProvider>
      <div className="grid h-screen grid-cols-[216px_1fr] overflow-hidden bg-bg text-text">
        <Sidebar
          currentScreen={currentScreen}
          counts={sidebarCounts}
          dataFolderPath={dataFolderPath}
          showShortcutHints={showShortcutHints}
        />
        <main className="overflow-hidden">
          {errorMessage !== null && (
            <div className="border-b border-danger bg-danger-soft px-7 py-2 text-support text-danger">
              {errorMessage}
            </div>
          )}
          <Outlet />
        </main>
        {isCommandPaletteOpen && <CommandPalette />}
        <ShortcutListener />
        <ToastRegion />
      </div>
    </ThemeProvider>
  )
}
