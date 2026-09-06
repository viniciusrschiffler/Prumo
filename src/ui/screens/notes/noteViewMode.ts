export const NOTE_VIEW_MODES = ['editor', 'split', 'preview'] as const

export type NoteViewMode = (typeof NOTE_VIEW_MODES)[number]

export const NOTE_VIEW_LABELS: Record<NoteViewMode, string> = {
  editor: 'Editor',
  split: 'Dividido',
  preview: 'Preview',
}

export const NOTE_VIEW_OPTIONS = NOTE_VIEW_MODES.map((value) => ({
  value,
  label: NOTE_VIEW_LABELS[value],
}))

// O ⌘P alterna entre escrever e ler; o modo dividido é escolha do mouse, e voltar a ele pela
// tecla faria a mesma tecla ter três destinos.
export function toggleViewMode(mode: NoteViewMode): NoteViewMode {
  return mode === 'preview' ? 'editor' : 'preview'
}
