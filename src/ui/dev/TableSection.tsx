import { useState } from 'react'
import { AddButton } from '@/ui/primitives/AddButton'
import { IconButton } from '@/ui/primitives/IconButton'
import { KeyHint } from '@/ui/primitives/KeyHint'
import { PersonAllocationChip, UnassignedChip } from '@/ui/primitives/PersonAllocationChip'
import { PersonStack } from '@/ui/primitives/PersonStack'
import { PhaseBadge } from '@/ui/primitives/PhaseBadge'
import { ProgressBar } from '@/ui/primitives/ProgressBar'
import { ProjectStatusBadge, TaskStatusBadge } from '@/ui/primitives/StatusBadge'
import { Table, type TableDensity } from '@/ui/primitives/Table'
import { TableCell, TableHeaderCell } from '@/ui/primitives/TableCell'
import { TableFooterBar } from '@/ui/primitives/TableFooterBar'
import { TableHeaderRow, TableRow } from '@/ui/primitives/TableRow'
import { Tabs } from '@/ui/primitives/Tabs'
import { useRowSelection } from '@/ui/primitives/useRowSelection'
import { GallerySection } from './GallerySection'
import { SAMPLE_PHASES } from './samplePhases'

const PROJECT_ROW_IDS = ['gateway', 'parceiro']

const PEOPLE = [
  { id: 'ana', initials: 'AN', name: 'Ana Nogueira' },
  { id: 'rafael', initials: 'RB', name: 'Rafael Brito', overallocated: true },
]

const DENSITY_TABS = [
  { id: 'comfortable', label: 'Média' },
  { id: 'compact', label: 'Compacta' },
]

