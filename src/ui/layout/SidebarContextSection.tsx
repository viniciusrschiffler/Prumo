import { useSidebarContextStore } from '@/app/stores/useSidebarContextStore'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'

type SidebarContextSectionProps = {
  label: string
}

export function SidebarContextSection({ label }: SidebarContextSectionProps) {
  const items = useSidebarContextStore((state) => state.items)
  const activeId = useSidebarContextStore((state) => state.activeId)
  const onSelect = useSidebarContextStore((state) => state.onSelect)

  return (
    <div className="mt-3.5 grid overflow-hidden">
      <div className="px-3.5 pb-1.5 text-label uppercase text-text3">{label}</div>

      {items.length === 0 ? (
        <p className="px-3.5 text-support text-text3">Nada aqui ainda.</p>
      ) : (
        <div className="grid gap-px px-2">
          {items.map((item) => {
            const isActive = item.id === activeId

            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive || undefined}
                onClick={() => onSelect?.(item.id)}
                className={classNames(
                  'flex h-[26px] items-center gap-[7px] rounded-button px-2 text-left hover:bg-neutral-soft',
                  isActive ? 'bg-neutral-soft font-medium text-text' : 'text-text2',
                  FOCUS_RING,
                )}
              >
                <span className="truncate text-support">{item.label}</span>
                {item.meta !== undefined && (
                  <span className="ml-auto font-mono text-micro text-text3">{item.meta}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
