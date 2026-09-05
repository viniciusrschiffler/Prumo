import { useSettingsStore } from '@/app/stores/useSettingsStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import type { DataFolderEntry } from '@/domain/repositories/DataFolderRepository'
import { formatFileSize } from '@/domain/format/formatFileSize'
import { formatModifiedAt } from '@/domain/format/formatModifiedAt'
import { Alert } from '@/ui/primitives/Alert'
import { Button } from '@/ui/primitives/Button'
import { Input } from '@/ui/primitives/Input'
import { SectionCard } from '@/ui/primitives/SectionCard'

const BACKUP_NOT_BUILT_YET = 'Backup automático ainda não existe nesta versão.'

function describeEntry(entry: DataFolderEntry, now: Date): string {
  if (entry.kind === 'directory') {
    if (entry.childCount === null) {
      return 'não foi possível contar'
    }

    return entry.childCount === 1 ? '1 arquivo' : `${entry.childCount} arquivos`
  }

  const size = entry.sizeBytes === null ? '—' : formatFileSize(entry.sizeBytes)

  return `${size} · ${formatModifiedAt(entry.modifiedAt, now)}`
}

export function DataFolderSection() {
  const dataFolderPath = useSettingsStore((state) => state.dataFolderPath)
  const folderEntries = useSettingsStore((state) => state.folderEntries)
  const folderErrorMessage = useSettingsStore((state) => state.folderErrorMessage)
  const chooseFolder = useSettingsStore((state) => state.chooseFolder)
  const revealFolder = useSettingsStore((state) => state.revealFolder)
  const notify = useToastStore((state) => state.notify)

  const now = new Date()

  async function handleChooseFolder() {
    try {
      if (await chooseFolder()) {
        notify('Pasta de dados alterada. O Prumo passou a usar o banco desta pasta.')
      }
    } catch (cause) {
      console.error('Não foi possível trocar a pasta de dados.', cause)
      notify(toPublicMessage(cause), 'danger')
    }
  }

  async function handleReveal() {
    try {
      await revealFolder()
    } catch (cause) {
      console.error('Não foi possível revelar a pasta de dados.', cause)
      notify(toPublicMessage(cause), 'danger')
    }
  }

  return (
    <SectionCard
      id="pasta-de-dados"
      title="Pasta de dados"
      note="tudo fica em arquivos locais — nada sai daqui"
    >
      <div className="grid gap-[11px] p-3.5">
        <div className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
          <label className="grid gap-1">
            <span className="text-label font-normal tracking-normal text-text2">Caminho</span>
            <Input
              numeric
              readOnly
              value={dataFolderPath ?? 'pasta não definida'}
              title={dataFolderPath ?? undefined}
              aria-label="Caminho da pasta de dados"
            />
          </label>
          <Button onClick={() => void handleChooseFolder()}>Escolher pasta</Button>
          <Button onClick={() => void handleReveal()} disabled={dataFolderPath === null}>
            Revelar no Explorador
          </Button>
        </div>

        {folderErrorMessage !== null ? (
          <Alert
            level="danger"
            title="Pasta de dados inacessível"
            action={
              <Button variant="danger" size="small" onClick={() => void handleChooseFolder()}>
                Escolher pasta
              </Button>
            }
          >
            {folderErrorMessage}
          </Alert>
        ) : folderEntries.length === 0 ? (
          <div className="rounded-button border border-border bg-sunken px-2.5 py-2 text-support text-text3">
            Nenhum arquivo nesta pasta ainda.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-px overflow-hidden rounded-button border border-border bg-border">
            {folderEntries.map((entry) => (
              <div key={entry.name} className="grid gap-0.5 bg-sunken px-2.5 py-2">
                <span className="truncate font-mono text-meta text-text2">
                  {entry.kind === 'directory' ? `${entry.name}/` : entry.name}
                </span>
                <span className="font-mono text-micro text-text3">{describeEntry(entry, now)}</span>
              </div>
            ))}
          </div>
        )}

        <Alert
          level="warn"
          title="Backup automático desligado"
          action={
            <Button size="small" onClick={() => notify(BACKUP_NOT_BUILT_YET, 'danger')}>
              Ativar backup diário
            </Button>
          }
        >
          Sem cópia local os dados dependem só desta pasta.
        </Alert>
      </div>
    </SectionCard>
  )
}
