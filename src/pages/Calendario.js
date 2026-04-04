// src/pages/Calendario.js
import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useClients } from '../hooks/useClients';
import { getPackageQueue } from '../utils/packageUtils';
import { useAppointments } from '../hooks/useAppointments';
import { getPackageQueue } from '../utils/packageUtils';
import { format, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`toast ${type}`}>{msg}</div>;
}

export default function Calendario() {
  const { clients } = useClients();
  const { appointments, addAppointment, deleteAppointment } = useAppointments();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm] = useState({
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    note: '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Get appointments for selected date
  const dayAppointments = useMemo(() =>
    appointments.filter(a => isSameDay(new Date(a.date), selectedDate))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [appointments, selectedDate]
  );

  // Dates that have appointments (for calendar dots)
  const datesWithAppointments = useMemo(() =>
    new Set(appointments.map(a => format(new Date(a.date), 'yyyy-MM-dd'))),
    [appointments]
  );

  const getLessonsRemaining = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || client.type === 'corso') return null;
    const queue = getPackageQueue(client, appointments);
    return queue ? queue.totalRemaining : null;
  };

  const openModal = () => {
    setForm({
      clientId: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: '09:00',
      note: '',
    });
    setShowModal(true);
  };

  const handleBook = async () => {
    if (!form.clientId) return showToast('Seleziona un cliente', 'error');

    const client = clients.find(c => c.id === form.clientId);
    const remaining = getLessonsRemaining(form.clientId);

    // Check remaining lessons for individual clients
    if (client?.type === 'individuale' && remaining !== null && remaining <= 0) {
      return showToast(`⚠️ ${client.nome} ha esaurito tutte le lezioni! Aggiungi un nuovo pacchetto.`, 'error');
    }

    const dateTime = new Date(`${form.date}T${form.time}:00`);

    await addAppointment({
      clientId: form.clientId,
      date: dateTime.toISOString(),
      note: form.note,
      deducted: client?.type === 'individuale',
    });

    // Show warning if this was the last lesson
    if (client?.type === 'individuale' && remaining !== null) {
      if (remaining === 1) {
        showToast(`✅ Lezione prenotata! ⚠️ Era l'ULTIMA lezione di ${client.nome} - Rinnovare il pacchetto!`, 'warning');
      } else if (remaining === 2) {
        showToast(`✅ Lezione prenotata! ⚠️ ${client.nome} ha ancora solo ${remaining - 1} lezione rimasta`, 'warning');
      } else {
        showToast(`✅ Lezione prenotata! Rimaste: ${remaining - 1}`);
      }
    } else {
      showToast('✅ Appuntamento aggiunto!');
    }

    setShowModal(false);
  };

  const handleDelete = async (id) => {
    await deleteAppointment(id);
    showToast('Appuntamento eliminato', 'warning');
    setConfirmDel(null);
  };

  const tileContent = ({ date }) => {
    const key = format(date, 'yyyy-MM-dd');
    if (datesWithAppointments.has(key)) {
      return <div className="has-appointment" />;
    }
    return null;
  };

  const selectedClientData = clients.find(c => c.id === form.clientId);
  const selectedRemaining = form.clientId ? getLessonsRemaining(form.clientId) : null;

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="page-header">
        <h2>CALENDARIO</h2>
        <p>Gestisci gli appuntamenti e le lezioni</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Calendar */}
        <div>
          <div className="calendar-wrapper">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
              locale="it-IT"
            />
          </div>

          {/* Day appointments list */}
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 20 }}>
                  {format(selectedDate, "EEE d MMM", { locale: it })}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {dayAppointments.length} appuntament{dayAppointments.length !== 1 ? 'i' : 'o'}
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={openModal}>
                + Prenota
              </button>
            </div>

            {dayAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: 14 }}>
                Nessun appuntamento per questo giorno
              </div>
            ) : (
              dayAppointments.map(apt => {
                const client = clients.find(c => c.id === apt.clientId);
                const remaining = getLessonsRemaining(apt.clientId);
                return (
                  <div key={apt.id} style={{ position: 'relative' }}>
                    <div className="appointment-item">
                      <div className="apt-time">
                        {format(new Date(apt.date), 'HH:mm')}
                      </div>
                      <div className="apt-info">
                        <div className="apt-client">
                          {client ? `${client.nome} ${client.cognome}` : 'Cliente rimosso'}
                        </div>
                        <div className="apt-detail">
                          {client?.type === 'individuale' && remaining !== null && (
                            <span style={{ color: remaining <= 1 ? 'var(--red)' : remaining <= 3 ? 'var(--yellow)' : 'var(--text-muted)' }}>
                              {remaining >= 0 ? `${remaining} lezioni rimaste` : 'Pacchetto scaduto'}
                            </span>
                          )}
                          {apt.note && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>· {apt.note}</span>}
                        </div>
                      </div>
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 6, borderRadius: 6, fontSize: 16 }}
                        onClick={() => setConfirmDel(apt.id)}
                      >
                        🗑
                      </button>
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

        {/* This month stats */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 20, marginBottom: 16 }}>QUESTO MESE</h3>
            {(() => {
              const now = new Date();
              const monthApts = appointments.filter(a => {
                const d = new Date(a.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              });
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>LEZIONI</div>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 30, color: 'var(--accent)' }}>{monthApts.length}</div>
                  </div>
                  <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CLIENTI ATTIVI</div>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 30, color: 'var(--blue)' }}>
                      {new Set(monthApts.map(a => a.clientId)).size}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Upcoming week */}
          <div className="card">
            <h3 style={{ fontSize: 20, marginBottom: 16 }}>PROSSIMI 7 GIORNI</h3>
            {(() => {
              const from = new Date();
              const to = new Date(Date.now() + 7 * 86400000);
              const upcoming = appointments
                .filter(a => {
                  const d = new Date(a.date);
                  return d >= from && d <= to;
                })
                .sort((a,b) => new Date(a.date) - new Date(b.date));

              if (upcoming.length === 0) {
                return <div style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>Nessun appuntamento</div>;
              }

              return upcoming.map(apt => {
                const client = clients.find(c => c.id === apt.clientId);
                return (
                  <div key={apt.id} className="appointment-item">
                    <div style={{ minWidth: 48 }}>
                      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, color: 'var(--accent)', lineHeight: 1, letterSpacing: '-0.3px' }}>
                        {format(new Date(apt.date), 'HH:mm')}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {format(new Date(apt.date), 'EEE d', { locale: it })}
                      </div>
                    </div>
                    <div className="apt-info">
                      <div className="apt-client" style={{ fontSize: 13 }}>
                        {client ? `${client.nome} ${client.cognome}` : '—'}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>PRENOTA LEZIONE</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="input-group">
              <label>Cliente *</label>
              <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}>
                <option value="">-- Seleziona cliente --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.cognome} {c.type === 'corso' ? '(Corso)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Warning if few lessons remaining */}
            {selectedClientData?.type === 'individuale' && selectedRemaining !== null && (
              <div className={`alert ${selectedRemaining <= 0 ? 'alert-danger' : selectedRemaining <= 2 ? 'alert-warning' : 'alert-success'}`} style={{ marginBottom: 16 }}>
                {selectedRemaining <= 0
                  ? '⛔ Pacchetto esaurito! Aggiungere un nuovo pacchetto prima di prenotare.'
                  : selectedRemaining === 1
                  ? `⚠️ Ultima lezione rimasta! Ricordati di rinnovare il pacchetto.`
                  : selectedRemaining <= 2
                  ? `⚠️ Solo ${selectedRemaining} lezioni rimaste nel pacchetto`
                  : `✅ ${selectedRemaining} lezioni rimaste nel pacchetto`
                }
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="input-group" style={{ flex: 2 }}>
                <label>Data *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Ora *</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm({...form, time: e.target.value})}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Note</label>
              <input
                value={form.note}
                onChange={e => setForm({...form, note: e.target.value})}
                placeholder="es. Allenamento gambe, recupero..."
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Annulla</button>
              <button
                className="btn btn-primary"
                onClick={handleBook}
                disabled={selectedRemaining !== null && selectedRemaining <= 0}
              >
                ✓ Prenota Lezione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
