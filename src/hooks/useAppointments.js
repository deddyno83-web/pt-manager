// src/hooks/useAppointments.js
import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';

export function useAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    const q = query(
      collection(db, 'appointments'),
      where('uid', '==', user.uid),
      orderBy('date', 'asc')
    );
    const snap = await getDocs(q);
    setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchAppointments(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchAppointments]);

  const addAppointment = async (data) => {
    const ref = await addDoc(collection(db, 'appointments'), {
      ...data, uid: user.uid, createdAt: serverTimestamp(),
    });
    const newApt = { id: ref.id, ...data, uid: user.uid, createdAt: new Date() };
    setAppointments(prev =>
      [...prev, newApt].sort((a, b) => new Date(a.date) - new Date(b.date))
    );
    return ref;
  };

  const updateAppointment = async (id, data) => {
    await updateDoc(doc(db, 'appointments', id), data);
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, ...data } : a)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    );
  };

  const deleteAppointment = async (id) => {
    await deleteDoc(doc(db, 'appointments', id));
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  return { appointments, loading, addAppointment, updateAppointment, deleteAppointment, refetch: fetchAppointments };
}
