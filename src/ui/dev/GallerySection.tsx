import type { ReactNode } from 'react'

type GallerySectionProps = {
  title: string
  note?: string
  children: ReactNode
}

export function GallerySection({ title, note, children }: GallerySectionProps) {
  return (
    <section className="grid gap-3.5">
      <div className="flex items-center gap-2.5">
        <h2 className="text-label uppercase text-text2">{title}</h2>
        <div className="h-px flex-1 bg-border" />
        {note !== undefined && <span className="text-label font-normal text-text3">{note}</span>}
      </div>
      {children}
    </section>
  )
}

type GalleryRowProps = {
  label: string
  children: ReactNode
}

export function GalleryRow({ label, children }: GalleryRowProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3 border-b border-border py-2 last:border-b-0">
      <span className="font-mono text-micro text-text3">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}
