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

// ── Confronti "a parole": cosa è migliorato ─────────────────────────────────────

// Punteggio di un esercizio in una sessione: 1RM stimato; se è a corpo libero (peso 0) il volume.
const score = (h) => (h.best1RM > 0 ? h.best1RM : h.volume);

// Per ogni esercizio: primo dato, ultimo dato, penultimo, e di quanto è cambiato.
export function exerciseSummaries(sessions) {
  return trainedExercises(sessions).map(({ exerciseId, name, count }) => {
    const h = exerciseHistory(sessions, exerciseId);
    const first = h[0];
    const last = h[h.length - 1];
    const prev = h.length > 1 ? h[h.length - 2] : null;
    const pct = h.length > 1 && score(first) > 0 ? ((score(last) - score(first)) / score(first)) * 100 : 0;
    return {
      exerciseId, name, count, first, last, prev,
      pct,
      deltaKg: last.maxWeight - first.maxWeight,
      lastTrend: prev ? Math.sign(Math.round((score(last) - score(prev)) * 10) / 10) : 0, // +1 / 0 / -1
    };
  });
}

// Confronta una sessione appena finita con lo storico precedente.
export function sessionComparison(session, previousSessions) {
  const exercises = session.exercises.map((ex) => {
    const past = exerciseHistory(previousSessions, ex.exerciseId);
    const now = exerciseHistory([session], ex.exerciseId)[0];
    const prev = past[past.length - 1] || null;
    const bestBefore = past.reduce((m, p) => Math.max(m, score(p)), 0);
    return {
      exerciseId: ex.exerciseId,
      name: ex.name,
      maxWeight: now.maxWeight,
      prevMaxWeight: prev ? prev.maxWeight : null,
      deltaKg: prev ? Math.round((now.maxWeight - prev.maxWeight) * 10) / 10 : null,
      trend: prev ? Math.sign(Math.round((score(now) - score(prev)) * 10) / 10) : null,
      isFirst: !prev,
      isPR: !!prev && score(now) > bestBefore,
    };
  });
  const lastSame = previousSessions.find((s) => s.presetId && s.presetId === session.presetId);
  return {
    exercises,
    volume: session.volume,
    prevVolume: lastSame ? lastSame.volume : null,
    prs: exercises.filter((e) => e.isPR).length,
    better: exercises.filter((e) => e.trend === 1).length,
  };
}
