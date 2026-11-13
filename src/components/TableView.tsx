import { useEffect, useState, type ReactNode } from 'react'
import { Tile } from './Tile'
import { type Kind, type Tile as T, WIND_NAMES } from '../engine/tiles'

export interface MeldView {
  type: 'chow' | 'pung' | 'kong'
  kinds: Kind[]
  concealed: boolean
}
export interface SeatView {
  name: string
  wind: number
  handCount: number
  melds: MeldView[]
  flowers: Kind[]
  discards: { k: Kind; claimed: boolean }[]
  isTurn: boolean
  richi?: boolean
  reveal?: Kind[]
  highlightDiscard?: boolean
  bubble?: string
}

function useWidth() {
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 1024 : window.innerWidth))
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

function MeldsRow({ melds, flowers, size }: { melds: MeldView[]; flowers: Kind[]; size: 'xs' | 'sm' }) {
  if (!melds.length && !flowers.length) return null
  return (
    <div className="flex flex-wrap items-end gap-1.5">
      {melds.map((m, i) => (
        <span key={i} className="inline-flex gap-px rounded-md bg-black/15 p-0.5">
          {m.kinds.map((k, j) => (
            <Tile key={j} k={k} size={size} back={m.concealed && m.type === 'kong' && (j === 0 || j === 3)} label={false} />
          ))}
        </span>
      ))}
      {flowers.length > 0 && (
        <span className="inline-flex gap-px rounded-md bg-gold-400/30 p-0.5">
          {flowers.map((k) => (
            <Tile key={k} k={k} size={size} label={false} />
          ))}
        </span>
      )}
    </div>
  )
}

function Discards({ list, highlightLast, size = 'xs' }: { list: SeatView['discards']; highlightLast?: boolean; size?: 'xs' | 'sm' }) {
  if (!list.length) return <div className="text-[11px] italic text-white/50">nessuno scarto</div>
  return (
    <div className="flex flex-wrap gap-px">
      {list.map((d, i) => (
        <Tile key={i} k={d.k} size={size} dim={d.claimed} highlight={highlightLast && i === list.length - 1} label={false} />
      ))}
    </div>
  )
}

