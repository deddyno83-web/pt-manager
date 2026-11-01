// src/core/firebase.js
// Le chiavi arrivano da .env (locale) o dai secrets GitHub (deploy): vedi README.
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { DEMO } from './demo';

let app = null;
let db = null;
let auth = null;
let googleProvider = null;

if (!DEMO) {
  app = initializeApp({
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  });

  // Cache locale: in palestra il segnale è spesso scarso, i dati restano
  // disponibili offline e si sincronizzano appena torna la rete.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

export { db, auth, googleProvider };
export default app;
