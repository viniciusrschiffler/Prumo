import {
  useSidebarContextStore,
  type SidebarContextMetaTone,
} from '@/app/stores/useSidebarContextStore'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import type { SidebarContextVariant } from './screenMeta'

type SidebarContextSectionProps = {
  label: string
  variant?: SidebarContextVariant
}

type SidebarContextItemProps = {
  label: string
  meta: string | undefined
  metaTone?: SidebarContextMetaTone
  metaDot?: SidebarContextMetaTone
  subdued?: boolean
  color?: string
  isActive: boolean
  onSelect: () => void
}

const META_TONE_CLASSES: Record<SidebarContextMetaTone, string> = {
  default: 'text-text3',
  danger: 'text-danger',
}

const DOT_TONE_CLASSES: Record<SidebarContextMetaTone, string> = {
  default: 'bg-text3',
  danger: 'bg-danger',
}

function toRowToneClasses(isActive: boolean, subdued: boolean): string {
  if (isActive) {
    return 'bg-neutral-soft font-medium text-text'
  }

  return subdued ? 'text-text3' : 'text-text2'
}

function ContextRow({
  label,
  meta,
  metaTone = 'default',
  metaDot,
  subdued = false,
  isActive,
  onSelect,
}: SidebarContextItemProps) {
  return (
    <button
      type="button"
      aria-current={isActive || undefined}
      onClick={onSelect}
      className={classNames(
        'flex h-[26px] items-center gap-[7px] rounded-button px-2 text-left hover:bg-neutral-soft',
        toRowToneClasses(isActive, subdued),
        FOCUS_RING,
      )}
    >
      <span className="truncate text-support">{label}</span>
      {meta !== undefined && (
        <span className={classNames('ml-auto font-mono text-micro', META_TONE_CLASSES[metaTone])}>
          {meta}
        </span>
      )}
      {metaDot !== undefined && (
        <span
          aria-hidden
          className={classNames(
            'h-1.5 w-1.5 flex-none rounded-full',
            meta === undefined ? 'ml-auto' : '',
            DOT_TONE_CLASSES[metaDot],
          )}
        />
      )}
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

// A Timeline lista as fases como legenda das cores das barras, não como filtro: o design não
// diz o que o clique faria, e botão que não faz nada é pior que botão ausente.
function LegendRow({ label, meta, color }: Omit<SidebarContextItemProps, 'isActive' | 'onSelect'>) {
  return (
    <div className="flex h-[22px] items-center gap-[7px] px-2 text-text2">
      {color !== undefined && (
        <span
          className="phase-tinted h-2 w-2 flex-none rounded-[2px] bg-[var(--phase-tone)]"
          style={phaseColorStyle(color)}
          aria-hidden
        />
      )}
      <span className="truncate text-support">{label}</span>
      {meta !== undefined && <span className="ml-auto font-mono text-micro text-text3">{meta}</span>}
    </div>
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
              metaTone: item.metaTone,
              metaDot: item.metaDot,
              subdued: item.subdued,
              color: item.color,
              isActive: item.id === activeId,
              onSelect: () => onSelect?.(item.id),
            }

            if (variant === 'legend') {
              return <LegendRow key={item.id} {...itemProps} />
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
