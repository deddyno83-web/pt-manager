// src/pages/Dashboard.js
import React, { useMemo, useState } from 'react';
import { useClients } from '../hooks/useClients';
import { useSchede } from '../hooks/useSchede';
import { useAppointments } from '../hooks/useAppointments';
import { getPackageQueue } from '../utils/packageUtils';
import { format, startOfMonth, endOfMonth, parseISO, addDays, isBefore } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const TIME_SLOTS = Array.from({ length: 66 }, (_, i) => {
  const totalMin = 6 * 60 + i * 15;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

function calcFine(time, durata) {
  const [h, m] = time.split(':').map(Number);
  const tot = h * 60 + m + Number(durata);
  return `${String(Math.floor(tot / 60)).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`;
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`toast ${type}`}>{msg}</div>;
}

export default function Dashboard() {
  const { clients } = useClients();
  const { appointments, addAppointment } = useAppointments();
  const { schede } = useSchede();
  const navigate = useNavigate();
  const today = new Date();

  const [toast, setToast] = useState(null);
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null); // 'individuali' | 'corsi' | 'nonPagato' | 'totale'
  const [qb, setQb] = useState({
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    durata: '60',
    note: '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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
    let individuali = 0, corsi = 0, nonPagato = 0;
    clients.forEach(c => {
      if (c.type === 'corso') {
        corsi += (c.monthlyFee || 0);
      } else {
        const pkgs = c.packages || [];
        if (pkgs.length === 0 && c.packagePurchasedAt) {
          const d = new Date(c.packagePurchasedAt);
          if (d >= start && d <= end) individuali += (c.packageCost || 0);
        } else {
          pkgs.forEach(p => {
            const d = new Date(p.purchasedAt);
            if (d >= start && d <= end) {
              if (p.paid !== false) individuali += (p.cost || 0);  // solo pagati
              else nonPagato += (p.cost || 0);                      // non pagati
            }
          });
        }
      }
    });
    return { individuali, corsi, totale: individuali + corsi, nonPagato };
  }, [clients, appointments]);

  // Clienti con pacchetto esaurito non pagato
  const unpaidAlerts = useMemo(() =>
    clients.filter(c => {
      if (c.type === 'corso') return false;
      const q = getPackageQueue(c, appointments);
      return q && (q.unpaidExhausted || q.unpaidAlmostDone);
    }),
    [clients, appointments]
  );

  const schedeInScadenza = useMemo(() => {
    const now = new Date();
    return schede.filter(s => {
      if (!s.dataFine) return false;
      const fine = parseISO(s.dataFine);
      return isBefore(fine, addDays(now, 7));
    });
  }, [schede]);

  // Controlla conflitti orario
  const checkConflict = (date, time, durata, excludeId = null) => {
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + Number(durata) * 60000);
    return appointments.filter(a => {
      if (a.id === excludeId) return false;
      const aDate = a.date.split('T')[0];
      if (aDate !== date) return false;
      const aStart = new Date(a.date);
      const aEnd = new Date(aStart.getTime() + (a.durata || 60) * 60000);
      return start < aEnd && end > aStart;
    });
  };

  const handleQuickBook = async () => {
    if (!qb.clientId) return showToast('Seleziona un cliente', 'error');
    if (!qb.date || !qb.time) return showToast('Data e ora obbligatori', 'error');

    const conflicts = checkConflict(qb.date, qb.time, qb.durata);
    if (conflicts.length > 0) {
      const names = conflicts.map(a => {
        const c = clients.find(x => x.id === a.clientId);
        return c ? `${c.nome} ${c.cognome}` : '?';
      }).join(', ');
      return showToast(`⚠ Conflitto: ${names} già prenotato in questo orario`, 'error');
    }

    const dateTime = new Date(`${qb.date}T${qb.time}:00`);
    await addAppointment({
      clientId: qb.clientId,
      date: dateTime.toISOString(),
      durata: Number(qb.durata),
      oraFine: calcFine(qb.time, qb.durata),
      note: qb.note,
      schedaId: null,
      giornoScheda: null,
    });

    const client = clients.find(c => c.id === qb.clientId);
    showToast(`Appuntamento aggiunto per ${client?.nome}!`);
    setShowQuickBook(false);
    setQb({ clientId: '', date: new Date().toISOString().split('T')[0], time: '09:00', durata: '60', note: '' });
  };

  const corsi = clients.filter(c => c.type === 'corso');
  const individuali = clients.filter(c => c.type === 'individuale');
  const conflicts = qb.clientId && qb.date && qb.time ? checkConflict(qb.date, qb.time, qb.durata) : [];

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Dashboard</h2>
          <p>{format(today, "EEEE d MMMM yyyy", { locale: it })}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowQuickBook(true)}>
          + Prenota appuntamento
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon accent">👥</div>
          <div className="stat-label">Clienti totali</div>
          <div className="stat-value">{clients.length}</div>
          <div className="stat-sub">{individuali.length} ind. · {corsi.length} corsi</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowDetailModal('totale')}>
          <div className="stat-icon green">€</div>
          <div className="stat-label">Totale {format(today, 'MMMM', { locale: it })}</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>€{revenue.totale.toLocaleString('it-IT')}</div>
          <div className="stat-sub">incassato · clicca per dettaglio</div>
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

      {/* Entrate */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Entrate {format(today, 'MMMM yyyy', { locale: it })}
          </div>
          <div className="revenue-split">
            <div className="revenue-box blue-box" onClick={() => setShowDetailModal('individuali')}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              <div className="revenue-box-label">Clienti individuali</div>
              <div className="revenue-box-value" style={{ color: 'var(--accent)' }}>€{revenue.individuali.toLocaleString('it-IT')}</div>
              <div className="revenue-box-sub">{individuali.length} clienti · clicca per dettaglio</div>
            </div>
            <div className="revenue-box green-box" onClick={() => setShowDetailModal('corsi')}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              <div className="revenue-box-label">Corsi di gruppo</div>
              <div className="revenue-box-value" style={{ color: 'var(--green)' }}>€{revenue.corsi.toLocaleString('it-IT')}</div>
              <div className="revenue-box-sub">{corsi.length} corsi attivi · clicca per dettaglio</div>
            </div>
            {revenue.nonPagato > 0 && (
              <div className="revenue-box" style={{ background: 'var(--red-light)', border: '1px solid var(--red-border)', gridColumn: '1 / -1' }}>
                <div className="revenue-box-label" style={{ color: 'var(--red)' }}>⚠ Da incassare (non pagati)</div>
                <div className="revenue-box-value" style={{ color: 'var(--red)', fontSize: 18 }}>€{revenue.nonPagato.toLocaleString('it-IT')}</div>
                <div className="revenue-box-sub" style={{ cursor: 'pointer' }} onClick={() => setShowDetailModal('nonPagato')}>clicca per dettaglio →</div>
              </div>
            )}
          </div>
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

        {corsi.length > 0 ? (
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Corsi attivi</div>
            {corsi.map(corso => (
              <div key={corso.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{corso.nome} {corso.cognome}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{corso.partecipanti || 0} partecipanti</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--green)' }}>€{corso.monthlyFee}/mese</div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>Totale corsi</span>
              <span style={{ fontWeight: 700, color: 'var(--green)' }}>€{revenue.corsi.toLocaleString('it-IT')}/mese</span>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--text-3)', minHeight: 120 }}>
            <div style={{ fontSize: 28 }}>📚</div>
            <div style={{ fontSize: 13 }}>Nessun corso attivo</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/clienti')}>+ Aggiungi corso</button>
          </div>
        )}
      </div>

      {/* Avvisi pacchetti non pagati */}
      {unpaidAlerts.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <strong>💳 {unpaidAlerts.length} cliente/i con pacchetto non pagato</strong>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {unpaidAlerts.map(c => {
                const q = getPackageQueue(c, appointments);
                return (
                  <span key={c.id} style={{ marginRight: 12 }}>
                    {c.nome} {c.cognome}
                    {q.unpaidExhausted ? ' · ⚠ esaurito e non pagato' : ` · ${q.activePackage?.remaining} rimaste`}
                  </span>
                );
              })}
            </div>
          </div>
          <button className="btn btn-sm btn-danger" onClick={() => navigate('/clienti')}>Gestisci →</button>
        </div>
      )}

      {/* Schede in scadenza */}
      {schedeInScadenza.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <strong>⚠ {schedeInScadenza.length} scheda{schedeInScadenza.length > 1 ? 'e' : ''} in scadenza</strong>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {schedeInScadenza.map(s => {
                const cl = clients.find(c => c.id === s.clienteId);
                return <span key={s.id} style={{ marginRight: 12 }}>{cl ? `${cl.nome} ${cl.cognome}` : '—'} · {s.nome} (scade {format(parseISO(s.dataFine), 'd MMM', { locale: it })})</span>;
              })}
            </div>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/schede')}>Gestisci →</button>
        </div>
      )}

      {/* Appuntamenti + Scadenze */}
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Prossimi appuntamenti</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendario')}>Vedi tutti →</button>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>
              Nessun appuntamento
              <div style={{ marginTop: 10 }}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowQuickBook(true)}>+ Prenota ora</button>
              </div>
            </div>
          ) : (
            upcoming.map(apt => {
              const client = clients.find(c => c.id === apt.clientId);
              const q = client ? getPackageQueue(client, appointments) : null;
              return (
                <div key={apt.id} className="appointment-item">
                  <div className="apt-time">{format(new Date(apt.date), 'HH:mm')}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="apt-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {client ? `${client.nome} ${client.cognome}` : '—'}
                    </div>
                    <div className="apt-detail">{format(new Date(apt.date), 'EEE d MMM', { locale: it })}{apt.note ? ` · ${apt.note}` : ''}</div>
                  </div>
                  {q && q.isExpiring && (
                    <span className={`badge ${q.allExhausted ? 'badge-red' : 'badge-yellow'}`} style={{ flexShrink: 0 }}>
                      {q.allExhausted ? 'Esaurito' : `${q.totalRemaining} rim.`}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Pacchetti in scadenza</h3>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.nome} {client.cognome}</span>
                    <span className={`badge ${q.allExhausted ? 'badge-red' : 'badge-yellow'}`} style={{ flexShrink: 0 }}>{q.allExhausted ? 'Esaurito' : `${q.totalRemaining} rim.`}</span>
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

      {/* DETAIL REVENUE MODAL */}
      {showDetailModal && (() => {
        const mese = format(today, 'MMMM yyyy', { locale: it });
        const start = startOfMonth(today);
        const end = endOfMonth(today);

        // Build detail rows
        let title = '', rows = [], total = 0;

        if (showDetailModal === 'individuali') {
          title = `Clienti individuali — ${mese}`;
          individuali.forEach(c => {
            const pkgs = c.packages || [];
            pkgs.forEach(p => {
              const d = new Date(p.purchasedAt);
              if (d >= start && d <= end && p.paid !== false) {
                rows.push({ nome: `${c.nome} ${c.cognome}`, dettaglio: `${p.lessons} lezioni`, costo: p.cost || 0, paid: true });
                total += p.cost || 0;
              }
            });
            // Legacy format
            if (pkgs.length === 0 && c.packagePurchasedAt) {
              const d = new Date(c.packagePurchasedAt);
              if (d >= start && d <= end) {
                rows.push({ nome: `${c.nome} ${c.cognome}`, dettaglio: `${c.packageLessons} lezioni`, costo: c.packageCost || 0, paid: true });
                total += c.packageCost || 0;
              }
            }
          });
        } else if (showDetailModal === 'corsi') {
          title = `Corsi di gruppo — ${mese}`;
          corsi.forEach(c => {
            rows.push({ nome: `${c.nome} ${c.cognome}`, dettaglio: `${c.partecipanti || 0} partecipanti`, costo: c.monthlyFee || 0, paid: true });
            total += c.monthlyFee || 0;
          });
        } else if (showDetailModal === 'nonPagato') {
          title = `Da incassare — ${mese}`;
          individuali.forEach(c => {
            const pkgs = c.packages || [];
            pkgs.forEach(p => {
              const d = new Date(p.purchasedAt);
              if (d >= start && d <= end && p.paid === false) {
                rows.push({ nome: `${c.nome} ${c.cognome}`, dettaglio: `${p.lessons} lezioni`, costo: p.cost || 0, paid: false });
                total += p.cost || 0;
              }
            });
          });
        } else if (showDetailModal === 'totale') {
          title = `Riepilogo totale — ${mese}`;
          // Individuali pagati
          individuali.forEach(c => {
            (c.packages || []).forEach(p => {
              const d = new Date(p.purchasedAt);
              if (d >= start && d <= end && p.paid !== false) {
                rows.push({ nome: `${c.nome} ${c.cognome}`, dettaglio: 'Individuale', costo: p.cost || 0, paid: true });
                total += p.cost || 0;
              }
            });
          });
          // Corsi
          corsi.forEach(c => {
            rows.push({ nome: `${c.nome} ${c.cognome}`, dettaglio: 'Corso mensile', costo: c.monthlyFee || 0, paid: true });
            total += c.monthlyFee || 0;
          });
        }

        return (
          <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div className="modal-header">
                <h3>📊 {title}</h3>
                <button className="modal-close" onClick={() => setShowDetailModal(null)}>✕</button>
              </div>

              {rows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-3)', fontSize: 13 }}>
                  Nessun dato per questo periodo
                </div>
              ) : (
                <>
                  {rows.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: i%2===0 ? 'var(--bg)' : 'var(--surface)', borderRadius: 8, marginBottom: 4 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.nome}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.dettaglio}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: r.paid ? 'var(--green)' : 'var(--red)' }}>
                          €{(r.costo).toLocaleString('it-IT')}
                        </div>
                        <div style={{ fontSize: 10, color: r.paid ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                          {r.paid ? '✓ Pagato' : '✗ Non pagato'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: '2px solid var(--border)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Totale</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: showDetailModal === 'nonPagato' ? 'var(--red)' : 'var(--green)' }}>
                      €{total.toLocaleString('it-IT')}
                    </span>
                  </div>
                </>
              )}

              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowDetailModal(null)}>Chiudi</button>
                <button className="btn btn-secondary" onClick={() => { setShowDetailModal(null); navigate('/clienti'); }}>Vai ai clienti →</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* QUICK BOOK MODAL */}
      {showQuickBook && (
        <div className="modal-overlay" onClick={() => setShowQuickBook(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>📅 Prenota appuntamento</h3>
              <button className="modal-close" onClick={() => setShowQuickBook(false)}>✕</button>
            </div>

            {/* Cliente */}
            <div className="input-group">
              <label>Cliente *</label>
              <select value={qb.clientId} onChange={e => setQb({ ...qb, clientId: e.target.value })}>
                <option value="">— Seleziona cliente —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
              </select>
            </div>

            {/* Data + Ora + Durata */}
            <div className="form-row-3">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Data *</label>
                <input type="date" value={qb.date} onChange={e => setQb({ ...qb, date: e.target.value })} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Ora *</label>
                <select value={qb.time} onChange={e => setQb({ ...qb, time: e.target.value })}>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Durata</label>
                <select value={qb.durata} onChange={e => setQb({ ...qb, durata: e.target.value })}>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 ora</option>
                  <option value="90">1h 30</option>
                  <option value="120">2 ore</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }} />

            {/* Preview orario */}
            {qb.time && (
              <div style={{ background: 'var(--accent-light)', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 14, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>⏱ {qb.time} → {calcFine(qb.time, qb.durata)}</span>
                {qb.date && <span>📅 {new Date(qb.date + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>}
              </div>
            )}

            {/* Conflitti */}
            {conflicts.length > 0 && (
              <div className="alert alert-danger" style={{ marginBottom: 14 }}>
                ⚠ Conflitto: {conflicts.map(a => {
                  const c = clients.find(x => x.id === a.clientId);
                  return c ? `${c.nome} ${c.cognome} (${format(new Date(a.date), 'HH:mm')}–${a.oraFine || '?'})` : '?';
                }).join(', ')} già in agenda
              </div>
            )}

            {/* Note */}
            <div className="input-group">
              <label>Note</label>
              <input value={qb.note} onChange={e => setQb({ ...qb, note: e.target.value })} placeholder="es. Gambe, cardio..." />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowQuickBook(false)}>Annulla</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowQuickBook(false); navigate('/calendario'); }}>Apri calendario →</button>
              <button className="btn btn-primary" onClick={handleQuickBook} disabled={conflicts.length > 0}>✓ Prenota</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
