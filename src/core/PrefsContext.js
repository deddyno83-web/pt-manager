// src/core/PrefsContext.js
// Preferenze per-dispositivo (localStorage): timer, suoni, ecc.
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const KEY = 'wl.prefs';
const DEFAULTS = {
  restDefault: 90,   // secondi di recupero se l'esercizio non ne specifica uno
  autoRest: true,    // avvia il timer quando spunti una serie
  sound: true,
  vibrate: true,
};

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
}

const PrefsContext = createContext(null);
export const usePrefs = () => useContext(PrefsContext);

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(load);

  const setPref = useCallback((patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage non disponibile */ }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ prefs, setPref }), [prefs, setPref]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}
