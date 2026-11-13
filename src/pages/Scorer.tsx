import { useMemo, useState } from 'react'
import { Badge, Button, Callout, Card, ConfirmButton, Modal, PageHeader, Segmented } from '../components/ui'
import { Tile, TileRow } from '../components/Tile'
import { TilePicker } from '../components/TilePicker'
import { ScoreRecap, SettlementView } from '../components/ScoreRecap'
import { usePersistent } from '../settings'
import { type SMeld, type MeldType, meldKinds } from '../engine/hand'
import { type MassimoId, type WinContext, MASSIMI, scoreHand, settle, describeMeld, meldPoints } from '../engine/scoring'
import { type Kind, isSuit, rankOf, WIND_NAMES } from '../engine/tiles'

interface PHand {
  melds: SMeld[]
  flowers: Kind[]
  massimo?: MassimoId
  win: WinContext
}
interface LedgerRow {
  net: number[]
  note: string
}
interface ScorerState {
  names: string[]
  dealer: number
  roundWind: number
  startDealer: number
  winner: number | null
  hands: PHand[]
  ledger: LedgerRow[]
}

const emptyHand = (): PHand => ({ melds: [], flowers: [], win: { selfDrawn: false } })
const INITIAL: ScorerState = {
  names: ['Giocatore 1', 'Giocatore 2', 'Giocatore 3', 'Giocatore 4'],
  dealer: 0,
  roundWind: 0,
  startDealer: 0,
  winner: null,
  hands: [emptyHand(), emptyHand(), emptyHand(), emptyHand()],
  ledger: [],
}

const WIN_FLAGS: { key: keyof WinContext; label: string; help: string }[] = [
  { key: 'selfDrawn', label: 'Pedina finale pescata da me', help: 'Serve per il "tutto pescato". Se l’hai chiamata, lascia spento e segna la combinazione finale come scoperta.' },
  { key: 'fromTetto', label: 'Pescato sul tetto', help: 'Chiusura con la pedina pescata dal tetto dopo un fiore o un poker.' },
  { key: 'goldenRooster', label: '5 di Palle sul tetto', help: 'Il "gallo d’oro": 2 raddoppi (include il precedente).' },
  { key: 'robbedKong', label: 'Pezzo rubato', help: 'Hai chiuso con la pedina che un avversario aggiungeva al suo tris per fare poker.' },
  { key: 'lastPiece', label: 'Ultimo pezzo', help: 'Hai chiuso con l’ultimo esemplare disponibile (dichiarato).' },
  { key: 'lastDiscard', label: 'Ultimo scarto', help: 'Con l’ultima pedina che si poteva scartare.' },
  { key: 'lastTile', label: 'Ultima pedina del muro', help: 'Con l’ultima pedina disponibile per la pesca.' },
  { key: 'bottled', label: 'Imbottigliato', help: 'Avevi 4 combinazioni esposte e hai fatto la coppia con l’unica pedina coperta.' },
  { key: 'within15', label: 'Entro la quindicesima', help: 'Chiusura entro il 15° scarto (comprese le chiamate).' },
  { key: 'richi', label: 'Richi dichiarato', help: 'Avevi dichiarato Richi.' },
]

