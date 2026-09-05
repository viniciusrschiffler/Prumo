import {
  ALL_STATUSES,
  type ProjectStatusFilter,
} from '@/domain/projects/projectFilters'
import { PROJECT_SORT_KEYS, type ProjectSortKey } from '@/domain/projects/projectSort'
import { PROJECT_STATUSES } from '@/domain/schemas/projectSchema'
import { PROJECT_SORT_LABELS, PROJECT_STATUS_LABELS } from '@/ui/labels/entityLabels'
import { FilterChip, FilterChipGroup } from '@/ui/primitives/FilterChip'
import { Select } from '@/ui/primitives/Select'

const CHIP_STATUSES = [ALL_STATUSES, ...PROJECT_STATUSES] as const

type ProjectsToolbarProps = {
  status: ProjectStatusFilter
  counts: Map<ProjectStatusFilter, number>
  sortKey: ProjectSortKey
  onStatusChange: (status: ProjectStatusFilter) => void
  onSortChange: (sortKey: ProjectSortKey) => void
}

function labelOf(status: ProjectStatusFilter): string {
  return status === ALL_STATUSES ? 'Todos' : PROJECT_STATUS_LABELS[status]
}

export function ProjectsToolbar({
  status,
  counts,
  sortKey,
  onStatusChange,
  onSortChange,
}: ProjectsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-label font-normal tracking-normal text-text3">Status</span>

      <FilterChipGroup label="Filtrar por status">
        {CHIP_STATUSES.map((candidate) => (
          <FilterChip
            key={candidate}
            label={labelOf(candidate)}
            count={counts.get(candidate) ?? 0}
            selected={candidate === status}
            onSelect={() => onStatusChange(candidate)}
          />
        ))}
      </FilterChipGroup>

      <label className="ml-3 flex items-center gap-1.5 text-label font-normal tracking-normal text-text3">
        Ordenar
        <Select
          value={sortKey}
          fieldSize="small"
          textSize="label"
          onChange={(event) => onSortChange(event.target.value as ProjectSortKey)}
        >
          {PROJECT_SORT_KEYS.map((key) => (
            <option key={key} value={key}>
              {PROJECT_SORT_LABELS[key]}
            </option>
          ))}
        </Select>
      </label>

      <span className="ml-auto text-label font-normal tracking-normal text-text3">
        colunas com <span className="font-mono text-text2">∑</span> são calculadas das tarefas
      </span>
    </div>
  )
}
