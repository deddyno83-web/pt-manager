// src/features/progress/ProgressPage.js
import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { Trash2, ChevronDown, ChevronUp, Trophy, Sparkles } from 'lucide-react';
import { useSessions } from '../session/SessionsContext';
import {
  trainedExercises, exerciseHistory, personalRecords, weeklyStats, sessionSets, exerciseSummaries,
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

function SummaryTab({ sessions, onOpen }) {
  const rows = useMemo(
    () => exerciseSummaries(sessions).sort((a, b) => b.pct - a.pct || b.count - a.count),
    [sessions]
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const d30 = 30 * 86400000;
    const recent = sessions.filter((s) => s.startedAt >= now - d30).length;
    const before = sessions.filter((s) => s.startedAt < now - d30 && s.startedAt >= now - 2 * d30).length;
    const compared = rows.filter((r) => r.prev);
    return {
      recent, before,
      improved: compared.filter((r) => r.lastTrend === 1).length,
      compared: compared.length,
      best: rows.find((r) => r.count > 1 && r.pct > 0),
    };
  }, [sessions, rows]);

  if (rows.length === 0) return <p className="muted pad">Completa il primo allenamento: qui vedrai cosa sta migliorando.</p>;

  const diff = stats.recent - stats.before;
  return (
    <>
      <div className="insight">
        <Sparkles size={20} />
        <div>
          <b>Negli ultimi 30 giorni hai fatto {stats.recent} {stats.recent === 1 ? 'allenamento' : 'allenamenti'}</b>
          {stats.before > 0 && (
            <> ({diff === 0 ? 'come' : diff > 0 ? `${diff} in più rispetto a` : `${-diff} in meno rispetto a`} i 30 giorni prima)</>
          )}
          .{' '}
          {stats.compared > 0 && <>Nell’ultimo allenamento sei migliorato in {stats.improved} esercizi su {stats.compared}. </>}
          {stats.best && <>Il progresso più grande: <b>{stats.best.name}</b>, +{Math.round(stats.best.pct)}% dall’inizio.</>}
        </div>
      </div>

      <h3 className="section-title">Esercizio per esercizio (dall’inizio a oggi)</h3>
      {rows.map((r) => {
        const trend = r.count < 2 ? 'flat' : r.pct > 0.5 ? 'up' : r.pct < -0.5 ? 'down' : 'flat';
        return (
          <button key={r.exerciseId} className="sum-prog" onClick={() => onOpen(r.exerciseId)}>
            <span className="grow">
              <b>{r.name}</b>
              <small className="muted">
                {r.count < 2
                  ? `Prima sessione: ${fmtKg(r.last.maxWeight)}`
                  : `${fmtKg(r.first.maxWeight)} → ${fmtKg(r.last.maxWeight)} · ${r.count} sessioni`}
              </small>
            </span>
            <span className={`sum-pct ${trend}`}>
              {r.count < 2 ? 'Nuovo' : `${r.pct > 0 ? '+' : ''}${Math.round(r.pct)}%`}
            </span>
          </button>
        );
      })}
      <p className="muted small">La percentuale usa il massimale stimato (1RM): tiene conto sia del peso sia delle ripetizioni.</p>
    </>
  );
}

function ExerciseTab({ sessions, selected, onSelect: setSelected }) {
  const exercises = useMemo(() => trainedExercises(sessions), [sessions]);
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
  const [tab, setTab] = useState('summary');
  const [selected, setSelected] = useState('');

  const openExercise = (id) => {
    setSelected(id);
    setTab('exercise');
  };

  return (
    <div className="page">
      <header className="page-head"><h1>Progressi</h1></header>
      <div className="tabs">
        <button className={tab === 'summary' ? 'on' : ''} onClick={() => setTab('summary')}>Riepilogo</button>
        <button className={tab === 'exercise' ? 'on' : ''} onClick={() => setTab('exercise')}>Grafici</button>
        <button className={tab === 'volume' ? 'on' : ''} onClick={() => setTab('volume')}>Settimane</button>
        <button className={tab === 'history' ? 'on' : ''} onClick={() => setTab('history')}>Storico</button>
      </div>
      {loading ? <p className="muted pad">Caricamento…</p> : (
        <>
          {tab === 'summary' && <SummaryTab sessions={sessions} onOpen={openExercise} />}
          {tab === 'exercise' && <ExerciseTab sessions={sessions} selected={selected} onSelect={setSelected} />}
          {tab === 'volume' && <VolumeTab sessions={sessions} />}
          {tab === 'history' && <HistoryTab sessions={sessions} onRemove={removeSession} />}
        </>
      )}
    </div>
  );
}
