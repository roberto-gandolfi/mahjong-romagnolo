import { useMemo, useState, type ReactNode } from 'react'
import { TableView, type MeldView, type SeatView } from '../components/TableView'
import { Button, Callout } from '../components/ui'
import { ScoreRecap, SettlementView } from '../components/ScoreRecap'
import { useLessonProgress } from './Learn'
import { type Kind, type Tile, parseKinds, tileName } from '../engine/tiles'
import { scoreHand, settle } from '../engine/scoring'

const K = (s: string) => parseKinds(s)[0]

interface Opp {
  name: string
  wind: number
  discards: { k: Kind; claimed: boolean }[]
}
interface TS {
  hand: Kind[]
  drawn?: Kind
  melds: MeldView[]
  flowers: Kind[]
  discards: { k: Kind; claimed: boolean }[]
  opp: Opp[] // 0 = SUD (destra), 1 = OVEST (fronte), 2 = NORD (sinistra)
  wall: number
  tetto: number
  last?: { k: Kind; from: string }
  turn: number // 0 = tu, 1 = SUD, 2 = OVEST, 3 = NORD
}

type Action = { type: 'next' } | { type: 'button'; label: string; gold?: boolean } | { type: 'discard'; kind: Kind; wrong: string }

interface Step {
  title: string
  text: ReactNode
  action: Action
  highlight?: Kind[]
  after?: (s: TS) => void
}

const sortK = (a: Kind[]) => [...a].sort((x, y) => x - y)
const remove = (arr: Kind[], ...ks: Kind[]) => {
  const a = [...arr]
  for (const k of ks) a.splice(a.indexOf(k), 1)
  return a
}
const oppDiscard = (s: TS, i: number, k: Kind) => {
  s.wall--
  s.opp[i].discards.push({ k, claimed: false })
  s.last = { k, from: s.opp[i].name }
  s.turn = i + 1
}

const INITIAL: TS = {
  hand: sortK(parseKinds('c2 c3 c4 b5 b6 p7 p7 p8 R R N c9 p1 f1')),
  melds: [],
  flowers: [],
  discards: [],
  opp: [
    { name: 'SUD', wind: 1, discards: [] },
    { name: 'OVEST', wind: 2, discards: [] },
    { name: 'NORD', wind: 3, discards: [] },
  ],
  wall: 77,
  tetto: 14,
  turn: 0,
}

