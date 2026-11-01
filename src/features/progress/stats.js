// src/features/progress/stats.js
// Funzioni pure di calcolo sulle sessioni salvate: nessuna dipendenza da React o Firebase.
// Una sessione: { startedAt, exercises: [{ exerciseId, name, sets: [{ reps, weight }] }] }
import { startOfWeek, subWeeks, format } from 'date-fns';
import { it } from 'date-fns/locale';

// Formula di Epley per la stima del massimale (1RM).
export const est1RM = (weight, reps) => {
  if (!weight || !reps) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
};

export const setVolume = (s) => (Number(s.weight) || 0) * (Number(s.reps) || 0);

export const exerciseVolume = (ex) => ex.sets.reduce((n, s) => n + setVolume(s), 0);

export const sessionVolume = (session) =>
  session.exercises.reduce((n, ex) => n + exerciseVolume(ex), 0);

export const sessionSets = (session) =>
  session.exercises.reduce((n, ex) => n + ex.sets.length, 0);

// Elenco esercizi con almeno una sessione, dal più recente.
export function trainedExercises(sessions) {
  const seen = new Map();
  [...sessions].sort((a, b) => b.startedAt - a.startedAt).forEach((s) =>
    s.exercises.forEach((ex) => {
      if (!seen.has(ex.exerciseId)) seen.set(ex.exerciseId, { exerciseId: ex.exerciseId, name: ex.name, count: 0 });
      seen.get(ex.exerciseId).count += 1;
    })
  );
  return [...seen.values()];
}

// Andamento di un esercizio: un punto per sessione, in ordine cronologico.
export function exerciseHistory(sessions, exerciseId) {
  return [...sessions]
    .sort((a, b) => a.startedAt - b.startedAt)
    .flatMap((s) => {
      const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
      if (!ex || ex.sets.length === 0) return [];
      const maxWeight = Math.max(...ex.sets.map((x) => Number(x.weight) || 0));
      const best1RM = Math.max(...ex.sets.map((x) => est1RM(Number(x.weight), Number(x.reps))));
      return [{
        sessionId: s.id,
        date: s.startedAt,
        maxWeight,
        best1RM: Math.round(best1RM * 10) / 10,
        volume: Math.round(exerciseVolume(ex)),
        sets: ex.sets,
      }];
    });
}

// Record personali di un esercizio.
export function personalRecords(history) {
  if (history.length === 0) return null;
  const best = (key) => history.reduce((a, b) => (b[key] > a[key] ? b : a));
  return {
    maxWeight: best('maxWeight'),
    best1RM: best('best1RM'),
    volume: best('volume'),
  };
}

// Set dell'ultima volta che l'esercizio è stato fatto (sessioni ordinate dalla più recente).
export function lastSetsFor(sessionsDesc, exerciseId) {
  for (const s of sessionsDesc) {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (ex && ex.sets.length) return ex.sets;
  }
  return null;
}

// Volume e numero di allenamenti per settimana (lunedì-domenica), ultime `weeks` settimane.
export function weeklyStats(sessions, weeks = 12) {
  const thisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = subWeeks(thisWeek, weeks - 1 - i);
    return { start: start.getTime(), label: format(start, 'd MMM', { locale: it }), volume: 0, workouts: 0 };
  });
  sessions.forEach((s) => {
    const wk = startOfWeek(new Date(s.startedAt), { weekStartsOn: 1 }).getTime();
    const b = buckets.find((x) => x.start === wk);
    if (b) {
      b.volume += Math.round(sessionVolume(s));
      b.workouts += 1;
    }
  });
  return buckets;
}
