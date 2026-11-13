import { useEffect, useMemo, useState } from 'react'
import { TableView, type SeatView, type MeldView } from '../components/TableView'
import { Badge, Button, Card, ConfirmButton, Modal, PageHeader, Segmented } from '../components/ui'
import { ScoreRecap, SettlementView } from '../components/ScoreRecap'
import { TileRow } from '../components/Tile'
import { usePersistent } from '../settings'
import {
  type GameState,
  type ClaimOption,
  type GMeld,
  newGame,
  draw,
  discard,
  resolveClaims,
  tsumo,
  declareConcealedKong,
  declareAddKong,
  canTsumo,
  concealedKongOptions,
  addKongOptions,
  richiDiscards,
  mustEndAfterLastTile,
  nextHand,
  isGameOver,
  windOf,
  meldKinds,
} from '../engine/game'
import { type Level, analyzeDiscards, explainBest, adviseClaim, botClaim, botTurn } from '../engine/ai'
import { tileName, rankOf, WIND_NAMES } from '../engine/tiles'

const BOTS = ['Gigi', 'Pina', 'Tonino']
const HUMAN = 0

interface PlayConfig {
  name: string
  level: Level
  hands: number
  hints: boolean
}

const toMeldView = (m: GMeld): MeldView => ({ type: m.type, kinds: m.tiles.map((t) => t.k), concealed: m.concealed })

export function Play() {
  const [cfg, setCfg] = usePersistent<PlayConfig>('mjr-play-cfg', { name: 'Tu', level: 'normale', hands: 4, hints: true })
  const [game, setGame] = usePersistent<GameState | null>('mjr-game', null)
  if (!game) return <Setup cfg={cfg} setCfg={setCfg} onStart={() => setGame(newGame([cfg.name || 'Tu', ...BOTS], cfg.hands))} />
  return <Game game={game} setGame={setGame} cfg={cfg} setCfg={setCfg} />
}

function Setup({ cfg, setCfg, onStart }: { cfg: PlayConfig; setCfg: (c: PlayConfig) => void; onStart: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-2">
      <PageHeader title="Gioca contro il computer" subtitle="Tre avversari virtuali, regole F.I.M.J. complete: chiamate, poker, fiori, tetto, raddoppi e massimi." />
      <Card className="space-y-5">
        <div>
          <div className="mb-1 text-sm font-semibold">Il tuo nome</div>
          <input className="w-full rounded-xl surface px-3 py-2" value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} />
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Avversari</div>
          <Segmented
            value={cfg.level}
            options={[
              { value: 'facile', label: 'Facili' },
              { value: 'normale', label: 'Normali' },
            ]}
            onChange={(v) => setCfg({ ...cfg, level: v })}
          />
          <p className="mt-1 text-xs text-muted">I facili ogni tanto sbagliano scarto e non chiamano sempre.</p>
        </div>
        <div>
          <div className="mb-1 text-sm font-semibold">Durata</div>
          <Segmented
            value={cfg.hands}
            options={[
              { value: 1, label: '1 manche' },
              { value: 4, label: '1 giro (4)' },
              { value: 16, label: 'Completa (16)' },
            ]}
            onChange={(v) => setCfg({ ...cfg, hands: v })}
          />
        </div>
        <label className="flex items-start gap-3 rounded-xl surface-2 p-3 cursor-pointer">
          <input type="checkbox" className="mt-1 h-5 w-5 accent-[#16765f]" checked={cfg.hints} onChange={(e) => setCfg({ ...cfg, hints: e.target.checked })} />
          <span>
            <span className="font-semibold">Consigliere sempre attivo</span>
            <span className="block text-sm text-muted">Ti suggerisce lo scarto migliore e se conviene chiamare, spiegando il perché. Puoi sempre chiederlo col pulsante 💡.</span>
          </span>
        </label>
        <Button size="lg" className="w-full" onClick={onStart}>
          Inizia la partita
        </Button>
      </Card>
    </div>
  )
}

