// src/pages/Calendario.js
import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useClients } from '../hooks/useClients';
import { useAppointments } from '../hooks/useAppointments';
import { getPackageQueue } from '../utils/packageUtils';
import { useSchede } from '../hooks/useSchede';
import { format, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`toast ${type}`}>{msg}</div>;
}

export default function Calendario() {
  const { clients } = useClients();
  const { appointments, addAppointment, deleteAppointment } = useAppointments();
  const { schede } = useSchede();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm] = useState({ clientId: '', date: new Date().toISOString().split('T')[0], time: '09:00', durata: '60', note: '', schedaId: '', giornoScheda: '' });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const calcFine = (time, durata) => {
    if (!time || !durata) return '';
    const [h, m] = time.split(':').map(Number);
    const totMin = h * 60 + m + Number(durata);
    const fh = Math.floor(totMin / 60) % 24;
    const fm = totMin % 60;
    return `${String(fh).padStart(2, '0')}:${String(fm).padStart(2, '0')}`;
  };

  // Genera slot orari ogni 30 minuti
  const timeSlots = [];
  for (let h = 6; h <= 22; h++) {
    timeSlots.push(`${String(h).padStart(2,'0')}:00`);
    timeSlots.push(`${String(h).padStart(2,'0')}:30`);
  }

  const dayAppointments = useMemo(() =>
    appointments.filter(a => isSameDay(new Date(a.date), selectedDate))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [appointments, selectedDate]
  );

  const datesWithAppointments = useMemo(() =>
    new Set(appointments.map(a => format(new Date(a.date), 'yyyy-MM-dd'))),
    [appointments]
  );

  const getClientQueue = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || client.type === 'corso') return null;
    return getPackageQueue(client, appointments);
  };

  const openModal = () => {
    setForm({ clientId: '', date: format(selectedDate, 'yyyy-MM-dd'), time: '09:00', note: '' });
    setShowModal(true);
  };

  const handleBook = async () => {
    if (!form.clientId) return showToast('Seleziona un cliente', 'error');
    const client = clients.find(c => c.id === form.clientId);
    const q = getClientQueue(form.clientId);

    if (q && q.allExhausted) {
      return showToast(`${client.nome} ha esaurito tutte le lezioni! Aggiungi un pacchetto.`, 'error');
    }

    const dateTime = new Date(`${form.date}T${form.time}:00`);
    const fineTime = calcFine(form.time, form.durata);
    await addAppointment({ clientId: form.clientId, date: dateTime.toISOString(), durata: Number(form.durata), oraFine: fineTime, note: form.note, schedaId: form.schedaId || null, giornoScheda: form.giornoScheda || null });

    if (q) {
      const newRemaining = q.totalRemaining - 1;
      if (newRemaining === 0) showToast(`Lezione prenotata! ⚠️ ${client.nome} ha esaurito il pacchetto — aggiungine uno nuovo!`, 'warning');
      else if (newRemaining <= 2) showToast(`Lezione prenotata! ⚠️ ${client.nome} ha ancora ${newRemaining} lezione${newRemaining !== 1 ? 'i' : ''} rimasta`, 'warning');
      else showToast(`Lezione prenotata! Rimaste: ${newRemaining}`);
    } else {
      showToast('Appuntamento aggiunto!');
    }
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    await deleteAppointment(id);
    showToast('Appuntamento eliminato', 'warning');
    setConfirmDel(null);
  };

  const tileContent = ({ date }) => {
    if (datesWithAppointments.has(format(date, 'yyyy-MM-dd'))) {
      return <div className="has-appointment" />;
    }
    return null;
  };

  const selectedClientData = clients.find(c => c.id === form.clientId);
  const selectedQueue = form.clientId ? getClientQueue(form.clientId) : null;

  const now = new Date();
  const monthApts = appointments.filter(a => {
    const d = new Date(a.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const upcomingWeek = appointments
    .filter(a => { const d = new Date(a.date); return d >= now && d <= new Date(Date.now() + 7 * 86400000); })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="page-header">
        <h2>Calendario</h2>
        <p>Gestisci gli appuntamenti e le lezioni</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="calendar-wrapper">
            <Calendar onChange={setSelectedDate} value={selectedDate} tileContent={tileContent} locale="it-IT" />
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  {format(selectedDate, "EEE d MMM", { locale: it })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{dayAppointments.length} appuntament{dayAppointments.length !== 1 ? 'i' : 'o'}</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={openModal}>+ Prenota</button>
            </div>
            {dayAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>Nessun appuntamento per questo giorno</div>
            ) : (
              dayAppointments.map(apt => {
                const client = clients.find(c => c.id === apt.clientId);
                const q = getClientQueue(apt.clientId);
                return (
                  <div key={apt.id}>
                    <div className="appointment-item">
                      <div className="apt-time">{format(new Date(apt.date), 'HH:mm')}</div>
                      <div style={{ flex: 1 }}>
                        <div className="apt-name">{client ? `${client.nome} ${client.cognome}` : 'Cliente rimosso'}</div>
                        <div className="apt-detail">
                          {apt.oraFine && <span style={{ color: 'var(--text-3)' }}>fino alle {apt.oraFine}</span>}
                          {q && <span style={{ color: q.allExhausted ? 'var(--red)' : q.isExpiring ? 'var(--amber)' : 'var(--text-3)', marginLeft: apt.oraFine ? 6 : 0 }}>
                            {apt.oraFine ? '· ' : ''}{q.totalRemaining} lezioni rimaste
                          </span>}
                          {apt.note && <span style={{ color: 'var(--text-3)' }}> · {apt.note}</span>}
                        </div>
                      </div>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px', borderRadius: 6, fontSize: 14, transition: 'color 0.12s' }}
                        onClick={() => setConfirmDel(apt.id)} title="Elimina">✕</button>
                    </div>
                    {confirmDel === apt.id && (
                      <div className="alert alert-danger" style={{ marginBottom: 8, fontSize: 12 }}>
                        Eliminare questo appuntamento?
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(apt.id)}>Elimina</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(null)}>Annulla</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Questo mese</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Lezioni</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.5px' }}>{monthApts.length}</div>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Clienti visti</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.5px' }}>{new Set(monthApts.map(a => a.clientId)).size}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Prossimi 7 giorni</div>
            {upcomingWeek.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Nessun appuntamento</div>
            ) : (
              upcomingWeek.map(apt => {
                const client = clients.find(c => c.id === apt.clientId);
                const q = getClientQueue(apt.clientId);
                return (
                  <div key={apt.id} className="appointment-item">
                    <div style={{ minWidth: 48 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.3px' }}>{format(new Date(apt.date), 'HH:mm')}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{format(new Date(apt.date), 'EEE d', { locale: it })}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="apt-name" style={{ fontSize: 13 }}>{client ? `${client.nome} ${client.cognome}` : '—'}</div>
                    </div>
                    {q && q.isExpiring && (
                      <span className={`badge ${q.allExhausted ? 'badge-red' : 'badge-yellow'}`}>
                        {q.allExhausted ? 'Esaurito' : `${q.totalRemaining}`}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* BOOK MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Prenota lezione</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="input-group">
              <label>Cliente *</label>
              <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                <option value="">— Seleziona cliente —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} {c.cognome}{c.type === 'corso' ? ' (Corso)' : ''}</option>
                ))}
              </select>
            </div>

            {selectedClientData?.type === 'individuale' && selectedQueue && (
              <div className={`alert ${selectedQueue.allExhausted ? 'alert-danger' : selectedQueue.isExpiring ? 'alert-warning' : 'alert-success'}`} style={{ marginBottom: 14 }}>
                {selectedQueue.allExhausted
                  ? 'Pacchetto esaurito! Aggiungere un nuovo pacchetto prima di prenotare.'
                  : selectedQueue.totalRemaining === 1
                  ? `Ultima lezione disponibile! Ricordati di rinnovare il pacchetto.`
                  : selectedQueue.isExpiring
                  ? `Solo ${selectedQueue.totalRemaining} lezioni rimaste nel pacchetto.`
                  : `${selectedQueue.totalRemaining} lezioni disponibili.`}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="input-group" style={{ flex: 2 }}>
                <label>Data *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Ora inizio *</label>
                <select value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}>
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Durata</label>
                <select value={form.durata} onChange={e => setForm({ ...form, durata: e.target.value })}>
                  <option value="30">30 min</option>
                  <option value="60">1 ora</option>
                  <option value="90">1 ora e 30</option>
                  <option value="120">2 ore</option>
                </select>
              </div>
            </div>
            {form.time && (
              <div style={{ background: 'var(--accent-light)', border: '1px solid #bfdbfe', borderRadius: 7, padding: '8px 12px', fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 14, display: 'flex', gap: 16 }}>
                <span>⏱ Inizio: {form.time}</span>
                <span>→</span>
                <span>Fine: {calcFine(form.time, form.durata)}</span>
                <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({form.durata} min)</span>
              </div>
            )}

            <div className="input-group">
              <label>Note</label>
              <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="es. Gambe, upper body, cardio..." />
            </div>

            {/* Selezione scheda */}
            {form.clientId && (() => {
              const GIORNI_MAP = { 0: 'Domenica', 1: 'Lunedì', 2: 'Martedì', 3: 'Mercoledì', 4: 'Giovedì', 5: 'Venerdì', 6: 'Sabato' };
              const schedaCliente = schede.filter(s => s.clienteId === form.clientId);
              const dataSelezionata = new Date(form.date);
              const giornoSettimana = GIORNI_MAP[dataSelezionata.getDay()];
              return schedaCliente.length > 0 ? (
                <div style={{ background: 'var(--accent-light)', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Scheda allenamento</div>
                  <div className="input-group" style={{ marginBottom: 8 }}>
                    <label>Scheda da associare</label>
                    <select value={form.schedaId} onChange={e => {
                      const s = schede.find(sc => sc.id === e.target.value);
                      const defaultGiorno = s && s.giorni && s.giorni[giornoSettimana] ? giornoSettimana : '';
                      setForm({ ...form, schedaId: e.target.value, giornoScheda: defaultGiorno });
                    }}>
                      <option value="">Nessuna scheda</option>
                      {schedaCliente.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </select>
                  </div>
                  {form.schedaId && (() => {
                    const s = schede.find(sc => sc.id === form.schedaId);
                    const giorniDisp = s ? Object.keys(s.giorni || {}) : [];
                    return giorniDisp.length > 0 ? (
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Giorno allenamento {giornoSettimana && `(suggerito: ${giornoSettimana})`}</label>
                        <select value={form.giornoScheda} onChange={e => setForm({ ...form, giornoScheda: e.target.value })}>
                          <option value="">— Seleziona giorno —</option>
                          {giorniDisp.map(g => <option key={g} value={g}>{g} ({(s.giorni[g] || []).length} esercizi)</option>)}
                        </select>
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : null;
            })()}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleBook} disabled={selectedQueue?.allExhausted}>
                ✓ Prenota lezione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
