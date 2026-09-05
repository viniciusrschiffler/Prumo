import { useState } from 'react'
import { useSettingsStore } from '@/app/stores/useSettingsStore'
import { useToastStore } from '@/app/stores/useToastStore'
import { toPublicMessage } from '@/domain/errors/PrumoError'
import { describeIntegrityReport } from '@/domain/integrity/integrityReport'
import { Alert } from '@/ui/primitives/Alert'
import { Button } from '@/ui/primitives/Button'
import { SectionCard } from '@/ui/primitives/SectionCard'
import { EraseDataModal } from './EraseDataModal'

const IMPORT_NOT_BUILT_YET = 'Importar de pasta ainda não existe nesta versão.'

export function DataIntegritySection() {
  const integrityReport = useSettingsStore((state) => state.integrityReport)
  const dataFolderPath = useSettingsStore((state) => state.dataFolderPath)
  const checkIntegrity = useSettingsStore((state) => state.checkIntegrity)
  const exportAll = useSettingsStore((state) => state.exportAll)
  const eraseAll = useSettingsStore((state) => state.eraseAll)
  const notify = useToastStore((state) => state.notify)

  const [isBusy, setBusy] = useState(false)
  const [isEraseOpen, setEraseOpen] = useState(false)

  async function run(action: () => Promise<string>) {
    setBusy(true)

    try {
      notify(await action())
    } catch (cause) {
      console.error('Não foi possível concluir a operação de dados.', cause)
      notify(toPublicMessage(cause), 'danger')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard
      title="Integridade dos dados"
      tone="danger"
      note={describeIntegrityReport(integrityReport, new Date())}
    >
      <div className="grid gap-2.5 p-3.5">
        <div className="flex items-center gap-2.5">
          <Button
            disabled={isBusy}
            onClick={() =>
              void run(async () => {
                const report = await checkIntegrity()

                return report.problems.length === 0
                  ? 'Verificação concluída sem erros.'
                  : `Verificação encontrou ${report.problems.length} problema(s).`
              })
            }
          >
            Verificar arquivos
          </Button>

          <Button
            disabled={isBusy || dataFolderPath === null}
            onClick={() =>
              void run(async () => {
                const { filePath, rowCount } = await exportAll()

                return `${rowCount} linhas exportadas para ${filePath}.`
              })
            }
          >
            Exportar tudo
          </Button>

          <Button onClick={() => notify(IMPORT_NOT_BUILT_YET, 'danger')}>Importar de pasta</Button>

          <Button variant="danger" className="ml-auto" onClick={() => setEraseOpen(true)}>
            Apagar todos os dados locais
          </Button>
        </div>

        {integrityReport !== null && integrityReport.problems.length > 0 && (
          <Alert level="danger" title="A verificação encontrou problemas">
            <ul className="grid gap-0.5">
              {integrityReport.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </Alert>
        )}
      </div>

      {isEraseOpen && (
        <EraseDataModal
          onClose={() => setEraseOpen(false)}
          onConfirm={() => {
            setEraseOpen(false)
            void run(async () => {
              await eraseAll()

              return 'Todos os dados locais foram apagados.'
            })
          }}
        />
      )}
    </SectionCard>
  )
}
