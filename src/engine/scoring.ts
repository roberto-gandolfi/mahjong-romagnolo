// Calcolo dei punti secondo il Regolamento FIMJ (4a edizione).
import { type SMeld, meldKinds, type MeldType } from './hand'
import {
  type Kind,
  isDragon,
  isFlower,
  isHead,
  isHonor,
  isSeason,
  isSimple,
  isSuit,
  isWind,
  rankOf,
  suitIndex,
  tileName,
  windKind,
  WIND_NAMES,
  FLOWER0,
  SEASON0,
  bonusNumber,
  DRAGON_NAMES,
} from './tiles'

// ---------- Tabelle del regolamento ----------

export const MELD_POINTS = {
  pung: { normal: { exposed: 2, concealed: 4 }, head: { exposed: 4, concealed: 8 } },
  kong: { normal: { exposed: 8, concealed: 16 }, head: { exposed: 16, concealed: 32 } },
}
export const FLOWER_POINTS = 4
export const PAIR_POINTS = 2
export const WIN_BONUS = 20
export const DEFAULT_LIMIT = 1000

export type MassimoId =
  | 'novePezzi'
  | 'tuttoKong'
  | 'usciteDei'
  | 'tredici'
  | 'raduno'
  | 'benedizioni'
  | 'serpenteDraghi'
  | 'siamesi'
  | 'coppieColore'
  | 'coppieTesta'
  | 'piccoloSerpente'

export const MASSIMI: Record<MassimoId, { name: string; value: number; desc: string }> = {
  novePezzi: {
    name: 'Casa piena dei 9 pezzi',
    value: 3000,
    desc: 'Mano purissima tutta pescata: tre 1, tre 9, un esemplare dal 2 all’8 più una pedina dello stesso seme.',
  },
  tuttoKong: { name: 'Tutto kong (poker)', value: 3000, desc: 'Quattro poker e una coppia.' },
  usciteDei: {
    name: 'Uscita degli Dei',
    value: 3000,
    desc: 'EST chiude con le 14 pedine iniziali, oppure un altro giocatore chiude col primo scarto di EST.',
  },
  tredici: {
    name: '13 lanterne meravigliose',
    value: 2000,
    desc: 'Le 13 diverse pedine di testa più una coppia di una di esse.',
  },
  raduno: { name: 'Raduno dei Dragoni', value: 2000, desc: 'Tris (o poker) dei tre Draghi più un’altra combinazione e una coppia.' },
  benedizioni: {
    name: '4 benedizioni della casa',
    value: 2000,
    desc: 'Quattro tris di venti, oppure tre tris di venti più la coppia del quarto vento e un’altra combinazione.',
  },
  serpenteDraghi: {
    name: 'Serpente dei draghi',
    value: 2000,
    desc: '1-4-7 di un seme, 2-5-8 di un altro, 3-6-9 del terzo, i tre draghi e la coppia del vento di giro o del proprio vento. Tutto pescato tranne l’ultima.',
  },
  siamesi: {
    name: 'Due serpenti siamesi',
    value: 2000,
    desc: 'Due serie dall’1 al 7 di due semi diversi. Tutto pescato tranne l’ultima. Non serve la coppia.',
  },
  coppieColore: { name: 'Tutte coppie di colore', value: 2000, desc: 'Sette coppie dello stesso seme.' },
  coppieTesta: { name: 'Tutte coppie di testa', value: 2000, desc: 'Sette coppie di pedine di testa.' },
  piccoloSerpente: {
    name: 'Piccolo serpente',
    value: 1000,
    desc: 'Serpente di colore (1-9 dello stesso seme), un esemplare di ogni vento e un drago qualsiasi. Non serve la coppia.',
  },
}

export interface DoubleDef {
  id: string
  name: string
  count: number
  kind: 'fondamentale' | 'chiusura'
  desc: string
}

