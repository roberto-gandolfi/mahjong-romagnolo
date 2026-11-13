import { describe, expect, it } from 'vitest'
import { parseKinds as P, countsOf } from './tiles'
import { isWinningHand, shanten, waitingKinds, decompositions } from './hand'
import { scoreHand, settle } from './scoring'
import { evaluateWinner, evaluateLoser } from './evaluate'

const ctx = { seatWind: 0, roundWind: 0 }

describe('riconoscimento mano', () => {
  it('mano standard', () => {
    expect(isWinningHand(P('c1 c2 c3 c4 c5 c6 b7 b8 b9 p5 p5 p5 R R'), [], ctx)).toBe(true)
    expect(isWinningHand(P('c1 c2 c3 c4 c5 c6 b7 b8 b9 p5 p5 p5 R G'), [], ctx)).toBe(false)
  })
  it('sette coppie e 13 lanterne', () => {
    expect(isWinningHand(P('c1 c1 c3 c3 b5 b5 b7 b7 p2 p2 E E R R'), [], ctx)).toBe(true)
    expect(isWinningHand(P('c1 c9 b1 b9 p1 p9 E S W N R G B B'), [], ctx)).toBe(true)
  })
  it('shanten e attese', () => {
    expect(shanten(countsOf(P('c1 c2 c3 c4 c5 c6 b7 b8 b9 p5 p5 p5 R R')), 0)).toBe(-1)
    expect(shanten(countsOf(P('c1 c2 c3 c4 c5 c6 b7 b8 b9 p5 p5 p5 R')), 0)).toBe(0)
    expect(waitingKinds(P('c1 c2 c3 c4 c5 c6 b7 b8 b9 p5 p5 p5 R'), [], ctx)).toEqual(P('R'))
    expect(waitingKinds(P('c2 c3 c4 c5 b7 b8 b9 p5 p5 p5 R R R'), [], ctx).sort()).toEqual(P('c2 c5'))
  })
  it('scomposizioni multiple', () => {
    expect(decompositions(countsOf(P('c1 c1 c1 c2 c2 c2 c3 c3 c3 b5 b5 b5 R R')), 4).length).toBe(2)
  })
})

describe('punteggio', () => {
  it('mano della partita guidata', () => {
    const r = scoreHand({
      melds: [
        { type: 'pung', tile: P('R')[0], concealed: false },
        { type: 'chow', tile: P('p7')[0], concealed: false },
        { type: 'chow', tile: P('c2')[0], concealed: true },
        { type: 'chow', tile: P('b5')[0], concealed: true },
        { type: 'pair', tile: P('p1')[0], concealed: true },
      ],
      flowers: P('f1'),
      seatWind: 0,
      roundWind: 0,
      winner: true,
      win: { selfDrawn: false },
    })
    expect(r.base).toBe(8)
    expect(r.subtotal).toBe(28)
    expect(r.totalDoubles).toBe(2)
    expect(r.value).toBe(112)
  })

  it('valutazione automatica dalla mano', () => {
    const r = evaluateWinner({
      concealed: P('c2 c3 c4 b5 b6 b7 p1 p1'),
      exposed: [
        { type: 'pung', tile: P('R')[0], concealed: false },
        { type: 'chow', tile: P('p7')[0], concealed: false },
      ],
      flowers: P('f1'),
      seatWind: 0,
      roundWind: 0,
      winTile: P('p1')[0],
      win: { selfDrawn: false },
    })!
    expect(r.result.value).toBe(112)
  })

  it('tris completato con scarto conta scoperto', () => {
    const r = evaluateWinner({
      concealed: P('c2 c3 c4 b5 b6 b7 c8 c8 c8 p3 p4 p5 E E'),
      exposed: [],
      flowers: [],
      seatWind: 1,
      roundWind: 0,
      winTile: P('c8')[0],
      win: { selfDrawn: false },
    })!
    // il tris di 8 vale 2 (scoperto) e non c'è "tutto pescato"
    expect(r.result.base).toBe(2 + 2)
    expect(r.result.doubles.map((x) => x.id)).not.toContain('concealed')
  })

  it('massimo: 13 lanterne', () => {
    const r = evaluateWinner({
      concealed: P('c1 c9 b1 b9 p1 p9 E S W N R G B B'),
      exposed: [],
      flowers: [],
      seatWind: 1,
      roundWind: 0,
      winTile: P('B')[0],
      win: { selfDrawn: true },
    })!
    expect(r.result.massimo?.value).toBe(2000)
  })

  it('mano purissima e tutti tris', () => {
    const r = evaluateWinner({
      concealed: P('c1 c1 c1 c4 c4 c4 c6 c6 c6 c8 c8 c8 c9 c9'),
      exposed: [],
      flowers: [],
      seatWind: 1,
      roundWind: 0,
      winTile: P('c9')[0],
      win: { selfDrawn: true },
    })!
    const ids = r.result.doubles.map((x) => x.id)
    expect(ids).toContain('purest')
    expect(ids).toContain('allPungs')
    expect(ids).toContain('hidden4')
    expect(ids).toContain('concealed')
  })

  it('stecca del non vincente', () => {
    const r = evaluateLoser({ concealed: P('R R R c2 c3 c4 b1 b1 b1 E E p3 p7'), exposed: [], flowers: P('f2'), seatWind: 0, roundWind: 0 })
    // tris rosso coperto 8 + tris 1 canne coperto 8 + coppia est (proprio e giro) 4 + fiore 4 = 24
    expect(r.result.base).toBe(24)
  })
})

describe('pagamenti', () => {
  it('esempio del regolamento: differenze di stecca', () => {
    const s = settle([
      { name: 'EST', wind: 0, winner: false, value: 32 },
      { name: 'SUD', wind: 1, winner: false, value: 18 },
      { name: 'OVEST', wind: 2, winner: false, value: 64 },
      { name: 'NORD', wind: 3, winner: true, value: 100 },
    ])
    const t = (f: number, to: number) => s.transfers.find((x) => x.from === f && x.to === to)?.amount
    expect(t(0, 3)).toBe(200) // EST paga doppio al vincitore
    expect(t(1, 3)).toBe(100)
    expect(t(1, 0)).toBe(30) // 14*2 = 28 → 30
    expect(t(0, 2)).toBe(60) // 32*2 = 64 → 60
    expect(t(1, 2)).toBe(50) // 46 → 50
  })
  it('limite', () => {
    const s = settle([
      { name: 'A', wind: 0, winner: true, value: 5000 },
      { name: 'B', wind: 1, winner: false, value: 0 },
      { name: 'C', wind: 2, winner: false, value: 0 },
      { name: 'D', wind: 3, winner: false, value: 0 },
    ])
    expect(s.net[0]).toBe(6000)
  })
})
