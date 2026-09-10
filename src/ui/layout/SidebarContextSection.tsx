import {
  useSidebarContextStore,
  type SidebarContextItem,
  type SidebarContextMetaTone,
} from '@/app/stores/useSidebarContextStore'
import { classNames } from '@/ui/primitives/classNames'
import { FOCUS_RING } from '@/ui/primitives/focusRing'
import { PhaseStripe } from '@/ui/primitives/PhaseStripe'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import type { SidebarContextVariant } from './screenMeta'

type SidebarContextSectionProps = {
  label: string
  variant?: SidebarContextVariant
}

type SidebarSectionShellProps = {
  label: string
  variant: SidebarContextVariant
  items: readonly SidebarContextItem[]
  activeId: string | null
  onSelect: ((id: string) => void) | null
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
  color,
  isActive,
  onSelect,
}: SidebarContextItemProps) {
  return (
    <button
      type="button"
      aria-current={isActive || undefined}
      onClick={onSelect}
      className={classNames(
        'flex h-[26px] min-w-0 items-center gap-[7px] rounded-button px-2 text-left hover:bg-neutral-soft',
        toRowToneClasses(isActive, subdued),
        FOCUS_RING,
      )}
    >
      {color !== undefined && <PhaseStripe color={color} />}
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
    <div className="flex h-[22px] min-w-0 items-center gap-[7px] px-2 text-text2">
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

function SidebarSectionShell({
  label,
  variant,
  items,
  activeId,
  onSelect,
}: SidebarSectionShellProps) {
  const isPills = variant === 'pills'

  return (
    <div className="mt-3.5 grid overflow-hidden">
      <div className="px-3.5 pb-1.5 text-label uppercase text-text3">{label}</div>

      {items.length === 0 ? (
        <p className="px-3.5 text-support text-text3">Nada aqui ainda.</p>
      ) : (
        <div
          className={classNames(
            // A trilha de largura mínima zero é o que segura o nome longo: sem ela a coluna
            // do grid cresce até o texto inteiro e a barra lateral ganha rolagem horizontal.
            isPills ? 'flex flex-wrap gap-1 px-3.5' : 'grid grid-cols-[minmax(0,1fr)] gap-px px-2',
            'overflow-y-auto',
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

export function SidebarContextSection({ label, variant = 'list' }: SidebarContextSectionProps) {
  const items = useSidebarContextStore((state) => state.items)
  const activeId = useSidebarContextStore((state) => state.activeId)
  const onSelect = useSidebarContextStore((state) => state.onSelect)

  return (
    <SidebarSectionShell
      label={label}
      variant={variant}
      items={items}
      activeId={activeId}
      onSelect={onSelect}
    />
  )
}

export function SidebarLeadContextSection() {
  const lead = useSidebarContextStore((state) => state.lead)

  if (lead === null) {
    return null
  }

  return (
    <SidebarSectionShell
      label={lead.label}
      variant="list"
      items={lead.items}
      activeId={lead.activeId}
      onSelect={lead.onSelect}
    />
  )
}
