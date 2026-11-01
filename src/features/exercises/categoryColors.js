// src/features/exercises/categoryColors.js — un colore per gruppo muscolare, usato in tutte le liste.
const COLORS = {
  Petto: '#ef4444',
  Schiena: '#3b82f6',
  Spalle: '#f59e0b',
  Bicipiti: '#a855f7',
  Tricipiti: '#ec4899',
  Gambe: '#22c55e',
  Glutei: '#f472b6',
  Addominali: '#14b8a6',
  Polpacci: '#84cc16',
  Avambracci: '#94a3b8',
  Cardio: '#f97316',
  'Corpo libero': '#06b6d4',
  Funzionale: '#eab308',
  Stretching: '#8b5cf6',
};

export const categoryColor = (cat) => COLORS[cat] || '#64748b';
