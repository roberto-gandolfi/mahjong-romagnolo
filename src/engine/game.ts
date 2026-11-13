// Motore della partita: muro, tetto, turni, chiamate, fine manche.
import { type SMeld, isWinningHand, waitingKinds, meldKinds } from './hand'
import { type Kind, type Tile, fullSet, isBonus, isSuit, isWind, rankOf, rng, shuffle, sortTiles, tileName, WIND_NAMES, kindOf } from './tiles'
import { type ScoreResult, type WinContext, type Settlement, settle } from './scoring'
import { evaluateLoser, evaluateWinner } from './evaluate'

export interface GMeld {
  type: 'chow' | 'pung' | 'kong'
  tile: Kind
  concealed: boolean // true solo per il poker coperto
  tiles: Tile[]
  from?: number
}

export interface Player {
  name: string
  human: boolean
  hand: Tile[]
  melds: GMeld[]
  flowers: Tile[]
  discards: { tile: Tile; claimed: boolean }[]
  richi: boolean
  score: number
}

export type Phase = 'draw' | 'turn' | 'claim' | 'ended'

export interface ClaimOption {
  type: 'mahjong' | 'pung' | 'kong' | 'chow'
  chowStart?: Kind
}

export interface LogEntry {
  person: number
  text: string
}

export interface HandScore {
  person: number
  result: ScoreResult
  melds: SMeld[]
}

export interface HandResult {
  type: 'mahjong' | 'draw' | 'abort'
  winner?: number
  winTile?: Kind
  selfDrawn?: boolean
  reason: string
  scores: HandScore[]
  settlement?: Settlement
}

export interface GameState {
  players: Player[]
  dealer: number
  roundWind: number
  handNo: number
  totalHands: number
  seed: number
  wall: Tile[]
  tetto: Tile[]
  current: number
  phase: Phase
  drawn?: Tile
  drawnFromTetto: boolean
  lastDiscard?: { tile: Tile; from: number; lastPossible: boolean }
  pendingKong?: { person: number; tile: Tile }
  claims: Record<number, ClaimOption[]>
  discardCount: number
  firstDiscards: Kind[]
  calls: number // numero di chiamate/esposizioni (per Uscita degli Dei e 4 venti)
  log: LogEntry[]
  result?: HandResult
}

export const windOf = (s: GameState, person: number) => (person - s.dealer + 4) % 4
export const personOfWind = (s: GameState, wind: number) => (s.dealer + wind) % 4
export const leftOf = (p: number) => (p + 3) % 4
export const nextOf = (p: number) => (p + 1) % 4
const kinds = (ts: Tile[]) => ts.map((t) => t.k)
const clone = <T>(x: T): T => structuredClone(x)
export const toSMeld = (m: GMeld): SMeld => ({ type: m.type, tile: m.tile, concealed: m.concealed })
export const ctxOf = (s: GameState, p: number) => ({ seatWind: windOf(s, p), roundWind: s.roundWind })

function log(s: GameState, person: number, text: string) {
  s.log.push({ person, text })
  if (s.log.length > 80) s.log.shift()
}

export function newGame(names: string[], totalHands: number, seed = Date.now()): GameState {
  const players: Player[] = names.map((name, i) => ({
    name,
    human: i === 0,
    hand: [],
    melds: [],
    flowers: [],
    discards: [],
    richi: false,
    score: 0,
  }))
  const s: GameState = {
    players,
    dealer: 0,
    roundWind: 0,
    handNo: 0,
    totalHands,
    seed,
    wall: [],
    tetto: [],
    current: 0,
    phase: 'turn',
    drawnFromTetto: false,
    claims: {},
    discardCount: 0,
    firstDiscards: [],
    calls: 0,
    log: [],
  }
  return startHand(s)
}

