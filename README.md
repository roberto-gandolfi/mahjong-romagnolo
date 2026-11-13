# Mahjong Romagnolo

App web per imparare e giocare al Mah-Jong secondo il **Regolamento ufficiale F.I.M.J. (4ª edizione)**.

**Apri l'app:** https://roberto-gandolfi.github.io/mahjong-romagnolo/

Ogni push sul ramo `main` esegue i test e ripubblica il sito in automatico (`.github/workflows/pages.yml`).

## Cosa contiene (v0.1)
- **Impara**: catalogo delle tessere, 8 lezioni brevi con quiz, partita guidata passo-passo, prontuario, calcolatore della breccia per il set vero.
- **Conta punti**: inserimento delle combinazioni dei 4 giocatori, recap riga per riga (punti, raddoppi, formula, limite), chi paga a chi, segnapunti della partita.
- **Gioca**: partita completa contro 3 avversari virtuali (facili/normali) con consigliere che spiega scarti e chiamate. La partita si salva da sola.
- **Strategia**: 6 schede di tattica ed esercizi "cosa scarteresti?" corretti dal computer.

## Avviare l'app sul PC
Serve Node.js (già installato su questo PC).

```bash
npm install
npm run dev
```

Poi apri http://localhost:5173. Per provarla dal telefono sulla stessa rete Wi-Fi: `npm run dev -- --host` e apri l'indirizzo "Network" che compare.

## Comandi utili
- `npm test`: test automatici del motore (regole, punteggi, pagamenti, partite simulate).
- `npm run build`: crea la versione pubblicabile nella cartella `dist/` (sito statico, si può caricare su Netlify, Vercel o GitHub Pages).

## Struttura
- `src/engine/`: regole del gioco, indipendenti dall'interfaccia (riutilizzabili per multiplayer).
- `src/pages/`, `src/components/`: interfaccia React + Tailwind.
- `PIANO.md`: piano di sviluppo, evolutive e interpretazioni del regolamento da verificare.
