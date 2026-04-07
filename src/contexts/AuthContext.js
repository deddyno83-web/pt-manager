// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// ── ACCESSO CONDIVISO ──
// L'account principale è deddyno83@gmail.com
// Tutti gli account qui sotto vedono e modificano gli STESSI dati
const OWNER_EMAIL = 'deddyno83@gmail.com';

const SHARED_ACCOUNTS = [
  'deddyno83@gmail.com',         // Edoardo Botta — account principale
  'daniblues.art22@gmail.com',   // collaboratore
  // aggiungi altri collaboratori qui
];

// UID del proprietario — tutti i collaboratori usano questo UID per i dati
// Per trovarlo: Firebase Console → Authentication → Users → copia UID di deddyno83@gmail.com
const OWNER_UID = 'eKaevzWBMXYLLduH610DequzB093';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = (firebaseUser.email || '').toLowerCase();
        const allowed = SHARED_ACCOUNTS.map(e => e.toLowerCase());

        if (allowed.includes(email)) {
          // Tutti gli account condividono lo stesso "uid virtuale" per i dati
          const virtualUser = {
            ...firebaseUser,
            // Sovrascriviamo l'uid con quello del proprietario
            // così tutti leggono/scrivono sullo stesso spazio dati
            uid: OWNER_UID !== 'SOSTITUISCI_CON_UID_REALE' ? OWNER_UID : firebaseUser.uid,
            realUid: firebaseUser.uid,
            isCollaborator: email !== OWNER_EMAIL.toLowerCase(),
          };
          setUser(virtualUser);
          setAuthError(null);
        } else {
          await signOut(auth);
          setUser(null);
          setAuthError(\`Accesso negato. L'email \${firebaseUser.email} non è autorizzata.\`);
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
