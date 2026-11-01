// src/features/timer/TimerPage.js
import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Minus, Plus } from 'lucide-react';
import { useTimer } from './TimerContext';
import { usePrefs } from '../../core/PrefsContext';
import { fmtClock } from '../../core/format';

const PRESETS = [30, 45, 60, 90, 120, 180];
const R = 108;
const C = 2 * Math.PI * R;

export default function TimerPage() {
  const t = useTimer();
  const { prefs, setPref } = usePrefs();
  const [setup, setSetup] = useState(prefs.restDefault);

  const idle = t.status === 'idle';
  const done = t.status === 'done';
  const shown = idle ? setup : t.remainingSec;
  const progress = idle ? 0 : t.progress;

  const changeSetup = (d) => {
    const v = Math.min(900, Math.max(5, setup + d));
    setSetup(v);
    setPref({ restDefault: v });
  };

  return (
    <div className="page timer-page">
      <header className="page-head"><h1>Timer</h1></header>

      <div className={`dial ${done ? 'done' : ''}`}>
        <svg viewBox="0 0 240 240" aria-hidden="true">
          <circle cx="120" cy="120" r={R} className="dial-track" />
          <circle
            cx="120" cy="120" r={R} className="dial-bar"
            strokeDasharray={C}
            strokeDashoffset={C * progress}
            transform="rotate(-90 120 120)"
          />
        </svg>
        <div className="dial-text">
          <span className="dial-time">{done ? 'Via!' : fmtClock(shown)}</span>
          <small className="muted">
            {idle ? 'Pronto' : t.status === 'paused' ? 'In pausa' : done ? 'Recupero finito' : t.label || 'Recupero'}
          </small>
        </div>
      </div>

      {idle || done ? (
        <>
          <div className="chips center">
            {PRESETS.map((s) => (
              <button key={s} className={`chip ${setup === s ? 'on' : ''}`} onClick={() => { setSetup(s); setPref({ restDefault: s }); }}>
                {fmtClock(s)}
              </button>
            ))}
          </div>
          <div className="timer-adjust">
            <button className="icon-btn big" onClick={() => changeSetup(-15)} aria-label="Meno 15 secondi"><Minus size={22} /></button>
            <span className="muted">±15 s</span>
            <button className="icon-btn big" onClick={() => changeSetup(15)} aria-label="Più 15 secondi"><Plus size={22} /></button>
          </div>
          <button className="btn btn-primary btn-xl block" onClick={() => t.start(setup)}>
            <Play size={22} /> Avvia
          </button>
        </>
      ) : (
        <>
          <div className="timer-adjust">
            <button className="chip" onClick={() => t.adjust(-15)}>−15 s</button>
            <button className="chip" onClick={() => t.adjust(15)}>+15 s</button>
          </div>
          <div className="row center">
            <button className="btn btn-ghost btn-xl" onClick={t.reset}><RotateCcw size={20} /> Azzera</button>
            {t.status === 'running' ? (
              <button className="btn btn-primary btn-xl grow" onClick={t.pause}><Pause size={22} /> Pausa</button>
            ) : (
              <button className="btn btn-primary btn-xl grow" onClick={t.resume}><Play size={22} /> Riprendi</button>
            )}
          </div>
        </>
      )}

      <div className="card settings">
        <label className="switch-row">
          <span>Avvia da solo quando spunto una serie</span>
          <input type="checkbox" checked={prefs.autoRest} onChange={(e) => setPref({ autoRest: e.target.checked })} />
        </label>
        <label className="switch-row">
          <span>Suono a fine recupero</span>
          <input type="checkbox" checked={prefs.sound} onChange={(e) => setPref({ sound: e.target.checked })} />
        </label>
        <label className="switch-row">
          <span>Vibrazione</span>
          <input type="checkbox" checked={prefs.vibrate} onChange={(e) => setPref({ vibrate: e.target.checked })} />
        </label>
      </div>
    </div>
  );
}
