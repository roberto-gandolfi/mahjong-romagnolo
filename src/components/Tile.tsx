import { memo, type ReactNode } from 'react'
import { type Kind, isSuit, isWind, isDragon, isFlower, rankOf, suitIndex, bonusNumber, tileShort, tileName, WIND_LETTERS } from '../engine/tiles'
import { useSettings } from '../settings'

const BLUE = '#1f4e9c'
const GREEN = '#1d7a4c'
const RED = '#c0392b'
const INK = '#1d2b3a'
const HAN = "'Noto Serif SC','SimSun','Songti SC','Microsoft YaHei',serif"

const NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
const WINDS = ['東', '南', '西', '北']
const FLOWERS = ['梅', '蘭', '菊', '竹']
const SEASONS = ['春', '夏', '秋', '冬']

function Dot({ x, y, r, c }: { x: number; y: number; r: number; c: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={c} />
      <circle cx={x} cy={y} r={r * 0.66} fill="#fbf7ec" />
      <circle cx={x} cy={y} r={r * 0.36} fill={c} />
    </g>
  )
}

const DOTS: Record<number, [number, number, string][]> = {
  2: [
    [30, 24, GREEN],
    [30, 56, BLUE],
  ],
  3: [
    [16, 17, BLUE],
    [30, 40, RED],
    [44, 63, GREEN],
  ],
  4: [
    [18, 22, BLUE],
    [42, 22, GREEN],
    [18, 58, GREEN],
    [42, 58, BLUE],
  ],
  5: [
    [16, 18, BLUE],
    [44, 18, GREEN],
    [30, 40, RED],
    [16, 62, GREEN],
    [44, 62, BLUE],
  ],
  6: [
    [19, 16, GREEN],
    [41, 16, GREEN],
    [19, 42, RED],
    [41, 42, RED],
    [19, 64, RED],
    [41, 64, RED],
  ],
  7: [
    [14, 12, GREEN],
    [30, 21, GREEN],
    [46, 30, GREEN],
    [19, 48, RED],
    [41, 48, RED],
    [19, 66, RED],
    [41, 66, RED],
  ],
  8: [
    [19, 12, BLUE],
    [41, 12, BLUE],
    [19, 30, BLUE],
    [41, 30, BLUE],
    [19, 50, BLUE],
    [41, 50, BLUE],
    [19, 68, BLUE],
    [41, 68, BLUE],
  ],
  9: [
    [15, 16, BLUE],
    [30, 16, BLUE],
    [45, 16, BLUE],
    [15, 40, RED],
    [30, 40, RED],
    [45, 40, RED],
    [15, 64, GREEN],
    [30, 64, GREEN],
    [45, 64, GREEN],
  ],
}
const DOT_R: Record<number, number> = { 2: 11, 3: 9, 4: 9, 5: 8, 6: 8, 7: 7, 8: 7, 9: 7 }

function Circles({ n }: { n: number }) {
  if (n === 1)
    return (
      <g>
        <circle cx={30} cy={40} r={21} fill={GREEN} />
        <circle cx={30} cy={40} r={17} fill="#fbf7ec" />
        <circle cx={30} cy={40} r={13} fill={BLUE} />
        <circle cx={30} cy={40} r={9} fill="#fbf7ec" />
        <circle cx={30} cy={40} r={6} fill={RED} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4
          return <circle key={i} cx={30 + Math.cos(a) * 15} cy={40 + Math.sin(a) * 15} r={1.6} fill={RED} />
        })}
      </g>
    )
  return (
    <g>
      {DOTS[n].map(([x, y, c], i) => (
        <Dot key={i} x={x} y={y} r={DOT_R[n]} c={c} />
      ))}
    </g>
  )
}

function Stick({ x, y, h, c }: { x: number; y: number; h: number; c: string }) {
  return (
    <g>
      <rect x={x - 3.6} y={y} width={7.2} height={h} rx={3.2} fill={c} />
      <rect x={x - 4.4} y={y + h / 2 - 1.3} width={8.8} height={2.6} rx={1.2} fill={c} />
      <rect x={x - 4.4} y={y - 0.6} width={8.8} height={2.4} rx={1.2} fill={c} />
      <rect x={x - 4.4} y={y + h - 1.8} width={8.8} height={2.4} rx={1.2} fill={c} />
      <line x1={x} y1={y + 3} x2={x} y2={y + h - 3} stroke="#fbf7ec" strokeOpacity={0.5} strokeWidth={1.2} />
    </g>
  )
}

