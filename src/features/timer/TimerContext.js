// src/features/timer/TimerContext.js
// Timer di recupero globale: vive sopra tutte le pagine, così continua a girare mentre
// navighi (es. dal timer alla scheda). Calcola il tempo da un orario di fine assoluto,
// quindi resta preciso anche se il browser rallenta i timer in background.
import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { usePrefs } from '../../core/PrefsContext';
import useWakeLock from '../../shared/hooks/useWakeLock';
import { alertRestOver, unlockAudio } from './alert';

const TimerContext = createContext(null);
export const useTimer = () => useContext(TimerContext);

const DONE_VISIBLE_MS = 8000;

export function TimerProvider({ children }) {
  const { prefs } = usePrefs();
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  // status: idle | running | paused | done
  const [state, setState] = useState({ status: 'idle', total: 0, endAt: 0, remainingMs: 0, label: '' });
  const [now, setNow] = useState(Date.now());

  const remainingMs =
    state.status === 'running' ? Math.max(0, state.endAt - now) : state.remainingMs;

  // Tick: solo mentre il timer gira.
  useEffect(() => {
    if (state.status !== 'running') return undefined;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [state.status]);

  // Scadenza.
  useEffect(() => {
    if (state.status === 'running' && state.endAt - now <= 0) {
      alertRestOver({ sound: prefsRef.current.sound, vibrate: prefsRef.current.vibrate });
      setState((s) => ({ ...s, status: 'done', remainingMs: 0 }));
    }
  }, [state.status, state.endAt, now]);

  // "Recupero finito" sparisce da solo.
  useEffect(() => {
    if (state.status !== 'done') return undefined;
    const id = setTimeout(() => setState((s) => ({ ...s, status: 'idle' })), DONE_VISIBLE_MS);
    return () => clearTimeout(id);
  }, [state.status]);

  useWakeLock(state.status === 'running');

  const start = useCallback((seconds, label = '') => {
    unlockAudio();
    const ms = Math.max(1, seconds) * 1000;
    const t = Date.now();
    setNow(t);
    setState({ status: 'running', total: seconds, endAt: t + ms, remainingMs: ms, label });
  }, []);

  const pause = useCallback(() => {
    setState((s) => (s.status === 'running'
      ? { ...s, status: 'paused', remainingMs: Math.max(0, s.endAt - Date.now()) }
      : s));
  }, []);

  const resume = useCallback(() => {
    unlockAudio();
    setState((s) => {
      if (s.status !== 'paused') return s;
      const t = Date.now();
      setNow(t);
      return { ...s, status: 'running', endAt: t + s.remainingMs };
    });
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({ ...s, status: 'idle', remainingMs: 0 }));
  }, []);

  // Aggiunge/toglie secondi (es. +15 / −15) al recupero in corso.
  const adjust = useCallback((deltaSec) => {
    setState((s) => {
      const d = deltaSec * 1000;
      if (s.status === 'running') {
        const endAt = Math.max(Date.now() + 1000, s.endAt + d);
        return { ...s, endAt, total: Math.max(1, s.total + deltaSec) };
      }
      if (s.status === 'paused') {
        return { ...s, remainingMs: Math.max(1000, s.remainingMs + d), total: Math.max(1, s.total + deltaSec) };
      }
      return s;
    });
  }, []);

  const value = useMemo(() => ({
    status: state.status,
    total: state.total,
    label: state.label,
    remainingSec: Math.ceil(remainingMs / 1000),
    progress: state.total ? Math.min(1, Math.max(0, 1 - remainingMs / (state.total * 1000))) : 0,
    start, pause, resume, reset, adjust,
  }), [state, remainingMs, start, pause, resume, reset, adjust]);

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
