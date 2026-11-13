// Avversari virtuali e consigliere: valuta gli scarti e spiega il perché.
import { shanten, valueKind } from './hand'
import { type Kind, type Tile, NUM_KINDS, countsOf, isDragon, isHonor, isSuit, isWind, rankOf, suitIndex, tileName, WIND_NAMES, SUIT_NAMES, SUITS } from './tiles'
import { type ClaimOption, type GameState, ctxOf, visibleCounts, windOf, canTsumo, concealedKongOptions, addKongOptions } from './game'

export type Level = 'facile' | 'normale'

export interface DiscardAnalysis {
  tile: Tile
  kind: Kind
  shanten: number
  ukeire: number
  useful: Kind[]
  danger: number
  score: number
  pros: string[]
  cons: string[]
}

const kindsOf = (ts: Tile[]) => ts.map((t) => t.k)

export function shantenText(n: number): string {
  if (n < 0) return 'hai Mah-Jong'
  if (n === 0) return 'sei a punto (ti manca una sola pedina per chiudere)'
  if (n === 1) return 'ti manca 1 pedina per essere a punto'
  return `ti mancano ${n} pedine per essere a punto`
}

/** Pedine utili: quelle che, pescate, avvicinano alla chiusura. */
export function usefulTiles(counts: number[], exposed: number, vis: number[]) {
  const base = shanten(counts, exposed)
  const useful: Kind[] = []
  let total = 0
  for (let k = 0; k < NUM_KINDS; k++) {
    if (counts[k] >= 4) continue
    const left = 4 - vis[k]
    if (left <= 0) continue
    counts[k]++
    if (shanten(counts, exposed) < base) {
      useful.push(k)
      total += left
    }
    counts[k]--
  }
  return { base, useful, total }
}

interface Threat {
  person: number
  level: number
  reason: string
  suits?: number
}

/** Quali avversari sembrano vicini alla chiusura? */
export function threats(s: GameState, viewer: number): Threat[] {
  const res: Threat[] = []
  for (let p = 0; p < 4; p++) {
    if (p === viewer) continue
    const pl = s.players[p]
    let level = 0
    let reason = ''
    if (pl.richi) {
      level = 3
      reason = 'ha dichiarato Richi'
    } else if (pl.melds.length >= 3) {
      level = 2
      reason = `ha ${pl.melds.length} combinazioni esposte`
    } else if (pl.melds.length === 2 && s.wall.length < 30) {
      level = 1
      reason = 'ha 2 combinazioni esposte e il muro si accorcia'
    }
    if (!level) continue
    // gioca un solo seme?
    const suitsUsed = new Set(pl.melds.flatMap((m) => m.tiles.filter((t) => isSuit(t.k)).map((t) => suitIndex(t.k))))
    const t: Threat = { person: p, level, reason }
    if (pl.melds.length >= 2 && suitsUsed.size === 1) t.suits = [...suitsUsed][0]
    res.push(t)
  }
  return res
}

function safety(s: GameState, viewer: number, k: Kind, th: Threat, vis: number[]): { safe: boolean; why: string } {
  const pl = s.players[th.person]
  if (pl.discards.some((d) => d.tile.k === k)) return { safe: true, why: `già scartata da ${pl.name}` }
  if (vis[k] >= 3 && isHonor(k)) return { safe: true, why: 'ne sono già uscite 3' }
  if (vis[k] >= 4) return { safe: true, why: 'tutte già visibili' }
  void viewer
  return { safe: false, why: '' }
}

