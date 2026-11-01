// src/features/integrations/health.js
// Punto di aggancio per smartwatch / app Salute (FUTURO, non attivo).
//
// Un sito web (PWA) NON può leggere Apple Salute/HealthKit: serve un'app iOS nativa
// (o un wrapper Capacitor con plugin HealthKit) che legga frequenza cardiaca e calorie e le
// scriva nel campo `health` della sessione su Firestore.
// L'app web è già pronta: a fine allenamento chiede un riepilogo a `healthProvider` e lo salva
// dentro la sessione; i grafici potranno poi usarlo senza cambiare il modello dati.
//
// Forma attesa di `getSummary(startMs, endMs)`:
//   { source: 'apple-health', avgHr: 128, maxHr: 171, kcal: 412 }  oppure  null
export const healthProvider = {
  id: 'none',
  isAvailable: () => false,
  getSummary: async () => null,
};
