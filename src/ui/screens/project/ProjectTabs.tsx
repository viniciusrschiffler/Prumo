import type { BaselineOption } from '@/domain/projects/baselineOptions'
import { formatIsoDate } from '@/domain/format/displayDate'
import type { EntityId } from '@/domain/schemas/primitives'
import { Select } from '@/ui/primitives/Select'
import { Tabs, type TabItem } from '@/ui/primitives/Tabs'
import type { ProjectTab } from './projectTabItems'



function describeBaseline(option: BaselineOption): string {
  const frozenOn = formatIsoDate(option.baseline.createdAt.slice(0, 10))

  return `v${option.baseline.version} · ${frozenOn} · ${option.baseline.reason}`
}

type ProjectTabsProps = {
  items: readonly TabItem[]
  activeTab: ProjectTab
  baselineOptions: readonly BaselineOption[]
  selectedBaselineId: EntityId | null
  onSelectTab: (tab: ProjectTab) => void
  onSelectBaseline: (baselineId: EntityId) => void
}

export function ProjectTabs({
  items,
  activeTab,
  baselineOptions,
  selectedBaselineId,
  onSelectTab,
  onSelectBaseline,
}: ProjectTabsProps) {
  const currentId = baselineOptions.find((option) => option.isCurrent)?.baseline.id ?? ''

  return (
    <div className="flex items-end gap-2">
      <Tabs
        items={items}
        activeId={activeTab}
        bordered={false}
        onSelect={(id) => onSelectTab(id as ProjectTab)}
        className="flex-1"
      />
      {baselineOptions.length > 0 && (
        <div className="flex items-center gap-2 pb-1.5">
          <label htmlFor="project-baseline" className="text-label font-normal tracking-normal text-text3">
            Baseline
          </label>
          <Select
            id="project-baseline"
            fieldSize="small"
            textSize="label"
            value={selectedBaselineId ?? currentId}
            onChange={(event) => onSelectBaseline(event.target.value)}
            className="font-mono"
          >
            {baselineOptions.map((option) => (
              <option key={option.baseline.id} value={option.baseline.id}>
                {describeBaseline(option)}
              </option>
            ))}
          </Select>
        </div>
      )}
    </div>
  )
}
