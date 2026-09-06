import type { AllocationDetail } from '@/domain/capacity/allocationDetails'
import type {
  ImpactRow,
  ReallocationSimulation,
} from '@/domain/capacity/reallocationImpact'
import { REMOVAL_WEEK_OPTIONS } from '@/domain/capacity/reallocationImpact'
import { formatIsoDayMonth } from '@/domain/format/displayDate'
import type { Person } from '@/domain/schemas/personSchema'
import type { EntityId } from '@/domain/schemas/primitives'
import { Alert } from '@/ui/primitives/Alert'
import { classNames } from '@/ui/primitives/classNames'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Modal } from '@/ui/primitives/Modal'
import { phaseColorStyle } from '@/ui/primitives/phaseColorStyle'
import { Select } from '@/ui/primitives/Select'
import { describeAllocation, formatPercentage } from './capacityLabels'

const ROW_TEMPLATE = 'grid grid-cols-[1fr_96px_96px_64px] gap-2.5 px-[11px]'
const EMPTY_MARK = '—'

export type SimulatorDraft = {
  personId: EntityId
  allocationId: EntityId
  weeksRemoved: number
}

type ImpactSimulatorModalProps = {
  draft: SimulatorDraft
  people: readonly Person[]
  removableAllocations: readonly AllocationDetail[]
  simulation: ReallocationSimulation | null
  isApplying: boolean
  onChange: (draft: SimulatorDraft) => void
  onClose: () => void
  onApply: () => void
}

function formatDelta(deltaDays: number): string {
  if (deltaDays === 0) {
    return EMPTY_MARK
  }

  return deltaDays > 0 ? `+${deltaDays}d` : `${deltaDays}d`
}

function formatWeeks(weeks: number): string {
  return weeks === 1 ? '1 semana' : `${weeks} semanas`
}

function describeAllocationOption(detail: AllocationDetail): string {
  return `${detail.task.title} · ${describeAllocation(detail)} (${formatPercentage(
    detail.allocation.percentage,
  )})`
}

function ImpactTableRow({ row }: { row: ImpactRow }) {
  return (
    <div className={classNames(ROW_TEMPLATE, 'border-b border-border bg-panel py-2 last:border-b-0')}>
      <span className="inline-flex items-center gap-[7px] truncate text-support">
        <span
          aria-hidden
          style={row.phaseColor === null ? undefined : phaseColorStyle(row.phaseColor)}
          className={classNames(
            'h-3 w-[3px] flex-none rounded-[2px]',
            row.phaseColor === null ? 'bg-border-strong' : 'phase-tinted bg-[var(--phase-tone)]',
          )}
        />
        <span className="truncate">{row.label}</span>
      </span>
      <span className="text-right font-mono text-support tabular-nums text-text2">
        {formatIsoDayMonth(row.before)}
      </span>
      <span className="text-right font-mono text-support tabular-nums">
        {formatIsoDayMonth(row.after)}
      </span>
      <span
        className={classNames(
          'text-right font-mono text-support tabular-nums',
          row.deltaDays === 0 ? 'text-text3' : 'text-danger',
        )}
      >
        {formatDelta(row.deltaDays)}
      </span>
    </div>
  )
}

function SimulationVerdict({ simulation }: { simulation: ReallocationSimulation }) {
  const { removalPeriod, peakPercentageAfter, resolvesOverload, person } = simulation
  const window = `${formatIsoDayMonth(removalPeriod.start)} a ${formatIsoDayMonth(
    removalPeriod.end,
  )}`

  if (resolvesOverload) {
    return (
      <Alert level="ok" title="Conflito resolvido">
        {`${person.name} cai para ${formatPercentage(
          peakPercentageAfter,
        )} entre ${window}. Nenhuma outra pessoa passa de 100%.`}
      </Alert>
    )
  }

  return (
    <Alert level="info" title="Sem conflito para resolver">
      {`${person.name} já ficava dentro da capacidade entre ${window}, com pico de ${formatPercentage(
        simulation.peakPercentageBefore,
      )}. A remoção só desloca o plano.`}
    </Alert>
  )
}

export function ImpactSimulatorModal({
  draft,
  people,
  removableAllocations,
  simulation,
  isApplying,
  onChange,
  onClose,
  onApply,
}: ImpactSimulatorModalProps) {
  return (
    <Modal
      open
      size="large"
      tone="accent"
      title="Simulador de impacto"
      hint="Aplicar registra um evento de realocação e congela nova baseline."
      cancelLabel="Descartar"
      submitLabel="Aplicar realocação"
      submitDisabled={simulation === null || isApplying}
      onClose={onClose}
      onSubmit={onApply}
    >
      <div className="grid grid-cols-[1.2fr_1.4fr_0.9fr] gap-2.5">
        <FieldGroup label="Tirar">
          <Select
            fieldSize="default"
            textSize="support"
            value={draft.personId}
            onChange={(event) => onChange({ ...draft, personId: event.target.value })}
          >
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </Select>
        </FieldGroup>

        <FieldGroup label="De">
          <Select
            fieldSize="default"
            textSize="support"
            value={draft.allocationId}
            disabled={removableAllocations.length === 0}
            onChange={(event) => onChange({ ...draft, allocationId: event.target.value })}
          >
            {removableAllocations.length === 0 ? (
              <option value="">Nenhuma alocação em aberto</option>
            ) : (
              removableAllocations.map((detail) => (
                <option key={detail.allocation.id} value={detail.allocation.id}>
                  {describeAllocationOption(detail)}
                </option>
              ))
            )}
          </Select>
        </FieldGroup>

        <FieldGroup label="Por">
          <Select
            fieldSize="default"
            textSize="support"
            value={String(draft.weeksRemoved)}
            onChange={(event) =>
              onChange({ ...draft, weeksRemoved: Number(event.target.value) })
            }
          >
            {REMOVAL_WEEK_OPTIONS.map((weeks) => (
              <option key={weeks} value={weeks}>
                {formatWeeks(weeks)}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>

      {simulation === null ? (
        <p className="rounded-card border border-border bg-sunken px-[11px] py-2.5 text-support text-text3">
          Escolha uma pessoa com alocação em aberto para ver o impacto.
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-card border border-border bg-sunken">
            <div
              className={classNames(
                ROW_TEMPLATE,
                'border-b border-border py-[7px] text-column uppercase text-text2',
              )}
            >
              <span>O que desloca</span>
              <span className="text-right">Antes</span>
              <span className="text-right">Depois</span>
              <span className="text-right">Δ</span>
            </div>
            {simulation.rows.map((row) => (
              <ImpactTableRow key={row.id} row={row} />
            ))}
          </div>

          <SimulationVerdict simulation={simulation} />
        </>
      )}
    </Modal>
  )
}
