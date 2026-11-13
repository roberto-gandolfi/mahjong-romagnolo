import { TileRow } from './Tile'
import { Badge } from './ui'
import { type ScoreResult, type Settlement, DEFAULT_LIMIT } from '../engine/scoring'
import { WIND_NAMES } from '../engine/tiles'

export function ScoreRecap({ r, name, wind, winner, compact }: { r: ScoreResult; name: string; wind: number; winner: boolean; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${winner ? 'border-gold-400 bg-amber-50/60 dark:bg-amber-950/20' : 'border-soft surface'}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-bold">{name}</span>
        <Badge tone={wind === 0 ? 'red' : 'gray'}>{WIND_NAMES[wind]}</Badge>
        {winner && <Badge tone="gold">Mah-Jong</Badge>}
        <span className="ml-auto text-lg font-extrabold">{r.massimo ? r.massimo.value : r.value} pt</span>
      </div>

      {r.massimo ? (
        <div className="rounded-xl bg-gold-400/20 p-3 text-sm">
          <b>Massimo: {r.massimo.name}</b> — vale {r.massimo.value} punti ({r.massimo.value * 2} se c'è di mezzo EST), indipendentemente dal conteggio.
        </div>
      ) : (
        <>
          <div className="divide-y divide-[var(--border)] text-sm">
            {r.lines.map((l, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                {!compact && (
                  <span className="shrink-0">
                    <TileRow kinds={l.kinds} size="xs" />
                  </span>
                )}
                <span className="flex-1">
                  {l.label}
                  {l.note && <span className="block text-xs text-muted">{l.note}</span>}
                </span>
                <span className={`font-semibold tabular-nums ${l.points ? '' : 'text-muted'}`}>{l.points}</span>
              </div>
            ))}
            {r.lines.length === 0 && <div className="py-1.5 text-muted">Nessuna combinazione con punti.</div>}
            {winner && (
              <div className="flex items-center gap-2 py-1.5">
                <span className="flex-1">Bonus Mah-Jong</span>
                <span className="font-semibold tabular-nums">20</span>
              </div>
            )}
            <div className="flex items-center gap-2 py-1.5 font-bold">
              <span className="flex-1">Totale punti</span>
              <span className="tabular-nums">{r.subtotal}</span>
            </div>
          </div>

          {r.doubles.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Raddoppi</div>
              <div className="flex flex-col gap-1 text-sm">
                {r.doubles.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1">
                      {d.label}
                      {d.note && <span className="text-muted"> · {d.note}</span>}
                    </span>
                    <span className="font-semibold">+{d.count}</span>
                  </div>
                ))}
              </div>
              {!r.doublesApplied && <div className="mt-1 text-xs text-muted">Con meno di 2 punti i raddoppi non si applicano.</div>}
            </div>
          )}

          <div className="mt-3 rounded-xl surface-2 p-3 text-sm">
            <span className="text-muted">Calcolo: </span>
            <b className="tabular-nums">
              {r.subtotal}
              {r.totalDoubles > 0 && ` × 2${r.totalDoubles > 1 ? `^${r.totalDoubles}` : ''} (= ×${2 ** r.totalDoubles})`} = {r.value}
            </b>
            {r.value > DEFAULT_LIMIT && <div className="mt-1 text-xs">Supera il limite: si pagano {DEFAULT_LIMIT} punti ({DEFAULT_LIMIT * 2} con EST).</div>}
          </div>
        </>
      )}
      {r.warnings.map((w, i) => (
        <div key={i} className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-200">
          ⚠ {w}
        </div>
      ))}
    </div>
  )
}

export function SettlementView({ s, names }: { s: Settlement; names: string[] }) {
  return (
    <div className="space-y-3">
      <div className="divide-y divide-[var(--border)] rounded-2xl border border-soft">
        {s.transfers.length === 0 && <div className="p-3 text-sm text-muted">Nessun pagamento.</div>}
        {s.transfers.map((t, i) => (
          <div key={i} className="flex items-start gap-3 p-3 text-sm">
            <div className="flex-1">
              <div className="font-semibold">
                {names[t.from]} <span className="text-muted">paga</span> {names[t.to]}
              </div>
              <div className="text-xs text-muted">{t.explain}</div>
            </div>
            <div className="font-bold tabular-nums">{t.amount}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {s.net.map((n, i) => (
          <div key={i} className="rounded-xl surface-2 p-3 text-center">
            <div className="truncate text-xs text-muted">{names[i]}</div>
            <div className={`text-lg font-extrabold tabular-nums ${n > 0 ? 'text-jade-600 dark:text-jade-300' : n < 0 ? 'text-cinnabar-500' : ''}`}>
              {n > 0 ? '+' : ''}
              {n}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