const STICKS: Record<number, [number, number, number, string][]> = {
  2: [
    [30, 10, 27, BLUE],
    [30, 43, 27, GREEN],
  ],
  3: [
    [30, 10, 27, BLUE],
    [19, 43, 27, GREEN],
    [41, 43, 27, GREEN],
  ],
  4: [
    [19, 10, 27, BLUE],
    [41, 10, 27, GREEN],
    [19, 43, 27, GREEN],
    [41, 43, 27, BLUE],
  ],
  5: [
    [15, 10, 27, GREEN],
    [45, 10, 27, BLUE],
    [30, 27, 26, RED],
    [15, 43, 27, BLUE],
    [45, 43, 27, GREEN],
  ],
  6: [
    [15, 10, 27, GREEN],
    [30, 10, 27, GREEN],
    [45, 10, 27, GREEN],
    [15, 43, 27, BLUE],
    [30, 43, 27, BLUE],
    [45, 43, 27, BLUE],
  ],
  7: [
    [30, 6, 20, RED],
    [15, 30, 20, GREEN],
    [30, 30, 20, GREEN],
    [45, 30, 20, GREEN],
    [15, 54, 20, GREEN],
    [30, 54, 20, GREEN],
    [45, 54, 20, GREEN],
  ],
  8: [
    [12, 10, 27, GREEN],
    [24, 10, 27, GREEN],
    [36, 10, 27, GREEN],
    [48, 10, 27, GREEN],
    [12, 43, 27, BLUE],
    [24, 43, 27, BLUE],
    [36, 43, 27, BLUE],
    [48, 43, 27, BLUE],
  ],
  9: [
    [15, 7, 19, GREEN],
    [30, 7, 19, RED],
    [45, 7, 19, BLUE],
    [15, 30.5, 19, GREEN],
    [30, 30.5, 19, RED],
    [45, 30.5, 19, BLUE],
    [15, 54, 19, GREEN],
    [30, 54, 19, RED],
    [45, 54, 19, BLUE],
  ],
}

function Bird() {
  return (
    <g>
      {/* coda */}
      <path d="M30 46 Q14 62 10 74 Q22 66 30 56 Q38 66 50 74 Q46 62 30 46Z" fill={RED} opacity={0.9} />
      <path d="M30 48 Q24 64 22 74 Q28 66 30 58 Q32 66 38 74 Q36 64 30 48Z" fill={BLUE} />
      {/* corpo */}
      <ellipse cx={30} cy={38} rx={11} ry={14} fill={GREEN} />
      <path d="M22 34 Q14 40 18 52 Q24 44 26 38Z" fill="#145c38" />
      <path d="M38 34 Q46 40 42 52 Q36 44 34 38Z" fill="#145c38" />
      {/* testa */}
      <circle cx={30} cy={19} r={7} fill={GREEN} />
      <circle cx={32.5} cy={18} r={1.6} fill="#fbf7ec" />
      <path d="M36 19 L42 21 L36 22Z" fill={RED} />
      <path d="M28 12 Q30 6 33 11" stroke={RED} strokeWidth={2} fill="none" />
    </g>
  )
}

function Bamboo({ n }: { n: number }) {
  if (n === 1) return <Bird />
  return (
    <g>
      {STICKS[n].map(([x, y, h, c], i) => (
        <Stick key={i} x={x} y={y} h={h} c={c} />
      ))}
    </g>
  )
}

function Han({ ch, y, size, color }: { ch: string; y: number; size: number; color: string }) {
  return (
    <text x={30} y={y} fontSize={size} textAnchor="middle" fill={color} fontFamily={HAN} fontWeight={900}>
      {ch}
    </text>
  )
}

