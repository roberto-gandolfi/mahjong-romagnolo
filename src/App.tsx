import { useState } from 'react'
import { Modal, Segmented, useHashRoute } from './components/ui'
import { Tile } from './components/Tile'
import { useSettings, type Theme } from './settings'
import { Home } from './pages/Home'
import { Learn } from './pages/Learn'
import { Lesson } from './pages/Lesson'
import { Guided } from './pages/Guided'
import { Catalog } from './pages/Catalog'
import { Rules } from './pages/Rules'
import { Scorer } from './pages/Scorer'
import { Play } from './pages/Play'
import { Strategy } from './pages/Strategy'
import { Exercises } from './pages/Exercises'

const NAV = [
  { href: '#home', id: '', label: 'Home', icon: '⌂' },
  { href: '#impara', id: 'impara', label: 'Impara', icon: '✦' },
  { href: '#punti', id: 'punti', label: 'Punti', icon: '∑' },
  { href: '#gioca', id: 'gioca', label: 'Gioca', icon: '▶' },
  { href: '#strategia', id: 'strategia', label: 'Strategia', icon: '◆' },
]

const SECTION_OF: Record<string, string> = {
  impara: 'impara',
  lezione: 'impara',
  guidata: 'impara',
  tessere: 'impara',
  prontuario: 'impara',
  punti: 'punti',
  gioca: 'gioca',
  strategia: 'strategia',
  esercizi: 'strategia',
}

export function App() {
  const route = useHashRoute()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const section = SECTION_OF[route[0] ?? ''] ?? ''
  const fullBleed = route[0] === 'gioca' || route[0] === 'guidata'

  let page
  switch (route[0]) {
    case 'impara':
      page = <Learn />
      break
    case 'lezione':
      page = <Lesson id={route[1]} />
      break
    case 'guidata':
      page = <Guided />
      break
    case 'tessere':
      page = <Catalog />
      break
    case 'prontuario':
      page = <Rules />
      break
    case 'punti':
      page = <Scorer />
      break
    case 'gioca':
      page = <Play />
      break
    case 'strategia':
      page = <Strategy />
      break
    case 'esercizi':
      page = <Exercises />
      break
    default:
      page = <Home />
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header style={{ top: 'env(safe-area-inset-top, 0px)' }} className="sticky z-40 border-b border-soft bg-[var(--bg)]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <a href="#home" className="flex items-center gap-2 font-extrabold tracking-tight">
            <Tile k={31} size="xs" label={false} />
            <span>
              Mahjong <span className="text-jade-600 dark:text-jade-300">Romagnolo</span>
            </span>
          </a>
          <nav className="ml-6 hidden gap-1 md:flex">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={n.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${section === n.id ? 'bg-jade-700 text-white' : 'text-muted hover:text-current'}`}
              >
                {n.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="ml-auto rounded-lg px-3 py-1.5 text-sm font-semibold text-muted hover:text-current cursor-pointer"
          >
            ⚙ Impostazioni
          </button>
        </div>
      </header>

      <main className={`mx-auto w-full flex-1 pb-24 md:pb-10 ${fullBleed ? 'max-w-6xl px-2 pt-3 sm:px-4' : 'max-w-4xl px-4 pt-6'}`}>{page}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-soft bg-[var(--surface)]/95 backdrop-blur md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <a key={n.id} href={n.href} className={`flex flex-col items-center py-2 text-[11px] font-semibold ${section === n.id ? 'text-jade-600 dark:text-jade-300' : 'text-muted'}`}>
              <span className="text-lg leading-none">{n.icon}</span>
              {n.label}
            </a>
          ))}
        </div>
      </nav>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useSettings()
  return (
    <Modal open={open} onClose={onClose} title="Impostazioni">
      <div className="space-y-5">
        <div>
          <div className="mb-2 font-semibold">Nomi sotto le tessere</div>
          <p className="mb-2 text-sm text-muted">Utile all'inizio per riconoscere le pedine.</p>
          <Segmented
            value={s.showLabels ? 'si' : 'no'}
            options={[
              { value: 'si', label: 'Mostra' },
              { value: 'no', label: 'Nascondi' },
            ]}
            onChange={(v) => s.set({ showLabels: v === 'si' })}
          />
          <div className="mt-3 flex gap-1">
            {[2, 11, 22, 27, 31, 34].map((k) => (
              <Tile key={k} k={k} size="sm" />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 font-semibold">Tema</div>
          <Segmented<Theme>
            value={s.theme}
            options={[
              { value: 'auto', label: 'Automatico' },
              { value: 'light', label: 'Chiaro' },
              { value: 'dark', label: 'Scuro' },
            ]}
            onChange={(v) => s.set({ theme: v })}
          />
        </div>
        <p className="text-xs text-muted">Regole: Regolamento ufficiale F.I.M.J. (4ª edizione). Tutti i dati restano su questo dispositivo.</p>
      </div>
    </Modal>
  )
}
