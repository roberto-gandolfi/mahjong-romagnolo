import { useState } from 'react'
import { Button } from './ui'
import { WIND_NAMES } from '../engine/tiles'

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
const roll = () => 1 + Math.floor(Math.random() * 6)

function DicePair({ a, b, onRoll, label }: { a: number; b: number; onRoll: () => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-4xl leading-none">
        {FACES[a - 1]}
        {FACES[b - 1]}
      </span>
      <Button size="sm" variant="secondary" onClick={onRoll}>
        {label}
      </Button>
    </div>
  )
}

/** Calcola muro e punto della breccia dai tiri di dadi (anche inserendo i tiri del set vero). */
export function DiceHelper() {
  const [r1, setR1] = useState<[number, number]>([3, 4])
  const [r2, setR2] = useState<[number, number]>([2, 5])
  const s1 = r1[0] + r1[1]
  const s2 = r2[0] + r2[1]
  const wall = (s1 - 1) % 4
  const total = s1 + s2
  const pair = total > 18 ? total - 18 : total
  const cycle = (v: number) => (v % 6) + 1
  return (
    <div className="mt-3 space-y-3 rounded-2xl surface-2 p-4">
      <div className="text-sm font-semibold">Calcolatore della breccia</div>
      <div>
        <div className="mb-1 text-xs text-muted">1° tiro (EST): {s1}</div>
        <DicePair a={r1[0]} b={r1[1]} onRoll={() => setR1([roll(), roll()])} label="Tira" />
        <div className="mt-1 flex gap-1 text-xs">
          <button type="button" className="underline cursor-pointer" onClick={() => setR1([cycle(r1[0]), r1[1]])}>
            cambia 1° dado
          </button>
          ·
          <button type="button" className="underline cursor-pointer" onClick={() => setR1([r1[0], cycle(r1[1])])}>
            cambia 2° dado
          </button>
        </div>
      </div>
      <div>
        <div className="mb-1 text-xs text-muted">2° tiro ({WIND_NAMES[wall].toUpperCase()}): {s2}</div>
        <DicePair a={r2[0]} b={r2[1]} onRoll={() => setR2([roll(), roll()])} label="Tira" />
        <div className="mt-1 flex gap-1 text-xs">
          <button type="button" className="underline cursor-pointer" onClick={() => setR2([cycle(r2[0]), r2[1]])}>
            cambia 1° dado
          </button>
          ·
          <button type="button" className="underline cursor-pointer" onClick={() => setR2([r2[0], cycle(r2[1])])}>
            cambia 2° dado
          </button>
        </div>
      </div>
      <div className="rounded-xl bg-jade-700 p-3 text-sm text-white">
        Apri la breccia nel muro di <b>{WIND_NAMES[wall].toUpperCase()}</b>, contando <b>{pair} coppie</b> da destra verso sinistra
        {total > 18 ? ` (${total} supera 18: si riparte dall'inizio del muro)` : ''}. Il primo tiro indica anche il vento di giro: <b>{WIND_NAMES[wall]}</b>.
      </div>
      <p className="text-xs text-muted">Puoi anche riprodurre i tiri fatti con i dadi veri usando "cambia dado".</p>
    </div>
  )
}
