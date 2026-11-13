// Avanzamento automatico della partita (tutti i giocatori guidati dal computer).
import { type GameState, draw, discard, resolveClaims, tsumo, declareConcealedKong, declareAddKong, mustEndAfterLastTile, newGame, canTsumo } from './game'
import { type Level, botClaim, botTurn } from './ai'

export function autoStep(s: GameState, level: Level = 'normale'): GameState {
  switch (s.phase) {
    case 'draw':
      return draw(s)
    case 'turn': {
      if (mustEndAfterLastTile(s)) return discard(s, s.players[s.current].hand[0].id)
      const a = botTurn(s, s.current, level)
      if (a.type === 'tsumo') return tsumo(s)
      if (a.type === 'ckong') return declareConcealedKong(s, a.kind)
      if (a.type === 'akong') return declareAddKong(s, a.kind)
      return discard(s, a.tileId)
    }
    case 'claim': {
      const dec: Record<number, ReturnType<typeof botClaim>> = {}
      for (const p of Object.keys(s.claims).map(Number)) dec[p] = botClaim(s, p, level)
      return resolveClaims(s, dec)
    }
    default:
      return s
  }
}

/** Crea una situazione di gioco realistica in cui tocca scartare al giocatore 0. */
export function makeExercise(seed: number): GameState {
  for (let attempt = 0; attempt < 30; attempt++) {
    let s = newGame(['Tu', 'Gigi', 'Pina', 'Tonino'], 1, seed + attempt * 1009)
    const stopAt = 40 + ((seed + attempt) % 35) // pedine rimaste nel muro
    let guard = 0
    while (s.phase !== 'ended' && guard++ < 600) {
      if (s.phase === 'turn' && s.current === 0 && s.wall.length <= stopAt && !canTsumo(s) && !s.players[0].richi) return s
      s = autoStep(s)
    }
  }
  return newGame(['Tu', 'Gigi', 'Pina', 'Tonino'], 1, seed)
}
