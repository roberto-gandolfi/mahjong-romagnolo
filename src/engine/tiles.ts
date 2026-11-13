// Modello delle tessere (pedine) secondo il regolamento FIMJ.
// Tipi 0..33 = tessere giocabili, 34..41 = Fiori e Stagioni.
//  0..8   Caratteri 1-9
//  9..17  Canne (Bambù) 1-9
//  18..26 Palle (Circoli) 1-9
//  27..30 Venti: Est, Sud, Ovest, Nord
//  31..33 Draghi: Rosso, Verde, Bianco
//  34..37 Fiori 1-4
//  38..41 Stagioni 1-4

export type Kind = number

export interface Tile {
  id: number // 0..143, identifica la singola pedina fisica
  k: Kind
}

export const SUITS = ['c', 'b', 'p'] as const
export type Suit = (typeof SUITS)[number]

export const SUIT_NAMES: Record<Suit, string> = { c: 'Caratteri', b: 'Canne', p: 'Palle' }
export const SUIT_ALT: Record<Suit, string> = { c: 'Caratteri', b: 'Bambù o Canne', p: 'Circoli o Palle' }

export const WIND_NAMES = ['Est', 'Sud', 'Ovest', 'Nord'] as const
export const WIND_LETTERS = ['E', 'S', 'W', 'N'] as const
export const DRAGON_NAMES = ['Rosso', 'Verde', 'Bianco'] as const

export const EAST = 27
export const RED = 31
export const GREEN = 32
export const WHITE = 33
export const FLOWER0 = 34
export const SEASON0 = 38
export const NUM_KINDS = 34

export const isSuit = (k: Kind) => k >= 0 && k < 27
export const isWind = (k: Kind) => k >= 27 && k <= 30
export const isDragon = (k: Kind) => k >= 31 && k <= 33
export const isHonor = (k: Kind) => k >= 27 && k <= 33
export const isBonus = (k: Kind) => k >= 34 // fiore o stagione
export const isFlower = (k: Kind) => k >= 34 && k <= 37
export const isSeason = (k: Kind) => k >= 38 && k <= 41
export const suitOf = (k: Kind): Suit | null => (isSuit(k) ? SUITS[Math.floor(k / 9)] : null)
export const suitIndex = (k: Kind) => Math.floor(k / 9)
export const rankOf = (k: Kind) => (isSuit(k) ? (k % 9) + 1 : 0)
export const windIndex = (k: Kind) => k - 27
export const bonusNumber = (k: Kind) => ((k - 34) % 4) + 1
/** Pedina "di testa": tutti gli 1 e 9, i venti e i draghi. */
export const isHead = (k: Kind) => isHonor(k) || rankOf(k) === 1 || rankOf(k) === 9
export const isSimple = (k: Kind) => isSuit(k) && !isHead(k)
export const kindOf = (suit: Suit, rank: number) => SUITS.indexOf(suit) * 9 + rank - 1
export const windKind = (w: number) => 27 + w

export function tileName(k: Kind): string {
  if (isSuit(k)) return `${rankOf(k)} di ${SUIT_NAMES[suitOf(k)!]}`
  if (isWind(k)) return `Vento ${WIND_NAMES[windIndex(k)]}`
  if (isDragon(k)) return `Drago ${DRAGON_NAMES[k - 31]}`
  if (isFlower(k)) return `Fiore ${bonusNumber(k)}`
  return `Stagione ${bonusNumber(k)}`
}

export function tileShort(k: Kind): string {
  if (isSuit(k)) return `${rankOf(k)} ${['Car', 'Can', 'Pal'][suitIndex(k)]}`
  if (isWind(k)) return WIND_NAMES[windIndex(k)]
  if (isDragon(k)) return DRAGON_NAMES[k - 31]
  if (isFlower(k)) return `Fiore ${bonusNumber(k)}`
  return `Stag. ${bonusNumber(k)}`
}

/** Le 144 pedine del set. */
export function fullSet(): Tile[] {
  const tiles: Tile[] = []
  let id = 0
  for (let k = 0; k < NUM_KINDS; k++) for (let c = 0; c < 4; c++) tiles.push({ id: id++, k })
  for (let k = 34; k <= 41; k++) tiles.push({ id: id++, k })
  return tiles
}

export function sortKinds(a: Kind, b: Kind) {
  return a - b
}
export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => a.k - b.k || a.id - b.id)
}

/** Generatore pseudo-casuale con seme (mulberry32) per partite riproducibili. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Rappresentazione compatta per test e script: "c1 c2 b5 p9 E S W N R G B f1 s1". */
export function parseKinds(s: string): Kind[] {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => {
      const ch = t[0]
      const n = Number(t.slice(1))
      if (ch === 'c' || ch === 'b' || ch === 'p') return kindOf(ch, n)
      if (t === 'E') return 27
      if (t === 'S') return 28
      if (t === 'W') return 29
      if (t === 'N') return 30
      if (t === 'R') return 31
      if (t === 'G') return 32
      if (t === 'B') return 33
      if (ch === 'f') return 33 + n
      if (ch === 's') return 37 + n
      throw new Error('Tessera sconosciuta: ' + t)
    })
}

export function countsOf(kinds: Kind[]): number[] {
  const c = new Array(NUM_KINDS).fill(0)
  for (const k of kinds) if (k < NUM_KINDS) c[k]++
  return c
}
