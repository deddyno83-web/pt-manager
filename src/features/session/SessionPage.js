// src/features/session/SessionPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Plus, Trash2, Flag, Timer, TrendingUp } from 'lucide-react';
import { useActiveSession } from './ActiveSessionContext';
import { useSessions } from './SessionsContext';
import SessionSummary from './SessionSummary';
import { sessionComparison, est1RM } from '../progress/stats';
import { useTimer } from '../timer/TimerContext';
import { usePrefs } from '../../core/PrefsContext';
import ExercisePicker from '../exercises/ExercisePicker';
import { fmtClock, parseNum } from '../../core/format';

function Elapsed({ since }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const sec = Math.max(0, Math.floor((now - since) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, '0');
  return <span className="elapsed">{h ? `${h}:${String(m).padStart(2, '0')}` : m}:{s}</span>;
}

function SetRow({ index, set, onChange, onToggle, onRemove }) {
  const prev = set.prevWeight != null && set.prevWeight !== ''
    ? `${set.prevWeight}×${set.prevReps}`
    : '–';
  // Freccia verde: la serie spuntata è migliore (1RM stimato più alto) di quella dell'ultima volta.
  const better = set.done && set.prevWeight != null && set.prevWeight !== ''
    && est1RM(Number(set.weight), Number(set.reps)) > est1RM(Number(set.prevWeight), Number(set.prevReps));
  return (
    <div className={`set-row ${set.done ? 'done' : ''}`}>
      <span className="set-n">{index + 1}</span>
      <span className="set-prev muted">{prev}{better && <TrendingUp size={13} className="up-ico" aria-label="Meglio dell'ultima volta" />}</span>
      <input
        className="input num"
        inputMode="decimal"
        placeholder="kg"
        value={set.weight}
        onChange={(e) => onChange({ weight: e.target.value.replace(/[^0-9.,]/g, '') })}
        onBlur={(e) => onChange({ weight: parseNum(e.target.value) })}
        aria-label={`Peso serie ${index + 1}`}
      />
      <input
        className="input num"
        inputMode="numeric"
        placeholder="rip"
        value={set.reps}
        onChange={(e) => onChange({ reps: e.target.value.replace(/\D/g, '') })}
        aria-label={`Ripetizioni serie ${index + 1}`}
      />
      <button className={`check ${set.done ? 'on' : ''}`} onClick={onToggle} aria-label="Serie fatta">
        <Check size={20} />
      </button>
      <button className="icon-btn faint" onClick={onRemove} aria-label="Elimina serie"><Trash2 size={15} /></button>
    </div>
  );
}

export default function SessionPage() {
  const nav = useNavigate();
  const { active, updateSet, addSet, removeSet, addExercise, removeExercise, discard, finish } = useActiveSession();
  const timer = useTimer();
  const { prefs } = usePrefs();
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null); // riepilogo mostrato dopo "Termina"
  const { sessions } = useSessions();

  if (done) {
    return <SessionSummary session={done.session} summary={done.summary} onClose={() => nav('/progressi')} />;
  }

  if (!active) {
    return (
      <div className="page">
        <div className="empty">
          <p>Nessun allenamento in corso.</p>
          <Link className="btn btn-primary" to="/">Scegli cosa fare oggi</Link>
        </div>
      </div>
    );
  }

  const doneCount = active.exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.done).length, 0);
  const totalCount = active.exercises.reduce((n, ex) => n + ex.sets.length, 0);

  const toggle = (exIdx, setIdx) => {
    const ex = active.exercises[exIdx];
    const becomingDone = !ex.sets[setIdx].done;
    updateSet(exIdx, setIdx, { done: becomingDone });
    if (becomingDone && prefs.autoRest) {
      timer.start(ex.restSec > 0 ? ex.restSec : prefs.restDefault, ex.name);
    }
  };

  const end = async () => {
    if (doneCount === 0) {
      if (!window.confirm('Nessuna serie completata. Chiudere senza salvare?')) return;
      discard();
      nav('/');
      return;
    }
    if (doneCount < totalCount && !window.confirm(`Hai spuntato ${doneCount} serie su ${totalCount}. Le serie non spuntate non vengono salvate. Terminare?`)) return;
    setSaving(true);
    timer.reset();
    const history = sessions; // storico PRIMA di questa sessione: serve per il confronto
    const res = await finish();
    if (res) setDone({ session: res.session, summary: sessionComparison(res.session, history) });
    else nav('/');
  };

  const abandon = () => {
    if (window.confirm('Annullare l’allenamento? I dati inseriti andranno persi.')) {
      timer.reset();
      discard();
      nav('/');
    }
  };

  return (
    <div className="page">
      <header className="session-head">
        <span className="badge" style={{ background: active.color }}>{active.letter || active.presetName[0]}</span>
        <div className="grow">
          <h1>{active.presetName}</h1>
          <small className="muted"><Elapsed since={active.startedAt} /> · {doneCount}/{totalCount} serie</small>
        </div>
        <button className="btn btn-primary" onClick={end} disabled={saving}><Flag size={16} /> Termina</button>
      </header>

      <div className="progress-line"><i style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%`, background: active.color }} /></div>

      {active.exercises.map((ex, exIdx) => (
        <section className="ex-block" key={`${ex.exerciseId}-${exIdx}`}>
          <div className="ex-block-head">
            <div>
              <h3>{ex.name}</h3>
              <small className="muted">
                {ex.targetReps} rip · recupero {fmtClock(ex.restSec)}{ex.note ? ` · ${ex.note}` : ''}
              </small>
            </div>
            <button className="icon-btn faint" onClick={() => window.confirm(`Togliere ${ex.name}?`) && removeExercise(exIdx)} aria-label="Rimuovi esercizio">
              <Trash2 size={16} />
            </button>
          </div>

          <div className="set-head">
            <span>Serie</span><span>Prima</span><span>Kg</span><span>Rip</span><span />
          </div>
          {ex.sets.map((s, setIdx) => (
            <SetRow
              key={setIdx}
              index={setIdx}
              set={s}
              onChange={(patch) => updateSet(exIdx, setIdx, patch)}
              onToggle={() => toggle(exIdx, setIdx)}
              onRemove={() => removeSet(exIdx, setIdx)}
            />
          ))}
          <div className="row">
            <button className="btn btn-ghost grow" onClick={() => addSet(exIdx)}><Plus size={16} /> Serie</button>
            <button className="btn btn-ghost" onClick={() => timer.start(ex.restSec || prefs.restDefault, ex.name)}>
              <Timer size={16} /> Recupero
            </button>
          </div>
        </section>
      ))}

      <button className="btn btn-ghost block" onClick={() => setPicking(true)}><Plus size={16} /> Aggiungi esercizio</button>
      <button className="btn btn-link block danger" onClick={abandon}>Annulla allenamento</button>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(ex) => { addExercise(ex); setPicking(false); }}
        />
      )}
    </div>
  );
}
