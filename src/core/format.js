// src/core/format.js
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export const fmtDate = (ms, pattern = 'd MMM yyyy') => format(new Date(ms), pattern, { locale: it });

// 65 -> "1:05"
export function fmtClock(totalSec) {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

// 3725 -> "1h 02m"; 2700 -> "45 min"
export function fmtDuration(totalSec) {
  const mins = Math.round(totalSec / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

export const fmtKg = (n) => {
  if (n == null || n === '') return '–';
  const v = Number(n);
  return `${Number.isInteger(v) ? v : v.toFixed(1)} kg`;
};

export const fmtVolume = (kg) => (kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${Math.round(kg)} kg`);

// Accetta anche la virgola decimale (tastiera italiana): "52,5" -> 52.5
export function parseNum(value) {
  if (value === '' || value == null) return '';
  const n = parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : '';
}
