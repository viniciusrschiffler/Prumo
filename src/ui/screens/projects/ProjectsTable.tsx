import { Fragment } from 'react'
import type { ProjectRow } from '@/domain/projects/projectRow'
import type { EntityId } from '@/domain/schemas/primitives'
import { Table } from '@/ui/primitives/Table'
import { TableHeaderCell } from '@/ui/primitives/TableCell'
import type { GridNavigation } from '@/ui/primitives/useGridNavigation'
import { ProjectTableRow, TaskTableRow } from './ProjectTableRows'

type Column = {
  label: string
  numeric?: boolean
  width?: string
}

const COLUMNS: readonly Column[] = [
  { label: 'Projeto' },
  { label: 'Status', width: 'w-26' },
  { label: 'Fase', width: 'w-[150px]' },
  { label: 'Prio', numeric: true, width: 'w-12' },
  { label: 'Esf. ∑', numeric: true, width: 'w-[78px]' },
  { label: 'Progresso', width: 'w-33' },
  { label: 'Pessoas ∑', width: 'w-[110px]' },
  { label: 'Início ∑', numeric: true, width: 'w-[90px]' },
  { label: 'Fim ∑', numeric: true, width: 'w-[90px]' },
  { label: 'Desvio', numeric: true, width: 'w-15' },
]

type ProjectsTableProps = {
  rows: readonly ProjectRow[]
  byHours: boolean
  expandedIds: ReadonlySet<EntityId>
  selectedIds: ReadonlySet<EntityId>
  navigation: GridNavigation
  onToggleExpand: (id: EntityId) => void
  onSelect: (id: EntityId, extend: boolean) => void
  onOpen: (id: EntityId) => void
}

export function ProjectsTable({
  rows,
  byHours,
  expandedIds,
  selectedIds,
  navigation,
  onToggleExpand,
  onSelect,
  onOpen,
}: ProjectsTableProps) {
  return (
    <Table variant="flush" label="Projetos">
      <thead>
        <tr className="bg-sunken">
          {COLUMNS.map((column) => (
            <TableHeaderCell
              key={column.label}
              sticky
              numeric={column.numeric}
              className={column.width}
            >
              {column.label}
            </TableHeaderCell>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isExpanded = expandedIds.has(row.project.id)

          return (
            <Fragment key={row.project.id}>
              <ProjectTableRow
                row={row}
                byHours={byHours}
                expanded={isExpanded}
                selected={selectedIds.has(row.project.id)}
                rowProps={navigation.getRowProps(row.project.id)}
                onToggleExpand={() => onToggleExpand(row.project.id)}
                onSelect={(extend) => onSelect(row.project.id, extend)}
                onOpen={() => onOpen(row.project.id)}
              />
              {isExpanded &&
                row.tasks.map((taskRow) => <TaskTableRow key={taskRow.task.id} row={taskRow} />)}
            </Fragment>
          )
        })}
      </tbody>
    </Table>
  )
}
