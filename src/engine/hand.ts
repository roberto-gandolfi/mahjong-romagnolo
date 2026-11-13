// Analisi della mano: scomposizioni, riconoscimento del Mah-Jong, distanza dalla chiusura (shanten).
import {
  type Kind,
  NUM_KINDS,
  countsOf,
  isHead,
  isSuit,
  rankOf,
  suitIndex,
  isDragon,
  isWind,
  windKind,
} from './tiles'

export type MeldType = 'chow' | 'pung' | 'kong' | 'pair'

/** Combinazione usata per il conteggio. `tile` è la prima pedina (per la scala, la più bassa). */
export interface SMeld {
  type: MeldType
  tile: Kind
  concealed: boolean
}

export function meldKinds(m: { type: MeldType; tile: Kind }): Kind[] {
  switch (m.type) {
    case 'chow':
      return [m.tile, m.tile + 1, m.tile + 2]
    case 'pung':
      return [m.tile, m.tile, m.tile]
    case 'kong':
      return [m.tile, m.tile, m.tile, m.tile]
    case 'pair':
      return [m.tile, m.tile]
  }
}

export interface Decomposition {
  sets: { type: 'chow' | 'pung'; tile: Kind }[]
  pair: Kind
}

/** Tutte le scomposizioni di `counts` in `setsNeeded` combinazioni + 1 coppia. */
export function decompositions(counts: number[], setsNeeded: number): Decomposition[] {
  const out: Decomposition[] = []
  const c = counts.slice()
  const total = c.reduce((a, b) => a + b, 0)
  if (total !== setsNeeded * 3 + 2) return out
  for (let p = 0; p < NUM_KINDS; p++) {
    if (c[p] < 2) continue
    c[p] -= 2
    const sets: Decomposition['sets'] = []
    const rec = (i: number) => {
      while (i < NUM_KINDS && c[i] === 0) i++
      if (i >= NUM_KINDS) {
        if (sets.length === setsNeeded) out.push({ sets: sets.slice(), pair: p })
        return
      }
      if (c[i] >= 3) {
        c[i] -= 3
        sets.push({ type: 'pung', tile: i })
        rec(i)
        sets.pop()
        c[i] += 3
      }
      if (isSuit(i) && rankOf(i) <= 7 && c[i + 1] > 0 && c[i + 2] > 0) {
        c[i]--
        c[i + 1]--
        c[i + 2]--
        sets.push({ type: 'chow', tile: i })
        rec(i)
        sets.pop()
        c[i]++
        c[i + 1]++
        c[i + 2]++
      }
    }
    rec(0)
    c[p] += 2
  }
  return out
}

// ---------- Forme speciali (massimi e 7 coppie) ----------

export function isSevenPairs(counts: number[]): boolean {
  let pairs = 0
  for (const n of counts) {
    if (n === 2) pairs++
    else if (n !== 0) return false
  }
  return pairs === 7
}

const HEADS = Array.from({ length: NUM_KINDS }, (_, k) => k).filter(isHead)

export function isThirteenLanterns(counts: number[]): boolean {
  let dup = false
  for (let k = 0; k < NUM_KINDS; k++) {
    if (isHead(k)) {
      if (counts[k] === 0) return false
      if (counts[k] === 2) {
        if (dup) return false
        dup = true
      } else if (counts[k] !== 1) return false
    } else if (counts[k] !== 0) return false
  }
  return dup
}

/** Due serpenti siamesi: due semi diversi dall'1 al 7 (14 pedine, senza coppia). */
export function isSiamese(counts: number[]): boolean {
  let suitsOk = 0
  for (let s = 0; s < 3; s++) {
    const seg = counts.slice(s * 9, s * 9 + 9)
    const empty = seg.every((n) => n === 0)
    const ok = seg.slice(0, 7).every((n) => n === 1) && seg[7] === 0 && seg[8] === 0
    if (ok) suitsOk++
    else if (!empty) return false
  }
  for (let k = 27; k < NUM_KINDS; k++) if (counts[k]) return false
  return suitsOk === 2
}

/** Piccolo serpente: 1..9 di un seme + un esemplare di ogni vento + un drago. */
export function isLittleSnake(counts: number[]): boolean {
  let suitOk = 0
  for (let s = 0; s < 3; s++) {
    const seg = counts.slice(s * 9, s * 9 + 9)
    if (seg.every((n) => n === 1)) suitOk++
    else if (!seg.every((n) => n === 0)) return false
  }
  if (suitOk !== 1) return false
  for (let w = 27; w <= 30; w++) if (counts[w] !== 1) return false
  const dragons = counts[31] + counts[32] + counts[33]
  return dragons === 1
}