export function analyzeDiscards(s: GameState, person: number): DiscardAnalysis[] {
  const pl = s.players[person]
  const { seatWind, roundWind } = ctxOf(s, person)
  const vis = visibleCounts(s, person)
  const counts = countsOf(kindsOf(pl.hand))
  const exposed = pl.melds.length
  const th = threats(s, person)
  const suitTotals = [0, 1, 2].map((si) => counts.slice(si * 9, si * 9 + 9).reduce((a, b) => a + b, 0))
  const meldSuits = pl.melds.filter((m) => isSuit(m.tile)).map((m) => suitIndex(m.tile))
  meldSuits.forEach((si) => (suitTotals[si] += 3))
  const honorsTot = counts.slice(27).reduce((a, b) => a + b, 0) + pl.melds.filter((m) => isHonor(m.tile)).length * 3
  const domSuit = suitTotals.indexOf(Math.max(...suitTotals))
  const otherSuits = suitTotals.reduce((a, b) => a + b, 0) - suitTotals[domSuit]
  const flushChase = suitTotals[domSuit] + honorsTot >= 10 && otherSuits <= 4 && new Set(meldSuits).size <= 1 && (meldSuits.length === 0 || meldSuits[0] === domSuit)

  const out: DiscardAnalysis[] = []
  const done = new Set<Kind>()
  for (const t of pl.hand) {
    if (done.has(t.k)) continue
    done.add(t.k)
    const k = t.k
    counts[k]--
    const u = usefulTiles(counts, exposed, vis)
    counts[k]++
    const pros: string[] = []
    const cons: string[] = []
    let score = -u.base * 100 + u.total * 2

    // vicinato
    const n = counts[k]
    let neighbors = 0
    if (isSuit(k)) {
      for (const dd of [-2, -1, 1, 2]) {
        const kk = k + dd
        if (kk >= 0 && kk < 27 && suitIndex(kk) === suitIndex(k) && counts[kk] > 0) neighbors++
      }
    }
    const isValue = valueKind(k, seatWind, roundWind)
    if (n === 1 && neighbors === 0) {
      if (isHonor(k)) {
        if (isValue) {
          cons.push(
            isDragon(k)
              ? 'è un drago: se ne peschi altri due fai un tris che vale punti e 1 raddoppio'
              : `è un vento che vale per te (${k - 27 === seatWind ? 'proprio vento' : 'vento di giro'})`,
          )
          score -= 6
          if (vis[k] >= 2) {
            pros.push(`ne sono già uscite ${vis[k] - 1}: difficile farne un tris`)
            score += 8
          }
        } else {
          pros.push(`è un vento (${WIND_NAMES[k - 27]}) che per te non vale punti e da solo non forma combinazioni`)
          score += 5
        }
      } else {
        pros.push('è isolata: nessuna pedina vicina dello stesso seme')
        score += rankOf(k) === 1 || rankOf(k) === 9 ? 4 : 2
      }
    }
    if (n >= 2) {
      if (isValue) {
        cons.push(`rompi una coppia di valore (${tileName(k)}): il tris varrebbe punti e 1 raddoppio`)
        score -= 18
      } else cons.push('rompi una coppia')
    }
    if (isSuit(k) && n === 1 && neighbors > 0 && (rankOf(k) === 1 || rankOf(k) === 9)) {
      pros.push('le pedine di estremità (1 e 9) formano meno scale')
      score += 1
    }
    // mano pura
    if (flushChase && isSuit(k)) {
      if (suitIndex(k) !== domSuit) {
        pros.push(`stai raccogliendo ${SUIT_NAMES[SUITS[domSuit]]}: liberarti degli altri semi avvicina la mano pura (1 raddoppio) o purissima (3)`)
        score += 12
      } else {
        cons.push(`è del seme che stai raccogliendo (${SUIT_NAMES[SUITS[domSuit]]})`)
        score -= 8
      }
    }
    // difesa
    let danger = 0
    for (const tt of th) {
      const sf = safety(s, person, k, tt, vis)
      const name = s.players[tt.person].name
      if (sf.safe) {
        if (u.base >= 1) pros.push(`pedina sicura contro ${name}: ${sf.why}`)
        continue
      }
      let lvl = tt.level
      if (tt.suits !== undefined && isSuit(k) && suitIndex(k) === tt.suits) lvl += 1
      if (tt.suits !== undefined && isSuit(k) && suitIndex(k) !== tt.suits) lvl -= 1
      if (lvl <= 0) continue
      danger += lvl
      cons.push(`rischiosa: ${name} ${tt.reason}${tt.suits !== undefined ? ` e raccoglie ${SUIT_NAMES[SUITS[tt.suits]]}` : ''}, e questa pedina non è ancora uscita`)
    }
    const defWeight = u.base >= 2 ? 14 : u.base === 1 ? 8 : 3
    score -= danger * defWeight

    out.push({ tile: t, kind: k, shanten: u.base, ukeire: u.total, useful: u.useful, danger, score, pros, cons })
  }
  out.sort((a, b) => b.score - a.score)
  return out
}

export function usefulText(a: DiscardAnalysis): string {
  if (a.shanten < 0) return ''
  const names = a.useful.slice(0, 6).map(tileName)
  const more = a.useful.length > 6 ? ` e altre ${a.useful.length - 6}` : ''
  return `${a.ukeire} pedine utili ancora in gioco (${names.join(', ')}${more})`
}

/** Spiegazione in italiano del consiglio di scarto. */
export function explainBest(list: DiscardAnalysis[]): { title: string; bullets: string[] } {
  const best = list[0]
  const bullets: string[] = []
  bullets.push(`Dopo lo scarto ${shantenText(best.shanten)}.`)
  if (best.ukeire) bullets.push(`Restano ${usefulText(best)}.`)
  for (const p of best.pros) bullets.push(p[0].toUpperCase() + p.slice(1) + '.')
  for (const c of best.cons) bullets.push('Da sapere: ' + c + '.')
  const second = list.find((x) => x.kind !== best.kind)
  if (second) {
    if (second.shanten > best.shanten)
      bullets.push(`Scartando ${tileName(second.kind)} invece ti allontaneresti dalla chiusura (${shantenText(second.shanten)}).`)
    else if (second.ukeire < best.ukeire)
      bullets.push(`Con ${tileName(second.kind)} avresti meno pedine utili (${second.ukeire} invece di ${best.ukeire}).`)
    else if (second.danger > best.danger) bullets.push(`${tileName(second.kind)} sarebbe più pericolosa da scartare.`)
  }
  return { title: `Scarta ${tileName(best.kind)}`, bullets }
}

