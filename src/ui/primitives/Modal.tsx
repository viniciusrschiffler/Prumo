import { useMemo, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Shortcut } from '@/ui/shortcuts/shortcutRegistry'
import { useShortcuts } from '@/ui/shortcuts/useShortcuts'
import type { BadgeTone } from './Badge'
import { Button, type ButtonVariant } from './Button'
import { classNames } from './classNames'
import { KeyHint } from './KeyHint'
import { useFocusTrap } from './useFocusTrap'

const DOT_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-text3',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
  accent: 'bg-accent',
}

type ModalProps = {
  open: boolean
  title: string
  tone?: BadgeTone
  hint?: string
  submitLabel?: string
  submitVariant?: ButtonVariant
  submitDisabled?: boolean
  onClose: () => void
  onSubmit?: () => void
  children: ReactNode
}

export function Modal({
  open,
  title,
  tone,
  hint,
  submitLabel,
  submitVariant = 'primary',
  submitDisabled = false,
  onClose,
  onSubmit,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useFocusTrap(panelRef, open)

  const shortcuts = useMemo<Shortcut[]>(() => {
    if (!open) {
      return []
    }

    const modalShortcuts: Shortcut[] = [
      {
        id: 'modal-close',
        keys: 'escape',
        scope: 'modal',
        description: 'Fechar',
        allowInTextField: true,
        run: onClose,
      },
    ]

    if (onSubmit !== undefined) {
      modalShortcuts.push({
        id: 'modal-submit',
        keys: 'mod+enter',
        scope: 'modal',
        description: submitLabel ?? 'Confirmar',
        allowInTextField: true,
        run: () => {
          if (!submitDisabled) {
            onSubmit()
          }
        },
      })
    }

    return modalShortcuts
  }, [open, onClose, onSubmit, submitLabel, submitDisabled])

  useShortcuts(shortcuts)

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-7">
      <div
        className="absolute inset-0 bg-[oklch(0.2_0.02_265_/_0.35)]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full max-w-[520px] overflow-hidden rounded-modal border border-border-strong bg-panel shadow-modal"
      >
        <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
          <div className="flex items-center gap-2">
            {tone !== undefined && (
              <span className={classNames('h-[7px] w-[7px] rounded-full', DOT_CLASSES[tone])} />
            )}
            <span className="text-[14px] font-semibold">{title}</span>
          </div>
          <KeyHint keys="escape" variant="inline" className="text-text3" />
        </div>

        <div className="grid gap-2.5 p-3.5">{children}</div>

        <div className="flex items-center justify-between gap-2.5 border-t border-border bg-sunken px-3.5 py-3">
          <span className="text-label font-normal text-text3">{hint}</span>
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancelar</Button>
            {submitLabel !== undefined && onSubmit !== undefined && (
              <Button
                variant={submitVariant}
                keys="mod+enter"
                disabled={submitDisabled}
                onClick={onSubmit}
              >
                {submitLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