/** Serpente dei draghi: 1-4-7, 2-5-8, 3-6-9 in tre semi diversi + i 3 draghi + coppia del vento di giro o proprio. */
export function isDragonSnake(counts: number[], seatWind: number, roundWind: number): boolean {
  if (counts[31] !== 1 || counts[32] !== 1 || counts[33] !== 1) return false
  const winds = [27, 28, 29, 30].filter((w) => counts[w] > 0)
  if (winds.length !== 1 || counts[winds[0]] !== 2) return false
  if (winds[0] !== windKind(seatWind) && winds[0] !== windKind(roundWind)) return false
  const patterns: number[] = []
  for (let s = 0; s < 3; s++) {
    const seg = counts.slice(s * 9, s * 9 + 9)
    let found = -1
    for (let start = 0; start < 3; start++) {
      const want = seg.map((_, i) => (i % 3 === start ? 1 : 0))
      if (want.every((v, i) => v === seg[i])) found = start
    }
    if (found < 0) return false
    patterns.push(found)
  }
  return new Set(patterns).size === 3
}

/** Casa piena dei 9 pezzi: 1112345678999 + una pedina dello stesso seme. */
export function isNineGates(counts: number[]): boolean {
  for (let s = 0; s < 3; s++) {
    const seg = counts.slice(s * 9, s * 9 + 9)
    const tot = seg.reduce((a, b) => a + b, 0)
    if (tot === 0) continue
    if (tot !== 14) return false
    const base = [3, 1, 1, 1, 1, 1, 1, 1, 3]
    return base.every((b, i) => seg[i] >= b)
  }
  return false
}

export interface ShapeContext {
  seatWind: number
  roundWind: number
}

/** Forme speciali che chiudono senza 4 combinazioni + coppia. */
export function specialShapes(counts: number[], exposedCount: number, exposedAllChowsKinds: Kind[] | null, ctx: ShapeContext) {
  const res: ('sevenPairs' | 'tredici' | 'siamesi' | 'serpenteDraghi' | 'piccoloSerpente')[] = []
  if (exposedCount === 0) {
    if (isSevenPairs(counts)) res.push('sevenPairs')
    if (isThirteenLanterns(counts)) res.push('tredici')
    if (isSiamese(counts)) res.push('siamesi')
    if (isDragonSnake(counts, ctx.seatWind, ctx.roundWind)) res.push('serpenteDraghi')
  }
  // Il piccolo serpente ammette scale chiamate
  if (exposedAllChowsKinds) {
    const all = counts.slice()
    for (const k of exposedAllChowsKinds) all[k]++
    if (isLittleSnake(all)) res.push('piccoloSerpente')
  }
  return res
}

export interface ExposedLike {
  type: MeldType
  tile: Kind
}

/** La mano (pedine coperte + combinazioni esposte) è un Mah-Jong valido? */
export function isWinningHand(concealed: Kind[], exposed: ExposedLike[], ctx: ShapeContext): boolean {
  const counts = countsOf(concealed)
  const need = 4 - exposed.length
  if (need >= 0 && decompositions(counts, need).length > 0) return true
  const chowsOnly = exposed.every((m) => m.type === 'chow') ? exposed.flatMap((m) => meldKinds(m)) : null
  return specialShapes(counts, exposed.length, chowsOnly, ctx).length > 0
}

// ---------- Shanten: quante pedine mancano per essere "a punto" ----------

// Per ogni gruppo (un seme o un onore) si calcola, per ogni numero di combinazioni s (0..4)
// e presenza della coppia q (0/1), il massimo numero di parziali p. Tabella: best[q*5+s] = p, -1 se impossibile.
const groupMemo = new Map<number, Int8Array>()

