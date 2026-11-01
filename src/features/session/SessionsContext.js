// src/features/session/SessionsContext.js
// Storico degli allenamenti completati (un solo ascoltatore Firestore condiviso da tutta l'app).
import React, { createContext, useContext, useMemo } from 'react';
import { useUserCollection } from '../../core/useUserCollection';

const SessionsContext = createContext(null);
export const useSessions = () => useContext(SessionsContext);

export function SessionsProvider({ children }) {
  const { items, loading, add, remove } = useUserCollection('sessions', {
    orderField: 'startedAt', direction: 'desc', max: 1000,
  });

  const value = useMemo(
    () => ({ sessions: items, loading, saveSession: add, removeSession: remove }),
    [items, loading, add, remove]
  );
  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
}
