// src/features/presets/PresetsPage.js
import React, { useState } from 'react';
import { Plus, Pencil, Wand2, Trash2 } from 'lucide-react';
import { usePresets, STARTER_PRESETS } from './usePresets';
import PresetEditor from './PresetEditor';
import ExerciseList from '../exercises/ExerciseList';

export default function PresetsPage() {
  const { presets, loading, addPreset, updatePreset, removePreset } = usePresets();
  const [editing, setEditing] = useState(null); // null | {} (nuovo) | preset

  const save = (draft) => {
    const { id, ...data } = draft;
    if (id) updatePreset(id, data);
    else addPreset({ ...data, order: presets.length + 1 });
    setEditing(null);
  };

  const remove = (p) => {
    if (window.confirm(`Eliminare la scheda “${p.name}”? Gli allenamenti già fatti restano nello storico.`)) {
      removePreset(p.id);
    }
  };

  const createStarters =() => STARTER_PRESETS.forEach((p) => addPreset(p));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <small className="muted">Le tue routine</small>
          <h1>Schede</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <Plus size={18} /> Nuova
        </button>
      </header>

      {!loading && presets.length === 0 && (
        <div className="empty">
          <p>Non hai ancora nessuna scheda.</p>
          <button className="btn btn-primary" onClick={createStarters}>
            <Wand2 size={16} /> Crea A, B, C di esempio
          </button>
          <p className="muted small">Potrai modificarle come vuoi.</p>
        </div>
      )}

      {presets.map((p) => (
        <section key={p.id} className="preset-block" style={{ '--c': p.color }}>
          <header className="preset-block-head">
            <span className="badge lg" style={{ background: p.color }}>{p.letter || p.name[0]}</span>
            <div className="grow">
              <b>{p.name}</b>
              <small className="muted">
                {p.exercises.length} esercizi · {p.exercises.reduce((n, e) => n + e.sets, 0)} serie
              </small>
            </div>
            <button className="icon-btn edit" onClick={() => setEditing(p)} aria-label={`Modifica ${p.name}`}>
              <Pencil size={18} />
            </button>
            <button className="icon-btn danger" onClick={() => remove(p)} aria-label={`Elimina ${p.name}`}>
              <Trash2 size={18} />
            </button>
          </header>
          <ExerciseList exercises={p.exercises} />
        </section>
      ))}

      {editing && (
        <PresetEditor
          preset={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={() => { removePreset(editing.id); setEditing(null); }}
        />
      )}
    </div>
  );
}