/** Distribuzione: EST 14 pedine, gli altri 13; poi sostituzione dei fiori dal tetto. */
export function startHand(prev: GameState): GameState {
  const s = clone(prev)
  const rand = rng(s.seed + s.handNo * 7919)
  const tiles = shuffle(fullSet(), rand)
  s.tetto = tiles.slice(tiles.length - 14)
  s.wall = tiles.slice(0, tiles.length - 14)
  s.roundWind = Math.floor(s.handNo / 4) % 4
  for (const p of s.players) Object.assign(p, { hand: [], melds: [], flowers: [], discards: [], richi: false })
  for (let w = 0; w < 4; w++) {
    const p = s.players[personOfWind(s, w)]
    p.hand = s.wall.splice(0, w === 0 ? 14 : 13)
  }
  s.phase = 'turn'
  s.current = s.dealer
  s.drawn = undefined
  s.drawnFromTetto = false
  s.lastDiscard = undefined
  s.pendingKong = undefined
  s.claims = {}
  s.discardCount = 0
  s.firstDiscards = []
  s.calls = 0
  s.result = undefined
  s.log = []
  log(s, s.dealer, `Manche ${s.handNo + 1}: ${s.players[s.dealer].name} è EST. Vento di giro: ${WIND_NAMES[s.roundWind]}.`)
  // Sostituzione fiori, a partire da EST
  let again = true
  while (again) {
    again = false
    for (let w = 0; w < 4; w++) {
      const pi = personOfWind(s, w)
      const p = s.players[pi]
      const fl = p.hand.filter((t) => isBonus(t.k))
      if (!fl.length) continue
      again = true
      p.hand = p.hand.filter((t) => !isBonus(t.k))
      for (const f of fl) {
        p.flowers.push(f)
        p.hand.push(drawReplacement(s))
      }
      log(s, pi, `${p.name} espone ${fl.map((f) => tileName(f.k)).join(', ')} e pesca dal tetto.`)
    }
  }
  for (const p of s.players) p.hand = sortTiles(p.hand)
  return s
}

function drawReplacement(s: GameState): Tile {
  return s.tetto.pop() ?? s.wall.pop()!
}

// ---------- Interrogazioni ----------

export function canTsumo(s: GameState, p = s.current): boolean {
  if (s.phase !== 'turn' || s.current !== p) return false
  const pl = s.players[p]
  return isWinningHand(kinds(pl.hand), pl.melds, ctxOf(s, p))
}

export function concealedKongOptions(s: GameState, p = s.current): Kind[] {
  if (s.phase !== 'turn' || s.current !== p || s.players[p].richi) return []
  const c = new Map<Kind, number>()
  for (const t of s.players[p].hand) c.set(t.k, (c.get(t.k) ?? 0) + 1)
  return [...c.entries()].filter(([, n]) => n === 4).map(([k]) => k)
}

export function addKongOptions(s: GameState, p = s.current): Kind[] {
  if (s.phase !== 'turn' || s.current !== p || s.players[p].richi) return []
  const pl = s.players[p]
  return pl.melds.filter((m) => m.type === 'pung' && pl.hand.some((t) => t.k === m.tile)).map((m) => m.tile)
}

/** Pedine che, scartate, lasciano a punto su un'unica pedina (condizione per il Richi). */
export function richiDiscards(s: GameState, p = s.current): number[] {
  const pl = s.players[p]
  if (s.phase !== 'turn' || s.current !== p || pl.richi || s.wall.length < 8) return []
  const ok = new Map<Kind, boolean>()
  for (const t of pl.hand) {
    if (ok.has(t.k)) continue
    const rest = kinds(pl.hand.filter((x) => x.id !== t.id))
    ok.set(t.k, waitingKinds(rest, pl.melds, ctxOf(s, p)).length === 1)
  }
  return pl.hand.filter((t) => ok.get(t.k)).map((t) => t.id)
}

export function visibleCounts(s: GameState, viewer: number): number[] {
  const c = new Array(34).fill(0)
  for (const [i, pl] of s.players.entries()) {
    for (const d of pl.discards) if (!d.claimed) c[d.tile.k]++
    for (const m of pl.melds) for (const t of m.tiles) if (t.k < 34) c[t.k]++
    if (i === viewer) for (const t of pl.hand) c[t.k]++
  }
  return c
}

