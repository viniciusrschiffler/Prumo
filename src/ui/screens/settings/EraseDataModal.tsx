import { useState } from 'react'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'

const CONFIRMATION_WORD = 'APAGAR'

type EraseDataModalProps = {
  onClose: () => void
  onConfirm: () => void
}

export function EraseDataModal({ onClose, onConfirm }: EraseDataModalProps) {
  const [typed, setTyped] = useState('')

  return (
    <Modal
      open
      title="Apagar todos os dados locais"
      tone="danger"
      hint="Não há como desfazer. Exporte antes, se quiser guardar."
      submitLabel="Apagar tudo"
      submitVariant="danger"
      submitDisabled={typed.trim() !== CONFIRMATION_WORD}
      onClose={onClose}
      onSubmit={onConfirm}
    >
      <p className="text-support text-text2">
        Projetos, tarefas, pessoas, alocações, eventos, baselines, todos, notas e preferências
        somem do banco. As fases padrão voltam. Os arquivos .md da pasta de notas continuam no
        disco, e a pasta de exportação também.
      </p>

      <FieldGroup label={`Digite ${CONFIRMATION_WORD} para confirmar`} htmlFor="erase-confirm">
        <Input
          id="erase-confirm"
          value={typed}
          autoComplete="off"
          onChange={(event) => setTyped(event.target.value)}
        />
      </FieldGroup>
    </Modal>
  )
}
