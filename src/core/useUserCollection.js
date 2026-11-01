// src/core/useUserCollection.js
// Accesso generico a users/{uid}/{nome}: lettura in tempo reale + scritture "fire and forget".
// Le scritture non aspettano il server: con la cache offline di Firestore funzionano anche
// senza rete e si sincronizzano dopo. Se il server le rifiuta (es. regole non pubblicate)
// l'utente vede un avviso. Tutte le feature passano da qui.
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  collection, doc, onSnapshot, orderBy, query, limit as qLimit, setDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { DEMO } from './demo';
import { demoStore } from './demoStore';
import { notifyFirestoreError } from './notify';

function sortItems(items, orderField, direction, max) {
  const sorted = [...items].sort((a, b) => {
    const x = a[orderField] ?? 0;
    const y = b[orderField] ?? 0;
    if (x === y) return 0;
    return (x > y ? 1 : -1) * (direction === 'desc' ? -1 : 1);
  });
  return max ? sorted.slice(0, max) : sorted;
}

function useFirestoreCollection(name, { orderField = 'createdAt', direction = 'desc', max } = {}) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const col = useMemo(
    () => (user ? collection(db, 'users', user.uid, name) : null),
    [user, name]
  );

  useEffect(() => {
    if (!col) return undefined;
    const constraints = [orderBy(orderField, direction)];
    if (max) constraints.push(qLimit(max));
    return onSnapshot(
      query(col, ...constraints),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        notifyFirestoreError(err, `la lettura di ${name}`);
        setLoading(false);
      }
    );
  }, [col, name, orderField, direction, max]);

  // Crea un documento e restituisce subito l'id.
  const add = useCallback((data) => {
    const ref = doc(col);
    const now = Date.now();
    setDoc(ref, { ...data, createdAt: data.createdAt ?? now, updatedAt: now })
      .catch((e) => notifyFirestoreError(e, `il salvataggio di ${name}`));
    return ref.id;
  }, [col, name]);

  // Aggiorna (merge) un documento esistente.
  const update = useCallback((id, data) => {
    setDoc(doc(col, id), { ...data, updatedAt: Date.now() }, { merge: true })
      .catch((e) => notifyFirestoreError(e, `l'aggiornamento di ${name}`));
  }, [col, name]);

  const remove = useCallback((id) => {
    deleteDoc(doc(col, id)).catch((e) => notifyFirestoreError(e, `l'eliminazione da ${name}`));
  }, [col, name]);

  return { items, loading, add, update, remove };
}

function useDemoCollection(name, { orderField = 'createdAt', direction = 'desc', max } = {}) {
  const [raw, setRaw] = useState(() => demoStore.read(name));

  useEffect(() => demoStore.subscribe((changed) => {
    if (changed === name) setRaw(demoStore.read(name));
  }), [name]);

  const items = useMemo(() => sortItems(raw, orderField, direction, max), [raw, orderField, direction, max]);
  const add = useCallback((data) => demoStore.add(name, data), [name]);
  const update = useCallback((id, data) => demoStore.update(name, id, data), [name]);
  const remove = useCallback((id) => demoStore.remove(name, id), [name]);

  return { items, loading: false, add, update, remove };
}

// DEMO è una costante di build: la scelta non cambia mai durante l'esecuzione.
export const useUserCollection = DEMO ? useDemoCollection : useFirestoreCollection;
