type SidebarContextSectionProps = {
  label: string
}

export function SidebarContextSection({ label }: SidebarContextSectionProps) {
  return (
    <div className="mt-4 grid gap-1 overflow-hidden px-3.5">
      <div className="text-label uppercase text-text2">{label}</div>
      <p className="text-support text-text3">Nada aqui ainda.</p>
    </div>
  )
}
