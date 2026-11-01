// src/core/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { DEMO } from './demo';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

const DEMO_USER = { uid: 'demo', displayName: 'Demo Atleta', email: 'demo@example.com' };

// Ogni account Google ha il proprio spazio dati (users/{uid}/...).
export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO ? DEMO_USER : null);
  const [loading, setLoading] = useState(!DEMO);

  useEffect(() => {
    if (DEMO) return undefined;
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  const loginWithGoogle = () => (DEMO ? Promise.resolve() : signInWithPopup(auth, googleProvider));
  const logout = () => (DEMO ? Promise.resolve() : signOut(auth));

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
