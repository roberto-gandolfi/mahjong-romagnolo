import { Tile } from './Tile'
import { type Kind } from '../engine/tiles'

const GROUPS: { label: string; kinds: Kind[] }[] = [
  { label: 'Caratteri', kinds: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  { label: 'Canne', kinds: [9, 10, 11, 12, 13, 14, 15, 16, 17] },
  { label: 'Palle', kinds: [18, 19, 20, 21, 22, 23, 24, 25, 26] },
  { label: 'Venti e draghi', kinds: [27, 28, 29, 30, 31, 32, 33] },
]

export function TilePicker({ allowed, onPick, selected }: { allowed?: (k: Kind) => boolean; onPick: (k: Kind) => void; selected?: Kind }) {
  return (
    <div className="space-y-3">
      {GROUPS.map((g) => {
        const ks = g.kinds.filter((k) => !allowed || allowed(k))
        if (!ks.length) return null
        return (
          <div key={g.label}>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">{g.label}</div>
            <div className="flex flex-wrap gap-1">
              {ks.map((k) => (
                <Tile key={k} k={k} size="sm" selected={selected === k} onClick={() => onPick(k)} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
