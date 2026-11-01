// src/features/home/HomePage.js — "Oggi": ti propone la prossima scheda e la fai partire.
import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Play, Plus, ChevronRight, ChevronDown, Dumbbell, LogOut, Flame } from 'lucide-react';
import { startOfWeek, addDays, isSameDay, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAuth } from '../../core/AuthContext';
import { usePresets } from '../presets/usePresets';
import { useSessions } from '../session/SessionsContext';
import { useActiveSession } from '../session/ActiveSessionContext';
import ExerciseList from '../exercises/ExerciseList';
import { fmtDate, fmtDuration, fmtVolume } from '../../core/format';

// Allenamento senza scheda: parte vuoto e gli esercizi si aggiungono durante la sessione.
const FREE_WORKOUT = { id: null, name: 'Allenamento libero', letter: '+', color: '#a855f7', exercises: [] };

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
  const [expanded, setExpanded] = useState(null);

  const firstName = (user.displayName || '').split(' ')[0];

  const lastByPreset = useMemo(() => {
    const m = {};
    sessions.forEach((s) => { if (s.presetId && !m[s.presetId]) m[s.presetId] = s; });
    return m;
  }, [sessions]);

  // Prossima scheda in rotazione: quella dopo l'ultima fatta (A → B → C → A…).
  const next = useMemo(() => {
    if (presets.length === 0) return null;
    const lastId = sessions.find((s) => s.presetId)?.presetId;
    const idx = presets.findIndex((p) => p.id === lastId);
    return presets[(idx + 1) % presets.length];
  }, [presets, sessions]);

  const weekCount = useMemo(() => {
    const from = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
    return sessions.filter((s) => s.startedAt >= from).length;
  }, [sessions]);

  // Lunedì–domenica della settimana corrente, con gli allenamenti fatti ogni giorno
  // (anche più di uno, e anche quelli liberi/extra).
  const week = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(monday, i);
      return {
        key: i,
        label: format(day, 'EEEEE', { locale: it }).toUpperCase(),
        num: format(day, 'd'),
        today: isSameDay(day, new Date()),
        sessions: sessions.filter((s) => isSameDay(new Date(s.startedAt), day)),
      };
    });
  }, [sessions]);

  const go = (preset) => {
    if (active && !window.confirm('Hai già un allenamento in corso. Vuoi abbandonarlo e iniziarne un altro?')) return;
    start(preset);
    nav('/allenamento');
  };

  const others = presets.filter((p) => p.id !== next?.id);
  const lastLine = (p) => {
    const last = lastByPreset[p.id];
    return last
      ? `Ultima volta ${fmtDate(last.startedAt, 'd MMM')} · ${fmtDuration(last.durationSec)} · ${fmtVolume(last.volume)}`
      : 'Non l’hai ancora fatto';
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <small className="muted">{greeting()}{firstName ? `, ${firstName}` : ''}</small>
          <h1>Pronto ad allenarti?</h1>
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
        <div className="stat"><Flame size={18} /><b>{weekCount}</b><small>questa settimana</small></div>
        <div className="stat"><Dumbbell size={18} /><b>{sessions.length}</b><small>allenamenti totali</small></div>
      </div>

      <div className="week" aria-label="Settimana">
        {week.map((d) => (
          <div key={d.key} className={`day ${d.today ? 'today' : ''} ${d.sessions.length ? 'has' : ''}`}>
            <small>{d.label}</small>
            <b>{d.num}</b>
            <span className="day-dots">
              {d.sessions.map((s) => (
                <i key={s.id} style={{ background: s.color || '#64748b' }} title={s.presetName} />
              ))}
            </span>
          </div>
        ))}
      </div>

      {!loading && presets.length === 0 && (
        <div className="empty">
          <p>Prima crea le tue schede A, B, C.</p>
          <Link className="btn btn-primary" to="/schede">Vai alle schede</Link>
        </div>
      )}

      {next && (
        <section className="hero" style={{ '--c': next.color }}>
          <div className="hero-top">
            <span className="badge xl" style={{ background: next.color }}>{next.letter || next.name[0]}</span>
            <div className="grow">
              <small className="hero-kicker">Prossimo allenamento</small>
              <h2>{next.name}</h2>
              <small className="muted">
                {next.exercises.length} esercizi · {next.exercises.reduce((n, e) => n + e.sets, 0)} serie
              </small>
            </div>
          </div>
          <ExerciseList exercises={next.exercises} />
          <small className="muted">{lastLine(next)}</small>
          <button className="btn btn-primary btn-xl block" onClick={() => go(next)}>
            <Play size={20} /> Inizia allenamento
          </button>
        </section>
      )}

      {others.length > 0 && <h3 className="section-title">Altre schede</h3>}
      {others.map((p) => (
        <div key={p.id} className="today-card" style={{ '--c': p.color }}>
          <div className="today-top">
            <span className="badge" style={{ background: p.color }}>{p.letter || p.name[0]}</span>
            <div className="grow">
              <b>{p.name}</b>
              <small className="muted">{lastLine(p)}</small>
            </div>
            <button className="btn btn-primary" onClick={() => go(p)}><Play size={15} /> Inizia</button>
          </div>
          <button className="toggle" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
            {p.exercises.length} esercizi
            <ChevronDown size={16} className={expanded === p.id ? 'flip' : ''} />
          </button>
          {expanded === p.id && <ExerciseList exercises={p.exercises} />}
        </div>
      ))}

      <button className="btn btn-ghost block free-btn" onClick={() => go(FREE_WORKOUT)}>
        <Plus size={18} /> Allenamento libero / extra
      </button>
      <p className="muted small center">Un allenamento in più nella settimana: scegli gli esercizi mentre ti alleni.</p>
    </div>
  );
}