function groupOptions(c: number[], from: number, len: number, allowChow: boolean): Int8Array {
  let key = allowChow ? 0 : 1
  for (let i = 0; i < len; i++) key = key * 5 + c[from + i]
  key = key * 2 + (allowChow ? 1 : 0)
  const hit = groupMemo.get(key)
  if (hit) return hit
  const seg = c.slice(from, from + len)
  const n = len
  const best = new Int8Array(10).fill(-1)
  const rec = (i: number, s: number, p: number, q: number) => {
    while (i < n && seg[i] === 0) i++
    if (i >= n) {
      const idx = q * 5 + Math.min(s, 4)
      const pp = Math.min(p, 8)
      if (pp > best[idx]) best[idx] = pp
      return
    }
    if (seg[i] >= 3) {
      seg[i] -= 3
      rec(i, s + 1, p, q)
      seg[i] += 3
    }
    if (allowChow && i + 2 < n && seg[i + 1] && seg[i + 2]) {
      seg[i]--, seg[i + 1]--, seg[i + 2]--
      rec(i, s + 1, p, q)
      seg[i]++, seg[i + 1]++, seg[i + 2]++
    }
    if (seg[i] >= 2) {
      seg[i] -= 2
      if (!q) rec(i, s, p, 1)
      rec(i, s, p + 1, q)
      seg[i] += 2
    }
    if (allowChow && i + 1 < n && seg[i + 1]) {
      seg[i]--, seg[i + 1]--
      rec(i, s, p + 1, q)
      seg[i]++, seg[i + 1]++
    }
    if (allowChow && i + 2 < n && seg[i + 2]) {
      seg[i]--, seg[i + 2]--
      rec(i, s, p + 1, q)
      seg[i]++, seg[i + 2]++
    }
    seg[i]--
    rec(i, s, p, q)
    seg[i]++
  }
  rec(0, 0, 0, 0)
  groupMemo.set(key, best)
  return best
}

const cur = new Int8Array(10)
const nxt = new Int8Array(10)

function combine(g: Int8Array) {
  nxt.fill(-1)
  for (let a = 0; a < 10; a++) {
    if (cur[a] < 0) continue
    const qa = a >= 5 ? 1 : 0
    const sa = a - qa * 5
    for (let b = 0; b < 10; b++) {
      if (g[b] < 0) continue
      const qb = b >= 5 ? 1 : 0
      if (qa && qb) continue
      const sb = b - qb * 5
      const idx = (qa | qb) * 5 + Math.min(sa + sb, 4)
      const p = Math.min(cur[a] + g[b], 8)
      if (p > nxt[idx]) nxt[idx] = p
    }
  }
  cur.set(nxt)
}

/** Shanten per la forma standard. -1 = Mah-Jong, 0 = a punto. */
export function shantenStandard(counts: number[], exposedCount: number): number {
  const k = 4 - exposedCount
  cur.fill(-1)
  cur[0] = 0
  combine(groupOptions(counts, 0, 9, true))
  combine(groupOptions(counts, 9, 9, true))
  combine(groupOptions(counts, 18, 9, true))
  for (let h = 27; h < NUM_KINDS; h++) if (counts[h]) combine(groupOptions(counts, h, 1, false))
  let best = 2 * k
  for (let a = 0; a < 10; a++) {
    if (cur[a] < 0) continue
    const q = a >= 5 ? 1 : 0
    const s = Math.min(a - q * 5, k)
    const pp = Math.min(cur[a], k - s)
    const v = 2 * k - 2 * s - pp - q
    if (v < best) best = v
  }
  return best
}

export function shantenSevenPairs(counts: number[]): number {
  let pairs = 0
  let kinds = 0
  for (const n of counts) {
    if (n >= 2) pairs++
    if (n >= 1) kinds++
  }
  return 6 - pairs + Math.max(0, 7 - kinds)
}

export function shantenThirteen(counts: number[]): number {
  let distinct = 0
  let pair = 0
  for (const k of HEADS) {
    if (counts[k] > 0) distinct++
    if (counts[k] >= 2) pair = 1
  }
  return 13 - distinct - pair
}

export function shanten(counts: number[], exposedCount: number, includeSpecial = true): number {
  let s = shantenStandard(counts, exposedCount)
  if (includeSpecial && exposedCount === 0) {
    s = Math.min(s, shantenSevenPairs(counts), shantenThirteen(counts))
  }
  return s
}

/** Pedine che completano la mano (13 pedine coperte + esposte). */
export function waitingKinds(concealed: Kind[], exposed: ExposedLike[], ctx: ShapeContext): Kind[] {
  const counts = countsOf(concealed)
  const res: Kind[] = []
  for (let k = 0; k < NUM_KINDS; k++) {
    if (counts[k] >= 4) continue
    if (isWinningHand([...concealed, k], exposed, ctx)) res.push(k)
  }
  return res
}

export const valueKind = (k: Kind, seatWind: number, roundWind: number) =>
  isDragon(k) || (isWind(k) && (k === windKind(seatWind) || k === windKind(roundWind)))

export { suitIndex }
