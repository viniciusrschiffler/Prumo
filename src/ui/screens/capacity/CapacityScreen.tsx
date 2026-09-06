import { useEffect, useMemo, useState } from 'react'
import { todayIsoDate } from '@/app/clock'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { useProjectsStore } from '@/app/stores/useProjectsStore'
import { useSettingsStore } from '@/app/stores/useSettingsStore'
import type { SidebarContextItem } from '@/app/stores/useSidebarContextStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { listAllocationsDuring } from '@/domain/capacity/allocationDetails'
import { CAPACITY_UNITS, type CapacityUnit } from '@/domain/capacity/capacityUnit'
import { findReleaseCandidates } from '@/domain/capacity/capacitySlack'
import { spanWeeks } from '@/domain/capacity/capacityWindow'
import type { EntityId } from '@/domain/schemas/primitives'
import { useSidebarContext } from '@/ui/layout/useSidebarContext'
import { Alert } from '@/ui/primitives/Alert'
import { Button } from '@/ui/primitives/Button'
import { EmptyState } from '@/ui/primitives/EmptyState'
import type { MatrixPosition } from '@/ui/primitives/gridNavigationKeys'
import { SegmentedControl } from '@/ui/primitives/SegmentedControl'
import { useMatrixNavigation } from '@/ui/primitives/useMatrixNavigation'
import type { Shortcut } from '@/ui/shortcuts/shortcutRegistry'
import { useShortcuts } from '@/ui/shortcuts/useShortcuts'
import { ScreenShell } from '../ScreenShell'
import { CapacityLegend } from './CapacityLegend'
import { CapacityMatrixTable } from './CapacityMatrixTable'
import { CapacitySidePanel } from './CapacitySidePanel'
import { CapacitySlackCards } from './CapacitySlackCards'
import {
  formatHours,
  formatPercentage,
  formatWeekSpan,
  formatWindowSubhead,
  pluralize,
  UNIT_LABELS,
} from './capacityLabels'
import { ProjectFilterModal } from './ProjectFilterModal'
import { useCapacityScreenData } from './useCapacityScreenData'
import { useImpactSimulator } from './useImpactSimulator'

const SUBHEAD_FALLBACK = 'alocação das pessoas por semana'
const SIMULATOR_KEYS = 'mod+i'

const UNIT_OPTIONS = CAPACITY_UNITS.map((value) => ({ value, label: UNIT_LABELS[value] }))

