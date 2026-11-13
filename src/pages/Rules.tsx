import { Card, PageHeader, Callout } from '../components/ui'
import { DOUBLES, MASSIMI, MELD_POINTS } from '../engine/scoring'

export function Rules() {
  const fond = DOUBLES.filter((d) => d.kind === 'fondamentale')
  const chius = DOUBLES.filter((d) => d.kind === 'chiusura')
  return (
    <div className="space-y-4">
      <PageHeader back="#impara" title="Prontuario" subtitle="Le regole essenziali del Regolamento F.I.M.J. in una pagina." />

      <Card>
        <h2 className="mb-2 text-lg font-bold">In breve</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>144 pedine; 13 in mano (EST parte con 14). Si gira in senso antiorario: EST → SUD → OVEST → NORD.</li>
          <li>Mah-Jong = 4 combinazioni (tris, poker, scale) + 1 coppia, oppure 7 coppie, oppure un massimo.</li>
          <li>Tris e poker si chiamano dallo scarto di chiunque; la scala solo da chi sta alla tua sinistra; la coppia solo per chiudere.</li>
          <li>Priorità: Mah-Jong &gt; tris/poker &gt; scala. Le combinazioni chiamate si espongono.</li>
          <li>Fiori, stagioni e poker si sostituiscono pescando dal tetto (7 coppie).</li>
          <li>Fine manche: Mah-Jong, muro finito, o primi 4 scarti dello stesso vento (a monte).</li>
        </ul>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-bold">Punti</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1">Combinazione</th>
              <th>Scoperto</th>
              <th>Coperto</th>
            </tr>
          </thead>
          <tbody className="[&_td]:border-t [&_td]:border-[var(--border)] [&_td]:py-1.5">
            <tr>
              <td>Tris NON di testa</td>
              <td>{MELD_POINTS.pung.normal.exposed}</td>
              <td>{MELD_POINTS.pung.normal.concealed}</td>
            </tr>
            <tr>
              <td>Tris di testa</td>
              <td>{MELD_POINTS.pung.head.exposed}</td>
              <td>{MELD_POINTS.pung.head.concealed}</td>
            </tr>
            <tr>
              <td>Poker NON di testa</td>
              <td>{MELD_POINTS.kong.normal.exposed}</td>
              <td>{MELD_POINTS.kong.normal.concealed}</td>
            </tr>
            <tr>
              <td>Poker di testa</td>
              <td>{MELD_POINTS.kong.head.exposed}</td>
              <td>{MELD_POINTS.kong.head.concealed}</td>
            </tr>
            <tr>
              <td>Fiore o stagione</td>
              <td colSpan={2}>4</td>
            </tr>
            <tr>
              <td>Coppia di drago / proprio vento / vento di giro</td>
              <td colSpan={2}>2</td>
            </tr>
            <tr>
              <td>Bonus per chi fa Mah-Jong</td>
              <td colSpan={2}>20</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">Pedine di testa: tutti gli 1 e i 9, i venti e i draghi.</p>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Raddoppi fondamentali</h2>
        <p className="mb-2 text-sm text-muted">Valgono per tutti, anche per chi non ha chiuso, se ha almeno 2 punti.</p>
        <DoubleTable list={fond} />
      </Card>
      <Card>
        <h2 className="mb-1 text-lg font-bold">Raddoppi da chiusura</h2>
        <p className="mb-2 text-sm text-muted">Solo per chi fa Mah-Jong.</p>
        <DoubleTable list={chius} />
        <p className="mt-2 text-xs text-muted">I raddoppi sono cumulabili, salvo quando uno include l'altro (es. 4 scale uguali di colore include 3 scale uguali di colore).</p>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold">Massimi</h2>
        <p className="mb-2 text-sm text-muted">Valore fisso, indipendente dal conteggio e dal limite (non EST / EST).</p>
        <div className="divide-y divide-[var(--border)]">
          {Object.values(MASSIMI).map((m) => (
            <div key={m.name} className="flex gap-3 py-2 text-sm">
              <div className="flex-1">
                <div className="font-semibold">{m.name}</div>
                <div className="text-muted">{m.desc}</div>
              </div>
              <div className="font-bold whitespace-nowrap">
                {m.value}/{m.value * 2}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-bold">Pagamenti</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Valore mano = (punti + 20 di bonus) × 2 per ogni raddoppio.</li>
          <li>Ogni perdente paga il vincitore. EST paga e riscuote doppio.</li>
          <li>I non vincenti si pagano le differenze di stecca (EST raddoppia dopo aver calcolato la differenza).</li>
          <li>Arrotondamento alla decina: da 0 a 4 → 0, da 6 a 14 → 10, da 16 a 24 → 20...</li>
          <li>Limite consigliato F.I.M.J.: 1000 punti (2000 per EST).</li>
        </ul>
      </Card>
      <Callout tone="tip">Il contapunti dell'app applica tutte queste regole e ti mostra ogni passaggio.</Callout>
    </div>
  )
}

function DoubleTable({ list }: { list: typeof DOUBLES }) {
  return (
    <div className="divide-y divide-[var(--border)]">
      {list.map((d) => (
        <div key={d.id} className="flex gap-3 py-2 text-sm">
          <div className="flex-1">
            <div className="font-semibold">{d.name}</div>
            <div className="text-muted">{d.desc}</div>
          </div>
          <div className="font-bold whitespace-nowrap">×{2 ** d.count} <span className="text-xs font-normal text-muted">({d.count} radd.)</span></div>
        </div>
      ))}
    </div>
  )
}
