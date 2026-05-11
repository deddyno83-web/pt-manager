// src/hooks/useTemplate.js
import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';

export function useTemplate() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    const q = query(
      collection(db, 'templates'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchTemplates(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchTemplates]);

  const addTemplate = async (data) => {
    const ref = await addDoc(collection(db, 'templates'), {
      ...data, uid: user.uid, createdAt: serverTimestamp(),
    });
    setTemplates(prev => [{ id: ref.id, ...data, uid: user.uid, createdAt: new Date() }, ...prev]);
    return ref;
  };

  const updateTemplate = async (id, data) => {
    await updateDoc(doc(db, 'templates', id), data);
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const deleteTemplate = async (id) => {
    await deleteDoc(doc(db, 'templates', id));
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return { templates, loading, addTemplate, updateTemplate, deleteTemplate, refetch: fetchTemplates };
}
