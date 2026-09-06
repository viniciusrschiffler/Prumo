import { useState } from 'react'
import { toNoteSlug } from '@/domain/notes/notePath'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'

type NewFolderModalProps = {
  parentPath: string
  onClose: () => void
  onSubmit: (name: string) => void
}

export function NewFolderModal({ parentPath, onClose, onSubmit }: NewFolderModalProps) {
  const [name, setName] = useState('')

  const trimmedName = name.trim()
  const isValid = trimmedName !== ''

  return (
    <Modal
      open
      title="Nova pasta"
      tone="accent"
      note={`${parentPath}/`}
      submitLabel="Criar pasta"
      submitDisabled={!isValid}
      onSubmit={() => onSubmit(trimmedName)}
      onClose={onClose}
    >
      <FieldGroup label="Nome">
        <Input
          autoFocus
          value={name}
          placeholder="Projetos"
          onChange={(event) => setName(event.target.value)}
        />
      </FieldGroup>

      <p className="font-mono text-micro text-text3">
        {parentPath}/{isValid ? toNoteSlug(trimmedName) : 'pasta'}
      </p>
    </Modal>
  )
}