function computeClaims(s: GameState, tile: Tile, from: number, robbing: boolean): Record<number, ClaimOption[]> {
  const res: Record<number, ClaimOption[]> = {}
  for (let p = 0; p < 4; p++) {
    if (p === from) continue
    const pl = s.players[p]
    const opts: ClaimOption[] = []
    if (isWinningHand([...kinds(pl.hand), tile.k], pl.melds, ctxOf(s, p))) opts.push({ type: 'mahjong' })
    if (!robbing && !pl.richi) {
      const n = pl.hand.filter((t) => t.k === tile.k).length
      if (n >= 2) opts.push({ type: 'pung' })
      if (n >= 3) opts.push({ type: 'kong' })
      if (p === nextOf(from) && isSuit(tile.k)) {
        const has = (k: Kind) => isSuit(k) && Math.floor(k / 9) === Math.floor(tile.k / 9) && pl.hand.some((t) => t.k === k)
        const r = rankOf(tile.k)
        for (const start of [tile.k - 2, tile.k - 1, tile.k]) {
          const sr = r - (tile.k - start)
          if (sr < 1 || sr > 7) continue
          const need = [start, start + 1, start + 2].filter((k) => k !== tile.k)
          if (need.every(has)) opts.push({ type: 'chow', chowStart: start })
        }
      }
    }
    if (opts.length) res[p] = opts
  }
  return res
}

// ---------- Azioni ----------

export function draw(prev: GameState): GameState {
  const s = clone(prev)
  if (s.phase !== 'draw') return s
  const p = s.current
  const pl = s.players[p]
  if (!s.wall.length) return endDraw(s, 'Il muro è finito: nessuno ha fatto Mah-Jong.')
  let t = s.wall.shift()!
  let fromTetto = false
  while (isBonus(t.k)) {
    if (pl.richi) {
      // In Richi si scarta tutto ciò che si pesca, anche fiori e stagioni
      pl.discards.push({ tile: t, claimed: false })
      log(s, p, `${pl.name} (in Richi) scarta ${tileName(t.k)}.`)
      s.current = nextOf(p)
      return s
    }
    pl.flowers.push(t)
    log(s, p, `${pl.name} pesca ${pl.human ? tileName(t.k) : 'un fiore/stagione'}, lo espone e pesca dal tetto.`)
    t = drawReplacement(s)
    fromTetto = true
  }
  pl.hand.push(t)
  s.drawn = t
  s.drawnFromTetto = fromTetto
  s.phase = 'turn'
  return s
}

/** Chi pesca l'ultima pedina e non chiude non scarta: la manche finisce. */
export function mustEndAfterLastTile(s: GameState) {
  return s.phase === 'turn' && s.wall.length === 0 && !!s.drawn && !s.drawnFromTetto && !canTsumo(s)
}

export function discard(prev: GameState, tileId: number, declareRichi = false): GameState {
  const s = clone(prev)
  const p = s.current
  const pl = s.players[p]
  if (s.phase !== 'turn') return s
  const idx = pl.hand.findIndex((t) => t.id === tileId)
  if (idx < 0) return s
  if (s.wall.length === 0 && s.drawn && !s.drawnFromTetto) return endDraw(s, 'Il muro è finito: nessuno ha fatto Mah-Jong.')
  const [tile] = pl.hand.splice(idx, 1)
  pl.hand = sortTiles(pl.hand)
  if (declareRichi) {
    pl.richi = true
    log(s, p, `${pl.name} dichiara RICHI!`)
  }
  pl.discards.push({ tile, claimed: false })
  s.discardCount++
  s.drawn = undefined
  if (s.calls === 0 && s.firstDiscards.length < 4) s.firstDiscards.push(tile.k)
  log(s, p, `${pl.name} scarta ${tileName(tile.k)}.`)
  s.lastDiscard = { tile, from: p, lastPossible: s.wall.length <= 1 }
  if (s.firstDiscards.length === 4 && s.calls === 0 && isWind(tile.k) && s.firstDiscards.every((k) => k === tile.k)) {
    s.phase = 'ended'
    s.result = { type: 'abort', reason: 'I primi quattro scarti sono lo stesso vento: la manche va a monte.', scores: [] }
    return s
  }
  s.claims = computeClaims(s, tile, p, false)
  if (Object.keys(s.claims).length) {
    s.phase = 'claim'
  } else {
    s.current = nextOf(p)
    s.phase = 'draw'
  }
  return s
}

export function declareConcealedKong(prev: GameState, k: Kind): GameState {
  const s = clone(prev)
  const p = s.current
  const pl = s.players[p]
  const tiles = pl.hand.filter((t) => t.k === k)
  if (tiles.length !== 4) return s
  pl.hand = pl.hand.filter((t) => t.k !== k)
  pl.melds.push({ type: 'kong', tile: k, concealed: true, tiles })
  s.calls++
  log(s, p, `${pl.name} espone un poker coperto di ${tileName(k)} e pesca dal tetto.`)
  return replacementAfterKong(s, p)
}

