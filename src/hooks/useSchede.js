// src/hooks/useSchede.js
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

export function useSchede() {
  const { user } = useAuth();
  const [schede, setSchede] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'schede'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setSchede(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const addScheda = async (data) => {
    return await addDoc(collection(db, 'schede'), {
      ...data,
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const updateScheda = async (id, data) => {
    await updateDoc(doc(db, 'schede', id), data);
  };

  const deleteScheda = async (id) => {
    await deleteDoc(doc(db, 'schede', id));
  };

  return { schede, loading, addScheda, updateScheda, deleteScheda };
}
