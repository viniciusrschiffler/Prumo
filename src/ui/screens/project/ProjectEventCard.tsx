import type { EventFeedEntry } from '@/domain/projects/eventFeed'
import { formatIsoDate } from '@/domain/format/displayDate'
import type { ProjectEventType } from '@/domain/schemas/projectEventSchema'
import { AccentCard, type AccentCardTone } from '@/ui/primitives/AccentCard'
import { Badge, type BadgeTone } from '@/ui/primitives/Badge'
import { classNames } from '@/ui/primitives/classNames'
import { MarkdownText } from '@/ui/primitives/MarkdownText'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { ProgressBar } from '@/ui/primitives/ProgressBar'
import { PROJECT_EVENT_LABELS } from '@/ui/labels/entityLabels'

const TONE_BY_TYPE: Record<ProjectEventType, AccentCardTone> = {
  decision: 'neutral',
  scope_change: 'scope',
  replan: 'accent',
  block: 'danger',
  unblock: 'ok',
  reallocation: 'accent',
  risk: 'warn',
  note: 'info',
}

const BADGE_TONE_BY_TYPE: Record<ProjectEventType, BadgeTone> = {
  decision: 'neutral',
  scope_change: 'scope',
  replan: 'accent',
  block: 'danger',
  unblock: 'ok',
  reallocation: 'accent',
  risk: 'warn',
  note: 'info',
}

function Relation({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-label font-normal tracking-normal text-text3">
      {label}
      <span className="rounded-badge border border-border px-[5px] font-mono text-text2">
        {value}
      </span>
    </div>
  )
}

type ProjectEventCardProps = {
  entry: EventFeedEntry
  phaseColorByTaskId: ReadonlyMap<string, string>
}

export function ProjectEventCard({ entry, phaseColorByTaskId }: ProjectEventCardProps) {
  const { event, frozenBaseline } = entry

  return (
    <AccentCard tone={TONE_BY_TYPE[event.type]}>
      <div className="flex items-center gap-[7px]">
        <Badge tone={BADGE_TONE_BY_TYPE[event.type]} size="small" uppercase>
          {PROJECT_EVENT_LABELS[event.type]}
        </Badge>
        {event.riskOpen && (
          <Badge tone="warn" variant="outline" size="small">
            aberto
          </Badge>
        )}
        <span className="ml-auto font-mono text-micro tabular-nums text-text3">
          {formatIsoDate(event.eventDate)}
        </span>
      </div>

      <h3 className="text-body font-semibold">{event.title}</h3>

      {event.bodyMarkdown !== null && (
        <MarkdownText text={event.bodyMarkdown} className="text-support text-text2" />
      )}

      {entry.tasks.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tasks.map((task) => (
            <span
              key={task.id}
              style={phaseColorStyle(phaseColorByTaskId.get(task.id) ?? 'oklch(0.5 0 0)')}
              className="phase-tinted inline-flex items-center gap-1.5 rounded-badge border border-border px-1.5 py-px text-label font-normal tracking-normal text-text2"
            >
              <span className="h-2.5 w-[3px] flex-none rounded-[2px] bg-[var(--phase-tone)]" />
              {task.title}
            </span>
          ))}
        </div>
      )}

      {frozenBaseline !== null && (
        <>
          <div className="flex items-center gap-2 rounded-button border border-border bg-sunken px-2 py-1.5 font-mono text-label font-normal tabular-nums tracking-normal">
            <span className="text-text3">esforço</span>
            <span>
              {frozenBaseline.effortBefore}h → {frozenBaseline.effortAfter}h
            </span>
            <span className="ml-auto text-text3">fim</span>
            <span
              className={classNames(
                frozenBaseline.endAfter !== null &&
                  frozenBaseline.endBefore !== null &&
                  frozenBaseline.endAfter > frozenBaseline.endBefore
                  ? 'text-danger'
                  : 'text-text',
              )}
            >
              {formatIsoDate(frozenBaseline.endBefore)} → {formatIsoDate(frozenBaseline.endAfter)}
            </span>
          </div>
          <Relation label="Congelou" value={`baseline v${frozenBaseline.version}`} />
        </>
      )}

      {entry.blockedDays !== null && (
        <div className="flex items-center gap-2 rounded-button bg-sunken px-2 py-1.5">
          <ProgressBar hatched track="danger" size="wide" className="flex-1" />
          <span className="font-mono text-label font-normal tabular-nums tracking-normal text-text2">
            {entry.blockedDays} {entry.blockedDays === 1 ? 'dia bloqueado' : 'dias bloqueado'}
          </span>
        </div>
      )}

      {entry.reverts !== null && (
        <Relation
          label="Reverte"
          value={`${PROJECT_EVENT_LABELS[entry.reverts.type].toLocaleLowerCase('pt-BR')} ${formatIsoDate(
            entry.reverts.eventDate,
          ).slice(0, 5)}`}
        />
      )}
    </AccentCard>
  )
}
