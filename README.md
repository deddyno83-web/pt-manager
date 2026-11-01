# 🏋️ Workout Log

App per programmare gli allenamenti, registrare i pesi mentre ti alleni e vedere i progressi nel tempo.
Funziona dal telefono (si installa come app) e dal computer.

## Funzioni

- **Schede A/B/C**: esercizi, serie, ripetizioni, recupero e note; modificabili quando vuoi
- **Allenamento live**: scegli la scheda, inserisci peso e ripetizioni serie per serie; vedi i valori dell'ultima volta già precompilati
- **Timer di recupero**: parte da solo quando spunti una serie, resta visibile su tutte le pagine, suono e vibrazione a fine tempo; c'è anche come timer libero
- **Progressi**: grafico per esercizio (peso massimo, 1RM stimato, volume), record personali, volume e allenamenti per settimana, storico
- **Musica**: salva playlist Spotify e ascoltale mentre ti alleni
- **Offline**: funziona anche con poco segnale, si sincronizza dopo
- Prossimamente: collegamento diretto a Spotify e agli smartwatch — vedi [docs/ARCHITETTURA.md](docs/ARCHITETTURA.md)

## Setup

1. Firebase Console → progetto → **Authentication** → abilita **Google**.
2. **Firestore Database** → **Regole** → incolla `firestore.rules` → **Pubblica**.
3. Crea un file `.env` nella cartella del progetto con le chiavi dell'app web Firebase:

```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

4. Avvio:

```bash
npm install
npm start
```

## Pubblicazione

A ogni push su `main` GitHub Actions compila e pubblica su GitHub Pages
(`.github/workflows/deploy.yml`, usa i secrets `REACT_APP_FIREBASE_*` del repository).
Se il sito è su un dominio nuovo, aggiungilo in Firebase → Authentication → Impostazioni → **Domini autorizzati**.

## Installare sul telefono

- iPhone: apri il sito in Safari → Condividi → **Aggiungi a Home**
- Android: Chrome → menu → **Installa app**

## Documentazione

[docs/ARCHITETTURA.md](docs/ARCHITETTURA.md): struttura del codice, dati, e piano per Spotify e smartwatch.

La versione precedente (PT Manager, gestione clienti) è salvata in `../pt-manager-backup-v1`.