/** Elenco dei raddoppi, usato anche dal prontuario. */
export const DOUBLES: DoubleDef[] = [
  { id: 'ownFlower', name: 'Proprio fiore o stagione', count: 1, kind: 'fondamentale', desc: 'Il fiore o la stagione col numero del proprio vento (EST=1, SUD=2, OVEST=3, NORD=4). Fiore e stagione propri valgono 1 raddoppio ciascuno.' },
  { id: 'bouquet', name: 'Bouquet o Rosa', count: 2, kind: 'fondamentale', desc: 'Tutti e 4 i Fiori oppure tutte e 4 le Stagioni (include il proprio fiore).' },
  { id: 'ownWind', name: 'Proprio vento', count: 1, kind: 'fondamentale', desc: 'Tris o poker del proprio vento.' },
  { id: 'roundWind', name: 'Vento di giro', count: 1, kind: 'fondamentale', desc: 'Tris o poker del vento di giro. Se coincide col proprio vento i raddoppi sono 2.' },
  { id: 'dragon', name: 'Tris di draghi', count: 1, kind: 'fondamentale', desc: 'Ogni tris o poker di un drago.' },
  { id: 'heads3', name: '3 tris di teste', count: 1, kind: 'fondamentale', desc: 'Tre tris o poker di pedine di testa (1, 9, venti, draghi).' },
  { id: 'heads4', name: '4 tris di teste', count: 2, kind: 'fondamentale', desc: 'Quattro tris o poker di testa (include il precedente).' },
  { id: 'sameTris', name: '3 tris uguali', count: 1, kind: 'fondamentale', desc: 'Tre tris dello stesso numero nei tre semi (es. 5 Car, 5 Can, 5 Pal).' },
  { id: 'hidden3', name: '3 tris nascosti', count: 1, kind: 'fondamentale', desc: 'Tre tris interamente pescati da sé (un poker esposto non conta).' },
  { id: 'hidden4', name: '4 tris nascosti', count: 2, kind: 'fondamentale', desc: 'Quattro tris interamente pescati (include il precedente).' },
  { id: 'sameChow3', name: '3 scale uguali', count: 1, kind: 'fondamentale', desc: 'Tre scale con gli stessi numeri, di qualsiasi seme.' },
  { id: 'sameChow3c', name: '3 scale uguali di colore', count: 2, kind: 'fondamentale', desc: 'Tre scale identiche dello stesso seme.' },
  { id: 'sameChow4', name: '4 scale uguali', count: 2, kind: 'fondamentale', desc: 'Quattro scale con gli stessi numeri, di qualsiasi seme.' },
  { id: 'sameChow4c', name: '4 scale uguali di colore', count: 4, kind: 'fondamentale', desc: 'Quattro scale identiche dello stesso seme.' },
  { id: 'snake', name: 'Serpente', count: 1, kind: 'fondamentale', desc: 'Scale 1-2-3, 4-5-6, 7-8-9 di qualsiasi seme.' },
  { id: 'snakeC', name: 'Serpente di colore', count: 2, kind: 'fondamentale', desc: 'Scale 1-2-3, 4-5-6, 7-8-9 dello stesso seme.' },
  { id: 'chain', name: 'Serpente incatenato', count: 2, kind: 'fondamentale', desc: 'Scale 1-2-3, 3-4-5, 5-6-7, 7-8-9 di qualsiasi seme.' },
  { id: 'chainC', name: 'Serpente incatenato di colore', count: 3, kind: 'fondamentale', desc: 'Scale 1-2-3, 3-4-5, 5-6-7, 7-8-9 dello stesso seme.' },
  { id: 'sevenPairs', name: 'Tutte coppie', count: 2, kind: 'chiusura', desc: 'Mah-Jong di sette coppie.' },
  { id: 'allPungs', name: 'Tutti tris', count: 1, kind: 'chiusura', desc: '4 tris e/o poker più una coppia.' },
  { id: 'allHeadPungs', name: 'Tutti tris di teste', count: 4, kind: 'chiusura', desc: '4 tris/poker di testa e coppia di testa (include 3 e 4 tris di teste e tutti tris).' },
  { id: 'noHeads', name: 'Senza teste', count: 1, kind: 'chiusura', desc: 'Solo pedine numerali dal 2 all’8.' },
  { id: 'concealed', name: 'Tutto pescato (nascosto)', count: 1, kind: 'chiusura', desc: 'Nessuna pedina chiamata (nemmeno l’ultima) e nessuna combinazione esposta, neanche un poker.' },
  { id: 'pure', name: 'Mano pura', count: 1, kind: 'chiusura', desc: 'Un solo seme più combinazioni di venti o draghi.' },
  { id: 'purest', name: 'Mano purissima', count: 3, kind: 'chiusura', desc: 'Tutta di un unico seme, senza venti né draghi.' },
  { id: 'tetto', name: 'Pescato sul tetto', count: 1, kind: 'chiusura', desc: 'Chiusura con la pedina pescata dal tetto (dopo fiore o poker).' },
  { id: 'goldenRooster', name: '5 di palle sul tetto (gallo d’oro)', count: 2, kind: 'chiusura', desc: 'Chiusura pescando il 5 di Palle dal tetto (include il precedente).' },
  { id: 'robbed', name: 'Pezzo rubato', count: 1, kind: 'chiusura', desc: 'Chiusura rubando la pedina con cui un avversario trasforma un tris esposto in poker.' },
  { id: 'lastPiece', name: 'Ultimo pezzo', count: 1, kind: 'chiusura', desc: 'Chiusura con l’ultimo esemplare disponibile di quella pedina (va dichiarato).' },
  { id: 'lastDiscard', name: 'Ultimo scarto', count: 1, kind: 'chiusura', desc: 'Chiusura con l’ultima pedina che può essere scartata.' },
  { id: 'lastTile', name: 'Ultima pedina', count: 1, kind: 'chiusura', desc: 'Chiusura con l’ultima pedina disponibile per la pesca.' },
  { id: 'bottled', name: 'Imbottigliato', count: 1, kind: 'chiusura', desc: 'Coppia finale fatta con l’unica pedina rimasta coperta, con le altre 4 combinazioni già esposte.' },
  { id: 'within15', name: 'Entro la quindicesima', count: 1, kind: 'chiusura', desc: 'Chiusura entro il 15° scarto (contando anche le pedine chiamate).' },
  { id: 'allChows', name: 'Tutte scale', count: 1, kind: 'chiusura', desc: 'Solo scale e una coppia senza valore (no draghi, no proprio vento o vento di giro).' },
  { id: 'richi', name: 'Richi', count: 1, kind: 'chiusura', desc: 'Chiusura dopo aver dichiarato Richi (a punto su un’unica pedina).' },
]
export const DOUBLE_BY_ID = Object.fromEntries(DOUBLES.map((d) => [d.id, d])) as Record<string, DoubleDef>