export function TableSection() {
  const [density, setDensity] = useState<TableDensity>('comfortable')
  const [expanded, setExpanded] = useState(true)
  const selection = useRowSelection(PROJECT_ROW_IDS)

  return (
    <GallerySection title="Tabela densa" note="⇧ clique seleciona intervalo">
      <Tabs
        items={DENSITY_TABS}
        activeId={density}
        onSelect={(id) => setDensity(id as TableDensity)}
        className="w-max"
      />

      <Table density={density}>
        <TableHeaderRow>
          <TableHeaderCell>Projeto</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Fase</TableHeaderCell>
          <TableHeaderCell numeric>Prio</TableHeaderCell>
          <TableHeaderCell numeric>Esforço ∑</TableHeaderCell>
          <TableHeaderCell>Progresso</TableHeaderCell>
          <TableHeaderCell>Pessoas ∑</TableHeaderCell>
          <TableHeaderCell numeric>Fim previsto ∑</TableHeaderCell>
          <TableHeaderCell numeric>Desvio</TableHeaderCell>
        </TableHeaderRow>
        <tbody>
          <TableRow
            selected={selection.isSelected('gateway')}
            onClick={(event) => selection.select('gateway', event.shiftKey)}
          >
            <TableCell>
              <div className="flex items-center gap-[7px]">
                <IconButton
                  label={expanded ? 'Recolher' : 'Expandir'}
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation()
                    setExpanded((current) => !current)
                  }}
                >
                  {expanded ? '▼' : '►'}
                </IconButton>
                <span className="font-medium">Migração do gateway</span>
                <span className="font-mono text-micro text-text3">4</span>
              </div>
            </TableCell>
            <TableCell>
              <ProjectStatusBadge status="active" />
            </TableCell>
            <TableCell>
              <PhaseBadge
                name={SAMPLE_PHASES[0].name}
                color={SAMPLE_PHASES[0].color}
                variant="inline"
              />
            </TableCell>
            <TableCell numeric>P1</TableCell>
            <TableCell numeric>
              <span className="text-text3">∑ </span>320h
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-[7px]">
                <ProgressBar value={0.33} className="h-[5px] w-[72px]" />
                <span className="font-mono text-label tabular-nums text-text2">33%</span>
              </div>
            </TableCell>
            <TableCell>
              <PersonStack people={PEOPLE} />
            </TableCell>
            <TableCell numeric>29/09/2026</TableCell>
            <TableCell numeric className="text-danger">
              +11d
            </TableCell>
          </TableRow>

          {expanded && (
            <TableRow child>
              <TableCell indented>
                <span className="inline-flex items-center gap-[7px]">
                  <span
                    className="h-3 w-[3px] rounded-[2px]"
                    style={{ background: SAMPLE_PHASES[0].color }}
                  />
                  Rewrite do roteador de pagamentos
                </span>
              </TableCell>
              <TableCell>
                <TaskStatusBadge status="in_progress" />
              </TableCell>
              <TableCell className="text-support text-text2">Desenvolvimento</TableCell>
              <TableCell />
              <TableCell numeric>120h</TableCell>
              <TableCell>
                <ProgressBar value={0.55} className="h-[5px] w-[72px]" />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <PersonAllocationChip initials="AN" name="Ana Nogueira" percentage={50} />
                  <PersonAllocationChip
                    initials="RB"
                    name="Rafael Brito"
                    percentage={100}
                    overallocated
                  />
                </div>
              </TableCell>
              <TableCell numeric className="text-text2">
                15/05/2026
              </TableCell>
              <TableCell numeric className="text-danger">
                +11d
              </TableCell>
            </TableRow>
          )}

          {expanded && (
            <TableRow child>
              <TableCell indented>
                <span className="inline-flex items-center gap-[7px]">
                  <span
                    className="h-3 w-[3px] rounded-[2px]"
                    style={{ background: SAMPLE_PHASES[3].color }}
                  />
                  Cutover em produção
                </span>
              </TableCell>
              <TableCell>
                <TaskStatusBadge status="todo" />
              </TableCell>
              <TableCell className="text-support text-text2">Produção</TableCell>
              <TableCell />
              <TableCell numeric>80h</TableCell>
              <TableCell>
                <ProgressBar className="h-[5px] w-[72px]" />
              </TableCell>
              <TableCell>
                <UnassignedChip />
              </TableCell>
              <TableCell numeric className="text-text2">
                29/09/2026
              </TableCell>
              <TableCell numeric className="text-text3">
                —
              </TableCell>
            </TableRow>
          )}

          {expanded && (
            <TableRow child>
              <TableCell indented colSpan={9} className="py-1.5">
                <AddButton keys="t">+ Nova tarefa</AddButton>
              </TableCell>
            </TableRow>
          )}

          <TableRow
            selected={selection.isSelected('parceiro')}
            onClick={(event) => selection.select('parceiro', event.shiftKey)}
          >
            <TableCell>
              <span className="pl-[23px] font-medium">Portal do parceiro</span>
            </TableCell>
            <TableCell>
              <ProjectStatusBadge status="blocked" />
            </TableCell>
            <TableCell>
              <PhaseBadge
                name={SAMPLE_PHASES[2].name}
                color={SAMPLE_PHASES[2].color}
                variant="inline"
              />
            </TableCell>
            <TableCell numeric>P0</TableCell>
            <TableCell numeric>
              <span className="text-text3">∑ </span>168h
            </TableCell>
            <TableCell>
              <ProgressBar value={0.17} hatched className="h-[5px] w-[72px]" />
            </TableCell>
            <TableCell className="text-support text-text3">0 · encerradas</TableCell>
            <TableCell numeric className="text-text3">
              —
            </TableCell>
            <TableCell numeric className="text-danger">
              +23d
            </TableCell>
          </TableRow>
        </tbody>
      </Table>

      <TableFooterBar
        totals="∑ 488h · 6 tarefas · 2 projetos"
        hint={
          <>
            selecione linhas com <KeyHint keys="shift" variant="muted" /> clique para bloquear em
            lote
          </>
        }
      >
        <span className="font-mono text-label tabular-nums text-text3">
          {selection.selectedIds.size} selecionadas
        </span>
      </TableFooterBar>
    </GallerySection>
  )
}
