import { useState } from 'react'
import { Tile } from '../components/Tile'
import { Callout, Card, PageHeader } from '../components/ui'
import { tileName, isHead, type Kind } from '../engine/tiles'

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

const FAMILIES: { title: string; kinds: Kind[]; text: string }[] = [
  {
    title: 'Caratteri',
    kinds: range(0, 8),
    text: 'Il numero è scritto in alto con un ideogramma cinese, sotto c’è il carattere rosso 萬. Impara i primi: 一 = 1, 二 = 2, 三 = 3.',
  },
  {
    title: 'Canne (o Bambù)',
    kinds: range(9, 17),
    text: 'Si contano le canne. Attenzione: l’1 di Canne è di solito rappresentato da un uccello.',
  },
  {
    title: 'Palle (o Circoli)',
    kinds: range(18, 26),
    text: 'Si contano i cerchi. Il 5 di Palle pescato sul tetto è il famoso "gallo d’oro".',
  },
  {
    title: 'Venti',
    kinds: range(27, 30),
    text: '東 Est, 南 Sud, 西 Ovest, 北 Nord. Spesso nell’angolo c’è la lettera E, S, W, N.',
  },
  {
    title: 'Draghi',
    kinds: range(31, 33),
    text: 'Rosso (中), Verde (發) e Bianco (a volte vuoto, con una cornice, una B o una W).',
  },
  {
    title: 'Fiori',
    kinds: range(34, 37),
    text: 'Numerati da 1 a 4. Non si giocano: si espongono subito e si pesca una pedina dal tetto. Valgono 4 punti ciascuno.',
  },
  {
    title: 'Stagioni',
    kinds: range(38, 41),
    text: 'Come i fiori: numerate da 1 a 4, si espongono e si sostituiscono. Il numero corrisponde al vento: 1 = Est, 2 = Sud, 3 = Ovest, 4 = Nord.',
  },
]

export function Catalog() {
  const [sel, setSel] = useState<Kind | null>(null)
  return (
    <div>
      <PageHeader back="#impara" title="Le tessere" subtitle="Il set completo ha 144 pedine. Tocca una pedina per vederne il nome." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-3xl font-extrabold text-jade-600">108</div>
          <div className="text-sm text-muted">pedine numerali: 3 semi × 9 numeri × 4 copie</div>
        </Card>
        <Card>
          <div className="text-3xl font-extrabold text-jade-600">28</div>
          <div className="text-sm text-muted">venti e draghi: 7 pedine × 4 copie</div>
        </Card>
        <Card>
          <div className="text-3xl font-extrabold text-jade-600">8</div>
          <div className="text-sm text-muted">fiori e stagioni: un solo esemplare ciascuno</div>
        </Card>
      </div>

      {sel !== null && (
        <div className="sticky top-16 z-10 mb-4">
          <div className="surface pop-in flex items-center gap-4 rounded-2xl p-3 shadow-md">
            <Tile k={sel} size="lg" label={false} />
            <div>
              <div className="text-lg font-bold">{tileName(sel)}</div>
              <div className="text-sm text-muted">{sel < 34 ? (isHead(sel) ? 'Pedina di testa: i suoi tris valgono il doppio.' : 'Pedina numerale semplice (dal 2 all’8).') : 'Pedina bonus: si espone e si sostituisce dal tetto.'}</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {FAMILIES.map((f) => (
          <Card key={f.title}>
            <h2 className="text-lg font-bold">{f.title}</h2>
            <p className="mb-3 text-sm text-muted">{f.text}</p>
            <div className="flex flex-wrap gap-1.5">
              {f.kinds.map((k) => (
                <Tile key={k} k={k} size="md" selected={sel === k} onClick={() => setSel(k)} />
              ))}
            </div>
          </Card>
        ))}
        <Callout tone="tip" title="Le pedine di testa">
          Sono 13: tutti gli <b>1</b> e i <b>9</b> dei tre semi, i <b>4 venti</b> e i <b>3 draghi</b>. Un tris di testa vale il doppio di un tris normale.
          <div className="mt-2 flex flex-wrap gap-1">
            {range(0, 33)
              .filter(isHead)
              .map((k) => (
                <Tile key={k} k={k} size="sm" />
              ))}
          </div>
        </Callout>
      </div>
    </div>
  )
}
