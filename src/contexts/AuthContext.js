// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// ── EMAIL AUTORIZZATE ──
// Aggiungi qui le email che possono accedere all'app
const ALLOWED_EMAILS = [
  'deddyno83@gmail.com',           // Edoardo Botta — Creact Srl
  'Daniblues.art22@gmail.com',     // <- email collaboratore
  // aggiungi altre email qui sotto
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || '';
        const allowed = ALLOWED_EMAILS.map(e => e.toLowerCase());
        if (allowed.includes(email.toLowerCase())) {
          setUser(firebaseUser);
          setAuthError(null);
        } else {
          // Email non autorizzata: logout immediato
          await signOut(auth);
          setUser(null);
          setAuthError(`Accesso negato. L'email ${email} non è autorizzata.`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, loading, authError }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