// ---------- Input e output ----------

export interface WinContext {
  selfDrawn: boolean
  fromTetto?: boolean
  goldenRooster?: boolean
  robbedKong?: boolean
  lastPiece?: boolean
  lastDiscard?: boolean
  lastTile?: boolean
  bottled?: boolean
  within15?: boolean
  richi?: boolean
}

export interface ScoreInput {
  melds: SMeld[]
  flowers: Kind[]
  seatWind: number
  roundWind: number
  winner: boolean
  win?: WinContext
  /** Massimo dichiarato a mano (forme che non si descrivono con combinazioni o situazioni come l'Uscita degli Dei). */
  massimo?: MassimoId
}

export interface ScoreLine {
  label: string
  points: number
  kinds: Kind[]
  note?: string
}
export interface DoubleLine {
  id: string
  label: string
  count: number
  note?: string
}

export interface ScoreResult {
  lines: ScoreLine[]
  base: number // punti delle combinazioni e dei fiori
  bonus: number // 20 se ha chiuso
  subtotal: number
  doubles: DoubleLine[]
  totalDoubles: number
  doublesApplied: boolean
  value: number // subtotal * 2^raddoppi (prima del limite)
  massimo?: { id: MassimoId; name: string; value: number }
  warnings: string[]
  structure: 'standard' | 'sevenPairs' | 'massimo' | 'incomplete'
}

const meldLabel: Record<MeldType, string> = { chow: 'Scala', pung: 'Tris', kong: 'Poker', pair: 'Coppia' }

export function describeMeld(m: SMeld): string {
  const r = rankOf(m.tile)
  if (m.type === 'chow') return `Scala ${r}-${r + 1}-${r + 2} di ${SUIT_LABEL[suitIndex(m.tile)]}`
  const base = `${meldLabel[m.type]} ${tileName(m.tile)}`
  if (m.type === 'pair') return base
  return `${base} ${m.concealed ? 'coperto' : 'scoperto'}`
}

function pairPoints(k: Kind, seat: number, round: number): { pts: number; note: string } {
  if (isDragon(k)) return { pts: PAIR_POINTS, note: 'coppia di drago' }
  if (isWind(k)) {
    const own = k === windKind(seat)
    const rnd = k === windKind(round)
    if (own && rnd) return { pts: PAIR_POINTS * 2, note: 'proprio vento e vento di giro' }
    if (own) return { pts: PAIR_POINTS, note: 'coppia del proprio vento' }
    if (rnd) return { pts: PAIR_POINTS, note: 'coppia del vento di giro' }
  }
  return { pts: 0, note: 'coppia senza valore' }
}

