// src/app/App.js — provider e routing. Ogni feature vive in src/features/<nome>.
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../core/AuthContext';
import { PrefsProvider } from '../core/PrefsContext';
import { SessionsProvider } from '../features/session/SessionsContext';
import { ActiveSessionProvider } from '../features/session/ActiveSessionContext';
import { TimerProvider } from '../features/timer/TimerContext';
import { MusicProvider } from '../features/music/MusicContext';
import Toaster from '../shared/ui/Toaster';
import Login from './Login';
import AppLayout from './AppLayout';
import HomePage from '../features/home/HomePage';
import PresetsPage from '../features/presets/PresetsPage';
import SessionPage from '../features/session/SessionPage';
import TimerPage from '../features/timer/TimerPage';
import ProgressPage from '../features/progress/ProgressPage';
import MusicPage from '../features/music/MusicPage';
import '../styles/global.css';

function Private({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <SessionsProvider>
      <ActiveSessionProvider>
        <TimerProvider>
          <MusicProvider>{children}</MusicProvider>
        </TimerProvider>
      </ActiveSessionProvider>
    </SessionsProvider>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Private><AppLayout /></Private>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/schede" element={<PresetsPage />} />
        <Route path="/allenamento" element={<SessionPage />} />
        <Route path="/timer" element={<TimerPage />} />
        <Route path="/progressi" element={<ProgressPage />} />
        <Route path="/musica" element={<MusicPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PrefsProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
        <Toaster />
      </PrefsProvider>
    </AuthProvider>
  );
}
