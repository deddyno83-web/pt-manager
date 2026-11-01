// src/features/presets/PresetEditor.js
import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import Modal from '../../shared/ui/Modal';
import ExercisePicker from '../exercises/ExercisePicker';
import { newExerciseEntry, PRESET_COLORS } from './usePresets';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function Stepper({ label, value, onChange, min, max, step = 1, suffix = '' }) {
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-ctl">
        <button type="button" onClick={() => onChange(clamp(value - step, min, max))}>−</button>
        <b>{value}{suffix}</b>
        <button type="button" onClick={() => onChange(clamp(value + step, min, max))}>+</button>
      </div>
    </div>
  );
}

export default function PresetEditor({ preset, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => ({
    name: '', letter: '', color: PRESET_COLORS[0], exercises: [], ...preset,
  }));
  const [picking, setPicking] = useState(false);

  const setField = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setExercise = (i, patch) =>
    setDraft((d) => ({ ...d, exercises: d.exercises.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) }));
  const removeExercise = (i) =>
    setDraft((d) => ({ ...d, exercises: d.exercises.filter((_, idx) => idx !== i) }));
  const move = (i, dir) =>
    setDraft((d) => {
      const list = [...d.exercises];
      const j = i + dir;
      if (j < 0 || j >= list.length) return d;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...d, exercises: list };
    });

  const canSave = draft.name.trim() && draft.exercises.length > 0;

  return (
    <>
      <Modal
        title={preset?.id ? 'Modifica scheda' : 'Nuova scheda'}
        onClose={onClose}
        footer={
          <>
            {preset?.id && (
              <button className="btn btn-danger" onClick={() => window.confirm('Eliminare questa scheda?') && onDelete()}>
                <Trash2 size={16} />
              </button>
            )}
            <button className="btn btn-primary grow" disabled={!canSave} onClick={() => onSave({ ...draft, name: draft.name.trim() })}>
              Salva scheda
            </button>
          </>
        }
      >
        <div className="field-row">
          <input
            className="input letter-input"
            maxLength={2}
            placeholder="A"
            value={draft.letter}
            onChange={(e) => setField({ letter: e.target.value.toUpperCase() })}
            aria-label="Lettera"
          />
          <input
            className="input grow"
            placeholder="Nome (es. Allenamento A – Petto)"
            value={draft.name}
            onChange={(e) => setField({ name: e.target.value })}
          />
        </div>

        <div className="color-row">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-dot ${draft.color === c ? 'on' : ''}`}
              style={{ background: c }}
              onClick={() => setField({ color: c })}
              aria-label={`Colore ${c}`}
            />
          ))}
        </div>

        <h3 className="section-title">Esercizi</h3>
        {draft.exercises.length === 0 && <p className="muted">Nessun esercizio. Aggiungine uno per iniziare.</p>}

        {draft.exercises.map((ex, i) => (
          <div className="ex-card" key={`${ex.exerciseId}-${i}`}>
            <div className="ex-card-head">
              <div>
                <b>{ex.name}</b>
                <small className="muted"> · {ex.category}</small>
              </div>
              <div className="row-tight">
                <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Su"><ArrowUp size={16} /></button>
                <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === draft.exercises.length - 1} aria-label="Giù"><ArrowDown size={16} /></button>
                <button className="icon-btn danger" onClick={() => removeExercise(i)} aria-label="Rimuovi"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="steppers">
              <Stepper label="Serie" value={ex.sets} min={1} max={12} onChange={(v) => setExercise(i, { sets: v })} />
              <Stepper label="Ripetizioni" value={ex.reps} min={1} max={50} onChange={(v) => setExercise(i, { reps: v })} />
              <Stepper label="Recupero" value={ex.restSec} min={0} max={600} step={15} suffix="s" onChange={(v) => setExercise(i, { restSec: v })} />
            </div>
            <input
              className="input"
              placeholder="Nota (es. tempo 3-1-1, presa stretta)"
              value={ex.note || ''}
              onChange={(e) => setExercise(i, { note: e.target.value })}
            />
          </div>
        ))}

        <button className="btn btn-ghost block" onClick={() => setPicking(true)}>
          <Plus size={16} /> Aggiungi esercizio
        </button>
      </Modal>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(ex) => {
            setDraft((d) => ({ ...d, exercises: [...d.exercises, newExerciseEntry(ex)] }));
            setPicking(false);
          }}
        />
      )}
    </>
  );
}