export function meldPoints(m: SMeld, seat: number, round: number): { pts: number; note: string } {
  if (m.type === 'chow') return { pts: 0, note: 'le scale non danno punti' }
  if (m.type === 'pair') return pairPoints(m.tile, seat, round)
  const head = isHead(m.tile)
  const table = MELD_POINTS[m.type][head ? 'head' : 'normal']
  const pts = m.concealed ? table.concealed : table.exposed
  return { pts, note: `${head ? 'di testa' : 'non di testa'}, ${m.concealed ? 'coperto' : 'scoperto'}` }
}

function d(id: string, note?: string, count?: number): DoubleLine {
  const def = DOUBLE_BY_ID[id]
  return { id, label: def.name, count: count ?? def.count, note }
}

const SUIT_LABEL = ['Caratteri', 'Canne', 'Palle']

export function scoreHand(input: ScoreInput): ScoreResult {
  const { melds, flowers, seatWind: seat, roundWind: round, winner } = input
  const win = input.win ?? { selfDrawn: false }
  const warnings: string[] = []
  const lines: ScoreLine[] = []

  for (const f of [...flowers].sort((a, b) => a - b)) {
    lines.push({ label: tileName(f), points: FLOWER_POINTS, kinds: [f] })
  }
  for (const m of melds) {
    const { pts, note } = meldPoints(m, seat, round)
    lines.push({ label: describeMeld(m), points: pts, kinds: meldKinds(m), note })
  }
  const base = lines.reduce((a, l) => a + l.points, 0)
  const bonus = winner ? WIN_BONUS : 0
  const subtotal = base + bonus

  const sets = melds.filter((m) => m.type === 'pung' || m.type === 'kong')
  const chows = melds.filter((m) => m.type === 'chow')
  const pairs = melds.filter((m) => m.type === 'pair')
  const sevenPairs = pairs.length === 7 && melds.length === 7
  const standard = sets.length + chows.length === 4 && pairs.length === 1 && melds.length === 5
  let structure: ScoreResult['structure'] = sevenPairs ? 'sevenPairs' : standard ? 'standard' : 'incomplete'
  if (winner && !sevenPairs && !standard && !input.massimo) {
    warnings.push('Per fare Mah-Jong servono 4 combinazioni (tris, poker o scale) più una coppia, oppure 7 coppie.')
  }
  if (sevenPairs && new Set(pairs.map((p) => p.tile)).size < 7) {
    warnings.push('Nelle 7 coppie le coppie devono essere tutte diverse.')
  }

  // ---- Massimi ----
  let massimo: ScoreResult['massimo']
  if (winner) {
    const found: MassimoId[] = []
    if (input.massimo) found.push(input.massimo)
    if (standard) {
      if (melds.filter((m) => m.type === 'kong').length === 4) found.push('tuttoKong')
      if ([31, 32, 33].every((k) => sets.some((s) => s.tile === k))) found.push('raduno')
      const windSets = sets.filter((s) => isWind(s.tile))
      if (windSets.length === 4) found.push('benedizioni')
      if (windSets.length === 3 && isWind(pairs[0].tile) && !windSets.some((s) => s.tile === pairs[0].tile)) found.push('benedizioni')
    }
    if (sevenPairs) {
      const ks = pairs.map((p) => p.tile)
      if (ks.every(isSuit) && new Set(ks.map(suitIndex)).size === 1) found.push('coppieColore')
      if (ks.every(isHead)) found.push('coppieTesta')
    }
    if (found.length) {
      const best = found.sort((a, b) => MASSIMI[b].value - MASSIMI[a].value)[0]
      massimo = { id: best, name: MASSIMI[best].name, value: MASSIMI[best].value }
      structure = 'massimo'
    }
  }

  // ---- Raddoppi fondamentali ----
  const doubles: DoubleLine[] = []
  const fl = flowers.filter(isFlower)
  const se = flowers.filter(isSeason)
  if (fl.length === 4) doubles.push(d('bouquet', 'tutti e 4 i Fiori'))
  else if (fl.includes(FLOWER0 + seat)) doubles.push(d('ownFlower', `Fiore ${seat + 1} = vento ${WIND_NAMES[seat]}`))
  if (se.length === 4) doubles.push(d('bouquet', 'tutte e 4 le Stagioni'))
  else if (se.includes(SEASON0 + seat)) doubles.push(d('ownFlower', `Stagione ${seat + 1} = vento ${WIND_NAMES[seat]}`))

  for (const s of sets) {
    if (s.tile === windKind(seat)) doubles.push(d('ownWind', `vento ${WIND_NAMES[seat]}`))
    if (s.tile === windKind(round)) doubles.push(d('roundWind', `vento ${WIND_NAMES[round]}`))
    if (isDragon(s.tile)) doubles.push(d('dragon', `drago ${DRAGON_NAMES[s.tile - 31]}`))
  }

  const allTiles = melds.flatMap(meldKinds)
  const headSets = sets.filter((s) => isHead(s.tile)).length
  const allHeadPungs = winner && standard && headSets === 4 && isHead(pairs[0].tile)
  if (!allHeadPungs) {
    if (headSets >= 4) doubles.push(d('heads4'))
    else if (headSets === 3) doubles.push(d('heads3'))
  }
  for (let r = 1; r <= 9; r++) {
    const suits = new Set(sets.filter((s) => isSuit(s.tile) && rankOf(s.tile) === r).map((s) => suitIndex(s.tile)))
    if (suits.size === 3) doubles.push(d('sameTris', `tre tris di ${r}`))
  }
  const hidden = melds.filter((m) => m.type === 'pung' && m.concealed).length
  if (hidden >= 4) doubles.push(d('hidden4'))
  else if (hidden === 3) doubles.push(d('hidden3'))

  // scale uguali
  {
    const bySame = new Map<number, number>()
    const byRank = new Map<number, number>()
    for (const c of chows) {
      bySame.set(c.tile, (bySame.get(c.tile) ?? 0) + 1)
      byRank.set(rankOf(c.tile), (byRank.get(rankOf(c.tile)) ?? 0) + 1)
    }
    const sameMax = Math.max(0, ...bySame.values())
    const rankMax = Math.max(0, ...byRank.values())
    const opts: DoubleLine[] = []
    if (sameMax >= 4) opts.push(d('sameChow4c'))
    else if (sameMax === 3) opts.push(d('sameChow3c'))
    if (rankMax >= 4) opts.push(d('sameChow4'))
    else if (rankMax === 3) opts.push(d('sameChow3'))
    if (opts.length) doubles.push(opts.sort((a, b) => b.count - a.count)[0])
  }
  // serpenti
  {
    const has = (rank: number, suit?: number) =>
      chows.some((c) => rankOf(c.tile) === rank && (suit === undefined || suitIndex(c.tile) === suit))
    const opts: DoubleLine[] = []
    for (let s = 0; s < 3; s++) {
      if ([1, 3, 5, 7].every((r) => has(r, s))) opts.push(d('chainC', SUIT_LABEL[s]))
      if ([1, 4, 7].every((r) => has(r, s))) opts.push(d('snakeC', SUIT_LABEL[s]))
    }
    if ([1, 3, 5, 7].every((r) => has(r))) opts.push(d('chain'))
    if ([1, 4, 7].every((r) => has(r))) opts.push(d('snake'))
    if (opts.length) doubles.push(opts.sort((a, b) => b.count - a.count)[0])
  }

  // ---- Raddoppi da chiusura ----
  if (winner) {
    if (sevenPairs) doubles.push(d('sevenPairs'))
    if (allHeadPungs) doubles.push(d('allHeadPungs'))
    else if (standard && sets.length === 4) doubles.push(d('allPungs'))
    if (standard && chows.length === 4 && pairPoints(pairs[0].tile, seat, round).pts === 0) doubles.push(d('allChows'))
    if (allTiles.length && allTiles.every(isSimple)) doubles.push(d('noHeads'))
    const suitsUsed = new Set(allTiles.filter(isSuit).map(suitIndex))
    const honors = allTiles.some(isHonor)
    if (suitsUsed.size === 1 && honors) doubles.push(d('pure', SUIT_LABEL[[...suitsUsed][0]]))
    if (suitsUsed.size === 1 && !honors) doubles.push(d('purest', SUIT_LABEL[[...suitsUsed][0]]))
    if (win.selfDrawn && melds.every((m) => m.type === 'pair' || (m.concealed && m.type !== 'kong'))) doubles.push(d('concealed'))
    if (win.goldenRooster) doubles.push(d('goldenRooster'))
    else if (win.fromTetto) doubles.push(d('tetto'))
    if (win.robbedKong) doubles.push(d('robbed'))
    if (win.lastPiece) doubles.push(d('lastPiece'))
    if (win.lastDiscard) doubles.push(d('lastDiscard'))
    if (win.lastTile) doubles.push(d('lastTile'))
    if (win.bottled) doubles.push(d('bottled'))
    if (win.within15) doubles.push(d('within15'))
    if (win.richi) doubles.push(d('richi'))
  }

  const doublesApplied = subtotal >= 2
  const totalDoubles = doublesApplied ? doubles.reduce((a, x) => a + x.count, 0) : 0
  const value = subtotal * 2 ** totalDoubles

  return {
    lines,
    base,
    bonus,
    subtotal,
    doubles,
    totalDoubles,
    doublesApplied,
    value,
    massimo,
    warnings,
    structure,
  }
}

