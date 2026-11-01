// src/core/notify.js — avvisi a comparsa ("toast") richiamabili da qualsiasi punto.
const listeners = new Set();
let lastMsg = '';
let lastAt = 0;

export const subscribeNotify = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function notify(message, { kind = 'error', sticky = false } = {}) {
  const now = Date.now();
  if (message === lastMsg && now - lastAt < 5000) return; // niente doppioni
  lastMsg = message;
  lastAt = now;
  listeners.forEach((fn) => fn({ id: now + Math.random(), message, kind, sticky }));
}

// Traduce gli errori di Firestore in frasi comprensibili.
export function notifyFirestoreError(err, what = 'i dati') {
  console.error(err);
  if (err?.code === 'permission-denied') {
    notify(
      'Salvataggio rifiutato dal server: le regole di Firestore non sono ancora pubblicate. ' +
        'Apri Firebase → Firestore → Regole, incolla il file firestore.rules e premi Pubblica.',
      { sticky: true }
    );
  } else if (err?.code === 'unavailable') {
    notify('Sei offline: i dati restano sul dispositivo e si sincronizzeranno appena torna la rete.', { kind: 'info' });
  } else {
    notify(`Errore con ${what}: ${err?.message || 'riprova'}`);
  }
}
