import { useState } from 'react'
import { NOTES_ROOT, toNoteSlug } from '@/domain/notes/notePath'
import type { NoteTreeNode } from '@/domain/notes/noteTree'
import { FieldGroup } from '@/ui/primitives/FieldGroup'
import { Input } from '@/ui/primitives/Input'
import { Modal } from '@/ui/primitives/Modal'
import { Select } from '@/ui/primitives/Select'

type NewNoteModalProps = {
  folders: readonly NoteTreeNode[]
  defaultFolderPath: string
  onClose: () => void
  onSubmit: (draft: { title: string; folderPath: string }) => void
}

export function NewNoteModal({
  folders,
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
      <FieldGroup label="Título" hint="Vira o primeiro título do arquivo.">
        <Input
          autoFocus
          value={title}
          placeholder="Decisão: manter o provedor atual"
          onChange={(event) => setTitle(event.target.value)}
        />
      </FieldGroup>

      <FieldGroup label="Pasta">
        <Select value={folderPath} onChange={(event) => setFolderPath(event.target.value)}>
          <option value={NOTES_ROOT}>{NOTES_ROOT}/</option>
          {folders.map((folder) => (
            <option key={folder.path} value={folder.path}>
              {folder.path}/
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