// ---------- Chiamate ----------

export interface ClaimAdvice {
  option: ClaimOption
  recommend: boolean
  reason: string
}

export function adviseClaim(s: GameState, person: number, opt: ClaimOption): ClaimAdvice {
  const pl = s.players[person]
  const tile = s.pendingKong?.tile ?? s.lastDiscard!.tile
  if (opt.type === 'mahjong') return { option: opt, recommend: true, reason: 'Con questa pedina chiudi: chiama Mah-Jong!' }
  const counts = countsOf(kindsOf(pl.hand))
  const before = shanten(counts, pl.melds.length)
  const c2 = counts.slice()
  if (opt.type === 'pung') c2[tile.k] -= 2
  else if (opt.type === 'kong') c2[tile.k] -= 3
  else for (const k of [opt.chowStart!, opt.chowStart! + 1, opt.chowStart! + 2]) if (k !== tile.k) c2[k]--
  let after: number
  if (opt.type === 'kong') after = shanten(c2, pl.melds.length + 1)
  else {
    after = 99
    for (let k = 0; k < NUM_KINDS; k++) {
      if (!c2[k]) continue
      c2[k]--
      after = Math.min(after, shanten(c2, pl.melds.length + 1))
      c2[k]++
    }
  }
  const { seatWind, roundWind } = ctxOf(s, person)
  const value = valueKind(tile.k, seatWind, roundWind)
  const concealedNow = pl.melds.every((m) => m.concealed)
  if (after < before) {
    return {
      option: opt,
      recommend: true,
      reason: `Ti avvicina alla chiusura: prima ${shantenText(before)}, dopo ${shantenText(after)}.${value ? ' In più è un tris di valore (punti e 1 raddoppio).' : ''}${concealedNow ? ' Perdi però la possibilità del "tutto pescato".' : ''}`,
    }
  }
  if (after === before && (opt.type === 'pung' || opt.type === 'kong')) {
    if (value)
      return { option: opt, recommend: true, reason: 'Non ti allontana dalla chiusura e il tris di ' + tileName(tile.k) + ' vale punti e 1 raddoppio.' }
    if (opt.type === 'kong')
      return { option: opt, recommend: true, reason: 'Il poker vale molti punti e peschi una pedina in più dal tetto.' }
    return { option: opt, recommend: false, reason: 'Non ti avvicina alla chiusura: meglio tenere la mano coperta (i tris coperti valgono il doppio).' }
  }
  return {
    option: opt,
    recommend: false,
    reason: `Non conviene: ${after > before ? 'ti allontaneresti dalla chiusura' : 'non migliori la mano'} e scopriresti le tue pedine.`,
  }
}

// ---------- Decisioni dei bot ----------

export function botClaim(s: GameState, person: number, level: Level): ClaimOption | null {
  const opts = s.claims[person] ?? []
  const mj = opts.find((o) => o.type === 'mahjong')
  if (mj) return mj
  let best: ClaimOption | null = null
  for (const o of opts) {
    const a = adviseClaim(s, person, o)
    if (a.recommend && (!best || o.type === 'kong' || (o.type === 'pung' && best.type === 'chow'))) best = o
  }
  if (level === 'facile' && best && Math.random() < 0.3) return null
  return best
}

export type TurnAction = { type: 'tsumo' } | { type: 'ckong'; kind: Kind } | { type: 'akong'; kind: Kind } | { type: 'discard'; tileId: number }

export function botTurn(s: GameState, person: number, level: Level): TurnAction {
  if (canTsumo(s, person)) return { type: 'tsumo' }
  const pl = s.players[person]
  if (pl.richi && s.drawn) return { type: 'discard', tileId: s.drawn.id }
  const counts = countsOf(kindsOf(pl.hand))
  const cur = shanten(counts, pl.melds.length) // con 14 pedine
  for (const k of concealedKongOptions(s, person)) {
    const c = counts.slice()
    c[k] -= 4
    if (shanten(c, pl.melds.length + 1) <= cur + 0) return { type: 'ckong', kind: k }
  }
  for (const k of addKongOptions(s, person)) {
    const c = counts.slice()
    c[k] -= 1
    if (shanten(c, pl.melds.length) <= cur) return { type: 'akong', kind: k }
  }
  const list = analyzeDiscards(s, person)
  let pick = list[0]
  if (level === 'facile' && list.length > 2) {
    const r = Math.random()
    pick = r < 0.55 ? list[0] : r < 0.85 ? list[1] : list[2]
  }
  return { type: 'discard', tileId: pick.tile.id }
}

export function windLabel(s: GameState, p: number) {
  return WIND_NAMES[windOf(s, p)]
}

export { isWind }