export function declareAddKong(prev: GameState, k: Kind): GameState {
  const s = clone(prev)
  const p = s.current
  const pl = s.players[p]
  const tile = pl.hand.find((t) => t.k === k)
  if (!tile) return s
  pl.hand = pl.hand.filter((t) => t.id !== tile.id)
  s.drawn = undefined
  log(s, p, `${pl.name} aggiunge il quarto ${tileName(k)} al tris esposto.`)
  s.pendingKong = { person: p, tile }
  s.claims = computeClaims(s, tile, p, true)
  if (Object.keys(s.claims).length) {
    s.phase = 'claim'
    return s
  }
  return completeAddKong(s)
}

function completeAddKong(s: GameState): GameState {
  const { person, tile } = s.pendingKong!
  const m = s.players[person].melds.find((x) => x.type === 'pung' && x.tile === tile.k)!
  m.type = 'kong'
  m.tiles.push(tile)
  s.pendingKong = undefined
  s.calls++
  return replacementAfterKong(s, person)
}

function replacementAfterKong(s: GameState, p: number): GameState {
  const pl = s.players[p]
  if (!s.tetto.length && !s.wall.length) return endDraw(s, 'Non ci sono più pedine da pescare.')
  let t = drawReplacement(s)
  while (isBonus(t.k)) {
    pl.flowers.push(t)
    if (!s.tetto.length && !s.wall.length) return endDraw(s, 'Non ci sono più pedine da pescare.')
    t = drawReplacement(s)
  }
  pl.hand.push(t)
  s.drawn = t
  s.drawnFromTetto = true
  s.current = p
  s.phase = 'turn'
  return s
}

/** Risolve le chiamate: Mah-Jong > tris/poker > scala. `decisions[p]` = opzione scelta o null. */
export function resolveClaims(prev: GameState, decisions: Record<number, ClaimOption | null>): GameState {
  let s = clone(prev)
  const robbing = !!s.pendingKong
  const tile = robbing ? s.pendingKong!.tile : s.lastDiscard!.tile
  const from = robbing ? s.pendingKong!.person : s.lastDiscard!.from
  const order = [1, 2, 3].map((i) => (from + i) % 4)
  const chosen = (type: ClaimOption['type']) => order.find((p) => decisions[p]?.type === type)
  s.claims = {}

  const mj = chosen('mahjong')
  if (mj !== undefined) return finishMahjong(s, mj, tile, false, robbing)
  if (robbing) return completeAddKong(s)

  const pk = order.find((p) => decisions[p]?.type === 'pung' || decisions[p]?.type === 'kong')
  const ch = chosen('chow')
  const taker = pk ?? ch
  if (taker === undefined) {
    s.current = nextOf(from)
    s.phase = 'draw'
    return s
  }
  const opt = decisions[taker]!
  const pl = s.players[taker]
  const disc = s.players[from].discards
  disc[disc.length - 1].claimed = true
  s.calls++
  let used: Tile[] = []
  if (opt.type === 'pung' || opt.type === 'kong') {
    const n = opt.type === 'pung' ? 2 : 3
    used = pl.hand.filter((t) => t.k === tile.k).slice(0, n)
    pl.melds.push({ type: opt.type, tile: tile.k, concealed: false, tiles: [...used, tile], from })
  } else {
    const start = opt.chowStart!
    for (const k of [start, start + 1, start + 2]) {
      if (k === tile.k) continue
      used.push(pl.hand.find((t) => t.k === k && !used.includes(t))!)
    }
    pl.melds.push({ type: 'chow', tile: start, concealed: false, tiles: sortTiles([...used, tile]), from })
  }
  pl.hand = pl.hand.filter((t) => !used.some((u) => u.id === t.id))
  const label = opt.type === 'pung' ? 'TRIS' : opt.type === 'kong' ? 'POKER' : 'SCALA'
  log(s, taker, `${pl.name} chiama ${label} con ${tileName(tile.k)}.`)
  s.current = taker
  s.lastDiscard = undefined
  if (opt.type === 'kong') {
    s = replacementAfterKong(s, taker)
    return s
  }
  s.drawn = undefined
  s.drawnFromTetto = false
  s.phase = 'turn'
  return s
}

export function tsumo(prev: GameState): GameState {
  const s = clone(prev)
  const p = s.current
  const pl = s.players[p]
  const tile = s.drawn ?? pl.hand[pl.hand.length - 1]
  pl.hand = pl.hand.filter((t) => t.id !== tile.id)
  return finishMahjong(s, p, tile, true, false)
}

