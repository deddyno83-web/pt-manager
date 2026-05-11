// src/hooks/useSchede.js
import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';

export function useSchede() {
  const { user } = useAuth();
  const [schede, setSchede] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchede = useCallback(async () => {
    if (!user) return;
    const q = query(
      collection(db, 'schede'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    setSchede(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSchede(); }, [fetchSchede]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchSchede(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchSchede]);

  const addScheda = async (data) => {
    const ref = await addDoc(collection(db, 'schede'), {
      ...data, uid: user.uid, createdAt: serverTimestamp(),
    });
    setSchede(prev => [{ id: ref.id, ...data, uid: user.uid, createdAt: new Date() }, ...prev]);
    return ref;
  };

  const updateScheda = async (id, data) => {
    await updateDoc(doc(db, 'schede', id), data);
    setSchede(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const deleteScheda = async (id) => {
    await deleteDoc(doc(db, 'schede', id));
    setSchede(prev => prev.filter(s => s.id !== id));
  };

  return { schede, loading, addScheda, updateScheda, deleteScheda, refetch: fetchSchede };
}
