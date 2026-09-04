import { NavLink } from 'react-router'
import type { Screen } from '@/domain/schemas/savedViewSchema'
import { formatShortcutHint, SCREEN_META, SIDEBAR_SCREENS } from './screenMeta'

type SidebarNavProps = {
  counts: Partial<Record<Screen, number>>
  showShortcutHints: boolean
}

export function SidebarNav({ counts, showShortcutHints }: SidebarNavProps) {
  return (
    <nav className="grid gap-px px-2 py-1">
      {SIDEBAR_SCREENS.map((screen) => {
        const meta = SCREEN_META[screen]
        const count = counts[screen]

        return (
          <NavLink
            key={screen}
            to={meta.path}
            className={({ isActive }) =>
              `flex h-7 items-center gap-2 rounded-button px-2 ${
                isActive
                  ? 'bg-neutral-soft font-semibold text-text shadow-[inset_2px_0_0_var(--accent)]'
                  : 'text-text2 hover:bg-neutral-soft hover:text-text'
              }`
            }
          >
            <span className="text-body">{meta.title}</span>
            {count !== undefined && (
              <span className="ml-auto font-mono text-label font-normal tabular-nums text-text3">
                {count}
              </span>
            )}
            {showShortcutHints && meta.navigationKeys !== null && (
              <span
                className={`${count === undefined ? 'ml-auto' : ''} rounded-[3px] border border-border bg-panel px-1 font-mono text-[9px] text-text3`}
              >
                {formatShortcutHint(meta.navigationKeys)}
              </span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
