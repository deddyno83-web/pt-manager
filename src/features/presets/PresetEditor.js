// src/features/presets/PresetEditor.js
import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, ChevronDown } from 'lucide-react';
import Modal from '../../shared/ui/Modal';
import ExercisePicker from '../exercises/ExercisePicker';
import { categoryColor } from '../exercises/categoryColors';
import { newExerciseEntry, PRESET_COLORS } from './usePresets';
import { fmtClock } from '../../core/format';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function Stepper({ label, value, onChange, min, max, step = 1, format = (v) => v }) {
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-ctl">
        <button type="button" onClick={() => onChange(clamp(value - step, min, max))} aria-label={`Meno ${label}`}>−</button>
        <b>{format(value)}</b>
        <button type="button" onClick={() => onChange(clamp(value + step, min, max))} aria-label={`Più ${label}`}>+</button>
      </div>
    </div>
  );
}

export default function PresetEditor({ preset, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => ({
    name: '', letter: '', color: PRESET_COLORS[0], exercises: [], ...preset,
  }));
  const [picking, setPicking] = useState(false);
  const [open, setOpen] = useState(null); // indice dell'esercizio espanso

  const setField = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setExercise = (i, patch) =>
    setDraft((d) => ({ ...d, exercises: d.exercises.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) }));
  const removeExercise = (i) => {
    setDraft((d) => ({ ...d, exercises: d.exercises.filter((_, idx) => idx !== i) }));
    setOpen(null);
  };
  const move = (i, dir) => {
    const j = i + dir;
    setDraft((d) => {
      if (j < 0 || j >= d.exercises.length) return d;
      const list = [...d.exercises];
      [list[i], list[j]] = [list[j], list[i]];
      return { ...d, exercises: list };
    });
    setOpen(j);
  };

  const canSave = draft.name.trim() && draft.exercises.length > 0;

  return (
    <>
      <Modal
        title={preset?.id ? 'Modifica scheda' : 'Nuova scheda'}
        onClose={onClose}
        footer={
          <>
            {preset?.id && (
              <button className="btn btn-danger" onClick={() => window.confirm('Eliminare questa scheda?') && onDelete()} aria-label="Elimina scheda">
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

        <h3 className="section-title">Esercizi · {draft.exercises.length}</h3>
        {draft.exercises.length === 0 && <p className="muted">Nessun esercizio. Aggiungine uno per iniziare.</p>}

        <div className="ed-list">
          {draft.exercises.map((ex, i) => {
            const isOpen = open === i;
            return (
              <div className={`ed-item ${isOpen ? 'open' : ''}`} key={`${ex.exerciseId}-${i}`}>
                <button className="ed-row" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                  <span className="ex-n">{i + 1}</span>
                  <span className="ed-main">
                    <b>{ex.name}</b>
                    <small><i className="dot" style={{ background: categoryColor(ex.category) }} />{ex.category}</small>
                  </span>
                  <span className="ed-sum">{ex.sets}×{ex.reps}<small>{fmtClock(ex.restSec)}</small></span>
                  <ChevronDown size={18} className="ed-chev" />
                </button>

                {isOpen && (
                  <div className="ed-detail">
                    <div className="steppers">
                      <Stepper label="Serie" value={ex.sets} min={1} max={12} onChange={(v) => setExercise(i, { sets: v })} />
                      <Stepper label="Ripetizioni" value={ex.reps} min={1} max={50} onChange={(v) => setExercise(i, { reps: v })} />
                      <Stepper label="Recupero" value={ex.restSec} min={0} max={600} step={15} format={fmtClock} onChange={(v) => setExercise(i, { restSec: v })} />
                    </div>
                    <input
                      className="input"
                      placeholder="Nota (es. tempo 3-1-1, presa stretta)"
                      value={ex.note || ''}
                      onChange={(e) => setExercise(i, { note: e.target.value })}
                    />
                    <div className="ed-actions">
                      <button className="btn btn-ghost" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp size={16} /> Su</button>
                      <button className="btn btn-ghost" onClick={() => move(i, 1)} disabled={i === draft.exercises.length - 1}><ArrowDown size={16} /> Giù</button>
                      <button className="btn btn-danger grow" onClick={() => removeExercise(i)}><Trash2 size={16} /> Rimuovi</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn btn-ghost block" onClick={() => setPicking(true)}>
          <Plus size={16} /> Aggiungi esercizio
        </button>
      </Modal>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(ex) => {
            setDraft((d) => ({ ...d, exercises: [...d.exercises, newExerciseEntry(ex)] }));
            setOpen(draft.exercises.length);
            setPicking(false);
          }}
        />
      )}
    </>
  );
}
