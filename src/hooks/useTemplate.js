// src/hooks/useTemplate.js
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

export function useTemplate() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'templates'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const addTemplate = async (data) => {
    return await addDoc(collection(db, 'templates'), {
      ...data,
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const updateTemplate = async (id, data) => {
    await updateDoc(doc(db, 'templates', id), data);
  };

  const deleteTemplate = async (id) => {
    await deleteDoc(doc(db, 'templates', id));
  };

  return { templates, loading, addTemplate, updateTemplate, deleteTemplate };
}