const STEPS: Step[] = [
  {
    title: 'Benvenuto al tavolo',
    text: (
      <>
        Tu sei <b>EST</b>, il giocatore che inizia. <b>SUD</b> è alla tua destra, <b>OVEST</b> di fronte, <b>NORD</b> alla tua sinistra. Si gioca in senso <b>antiorario</b>: dopo di te tocca a SUD.
        <br />
        In basso ci sono le tue pedine: EST parte con <b>14</b>, gli altri con 13.
      </>
    ),
    action: { type: 'next' },
  },
  {
    title: 'Muro e tetto',
    text: (
      <>
        Al centro vedi quante pedine restano nel <b>muro</b> (77): da lì si pesca ogni turno. Il <b>tetto</b> (14 pedine) serve solo per sostituire fiori, stagioni e poker. Quando il muro finisce senza vincitori, la manche è patta.
      </>
    ),
    action: { type: 'next' },
  },
  {
    title: 'Hai un fiore!',
    text: (
      <>
        Il <b>Fiore 1</b> non si gioca: si espone subito e si pesca una pedina dal tetto. Vale 4 punti e, essendo il numero del tuo vento (EST = 1), anche <b>1 raddoppio</b>!
      </>
    ),
    highlight: [K('f1')],
    action: { type: 'button', label: 'Esponi il fiore' },
    after: (s) => {
      s.hand = sortK([...remove(s.hand, K('f1')), K('b7')])
      s.flowers = [K('f1')]
      s.tetto--
    },
  },
  {
    title: 'Leggi la tua mano',
    text: (
      <>
        Dal tetto hai pescato il <b>7 di Canne</b>. Guarda cosa hai già: due <b>scale</b> fatte (2-3-4 di Caratteri e 5-6-7 di Canne), una <b>coppia</b> di Draghi Rossi e una coppia di 7 di Palle con l'8 vicino. Il Vento Nord, il 9 di Caratteri e l'1 di Palle sono <b>isolati</b>.
      </>
    ),
    highlight: parseKinds('c2 c3 c4 b5 b6 b7'),
    action: { type: 'next' },
  },
  {
    title: 'Il primo scarto',
    text: (
      <>
        EST comincia scartando. Scarta il <b>Vento Nord</b>: è da solo e per te non vale punti (non è il tuo vento e non è il vento di giro). <i>Tocca la pedina.</i>
      </>
    ),
    highlight: [K('N')],
    action: { type: 'discard', kind: K('N'), wrong: 'Prova con il Vento Nord: è isolato e non ti dà punti. Le altre pedine possono ancora servirti.' },
    after: (s) => {
      s.hand = remove(s.hand, K('N'))
      s.discards.push({ k: K('N'), claimed: false })
      oppDiscard(s, 0, K('b1'))
    },
  },
  {
    title: 'Tocca agli altri',
    text: (
      <>
        <b>SUD</b> ha pescato dal muro (vedi che il muro scende a 76) e ha scartato l'<b>1 di Canne</b>. A te non serve: non hai pedine vicine.
      </>
    ),
    action: { type: 'next' },
    after: (s) => oppDiscard(s, 1, K('R')),
  },
  {
    title: 'Chiama il tris!',
    text: (
      <>
        <b>OVEST</b> ha scartato il <b>Drago Rosso</b>. Tu hai già due Rossi: puoi <b>chiamarlo</b> e fare un tris. Il tris si può chiamare dallo scarto di <b>qualsiasi</b> giocatore. Un tris di drago vale 4 punti e 1 raddoppio.
      </>
    ),
    highlight: [K('R')],
    action: { type: 'button', label: 'Tris!' },
    after: (s) => {
      s.hand = remove(s.hand, K('R'), K('R'))
      s.melds.push({ type: 'pung', kinds: parseKinds('R R R'), concealed: false })
      s.opp[1].discards[s.opp[1].discards.length - 1].claimed = true
      s.last = undefined
      s.turn = 0
    },
  },
  {
    title: 'Ora scarta tu',
    text: (
      <>
        Il tris chiamato va <b>esposto</b> davanti a te. Non peschi: la pedina presa sostituisce la pescata, quindi scarti subito. <b>NORD ha perso il turno</b>: dopo di te gioca SUD.
        <br />
        Scarta il <b>9 di Caratteri</b>: è isolato e un 9 forma poche scale.
      </>
    ),
    highlight: [K('c9')],
    action: { type: 'discard', kind: K('c9'), wrong: 'Per questa volta scarta il 9 di Caratteri: è isolato. L’1 di Palle lo teniamo: tra poco capirai perché.' },
    after: (s) => {
      s.hand = remove(s.hand, K('c9'))
      s.discards.push({ k: K('c9'), claimed: false })
      oppDiscard(s, 0, K('p5'))
      oppDiscard(s, 1, K('c7'))
      oppDiscard(s, 2, K('p6'))
    },
  },
  {
    title: 'Chiama la scala!',
    text: (
      <>
        SUD ha scartato il 5 di Palle, OVEST il 7 di Caratteri e ora <b>NORD</b> il <b>6 di Palle</b>. NORD è alla tua <b>sinistra</b>: solo dal suo scarto puoi chiamare una <b>scala</b>. Con il tuo 7 e 8 di Palle formi 6-7-8.
      </>
    ),
    highlight: parseKinds('p6 p7 p8'),
    action: { type: 'button', label: 'Scala 6-7-8' },
    after: (s) => {
      s.hand = remove(s.hand, K('p7'), K('p8'))
      s.melds.push({ type: 'chow', kinds: parseKinds('p6 p7 p8'), concealed: false })
      s.opp[2].discards[s.opp[2].discards.length - 1].claimed = true
      s.last = undefined
      s.turn = 0
    },
  },
  {
    title: 'La scelta importante',
    text: (
      <>
        Hai <b>4 combinazioni</b>! Ti restano due pedine sole: <b>7 di Palle</b> e <b>1 di Palle</b>. Ne scarti una e aspetti l'altra per fare la coppia. Quale tenere? Conta quante ne restano in gioco: di 7 di Palle ne vedi già 2 (una in mano, una nella scala), quindi ne restano 2. Di 1 di Palle ne vedi solo una: ne restano <b>3</b>. Scarta il <b>7 di Palle</b>.
      </>
    ),
    highlight: [K('p7'), K('p1')],
    action: { type: 'discard', kind: K('p7'), wrong: 'Così aspetteresti il 7 di Palle, ma ne restano solo 2. Tenendo l’1 di Palle ne restano 3: più possibilità di chiudere.' },
    after: (s) => {
      s.hand = remove(s.hand, K('p7'))
      s.discards.push({ k: K('p7'), claimed: false })
      oppDiscard(s, 0, K('b8'))
      oppDiscard(s, 1, K('c5'))
      oppDiscard(s, 2, K('W'))
      s.last = undefined
      s.turn = 0
    },
  },
  {
    title: 'Sei a punto!',
    text: (
      <>
        Ti manca <b>una sola pedina</b> per chiudere: si dice che sei <b>a punto</b> (sull'1 di Palle). Gli altri hanno giocato (8 di Canne, 5 di Caratteri, Vento Ovest): niente di utile. Ora tocca a te: <b>pesca</b> dal muro.
      </>
    ),
    action: { type: 'button', label: 'Pesca' },
    after: (s) => {
      s.drawn = K('b2')
      s.wall--
    },
  },
  {
    title: 'Non ti serve',
    text: (
      <>
        Hai pescato il <b>2 di Canne</b>: non completa la tua mano. Scartalo (è la pedina a destra, separata dalle altre).
      </>
    ),
    highlight: [K('b2')],
    action: { type: 'discard', kind: K('b2'), wrong: 'Scarta il 2 di Canne appena pescato: le altre pedine formano già le tue combinazioni.' },
    after: (s) => {
      s.drawn = undefined
      s.discards.push({ k: K('b2'), claimed: false })
      oppDiscard(s, 0, K('p1'))
    },
  },
  {
    title: 'Ecco la tua pedina!',
    text: (
      <>
        SUD ha scartato l'<b>1 di Palle</b>! Di solito uno scarto non si può prendere per fare una coppia... <b>tranne quando serve per chiudere</b>. Il Mah-Jong si può chiamare dallo scarto di chiunque e ha la precedenza su tutto.
      </>
    ),
    highlight: [K('p1')],
    action: { type: 'button', label: '🀄 Mah-Jong!', gold: true },
    after: (s) => {
      s.hand = sortK([...s.hand, K('p1')])
      s.opp[0].discards[s.opp[0].discards.length - 1].claimed = true
      s.last = undefined
    },
  },
]

const toTiles = (ks: Kind[]): Tile[] => {
  const occ = new Map<Kind, number>()
  return ks.map((k) => {
    const n = occ.get(k) ?? 0
    occ.set(k, n + 1)
    return { id: k * 10 + n, k }
  })
}

export function Guided() {
  const states = useMemo(() => {
    const out: TS[] = [structuredClone(INITIAL)]
    for (const st of STEPS) {
      const n = structuredClone(out[out.length - 1])
      st.after?.(n)
      out.push(n)
    }
    return out
  }, [])
  const [i, setI] = useState(0)
  const [wrong, setWrong] = useState<string | null>(null)
  const [done, setDone] = useLessonProgress()
  const s = states[i]
  const step = STEPS[i]
  const finished = i >= STEPS.length

  const go = (n: number) => {
    setI(n)
    setWrong(null)
    if (n >= STEPS.length && !done.includes('guidata')) setDone([...done, 'guidata'])
  }

  const hand = toTiles(s.hand)
  const drawnTile = s.drawn !== undefined ? { id: 9999, k: s.drawn } : undefined
  const seat = (o: Opp, idx: number): SeatView => ({
    name: o.name,
    wind: o.wind,
    handCount: 13,
    melds: [],
    flowers: [],
    discards: o.discards,
    isTurn: s.turn === idx + 1,
    highlightDiscard: s.last?.from === o.name,
  })

  const onTile = (t: Tile) => {
    if (finished || step.action.type !== 'discard') return
    if (t.k === step.action.kind) go(i + 1)
    else setWrong(step.action.wrong)
  }

  const coach = finished ? null : (
    <div key={i} className="pop-in rounded-2xl border-2 border-gold-400 bg-amber-50 p-4 dark:bg-amber-950/30">
      <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
        Passo {i + 1} di {STEPS.length}
      </div>
      <h2 className="mb-1 text-lg font-bold">{step.title}</h2>
      <p className="leading-relaxed">{step.text}</p>
      {wrong && <div className="mt-2 rounded-lg bg-red-100 p-2 text-sm text-red-900 dark:bg-red-950/60 dark:text-red-100">🤔 {wrong}</div>}
      <div className="mt-3 flex flex-wrap gap-2">
        {i > 0 && (
          <Button variant="ghost" size="sm" onClick={() => go(i - 1)}>
            ← Indietro
          </Button>
        )}
        {step.action.type === 'next' && <Button onClick={() => go(i + 1)}>Avanti →</Button>}
        {step.action.type === 'button' && (
          <Button variant={step.action.gold ? 'gold' : 'primary'} onClick={() => go(i + 1)}>
            {step.action.label}
          </Button>
        )}
        {step.action.type === 'discard' && <span className="self-center text-sm text-muted">👇 Tocca la pedina {tileName(step.action.kind)} nella tua mano</span>}
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <a href="#impara" className="text-sm font-medium text-jade-600 dark:text-jade-300">
          ← Impara
        </a>
        <h1 className="text-lg font-extrabold">Partita guidata</h1>
        <div className="ml-auto h-1.5 w-32 overflow-hidden rounded-full surface-2">
          <div className="h-full bg-jade-600 transition-all" style={{ width: `${(Math.min(i, STEPS.length) / STEPS.length) * 100}%` }} />
        </div>
      </div>
      {finished ? (
        <Final onRestart={() => go(0)} />
      ) : (
        <TableView
          right={seat(s.opp[0], 0)}
          top={seat(s.opp[1], 1)}
          left={seat(s.opp[2], 2)}
          me={{ name: 'Tu', wind: 0, melds: s.melds, flowers: s.flowers, discards: s.discards, isTurn: s.turn === 0, hand: drawnTile ? [...hand, drawnTile] : hand, drawnId: drawnTile?.id }}
          wallCount={s.wall}
          tettoCount={s.tetto}
          roundWind={0}
          lastDiscard={s.last}
          highlightKinds={step.highlight}
          onTileClick={step.action.type === 'discard' ? onTile : undefined}
          coach={coach}
        />
      )}
    </div>
  )
}

function Final({ onRestart }: { onRestart: () => void }) {
  const r = scoreHand({
    melds: [
      { type: 'pung', tile: K('R'), concealed: false },
      { type: 'chow', tile: K('p6'), concealed: false },
      { type: 'chow', tile: K('c2'), concealed: true },
      { type: 'chow', tile: K('b5'), concealed: true },
      { type: 'pair', tile: K('p1'), concealed: true },
    ],
    flowers: [K('f1')],
    seatWind: 0,
    roundWind: 0,
    winner: true,
    win: { selfDrawn: false },
  })
  const names = ['Tu (EST)', 'SUD', 'OVEST', 'NORD']
  const s = settle(names.map((name, i) => ({ name, wind: i, winner: i === 0, value: i === 0 ? r.value : 0 })))
  return (
    <div className="pop-in space-y-4">
      <div className="felt rounded-3xl p-6 text-center text-white">
        <div className="text-5xl">🀄</div>
        <h2 className="mt-2 text-2xl font-extrabold">Mah-Jong! Hai vinto la manche</h2>
        <p className="mt-1 text-jade-100">Ora vediamo quanto vale, passo per passo.</p>
      </div>
      <ScoreRecap r={r} name="Tu" wind={0} winner />
      <Callout title="Come si legge">
        Le combinazioni danno <b>8 punti</b> (tris di drago scoperto 4 + fiore 4; le scale e la coppia di 1 non valgono nulla). Aggiungi i <b>20 di bonus</b>: 28. Hai <b>2 raddoppi</b> (proprio fiore e tris di drago): 28 × 2 × 2 = <b>112</b>.
      </Callout>
      <div>
        <h3 className="mb-2 font-bold">Chi paga</h3>
        <SettlementView s={s} names={names} />
        <p className="mt-2 text-sm text-muted">
          Sei EST, quindi riscuoti doppio: 112 × 2 = 224, arrotondato alla decina = 220 da ciascuno. Nella partita vera anche gli altri contano la loro stecca e si pagano le differenze tra loro.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href="#gioca">
          <Button variant="gold">Gioca una partita vera</Button>
        </a>
        <a href="#punti">
          <Button variant="secondary">Prova il contapunti</Button>
        </a>
        <a href="#strategia">
          <Button variant="secondary">Impara la strategia</Button>
        </a>
        <Button variant="ghost" onClick={onRestart}>
          Ricomincia
        </Button>
      </div>
    </div>
  )
}
