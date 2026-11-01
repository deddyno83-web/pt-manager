// src/core/useUserCollection.js
// Accesso generico a users/{uid}/{nome}: lettura in tempo reale + scritture "fire and forget".
// Le scritture non aspettano il server: con la cache offline di Firestore funzionano anche
// senza rete e si sincronizzano dopo. Tutte le feature passano da qui.
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  collection, doc, onSnapshot, orderBy, query, limit as qLimit, setDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';

export function useUserCollection(name, { orderField = 'createdAt', direction = 'desc', max } = {}) {
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
        console.error(`Errore lettura ${name}`, err);
        setLoading(false);
      }
    );
  }, [col, name, orderField, direction, max]);

  // Crea un documento e restituisce subito l'id.
  const add = useCallback((data) => {
    const ref = doc(col);
    const now = Date.now();
    setDoc(ref, { ...data, createdAt: data.createdAt ?? now, updatedAt: now })
      .catch((e) => console.error(`Errore scrittura ${name}`, e));
    return ref.id;
  }, [col, name]);

  // Aggiorna (merge) un documento esistente.
  const update = useCallback((id, data) => {
    setDoc(doc(col, id), { ...data, updatedAt: Date.now() }, { merge: true })
      .catch((e) => console.error(`Errore aggiornamento ${name}`, e));
  }, [col, name]);

  const remove = useCallback((id) => {
    deleteDoc(doc(col, id)).catch((e) => console.error(`Errore eliminazione ${name}`, e));
  }, [col, name]);

  return { items, loading, add, update, remove };
}
