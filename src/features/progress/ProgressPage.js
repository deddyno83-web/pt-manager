// src/features/progress/ProgressPage.js
import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { Trash2, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { useSessions } from '../session/SessionsContext';
import {
  trainedExercises, exerciseHistory, personalRecords, weeklyStats, sessionSets,
} from './stats';
import { fmtDate, fmtDuration, fmtVolume, fmtKg } from '../../core/format';

const ACCENT = '#4f8cff';
const GREEN = '#2dd36f';
const GRID = '#252b38';
const TICK = '#8b93a5';

const RANGES = [
  { id: '30', label: '30 g', days: 30 },
  { id: '90', label: '3 mesi', days: 90 },
  { id: '365', label: '1 anno', days: 365 },
  { id: 'all', label: 'Tutto', days: null },
];

const tooltipStyle = {
  background: '#1a1e27', border: '1px solid #2a2f3a', borderRadius: 8, color: '#e8ebf2', fontSize: 13,
};

function ExerciseTab({ sessions }) {
  const exercises = useMemo(() => trainedExercises(sessions), [sessions]);
  const [selected, setSelected] = useState('');
  const [metric, setMetric] = useState('maxWeight');
  const [range, setRange] = useState('90');

  const exId = selected || exercises[0]?.exerciseId;
  const history = useMemo(() => (exId ? exerciseHistory(sessions, exId) : []), [sessions, exId]);
  const prs = useMemo(() => personalRecords(history), [history]);

  const data = useMemo(() => {
    const days = RANGES.find((r) => r.id === range).days;
    const from = days ? Date.now() - days * 86400000 : 0;
    return history.filter((h) => h.date >= from).map((h) => ({ ...h, label: fmtDate(h.date, 'd MMM') }));
  }, [history, range]);

  if (exercises.length === 0) return <p className="muted pad">Completa il primo allenamento per vedere i grafici.</p>;

  const metrics = {
    maxWeight: { label: 'Peso massimo', unit: 'kg' },
    best1RM: { label: '1RM stimato', unit: 'kg' },
    volume: { label: 'Volume', unit: 'kg' },
  };

  return (
    <>
      <select className="input" value={exId} onChange={(e) => setSelected(e.target.value)}>
        {exercises.map((e) => <option key={e.exerciseId} value={e.exerciseId}>{e.name} ({e.count})</option>)}
      </select>

      <div className="chips">
        {Object.entries(metrics).map(([k, m]) => (
          <button key={k} className={`chip ${metric === k ? 'on' : ''}`} onClick={() => setMetric(k)}>{m.label}</button>
        ))}
      </div>

      <div className="card chart">
        {data.length < 2 ? (
          <p className="muted pad center">Servono almeno 2 sessioni nel periodo per il grafico.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: TICK, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: TICK, fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} ${metrics[metric].unit}`, metrics[metric].label]} />
              <Line type="monotone" dataKey={metric} stroke={ACCENT} strokeWidth={2.5} dot={{ r: 3, fill: ACCENT }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div className="chips">
          {RANGES.map((r) => (
            <button key={r.id} className={`chip sm ${range === r.id ? 'on' : ''}`} onClick={() => setRange(r.id)}>{r.label}</button>
          ))}
        </div>
      </div>

      {prs && (
        <div className="pr-grid">
          <div className="pr"><Trophy size={16} /><b>{fmtKg(prs.maxWeight.maxWeight)}</b><small>peso massimo · {fmtDate(prs.maxWeight.date, 'd MMM yy')}</small></div>
          <div className="pr"><Trophy size={16} /><b>{fmtKg(prs.best1RM.best1RM)}</b><small>1RM stimato · {fmtDate(prs.best1RM.date, 'd MMM yy')}</small></div>
          <div className="pr"><Trophy size={16} /><b>{fmtVolume(prs.volume.volume)}</b><small>volume max · {fmtDate(prs.volume.date, 'd MMM yy')}</small></div>
        </div>
      )}
    </>
  );
}

function VolumeTab({ sessions }) {
  const data = useMemo(() => weeklyStats(sessions, 12), [sessions]);
  const total = data.reduce((n, w) => n + w.workouts, 0);
  if (sessions.length === 0) return <p className="muted pad">Nessun dato ancora.</p>;
  return (
    <>
      <h3 className="section-title">Volume settimanale (kg sollevati)</h3>
      <div className="card chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: TICK, fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: TICK, fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#ffffff08' }} formatter={(v) => [`${v} kg`, 'Volume']} />
            <Bar dataKey="volume" fill={ACCENT} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3 className="section-title">Allenamenti a settimana ({total} in 12 settimane)</h3>
      <div className="card chart">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: TICK, fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fill: TICK, fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#ffffff08' }} formatter={(v) => [v, 'Allenamenti']} />
            <Bar dataKey="workouts" fill={GREEN} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function HistoryTab({ sessions, onRemove }) {
  const [open, setOpen] = useState(null);
  if (sessions.length === 0) return <p className="muted pad">Nessun allenamento salvato.</p>;
  return sessions.map((s) => (
    <div className="card hist" key={s.id}>
      <div className="hist-head">
        <button className="hist-toggle" onClick={() => setOpen(open === s.id ? null : s.id)}>
          <span className="badge" style={{ background: s.color }}>{s.letter || s.presetName?.[0]}</span>
          <span className="grow">
            <b>{s.presetName}</b>
            <small className="muted">
              {fmtDate(s.startedAt, 'EEE d MMM yyyy')} · {fmtDuration(s.durationSec)} · {sessionSets(s)} serie · {fmtVolume(s.volume)}
            </small>
          </span>
          {open === s.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        <button
          className="icon-btn danger"
          aria-label="Elimina allenamento"
          onClick={() =>
            window.confirm(`Eliminare l’allenamento “${s.presetName}” del ${fmtDate(s.startedAt, 'd MMM yyyy')}? I grafici si aggiorneranno.`) &&
            onRemove(s.id)
          }
        >
          <Trash2 size={18} />
        </button>
      </div>
      {open === s.id && (
        <div className="hist-body">
          {s.exercises.map((ex) => (
            <div key={ex.exerciseId} className="hist-ex">
              <b>{ex.name}</b>
              <span className="muted">{ex.sets.map((x) => `${x.weight}×${x.reps}`).join('  ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  ));
}

export default function ProgressPage() {
  const { sessions, loading, removeSession } = useSessions();
  const [tab, setTab] = useState('exercise');

  return (
    <div className="page">
      <header className="page-head"><h1>Progressi</h1></header>
      <div className="tabs">
        <button className={tab === 'exercise' ? 'on' : ''} onClick={() => setTab('exercise')}>Esercizio</button>
        <button className={tab === 'volume' ? 'on' : ''} onClick={() => setTab('volume')}>Settimane</button>
        <button className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}>Storico</button>
      </div>
      {loading ? <p className="muted pad">Caricamento…</p> : (
        <>
          {tab === 'exercise' && <ExerciseTab sessions={sessions} />}
          {tab === 'volume' && <VolumeTab sessions={sessions} />}
          {tab === 'history' && <HistoryTab sessions={sessions} onRemove={removeSession} />}
        </>
      )}
    </div>
  );
}
