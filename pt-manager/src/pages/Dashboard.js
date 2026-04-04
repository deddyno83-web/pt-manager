// src/pages/Dashboard.js
import React, { useMemo } from 'react';
import { useClients } from '../hooks/useClients';
import { useAppointments } from '../hooks/useAppointments';
import { format, isAfter, isBefore, addDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { clients } = useClients();
  const { appointments } = useAppointments();
  const navigate = useNavigate();
  const today = new Date();

  // Prossimi appuntamenti (oggi e futuri)
  const upcoming = useMemo(() =>
    appointments
      .filter(a => {
        const d = new Date(a.date);
        return isAfter(d, new Date(today.setHours(0,0,0,0)));
      })
      .slice(0, 5),
    [appointments]
  );

  // Clienti in scadenza (lezioni rimaste <= 2)
  const expiring = useMemo(() =>
    clients.filter(c => {
      if (c.type === 'corso') return false;
      const used = (appointments || []).filter(a => a.clientId === c.id).length;
      const remaining = (c.packageLessons || 0) - used;
      return remaining <= 2 && remaining >= 0;
    }),
    [clients, appointments]
  );

  // Incassato questo mese
  const monthlyRevenue = useMemo(() => {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return clients.reduce((sum, c) => {
      if (c.type === 'corso') {
        // Costo mensile corsi
        return sum + (c.monthlyFee || 0);
      }
      // Contiamo solo pacchetti acquistati questo mese
      if (c.packagePurchasedAt) {
        const d = new Date(c.packagePurchasedAt);
        if (d >= start && d <= end) return sum + (c.packageCost || 0);
      }
      return sum;
    }, 0);
  }, [clients]);

  return (
    <div>
      <div className="page-header">
        <h2>DASHBOARD</h2>
        <p>{format(today, "EEEE d MMMM yyyy", { locale: it })}</p>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card accent">
          <div className="stat-icon accent">👥</div>
          <div className="stat-label">Clienti attivi</div>
          <div className="stat-value" style={{ color: 'var(--text)' }}>{clients.length}</div>
          <div className="stat-sub">Totale clienti</div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon green">€</div>
          <div className="stat-label">Incassato questo mese</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>€{monthlyRevenue.toLocaleString('it-IT')}</div>
          <div className="stat-sub">{format(today, 'MMMM yyyy', { locale: it })}</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon blue">📅</div>
          <div className="stat-label">Appuntamenti totali</div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{appointments.length}</div>
          <div className="stat-sub">Lezioni registrate</div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon yellow">⚠</div>
          <div className="stat-label">Pacchetti in scadenza</div>
          <div className="stat-value" style={{ color: 'var(--yellow)' }}>{expiring.length}</div>
          <div className="stat-sub">≤ 2 lezioni rimaste</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Prossimi appuntamenti */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 22 }}>PROSSIMI APPUNTAMENTI</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendario')}>
              Vedi tutti →
            </button>
          </div>

          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              Nessun appuntamento prossimo
            </div>
          ) : (
            upcoming.map(apt => {
              const client = clients.find(c => c.id === apt.clientId);
              return (
                <div key={apt.id} className="appointment-item">
                  <div className="apt-time">
                    {format(new Date(apt.date), 'HH:mm')}
                  </div>
                  <div className="apt-info">
                    <div className="apt-client">{client?.nome} {client?.cognome}</div>
                    <div className="apt-detail">
                      {format(new Date(apt.date), 'EEE d MMM', { locale: it })}
                      {apt.note ? ` · ${apt.note}` : ''}
                    </div>
                  </div>
                  {apt.deducted && (
                    <span className="badge badge-green">✓</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Clienti in scadenza */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 22 }}>PACCHETTI IN SCADENZA</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clienti')}>
              Gestisci →
            </button>
          </div>

          {expiring.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              Nessun pacchetto in scadenza 🎉
            </div>
          ) : (
            expiring.map(client => {
              const used = appointments.filter(a => a.clientId === client.id).length;
              const remaining = (client.packageLessons || 0) - used;
              const pct = Math.max(0, (remaining / client.packageLessons) * 100);
              return (
                <div key={client.id} style={{
                  padding: '14px',
                  background: 'var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  marginBottom: 8,
                  cursor: 'pointer'
                }} onClick={() => navigate('/clienti')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{client.nome} {client.cognome}</span>
                    <span className={`badge ${remaining === 0 ? 'badge-red' : 'badge-yellow'}`}>
                      {remaining === 0 ? 'Esaurito' : `${remaining} rimaste`}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${remaining === 0 ? 'red' : 'yellow'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {used}/{client.packageLessons} lezioni usate
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Corsi mensili */}
      {clients.filter(c => c.type === 'corso').length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 22, marginBottom: 20 }}>CORSI MENSILI</h3>
          <div className="grid-3">
            {clients.filter(c => c.type === 'corso').map(corso => (
              <div key={corso.id} style={{
                background: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: 16,
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{corso.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  {corso.partecipanti || 0} partecipanti
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.3px' }}>
                  €{corso.monthlyFee}/mese
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
