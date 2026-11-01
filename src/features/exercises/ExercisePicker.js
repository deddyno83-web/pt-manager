// src/features/exercises/ExercisePicker.js
import React, { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import Modal from '../../shared/ui/Modal';
import { useExercises } from './useExercises';
import { CATEGORIE } from './catalog';

export default function ExercisePicker({ onPick, onClose }) {
  const { exercises, addCustom } = useExercises();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [creating, setCreating] = useState(false);
  const [newCat, setNewCat] = useState(CATEGORIE[0]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter(
      (e) => (!cat || e.categoria === cat) && (!q || e.nome.toLowerCase().includes(q))
    );
  }, [exercises, search, cat]);

  const createAndPick = () => {
    const nome = search.trim();
    if (!nome) return;
    const id = addCustom(nome, newCat);
    onPick({ id, nome, categoria: newCat });
  };

  return (
    <Modal title="Scegli esercizio" onClose={onClose}>
      <div className="search-box">
        <Search size={18} />
        <input
          autoFocus
          placeholder="Cerca esercizio…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="chips">
        <button className={`chip ${!cat ? 'on' : ''}`} onClick={() => setCat('')}>Tutti</button>
        {CATEGORIE.map((c) => (
          <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <ul className="list">
        {filtered.slice(0, 80).map((e) => (
          <li key={e.id}>
            <button className="list-row" onClick={() => onPick(e)}>
              <span>{e.nome}</span>
              <small>{e.categoria}{e.custom ? ' · tuo' : ''}</small>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="muted pad">Nessun esercizio trovato.</li>}
      </ul>

      {search.trim() && (
        <div className="create-box">
          {!creating ? (
            <button className="btn btn-ghost" onClick={() => setCreating(true)}>
              <Plus size={16} /> Crea “{search.trim()}”
            </button>
          ) : (
            <div className="row">
              <select value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                {CATEGORIE.map((c) => <option key={c}>{c}</option>)}
              </select>
              <button className="btn btn-primary" onClick={createAndPick}>Crea e aggiungi</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
