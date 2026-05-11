// src/hooks/useClients.js
import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!user) return;
    const q = query(
      collection(db, 'clients'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }, [user]);

  // Carica al mount
  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Ricarica quando l'utente torna sulla tab/app (es. shortcut iPhone)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchClients(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchClients]);

  const addClient = async (data) => {
    const ref = await addDoc(collection(db, 'clients'), {
      ...data, uid: user.uid, createdAt: serverTimestamp(),
    });
    setClients(prev => [{ id: ref.id, ...data, uid: user.uid, createdAt: new Date() }, ...prev]);
    return ref;
  };

  const updateClient = async (id, data) => {
    await updateDoc(doc(db, 'clients', id), data);
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteClient = async (id) => {
    await deleteDoc(doc(db, 'clients', id));
    setClients(prev => prev.filter(c => c.id !== id));
  };

  return { clients, loading, addClient, updateClient, deleteClient, refetch: fetchClients };
}
