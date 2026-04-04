# 💪 PT Manager — Personal Trainer App

App web per la gestione di clienti, pacchetti lezioni e calendario appuntamenti.

## ✨ Funzionalità

- **Clienti individuali** con pacchetti lezioni (n° lezioni + costo)
- **Corsi di gruppo** con costo mensile e numero partecipanti
- **Calendario** per prenotare lezioni con scalatura automatica del pacchetto
- **Avvisi** quando un pacchetto sta per scadere (≤ 2 lezioni rimaste)
- **Rinnovo pacchetto** direttamente dalla scheda cliente
- **Dashboard** con: incassato del mese, clienti in scadenza, prossimi appuntamenti
- **Login con Google** tramite Firebase Authentication
- Dati salvati su **Firestore** per utente (multi-account sicuro)

---

## 🚀 Setup in 5 passi

### 1. Crea il progetto Firebase

1. Vai su [https://console.firebase.google.com](https://console.firebase.google.com)
2. Clicca **"Aggiungi progetto"** → dai un nome (es. `pt-manager`)
3. Disabilita Google Analytics se vuoi (opzionale) → **Crea progetto**

### 2. Configura Authentication

1. Nel menu laterale: **Authentication → Inizia**
2. Scheda **"Sign-in method"** → abilita **Google**
3. Inserisci un'email di supporto → **Salva**

### 3. Configura Firestore

1. Nel menu laterale: **Firestore Database → Crea database**
2. Scegli **"Inizia in modalità produzione"**
3. Seleziona la region (es. `europe-west3` per Germania/IT)
4. Vai su **Regole** e incolla il contenuto di `firestore.rules`
5. Clicca **Pubblica**

### 4. Ottieni le credenziali

1. **Impostazioni progetto** (icona ingranaggio) → **Le tue app**
2. Clicca **`</>`** (Web) → dai un nome → **Registra app**
3. Copia l'oggetto `firebaseConfig`

### 5. Configura il progetto locale

```bash
# Clona / scarica il progetto
cd pt-manager

# Copia il file .env
cp .env.example .env

# Apri .env e incolla i valori Firebase:
# REACT_APP_FIREBASE_API_KEY=...
# REACT_APP_FIREBASE_AUTH_DOMAIN=...
# ecc.

# Installa dipendenze
npm install

# Avvia in sviluppo
npm start
```

---

## 📦 Deploy su GitHub Pages (opzionale)

```bash
# Installa gh-pages
npm install --save-dev gh-pages

# Aggiungi in package.json:
# "homepage": "https://TUOUSERNAME.github.io/pt-manager",
# "predeploy": "npm run build",
# "deploy": "gh-pages -d build"

npm run deploy
```

> **⚠️ IMPORTANTE:** Non committare mai il file `.env` su GitHub! È già nel `.gitignore`.

---

## 🗂 Struttura progetto

```
src/
├── components/
│   └── layout/
│       └── Sidebar.js       # Navigazione laterale
├── contexts/
│   └── AuthContext.js       # Login Google / sessione utente
├── hooks/
│   ├── useClients.js        # CRUD clienti su Firestore
│   └── useAppointments.js   # CRUD appuntamenti su Firestore
├── pages/
│   ├── Login.js             # Pagina login
│   ├── Dashboard.js         # Home con statistiche
│   ├── Clienti.js           # Gestione clienti + pacchetti
│   └── Calendario.js        # Calendario + prenotazioni
├── styles/
│   └── global.css           # Tema dark "PT style"
├── firebase.js              # Configurazione Firebase
└── App.js                   # Routing principale
```

---

## 💡 Logica pacchetti lezioni

- Ogni cliente individuale ha un pacchetto con `packageLessons` (totale) e un costo
- Ogni appuntamento prenotato scala automaticamente il contatore
- Quando rimangono ≤ 2 lezioni → avviso giallo nel calendario e dashboard
- Quando rimangono 0 lezioni → impossibile prenotare, avviso rosso
- Il trainer può aggiungere un nuovo pacchetto dalla scheda cliente (il contatore riparte)

---

## 🔒 Sicurezza

- Ogni utente vede **solo i propri dati** (regole Firestore per `uid`)
- Accesso solo tramite account Google autorizzato
- Nessun dato sensibile nel codice (tutto in `.env`)