function Face({ k }: { k: Kind }): ReactNode {
  if (isSuit(k)) {
    const n = rankOf(k)
    const s = suitIndex(k)
    if (s === 0)
      return (
        <g>
          <Han ch={NUM[n - 1]} y={33} size={25} color={INK} />
          <Han ch="萬" y={70} size={31} color={RED} />
          <text x={6} y={13} fontSize={9} fill={INK} fontWeight={800} fontFamily="Inter, sans-serif">
            {n}
          </text>
        </g>
      )
    return s === 1 ? <Bamboo n={n} /> : <Circles n={n} />
  }
  if (isWind(k))
    return (
      <g>
        <Han ch={WINDS[k - 27]} y={56} size={38} color={INK} />
        <text x={7} y={15} fontSize={11} fill={RED} fontWeight={800} fontFamily="Inter, sans-serif">
          {WIND_LETTERS[k - 27]}
        </text>
      </g>
    )
  if (isDragon(k)) {
    if (k === 31) return <Han ch="中" y={56} size={42} color={RED} />
    if (k === 32) return <Han ch="發" y={56} size={40} color={GREEN} />
    return (
      <g>
        <rect x={12} y={14} width={36} height={52} rx={3} fill="none" stroke={BLUE} strokeWidth={4} />
        <rect x={18} y={20} width={24} height={40} rx={2} fill="none" stroke={BLUE} strokeWidth={1.6} />
      </g>
    )
  }
  const flower = isFlower(k)
  const num = bonusNumber(k)
  const col = flower ? RED : BLUE
  return (
    <g>
      <Han ch={(flower ? FLOWERS : SEASONS)[num - 1]} y={50} size={30} color={flower ? GREEN : col} />
      <text x={7} y={15} fontSize={12} fill={col} fontWeight={800} fontFamily="Inter, sans-serif">
        {num}
      </text>
      {flower ? (
        <g transform="translate(30 64)">
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 4} cy={Math.sin((a * Math.PI) / 180) * 4} r={3} fill="#e07a8e" />
          ))}
          <circle r={2} fill="#e7b955" />
        </g>
      ) : (
        <g transform="translate(30 64)">
          <circle r={5} fill="none" stroke={BLUE} strokeWidth={1.5} />
          <circle r={1.8} fill={BLUE} />
        </g>
      )}
    </g>
  )
}

export type TileSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
const WIDTH: Record<TileSize, number> = { xs: 20, sm: 30, md: 42, lg: 52, xl: 72 }

interface TileProps {
  k: Kind
  size?: TileSize
  back?: boolean
  selected?: boolean
  highlight?: boolean
  dim?: boolean
  label?: boolean
  onClick?: () => void
  title?: string
  w?: number
}

function TileImpl({ k, size = 'md', back, selected, highlight, dim, label, onClick, title, w: wOverride }: TileProps) {
  const { showLabels } = useSettings()
  const w = wOverride ?? WIDTH[size]
  const h = Math.round((w * 80) / 60)
  const showLabel = !back && (label ?? (showLabels && w >= 26))
  const svg = (
    <svg
      viewBox="0 0 60 80"
      width={w}
      height={h}
      className="tile-svg block"
      role="img"
      aria-label={back ? 'pedina coperta' : tileName(k)}
    >
      <g>
        {back ? (
          <>
            <rect x={1} y={1} width={58} height={78} rx={8} fill="#e9dfc4" />
            <rect x={1} y={1} width={58} height={74} rx={8} fill="#167a62" />
            <rect x={6} y={6} width={48} height={64} rx={5} fill="none" stroke="#7fd1b5" strokeOpacity={0.45} strokeWidth={1.5} />
            <path d="M30 22 L40 38 L30 54 L20 38Z" fill="none" stroke="#7fd1b5" strokeOpacity={0.45} strokeWidth={1.5} />
          </>
        ) : (
          <>
            <rect x={1} y={1} width={58} height={78} rx={8} fill="#1f7a62" />
            <rect x={1} y={1} width={58} height={75} rx={8} fill="#fbf7ec" stroke="#d9cfb4" strokeWidth={1} />
            <Face k={k} />
          </>
        )}
      </g>
    </svg>
  )
  const body = (
    <span className={`inline-flex flex-col items-center ${dim ? 'opacity-40' : ''}`} title={title ?? (back ? undefined : tileName(k))}>
      <span className={`${highlight ? 'tile-hl' : ''} inline-block`}>{svg}</span>
      {showLabel && (
        <span className="mt-0.5 text-[10px] leading-none font-medium text-muted whitespace-nowrap" style={{ maxWidth: w + 10 }}>
          {tileShort(k)}
        </span>
      )}
    </span>
  )
  if (!onClick) return body
  return (
    <button type="button" onClick={onClick} className={`tile-btn cursor-pointer ${selected ? 'tile-selected' : ''} focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded-lg`}>
      {body}
    </button>
  )
}

export const Tile = memo(TileImpl)

export function TileRow({ kinds, size = 'sm', gap = 'gap-0.5', label }: { kinds: Kind[]; size?: TileSize; gap?: string; label?: boolean }) {
  return (
    <span className={`inline-flex flex-wrap items-end ${gap}`}>
      {kinds.map((k, i) => (
        <Tile key={i} k={k} size={size} label={label} />
      ))}
    </span>
  )
}
