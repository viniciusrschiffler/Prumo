import { useEffect } from 'react'
import { bootstrapDatabase } from '@/app/bootstrapDatabase'
import { useDatabaseStore } from '@/app/stores/useDatabaseStore'
import { ThemeProvider } from './theme/ThemeProvider'
import { ThemeSwitch } from './theme/ThemeSwitch'

// TODO: 2026-09-04 substituir por AppShell no bloco 8; esta tela existe só para conferir a fundação.

export function App() {
  const status = useDatabaseStore((state) => state.status)
  const schemaVersion = useDatabaseStore((state) => state.schemaVersion)
  const errorMessage = useDatabaseStore((state) => state.errorMessage)

  useEffect(() => {
    void bootstrapDatabase(null)
  }, [])

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

        <section>
          <h2 className="mb-3 text-label uppercase text-text2">Banco de dados</h2>
          <div className="rounded-card border border-border bg-panel p-3">
            <div className="font-mono text-support">
              status: {status} · schema v{schemaVersion ?? '—'}
            </div>
            {errorMessage !== null && (
              <div className="mt-2 text-support text-danger">{errorMessage}</div>
            )}
          </div>
        </section>
      </main>
    </ThemeProvider>
  )
}
