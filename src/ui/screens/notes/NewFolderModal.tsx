import { useState } from 'react'
import { NOTES_ROOT, toNoteSlug } from '@/domain/notes/notePath'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'
import { Select } from '@/ui/primitives/Select'

type NewFolderModalProps = {
  folderPaths: readonly string[]
  defaultParentPath: string
  onClose: () => void
  onSubmit: (parentPath: string, name: string) => void
}

export function NewFolderModal({
  folderPaths,
  defaultParentPath,
  onClose,
  onSubmit,
}: NewFolderModalProps) {
  const [name, setName] = useState('')
  const [parentPath, setParentPath] = useState(defaultParentPath)

  const trimmedName = name.trim()
  const isValid = trimmedName !== ''

  return (
    <Modal
      open
      title="Nova pasta"
      tone="accent"
      submitLabel="Criar pasta"
      submitDisabled={!isValid}
      onSubmit={() => onSubmit(parentPath, trimmedName)}
      onClose={onClose}
    >
      <FieldGroup label="Nome" htmlFor="new-folder-name">
        <Input
          id="new-folder-name"
          autoFocus
          value={name}
          placeholder="Decisões de arquitetura"
          onChange={(event) => setName(event.target.value)}
        />
      </FieldGroup>

      <FieldGroup label="Dentro de" htmlFor="new-folder-parent">
        <Select
          id="new-folder-parent"
          value={parentPath}
          onChange={(event) => setParentPath(event.target.value)}
        >
          <option value={NOTES_ROOT}>{NOTES_ROOT}/</option>
          {folderPaths.map((path) => (
            <option key={path} value={path}>
              {path}/
            </option>
          ))}
        </Select>
      </FieldGroup>

      <p className="font-mono text-micro text-text3">
        {parentPath}/{isValid ? toNoteSlug(trimmedName) : 'pasta'}
      </p>
    </Modal>
  )
}