// ---------- Pagamenti ----------

export const round10 = (x: number) => Math.round(x / 10) * 10

export interface PlayerScore {
  name: string
  wind: number // 0 = EST
  winner: boolean
  value: number
  massimo?: number
}

export interface Transfer {
  from: number
  to: number
  amount: number
  explain: string
}

export interface Settlement {
  transfers: Transfer[]
  net: number[]
}

/** Calcola chi paga a chi. `limit` = limite dei punti (EST paga e riscuote doppio, quindi 2000 per EST). */
export function settle(players: PlayerScore[], limit = DEFAULT_LIMIT): Settlement {
  const transfers: Transfer[] = []
  const net = players.map(() => 0)
  const add = (from: number, to: number, amount: number, explain: string) => {
    if (amount <= 0) return
    transfers.push({ from, to, amount, explain })
    net[from] -= amount
    net[to] += amount
  }
  const winners = players.map((p, i) => (p.winner ? i : -1)).filter((i) => i >= 0)
  const losers = players.map((p, i) => (p.winner ? -1 : i)).filter((i) => i >= 0)

  // 1) Mah-Jong: ogni non vincente paga il vincitore
  for (const w of winners) {
    const W = players[w]
    for (const l of losers) {
      const L = players[l]
      const east = W.wind === 0 || L.wind === 0
      let base: number
      let how: string
      if (W.massimo) {
        base = W.massimo
        how = `Massimo ${base}`
      } else {
        base = Math.min(W.value, limit)
        how = W.value > limit ? `${W.value} → limite ${limit}` : `${W.value} punti`
      }
      const raw = base * (east ? 2 : 1)
      const amount = W.massimo ? raw : round10(raw)
      add(l, w, amount, `${how}${east ? ' × 2 (EST paga e riscuote doppio)' : ''}${amount !== raw ? ` = ${raw} → arrotondato a ${amount}` : ''}`)
    }
  }
  // Più vincitori: si pagano le differenze tra loro
  for (let a = 0; a < winners.length; a++)
    for (let b = a + 1; b < winners.length; b++) diff(winners[a], winners[b])

  // 2) Stecche: i non vincenti (o tutti, se nessuno ha chiuso) si pagano le differenze
  const group = winners.length ? losers : players.map((_, i) => i)
  for (let a = 0; a < group.length; a++) for (let b = a + 1; b < group.length; b++) diff(group[a], group[b])

  function diff(i: number, j: number) {
    const vi = players[i].massimo ?? Math.min(players[i].value, limit)
    const vj = players[j].massimo ?? Math.min(players[j].value, limit)
    if (vi === vj) return
    const [hi, lo] = vi > vj ? [i, j] : [j, i]
    const dlt = Math.abs(vi - vj)
    const east = players[hi].wind === 0 || players[lo].wind === 0
    const raw = dlt * (east ? 2 : 1)
    const amount = round10(raw)
    add(
      lo,
      hi,
      amount,
      `Differenza di stecca ${Math.max(vi, vj)} − ${Math.min(vi, vj)} = ${dlt}${east ? ' × 2 (EST)' : ''}${amount !== raw ? ` = ${raw} → arrotondato a ${amount}` : ''}`,
    )
  }
  return { transfers, net }
}

export { bonusNumber }
