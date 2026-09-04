import { ThemeProvider } from './theme/ThemeProvider'
import { ThemeSwitch } from './theme/ThemeSwitch'

// TODO: 2026-09-04 substituir por AppShell no bloco 8; esta tela existe só para conferir tokens, fontes e temas.

const SURFACES = [
  { token: '--bg', label: 'Fundo', className: 'bg-bg' },
  { token: '--sunken', label: 'Recuado', className: 'bg-sunken' },
  { token: '--panel', label: 'Painel', className: 'bg-panel' },
  { token: '--raised', label: 'Elevado', className: 'bg-raised' },
  { token: '--border', label: 'Borda', className: 'bg-border' },
  { token: '--border-strong', label: 'Borda forte', className: 'bg-border-strong' },
]

const BADGES = [
  { label: 'Ativo', className: 'bg-ok-soft text-ok' },
  { label: 'Pausado', className: 'bg-warn-soft text-warn' },
  { label: 'Bloqueado', className: 'bg-danger-soft text-danger' },
  { label: 'Concluído', className: 'bg-info-soft text-info' },
  { label: 'Descoberta', className: 'bg-neutral-soft text-text2' },
]

const SAMPLE_ROWS = [
  { date: '12/03/2026', hours: '128h', share: '100%', drift: '+11d', driftClassName: 'text-danger' },
  { date: '04/11/2026', hours: '8h', share: '50%', drift: '−2d', driftClassName: 'text-ok' },
  { date: '29/09/2026', hours: '1.024h', share: '75%', drift: '0d', driftClassName: 'text-text3' },
]

export function App() {
  return (
    <ThemeProvider>
      <main className="min-h-screen bg-bg p-7">
        <header className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="text-screen-title">Prumo</h1>
            <p className="font-mono text-micro text-text3">local · offline</p>
          </div>
          <ThemeSwitch />
        </header>

        <section className="mb-6">
          <h2 className="mb-3 text-label uppercase text-text2">Superfícies</h2>
          <div className="grid grid-cols-6 gap-2.5">
            {SURFACES.map((surface) => (
              <div key={surface.token} className="overflow-hidden rounded-card border border-border bg-panel">
                <div className={`h-14 border-b border-border ${surface.className}`} />
                <div className="px-2.5 py-2">
                  <div className="text-support font-medium">{surface.label}</div>
                  <div className="font-mono text-micro text-text3">{surface.token}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-label uppercase text-text2">Status e acento</h2>
          <div className="flex flex-wrap items-center gap-2">
            {BADGES.map((badge) => (
              <span key={badge.label} className={`rounded-badge px-2 py-0.5 text-label ${badge.className}`}>
                {badge.label}
              </span>
            ))}
            <button
              type="button"
              className="h-7 rounded-button bg-accent px-2.5 text-support font-medium text-accent-fg hover:bg-accent-hover"
            >
              Ação primária
            </button>
            <button
              type="button"
              className="h-7 rounded-button border border-border-strong bg-panel px-2.5 text-support font-medium hover:bg-sunken"
            >
              Secundário
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-label uppercase text-text2">Números tabulares</h2>
          <div className="w-max rounded-card border border-border bg-panel p-3 shadow-popover">
            <table className="font-mono text-support tabular-nums">
              <tbody>
                {SAMPLE_ROWS.map((row) => (
                  <tr key={row.date}>
                    <td className="pr-7">{row.date}</td>
                    <td className="pr-7 text-right">{row.hours}</td>
                    <td className="pr-7 text-right">{row.share}</td>
                    <td className={`text-right ${row.driftClassName}`}>{row.drift}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </ThemeProvider>
  )
}
