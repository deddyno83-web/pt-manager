// src/core/demoStore.js — archivio finto su localStorage, usato solo con REACT_APP_DEMO=1.
const KEY = (name) => `wl.demo.${name}`;
const listeners = new Set();

const ex = (exerciseId, name, category, sets, reps) => ({ exerciseId, name, category, sets, reps, restSec: 90, note: '' });

function seedData() {
  const presets = [
    { id: 'demo-a', name: 'Allenamento A', letter: 'A', color: '#3b82f6', order: 1, exercises: [
      ex('panca_piana', 'Panca Piana', 'Petto', 4, 8), ex('panca_inclinata', 'Panca Inclinata', 'Petto', 3, 10),
      ex('lento_avanti_mdb', 'Lento Avanti Manubri', 'Spalle', 3, 10), ex('pushdown_corda', 'Pushdown con Corda', 'Tricipiti', 3, 12) ] },
    { id: 'demo-b', name: 'Allenamento B', letter: 'B', color: '#22c55e', order: 2, exercises: [
      ex('lat_machine', 'Lat Machine', 'Schiena', 4, 10), ex('rematore_bilanciere', 'Rematore Bilanciere', 'Schiena', 4, 8),
      ex('curl_bilanciere', 'Curl Bilanciere', 'Bicipiti', 3, 10) ] },
    { id: 'demo-c', name: 'Allenamento C', letter: 'C', color: '#f59e0b', order: 3, exercises: [
      ex('squat', 'Squat', 'Gambe', 4, 8), ex('leg_press_45', 'Leg Press 45°', 'Gambe', 3, 12), ex('calf_raise', 'Calf Raise', 'Polpacci', 4, 15) ] },
  ].map((p) => ({ ...p, createdAt: 1, updatedAt: 1 }));

  const day = 86400000;
  const sessions = [];
  for (let i = 0; i < 20; i += 1) {
    const preset = presets[i % 3];
    const startedAt = Date.now() - (60 - i * 3) * day + 18 * 3600000 - (Date.now() % day);
    const exercises = preset.exercises.map((e, k) => ({
      exerciseId: e.exerciseId, name: e.name, category: e.category,
      sets: Array.from({ length: e.sets }, (_, s) => ({
        weight: 20 + k * 10 + Math.floor(i / 3) * 2.5 - s * 2.5, reps: e.reps - (s > 1 ? 1 : 0),
      })),
    }));
    const volume = exercises.reduce((n, x) => n + x.sets.reduce((m, s) => m + s.weight * s.reps, 0), 0);
    sessions.push({
      id: `demo-s${i}`, presetId: preset.id, presetName: preset.name, letter: preset.letter, color: preset.color,
      startedAt, endedAt: startedAt + 3000000, durationSec: 3000 + i * 20, exercises, volume: Math.round(volume), notes: '', health: null,
      createdAt: startedAt,
    });
  }
  return { presets, sessions };
}

function read(name) {
  try {
    const raw = localStorage.getItem(KEY(name));
    if (raw) return JSON.parse(raw);
  } catch { /* ignora */ }
  const seed = seedData()[name] || [];
  localStorage.setItem(KEY(name), JSON.stringify(seed));
  return seed;
}

function write(name, items) {
  localStorage.setItem(KEY(name), JSON.stringify(items));
  listeners.forEach((fn) => fn(name));
}

export const demoStore = {
  read,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  add(name, data) {
    const id = `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    write(name, [...read(name), { ...data, id, createdAt: data.createdAt ?? now, updatedAt: now }]);
    return id;
  },
  update(name, id, data) {
    write(name, read(name).map((x) => (x.id === id ? { ...x, ...data, updatedAt: Date.now() } : x)));
  },
  remove(name, id) {
    write(name, read(name).filter((x) => x.id !== id));
  },
};
