// src/features/presets/PresetsPage.js
import React, { useState } from 'react';
import { Plus, Pencil, Wand2 } from 'lucide-react';
import { usePresets, STARTER_PRESETS } from './usePresets';
import PresetEditor from './PresetEditor';

export default function PresetsPage() {
  const { presets, loading, addPreset, updatePreset, removePreset } = usePresets();
  const [editing, setEditing] = useState(null); // null | {} (nuovo) | preset

  const save = (draft) => {
    const { id, ...data } = draft;
    if (id) updatePreset(id, data);
    else addPreset({ ...data, order: presets.length + 1 });
    setEditing(null);
  };

  const createStarters = () => STARTER_PRESETS.forEach((p) => addPreset(p));

  return (
    <div className="page">
      <header className="page-head">
        <h1>Schede</h1>
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
          <p className="muted">Potrai modificarle come vuoi.</p>
        </div>
      )}

      {presets.map((p) => (
        <button key={p.id} className="preset-card" onClick={() => setEditing(p)}>
          <span className="badge" style={{ background: p.color }}>{p.letter || p.name[0]}</span>
          <span className="preset-info">
            <b>{p.name}</b>
            <small className="muted">
              {p.exercises.length} esercizi · {p.exercises.reduce((n, e) => n + e.sets, 0)} serie
            </small>
            <small className="muted ellipsis">{p.exercises.map((e) => e.name).join(' · ')}</small>
          </span>
          <Pencil size={16} className="muted" />
        </button>
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
