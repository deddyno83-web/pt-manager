// src/features/presets/usePresets.js
import { useUserCollection } from '../../core/useUserCollection';

export const PRESET_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6'];

// Un preset: { name, letter, color, exercises: [{ exerciseId, name, category, sets, reps, restSec, note }] }
export const newExerciseEntry = (ex) => ({
  exerciseId: ex.id,
  name: ex.nome,
  category: ex.categoria,
  sets: 3,
  reps: 10,
  restSec: 90,
  note: '',
});

export function usePresets() {
  const { items, loading, add, update, remove } = useUserCollection('presets', {
    orderField: 'order', direction: 'asc',
  });
  return { presets: items, loading, addPreset: add, updatePreset: update, removePreset: remove };
}

// Schede di esempio per partire subito (id presi dal catalogo).
export const STARTER_PRESETS = [
  {
    name: 'Allenamento A', letter: 'A', color: PRESET_COLORS[0], order: 1,
    exercises: [
      ['panca_piana', 'Panca Piana', 'Petto', 4, 8],
      ['panca_inclinata', 'Panca Inclinata', 'Petto', 3, 10],
      ['lento_avanti_mdb', 'Lento Avanti Manubri', 'Spalle', 3, 10],
      ['alzate_laterali', 'Alzate Laterali', 'Spalle', 3, 12],
      ['pushdown_corda', 'Pushdown con Corda', 'Tricipiti', 3, 12],
    ],
  },
  {
    name: 'Allenamento B', letter: 'B', color: PRESET_COLORS[1], order: 2,
    exercises: [
      ['lat_machine', 'Lat Machine', 'Schiena', 4, 10],
      ['rematore_bilanciere', 'Rematore Bilanciere', 'Schiena', 4, 8],
      ['seated_row', 'Seated Row', 'Schiena', 3, 10],
      ['face_pull', 'Face Pull', 'Spalle', 3, 15],
      ['curl_bilanciere', 'Curl Bilanciere', 'Bicipiti', 3, 10],
    ],
  },
  {
    name: 'Allenamento C', letter: 'C', color: PRESET_COLORS[2], order: 3,
    exercises: [
      ['squat', 'Squat', 'Gambe', 4, 8],
      ['leg_press_45', 'Leg Press 45°', 'Gambe', 3, 12],
      ['stacco_rumeno', 'Stacco Rumeno', 'Schiena', 3, 10],
      ['leg_curl', 'Leg Curl', 'Gambe', 3, 12],
      ['calf_raise', 'Calf Raise', 'Polpacci', 4, 15],
    ],
  },
].map((p) => ({
  ...p,
  exercises: p.exercises.map(([exerciseId, name, category, sets, reps]) => ({
    exerciseId, name, category, sets, reps, restSec: 90, note: '',
  })),
}));
