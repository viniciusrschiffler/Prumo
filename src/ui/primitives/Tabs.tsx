import { classNames } from './classNames'
import { FOCUS_RING } from './focusRing'

export type TabItem = {
  id: string
  label: string
  count?: number
}

type TabsProps = {
  items: readonly TabItem[]
  activeId: string
  onSelect: (id: string) => void
  className?: string
}

export function Tabs({ items, activeId, onSelect, className }: TabsProps) {
  return (
    <div role="tablist" className={classNames('flex gap-0.5 border-b border-border', className)}>
      {items.map((item) => {
        const isActive = item.id === activeId

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(item.id)}
            className={classNames(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-support',
              isActive
                ? 'font-semibold text-text shadow-[inset_0_-2px_0_var(--accent)]'
                : 'text-text2 hover:text-text',
              FOCUS_RING,
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="font-mono text-micro tabular-nums text-text3">{item.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
