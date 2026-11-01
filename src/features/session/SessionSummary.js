// src/features/session/SessionSummary.js — "com'è andata" a fine allenamento, rispetto all'ultima volta.
import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { fmtDuration, fmtVolume, fmtKg } from '../../core/format';

function Badge({ e }) {
  if (e.isFirst) return <span className="trend new"><Sparkles size={14} /> Prima volta</span>;
  if (e.isPR) return <span className="trend pr"><Trophy size={14} /> Record</span>;
  if (e.trend === 1) return <span className="trend up"><TrendingUp size={14} /> Meglio</span>;
  if (e.trend === -1) return <span className="trend down"><TrendingDown size={14} /> Sotto</span>;
  return <span className="trend flat"><Minus size={14} /> Uguale</span>;
}

const deltaText = (e) => {
  if (e.deltaKg == null) return fmtKg(e.maxWeight);
  if (e.deltaKg === 0) return `${fmtKg(e.maxWeight)} (come l’ultima volta)`;
  return `${fmtKg(e.maxWeight)} (${e.deltaKg > 0 ? '+' : ''}${e.deltaKg} kg)`;
};

export default function SessionSummary({ session, summary, onClose }) {
  const volDelta = summary.prevVolume ? summary.volume - summary.prevVolume : null;
  const headline =
    summary.prs > 0 ? `${summary.prs} ${summary.prs === 1 ? 'nuovo record' : 'nuovi record'}! 🎉`
      : summary.better > 0 ? `Sei migliorato in ${summary.better} ${summary.better === 1 ? 'esercizio' : 'esercizi'}`
        : 'Allenamento salvato';

  return (
    <div className="page summary">
      <header className="page-head">
        <div>
          <small className="muted">{session.presetName}</small>
          <h1>{headline}</h1>
        </div>
      </header>

      <div className="stat-row three">
        <div className="stat col"><b>{fmtDuration(session.durationSec)}</b><small>durata</small></div>
        <div className="stat col"><b>{session.exercises.reduce((n, e) => n + e.sets.length, 0)}</b><small>serie fatte</small></div>
        <div className="stat col">
          <b>{fmtVolume(summary.volume)}</b>
          <small>
            volume{volDelta != null && volDelta !== 0 ? ` · ${volDelta > 0 ? '+' : '−'}${fmtVolume(Math.abs(volDelta))}` : ''}
          </small>
        </div>
      </div>

      <h3 className="section-title">Rispetto all’ultima volta</h3>
      <div className="card sum-list">
        {summary.exercises.map((e) => (
          <div className="sum-row" key={e.exerciseId}>
            <div className="grow">
              <b>{e.name}</b>
              <small className="muted">{deltaText(e)}</small>
            </div>
            <Badge e={e} />
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-xl block" onClick={onClose}>Vedi i miei progressi</button>
    </div>
  );
}