function Opponent({ s, align = 'left' }: { s: SeatView; align?: 'left' | 'center' }) {
  return (
    <div className={`relative rounded-xl p-2 transition ${s.isTurn ? 'bg-white/15 ring-2 ring-gold-400' : 'bg-black/10'} ${align === 'center' ? 'text-center' : ''}`}>
      <div className={`mb-1 flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : ''}`}>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${s.wind === 0 ? 'bg-cinnabar-500 text-white' : 'bg-white/20 text-white'}`}>{WIND_NAMES[s.wind]}</span>
        <span className="truncate text-sm font-semibold text-white">{s.name}</span>
        <span className="text-[11px] text-white/70">· {s.handCount}</span>
        {s.richi && <span className="rounded bg-gold-400 px-1 text-[10px] font-bold text-jade-950">RICHI</span>}
      </div>
      {s.reveal ? (
        <div className={`mb-1 flex flex-wrap gap-px ${align === 'center' ? 'justify-center' : ''}`}>
          {s.reveal.map((k, i) => (
            <Tile key={i} k={k} size="xs" label={false} />
          ))}
        </div>
      ) : (
        <div className={`mb-1 flex flex-wrap gap-px ${align === 'center' ? 'justify-center' : ''}`}>
          {Array.from({ length: Math.min(s.handCount, 14) }, (_, i) => (
            <span key={i} className="h-3.5 w-1.5 rounded-[2px] bg-jade-500 shadow-[0_1px_0_#e9dfc4] sm:w-2" />
          ))}
        </div>
      )}
      <div className={`mb-1 ${align === 'center' ? 'flex justify-center' : ''}`}>
        <MeldsRow melds={s.melds} flowers={s.flowers} size="xs" />
      </div>
      <div className={align === 'center' ? 'flex justify-center' : ''}>
        <Discards list={s.discards} highlightLast={s.highlightDiscard} />
      </div>
      {s.bubble && (
        <div className="pop-in absolute -top-3 right-2 rounded-full bg-gold-400 px-2.5 py-0.5 text-xs font-extrabold text-jade-950 shadow">{s.bubble}</div>
      )}
    </div>
  )
}

export interface TableViewProps {
  right: SeatView
  top: SeatView
  left: SeatView
  me: Omit<SeatView, 'handCount'> & { hand: T[]; drawnId?: number }
  wallCount: number
  tettoCount: number
  roundWind: number
  lastDiscard?: { k: Kind; from: string }
  highlightIds?: number[]
  highlightKinds?: Kind[]
  selectedId?: number
  dimIds?: number[]
  onTileClick?: (t: T) => void
  centerNote?: ReactNode
  actions?: ReactNode
  coach?: ReactNode
}

export function TableView(p: TableViewProps) {
  const vw = useWidth()
  const hand = p.me.hand
  const drawn = p.me.drawnId !== undefined ? hand.find((t) => t.id === p.me.drawnId) : undefined
  const rest = drawn ? hand.filter((t) => t.id !== drawn.id) : hand
  const avail = Math.min(vw, 1100) - 40
  const oneRow = Math.floor(avail / (hand.length + 1.2))
  // su schermi stretti meglio due righe di pedine grandi che una riga di pedine minuscole
  const twoRows = oneRow < 32
  const tw = twoRows ? Math.min(44, Math.floor(avail / (Math.ceil(hand.length / 2) + 0.8))) : Math.min(50, oneRow)

  const renderTile = (t: T) => (
    <Tile
      key={t.id}
      k={t.k}
      w={tw}
      selected={p.selectedId === t.id}
      highlight={p.highlightIds?.includes(t.id) || p.highlightKinds?.includes(t.k)}
      dim={p.dimIds?.includes(t.id)}
      onClick={p.onTileClick ? () => p.onTileClick!(t) : undefined}
    />
  )

  return (
    <div className="space-y-2">
      <div className="felt rounded-3xl p-2 shadow-inner sm:p-3">
        <div className="mx-auto max-w-md">
          <Opponent s={p.top} align="center" />
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          <Opponent s={p.left} />
          <div className="flex min-w-[84px] flex-col items-center gap-1 rounded-xl bg-black/20 px-2 py-2 text-center text-white sm:min-w-[120px]">
            <div className="text-[10px] uppercase tracking-wider text-white/60">Vento di giro</div>
            <div className="text-sm font-extrabold">{WIND_NAMES[p.roundWind]}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-white/60">Muro</div>
            <div className="text-lg leading-none font-extrabold tabular-nums">{p.wallCount}</div>
            <div className="text-[10px] text-white/60">tetto {p.tettoCount}</div>
            {p.lastDiscard && (
              <div className="mt-1 flex flex-col items-center">
                <Tile k={p.lastDiscard.k} size={vw < 640 ? 'sm' : 'md'} highlight label={false} />
                <div className="mt-0.5 max-w-[90px] truncate text-[10px] text-white/70">da {p.lastDiscard.from}</div>
              </div>
            )}
            {p.centerNote}
          </div>
          <Opponent s={p.right} />
        </div>
        <div className="mt-2 rounded-xl bg-black/10 p-2">
          <div className="mb-1 flex items-center gap-1.5">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${p.me.wind === 0 ? 'bg-cinnabar-500 text-white' : 'bg-white/20 text-white'}`}>
              {WIND_NAMES[p.me.wind]}
            </span>
            <span className="text-sm font-semibold text-white">{p.me.name}</span>
            {p.me.richi && <span className="rounded bg-gold-400 px-1 text-[10px] font-bold text-jade-950">RICHI</span>}
            {p.me.isTurn && <span className="ml-auto text-xs font-bold text-gold-400">● tocca a te</span>}
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <MeldsRow melds={p.me.melds} flowers={p.me.flowers} size="sm" />
            <div className="min-w-0 flex-1">
              <Discards list={p.me.discards} highlightLast={p.me.highlightDiscard} />
            </div>
          </div>
        </div>
      </div>

      {p.coach}

      <div className="surface rounded-2xl px-2 py-3">
        <div className={`flex items-end justify-center gap-[2px] ${twoRows ? 'flex-wrap gap-y-2' : ''}`}>
          {rest.map(renderTile)}
          {drawn && <span className="ml-2 border-l-2 border-dashed border-soft pl-2">{renderTile(drawn)}</span>}
        </div>
        {p.actions && <div className="mt-3 flex flex-wrap justify-center gap-2">{p.actions}</div>}
      </div>
    </div>
  )
}
