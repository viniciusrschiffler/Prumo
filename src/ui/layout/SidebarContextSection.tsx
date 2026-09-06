import { useSidebarContextStore } from '@/app/stores/useSidebarContextStore'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import type { SidebarContextVariant } from './screenMeta'

type SidebarContextSectionProps = {
  label: string
  variant?: SidebarContextVariant
}

type SidebarContextItemProps = {
  label: string
  meta: string | undefined
  isActive: boolean
  onSelect: () => void
}

function ContextRow({ label, meta, isActive, onSelect }: SidebarContextItemProps) {
  return (
    <button
      type="button"
      aria-current={isActive || undefined}
      onClick={onSelect}
      className={classNames(
        'flex h-[26px] items-center gap-[7px] rounded-button px-2 text-left hover:bg-neutral-soft',
        isActive ? 'bg-neutral-soft font-medium text-text' : 'text-text2',
        FOCUS_RING,
      )}
    >
      <span className="truncate text-support">{label}</span>
      {meta !== undefined && <span className="ml-auto font-mono text-micro text-text3">{meta}</span>}
    </button>
  )
}

function ContextPill({ label, meta, isActive, onSelect }: SidebarContextItemProps) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onSelect}
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-[5px] border px-[7px] py-px text-label font-normal tracking-normal',
        isActive
          ? 'border-accent-line bg-accent-soft text-accent'
          : 'border-border text-text2 hover:bg-neutral-soft hover:text-text',
        FOCUS_RING,
      )}
    >
      {label}
      {meta !== undefined && <span className="font-mono text-micro text-text3">{meta}</span>}
    </button>
  )
}

export function SidebarContextSection({ label, variant = 'list' }: SidebarContextSectionProps) {
  const items = useSidebarContextStore((state) => state.items)
  const activeId = useSidebarContextStore((state) => state.activeId)
  const onSelect = useSidebarContextStore((state) => state.onSelect)

  const isPills = variant === 'pills'

  return (
    <div className="mt-3.5 grid overflow-hidden">
      <div className="px-3.5 pb-1.5 text-label uppercase text-text3">{label}</div>

      {items.length === 0 ? (
        <p className="px-3.5 text-support text-text3">Nada aqui ainda.</p>
      ) : (
        <div
          className={classNames(
            isPills ? 'flex flex-wrap gap-1 px-3.5' : 'grid gap-px px-2',
            'overflow-auto',
          )}
        >
          {items.map((item) => {
            const itemProps = {
              label: item.label,
              meta: item.meta,
              isActive: item.id === activeId,
              onSelect: () => onSelect?.(item.id),
            }

            return isPills ? (
              <ContextPill key={item.id} {...itemProps} />
            ) : (
              <ContextRow key={item.id} {...itemProps} />
            )
          })}
        </div>
      )}
    </div>
  )
}
