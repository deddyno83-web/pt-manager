// src/features/exercises/useExercises.js
// Unisce il catalogo di base con gli esercizi creati dall'utente.
import { useMemo } from 'react';
import { useUserCollection } from '../../core/useUserCollection';
import { ESERCIZI_DEFAULT } from './catalog';

const base = ESERCIZI_DEFAULT.map(({ id, nome, categoria }) => ({ id, nome, categoria, custom: false }));

export function useExercises() {
  const { items, add, remove } = useUserCollection('exercises', { orderField: 'nome', direction: 'asc' });

  const all = useMemo(() => {
    const custom = items.map((e) => ({ id: e.id, nome: e.nome, categoria: e.categoria, custom: true }));
    return [...base, ...custom];
  }, [items]);

  const byId = useMemo(() => Object.fromEntries(all.map((e) => [e.id, e])), [all]);

  const addCustom = (nome, categoria) => add({ nome: nome.trim(), categoria });

  return { exercises: all, byId, addCustom, removeCustom: remove };
}
