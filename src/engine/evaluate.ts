// Dalla mano reale (pedine) al punteggio migliore: sceglie la scomposizione più vantaggiosa.
import { type SMeld, decompositions, isNineGates, specialShapes, meldKinds, isSevenPairs, valueKind } from './hand'
import { type MassimoId, type ScoreResult, type WinContext, scoreHand, DEFAULT_LIMIT } from './scoring'
import { type Kind, NUM_KINDS, countsOf, isSuit, rankOf } from './tiles'

export interface EvalInput {
  concealed: Kind[] // pedine coperte in mano (per il vincitore: inclusa la pedina di chiusura)
  exposed: SMeld[] // combinazioni in stecca (poker coperti con concealed=true)
  flowers: Kind[]
  seatWind: number
  roundWind: number
}

export interface WinEval extends EvalInput {
  winTile: Kind
  win: WinContext
  heavenly?: boolean // Uscita degli Dei
}

const effective = (r: ScoreResult) => (r.massimo ? r.massimo.value * 10 : Math.min(r.value, DEFAULT_LIMIT))

export function evaluateWinner(e: WinEval): { result: ScoreResult; melds: SMeld[] } | null {
  const counts = countsOf(e.concealed)
  const need = 4 - e.exposed.length
  const candidates: { result: ScoreResult; melds: SMeld[] }[] = []
  const base = { flowers: e.flowers, seatWind: e.seatWind, roundWind: e.roundWind, winner: true }
  const heavenly: MassimoId | undefined = e.heavenly ? 'usciteDei' : undefined

  if (need >= 0) {
    for (const dec of decompositions(counts, need)) {
      const groups: SMeld[] = [
        ...dec.sets.map((s) => ({ type: s.type, tile: s.tile, concealed: true }) as SMeld),
        { type: 'pair', tile: dec.pair, concealed: true },
      ]
      // quale gruppo è stato completato dalla pedina di chiusura?
      const idxs = groups
        .map((g, i) => (meldKinds(g).includes(e.winTile) ? i : -1))
        .filter((i) => i >= 0)
      for (const i of idxs) {
        const melds = groups.map((g, j) => (j === i && !e.win.selfDrawn ? { ...g, concealed: false } : g))
        const all = [...e.exposed, ...melds]
        const win: WinContext = { ...e.win, bottled: e.exposed.length === 4 && groups[i].type === 'pair' }
        let massimo: MassimoId | undefined = heavenly
        if (!massimo && e.exposed.length === 0 && isNineGates(counts)) massimo = 'novePezzi'
        candidates.push({ result: scoreHand({ ...base, melds: all, win, massimo }), melds: all })
      }
    }
  }
  const chowKinds = e.exposed.every((m) => m.type === 'chow') ? e.exposed.flatMap(meldKinds) : null
  const special = specialShapes(counts, e.exposed.length, chowKinds, e)
  for (const sp of special) {
    if (sp === 'sevenPairs') {
      const melds: SMeld[] = []
      for (let k = 0; k < NUM_KINDS; k++) if (counts[k] === 2) melds.push({ type: 'pair', tile: k, concealed: true })
      candidates.push({ result: scoreHand({ ...base, melds, win: e.win, massimo: heavenly }), melds })
    } else {
      candidates.push({ result: scoreHand({ ...base, melds: e.exposed, win: e.win, massimo: sp }), melds: e.exposed })
    }
  }
  if (!candidates.length) return null
  candidates.sort((a, b) => effective(b.result) - effective(a.result))
  return candidates[0]
}

/** Punti di stecca per chi non ha chiuso: si scelgono le combinazioni che valgono di più. */
export function evaluateLoser(e: EvalInput): { result: ScoreResult; melds: SMeld[] } {
  const c = countsOf(e.concealed)
  let best: { result: ScoreResult; melds: SMeld[] } | null = null
  const picked: SMeld[] = []
  const base = { flowers: e.flowers, seatWind: e.seatWind, roundWind: e.roundWind, winner: false }
  const rec = (i: number) => {
    while (i < NUM_KINDS && c[i] === 0) i++
    if (i >= NUM_KINDS) {
      const melds = [...e.exposed, ...picked]
      const result = scoreHand({ ...base, melds })
      if (!best || result.value > best.result.value) best = { result, melds }
      return
    }
    if (c[i] >= 3) {
      c[i] -= 3
      picked.push({ type: 'pung', tile: i, concealed: true })
      rec(i)
      picked.pop()
      c[i] += 3
    }
    if (isSuit(i) && rankOf(i) <= 7 && c[i + 1] && c[i + 2]) {
      c[i]--, c[i + 1]--, c[i + 2]--
      picked.push({ type: 'chow', tile: i, concealed: true })
      rec(i)
      picked.pop()
      c[i]++, c[i + 1]++, c[i + 2]++
    }
    if (c[i] >= 2 && valueKind(i, e.seatWind, e.roundWind)) {
      c[i] -= 2
      picked.push({ type: 'pair', tile: i, concealed: true })
      rec(i)
      picked.pop()
      c[i] += 2
    }
    const save = c[i]
    c[i] = 0
    rec(i + 1)
    c[i] = save
  }
  rec(0)
  return best!
}

export { isSevenPairs }
