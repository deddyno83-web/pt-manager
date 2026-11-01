// src/features/home/HomePage.js — "Oggi": scegli la scheda e parti.
import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Play, ChevronRight, Dumbbell, LogOut } from 'lucide-react';
import { startOfWeek } from 'date-fns';
import { useAuth } from '../../core/AuthContext';
import { usePresets } from '../presets/usePresets';
import { useSessions } from '../session/SessionsContext';
import { useActiveSession } from '../session/ActiveSessionContext';
import { fmtDate, fmtDuration, fmtVolume } from '../../core/format';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export default function HomePage() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { presets, loading } = usePresets();
  const { sessions } = useSessions();
  const { active, start } = useActiveSession();

  const firstName = (user.displayName || '').split(' ')[0];

  const lastByPreset = useMemo(() => {
    const m = {};
    sessions.forEach((s) => { if (s.presetId && !m[s.presetId]) m[s.presetId] = s; });
    return m;
  }, [sessions]);

  const weekCount = useMemo(() => {
    const from = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
    return sessions.filter((s) => s.startedAt >= from).length;
  }, [sessions]);

  const go = (preset) => {
    if (active && !window.confirm('Hai già un allenamento in corso. Vuoi abbandonarlo e iniziarne un altro?')) return;
    start(preset);
    nav('/allenamento');
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <small className="muted">{greeting()}{firstName ? `, ${firstName}` : ''}</small>
          <h1>Cosa alleniamo oggi?</h1>
        </div>
        <button className="icon-btn" onClick={logout} aria-label="Esci" title="Esci"><LogOut size={20} /></button>
      </header>

      {active && (
        <Link to="/allenamento" className="resume-card" style={{ '--c': active.color }}>
          <Dumbbell size={22} />
          <span className="grow">
            <b>Allenamento in corso</b>
            <small>{active.presetName} · tocca per riprendere</small>
          </span>
          <ChevronRight size={20} />
        </Link>
      )}

      <div className="stat-row">
        <div className="stat"><b>{weekCount}</b><small>allenamenti questa settimana</small></div>
        <div className="stat"><b>{sessions.length}</b><small>allenamenti totali</small></div>
      </div>

      {!loading && presets.length === 0 && (
        <div className="empty">
          <p>Prima crea le tue schede A, B, C.</p>
          <Link className="btn btn-primary" to="/schede">Vai alle schede</Link>
        </div>
      )}

      {presets.map((p) => {
        const last = lastByPreset[p.id];
        return (
          <div key={p.id} className="today-card" style={{ '--c': p.color }}>
            <div className="today-top">
              <span className="badge lg" style={{ background: p.color }}>{p.letter || p.name[0]}</span>
              <div className="grow">
                <b>{p.name}</b>
                <small className="muted">
                  {p.exercises.length} esercizi · {p.exercises.reduce((n, e) => n + e.sets, 0)} serie
                </small>
              </div>
            </div>
            <p className="muted ellipsis2">{p.exercises.map((e) => e.name).join(' · ')}</p>
            <div className="today-bottom">
              <small className="muted">
                {last ? `Ultima volta: ${fmtDate(last.startedAt, 'd MMM')} · ${fmtDuration(last.durationSec)} · ${fmtVolume(last.volume)}` : 'Mai fatto'}
              </small>
              <button className="btn btn-primary" onClick={() => go(p)}><Play size={16} /> Inizia</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
