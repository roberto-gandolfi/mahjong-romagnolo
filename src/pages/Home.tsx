import { Tile } from '../components/Tile'

const CARDS = [
  {
    href: '#impara',
    title: 'Impara a giocare',
    text: 'Lezioni brevi con quiz e una partita guidata passo per passo. Parti da qui se non hai mai giocato.',
    tiles: [0, 1, 2],
    accent: 'from-jade-600 to-jade-800',
    tag: 'Neofiti',
  },
  {
    href: '#punti',
    title: 'Conta i punti',
    text: 'Inserisci le combinazioni: ottieni il dettaglio di punti e raddoppi e chi paga cosa a chi.',
    tiles: [31, 31, 31],
    accent: 'from-cinnabar-500 to-cinnabar-600',
    tag: 'Al tavolo',
  },
  {
    href: '#gioca',
    title: 'Gioca contro il computer',
    text: 'Una partita completa contro tre avversari virtuali, con il consigliere che ti spiega le mosse.',
    tiles: [27, 28, 29],
    accent: 'from-amber-500 to-amber-700',
    tag: 'Allenamento',
  },
  {
    href: '#strategia',
    title: 'Strategia ed esercizi',
    text: 'Cosa tenere, cosa scartare, quando chiamare e come difendersi. Con esercizi corretti dal computer.',
    tiles: [22, 22, 22],
    accent: 'from-sky-600 to-indigo-700',
    tag: 'Avanzato',
  },
]

export function Home() {
  return (
    <div className="space-y-8">
      <section className="felt relative overflow-hidden rounded-3xl p-6 text-white shadow-lg sm:p-10">
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-jade-200">Regolamento ufficiale F.I.M.J.</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">Il Mah-Jong come si gioca in Romagna</h1>
          <p className="mt-3 text-jade-50/90">
            Dal primo sguardo alle pedine fino al conteggio dei raddoppi. Impara con calma, poi porta l'app al tavolo per contare i punti.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="#guidata" className="rounded-xl bg-gold-400 px-5 py-3 font-bold text-jade-950 shadow hover:bg-gold-500">
              Inizia la partita guidata
            </a>
            <a href="#tessere" className="rounded-xl bg-white/15 px-5 py-3 font-semibold hover:bg-white/25">
              Conosci le tessere
            </a>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-6 -bottom-6 hidden rotate-[-8deg] gap-1 opacity-90 sm:flex">
          {[18, 19, 20, 33, 32, 31].map((k) => (
            <Tile key={k} k={k} size="xl" label={false} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <a key={c.href} href={c.href} className="group surface flex flex-col overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className={`flex items-center justify-between bg-gradient-to-br ${c.accent} px-5 py-4`}>
              <div className="flex gap-1">
                {c.tiles.map((k, i) => (
                  <Tile key={i} k={k} size="sm" label={false} />
                ))}
              </div>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">{c.tag}</span>
            </div>
            <div className="p-5">
              <h2 className="text-lg font-bold group-hover:text-jade-600 dark:group-hover:text-jade-300">{c.title}</h2>
              <p className="mt-1 text-sm text-muted">{c.text}</p>
            </div>
          </a>
        ))}
      </section>

      <section className="surface rounded-2xl p-5">
        <h2 className="font-bold">Al tavolo con il set vero</h2>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <a href="#lezione-tavolo" className="rounded-xl surface-2 p-3 hover:brightness-95">
            <div className="font-semibold">🎲 Preparare il tavolo</div>
            <div className="text-muted">Posti, muro, breccia e tetto, con il calcolatore dei dadi.</div>
          </a>
          <a href="#prontuario" className="rounded-xl surface-2 p-3 hover:brightness-95">
            <div className="font-semibold">📋 Prontuario</div>
            <div className="text-muted">Tutte le tabelle di punti, raddoppi e massimi.</div>
          </a>
          <a href="#punti" className="rounded-xl surface-2 p-3 hover:brightness-95">
            <div className="font-semibold">🧮 Segnapunti</div>
            <div className="text-muted">Conta ogni manche e tieni il totale della partita.</div>
          </a>
        </div>
      </section>
    </div>
  )
}