export function Scorer() {
  const [st, setSt] = usePersistent<ScorerState>('mjr-scorer', INITIAL)
  const [tab, setTab] = useState(0)
  const [adding, setAdding] = useState<MeldType | null>(null)
  const [concealedNew, setConcealedNew] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const wind = (i: number) => (i - st.dealer + 4) % 4

  const results = useMemo(
    () =>
      st.hands.map((h, i) =>
        scoreHand({
          melds: h.melds,
          flowers: h.flowers,
          seatWind: wind(i),
          roundWind: st.roundWind,
          winner: st.winner === i,
          win: h.win,
          massimo: st.winner === i ? h.massimo : undefined,
        }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [st],
  )
  const settlement = useMemo(
    () =>
      settle(
        results.map((r, i) => ({
          name: st.names[i],
          wind: wind(i),
          winner: st.winner === i,
          value: r.value,
          massimo: r.massimo?.value,
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results, st.winner, st.dealer],
  )

  const upd = (fn: (s: ScorerState) => void) =>
    setSt((prev) => {
      const s = structuredClone(prev)
      fn(s)
      return s
    })
  const hand = st.hands[tab]
  const isWinner = st.winner === tab

  const addMeld = (k: Kind) => {
    if (!adding) return
    upd((s) => {
      s.hands[tab].melds.push({ type: adding, tile: k, concealed: adding === 'chow' || adding === 'pair' ? true : concealedNew })
    })
    setAdding(null)
  }

  const register = () => {
    upd((s) => {
      if (!s.ledger.length) s.startDealer = s.dealer
      const w = s.winner
      s.ledger.push({
        net: settlement.net,
        note: w === null ? 'Nessun Mah-Jong' : `Mah-Jong di ${s.names[w]} (${results[w].massimo ? results[w].massimo!.name : results[w].value + ' pt'})`,
      })
      s.hands = [emptyHand(), emptyHand(), emptyHand(), emptyHand()]
      s.winner = null
      s.dealer = (s.dealer + 1) % 4
      if (s.dealer === s.startDealer) s.roundWind = (s.roundWind + 1) % 4
    })
    setTab(0)
  }

  const totals = [0, 1, 2, 3].map((i) => st.ledger.reduce((a, r) => a + r.net[i], 0))

  return (
    <div className="space-y-4">
      <PageHeader title="Conta punti" subtitle="Inserisci le combinazioni di ogni giocatore: calcolo il valore della mano, i raddoppi e i pagamenti." />

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm">
            <span className="text-muted">EST: </span>
            <b>{st.names[st.dealer]}</b>
            <span className="text-muted"> · Vento di giro: </span>
            <b>{WIND_NAMES[st.roundWind]}</b>
            <span className="text-muted"> · Manche n° </span>
            <b>{st.ledger.length + 1}</b>
          </div>
          <Button size="sm" variant="secondary" className="ml-auto" onClick={() => setShowSetup(true)}>
            Giocatori e venti
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-1.5">
        {st.names.map((n, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setTab(i)}
            className={`rounded-xl border-2 p-2 text-left cursor-pointer transition ${tab === i ? 'border-jade-600 bg-jade-50 dark:bg-jade-950' : 'border-soft surface'}`}
          >
            <div className="flex items-center gap-1">
              <span className={`text-[10px] font-bold uppercase ${wind(i) === 0 ? 'text-cinnabar-500' : 'text-muted'}`}>{WIND_NAMES[wind(i)]}</span>
              {st.winner === i && <span className="text-xs">🏆</span>}
            </div>
            <div className="truncate text-sm font-semibold">{n}</div>
            <div className="text-xs text-muted tabular-nums">{results[i].massimo ? results[i].massimo!.value : results[i].value} pt</div>
          </button>
        ))}
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">{st.names[tab]}</h2>
          <Badge tone={wind(tab) === 0 ? 'red' : 'gray'}>{WIND_NAMES[wind(tab)]}</Badge>
          <label className="ml-auto flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#d49a2a]"
              checked={isWinner}
              onChange={(e) => upd((s) => void (s.winner = e.target.checked ? tab : null))}
            />
            Ha fatto Mah-Jong
          </label>
        </div>

        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Combinazioni</div>
        <div className="space-y-2">
          {hand.melds.length === 0 && <div className="rounded-xl surface-2 p-3 text-sm text-muted">Nessuna combinazione. Aggiungi tris, poker, scale e coppie con i pulsanti qui sotto.</div>}
          {hand.melds.map((m, j) => (
            <div key={j} className="flex flex-wrap items-center gap-3 rounded-xl surface-2 p-2">
              <TileRow kinds={meldKinds(m)} size="sm" label={false} />
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-semibold">{describeMeld(m)}</div>
                <div className="text-xs text-muted">
                  {meldPoints(m, wind(tab), st.roundWind).pts} pt · {meldPoints(m, wind(tab), st.roundWind).note}
                </div>
              </div>
              {(m.type === 'pung' || m.type === 'kong') && (
                <Segmented
                  value={m.concealed ? 'c' : 's'}
                  options={[
                    { value: 's', label: 'Scoperto' },
                    { value: 'c', label: 'Coperto' },
                  ]}
                  onChange={(v) => upd((s) => void (s.hands[tab].melds[j].concealed = v === 'c'))}
                />
              )}
              <button type="button" className="px-2 text-xl text-muted hover:text-cinnabar-500 cursor-pointer" aria-label="Rimuovi" onClick={() => upd((s) => void s.hands[tab].melds.splice(j, 1))}>
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ['pung', '+ Tris'],
              ['kong', '+ Poker'],
              ['chow', '+ Scala'],
              ['pair', '+ Coppia'],
            ] as [MeldType, string][]
          ).map(([t, l]) => (
            <Button key={t} size="sm" variant="secondary" onClick={() => setAdding(t)}>
              {l}
            </Button>
          ))}
        </div>

        <div className="mt-5 mb-2 text-xs font-bold uppercase tracking-wide text-muted">Fiori e stagioni esposti</div>
        <div className="flex flex-wrap gap-1">
          {[34, 35, 36, 37, 38, 39, 40, 41].map((k) => {
            const on = hand.flowers.includes(k)
            const usedByOther = st.hands.some((h, i) => i !== tab && h.flowers.includes(k))
            return (
              <span key={k} className={usedByOther ? 'pointer-events-none' : ''}>
                <Tile
                  k={k}
                  size="sm"
                  dim={!on}
                  selected={on}
                  onClick={() =>
                    upd((s) => {
                      const f = s.hands[tab].flowers
                      s.hands[tab].flowers = on ? f.filter((x) => x !== k) : [...f, k]
                    })
                  }
                />
              </span>
            )
          })}
        </div>
        <p className="mt-1 text-xs text-muted">Il tuo fiore e la tua stagione hanno il numero {wind(tab) + 1} ({WIND_NAMES[wind(tab)]}).</p>

        {isWinner && (
          <div className="mt-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Come hai chiuso</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {WIN_FLAGS.map((f) => (
                <label key={f.key} className="flex items-start gap-2 rounded-xl surface-2 p-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-[#16765f]"
                    checked={!!hand.win[f.key]}
                    onChange={(e) => upd((s) => void ((s.hands[tab].win as unknown as Record<string, boolean>)[f.key] = e.target.checked))}
                  />
                  <span>
                    <span className="font-semibold">{f.label}</span>
                    <span className="block text-xs text-muted">{f.help}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3">
              <label className="text-sm font-semibold">
                Massimo speciale{' '}
                <select
                  className="ml-2 rounded-lg surface px-2 py-1 text-sm"
                  value={hand.massimo ?? ''}
                  onChange={(e) => upd((s) => void (s.hands[tab].massimo = (e.target.value || undefined) as MassimoId | undefined))}
                >
                  <option value="">Nessuno</option>
                  {Object.entries(MASSIMI).map(([id, m]) => (
                    <option key={id} value={id}>
                      {m.name} ({m.value})
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-1 text-xs text-muted">Molti massimi (raduno dei dragoni, 4 benedizioni, tutto kong, coppie di colore/testa) vengono riconosciuti da soli dalle combinazioni.</p>
            </div>
          </div>
        )}
        {!isWinner && hand.melds.some((m) => m.type === 'chow') && (
          <p className="mt-3 text-xs text-muted">Per chi non chiude le scale non danno punti, ma contano per i raddoppi (es. serpente).</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-bold">Recap della manche</h2>
        {st.winner === null && <Callout tone="tip">Nessuno ha fatto Mah-Jong: i giocatori si pagano solo le differenze di stecca. Segna chi ha chiuso con la casella "Ha fatto Mah-Jong".</Callout>}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3]
            .sort((a, b) => (st.winner === a ? -1 : st.winner === b ? 1 : 0))
            .map((i) => (
              <ScoreRecap key={i} r={results[i]} name={st.names[i]} wind={wind(i)} winner={st.winner === i} />
            ))}
        </div>
        <h3 className="mt-5 mb-2 font-bold">Chi paga a chi</h3>
        <SettlementView s={settlement} names={st.names} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={register}>Registra manche e passa alla successiva</Button>
          <Button variant="ghost" onClick={() => upd((s) => void ((s.hands = [emptyHand(), emptyHand(), emptyHand(), emptyHand()]), (s.winner = null)))}>
            Svuota manche
          </Button>
        </div>
      </Card>

      {st.ledger.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-bold">Segnapunti della partita</h2>
            <ConfirmButton className="ml-auto" label="Azzera" confirmLabel="Tocca ancora per azzerare" onConfirm={() => upd((s) => void ((s.ledger = []), (s.roundWind = 0)))} />
          </div>
          <div className="scroll-x">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-left text-muted">
                <tr>
                  <th className="py-1">#</th>
                  {st.names.map((n, i) => (
                    <th key={i} className="text-right">
                      {n}
                    </th>
                  ))}
                  <th className="pl-3">Note</th>
                </tr>
              </thead>
              <tbody className="[&_td]:border-t [&_td]:border-[var(--border)] [&_td]:py-1.5">
                {st.ledger.map((r, h) => (
                  <tr key={h}>
                    <td>{h + 1}</td>
                    {r.net.map((n, i) => (
                      <td key={i} className={`text-right tabular-nums ${n > 0 ? 'text-jade-600 dark:text-jade-300' : n < 0 ? 'text-cinnabar-500' : ''}`}>
                        {n}
                      </td>
                    ))}
                    <td className="pl-3 text-xs text-muted">{r.note}</td>
                  </tr>
                ))}
                <tr className="font-extrabold">
                  <td>Tot</td>
                  {totals.map((n, i) => (
                    <td key={i} className="text-right tabular-nums">
                      {n}
                    </td>
                  ))}
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={adding !== null} onClose={() => setAdding(null)} title={adding ? `Aggiungi ${{ pung: 'tris', kong: 'poker', chow: 'scala', pair: 'coppia' }[adding]}` : ''}>
        {adding && (
          <div className="space-y-3">
            {adding === 'chow' && <p className="text-sm text-muted">Scegli la pedina più bassa della scala.</p>}
            {(adding === 'pung' || adding === 'kong') && (
              <div>
                <Segmented
                  value={concealedNew ? 'c' : 's'}
                  options={[
                    { value: 's', label: 'Scoperto (chiamato)' },
                    { value: 'c', label: 'Coperto (pescato da sé)' },
                  ]}
                  onChange={(v) => setConcealedNew(v === 'c')}
                />
                <p className="mt-1 text-xs text-muted">Un tris completato con lo scarto di un altro (anche per chiudere) è scoperto.</p>
              </div>
            )}
            <TilePicker allowed={adding === 'chow' ? (k) => isSuit(k) && rankOf(k) <= 7 : undefined} onPick={addMeld} />
            {(adding === 'pung' || adding === 'kong') && <p className="text-xs text-muted">Le pedine di testa (1, 9, venti e draghi) valgono il doppio.</p>}
          </div>
        )}
      </Modal>

      <Modal open={showSetup} onClose={() => setShowSetup(false)} title="Giocatori e venti">
        <div className="space-y-4">
          <p className="text-sm text-muted">Scrivi i nomi in ordine di gioco (senso antiorario, partendo da chi vuoi).</p>
          {st.names.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="flex-1 rounded-xl surface px-3 py-2"
                value={n}
                onChange={(e) => upd((s) => void (s.names[i] = e.target.value))}
              />
              <Button size="sm" variant={st.dealer === i ? 'danger' : 'secondary'} onClick={() => upd((s) => void (s.dealer = i))}>
                {st.dealer === i ? 'EST' : 'Fai EST'}
              </Button>
            </div>
          ))}
          <div>
            <div className="mb-1 text-sm font-semibold">Vento di giro</div>
            <Segmented value={st.roundWind} options={WIND_NAMES.map((w, i) => ({ value: i, label: w }))} onChange={(v) => upd((s) => void (s.roundWind = v))} />
          </div>
          <Button onClick={() => setShowSetup(false)}>Fatto</Button>
        </div>
      </Modal>
    </div>
  )
}
