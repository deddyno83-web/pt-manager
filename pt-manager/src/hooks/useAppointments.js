// src/hooks/useAppointments.js
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';

export function useAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'appointments'),
      where('uid', '==', user.uid),
      orderBy('date', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const addAppointment = async (data) => {
    return await addDoc(collection(db, 'appointments'), {
      ...data,
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const updateAppointment = async (id, data) => {
    await updateDoc(doc(db, 'appointments', id), data);
  };

  const deleteAppointment = async (id) => {
    await deleteDoc(doc(db, 'appointments', id));
  };

  return { appointments, loading, addAppointment, updateAppointment, deleteAppointment };
}
