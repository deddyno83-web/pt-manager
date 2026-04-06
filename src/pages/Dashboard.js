// src/pages/Dashboard.js
import React, { useMemo } from 'react';
import { useClients } from '../hooks/useClients';
import { useSchede } from '../hooks/useSchede';
import { useAppointments } from '../hooks/useAppointments';
import { getPackageQueue } from '../utils/packageUtils';
import { format, startOfMonth, endOfMonth, parseISO, addDays, isBefore } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { clients } = useClients();
  const { appointments } = useAppointments();
  const { schede } = useSchede();
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

  const revenue = useMemo(() => {
    const start = startOfMonth(today);
    const end = endOfMonth(today);

    let individuali = 0;
    let corsi = 0;

    clients.forEach(c => {
      if (c.type === 'corso') {
        corsi += (c.monthlyFee || 0);
      } else {
        // pacchetti acquistati questo mese
        const pkgs = c.packages || [];
        if (pkgs.length === 0 && c.packagePurchasedAt) {
          const d = new Date(c.packagePurchasedAt);
          if (d >= start && d <= end) individuali += (c.packageCost || 0);
        } else {
          pkgs.forEach(p => {
            const d = new Date(p.purchasedAt);
            if (d >= start && d <= end) individuali += (p.cost || 0);
          });
        }
      }
    });

    return { individuali, corsi, totale: individuali + corsi };
  }, [clients]);

  const schedeInScadenza = useMemo(() => {
    const now = new Date();
    return schede.filter(s => {
      if (!s.dataFine) return false;
      const fine = parseISO(s.dataFine);
      return isBefore(fine, addDays(now, 7));
    });
  }, [schede]);

  const corsi = clients.filter(c => c.type === 'corso');
  const individuali = clients.filter(c => c.type === 'individuale');

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>{format(today, "EEEE d MMMM yyyy", { locale: it })}</p>
      </div>

      {/* Stat cards principali */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon accent">👥</div>
          <div className="stat-label">Clienti totali</div>
          <div className="stat-value">{clients.length}</div>
          <div className="stat-sub">{individuali.length} ind. · {corsi.length} corsi</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">€</div>
          <div className="stat-label">Totale {format(today, 'MMMM', { locale: it })}</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>€{revenue.totale.toLocaleString('it-IT')}</div>
          <div className="stat-sub">incassato questo mese</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📅</div>
          <div className="stat-label">Lezioni registrate</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{appointments.length}</div>
          <div className="stat-sub">totale storico</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⚠</div>
          <div className="stat-label">In scadenza</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{expiring.length}</div>
          <div className="stat-sub">pacchetti ≤ 2 lezioni</div>
        </div>
      </div>

      {/* Entrate divise */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Entrate {format(today, 'MMMM yyyy', { locale: it })}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: 'var(--accent-light)', borderRadius: 10, padding: '14px 16px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Clienti individuali</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.5px' }}>€{revenue.individuali.toLocaleString('it-IT')}</div>
              <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>{individuali.length} clienti</div>
            </div>
            <div style={{ flex: 1, background: 'var(--green-light)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--green-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Corsi di gruppo</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.5px' }}>€{revenue.corsi.toLocaleString('it-IT')}</div>
              <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>{corsi.length} corsi attivi</div>
            </div>
          </div>
          {/* Barra proporzione */}
          {revenue.totale > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${(revenue.individuali / revenue.totale) * 100}%`, background: 'var(--accent)', borderRadius: '6px 0 0 6px', transition: 'width 0.4s' }} />
                <div style={{ flex: 1, background: 'var(--green)', borderRadius: '0 6px 6px 0' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
                <span>{Math.round((revenue.individuali / revenue.totale) * 100)}% individuali</span>
                <span>{Math.round((revenue.corsi / revenue.totale) * 100)}% corsi</span>
              </div>
            </div>
          )}
        </div>

        {/* Corsi mensili lista */}
        {corsi.length > 0 && (
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Corsi attivi</div>
            {corsi.map(corso => (
              <div key={corso.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{corso.nome} {corso.cognome}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{corso.partecipanti || 0} partecipanti</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--green)', letterSpacing: '-0.3px' }}>€{corso.monthlyFee}/mese</div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>Totale corsi</span>
              <span style={{ fontWeight: 700, color: 'var(--green)' }}>€{revenue.corsi.toLocaleString('it-IT')}/mese</span>
            </div>
          </div>
        )}

        {corsi.length === 0 && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--text-3)' }}>
            <div style={{ fontSize: 28 }}>📚</div>
            <div style={{ fontSize: 13 }}>Nessun corso attivo</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clienti')}>+ Aggiungi corso</button>
          </div>
        )}
      </div>

      {/* Schede in scadenza */}
      {schedeInScadenza.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <strong>⚠ {schedeInScadenza.length} scheda{schedeInScadenza.length > 1 ? 'e' : ''} in scadenza</strong>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {schedeInScadenza.map(s => {
                const cl = clients.find(c => c.id === s.clienteId);
                return <span key={s.id} style={{ marginRight: 12 }}>{cl ? `${cl.nome} ${cl.cognome}` : '—'} · {s.nome} (scade {format(parseISO(s.dataFine), 'd MMM', { locale: it })})</span>;
              })}
            </div>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/schede')}>Gestisci schede →</button>
        </div>
      )}

      <div className="grid-2">
        {/* Prossimi appuntamenti */}
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

        {/* Pacchetti in scadenza */}
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
    </div>
  );
}