export function CapacityScreen() {
  const databaseStatus = useDatabaseStore((state) => state.status)
  const status = useProjectsStore((state) => state.status)
  const errorMessage = useProjectsStore((state) => state.errorMessage)
  const snapshot = useProjectsStore((state) => state.snapshot)
  const load = useProjectsStore((state) => state.load)
  const applyReallocation = useProjectsStore((state) => state.applyReallocation)
  const weekStart = useSettingsStore((state) => state.settings.weekStart)
  const notify = useToastStore((state) => state.notify)

  const [unit, setUnit] = useState<CapacityUnit>('percentage')
  const [projectId, setProjectId] = useState<EntityId | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selection, setSelection] = useState<MatrixPosition>({ row: 0, column: 0 })

  const today = todayIsoDate()

  useEffect(() => {
    if (databaseStatus !== 'ready') {
      return
    }

    void load()
  }, [databaseStatus, load])

  const { window, index, matrix, overloadAlerts, inactiveAlerts, mostAvailable, filterableProjects } =
    useCapacityScreenData({ snapshot, today, weekStart, projectId })

  const selectedRow = matrix.rows[selection.row] ?? matrix.rows[0] ?? null
  const selectedCell = selectedRow?.cells[selection.column] ?? selectedRow?.cells[0] ?? null
  const selectedWeek = window.weeks[selectedCell?.weekIndex ?? 0] ?? null

  const navigation = useMatrixNavigation({
    rowCount: matrix.rows.length,
    columnCount: window.weeks.length,
    onActivate: setSelection,
  })

  const simulator = useImpactSimulator({
    snapshot,
    index,
    window,
    today,
    applyReallocation,
    notify,
  })

  const sidebarItems = useMemo<SidebarContextItem[]>(
    () =>
      matrix.rows.map((row) => ({
        id: row.person.id,
        label: row.person.name,
        meta: row.person.active ? formatHours(row.person.weeklyCapacityHours) : 'inativa',
        metaTone: row.isOverloaded ? ('danger' as const) : ('default' as const),
        subdued: !row.person.active,
      })),
    [matrix.rows],
  )

  useSidebarContext(sidebarItems, selectedRow?.person.id ?? null)

  const shortcuts = useMemo<Shortcut[]>(
    () => [
      {
        id: 'capacity-open-simulator',
        keys: SIMULATOR_KEYS,
        scope: 'screen',
        description: 'Simulador de impacto',
        run: () => simulator.open(selectedRow?.person.id ?? null),
      },
    ],
    [simulator, selectedRow?.person.id],
  )

  useShortcuts(shortcuts)

  // O painel responde ao problema da pessoa selecionada: quando ela estoura, o período é o da
  // sobrecarga dela; quando não, é a semana que está sob o cursor.
  const candidateWeekIndexes = useMemo(() => {
    const overload = overloadAlerts.find((alert) => alert.person.id === selectedRow?.person.id)

    return overload?.weekIndexes ?? [selectedCell?.weekIndex ?? 0]
  }, [overloadAlerts, selectedRow?.person.id, selectedCell?.weekIndex])

  const candidatePeriod = useMemo(
    () =>
      spanWeeks(
        window,
        candidateWeekIndexes[0] ?? 0,
        candidateWeekIndexes[candidateWeekIndexes.length - 1] ?? 0,
      ),
    [window, candidateWeekIndexes],
  )

  const candidates = useMemo(() => {
    if (candidatePeriod === null || selectedRow === null) {
      return []
    }

    return findReleaseCandidates({
      matrix,
      allocations: snapshot.allocations,
      index,
      period: candidatePeriod,
      weekIndexes: candidateWeekIndexes,
      exceptPersonId: selectedRow.person.id,
    })
  }, [matrix, snapshot.allocations, index, candidatePeriod, candidateWeekIndexes, selectedRow])

  const selectedAllocations = useMemo(() => {
    if (selectedRow === null || selectedWeek === null) {
      return []
    }

    return listAllocationsDuring(
      selectedRow.person.id,
      selectedWeek.period,
      snapshot.allocations,
      index,
    )
  }, [selectedRow, selectedWeek, snapshot.allocations, index])

  const activeFilter = filterableProjects.find((project) => project.id === projectId) ?? null

  if (status === 'error') {
    return (
      <ScreenShell title="Capacidade" subhead={SUBHEAD_FALLBACK}>
        <Alert
          level="danger"
          title="Não foi possível montar a capacidade"
          action={
            <Button variant="danger" size="small" onClick={() => void load()}>
              Tentar de novo
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      </ScreenShell>
    )
  }

  if (status !== 'ready') {
    return (
      <ScreenShell title="Capacidade" subhead={SUBHEAD_FALLBACK}>
        <p className="text-support text-text3">Carregando a capacidade…</p>
      </ScreenShell>
    )
  }

  if (matrix.rows.length === 0 || selectedRow === null || selectedCell === null) {
    return (
      <ScreenShell title="Capacidade" subhead={SUBHEAD_FALLBACK}>
        <EmptyState
          size="large"
          title="Nenhuma pessoa cadastrada"
          description="A capacidade mede a semana de cada pessoa contra o que ela tem alocado. Cadastre alguém nas Configurações para a matriz ter o que medir."
        />
      </ScreenShell>
    )
  }

  return (
    <ScreenShell
      title="Capacidade"
      subhead={formatWindowSubhead(window, unit)}
      actions={
        <>
          <SegmentedControl
            options={UNIT_OPTIONS}
            value={unit}
            onChange={setUnit}
            label="Unidade da matriz"
            size="compact"
          />
          <Button pressed={activeFilter !== null} onClick={() => setIsFilterOpen(true)}>
            {activeFilter?.name ?? 'Filtrar projeto'}
          </Button>
          <Button
            variant="primary"
            keys={SIMULATOR_KEYS}
            onClick={() => simulator.open(selectedRow.person.id)}
          >
            Simulador de impacto
          </Button>
        </>
      }
      toolbar={<CapacityLegend />}
      contentClassName="grid flex-1 grid-cols-[1fr_364px] overflow-hidden"
    >
      <div className="grid content-start gap-3.5 overflow-auto px-5 pb-6 pt-3.5">
        {overloadAlerts.map((alert) => (
          <Alert
            key={alert.person.id}
            level="danger"
            title={`${alert.person.name} acima de 100% em ${pluralize(
              alert.weekIndexes.length,
              'semana',
              'semanas',
            )}`}
            action={
              <Button
                variant="danger"
                size="small"
                onClick={() => simulator.open(alert.person.id)}
              >
                Resolver
              </Button>
            }
          >
            {`${formatWeekSpan(alert.firstWeekNumber, alert.lastWeekNumber)} · ${formatPercentage(
              alert.peakPercentage,
            )} no pico.`}
          </Alert>
        ))}

        <CapacityMatrixTable
          matrix={matrix}
          window={window}
          unit={unit}
          selection={selection}
          navigation={navigation}
          onSelect={setSelection}
        />

        <CapacitySlackCards matrix={matrix} window={window} mostAvailable={mostAvailable} />
      </div>

      <CapacitySidePanel
        matrix={matrix}
        person={selectedRow.person}
        weekNumber={selectedWeek?.number ?? 0}
        cell={selectedCell}
        selectedAllocations={selectedAllocations}
        candidates={candidates}
        candidateSpan={[
          window.weeks[candidateWeekIndexes[0] ?? 0]?.number ?? 0,
          window.weeks[candidateWeekIndexes[candidateWeekIndexes.length - 1] ?? 0]?.number ?? 0,
        ]}
        inactiveAlerts={inactiveAlerts}
        firstFreeWeekNumber={
          matrix.firstFreeWeekIndex === null
            ? null
            : (window.weeks[matrix.firstFreeWeekIndex]?.number ?? null)
        }
        onSimulate={() =>
          simulator.open(selectedRow.person.id, selectedAllocations[0]?.allocation.id)
        }
      />

      {isFilterOpen && (
        <ProjectFilterModal
          projects={filterableProjects}
          selectedProjectId={projectId}
          onClose={() => setIsFilterOpen(false)}
          onSelect={(id) => {
            setProjectId(id)
            setIsFilterOpen(false)
          }}
        />
      )}

      {simulator.modal}
    </ScreenShell>
  )
}
