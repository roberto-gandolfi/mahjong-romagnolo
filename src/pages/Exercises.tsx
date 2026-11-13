import { useMemo, useState } from 'react'
import { TableView, type SeatView } from '../components/TableView'
import { Badge, Button } from '../components/ui'
import { TileRow } from '../components/Tile'
import { usePersistent } from '../settings'
import { makeExercise } from '../engine/auto'
import { analyzeDiscards, explainBest, shantenText, usefulText, type DiscardAnalysis } from '../engine/ai'
import { type GameState, windOf } from '../engine/game'
import { tileName, type Tile } from '../engine/tiles'

type Verdict = 'ottimo' | 'buono' | 'migliorabile'

function judge(list: DiscardAnalysis[], chosen: DiscardAnalysis): Verdict {
  const best = list[0]
  if (chosen.kind === best.kind || best.score - chosen.score <= 2) return 'ottimo'
  if (chosen.shanten === best.shanten && chosen.ukeire >= best.ukeire * 0.75 && chosen.danger <= best.danger) return 'buono'
  return 'migliorabile'
}

const VERDICT_UI: Record<Verdict, { title: string; cls: string; emoji: string }> = {
  ottimo: { title: 'Ottima scelta!', cls: 'border-jade-500 bg-jade-50 dark:bg-jade-950/60', emoji: '🎯' },
  buono: { title: 'Buona scelta', cls: 'border-sky-400 bg-sky-50 dark:bg-sky-950/40', emoji: '👍' },
  migliorabile: { title: 'Si poteva fare meglio', cls: 'border-amber-400 bg-amber-50 dark:bg-amber-950/40', emoji: '🤔' },
}

export function Exercises() {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6))
  const [stats, setStats] = usePersistent('mjr-exercise-stats', { done: 0, ottimo: 0, buono: 0 })
  const [chosen, setChosen] = useState<Tile | null>(null)
  const s: GameState = useMemo(() => makeExercise(seed), [seed])
  const list = useMemo(() => analyzeDiscards(s, 0), [s])
  const me = s.players[0]

  const pick = (t: Tile) => {
    if (chosen) return
    setChosen(t)
    const a = list.find((x) => x.kind === t.k)!
    const v = judge(list, a)
    setStats({ done: stats.done + 1, ottimo: stats.ottimo + (v === 'ottimo' ? 1 : 0), buono: stats.buono + (v === 'buono' ? 1 : 0) })
  }
  const next = () => {
    setChosen(null)
    setSeed(Math.floor(Math.random() * 1e6))
  }

  const seat = (p: number): SeatView => {
    const pl = s.players[p]
    return {
      name: pl.name,
      wind: windOf(s, p),
      handCount: pl.hand.length,
      melds: pl.melds.map((m) => ({ type: m.type, kinds: m.tiles.map((t) => t.k), concealed: m.concealed })),
      flowers: pl.flowers.map((f) => f.k),
      discards: pl.discards.map((d) => ({ k: d.tile.k, claimed: d.claimed })),
      isTurn: false,
      richi: pl.richi,
    }
  }

  const chosenA = chosen ? list.find((x) => x.kind === chosen.k)! : null
  const verdict = chosenA ? judge(list, chosenA) : null
  const exp = explainBest(list)

  const coach = !chosen ? (
    <div className="rounded-2xl border-2 border-gold-400 bg-amber-50 p-4 dark:bg-amber-950/30">
      <h2 className="text-lg font-bold">Cosa scarteresti?</h2>
      <p className="text-sm">
        Guarda la tua mano, cosa hanno esposto e scartato gli avversari, e quante pedine restano nel muro. Poi tocca la pedina da scartare.
      </p>
    </div>
  ) : (
    <div className={`pop-in rounded-2xl border-2 p-4 ${VERDICT_UI[verdict!].cls}`}>
      <h2 className="text-lg font-bold">
        {VERDICT_UI[verdict!].emoji} {VERDICT_UI[verdict!].title}
      </h2>
      <p className="mt-1 text-sm">
        Hai scartato <b>{tileName(chosen.k)}</b>: {shantenText(chosenA!.shanten)}
        {chosenA!.ukeire ? `, con ${usefulText(chosenA!)}` : ''}.
        {chosenA!.cons.length > 0 && <> Da sapere: {chosenA!.cons.join('; ')}.</>}
      </p>
      {verdict !== 'ottimo' && (
        <div className="mt-3 rounded-xl bg-white/60 p-3 text-sm dark:bg-black/20">
          <div className="mb-1 font-semibold">Il consiglio: {exp.title}</div>
          <ul className="list-disc space-y-1 pl-5">
            {exp.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-3 text-xs">
        <div className="mb-1 font-semibold text-muted">Tutte le scelte, dalla migliore</div>
        <div className="grid gap-1 sm:grid-cols-2">
          {list.slice(0, 6).map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <TileRow kinds={[a.kind]} size="xs" />
              <span className="flex-1">
                {a.shanten === 0 ? 'a punto' : `mancano ${a.shanten}`} · {a.ukeire} utili{a.danger ? ' · ⚠ rischiosa' : ''}
              </span>
              {i === 0 && <Badge>migliore</Badge>}
              {a.kind === chosen.k && <Badge tone="gold">tua</Badge>}
            </div>
          ))}
        </div>
      </div>
      <Button className="mt-3" onClick={next}>
        Prossimo esercizio →
      </Button>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <a href="#strategia" className="text-sm font-medium text-jade-600 dark:text-jade-300">
          ← Strategia
        </a>
        <h1 className="text-lg font-extrabold">Esercizi: cosa scarteresti?</h1>
        <span className="ml-auto text-xs text-muted">
          Fatti {stats.done} · 🎯 {stats.ottimo} · 👍 {stats.buono}
        </span>
      </div>
      <TableView
        right={seat(1)}
        top={seat(2)}
        left={seat(3)}
        me={{ ...seat(0), isTurn: true, hand: me.hand, drawnId: s.drawn?.id }}
        wallCount={s.wall.length}
        tettoCount={s.tetto.length}
        roundWind={s.roundWind}
        selectedId={chosen?.id}
        highlightIds={chosen ? [list[0].tile.id] : undefined}
        onTileClick={pick}
        coach={coach}
      />
    </div>
  )
}
