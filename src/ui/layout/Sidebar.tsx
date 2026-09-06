import type { Screen } from '@/domain/schemas/savedViewSchema'
import { ThemeCycleButton } from '@/ui/theme/ThemeCycleButton'
import { SCREEN_META } from './screenMeta'
import { SidebarContextSection } from './SidebarContextSection'
import { SidebarFooter } from './SidebarFooter'
import { SidebarNav } from './SidebarNav'

type SidebarProps = {
  currentScreen: Screen
  counts: Partial<Record<Screen, number>>
  dataFolderPath: string | null
  showShortcutHints: boolean
}

export function Sidebar({
  currentScreen,
  counts,
  dataFolderPath,
  showShortcutHints,
}: SidebarProps) {
  return (
    <aside className="flex flex-col overflow-hidden border-r border-border bg-sunken">
      <div className="flex items-center gap-2 px-3.5 pb-3 pt-3.5">
        <div className="h-5 w-5 rounded-[5px] bg-text" />
        <div className="grid">
          <span className="text-body font-semibold tracking-[-0.01em]">Prumo</span>
          <span className="font-mono text-micro text-text3">local · offline</span>
        </div>
        <ThemeCycleButton />
      </div>

      <SidebarNav counts={counts} showShortcutHints={showShortcutHints} />
      <SidebarContextSection
        label={SCREEN_META[currentScreen].contextLabel}
        variant={SCREEN_META[currentScreen].contextVariant}
      />
      <SidebarFooter dataFolderPath={dataFolderPath} />
    </aside>
  )
}
