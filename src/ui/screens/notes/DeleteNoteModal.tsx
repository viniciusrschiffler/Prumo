import type { NoteDeletionPlan } from '@/domain/notes/noteDeletion'
import { Modal } from '@/ui/primitives/Modal'
import { pluralize } from './noteLabels'

type DeleteNoteModalProps = {
  plan: NoteDeletionPlan
  onClose: () => void
  onConfirm: () => void
}

function describeFolderContent(plan: NoteDeletionPlan): string {
  const files = pluralize(plan.filePaths.length, 'nota', 'notas')

  if (plan.folderCount === 0) {
    return files
  }

  return `${files} e ${pluralize(plan.folderCount, 'subpasta', 'subpastas')}`
}

export function DeleteNoteModal({ plan, onClose, onConfirm }: DeleteNoteModalProps) {
  const isFolder = plan.kind === 'folder'

  return (
    <Modal
      open
      title={isFolder ? 'Excluir pasta' : 'Excluir nota'}
      tone="danger"
      hint="O arquivo sai do disco. Não há como desfazer."
      submitLabel="Excluir"
      submitVariant="danger"
      onClose={onClose}
      onSubmit={onConfirm}
    >
      <p className="text-support text-text2">
        {isFolder ? (
          <>
            A pasta <span className="font-mono text-meta text-text">{plan.name}/</span> sai da
            pasta de dados com {describeFolderContent(plan)} dentro dela.
          </>
        ) : (
          <>
            O arquivo <span className="font-mono text-meta text-text">{plan.name}</span> sai da
            pasta de dados.
          </>
        )}
      </p>

      <p className="font-mono text-micro text-text3">{plan.path}</p>

      {plan.filePaths.length > 0 && (
        <p className="text-meta text-text3">
          O vínculo com projeto e com evento some junto, e o histórico do projeto continua como
          está.
        </p>
      )}
    </Modal>
  )
}