function lastPieceFor(s: GameState, p: number, tile: Tile): boolean {
  const pl = s.players[p]
  const vis = visibleCounts(s, p)
  // la pedina di chiusura non era ancora visibile
  const waits = waitingKinds(kinds(pl.hand), pl.melds, ctxOf(s, p))
  const live = waits.filter((k) => 4 - vis[k] > 0)
  return live.length === 1 && live[0] === tile.k && 4 - vis[tile.k] === 1
}

function finishMahjong(s: GameState, p: number, tile: Tile, selfDrawn: boolean, robbing: boolean): GameState {
  const pl = s.players[p]
  if (!selfDrawn && !robbing) {
    // la pedina viene tolta dagli scarti
    const disc = s.players[s.lastDiscard!.from].discards
    disc.pop()
  }
  const heavenly =
    s.calls === 0 &&
    ((selfDrawn && p === s.dealer && s.discardCount === 0) ||
      (!selfDrawn && s.discardCount === 1 && s.lastDiscard?.from === s.dealer))
  const lastPiece = lastPieceFor(s, p, tile)
  const win: WinContext = {
    selfDrawn,
    fromTetto: selfDrawn && s.drawnFromTetto,
    goldenRooster: selfDrawn && s.drawnFromTetto && tile.k === kindOf('p', 5),
    robbedKong: robbing,
    lastPiece,
    lastDiscard: !selfDrawn && !robbing && !!s.lastDiscard?.lastPossible,
    lastTile: selfDrawn && !s.drawnFromTetto && s.wall.length === 0,
    within15: s.discardCount <= 15,
    richi: pl.richi,
  }
  pl.hand.push(tile)
  pl.hand = sortTiles(pl.hand)
  const ev = evaluateWinner({
    concealed: kinds(pl.hand),
    exposed: pl.melds.map(toSMeld),
    flowers: kinds(pl.flowers),
    ...ctxOf(s, p),
    winTile: tile.k,
    win,
    heavenly,
  })
  if (robbing) s.pendingKong = undefined
  log(s, p, `${pl.name} fa MAH-JONG ${selfDrawn ? 'pescando' : 'con'} ${tileName(tile.k)}!`)
  const scores: HandScore[] = []
  for (let i = 0; i < 4; i++) {
    const q = s.players[i]
    if (i === p && ev) scores.push({ person: i, result: ev.result, melds: ev.melds })
    else {
      const l = evaluateLoser({ concealed: kinds(q.hand), exposed: q.melds.map(toSMeld), flowers: kinds(q.flowers), ...ctxOf(s, i) })
      scores.push({ person: i, ...l })
    }
  }
  return endWith(s, {
    type: 'mahjong',
    winner: p,
    winTile: tile.k,
    selfDrawn,
    reason: `${pl.name} ha fatto Mah-Jong ${selfDrawn ? 'pescando da sé' : robbing ? 'rubando il pezzo del poker' : `con lo scarto di ${s.players[s.lastDiscard!.from].name}`}.`,
    scores,
  })
}

function endDraw(s: GameState, reason: string): GameState {
  const scores: HandScore[] = s.players.map((q, i) => ({
    person: i,
    ...evaluateLoser({ concealed: kinds(q.hand), exposed: q.melds.map(toSMeld), flowers: kinds(q.flowers), ...ctxOf(s, i) }),
  }))
  return endWith(s, { type: 'draw', reason, scores })
}

function endWith(s: GameState, r: HandResult): GameState {
  const players = r.scores.map((sc) => ({
    name: s.players[sc.person].name,
    wind: windOf(s, sc.person),
    winner: r.winner === sc.person,
    value: sc.result.value,
    massimo: sc.result.massimo?.value,
  }))
  r.settlement = settle(players)
  r.settlement.net.forEach((n, i) => (s.players[i].score += n))
  s.result = r
  s.phase = 'ended'
  s.claims = {}
  return s
}

export function nextHand(prev: GameState): GameState {
  const s = clone(prev)
  s.handNo++
  s.dealer = nextOf(s.dealer) // EST passa la mano a SUD
  return startHand(s)
}

export const isGameOver = (s: GameState) => s.phase === 'ended' && s.handNo + 1 >= s.totalHands

export { meldKinds }
