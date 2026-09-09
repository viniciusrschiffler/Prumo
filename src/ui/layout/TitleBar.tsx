import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect, useState, type ReactNode } from 'react'
import { classNames } from '@/ui/primitives/classNames'

const appWindow = getCurrentWindow()

function MinimizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" />
    </svg>
  )
}

function MaximizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <rect x="1.5" y="1.5" width="7" height="7" fill="none" stroke="currentColor" />
    </svg>
  )
}

function RestoreIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <rect x="3" y="1" width="6" height="6" fill="none" stroke="currentColor" />
      <path d="M1 3v6h6" fill="none" stroke="currentColor" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" />
      <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" />
    </svg>
  )
}

type TitleBarButtonProps = {
  label: string
  danger?: boolean
  onClick: () => void
  children: ReactNode
}

function TitleBarButton({ label, danger = false, onClick, children }: TitleBarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={classNames(
        'flex h-8 w-11 flex-none items-center justify-center text-text2 outline-none transition-colors',
        danger ? 'hover:bg-danger hover:text-accent-fg' : 'hover:bg-sunken hover:text-text',
      )}
    >
      {children}
    </button>
  )
}

// A barra de título do SO fica branca mesmo com o tema escuro nesta combinação Windows 11 +
// Tauri 2.11 (setTheme e "theme" no config não afetam, testado e revertido). A saída é
// desenhar a própria barra com decorations: false e pintá-la pelos tokens de tema.
export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    let unlisten: (() => void) | undefined

    void appWindow.isMaximized().then(setIsMaximized)
    void appWindow
      .onResized(() => {
        void appWindow.isMaximized().then(setIsMaximized)
      })
      .then((stop) => {
        unlisten = stop
      })

    return () => unlisten?.()
  }, [])

  return (
    <header className="flex h-8 flex-none select-none items-stretch border-b border-border bg-panel">
      <div data-tauri-drag-region className="flex-1" />
      <div className="flex flex-none">
        <TitleBarButton label="Minimizar" onClick={() => void appWindow.minimize()}>
          <MinimizeIcon />
        </TitleBarButton>
        <TitleBarButton
          label={isMaximized ? 'Restaurar' : 'Maximizar'}
          onClick={() => void appWindow.toggleMaximize()}
        >
          {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
        </TitleBarButton>
        <TitleBarButton label="Fechar" danger onClick={() => void appWindow.close()}>
          <CloseIcon />
        </TitleBarButton>
      </div>
    </header>
  )
}
