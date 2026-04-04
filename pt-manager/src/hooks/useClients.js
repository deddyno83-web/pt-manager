// src/hooks/useClients.js
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'clients'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const addClient = async (data) => {
    return await addDoc(collection(db, 'clients'), {
      ...data,
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const updateClient = async (id, data) => {
    await updateDoc(doc(db, 'clients', id), data);
  };

  const deleteClient = async (id) => {
    await deleteDoc(doc(db, 'clients', id));
  };

  return { clients, loading, addClient, updateClient, deleteClient };
}