function Game({ game, setGame, cfg, setCfg }: { game: GameState; setGame: (g: GameState | null) => void; cfg: PlayConfig; setCfg: (c: PlayConfig) => void }) {
  const s = game
  const [selected, setSelected] = useState<number | undefined>()
  const [richiMode, setRichiMode] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [resultOpen, setResultOpen] = useState(true)
  const me = s.players[HUMAN]
  const myTurn = s.phase === 'turn' && s.current === HUMAN
  const myClaims = s.phase === 'claim' ? s.claims[HUMAN] : undefined

  // ---- motore: mosse automatiche ----
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined
    const later = (fn: () => GameState, ms: number) => {
      t = setTimeout(() => setGame(fn()), ms)
    }
    if (s.phase === 'draw') later(() => draw(s), s.current === HUMAN ? 250 : 380)
    else if (s.phase === 'turn') {
      if (mustEndAfterLastTile(s)) later(() => discard(s, s.players[s.current].hand[0].id), 900)
      else if (s.current !== HUMAN) {
        later(() => {
          const a = botTurn(s, s.current, cfg.level)
          if (a.type === 'tsumo') return tsumo(s)
          if (a.type === 'ckong') return declareConcealedKong(s, a.kind)
          if (a.type === 'akong') return declareAddKong(s, a.kind)
          return discard(s, a.tileId)
        }, 650)
      } else if (me.richi && s.drawn && !canTsumo(s)) later(() => discard(s, s.drawn!.id), 700)
    } else if (s.phase === 'claim' && !s.claims[HUMAN]) {
      later(() => resolveClaims(s, botDecisions(s, cfg.level)), 450)
    }
    return () => clearTimeout(t)
  }, [s, cfg.level, me.richi, setGame])

  useEffect(() => {
    setSelected(undefined)
    if (s.phase === 'ended') setResultOpen(true)
  }, [s.phase, s.current])

  // ---- consigliere ----
  const analysis = useMemo(() => (myTurn && !me.richi ? analyzeDiscards(s, HUMAN) : null), [s, myTurn, me.richi])
  const advice = analysis && analysis.length ? explainBest(analysis) : null
  const claimAdvice = useMemo(() => (myClaims ? myClaims.map((o) => adviseClaim(s, HUMAN, o)) : null), [s, myClaims])
  const richiIds = myTurn ? richiDiscards(s) : []

  const doDiscard = (id: number) => {
    setGame(discard(s, id, richiMode))
    setRichiMode(false)
    setShowHint(false)
  }
  const onTile = (t: { id: number }) => {
    if (!myTurn || me.richi) return
    if (richiMode && !richiIds.includes(t.id)) return
    if (selected === t.id) doDiscard(t.id)
    else setSelected(t.id)
  }
  const claim = (o: ClaimOption | null) => {
    const dec = botDecisions(s, cfg.level)
    dec[HUMAN] = o
    setGame(resolveClaims(s, dec))
  }

  // ---- vista ----
  const seat = (p: number): SeatView => {
    const pl = s.players[p]
    const last = s.log[s.log.length - 1]
    const bubble =
      last && last.person === p && /chiama|MAH-JONG|poker coperto|RICHI/.test(last.text)
        ? /MAH-JONG/.test(last.text)
          ? 'Mah-Jong!'
          : /RICHI/.test(last.text)
            ? 'Richi!'
            : /TRIS/.test(last.text)
              ? 'Tris!'
              : /POKER|poker/.test(last.text)
                ? 'Poker!'
                : 'Scala!'
        : undefined
    return {
      name: pl.name,
      wind: windOf(s, p),
      handCount: pl.hand.length,
      melds: pl.melds.map(toMeldView),
      flowers: pl.flowers.map((f) => f.k),
      discards: pl.discards.map((d) => ({ k: d.tile.k, claimed: d.claimed })),
      isTurn: s.current === p && s.phase !== 'ended',
      richi: pl.richi,
      reveal: s.phase === 'ended' ? pl.hand.map((t) => t.k) : undefined,
      highlightDiscard: s.lastDiscard?.from === p && s.phase === 'claim',
      bubble,
    }
  }
  const bestId = analysis?.[0]?.tile.id
  const hl = cfg.hints || showHint ? (bestId !== undefined ? [bestId] : []) : []

  const actions = (
    <>
      {myTurn && canTsumo(s) && (
        <Button variant="gold" onClick={() => setGame(tsumo(s))}>
          🀄 Mah-Jong!
        </Button>
      )}
      {myTurn &&
        concealedKongOptions(s).map((k) => (
          <Button key={'ck' + k} variant="secondary" onClick={() => setGame(declareConcealedKong(s, k))}>
            Poker coperto di {tileName(k)}
          </Button>
        ))}
      {myTurn &&
        addKongOptions(s).map((k) => (
          <Button key={'ak' + k} variant="secondary" onClick={() => setGame(declareAddKong(s, k))}>
            Aggiungi il 4° {tileName(k)}
          </Button>
        ))}
      {myTurn && !me.richi && (
        <Button disabled={selected === undefined || (richiMode && !richiIds.includes(selected))} onClick={() => selected !== undefined && doDiscard(selected)}>
          {richiMode ? 'Scarta e dichiara Richi' : 'Scarta'}
        </Button>
      )}
      {myTurn && richiIds.length > 0 && !me.richi && (
        <Button variant={richiMode ? 'danger' : 'secondary'} onClick={() => setRichiMode(!richiMode)}>
          {richiMode ? 'Annulla Richi' : 'Richi…'}
        </Button>
      )}
      {myTurn && !me.richi && !cfg.hints && (
        <Button variant="ghost" onClick={() => setShowHint(!showHint)}>
          💡 Consiglio
        </Button>
      )}
      {!myTurn && !myClaims && s.phase !== 'ended' && <span className="py-2 text-sm text-muted">{me.richi ? 'Sei in Richi: le pedine pescate vengono scartate da sole.' : `Tocca a ${s.players[s.current].name}…`}</span>}
      {s.phase === 'ended' && (
        <Button onClick={() => setResultOpen(true)}>Vedi risultato</Button>
      )}
    </>
  )

  let coach = null
  if (myClaims && (s.lastDiscard || s.pendingKong)) {
    coach = (
      <div className="pop-in rounded-2xl border-2 border-gold-400 bg-amber-50 p-3 dark:bg-amber-950/30">
        <div className="mb-2 font-semibold">
          {s.pendingKong ? `${s.players[s.pendingKong.person].name} aggiunge ${tileName(s.pendingKong.tile.k)} al suo tris.` : `${s.players[s.lastDiscard!.from].name} ha scartato ${tileName(s.lastDiscard!.tile.k)}.`} Vuoi chiamarlo?
        </div>
        <div className="flex flex-wrap gap-2">
          {myClaims.map((o, i) => (
            <Button key={i} variant={o.type === 'mahjong' ? 'gold' : 'primary'} onClick={() => claim(o)}>
              {o.type === 'mahjong'
                ? '🀄 Mah-Jong!'
                : o.type === 'pung'
                  ? 'Tris'
                  : o.type === 'kong'
                    ? 'Poker'
                    : `Scala ${rankOf(o.chowStart!)}-${rankOf(o.chowStart!) + 1}-${rankOf(o.chowStart!) + 2}`}
            </Button>
          ))}
          <Button variant="secondary" onClick={() => claim(null)}>
            Passo
          </Button>
        </div>
        {cfg.hints && claimAdvice && (
          <div className="mt-2 space-y-1 text-sm">
            {claimAdvice.map((a, i) => (
              <div key={i}>
                💡 <b>{a.option.type === 'mahjong' ? 'Mah-Jong' : a.option.type === 'pung' ? 'Tris' : a.option.type === 'kong' ? 'Poker' : 'Scala'}</b>: {a.recommend ? 'conviene. ' : 'meglio di no. '}
                {a.reason}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  } else if (myTurn && advice && (cfg.hints || showHint)) {
    coach = (
      <details className="rounded-2xl border border-jade-300 bg-jade-50 p-3 text-sm dark:border-jade-700 dark:bg-jade-950/60" open={showHint}>
        <summary className="cursor-pointer font-semibold">
          💡 Consiglio: {advice.title} <span className="font-normal text-muted">(perché?)</span>
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {advice.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        {analysis && analysis.length > 1 && (
          <div className="mt-3 text-xs">
            <div className="mb-1 font-semibold text-muted">Le alternative a confronto</div>
            <div className="grid gap-1">
              {analysis.slice(0, 4).map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <TileRow kinds={[a.kind]} size="xs" />
                  <span className="flex-1">
                    {a.shanten === 0 ? 'a punto' : `mancano ${a.shanten} al punto`} · {a.ukeire} utili{a.danger ? ' · ⚠ rischiosa' : ''}
                  </span>
                  {i === 0 && <Badge>migliore</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}
      </details>
    )
  } else if (myTurn && richiMode) {
    coach = <div className="rounded-2xl bg-amber-50 p-3 text-sm dark:bg-amber-950/30">Scegli la pedina da scartare: sono evidenziate quelle che ti lasciano a punto su un'unica pedina. Dopo il Richi non potrai più cambiare la mano.</div>
  }

  const winds = [0, 1, 2, 3].map((p) => windOf(s, p))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <div className="text-sm">
          <b>Manche {s.handNo + 1}</b>
          <span className="text-muted">/{s.totalHands}</span>
        </div>
        <div className="flex gap-1 text-xs">
          {s.players.map((p, i) => (
            <span key={i} className="rounded-full surface-2 px-2 py-0.5 tabular-nums">
              {p.name}: <b className={p.score > 0 ? 'text-jade-600 dark:text-jade-300' : p.score < 0 ? 'text-cinnabar-500' : ''}>{p.score}</b>
            </span>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setShowLog(true)}>
            📜 Cronaca
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCfg({ ...cfg, hints: !cfg.hints })}>
            {cfg.hints ? '💡 on' : '💡 off'}
          </Button>
          <ConfirmButton label="Esci" confirmLabel="Tocca ancora per uscire" onConfirm={() => setGame(null)} />
        </div>
      </div>

      <TableView
        right={seat(1)}
        top={seat(2)}
        left={seat(3)}
        me={{ ...seat(0), hand: me.hand, drawnId: myTurn ? s.drawn?.id : undefined }}
        wallCount={s.wall.length}
        tettoCount={s.tetto.length}
        roundWind={s.roundWind}
        lastDiscard={s.phase === 'claim' && s.lastDiscard ? { k: s.lastDiscard.tile.k, from: s.players[s.lastDiscard.from].name } : undefined}
        selectedId={selected}
        highlightIds={richiMode ? richiIds : myTurn ? hl : undefined}
        highlightKinds={myClaims ? [(s.pendingKong?.tile ?? s.lastDiscard!.tile).k] : undefined}
        onTileClick={onTile}
        actions={actions}
        coach={coach}
      />
      {myTurn && !me.richi && <p className="text-center text-xs text-muted">Tocca una pedina per selezionarla, toccala di nuovo (o premi Scarta) per scartarla.</p>}

      <Modal open={showLog} onClose={() => setShowLog(false)} title="Cronaca della manche">
        <div className="space-y-1 text-sm">
          {[...s.log].reverse().map((l, i) => (
            <div key={i} className="border-b border-soft py-1">
              <span className="font-semibold">{WIND_NAMES[winds[l.person]]}</span> · {l.text}
            </div>
          ))}
        </div>
      </Modal>

      {s.phase === 'ended' && s.result && (
        <Modal open={resultOpen} onClose={() => setResultOpen(false)} title={s.result.type === 'mahjong' ? '🀄 Mah-Jong!' : s.result.type === 'abort' ? 'Manche a monte' : 'Manche patta'} wide>
          <p className="mb-3">{s.result.reason}</p>
          {s.result.winner !== undefined && (
            <div className="mb-3 rounded-2xl surface-2 p-3">
              <div className="mb-1 text-xs font-bold uppercase text-muted">La mano vincente</div>
              <div className="flex flex-wrap gap-2">
                {s.result.scores
                  .find((x) => x.person === s.result!.winner)!
                  .melds.map((m, i) => (
                    <span key={i} className={`rounded-md p-0.5 ${m.concealed ? 'bg-black/5 dark:bg-white/10' : 'bg-gold-400/30'}`}>
                      <TileRow kinds={meldKinds(m)} size="sm" label={false} />
                    </span>
                  ))}
              </div>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {[...s.result.scores]
              .sort((a, b) => (a.person === s.result!.winner ? -1 : b.person === s.result!.winner ? 1 : 0))
              .map((sc) => (
                <ScoreRecap key={sc.person} r={sc.result} name={s.players[sc.person].name} wind={windOf(s, sc.person)} winner={sc.person === s.result!.winner} compact={sc.person !== s.result!.winner} />
              ))}
          </div>
          {s.result.settlement && (
            <>
              <h3 className="mt-4 mb-2 font-bold">Pagamenti</h3>
              <SettlementView s={s.result.settlement} names={s.players.map((p) => p.name)} />
            </>
          )}
          <div className="mt-4 rounded-2xl surface-2 p-3">
            <div className="mb-1 text-xs font-bold uppercase text-muted">Classifica</div>
            {[...s.players]
              .map((p, i) => ({ p, i }))
              .sort((a, b) => b.p.score - a.p.score)
              .map(({ p }, r) => (
                <div key={p.name} className="flex justify-between py-0.5">
                  <span>
                    {r + 1}. {p.name}
                  </span>
                  <b className="tabular-nums">{p.score}</b>
                </div>
              ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {isGameOver(s) ? (
              <>
                <Button onClick={() => setGame(newGame([cfg.name || 'Tu', ...BOTS], cfg.hands))}>Nuova partita</Button>
                <Button variant="secondary" onClick={() => setGame(null)}>
                  Impostazioni
                </Button>
              </>
            ) : (
              <Button onClick={() => setGame(nextHand(s))}>Prossima manche →</Button>
            )}
            <Button variant="ghost" onClick={() => setResultOpen(false)}>
              Guarda il tavolo
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function botDecisions(s: GameState, level: Level) {
  const dec: Record<number, ClaimOption | null> = {}
  for (const p of Object.keys(s.claims).map(Number)) if (p !== HUMAN) dec[p] = botClaim(s, p, level)
  return dec
}
