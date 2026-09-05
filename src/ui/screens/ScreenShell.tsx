import type { ReactNode } from 'react'
import { classNames } from '@/ui/primitives/classNames'

type ScreenShellProps = {
  title: string
  subhead?: string
  // A trilha deixa o bloco de título mais alto que os 28px dos botões ao lado, então a linha
  // passa a alinhar pelo topo; nas outras oito telas ela continua centralizada.
  breadcrumb?: ReactNode
  titleAfter?: ReactNode
  lead?: ReactNode
  actions?: ReactNode
  toolbar?: ReactNode
  // A tela de Projeto encosta a faixa de abas na borda do cabeçalho: é a própria aba que
  // desenha o sublinhado, e um respiro embaixo dela deslocaria o traço da linha.
  flushToolbar?: boolean
  footer?: ReactNode
  contentClassName?: string
  children?: ReactNode
}

export function ScreenShell({
  title,
  subhead,
  breadcrumb,
  titleAfter,
  lead,
  actions,
  toolbar,
  flushToolbar = false,
  footer,
  contentClassName,
  children,
}: ScreenShellProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden">
      <header
        className={classNames(
          'grid flex-none gap-2.5 border-b border-border bg-panel px-5 pt-3',
          flushToolbar ? 'pb-0' : 'pb-3',
        )}
      >
        <div
          className={classNames(
            'flex gap-3.5',
            breadcrumb === undefined ? 'items-center' : 'items-start',
          )}
        >
          <div className="grid gap-[3px]">
            {breadcrumb}
            <div className="flex items-center gap-2.5">
              <h1 className="text-entity-title">{title}</h1>
              {titleAfter}
            </div>
            {subhead !== undefined && (
              <span className="font-mono text-meta tabular-nums text-text3">{subhead}</span>
            )}
          </div>
          {lead}
          {actions !== undefined && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
        {toolbar}
      </header>
      <div className={classNames('flex-1 overflow-auto', contentClassName ?? 'px-5 py-4')}>
        {children}
      </div>
      {footer}
    </section>
  )
}
