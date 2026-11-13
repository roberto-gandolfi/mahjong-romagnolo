# Mahjong Romagnolo — Piano di sviluppo

App web (installabile su telefono come PWA nelle iterazioni successive) per imparare e giocare
al Mah-Jong secondo il **Regolamento ufficiale FIMJ (4ª edizione)**.

## Scelte tecniche

| Tema | Scelta | Perché |
|---|---|---|
| Piattaforma | Web app (React + TypeScript + Vite) | Funziona su PC, tablet e telefono; si pubblica gratis (Netlify/Vercel/GitHub Pages); base pronta per PWA e app store (Capacitor) |
| UI | Tailwind CSS, tema chiaro/scuro, mobile-first | Interfaccia moderna e leggibile al tavolo |
| Tessere | Disegnate in SVG dal codice (Caratteri 萬, Canne, Palle, Venti, Draghi, Fiori, Stagioni) con etichetta in italiano opzionale | Simili al set fisico, nessuna immagine protetta, nitide a ogni dimensione |
| Motore di gioco | Moduli TypeScript puri (`src/engine`) con test automatici (Vitest) | Le regole di punteggio sono tante: i test evitano errori; lo stesso motore serve tutorial, contapunti, partite e (in futuro) multiplayer |
| Dati | Tutto locale nel browser, nessun server | Semplice, privato, funziona offline |

## Iterazioni

### Iterazione 1 — Fondamenta (motore)
- Modello delle 144 tessere, nomi italiani, tessere "di testa".
- Riconoscimento Mah-Jong: 4 combinazioni + coppia, 7 coppie, 13 lanterne e altre forme speciali.
- Calcolo punti completo FIMJ: punti delle combinazioni, bonus 20, raddoppi fondamentali e da chiusura, massimi, limite 1000/2000, pagamenti (EST doppio), arrotondamento alla decina, differenze di stecca tra non vincenti.
- Calcolo "distanza dalla chiusura" (shanten) e tessere utili: base per bot e consigli.

### Iterazione 2 — Impara (neofita)
- **Le tessere**: catalogo interattivo con nomi e famiglie.
- **Lezioni brevi con mini-quiz**: combinazioni, scopo del gioco, turno, chiamate, preparazione del tavolo (dadi, muro, breccia, tetto) per giocare col set vero.
- **Partita guidata**: una manche simulata passo-passo con istruzioni, tessere evidenziate e azioni da compiere.
- **Prontuario**: le regole essenziali su una pagina, da tenere aperta al tavolo.

### Iterazione 3 — Conta punti
- Inserimento della mano per combinazioni (tris/poker/scala/coppia, coperto/scoperto), fiori/stagioni, venti, condizioni di chiusura.
- **Recap dettagliato**: ogni riga di punteggio, ogni raddoppio con il motivo, formula finale, limite, arrotondamento.
- Modalità tavolo: i 4 giocatori, chi ha chiuso, **chi paga cosa a chi** e saldo netto.
- Segnapunti della partita (totali progressivi tra le manche).

### Iterazione 4 — Gioca e strategia
- Partita completa contro 3 avversari virtuali (due livelli), con chiamate, poker, fiori, tetto, fine manche e recap punti.
- **Consigliere**: su richiesta suggerisce lo scarto e spiega il perché (tessere utili rimaste, valore della mano, pericolo degli scarti).
- **Strategia**: articoli brevi (cosa tenere, cosa scartare, quando chiamare, difesa, Richi) ed **esercizi "cosa scarteresti?"** corretti dal motore.

## Evolutive proposte (dopo la v1)
1. **Pubblicazione e condivisione**: PWA installabile e offline, hosting gratuito con link da condividere; eventuale pacchetto app store con Capacitor.
2. **Multiplayer**: stanze con codice invito (es. Firebase/Supabase o server WebSocket); il motore è già separato dalla UI ed è riutilizzabile lato server per evitare imbrogli.
3. **Contapunti da foto**: riconoscimento delle tessere con un modello di visione (servizio cloud o modello on-device addestrato sul vostro set), con schermata di correzione manuale prima del calcolo.
4. Altre idee: variante Charleston, tavolo a 3, Richi per i bot, statistiche personali, modalità "regole di casa" (es. limite diverso).

## Interpretazioni del regolamento (da verificare con chi gioca)
- Un tris completato con uno scarto altrui conta come **scoperto**.
- I non vincenti contano tris/poker completi e le coppie di valore che hanno in mano.
- I raddoppi fondamentali valgono anche per i non vincenti con almeno 2 punti.
- Nelle 7 coppie non si possono usare 4 tessere uguali come due coppie.
- Mano patta (muro finito): i quattro giocatori si pagano solo le differenze di stecca.
- Vento di giro: in partita simulata ruota ogni 4 manche (EST, SUD, OVEST, NORD); nel contapunti si sceglie a mano.
