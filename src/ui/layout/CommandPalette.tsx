import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useCommandPaletteStore } from '@/app/stores/useCommandPaletteStore'
import { filterCommands, type CommandEntry } from '@/domain/commands/filterCommands'
import { classNames } from '@/ui/primitives/classNames'
import { FIELD_FOCUS_RING } from '@/ui/primitives/focusRing'
import { KeyHint } from '@/ui/primitives/KeyHint'
import { Modal } from '@/ui/primitives/Modal'
import { shortcutRegistry, type Shortcut } from '@/ui/shortcuts/shortcutRegistry'

export const COMMAND_PALETTE_SHORTCUT_ID = 'open-command-palette'

const PLACEHOLDER = 'Buscar comando'
const EMPTY_MESSAGE = 'Nenhum comando com esse nome.'

// O que a paleta lista é o próprio registro de atalhos: os globais da navegação mais os da
// tela em foco. Não existe segunda lista de comandos para sair de sincronia com a primeira.
function toEntries(shortcuts: readonly Shortcut[]): CommandEntry[] {
  return shortcuts
    .filter(
      (shortcut) =>
        shortcut.scope !== 'modal' && shortcut.id !== COMMAND_PALETTE_SHORTCUT_ID,
    )
    .map((shortcut) => ({ id: shortcut.id, label: shortcut.description, keys: shortcut.keys }))
}

export function CommandPalette() {
  const close = useCommandPaletteStore((state) => state.close)
  const inputRef = useRef<HTMLInputElement>(null)

  // A leitura acontece na renderização, antes de o Modal registrar os atalhos dele: a paleta
  // lista o que existia quando ela abriu, e não a si mesma.
  const [snapshot] = useState(() => shortcutRegistry.list())
  const entries = useMemo(() => toEntries(snapshot), [snapshot])
  const runById = useMemo(
    () => new Map(snapshot.map((shortcut) => [shortcut.id, shortcut.run])),
    [snapshot],
  )

  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const visible = useMemo(() => filterCommands(entries, query), [entries, query])

  function run(entry: CommandEntry | undefined) {
    if (entry === undefined) {
      return
    }

    const command = runById.get(entry.id)

    close()
    command?.()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((current) =>
        Math.max(0, Math.min(visible.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))),
      )

      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      run(visible[highlighted])
    }
  }

  return (
    <Modal
      open
      size="wide"
      title="Comandos"
      note={`${visible.length}`}
      hint="Setas para navegar, ↵ para executar."
      onClose={close}
    >
      <input
        ref={inputRef}
        name="command-search"
        value={query}
        aria-label={PLACEHOLDER}
        placeholder={PLACEHOLDER}
        onChange={(event) => {
          setQuery(event.target.value)
          setHighlighted(0)
        }}
        onKeyDown={handleKeyDown}
        className={classNames(
          'h-8 w-full min-w-0 rounded-button border border-border-strong bg-bg px-[9px] text-body text-text placeholder:text-text3',
          FIELD_FOCUS_RING,
        )}
      />

      {visible.length === 0 ? (
        <p className="px-1 py-2 text-support text-text3">{EMPTY_MESSAGE}</p>
      ) : (
        <div role="listbox" aria-label="Comandos" className="grid gap-px">
          {visible.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              role="option"
              aria-selected={index === highlighted}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => run(entry)}
              className={classNames(
                'flex h-8 items-center gap-2 rounded-button px-2 text-left',
                index === highlighted ? 'bg-neutral-soft text-text' : 'text-text2',
              )}
            >
              <span className="truncate text-body">{entry.label}</span>
              <KeyHint keys={entry.keys} variant="muted" className="ml-auto" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
