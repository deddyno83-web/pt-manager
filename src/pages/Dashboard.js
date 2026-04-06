// src/pages/Dashboard.js
import React, { useMemo } from 'react';
import { useClients } from '../hooks/useClients';
import { useAppointments } from '../hooks/useAppointments';
import { getPackageQueue } from '../utils/packageUtils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { clients } = useClients();
  const { appointments } = useAppointments();
  const navigate = useNavigate();
  const today = new Date();

  const upcoming = useMemo(() =>
    appointments
      .filter(a => new Date(a.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5),
    [appointments]
  );

  const expiring = useMemo(() =>
    clients.filter(c => {
      if (c.type === 'corso') return false;
      const q = getPackageQueue(c, appointments);
      return q && q.isExpiring;
    }),
    [clients, appointments]
  );

  const monthlyRevenue = useMemo(() => {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return clients.reduce((sum, c) => {
      if (c.type === 'corso') return sum + (c.monthlyFee || 0);
      const pkgs = c.packages || [];
      const legacyAmt = (!pkgs.length && c.packagePurchasedAt) ? (() => {
        const d = new Date(c.packagePurchasedAt);
        return d >= start && d <= end ? (c.packageCost || 0) : 0;
      })() : 0;
      const newAmt = pkgs.reduce((s, p) => {
        const d = new Date(p.purchasedAt);
        return d >= start && d <= end ? s + (p.cost || 0) : s;
      }, 0);
      return sum + legacyAmt + newAmt;
    }, 0);
  }, [clients, appointments]);

  const corsi = clients.filter(c => c.type === 'corso');

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>{format(today, "EEEE d MMMM yyyy", { locale: it })}</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon accent">👥</div>
          <div className="stat-label">Clienti attivi</div>
          <div className="stat-value">{clients.length}</div>
          <div className="stat-sub">totale clienti</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">€</div>
          <div className="stat-label">Incassato questo mese</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>€{monthlyRevenue.toLocaleString('it-IT')}</div>
          <div className="stat-sub">{format(today, 'MMMM yyyy', { locale: it })}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📅</div>
          <div className="stat-label">Appuntamenti totali</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{appointments.length}</div>
          <div className="stat-sub">lezioni registrate</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⚠</div>
          <div className="stat-label">Pacchetti in scadenza</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{expiring.length}</div>
          <div className="stat-sub">≤ 2 lezioni rimaste</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>Prossimi appuntamenti</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendario')}>Vedi tutti →</button>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>Nessun appuntamento</div>
          ) : (
            upcoming.map(apt => {
              const client = clients.find(c => c.id === apt.clientId);
              const q = client ? getPackageQueue(client, appointments) : null;
              return (
                <div key={apt.id} className="appointment-item">
                  <div className="apt-time">{format(new Date(apt.date), 'HH:mm')}</div>
                  <div style={{ flex: 1 }}>
                    <div className="apt-name">{client ? `${client.nome} ${client.cognome}` : '—'}</div>
                    <div className="apt-detail">{format(new Date(apt.date), 'EEE d MMM', { locale: it })}{apt.note ? ` · ${apt.note}` : ''}</div>
                  </div>
                  {q && q.isExpiring && (
                    <span className={`badge ${q.allExhausted ? 'badge-red' : 'badge-yellow'}`}>
                      {q.allExhausted ? 'Esaurito' : `${q.totalRemaining} rimaste`}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>Pacchetti in scadenza</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clienti')}>Gestisci →</button>
          </div>
          {expiring.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>Nessun pacchetto in scadenza 🎉</div>
          ) : (
            expiring.map(client => {
              const q = getPackageQueue(client, appointments);
              const pct = q.totalLessons > 0 ? Math.max(0, (q.totalRemaining / q.totalLessons) * 100) : 0;
              return (
                <div key={client.id} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: `1px solid ${q.allExhausted ? 'var(--red-border)' : 'var(--amber-border)'}`, marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate('/clienti')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{client.nome} {client.cognome}</span>
                    <span className={`badge ${q.allExhausted ? 'badge-red' : 'badge-yellow'}`}>{q.allExhausted ? 'Esaurito' : `${q.totalRemaining} rimaste`}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${q.allExhausted ? 'red' : 'yellow'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{q.totalLessons - q.totalRemaining}/{q.totalLessons} lezioni usate</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {corsi.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.2px' }}>Corsi mensili</h3>
          <div className="grid-3">
            {corsi.map(corso => (
              <div key={corso.id} style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{corso.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>{corso.partecipanti || 0} partecipanti</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.3px' }}>€{corso.monthlyFee}/mese</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
