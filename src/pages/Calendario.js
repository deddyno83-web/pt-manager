// src/pages/Calendario.js
import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useClients } from '../hooks/useClients';
import { useAppointments } from '../hooks/useAppointments';
import { getPackageQueue } from '../utils/packageUtils';
import { ESERCIZI_DEFAULT } from '../data/esercizi';
import { useSchede } from '../hooks/useSchede';
import { format, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`toast ${type}`}>{msg}</div>;
}

function ImgWithFallback({ src, size = 44 }) {
  const [err, setErr] = React.useState(false);
  if (!src || err) return <span style={{ fontSize: size * 0.5 }}>💪</span>;
  return <img src={src} alt="" onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

export default function Calendario() {
  const { clients } = useClients();
  const { appointments, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { schede, updateScheda } = useSchede();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [showSchedaModal, setShowSchedaModal] = useState(null);
  const [editApt, setEditApt] = useState(null);
  const [form, setForm] = useState({ clientId: '', date: new Date().toISOString().split('T')[0], time: '09:00', durata: '60', note: '', schedaId: '', giornoScheda: '' });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const toggleEsercizioDone = async (scheda, giorno, idx) => {
    const giorni = { ...scheda.giorni };
    const lista = [...(giorni[giorno] || [])];
    lista[idx] = { ...lista[idx], fatto: !lista[idx].fatto };
    giorni[giorno] = lista;
    await updateScheda(scheda.id, { giorni });
    setShowSchedaModal(prev => prev ? { ...prev, scheda: { ...prev.scheda, giorni } } : null);
  };

  const markTuttoFatto = async (scheda, giorno, fatto) => {
    const giorni = { ...scheda.giorni };
    giorni[giorno] = (giorni[giorno] || []).map(e => ({ ...e, fatto }));
    await updateScheda(scheda.id, { giorni });
    setShowSchedaModal(prev => prev ? { ...prev, scheda: { ...prev.scheda, giorni } } : null);
  };

  const calcFine = (time, durata) => {
    if (!time || !durata) return '';
    const [h, m] = time.split(':').map(Number);
    const totMin = h * 60 + m + Number(durata);
    const fh = Math.floor(totMin / 60) % 24;
    const fm = totMin % 60;
    return `${String(fh).padStart(2, '0')}:${String(fm).padStart(2, '0')}`;
  };

  // Slot orari ogni 15 minuti
  const timeSlots = [];
  for (let h = 6; h <= 22; h++) {
    timeSlots.push(`${String(h).padStart(2,'0')}:00`);
    timeSlots.push(`${String(h).padStart(2,'0')}:15`);
    timeSlots.push(`${String(h).padStart(2,'0')}:30`);
    timeSlots.push(`${String(h).padStart(2,'0')}:45`);
  }

  const dayAppointments = useMemo(() =>
    appointments.filter(a => isSameDay(new Date(a.date), selectedDate))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [appointments, selectedDate]
  );

  const datesWithAppointments = useMemo(() => {
    const set = new Set();
    appointments.forEach(a => {
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      set.add(key);
    });
    return set;
  }, [appointments]);

  const getClientQueue = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || client.type === 'corso') return null;
    return getPackageQueue(client, appointments);
  };

  const openModal = () => {
    setForm({ clientId: '', date: format(selectedDate, 'yyyy-MM-dd'), time: '09:00', durata: '60', note: '', schedaId: '', giornoScheda: '' });
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

  const openEditApt = (apt) => {
    const d = new Date(apt.date);
    setEditApt({
      id: apt.id,
      clientId: apt.clientId,
      date: d.toISOString().split('T')[0],
      time: d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      durata: String(apt.durata || 60),
      note: apt.note || '',
      schedaId: apt.schedaId || '',
      giornoScheda: apt.giornoScheda || '',
    });
  };

  const handleUpdateApt = async () => {
    if (!editApt) return;
    const dateTime = new Date(`${editApt.date}T${editApt.time}:00`);
    const fineTime = calcFine(editApt.time, editApt.durata);
    await updateAppointment(editApt.id, {
      clientId: editApt.clientId,
      date: dateTime.toISOString(),
      durata: Number(editApt.durata),
      oraFine: fineTime,
      note: editApt.note,
      schedaId: editApt.schedaId || null,
      giornoScheda: editApt.giornoScheda || null,
    });
    showToast('Appuntamento aggiornato!');
    setEditApt(null);
  };

  const tileContent = ({ date }) => {
    // Usa data locale per coerenza con datesWithAppointments
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    if (datesWithAppointments.has(key)) {
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

  // Opzioni durata senza 30 minuti
  const DURATA_OPTIONS = [
    { value: '45', label: '45 min' },
    { value: '60', label: '1 ora' },
    { value: '90', label: '1 ora e 30' },
    { value: '120', label: '2 ore' },
  ];

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Calendario</h2>
          <p>{monthApts.length} lezioni questo mese</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>+ Nuova lezione</button>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Calendario */}
        <div className="card">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            locale="it-IT"
            tileContent={tileContent}
          />
        </div>

        {/* Lista appuntamenti del giorno */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>
              {format(selectedDate, "EEEE d MMMM", { locale: it })}
            </h3>
            <button className="btn btn-primary btn-sm" onClick={openModal}>+ Aggiungi</button>
          </div>

          {dayAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 13 }}>Nessuna lezione questo giorno</div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={openModal}>+ Aggiungi lezione</button>
            </div>
          ) : (
            dayAppointments.map(apt => {
              const client = clients.find(c => c.id === apt.clientId);
              const q = getClientQueue(apt.clientId);
              const scheda = apt.schedaId ? schede.find(s => s.id === apt.schedaId) : null;
              return (
                <div key={apt.id} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
                          {format(new Date(apt.date), 'HH:mm')}
                          {apt.oraFine && ` → ${apt.oraFine}`}
                        </span>
                        {apt.durata && <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--surface2)', borderRadius: 4, padding: '1px 6px' }}>{apt.durata} min</span>}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                        {client ? `${client.nome} ${client.cognome}` : '—'}
                        {client?.type === 'corso' && <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--green)', fontWeight: 600 }}>Corso</span>}
                      </div>
                      {apt.note && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>📝 {apt.note}</div>}
                      {scheda && apt.giornoScheda && (
                        <button
                          onClick={() => setShowSchedaModal({ scheda, giorno: apt.giornoScheda })}
                          style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--accent-light)', border: '1px solid #bfdbfe', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}>
                          🏋 {scheda.nome} — {apt.giornoScheda}
                        </button>
                      )}
                      {q && q.isExpiring && (
                        <div style={{ marginTop: 6 }}>
                          <span className={`badge ${q.allExhausted ? 'badge-red' : 'badge-yellow'}`}>
                            {q.allExhausted ? 'Pacchetto esaurito' : `${q.totalRemaining} lezioni rimaste`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditApt(apt)} title="Modifica">✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(apt.id)} title="Elimina">✕</button>
                    </div>
                  </div>
                  {confirmDel === apt.id && (
                    <div className="alert alert-danger" style={{ marginTop: 10 }}>
                      Eliminare questo appuntamento?
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(apt.id)}>Sì, elimina</button>
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

      {/* SCHEDA MODAL */}
      {showSchedaModal && (() => {
        const { scheda, giorno } = showSchedaModal;
        const esercizi = scheda.giorni?.[giorno] || [];
        const fatti = esercizi.filter(e => e.fatto).length;
        return (
          <div className="modal-overlay" onClick={() => setShowSchedaModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="modal-header">
                <h3>🏋 {scheda.nome} — {giorno}</h3>
                <button className="modal-close" onClick={() => setShowSchedaModal(null)}>✕</button>
              </div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{fatti}/{esercizi.length} completati</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => markTuttoFatto(scheda, giorno, true)}>✓ Tutti fatto</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => markTuttoFatto(scheda, giorno, false)}>↩ Reset</button>
                </div>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {esercizi.map((es, idx) => {
                  const info = ESERCIZI_DEFAULT?.find(e => e.nome === es.nome);
                  return (
                    <div key={idx} onClick={() => toggleEsercizioDone(scheda, giorno, idx)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8,
                        background: es.fatto ? 'var(--green-light)' : 'var(--bg)',
                        border: `1px solid ${es.fatto ? 'var(--green-border)' : 'var(--border)'}`,
                        cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--surface2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ImgWithFallback src={info?.img} size={44} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: es.fatto ? 'var(--green)' : 'var(--text)', textDecoration: es.fatto ? 'line-through' : 'none' }}>{es.nome}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                          {[es.serie && `${es.serie} serie`, es.ripetizioni && `${es.ripetizioni} rip`, es.carico && `${es.carico} kg`, es.recupero && `rec ${es.recupero}`].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div style={{ fontSize: 18 }}>{es.fatto ? '✅' : '⬜'}</div>
                    </div>
                  );
                })}
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowSchedaModal(null)}>Chiudi</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* EDIT MODAL */}
      {editApt && (() => {
        const client = clients.find(c => c.id === editApt.clientId);
        const schedaCliente = schede.filter(s => s.clienteId === editApt.clientId);
        const schedaSel = schede.find(s => s.id === editApt.schedaId);
        const giorniDisp = schedaSel ? Object.keys(schedaSel.giorni || {}) : [];
        const GIORNI_MAP = { 0: 'Domenica', 1: 'Lunedì', 2: 'Martedì', 3: 'Mercoledì', 4: 'Giovedì', 5: 'Venerdì', 6: 'Sabato' };
        const giornoSettimana = editApt.date ? GIORNI_MAP[new Date(editApt.date).getDay()] : '';
        return (
          <div className="modal-overlay" onClick={() => setEditApt(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <div className="modal-header">
                <h3>Modifica appuntamento</h3>
                <button className="modal-close" onClick={() => setEditApt(null)}>✕</button>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 14 }}>
                {client ? `${client.nome} ${client.cognome}` : '—'}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label>Data</label>
                  <input type="date" value={editApt.date} onChange={e => setEditApt({ ...editApt, date: e.target.value })} />
                </div>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Ora</label>
                  <select value={editApt.time} onChange={e => setEditApt({ ...editApt, time: e.target.value })}>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Durata</label>
                  <select value={editApt.durata} onChange={e => setEditApt({ ...editApt, durata: e.target.value })}>
                    {DURATA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }} />
              <div className="input-group">
                <label>Note</label>
                <input value={editApt.note} onChange={e => setEditApt({ ...editApt, note: e.target.value })} placeholder="es. Gambe, upper body..." />
              </div>

              {schedaCliente.length > 0 && (
                <div style={{ background: 'var(--accent-light)', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Scheda allenamento</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Scheda</label>
                      <select value={editApt.schedaId} onChange={e => {
                        const s = schede.find(sc => sc.id === e.target.value);
                        const defaultGiorno = s && s.giorni && s.giorni[giornoSettimana] ? giornoSettimana : '';
                        setEditApt({ ...editApt, schedaId: e.target.value, giornoScheda: defaultGiorno });
                      }}>
                        <option value="">Nessuna scheda</option>
                        {schedaCliente.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                    </div>
                    {editApt.schedaId && giorniDisp.length > 0 && (
                      <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Giorno {giornoSettimana && giorniDisp.includes(giornoSettimana) ? `(auto: ${giornoSettimana})` : ''}</label>
                        <select value={editApt.giornoScheda} onChange={e => setEditApt({ ...editApt, giornoScheda: e.target.value })}>
                          <option value="">— Seleziona —</option>
                          {giorniDisp.map(g => (
                            <option key={g} value={g}>{g} · {(schedaSel.giorni[g]||[]).length} esercizi{g === giornoSettimana ? ' ★' : ''}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  {editApt.schedaId && editApt.giornoScheda && schedaSel?.giorni?.[editApt.giornoScheda] && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(schedaSel.giorni[editApt.giornoScheda] || []).map((e, i) => (
                        <span key={i} style={{ fontSize: 11, background: 'var(--surface)', border: '1px solid #bfdbfe', borderRadius: 5, padding: '3px 8px', color: 'var(--accent)' }}>
                          {e.nome || 'Esercizio'} {e.serie ? `${e.serie}×${e.ripetizioni}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  {editApt.schedaId && (
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, fontSize: 11 }}
                      onClick={() => setEditApt({ ...editApt, schedaId: '', giornoScheda: '' })}>
                      ✕ Rimuovi scheda associata
                    </button>
                  )}
                </div>
              )}

              {schedaCliente.length === 0 && (
                <div className="alert alert-warning" style={{ marginBottom: 14, fontSize: 12 }}>
                  Nessuna scheda disponibile per questo cliente. Creane una nella sezione Schede.
                </div>
              )}

              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setEditApt(null)}>Annulla</button>
                <button className="btn btn-primary" onClick={handleUpdateApt}>✓ Salva modifiche</button>
              </div>
            </div>
          </div>
        );
      })()}

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
                  ? 'Ultima lezione disponibile! Ricordati di rinnovare il pacchetto.'
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
                  {DURATA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
