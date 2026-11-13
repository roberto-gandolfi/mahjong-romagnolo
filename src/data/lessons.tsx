import type { ReactNode } from 'react'
import { TileRow } from '../components/Tile'
import { parseKinds as P } from '../engine/tiles'
import { Callout } from '../components/ui'
import { DiceHelper } from '../components/DiceHelper'

export interface QuizOption {
  label: ReactNode
  correct?: boolean
  explain: string
}
export interface Slide {
  title: string
  body: ReactNode
  quiz?: { question: ReactNode; options: QuizOption[] }
}
export interface LessonDef {
  id: string
  title: string
  summary: string
  minutes: number
  slides: Slide[]
}

const T = ({ s, size = 'md' }: { s: string; size?: 'sm' | 'md' | 'lg' }) => (
  <div className="my-2">
    <TileRow kinds={P(s)} size={size} />
  </div>
)

export const LESSONS: LessonDef[] = [
  {
    id: 'combinazioni',
    title: 'Le combinazioni',
    summary: 'Tris, poker, scala e coppia: i mattoni di ogni mano.',
    minutes: 3,
    slides: [
      {
        title: 'Il tris',
        body: (
          <>
            <p>Tre pedine <b>identiche</b>. Si può fare con qualsiasi pedina: numeri, venti o draghi.</p>
            <T s="p5 p5 p5" />
            <T s="R R R" />
            <p className="text-muted">Il tris è la combinazione che dà punti. I tris di draghi e di venti "giusti" danno anche raddoppi.</p>
          </>
        ),
      },
      {
        title: 'Il poker',
        body: (
          <>
            <p>Quattro pedine identiche. Vale come un tris "potenziato" e conta molti più punti.</p>
            <T s="b9 b9 b9 b9" />
            <Callout tone="tip">Quando esponi un poker devi pescare una pedina in più dal <b>tetto</b>, altrimenti ti mancherebbe una pedina per chiudere.</Callout>
          </>
        ),
      },
      {
        title: 'La scala',
        body: (
          <>
            <p>Tre pedine <b>dello stesso seme</b> con numeri consecutivi.</p>
            <T s="c3 c4 c5" />
            <T s="b7 b8 b9" />
            <p className="text-muted">Non esistono scale di venti o draghi, e non si "gira" dal 9 all'1. Le scale non danno punti, ma aiutano a chiudere e possono dare raddoppi (es. il serpente 1-2-3, 4-5-6, 7-8-9).</p>
          </>
        ),
        quiz: {
          question: 'Quale di queste è una scala valida?',
          options: [
            { label: <TileRow kinds={P('c7 c8 c9')} size="sm" />, correct: true, explain: 'Giusto: 7, 8 e 9 dello stesso seme (Caratteri).' },
            { label: <TileRow kinds={P('c7 b8 p9')} size="sm" />, explain: 'No: i numeri sono consecutivi ma i semi sono diversi.' },
            { label: <TileRow kinds={P('E S W')} size="sm" />, explain: 'No: con i venti si possono fare solo tris, poker e coppie.' },
          ],
        },
      },
      {
        title: 'La coppia',
        body: (
          <>
            <p>Due pedine identiche. In ogni Mah-Jong normale serve <b>esattamente una coppia</b>.</p>
            <T s="G G" />
            <p className="text-muted">Le coppie di drago, del proprio vento o del vento di giro valgono 2 punti; le altre non valgono nulla.</p>
          </>
        ),
        quiz: {
          question: 'Che combinazione è questa?',
          options: [
            { label: <TileRow kinds={P('N N N')} size="sm" />, correct: true, explain: 'È un tris: tre pedine identiche (Vento Nord).' },
            { label: 'Una scala', explain: 'No: le scale si fanno solo con numeri consecutivi dello stesso seme.' },
            { label: 'Niente di valido', explain: 'Invece è valida: tre venti uguali sono un tris.' },
          ],
        },
      },
    ],
  },
  {
    id: 'scopo',
    title: 'Lo scopo del gioco',
    summary: 'Fare Mah-Jong: 4 combinazioni più una coppia.',
    minutes: 3,
    slides: [
      {
        title: 'Fare Mah-Jong',
        body: (
          <>
            <p>
              Si vince la manche ("si chiude") formando con 14 pedine <b>4 combinazioni</b> (tris, poker o scale) <b>+ 1 coppia</b>.
            </p>
            <T s="c1 c2 c3 b4 b5 b6 p7 p7 p7 R R R W W" size="sm" />
            <p className="text-muted">Qui: scala di Caratteri, scala di Canne, tris di 7 di Palle, tris di Drago Rosso e coppia di Ovest.</p>
          </>
        ),
      },
      {
        title: 'Quante pedine?',
        body: (
          <>
            <p>
              Durante il gioco tieni sempre <b>13 pedine</b>. Quando è il tuo turno ne peschi una (diventano 14) e poi ne scarti una. Si chiude quando la 14ª pedina completa la mano.
            </p>
            <Callout title="Fiori e stagioni non contano">
              Non fanno parte delle 13 pedine: si mettono da parte scoperti e si sostituiscono pescando dal tetto.
            </Callout>
          </>
        ),
        quiz: {
          question: (
            <>
              Questa mano è un Mah-Jong?
              <TileRow kinds={P('c2 c3 c4 c6 c7 c8 b2 b2 b2 p4 p5 p6 E S')} size="sm" />
            </>
          ),
          options: [
            { label: 'Sì', explain: 'Quasi! Ci sono 4 combinazioni, ma Est e Sud non formano una coppia.' },
            { label: 'No', correct: true, explain: 'Esatto: manca la coppia. Con un altro Est o un altro Sud sarebbe stato Mah-Jong.' },
          ],
        },
      },
      {
        title: 'Le eccezioni',
        body: (
          <>
            <p>Alcune mani speciali chiudono senza la forma 4+1. La più comune è <b>Tutte coppie</b>: sette coppie diverse (2 raddoppi).</p>
            <T s="c1 c1 c5 c5 b3 b3 b8 b8 p2 p2 E E G G" size="sm" />
            <p className="text-muted">
              Poi ci sono i "massimi", mani rare con punteggio fisso (es. le 13 lanterne meravigliose). Le trovi nel prontuario.
            </p>
          </>
        ),
        quiz: {
          question: (
            <>
              E questa?
              <TileRow kinds={P('c1 c1 c1 c2 c3 c4 c5 c6 c7 c8 c9 c9 c9 c5')} size="sm" />
            </>
          ),
          options: [
            { label: 'Sì, è Mah-Jong', correct: true, explain: 'Sì! 1-1-1, 2-3-4, 6-7-8, 9-9-9 e la coppia di 5... e in più è la "Casa piena dei 9 pezzi", un massimo da 3000 punti!' },
            { label: 'No', explain: 'Guarda meglio: 1-1-1, 2-3-4, 6-7-8, 9-9-9 e la coppia di 5. È Mah-Jong (e pure un massimo).' },
          ],
        },
      },
    ],
  },
  {
    id: 'turno',
    title: 'Il turno di gioco',
    summary: 'Chi inizia, in che senso si gira, pescare e scartare.',
    minutes: 3,
    slides: [
      {
        title: 'Posti e venti',
        body: (
          <>
            <p>Ogni giocatore ha un vento. <b>EST</b> è il "mazziere"; <b>SUD</b> siede alla sua destra, <b>OVEST</b> di fronte, <b>NORD</b> a sinistra.</p>
            <div className="mx-auto my-3 grid w-56 grid-cols-3 grid-rows-3 place-items-center gap-1 text-sm font-bold">
              <div />
              <div className="rounded-lg bg-jade-100 px-2 py-1 text-jade-800 dark:bg-jade-900 dark:text-jade-100">OVEST</div>
              <div />
              <div className="rounded-lg bg-jade-100 px-2 py-1 text-jade-800 dark:bg-jade-900 dark:text-jade-100">NORD</div>
              <div className="text-2xl text-muted">↺</div>
              <div className="rounded-lg bg-jade-100 px-2 py-1 text-jade-800 dark:bg-jade-900 dark:text-jade-100">SUD</div>
              <div />
              <div className="rounded-lg bg-cinnabar-500 px-2 py-1 text-white">EST (tu)</div>
              <div />
            </div>
            <p>Il gioco procede in senso <b>antiorario</b>: EST → SUD → OVEST → NORD. Ogni manche il ruolo di EST passa al giocatore successivo.</p>
          </>
        ),
      },
      {
        title: 'Pesca e scarta',
        body: (
          <>
            <ol className="list-decimal space-y-1 pl-5">
              <li>EST inizia con 14 pedine e scarta subito.</li>
              <li>Poi ognuno, al suo turno, <b>pesca</b> una pedina dal muro e ne <b>scarta</b> una a faccia in su al centro.</li>
              <li>Invece di pescare puoi <b>chiamare</b> lo scarto di un altro (lo vediamo nella prossima lezione).</li>
            </ol>
            <Callout tone="tip">Le pedine scartate restano visibili: guardarle ti dice cosa è già uscito e cosa ancora puoi sperare di pescare.</Callout>
          </>
        ),
        quiz: {
          question: 'Tu sei SUD. Dopo chi giochi?',
          options: [
            { label: 'Dopo EST', correct: true, explain: 'Giusto: EST siede alla tua sinistra e gioca subito prima di te.' },
            { label: 'Dopo OVEST', explain: 'No: OVEST gioca dopo di te. Si gira in senso antiorario E → S → W → N.' },
            { label: 'Dopo NORD', explain: 'No: dopo NORD tocca a EST. Tu, SUD, giochi dopo EST.' },
          ],
        },
      },
    ],
  },
  {
    id: 'chiamate',
    title: 'Le chiamate',
    summary: 'Prendere lo scarto di un altro: quando si può e cosa succede.',
    minutes: 4,
    slides: [
      {
        title: 'Chiamare un tris o un poker',
        body: (
          <>
            <p>
              Se un avversario <b>qualsiasi</b> scarta una pedina di cui hai già una coppia, puoi chiamarla e fare un <b>tris</b> (o un poker se ne hai tre).
            </p>
            <T s="R R" />
            <p>+ lo scarto <TileRow kinds={P('R')} size="sm" /> = tris esposto.</p>
            <p className="text-muted">
              La combinazione chiamata va <b>esposta</b> sulla stecca (scoperta) e vale la metà di una pescata da sé. Dopo la chiamata scarti, e il turno passa al giocatore alla tua destra: chi stava in mezzo salta la pesca.
            </p>
          </>
        ),
      },
      {
        title: 'Chiamare una scala',
        body: (
          <>
            <p>
              La scala si può chiamare <b>solo dallo scarto del giocatore alla tua sinistra</b> (quello che gioca subito prima di te).
            </p>
            <T s="b4 b5" />
            <p>+ lo scarto del vicino di sinistra <TileRow kinds={P('b6')} size="sm" /> = scala esposta.</p>
          </>
        ),
        quiz: {
          question: 'OVEST (di fronte a te) scarta il 6 di Canne. Tu hai 4 e 5 di Canne. Puoi chiamare la scala?',
          options: [
            { label: 'Sì', explain: 'No: la scala si chiama solo dallo scarto del giocatore alla tua sinistra.' },
            { label: 'No', correct: true, explain: 'Esatto: OVEST non è alla tua sinistra. Un tris invece lo avresti potuto chiamare.' },
          ],
        },
      },
      {
        title: 'Priorità e coppia',
        body: (
          <>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                La chiamata per <b>Mah-Jong</b> vince su tutte.
              </li>
              <li>
                La chiamata per <b>tris o poker</b> vince su quella per la scala.
              </li>
              <li>
                Uno scarto si può prendere per fare la <b>coppia solo se ti serve per chiudere</b>.
              </li>
              <li>Fiori e stagioni non si scartano e non si chiamano.</li>
            </ul>
          </>
        ),
        quiz: {
          question: 'NORD scarta il Drago Verde. SUD lo vuole per un tris, OVEST per fare Mah-Jong. Chi lo prende?',
          options: [
            { label: 'SUD', explain: 'No: il Mah-Jong ha la precedenza su qualsiasi altra chiamata.' },
            { label: 'OVEST', correct: true, explain: 'Giusto: la chiamata per Mah-Jong ha sempre la precedenza.' },
          ],
        },
      },
    ],
  },
  {
    id: 'fiori-poker',
    title: 'Fiori, stagioni e poker',
    summary: 'Le pedine speciali e il tetto.',
    minutes: 2,
    slides: [
      {
        title: 'Fiori e stagioni',
        body: (
          <>
            <T s="f1 f2 f3 f4 s1 s2 s3 s4" size="sm" />
            <p>
              Appena ne hai uno lo <b>esponi</b> e peschi una pedina dal <b>tetto</b> (la parte di muro riservata alle sostituzioni). Valgono 4 punti ciascuno.
            </p>
            <p>
              Il <b>proprio fiore</b> (numero uguale al tuo vento: EST=1, SUD=2, OVEST=3, NORD=4) dà 1 raddoppio. Tutti e quattro i fiori (o le stagioni) danno 2 raddoppi.
            </p>
          </>
        ),
        quiz: {
          question: 'Sei OVEST. Quale fiore ti dà un raddoppio?',
          options: [
            { label: <TileRow kinds={P('f1')} size="sm" />, explain: 'No: il Fiore 1 è di EST.' },
            { label: <TileRow kinds={P('f3')} size="sm" />, correct: true, explain: 'Giusto: OVEST è il terzo vento, quindi Fiore 3 e Stagione 3.' },
            { label: <TileRow kinds={P('f4')} size="sm" />, explain: 'No: il 4 è di NORD.' },
          ],
        },
      },
      {
        title: 'Tre modi per fare poker',
        body: (
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <b>Poker coperto</b>: peschi la quarta pedina di un tris che avevi in mano. Lo esponi con una pedina girata di traverso.
            </li>
            <li>
              <b>Poker scoperto</b>: chiami la quarta pedina scartata da un avversario, avendone tre in mano.
            </li>
            <li>
              <b>Poker scoperto</b>: peschi la quarta pedina di un tris già esposto e la aggiungi. Attenzione: un avversario può "rubartela" per fare Mah-Jong (pezzo rubato).
            </li>
          </ul>
        ),
      },
    ],
  },
  {
    id: 'punti',
    title: 'Come si contano i punti',
    summary: 'Punti, bonus, raddoppi e pagamenti in 4 passi.',
    minutes: 4,
    slides: [
      {
        title: '1. I punti delle combinazioni',
        body: (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="py-1">Combinazione</th>
                  <th>Scoperto</th>
                  <th>Coperto</th>
                </tr>
              </thead>
              <tbody className="[&_td]:py-1">
                <tr>
                  <td>Tris normale (2-8)</td>
                  <td>2</td>
                  <td>4</td>
                </tr>
                <tr>
                  <td>Tris di testa (1, 9, venti, draghi)</td>
                  <td>4</td>
                  <td>8</td>
                </tr>
                <tr>
                  <td>Poker normale</td>
                  <td>8</td>
                  <td>16</td>
                </tr>
                <tr>
                  <td>Poker di testa</td>
                  <td>16</td>
                  <td>32</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-sm text-muted">Fiore o stagione: 4. Coppia di drago, del proprio vento o del vento di giro: 2. Scale: 0.</p>
          </>
        ),
      },
      {
        title: '2. Il bonus e 3. i raddoppi',
        body: (
          <>
            <p>
              Chi fa Mah-Jong aggiunge <b>20 punti</b> di bonus. Poi il totale si <b>raddoppia</b> una volta per ogni raddoppio ottenuto (×2, ×4, ×8...).
            </p>
            <p className="mt-2">
              Esempi di raddoppi: tris di drago, tris del proprio vento, proprio fiore, mano pura (un solo seme più onori), tutto pescato... L'elenco completo è nel prontuario.
            </p>
            <Callout tone="tip">
              I raddoppi "fondamentali" (fiori, venti, draghi, tris di teste...) valgono anche per chi non ha chiuso. Quelli "da chiusura" solo per chi fa Mah-Jong.
            </Callout>
          </>
        ),
      },
      {
        title: '4. Chi paga',
        body: (
          <>
            <ul className="list-disc space-y-1 pl-5">
              <li>Gli altri tre pagano al vincitore il suo punteggio.</li>
              <li>
                <b>EST paga e riscuote doppio.</b>
              </li>
              <li>Chi non ha chiuso si paga le differenze dei punti di stecca.</li>
              <li>Si arrotonda alla decina (da 6 a 14 → 10, da 16 a 24 → 20...).</li>
              <li>Limite consigliato: 1000 punti (2000 per EST). I massimi hanno valore fisso.</li>
            </ul>
          </>
        ),
        quiz: {
          question: 'Hai chiuso con 8 punti di combinazioni e 1 raddoppio. Quanto vale la mano?',
          options: [
            { label: '16', explain: 'Hai dimenticato il bonus di 20 punti: (8 + 20) × 2.' },
            { label: '56', correct: true, explain: 'Esatto: 8 + 20 di bonus = 28, raddoppiato = 56.' },
            { label: '28', explain: 'Manca il raddoppio: 28 × 2 = 56.' },
          ],
        },
      },
    ],
  },
  {
    id: 'tavolo',
    title: 'Preparare il tavolo',
    summary: 'Dadi, muro, breccia e tetto per giocare col set vero.',
    minutes: 5,
    slides: [
      {
        title: 'Sorteggio dei posti',
        body: (
          <>
            <p>Ognuno tira i due dadi. Punteggio più alto = <b>EST</b>; poi SUD (alla destra di EST), OVEST (di fronte), NORD (a sinistra). In caso di parità si ritira.</p>
          </>
        ),
      },
      {
        title: 'Costruire il muro',
        body: (
          <>
            <p>
              Tutte le pedine a faccia in giù, si mescolano. Ognuno prende <b>36 pedine</b> e costruisce davanti a sé un muro di <b>due file sovrapposte da 18</b>, lungo come la stecca.
            </p>
            <div className="my-3 flex justify-center">
              <div className="grid grid-cols-9 gap-0.5">
                {Array.from({ length: 18 }, (_, i) => (
                  <div key={i} className="h-5 w-4 rounded-sm bg-jade-600 shadow-[0_2px_0_#e9dfc4]" />
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-muted">(un tratto di muro: due file sovrapposte)</p>
          </>
        ),
      },
      {
        title: 'La breccia: dove si inizia a pescare',
        body: (
          <>
            <p>
              EST tira i dadi: il risultato indica in quale muro aprire (5, 9 = EST; 2, 6, 10 = SUD; 3, 7, 11 = OVEST; 4, 8, 12 = NORD, contando in senso antiorario da EST). Quel giocatore tira a sua volta: la <b>somma dei due tiri</b> dice quante coppie contare, da destra verso sinistra, per aprire la breccia.
            </p>
            <DiceHelper />
          </>
        ),
      },
      {
        title: 'La distribuzione',
        body: (
          <ol className="list-decimal space-y-1 pl-5">
            <li>Dalla breccia, in senso orario, EST prende 2 coppie (4 pedine), poi SUD, OVEST, NORD, fino ad avere 12 pedine ciascuno.</li>
            <li>Poi EST prende la 1ª e la 3ª pedina superiore, SUD la 1ª inferiore, OVEST la 2ª superiore, NORD la 2ª inferiore.</li>
            <li>EST ha così 14 pedine, gli altri 13.</li>
            <li>
              Dal punto della breccia, all'indietro, si contano <b>7 coppie</b>: sono il <b>tetto</b>, usato solo per sostituire fiori, stagioni e poker (si pesca all'indietro, prima la pedina sotto).
            </li>
            <li>Si espongono fiori e stagioni (prima EST, poi SUD, OVEST, NORD) pescando i sostituti dal tetto.</li>
          </ol>
        ),
      },
    ],
  },
  {
    id: 'fine',
    title: 'Fine manche, partita ed errori',
    summary: 'Quando finisce, quanto dura e cosa succede se si sbaglia.',
    minutes: 3,
    slides: [
      {
        title: 'Quando finisce una manche',
        body: (
          <ul className="list-disc space-y-1 pl-5">
            <li>Qualcuno fa Mah-Jong.</li>
            <li>Il muro finisce senza Mah-Jong (chi pesca l'ultima pedina non scarta): si pagano solo le differenze di stecca.</li>
            <li>I primi quattro scarti sono lo stesso vento: la manche va "a monte".</li>
          </ul>
        ),
      },
      {
        title: 'Durata della partita',
        body: (
          <p>
            Una partita completa dura 4 giri: in ogni giro ogni giocatore fa una volta EST. Il gioco termina quando finisce il giro in cui il vento dominante è il NORD. Per una partita più breve tra amici potete fare un solo giro (4 manche).
          </p>
        ),
      },
      {
        title: 'Errori da evitare',
        body: (
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <b>Piccolo signore</b>: ti trovi con meno pedine del dovuto. Non puoi più chiudere, ma i tuoi punti di stecca valgono.
            </li>
            <li>
              <b>Grande signore</b>: hai più pedine del dovuto. Non puoi chiudere e la tua stecca vale zero.
            </li>
            <li>
              <b>Mah-Jong falso</b>: dichiari una chiusura sbagliata. Sei escluso dalla manche, la stecca vale zero e paghi il Mah-Jong e le stecche degli altri.
            </li>
          </ul>
        ),
        quiz: {
          question: 'Ti accorgi di avere 12 pedine invece di 13. Cosa succede?',
          options: [
            { label: 'Sei piccolo signore: giochi ma non puoi chiudere', correct: true, explain: 'Esatto. Continui a giocare e i tuoi punti di stecca restano validi.' },
            { label: 'La manche va a monte', explain: 'No: va a monte solo se succede prima dell’inizio e non hai ancora visto le pedine.' },
            { label: 'Paghi tutti', explain: 'No: quello succede col Mah-Jong falso.' },
          ],
        },
      },
    ],
  },
]
