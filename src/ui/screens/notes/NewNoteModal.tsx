import { useState } from 'react'
import { NOTES_ROOT, toNoteSlug } from '@/domain/notes/notePath'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'
import { Select } from '@/ui/primitives/Select'

type NewNoteModalProps = {
  folderPaths: readonly string[]
  defaultFolderPath: string
  onClose: () => void
  onSubmit: (draft: { title: string; folderPath: string }) => void
}

export function NewNoteModal({
  folderPaths,
  defaultFolderPath,
  onClose,
  onSubmit,
}: NewNoteModalProps) {
  const [title, setTitle] = useState('')
  const [folderPath, setFolderPath] = useState(defaultFolderPath)

  const trimmedTitle = title.trim()
  const isValid = trimmedTitle !== ''

  return (
    <Modal
      open
      title="Nova nota"
      tone="accent"
      submitLabel="Criar nota"
      submitDisabled={!isValid}
      onSubmit={() => onSubmit({ title: trimmedTitle, folderPath })}
      onClose={onClose}
    >
      <FieldGroup
        label="Título"
        hint="Vira o primeiro título do arquivo."
        htmlFor="new-note-title"
      >
        <Input
          id="new-note-title"
          autoFocus
          value={title}
          placeholder="Decisão: manter o provedor atual"
          onChange={(event) => setTitle(event.target.value)}
        />
      </FieldGroup>

      <FieldGroup label="Dentro de" htmlFor="new-note-folder">
        <Select
          id="new-note-folder"
          value={folderPath}
          onChange={(event) => setFolderPath(event.target.value)}
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
        {folderPath}/{isValid ? toNoteSlug(trimmedTitle) : 'nota'}.md
      </p>
    </Modal>
  )
}
