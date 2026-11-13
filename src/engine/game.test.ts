import { describe, expect, it } from 'vitest'
import { type GameState, newGame, nextHand, isGameOver } from './game'
import { autoStep, makeExercise } from './auto'

const step = (s: GameState) => autoStep(s)

const tileTotal = (s: GameState) =>
  s.wall.length +
  s.tetto.length +
  s.players.reduce(
    (a, p) => a + p.hand.length + p.flowers.length + p.melds.reduce((b, m) => b + m.tiles.length, 0) + p.discards.filter((d) => !d.claimed).length,
    0,
  ) + (s.pendingKong ? 1 : 0)

describe('partite simulate tra bot', () => {
  it('giocano 40 manche senza errori e i conti tornano', () => {
    let wins = 0
    let draws = 0
    for (let seed = 1; seed <= 10; seed++) {
      let s = newGame(['A', 'B', 'C', 'D'], 4, seed)
      for (;;) {
        let guard = 0
        while (s.phase !== 'ended') {
          s = step(s)
          if (s.phase !== 'ended' && s.phase !== 'claim') expect(tileTotal(s)).toBe(144)
          if (++guard > 2000) throw new Error('loop infinito')
        }
        if (s.result!.type === 'mahjong') wins++
        else draws++
        const net = s.result!.settlement?.net ?? [0, 0, 0, 0]
        expect(net.reduce((a, b) => a + b, 0)).toBe(0)
        if (isGameOver(s)) break
        s = nextHand(s)
      }
    }
    expect(wins).toBeGreaterThan(10)
    console.log('mah-jong', wins, 'patte', draws)
  }, 60000)
})

describe('esercizi', () => {
  it('genera situazioni in cui tocca a te scartare', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const s = makeExercise(seed)
      expect(s.phase).toBe('turn')
      expect(s.current).toBe(0)
    }
  })
})
