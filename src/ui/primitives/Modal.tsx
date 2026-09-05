import { useMemo, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Shortcut } from '@/ui/shortcuts/shortcutRegistry'
import { useShortcuts } from '@/ui/shortcuts/useShortcuts'
import type { BadgeTone } from './Badge'
import { Button, type ButtonVariant } from './Button'
import { classNames } from './classNames'
import { IconButton } from './IconButton'
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

export type ModalSize = 'default' | 'wide'

const OVERLAY_CLASSES: Record<ModalSize, string> = {
  default: 'items-center justify-center p-7',
  wide: 'items-start justify-center px-6 py-12',
}

const PANEL_CLASSES: Record<ModalSize, string> = {
  default: 'max-w-[520px]',
  wide: 'max-h-full max-w-[680px]',
}

const HEADER_CLASSES: Record<ModalSize, string> = {
  default: 'px-3.5 py-3',
  wide: 'bg-sunken px-4 py-[13px]',
}

const TITLE_CLASSES: Record<ModalSize, string> = {
  default: 'text-[14px] font-semibold',
  wide: 'text-body font-semibold',
}

const BODY_CLASSES: Record<ModalSize, string> = {
  default: 'gap-2.5 p-3.5',
  wide: 'gap-3.5 overflow-auto p-4',
}

const FOOTER_CLASSES: Record<ModalSize, string> = {
  default: 'px-3.5 py-3',
  wide: 'px-4 py-3',
}

type ModalProps = {
  open: boolean
  title: string
  tone?: BadgeTone
  note?: string
  size?: ModalSize
  hint?: ReactNode
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
  note,
  size = 'default',
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
    <div className={classNames('fixed inset-0 z-50 flex', OVERLAY_CLASSES[size])}>
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
        className={classNames(
          'relative flex w-full flex-col overflow-hidden rounded-modal border border-border-strong bg-panel shadow-modal',
          PANEL_CLASSES[size],
        )}
      >
        <div
          className={classNames(
            'flex flex-none items-center gap-2.5 border-b border-border',
            HEADER_CLASSES[size],
          )}
        >
          {tone !== undefined && (
            <span className={classNames('h-[7px] w-[7px] rounded-full', DOT_CLASSES[tone])} />
          )}
          <span className={TITLE_CLASSES[size]}>{title}</span>
          {note !== undefined && <span className="font-mono text-micro text-text3">{note}</span>}
          <span className="ml-auto flex items-center gap-2">
            <KeyHint keys="escape" variant="inline" className="text-text3" />
            {size === 'wide' && (
              <IconButton
                label="Fechar"
                onClick={onClose}
                className="h-[22px] w-[22px] rounded-[5px] border-border text-support"
              >
                ✕
              </IconButton>
            )}
          </span>
        </div>

        <div className={classNames('grid content-start', BODY_CLASSES[size])}>{children}</div>

        <div
          className={classNames(
            'flex flex-none items-center justify-between gap-2.5 border-t border-border bg-sunken',
            FOOTER_CLASSES[size],
          )}
        >
          <span className="text-label font-normal tracking-normal text-text3">{hint}</span>
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
