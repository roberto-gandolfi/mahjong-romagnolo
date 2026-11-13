import type { ReactNode } from 'react'
import { Button, Callout, PageHeader } from '../components/ui'
import { TileRow } from '../components/Tile'
import { parseKinds as P } from '../engine/tiles'

const Tiles = ({ s }: { s: string }) => (
  <span className="mx-1 inline-block align-middle">
    <TileRow kinds={P(s)} size="xs" />
  </span>
)

const ARTICLES: { title: string; tag: string; body: ReactNode }[] = [
  {
    title: 'Cosa tenere e cosa scartare',
    tag: 'Base',
    body: (
      <>
        <p>All'inizio della manche la regola d'oro è: <b>scarta prima le pedine che non si collegano a niente</b>.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Prima di tutto</b> i venti isolati che non valgono per te (non sono il tuo vento né quello di giro): da soli non formano nulla.
          </li>
          <li>
            Poi gli <b>1 e 9 isolati</b>: formano meno scale delle pedine centrali (un 9 entra solo nella scala 7-8-9).
          </li>
          <li>
            <b>Tieni</b> le coppie, le pedine vicine (es. <Tiles s="c4 c5" /> aspetta 3 o 6) e i draghi o venti di valore finché c'è speranza di farne un tris.
          </li>
          <li>Un drago isolato è utile solo se ne restano in gioco: se ne sono già usciti due, scartalo senza rimpianti.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Contare le pedine utili',
    tag: 'Base',
    body: (
      <>
        <p>
          Due mani alla stessa distanza dalla chiusura non sono uguali: conta <b>quante pedine</b> possono migliorarla, togliendo quelle già visibili sul tavolo.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Tiles s="b4 b5" /> scala aperta da due lati: aspetta 3 o 6, fino a <b>8 pedine</b>.
          </li>
          <li>
            <Tiles s="b4 b6" /> scala "con il buco": aspetta solo il 5, al massimo <b>4 pedine</b>.
          </li>
          <li>
            <Tiles s="b8 b9" /> scala di bordo: aspetta solo il 7, al massimo 4.
          </li>
          <li>Coppia: aspetta il terzo esemplare, al massimo 2.</li>
        </ul>
        <Callout tone="tip">Il consigliere fa proprio questo conto: ti dice quante pedine utili restano dopo ogni scarto possibile.</Callout>
      </>
    ),
  },
  {
    title: 'Fare punti, non solo chiudere',
    tag: 'Punti',
    body: (
      <>
        <p>Chiudere vale 20 punti di bonus, ma sono i <b>raddoppi</b> a fare la differenza: ogni raddoppio moltiplica tutto per 2.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            I tris <b>coperti</b> (pescati da sé) valgono il doppio di quelli chiamati. Tre tris nascosti danno 1 raddoppio.
          </li>
          <li>
            Le pedine <b>di testa</b> (1, 9, venti, draghi) valgono il doppio. Tris di drago, del proprio vento e del vento di giro danno 1 raddoppio ciascuno.
          </li>
          <li>
            Se hai tante pedine di un seme, punta alla <b>mano pura</b> (un seme più venti e draghi: 1 raddoppio) o <b>purissima</b> (un solo seme: 3 raddoppi!).
          </li>
          <li>Le scale non danno punti: una mano di sole scale vale poco, salvo i serpenti e le scale uguali.</li>
          <li>
            Il <b>proprio fiore</b> vale 1 raddoppio: guardalo subito quando lo peschi.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'Quando chiamare (e quando no)',
    tag: 'Tattica',
    body: (
      <>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Chiama sempre</b> un tris di drago o di vento di valore: punti e raddoppio sicuri.
          </li>
          <li>
            <b>Chiama</b> se la chiamata ti avvicina davvero alla chiusura, soprattutto a muro avanzato.
          </li>
          <li>
            <b>Non chiamare</b> per un tris normale se la mano è ancora lontana: dimezzi il valore del tris, perdi il "tutto pescato" e mostri agli altri cosa stai facendo.
          </li>
          <li>Una scala chiamata non vale punti: chiamala solo se serve a chiudere in fretta.</li>
          <li>Ricorda: chi chiama un tris fa saltare il turno a chi sta in mezzo.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Leggere gli avversari e difendersi',
    tag: 'Difesa',
    body: (
      <>
        <p>
          Non sempre si può vincere: a volte conviene <b>non far vincere gli altri</b>. Il conto lo paghi comunque, ma almeno non regali il Mah-Jong.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Un avversario con <b>3 combinazioni esposte</b> è molto vicino alla chiusura.
          </li>
          <li>
            Se espone solo pedine di <b>un seme</b>, sta facendo la mano pura: non dargli pedine di quel seme.
          </li>
          <li>
            Le pedine <b>più sicure</b> sono quelle che lui stesso ha già scartato e i venti/draghi di cui sono già uscite 3 copie.
          </li>
          <li>Verso la fine del muro, se la tua mano è lontana, gioca sulla difensiva.</li>
          <li>
            Attento a <b>EST</b>: paga e riscuote doppio. Farlo vincere costa il doppio a tutti.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'L’attesa finale e il Richi',
    tag: 'Avanzato',
    body: (
      <>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Quando sei a punto scegli l'<b>attesa con più pedine vive</b>: guarda gli scarti e le combinazioni esposte per contarle.
          </li>
          <li>
            Se chiudi con l'<b>ultimo esemplare</b> di una pedina, dichiara "ultimo pezzo": vale 1 raddoppio.
          </li>
          <li>
            <b>Richi</b>: se sei a punto su un'unica pedina (non su una scala aperta o su due coppie) puoi dichiararlo prima dello scarto, finché restano almeno 8 pedine nel muro. Vale 1 raddoppio, ma da quel momento scarti tutto ciò che peschi, anche fiori e poker: rischi di regalare la chiusura agli altri.
          </li>
          <li>Conviene il Richi presto, con un'attesa che ha ancora diversi esemplari in gioco.</li>
        </ul>
      </>
    ),
  },
]

export function Strategy() {
  return (
    <div className="space-y-4">
      <PageHeader title="Strategia" subtitle="Per chi conosce già le regole: come scegliere le mosse, e perché." />
      <div className="grid gap-3 sm:grid-cols-2">
        <a href="#esercizi" className="felt rounded-2xl p-5 text-white shadow-md hover:brightness-110">
          <div className="text-2xl">🎯</div>
          <div className="mt-1 text-lg font-bold">Esercizi: cosa scarteresti?</div>
          <div className="text-sm text-jade-100">Situazioni di gioco reali. Scegli lo scarto e il computer ti spiega se era il migliore e perché.</div>
        </a>
        <a href="#gioca" className="surface rounded-2xl p-5 shadow-sm hover:shadow-md">
          <div className="text-2xl">💡</div>
          <div className="mt-1 text-lg font-bold">Gioca col consigliere</div>
          <div className="text-sm text-muted">In partita il consigliere ti suggerisce scarti e chiamate, mostrando le alternative a confronto.</div>
        </a>
      </div>
      {ARTICLES.map((a, i) => (
        <details key={i} className="surface group rounded-2xl p-4 shadow-sm" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-center gap-2">
            <span className="rounded-full surface-2 px-2 py-0.5 text-xs font-bold text-muted">{a.tag}</span>
            <span className="text-lg font-bold">{a.title}</span>
            <span className="ml-auto text-muted transition group-open:rotate-90">›</span>
          </summary>
          <div className="mt-3 space-y-2 leading-relaxed">{a.body}</div>
        </details>
      ))}
      <div className="flex justify-center">
        <a href="#esercizi">
          <Button size="lg">Mettiti alla prova →</Button>
        </a>
      </div>
    </div>
  )
}
