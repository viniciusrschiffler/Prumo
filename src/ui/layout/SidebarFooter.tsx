import { NavLink } from 'react-router'
import { useDatabaseStore, type DatabaseStatus } from '@/app/stores/useDatabaseStore'
import { SCREEN_META } from './screenMeta'

const STATUS_LABEL: Record<DatabaseStatus, string> = {
  idle: 'aguardando',
  opening: 'abrindo o banco',
  ready: 'gravando nesta pasta',
  error: 'sem gravar',
}

const STATUS_COLOR: Record<DatabaseStatus, string> = {
  idle: 'bg-text3',
  opening: 'bg-warn',
  ready: 'bg-ok',
  error: 'bg-danger',
}

type SidebarFooterProps = {
  dataFolderPath: string | null
}

export function SidebarFooter({ dataFolderPath }: SidebarFooterProps) {
  const status = useDatabaseStore((state) => state.status)

  return (
    <div className="mt-auto grid gap-1 border-t border-border px-3.5 py-3">
      <NavLink
        to={SCREEN_META.settings.path}
        className={({ isActive }) =>
          `flex h-[26px] items-center text-support ${isActive ? 'text-text' : 'text-text2 hover:text-text'}`
        }
      >
        {SCREEN_META.settings.title}
      </NavLink>
      <div
        className="truncate font-mono text-micro text-text3"
        title={dataFolderPath ?? undefined}
      >
        {dataFolderPath ?? 'pasta não definida'}
      </div>
      <div className="flex items-center gap-1.5 font-mono text-micro text-text3">
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLOR[status]}`} />
        {STATUS_LABEL[status]}
      </div>
    </div>
  )
}
