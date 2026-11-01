// src/features/timer/RestTimerBar.js
// Barra compatta sempre visibile (sopra la navigazione) mentre un recupero è attivo.
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pause, Play, X, Timer } from 'lucide-react';
import { useTimer } from './TimerContext';
import { fmtClock } from '../../core/format';

export default function RestTimerBar() {
  const t = useTimer();
  const nav = useNavigate();
  const { pathname } = useLocation();

  if (t.status === 'idle' || pathname === '/timer') return null;

  const done = t.status === 'done';
  return (
    <div className={`rest-bar ${done ? 'done' : ''}`} style={{ '--p': t.progress }}>
      <button className="rest-main" onClick={() => nav('/timer')} aria-label="Apri timer">
        <Timer size={18} />
        <span className="rest-time">{done ? 'Recupero finito!' : fmtClock(t.remainingSec)}</span>
        {t.label && !done && <small className="muted ellipsis">{t.label}</small>}
      </button>
      {!done && (
        <>
          <button className="chip" onClick={() => t.adjust(-15)}>−15</button>
          <button className="chip" onClick={() => t.adjust(15)}>+15</button>
          <button className="icon-btn" onClick={t.status === 'running' ? t.pause : t.resume} aria-label="Pausa/Riprendi">
            {t.status === 'running' ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </>
      )}
      <button className="icon-btn" onClick={t.reset} aria-label="Chiudi"><X size={18} /></button>
    </div>
  );
}
