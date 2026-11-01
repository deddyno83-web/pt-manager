// src/core/demo.js
// Modalità demo per provare l'interfaccia in locale senza Firebase:
//   npm run demo   (utente finto, dati nel localStorage del browser, con qualche allenamento d'esempio)
// In produzione la variabile non c'è e tutto il codice demo viene scartato dalla build.
export const DEMO = process.env.REACT_APP_DEMO === '1';
