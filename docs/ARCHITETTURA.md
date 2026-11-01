# Architettura di Workout Log

App web (React + Firebase), installabile sul telefono come PWA. Pensata a **moduli**: ogni
funzione vive nella sua cartella e dipende dal minimo indispensabile, così Spotify e
smartwatch si aggiungono senza riscrivere il resto.

## Struttura

```
src/
├── app/                  Avvio, provider, routing, layout, login
├── core/                 Cose usate da tutti: Firebase, auth, accesso ai dati, preferenze, formati
├── shared/               Componenti e hook riutilizzabili (Modal, wake lock)
├── styles/global.css     Tema scuro
└── features/
    ├── exercises/        Catalogo esercizi + esercizi personali + selettore
    ├── presets/          Schede A/B/C: elenco, editor, schede di esempio
    ├── session/          Allenamento in corso (live) + storico sessioni salvate
    ├── timer/            Timer di recupero globale, barra sempre visibile, pagina Timer
    ├── progress/         Grafici e statistiche (calcoli puri in stats.js)
    ├── music/            Playlist e player (provider Spotify)
    ├── integrations/     Punti di aggancio per servizi esterni (smartwatch)
    └── home/             Pagina "Oggi"
```

Regola: una feature può usare `core/` e `shared/`; tra feature si importano solo le cose
"pubbliche" (hook e contesti). I calcoli (`progress/stats.js`) sono funzioni pure, facili da
testare.

## Dati (Firestore)

Tutto sta sotto `users/{uid}/…`; le regole (`firestore.rules`) permettono a ciascun utente
solo il proprio spazio. La cache offline è attiva: in palestra senza rete funziona, e i dati
si sincronizzano dopo.

| Collezione | Contenuto |
|---|---|
| `presets` | Schede: `name, letter, color, order, exercises[{exerciseId, name, category, sets, reps, restSec, note}]` |
| `sessions` | Allenamenti conclusi: `presetId, presetName, startedAt, endedAt, durationSec, volume, exercises[{exerciseId, name, sets[{weight, reps}]}], notes, health` |
| `exercises` | Esercizi creati dall'utente: `nome, categoria` |
| `playlists` | Link musicali salvati: `provider, kind, externalId, url, embedUrl, title` |

L'allenamento **in corso** non è su Firestore: sta nel `localStorage` del dispositivo e viene
salvato solo a "Termina" (se chiudi l'app a metà, lo ritrovi).

Le preferenze del dispositivo (recupero predefinito, suono, vibrazione) sono in `localStorage`.

## Timer di recupero

`timer/TimerContext.js` vive sopra tutte le pagine. Salva l'**orario di fine** e non un
contatore, quindi resta esatto anche se il browser rallenta in background. Parte da solo
quando spunti una serie (impostazione) usando il recupero dell'esercizio. Suono e vibrazione
a fine tempo; lo schermo resta acceso mentre gira (Wake Lock).

Limite iOS: se blocchi lo schermo o cambi app, Safari sospende la pagina e il suono non parte
finché non torni nell'app; il tempo mostrato però è sempre corretto.

## Musica (Spotify)

- **Fase 1 (fatta):** incolli un link Spotify, lo salvi, lo riproduci con il player
  incorporato. Il player (`MusicDock`) sta nel layout, quindi la musica continua mentre
  cambi pagina. Senza chiavi né backend. Brani interi solo con Spotify Premium e login nel
  browser, altrimenti anteprime da 30 s.
- **Fase 2 (da fare):** collegamento vero all'account (OAuth PKCE + Web API) per elencare le
  playlist e controllare play/pausa dall'app. Servono: un'app su developer.spotify.com con un
  Client ID e il redirect verso l'indirizzo dell'app. Si completa in
  `music/providers/spotify.js` (le regole di Spotify per le app in modalità sviluppo vanno
  verificate al momento).
- Altri servizi (es. Apple Music): nuovo file in `music/providers/` + una riga in `index.js`.

## Smartwatch / Apple Salute (da fare)

Una web app **non può** leggere HealthKit. Strada consigliata, in ordine di semplicità:

1. App iOS nativa minima (o wrapper Capacitor + plugin HealthKit) che legge frequenza
   cardiaca e calorie dell'intervallo allenamento e le scrive in `users/{uid}/sessions/{id}.health`
   con la forma `{ source, avgHr, maxHr, kcal }`.
2. Se serve avviare/fermare l'allenamento dal polso: companion app watchOS (progetto Xcode a
   parte, stessa collezione Firestore).

Lato web è già predisposto: il modello `sessions` ha il campo `health`, e
`integrations/health.js` è il punto dove, a fine allenamento, si chiede il riepilogo. Quando
l'app nativa esiste basterà mostrare `health` nello storico e nei grafici.

## Come si aggiunge una funzione

1. Crea `src/features/<nome>/` con pagina e, se serve, un contesto.
2. Se salva dati, usa `useUserCollection('<collezione>')` (nessuna regola da aggiungere:
   `users/{uid}/**` è già coperto).
3. Aggiungi la rotta in `app/App.js` e, se serve, la voce in `app/AppLayout.js`.

## Backup della versione precedente

La vecchia app "PT Manager" (gestione clienti) è copiata in `../pt-manager-backup-v1`
(cartella accanto a questa).
