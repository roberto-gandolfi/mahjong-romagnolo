import { LESSONS } from '../data/lessons'
import { PageHeader, Badge } from '../components/ui'
import { Tile } from '../components/Tile'
import { usePersistent } from '../settings'

export function useLessonProgress() {
  return usePersistent<string[]>('mjr-lessons-done', [])
}

function Step({ n }: { n: number }) {
  return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-jade-700 text-sm font-bold text-white">{n}</span>
}

export function Learn() {
  const [done] = useLessonProgress()
  const core = LESSONS.filter((l) => l.id !== 'tavolo' && l.id !== 'fine')
  const table = LESSONS.filter((l) => l.id === 'tavolo' || l.id === 'fine')
  return (
    <div>
      <PageHeader title="Impara a giocare" subtitle="Un percorso per chi parte da zero. Ogni lezione dura pochi minuti e finisce con un piccolo quiz." />
      <div className="space-y-3">
        <a href="#tessere" className="surface flex items-center gap-4 rounded-2xl p-4 hover:shadow-md">
          <Step n={1} />
          <div className="flex-1">
            <div className="font-bold">Le tessere</div>
            <div className="text-sm text-muted">Semi, venti, draghi, fiori e le pedine "di testa".</div>
          </div>
          <div className="hidden gap-0.5 sm:flex">
            <Tile k={4} size="xs" label={false} />
            <Tile k={13} size="xs" label={false} />
            <Tile k={22} size="xs" label={false} />
          </div>
        </a>
        {core.map((l, i) => (
          <a key={l.id} href={`#lezione-${l.id}`} className="surface flex items-center gap-4 rounded-2xl p-4 hover:shadow-md">
            <Step n={i + 2} />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-bold">
                {l.title} {done.includes(l.id) && <Badge>✓ fatta</Badge>}
              </div>
              <div className="text-sm text-muted">{l.summary}</div>
            </div>
            <span className="text-xs text-muted">{l.minutes} min</span>
          </a>
        ))}
        <a href="#guidata" className="felt flex items-center gap-4 rounded-2xl p-4 text-white shadow-md hover:brightness-110">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-400 text-sm font-bold text-jade-950">★</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 font-bold">
              Partita guidata {done.includes('guidata') && <Badge tone="gold">✓ fatta</Badge>}
            </div>
            <div className="text-sm text-jade-100">Gioca una manche vera, passo per passo, con le istruzioni a ogni mossa.</div>
          </div>
          <span className="text-xs text-jade-100">10 min</span>
        </a>
        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-muted">Per giocare col set vero</h2>
        {table.map((l) => (
          <a key={l.id} href={`#lezione-${l.id}`} className="surface flex items-center gap-4 rounded-2xl p-4 hover:shadow-md">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full surface-2 text-sm">{l.id === 'tavolo' ? '🎲' : '🏁'}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 font-bold">
                {l.title} {done.includes(l.id) && <Badge>✓ fatta</Badge>}
              </div>
              <div className="text-sm text-muted">{l.summary}</div>
            </div>
          </a>
        ))}
        <a href="#prontuario" className="surface flex items-center gap-4 rounded-2xl p-4 hover:shadow-md">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full surface-2 text-sm">📋</span>
          <div className="flex-1">
            <div className="font-bold">Prontuario</div>
            <div className="text-sm text-muted">Tabelle di punti, raddoppi e massimi da tenere aperte al tavolo.</div>
          </div>
        </a>
      </div>
    </div>
  )
}
