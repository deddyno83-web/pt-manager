// src/features/session/ActiveSessionContext.js
// L'allenamento in corso. Salvato in localStorage a ogni modifica: se chiudi l'app o si
// scarica il telefono a metà, quando riapri riprendi da dove eri. Su Firestore finisce
// solo quando premi "Termina".
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../core/AuthContext';
import { useSessions } from './SessionsContext';
import { lastSetsFor, sessionVolume } from '../progress/stats';
import { healthProvider } from '../integrations/health';
import { newExerciseEntry } from '../presets/usePresets';
import useWakeLock from '../../shared/hooks/useWakeLock';

const Ctx = createContext(null);
export const useActiveSession = () => useContext(Ctx);

const storageKey = (uid) => `wl.active.${uid}`;

// Costruisce le serie di un esercizio partendo dall'ultima volta (se esiste).
function buildSets(entry, lastSets) {
  return Array.from({ length: entry.sets }, (_, i) => {
    const prev = lastSets ? lastSets[Math.min(i, lastSets.length - 1)] : null;
    return {
      weight: prev ? prev.weight : '',
      reps: prev ? prev.reps : entry.reps,
      prevWeight: prev ? prev.weight : null,
      prevReps: prev ? prev.reps : null,
      done: false,
    };
  });
}

export function ActiveSessionProvider({ children }) {
  const { user } = useAuth();
  const { sessions, saveSession } = useSessions();
  const [active, setActive] = useState(null);
  const loadedFor = useRef(null);

  // Ripristino all'avvio.
  useEffect(() => {
    if (!user || loadedFor.current === user.uid) return;
    loadedFor.current = user.uid;
    try {
      const raw = localStorage.getItem(storageKey(user.uid));
      setActive(raw ? JSON.parse(raw) : null);
    } catch {
      setActive(null);
    }
  }, [user]);

  // Salvataggio a ogni modifica.
  useEffect(() => {
    if (!user || loadedFor.current !== user.uid) return;
    try {
      if (active) localStorage.setItem(storageKey(user.uid), JSON.stringify(active));
      else localStorage.removeItem(storageKey(user.uid));
    } catch { /* storage pieno/non disponibile */ }
  }, [active, user]);

  useWakeLock(!!active);

  const start = useCallback((preset) => {
    setActive({
      presetId: preset.id || null,
      presetName: preset.name,
      letter: preset.letter || '',
      color: preset.color,
      startedAt: Date.now(),
      exercises: preset.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        category: e.category,
        restSec: e.restSec,
        targetReps: e.reps,
        note: e.note || '',
        sets: buildSets(e, lastSetsFor(sessions, e.exerciseId)),
      })),
    });
  }, [sessions]);

  const updateSet = useCallback((exIdx, setIdx, patch) => {
    setActive((a) => a && ({
      ...a,
      exercises: a.exercises.map((ex, i) => (i !== exIdx ? ex : {
        ...ex,
        sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)),
      })),
    }));
  }, []);

  const addSet = useCallback((exIdx) => {
    setActive((a) => a && ({
      ...a,
      exercises: a.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, {
            weight: last ? last.weight : '', reps: last ? last.reps : ex.targetReps,
            prevWeight: null, prevReps: null, done: false,
          }],
        };
      }),
    }));
  }, []);

  const removeSet = useCallback((exIdx, setIdx) => {
    setActive((a) => a && ({
      ...a,
      exercises: a.exercises.map((ex, i) => (i !== exIdx ? ex : {
        ...ex, sets: ex.sets.filter((_, j) => j !== setIdx),
      })),
    }));
  }, []);

  const addExercise = useCallback((ex) => {
    const entry = newExerciseEntry(ex);
    setActive((a) => a && ({
      ...a,
      exercises: [...a.exercises, {
        exerciseId: entry.exerciseId, name: entry.name, category: entry.category,
        restSec: entry.restSec, targetReps: entry.reps, note: '',
        sets: buildSets(entry, lastSetsFor(sessions, entry.exerciseId)),
      }],
    }));
  }, [sessions]);

  const removeExercise = useCallback((exIdx) => {
    setActive((a) => a && ({ ...a, exercises: a.exercises.filter((_, i) => i !== exIdx) }));
  }, []);

  const discard = useCallback(() => setActive(null), []);

  // Salva solo le serie spuntate. Restituisce { id, session }, oppure null se non c'era niente da salvare.
  const finish = useCallback(async (notes = '') => {
    if (!active) return null;
    const exercises = active.exercises
      .map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        category: ex.category,
        sets: ex.sets
          .filter((s) => s.done)
          .map((s) => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0 })),
      }))
      .filter((ex) => ex.sets.length > 0);

    if (exercises.length === 0) {
      setActive(null);
      return null;
    }

    const endedAt = Date.now();
    const health = await healthProvider.getSummary(active.startedAt, endedAt).catch(() => null);
    const session = {
      presetId: active.presetId,
      presetName: active.presetName,
      letter: active.letter,
      color: active.color,
      startedAt: active.startedAt,
      endedAt,
      durationSec: Math.round((endedAt - active.startedAt) / 1000),
      exercises,
      notes,
      health,
    };
    session.volume = Math.round(sessionVolume(session));
    const id = saveSession(session);
    setActive(null);
    return { id, session: { ...session, id } };
  }, [active, saveSession]);

  const value = useMemo(() => ({
    active, start, updateSet, addSet, removeSet, addExercise, removeExercise, discard, finish,
  }), [active, start, updateSet, addSet, removeSet, addExercise, removeExercise, discard, finish]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
