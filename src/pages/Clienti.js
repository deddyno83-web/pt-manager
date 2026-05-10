// src/pages/Clienti.js
import { generateClientePDF } from '../utils/generatePDF';
import React, { useState, useMemo, useEffect } from 'react';
import { useClients } from '../hooks/useClients';
import { useAppointments } from '../hooks/useAppointments';
import { getPackageQueue, applyAutoActivation } from '../utils/packageUtils';
import { useSchede } from '../hooks/useSchede';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const TODAY = new Date().toISOString().split('T')[0];
const EMPTY_FORM = { nome: '', cognome: '', telefono: '', email: '', type: 'individuale', packageLessons: '', packageCost: '', packagePurchasedAt: TODAY, partecipanti: '', monthlyFee: '', note: '' };
const EMPTY_PKG = { packageLessons: '', packageCost: '', packagePurchasedAt: TODAY };

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`toast ${type}`}>{msg}</div>;
}

function ProgressBar({ remaining, total }) {
  const pct = total > 0 ? Math.max(0, (remaining / total) * 100) : 0;
  const color = remaining === 0 ? 'red' : remaining <= 2 ? 'yellow' : 'green';
  return <div className="progress-bar"><div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} /></div>;
}

export default function Clienti() {
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const { appointments } = useAppointments();
  const { schede } = useSchede();
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [pkgClient, setPkgClient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pkgForm, setPkgForm] = useState(EMPTY_PKG);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('tutti');
  const [toast, setToast] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [payingMonth, setPayingMonth] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  // ── Auto-attivazione pacchetto successivo ──
  // Ogni volta che cambia clients o appointments, controlla se qualche client
  // ha un pacchetto esaurito con un successivo in coda da attivare.
  useEffect(() => {
    clients.forEach(client => {
      if (client.type !== 'individuale') return;
      const q = getPackageQueue(client, appointments);
      if (q.autoActivated && q.autoActivateNextId) {
        const updatedPkgs = applyAutoActivation(client.packages || [], q.autoActivateNextId, q.aptTotal);
        updateClient(client.id, { packages: updatedPkgs }).catch(() => {});
      }
    });
  }, [clients, appointments]);

  const filtered = useMemo(() =>
    clients.filter(c => {
      const match = `${c.nome} ${c.cognome} ${c.email}`.toLowerCase().includes(search.toLowerCase());
      return match && (filter === 'tutti' || c.type === filter);
    }), [clients, search, filter]);

  const openAdd = () => { setEditClient(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (c) => {
    setEditClient(c);
    setForm({ nome: c.nome || '', cognome: c.cognome || '', telefono: c.telefono || '', email: c.email || '', type: c.type || 'individuale', packageLessons: '', packageCost: '', packagePurchasedAt: TODAY, partecipanti: c.partecipanti || '', monthlyFee: c.monthlyFee || '', note: c.note || '' });
    setShowModal(true);
  };
  const openAddPackage = (c) => { setPkgClient(c); setPkgForm(EMPTY_PKG); setShowPkgModal(true); };

  const handleSave = async () => {
    if (!form.nome || !form.cognome) return showToast('Nome e cognome obbligatori', 'error');
    if (editClient) {
      await updateClient(editClient.id, { nome: form.nome, cognome: form.cognome, telefono: form.telefono, email: form.email, partecipanti: Number(form.partecipanti) || 0, monthlyFee: Number(form.monthlyFee) || 0, note: form.note });
      showToast('Cliente aggiornato!');
      setShowModal(false);
      setShowDetail(editClient.id);
      return;
    } else {
      // costo opzionale: se non inserito → 0 (non null)
      const firstPkg = form.packageLessons ? [{
        id: Date.now().toString(),
        lessons: Number(form.packageLessons),
        cost: form.packageCost !== '' ? Number(form.packageCost) : 0,
        purchasedAt: form.packagePurchasedAt,
        paid: false,
        active: true,
        usedAtActivation: 0,
      }] : [];
      await addClient({ nome: form.nome, cognome: form.cognome, telefono: form.telefono, email: form.email, type: form.type, packages: firstPkg, partecipanti: Number(form.partecipanti) || 0, monthlyFee: Number(form.monthlyFee) || 0, note: form.note });
      showToast('Cliente aggiunto!');
    }
    setShowModal(false);
  };

  const handleAddPackage = async () => {
    if (!pkgForm.packageLessons) return showToast('Inserisci il numero di lezioni', 'error');
    const existing = pkgClient.packages || [];
    const base = existing.length === 0 && pkgClient.packageLessons > 0
      ? [{ id: 'legacy', lessons: pkgClient.packageLessons || 0, cost: pkgClient.packageCost || 0, purchasedAt: pkgClient.packagePurchasedAt || '', paid: true, active: true }]
      : existing;

    // Se non c'è nessun pacchetto attivo con lezioni rimaste, attiva subito il nuovo
    const q = getPackageQueue(pkgClient, appointments);
    const shouldActivateImmediately = q.allExhausted || !q.canBook;

    const aptCount = shouldActivateImmediately
      ? appointments.filter(a => a.clientId === pkgClient.id && new Date(a.date) <= new Date()).length
      : 0;

    const newPkg = {
      id: Date.now().toString(),
      lessons: Number(pkgForm.packageLessons),
      cost: pkgForm.packageCost !== '' ? Number(pkgForm.packageCost) : 0,
      purchasedAt: pkgForm.packagePurchasedAt,
      paid: false,
      active: shouldActivateImmediately,
      ...(shouldActivateImmediately ? { usedAtActivation: aptCount } : {}),
    };

    // Se si attiva subito, disattiva gli altri
    const updatedBase = shouldActivateImmediately
      ? base.map(p => ({ ...p, active: false }))
      : base;

    await updateClient(pkgClient.id, { packages: [...updatedBase, newPkg] });
    showToast(shouldActivateImmediately
      ? `Pacchetto di ${newPkg.lessons} lezioni aggiunto e attivato!`
      : `Pacchetto di ${newPkg.lessons} lezioni aggiunto in coda!`
    );
    setShowPkgModal(false); setPkgClient(null);
  };

  // Attiva manualmente un pacchetto
  const handleActivatePackage = async (client, pkgId) => {
    const aptCount = appointments.filter(a => a.clientId === client.id && new Date(a.date) <= new Date()).length;
    const newPkgs = (client.packages || []).map(p => ({
      ...p,
      active: p.id === pkgId,
      ...(p.id === pkgId ? { usedAtActivation: aptCount } : {}),
    }));
    await updateClient(client.id, { packages: newPkgs });
    showToast('Pacchetto attivato!');
  };

  const handleDeletePackage = async (client, pkgId) => {
    const updated = (client.packages || []).filter(p => p.id !== pkgId);
    await updateClient(client.id, { packages: updated });
    showToast('Pacchetto rimosso', 'warning');
  };

  const handleDelete = async (id) => {
    await deleteClient(id);
    showToast('Cliente eliminato', 'warning');
    setConfirmDelete(null); setShowDetail(null);
  };

  const handleGeneratePDF = async (client) => {
    try {
      const q = getPackageQueue(client, appointments);
      const pkgs = q ? q.packages : [];
      const schedeC = schede.filter(s => s.clienteId === client.id);
      const apts = appointments.filter(a => a.clientId === client.id);
      await generateClientePDF(client, pkgs, schedeC, apts);
      showToast('PDF generato con successo!');
    } catch(e) {
      console.error(e);
      showToast('Errore nella generazione del PDF', 'error');
    }
  };

  const handleWhatsApp = (client) => {
    const phone = client.telefono?.replace(/\D/g, '');
    if (!phone) return showToast('Numero di telefono non impostato', 'error');
    const msg = encodeURIComponent(`Ciao ${client.nome}! Ti invio la tua scheda di allenamento aggiornata. 💪`);
    window.open(`https://wa.me/${phone.startsWith('39') ? phone : '39' + phone}?text=${msg}`, '_blank');
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h2>Clienti</h2><p>{clients.length} clienti totali</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nuovo cliente</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Cerca cliente..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['tutti', 'individuale', 'corso'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
              {f === 'tutti' ? 'Tutti' : f === 'individuale' ? 'Individuali' : 'Corsi'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <h3>Nessun cliente</h3>
          <p>Aggiungi il tuo primo cliente per iniziare</p>
          <button className="btn btn-primary" onClick={openAdd}>+ Aggiungi cliente</button>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(client => {
            const q = getPackageQueue(client, appointments);
            const expiring = q && q.isExpiring;
            return (
              <div key={client.id} className="client-card"
                style={expiring ? { borderColor: q.allExhausted ? 'var(--red-border)' : 'var(--amber-border)' } : {}}
                onClick={() => setShowDetail(client.id)}>
                {expiring && (
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span className={`badge ${q.allExhausted ? 'badge-red' : 'badge-yellow'}`}>
                      {q.allExhausted ? 'Esaurito' : `${q.totalRemaining} rimaste`}
                    </span>
                  </div>
                )}
                <div className="client-avatar" style={client.type === 'corso' ? { background: '#f0fdfa', color: 'var(--green)' } : {}}>
                  {(client.nome?.[0] || '?').toUpperCase()}
                </div>
                <h4>{client.nome} {client.cognome}</h4>
                <div className="client-type">{client.type === 'corso' ? 'Corso di gruppo' : 'Individuale'}</div>
                {q && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
                      <span>Lezioni rimanenti</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{q.totalRemaining}/{q.totalLessons}</span>
                    </div>
                    <ProgressBar remaining={q.totalRemaining} total={q.totalLessons} />
                    {q.packages.length > 1 && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{q.packages.length} pacchetti in coda</div>
                    )}
                  </>
                )}
                {client.type === 'corso' && (() => {
                  const currentMonth = new Date().toISOString().slice(0, 7);
                  const payments = client.monthlyPayments || [];
                  const isPaid = payments.find(p => p.month === currentMonth)?.paid === true;
                  return (
                    <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                      {client.partecipanti} partecipanti · <strong style={{ color: 'var(--green)' }}>€{client.monthlyFee}/mese</strong>
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: isPaid ? 'var(--green)' : 'var(--red)' }}>
                        {isPaid ? '✓ Pagato' : '✗ Non pagato'}
                      </span>
                    </div>
                  );
                })()}
                {client.telefono && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>📞 {client.telefono}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && (() => {
        const c = clients.find(x => x.id === showDetail);
        if (!c) return null;

        if (c.packages && c.packages.some(p => !p.id)) {
          const fixed = c.packages.map((p, i) => p.id ? p : { ...p, id: `pkg_${c.id}_${i}_${Date.now()}` });
          updateClient(c.id, { packages: fixed }).catch(() => {});
        }
        const q = getPackageQueue(c, appointments);
        const aptList = appointments.filter(a => a.clientId === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        return (
          <div className="modal-overlay" onClick={() => { setShowDetail(null); setConfirmDelete(null); }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
              <div className="modal-header">
                <h3>{c.nome} {c.cognome}</h3>
                <button className="modal-close" onClick={() => { setShowDetail(null); setConfirmDelete(null); }}>✕</button>
              </div>

              {/* Info base */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {c.telefono && <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12 }}><div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Telefono</div><div style={{ fontSize: 14, fontWeight: 500 }}>{c.telefono}</div></div>}
                {c.email && <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12 }}><div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Email</div><div style={{ fontSize: 14, fontWeight: 500 }}>{c.email}</div></div>}
                {c.type === 'corso' && <>
                  <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12 }}><div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Partecipanti</div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{c.partecipanti}</div></div>
                  <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12 }}><div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Costo mensile</div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>€{c.monthlyFee}</div></div>
                </>}
              </div>

              {/* ── PAGAMENTI MENSILI (solo corsi di gruppo) ── */}
              {c.type === 'corso' && (() => {
                const payments = c.monthlyPayments || [];
                const currentMonth = new Date().toISOString().slice(0, 7);
                const currentEntry = payments.find(p => p.month === currentMonth);
                const isPaidThisMonth = currentEntry?.paid === true;

                const startPay = (month) => {
                  const entry = payments.find(p => p.month === month);
                  if (entry?.paid) { confirmPay(month, entry.fee ?? c.monthlyFee ?? 0, false); return; }
                  setPayingMonth({ month, fee: String(entry?.fee ?? c.monthlyFee ?? '') });
                };

                const confirmPay = async (month, fee, paid = true) => {
                  const existing = payments.find(p => p.month === month);
                  let updated;
                  if (existing) {
                    updated = payments.map(p => p.month === month ? { ...p, paid, fee: Number(fee) || 0 } : p);
                  } else {
                    updated = [...payments, { month, paid, fee: Number(fee) || 0 }];
                  }
                  await updateClient(c.id, { monthlyPayments: updated });
                  showToast(paid ? '✓ Mese segnato come pagato' : 'Segnato come non pagato', paid ? 'success' : 'warning');
                  setPayingMonth(null);
                };

                const addPastMonth = async () => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - 1);
                  const prevMonth = d.toISOString().slice(0, 7);
                  if (payments.find(p => p.month === prevMonth)) return showToast('Mese già presente', 'warning');
                  const updated = [...payments, { month: prevMonth, paid: false, fee: c.monthlyFee || 0 }];
                  await updateClient(c.id, { monthlyPayments: updated });
                  showToast('Mese precedente aggiunto');
                };

                const allMonths = [...new Set([currentMonth, ...payments.map(p => p.month)])].sort((a, b) => b.localeCompare(a));
                const fmtMonth = (ym) => {
                  const [y, m] = ym.split('-');
                  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
                };

                const PayConfirm = ({ month }) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--green-light)', border: '1.5px solid var(--green-border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, whiteSpace: 'nowrap' }}>€ importo:</span>
                    <input
                      type="number"
                      value={payingMonth.fee}
                      onChange={e => setPayingMonth(pm => ({ ...pm, fee: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') confirmPay(month, payingMonth.fee); if (e.key === 'Escape') setPayingMonth(null); }}
                      autoFocus
                      style={{ width: 80, fontSize: 13, padding: '3px 8px', borderRadius: 5, border: '1.5px solid var(--green-border)', background: 'white' }}
                      placeholder={String(c.monthlyFee || 0)}
                    />
                    <button onClick={() => confirmPay(month, payingMonth.fee)} style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 5, cursor: 'pointer', border: '1.5px solid var(--green-border)', background: 'var(--green)', color: 'white' }}>✓ Conferma</button>
                    <button onClick={() => setPayingMonth(null)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-3)' }}>✕</button>
                  </div>
                );

                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Pagamenti mensili</div>
                    <div style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${isPaidThisMonth ? 'var(--green-border)' : 'var(--red-border)'}`, background: isPaidThisMonth ? 'var(--green-light)' : 'var(--red-light)', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isPaidThisMonth ? 'var(--green)' : 'var(--red)' }}>
                            {isPaidThisMonth ? '✓ Mese corrente pagato' : '✗ Mese corrente non pagato'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                            {fmtMonth(currentMonth)} · €{currentEntry?.fee ?? c.monthlyFee ?? 0}
                          </div>
                        </div>
                        <button onClick={() => startPay(currentMonth)} style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 6, cursor: 'pointer', border: `1.5px solid ${isPaidThisMonth ? 'var(--green-border)' : 'var(--red-border)'}`, background: 'white', color: isPaidThisMonth ? 'var(--green)' : 'var(--red)' }}>
                          {isPaidThisMonth ? 'Segna non pagato' : 'Segna pagato'}
                        </button>
                      </div>
                      {payingMonth?.month === currentMonth && <PayConfirm month={currentMonth} />}
                    </div>

                    {allMonths.filter(m => m !== currentMonth).length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6 }}>Storico</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {allMonths.filter(m => m !== currentMonth).map(month => {
                            const entry = payments.find(p => p.month === month);
                            const paid = entry?.paid === true;
                            const removeMonth = async () => {
                              const updated = payments.filter(p => p.month !== month);
                              await updateClient(c.id, { monthlyPayments: updated });
                              showToast('Mese rimosso', 'warning');
                            };
                            return (
                              <div key={month} style={{ borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                                  <div>
                                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{fmtMonth(month)}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>€{entry?.fee ?? c.monthlyFee ?? 0}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <button onClick={() => startPay(month)} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 5, cursor: 'pointer', border: `1.5px solid ${paid ? 'var(--green-border)' : 'var(--red-border)'}`, background: paid ? 'var(--green-light)' : 'var(--red-light)', color: paid ? 'var(--green)' : 'var(--red)' }}>
                                      {paid ? '✓ Pagato' : '✗ Non pagato'}
                                    </button>
                                    <button onClick={removeMonth} title="Rimuovi" style={{ fontSize: 12, padding: '3px 7px', borderRadius: 5, cursor: 'pointer', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-3)', lineHeight: 1 }}>✕</button>
                                  </div>
                                </div>
                                {payingMonth?.month === month && <div style={{ padding: '0 12px 10px' }}><PayConfirm month={month} /></div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={addPastMonth}>+ Aggiungi mese precedente</button>
                  </div>
                );
              })()}

              {/* ── PACCHETTI ── */}
              {q && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pacchetti ({q.packages.length})</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: q.allExhausted ? 'var(--red)' : 'var(--accent)' }}>{q.totalRemaining} lezioni rimaste</div>
                  </div>
                  {!q.canBook && q.packages.length > 0 && (
                    <div className="alert alert-danger" style={{ marginBottom: 12 }}>
                      <strong>⛔ Nessun pacchetto attivo.</strong> Attiva il prossimo pacchetto per permettere nuovi appuntamenti.
                    </div>
                  )}
                  {q.unpaidExhausted && (
                    <div className="alert alert-danger" style={{ marginBottom: 12 }}>
                      <strong>⚠ Pacchetto non pagato!</strong> Le lezioni sono finite e il pacchetto non risulta ancora saldato.
                    </div>
                  )}
                  {q.unpaidLastLesson && !q.unpaidExhausted && (
                    <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                      <strong>⚠ Ultima lezione!</strong> È rimasta 1 sola lezione e il pacchetto non è stato ancora pagato.
                    </div>
                  )}
                  {q.packages.map((pkg, i) => {
                    const isActive = pkg.isActive === true;
                    const status = pkg.exhausted && isActive ? 'exhausted' : isActive ? 'active' : 'queued';
                    const isPaid = pkg.paid !== false;
                    const isUnpaidDanger = pkg.exhausted && !isPaid && isActive;

                    const togglePaid = async () => {
                      const newPkgs = (c.packages || []).map((p, idx) =>
                        (p.id && p.id === pkg.id) || (!p.id && idx === i)
                          ? { ...p, paid: !isPaid } : p
                      );
                      await updateClient(c.id, { packages: newPkgs });
                      showToast(!isPaid ? '✓ Segnato come pagato' : 'Segnato come non pagato', !isPaid ? 'success' : 'warning');
                    };

                    const scalaLezione = async () => {
                      const newPkgs = (c.packages || []).map((p, idx) =>
                        (p.id && p.id === pkg.id) || (!p.id && idx === i)
                          ? { ...p, manualUsed: (p.manualUsed || 0) + 1 } : p
                      );
                      await updateClient(c.id, { packages: newPkgs });
                      showToast('Lezione scalata');
                    };

                    const aggiungiLezione = async () => {
                      if ((pkg.manualUsed || 0) === 0) return;
                      const newPkgs = (c.packages || []).map((p, idx) =>
                        (p.id && p.id === pkg.id) || (!p.id && idx === i)
                          ? { ...p, manualUsed: Math.max(0, (p.manualUsed || 0) - 1) } : p
                      );
                      await updateClient(c.id, { packages: newPkgs });
                      showToast('Lezione aggiunta');
                    };

                    return (
                      <div key={pkg.id} className={`pkg-item ${status}`}
                        style={isUnpaidDanger ? { borderColor: 'var(--red-border)', background: 'var(--red-light)' } : {}}>
                        <div className={`pkg-num ${status}`}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                              {status === 'exhausted' ? '✓ Esaurito' : status === 'active' ? '▶ Attivo' : '⏳ In coda'}
                              {' · '}{pkg.lessons} lezioni{pkg.cost > 0 ? ` · €${pkg.cost}` : ''}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: status === 'exhausted' ? 'var(--red)' : isActive ? 'var(--accent)' : 'var(--text-3)' }}>
                              {isActive ? `${pkg.remaining}/${pkg.lessons}` : `${pkg.lessons} lezioni`}
                            </span>
                          </div>

                          {isActive && <ProgressBar remaining={pkg.remaining} total={pkg.lessons} />}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                            {pkg.purchasedAt && (
                              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{pkg.purchasedAt}</span>
                            )}
                            <button onClick={togglePaid} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 5, cursor: 'pointer', border: `1.5px solid ${isPaid ? 'var(--green-border)' : 'var(--red-border)'}`, background: isPaid ? 'var(--green-light)' : 'var(--red-light)', color: isPaid ? 'var(--green)' : 'var(--red)' }}>
                              {isPaid ? '✓ Pagato' : '✗ Non pagato'}
                            </button>
                            {isActive && (
                              <>
                                <button onClick={scalaLezione} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 5, cursor: 'pointer', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-2)' }}>
                                  − Scala lezione
                                </button>
                                {(pkg.manualUsed || 0) > 0 && (
                                  <button onClick={aggiungiLezione} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 5, cursor: 'pointer', border: '1.5px solid var(--green-border)', background: 'var(--green-light)', color: 'var(--green)' }}>
                                    + Aggiungi lezione
                                  </button>
                                )}
                              </>
                            )}
                            {status === 'queued' && (
                              <button onClick={() => handleActivatePackage(c, pkg.id)} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 5, cursor: 'pointer', border: '1.5px solid var(--accent)', background: 'var(--accent-light, #eff6ff)', color: 'var(--accent)' }}>
                                ▶ Attiva ora
                              </button>
                            )}
                          </div>

                          {isActive && (pkg.manualUsed || 0) > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                              {pkg.manualUsed} lezione/i scalate manualmente
                            </div>
                          )}
                          {isUnpaidDanger && (
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginTop: 6 }}>
                              ⚠ Lezioni esaurite — pacchetto non pagato!
                            </div>
                          )}
                        </div>

                        <button className="btn btn-danger btn-sm"
                          title="Elimina pacchetto"
                          onClick={() => {
                            if (window.confirm(`Eliminare questo pacchetto? L'operazione non è reversibile.`)) {
                              handleDeletePackage(c, pkg.id);
                            }
                          }}>✕</button>
                      </div>
                    );
                  })}
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}
                    onClick={() => { openAddPackage(c); setShowDetail(null); }}>
                    + Aggiungi pacchetto in coda
                  </button>
                </div>
              )}

              {/* Schede allenamento */}
              {c.type === 'individuale' && (() => {
                const schedeCliente = schede.filter(s => s.clienteId === c.id);
                if (schedeCliente.length === 0) return null;
                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      Schede allenamento ({schedeCliente.length})
                    </div>
                    {schedeCliente.map(s => {
                      const oggi = new Date();
                      const scaduta = s.dataFine && new Date(s.dataFine) < oggi;
                      const inScadenza = s.dataFine && !scaduta && new Date(s.dataFine) < new Date(oggi.getTime() + 7*86400000);
                      const giorniAttivi = Object.keys(s.giorni || {});
                      const totFatti = giorniAttivi.reduce((sum, g) => sum + (s.giorni[g]?.filter(e => e.fatto)?.length || 0), 0);
                      const totEsercizi = giorniAttivi.reduce((sum, g) => sum + (s.giorni[g]?.length || 0), 0);
                      return (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, border: `1px solid ${scaduta ? 'var(--red-border)' : inScadenza ? 'var(--amber-border)' : 'var(--border)'}`, marginBottom: 8 }}>
                          <div style={{ fontSize: 20 }}>📋</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{s.nome}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                              {giorniAttivi.length} giorni · {totEsercizi} esercizi
                              {s.dataFine && ` · Scade: ${s.dataFine}`}
                            </div>
                            {totEsercizi > 0 && (
                              <div style={{ marginTop: 5 }}>
                                <div className="progress-bar">
                                  <div className="progress-fill green" style={{ width: `${(totFatti/totEsercizi)*100}%` }} />
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{totFatti}/{totEsercizi} esercizi completati</div>
                              </div>
                            )}
                          </div>
                          <span className={`badge ${scaduta ? 'badge-red' : inScadenza ? 'badge-yellow' : 'badge-green'}`}>
                            {scaduta ? 'Scaduta' : inScadenza ? 'Scade presto' : 'Attiva'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Storico */}
              {aptList.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Ultime lezioni ({aptList.length})</div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {aptList.slice(0, 10).map(apt => (
                      <div key={apt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 6, background: 'var(--bg)', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-2)' }}>{format(new Date(apt.date), "EEE d MMM yyyy 'alle' HH:mm", { locale: it })}</span>
                        {apt.note && <span style={{ color: 'var(--text-3)' }}>{apt.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-footer" style={{ flexWrap: 'wrap', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => handleGeneratePDF(c)}>
                  📄 Scarica PDF
                </button>
                {c.telefono && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleWhatsApp(c)}
                    style={{ color: '#16A34A', borderColor: '#BBF7D0' }}>
                    💬 WhatsApp
                  </button>
                )}
                <div style={{ flex: 1 }} />
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Modifica</button>
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(c.id)}>Elimina</button>
              </div>
              {confirmDelete === c.id && (
                <div className="alert alert-danger" style={{ marginTop: 12 }}>
                  Confermi eliminazione di {c.nome} {c.cognome}? Questa azione non è reversibile.
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Sì, elimina</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(null)}>Annulla</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editClient ? 'Modifica cliente' : 'Nuovo cliente'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="input-group" style={{ flex: 1 }}><label>Nome *</label><input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Mario" /></div>
              <div className="input-group" style={{ flex: 1 }}><label>Cognome *</label><input value={form.cognome} onChange={e => setForm({ ...form, cognome: e.target.value })} placeholder="Rossi" /></div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="input-group" style={{ flex: 1 }}><label>Telefono</label><input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+39 333..." /></div>
              <div className="input-group" style={{ flex: 1 }}><label>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="mario@email.com" /></div>
            </div>
            {!editClient && (
              <div className="input-group">
                <label>Tipo cliente</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="individuale">Individuale</option>
                  <option value="corso">Corso di gruppo</option>
                </select>
              </div>
            )}
            {!editClient && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Primo pacchetto {form.type === 'corso' ? '(opzionale)' : '(opzionale)'}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="input-group" style={{ flex: 1 }}><label>Lezioni</label><input type="number" min="1" value={form.packageLessons} onChange={e => setForm({ ...form, packageLessons: e.target.value })} placeholder="10" /></div>
                  <div className="input-group" style={{ flex: 1 }}><label>Costo (€) <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 400 }}>opzionale</span></label><input type="number" value={form.packageCost} onChange={e => setForm({ ...form, packageCost: e.target.value })} placeholder="0" /></div>
                  <div className="input-group" style={{ flex: 1 }}><label>Data acquisto</label><input type="date" value={form.packagePurchasedAt} onChange={e => setForm({ ...form, packagePurchasedAt: e.target.value })} /></div>
                </div>
              </>
            )}
            {(editClient?.type === 'corso' || (!editClient && form.type === 'corso')) && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="input-group" style={{ flex: 1 }}><label>Partecipanti</label><input type="number" min="1" value={form.partecipanti} onChange={e => setForm({ ...form, partecipanti: e.target.value })} placeholder="8" /></div>
                <div className="input-group" style={{ flex: 1 }}><label>Costo mensile (€)</label><input type="number" value={form.monthlyFee} onChange={e => setForm({ ...form, monthlyFee: e.target.value })} placeholder="80" /></div>
              </div>
            )}
            <div className="input-group"><label>Note</label><textarea rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Note aggiuntive..." /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSave}>{editClient ? 'Salva modifiche' : 'Aggiungi cliente'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PACKAGE MODAL */}
      {showPkgModal && pkgClient && (
        <div className="modal-overlay" onClick={() => setShowPkgModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Aggiungi pacchetto</h3>
              <button className="modal-close" onClick={() => setShowPkgModal(false)}>✕</button>
            </div>
            {(() => {
              const q = getPackageQueue(pkgClient, appointments);
              return (
                <div className={`alert ${q && q.canBook ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: 16 }}>
                  {q && q.canBook
                    ? `${pkgClient.nome} ha ancora ${q.totalRemaining} lezioni nel pacchetto attivo. Il nuovo pacchetto rimarrà in coda finché non si esaurisce quello corrente.`
                    : `Nessun pacchetto attivo per ${pkgClient.nome} ${pkgClient.cognome}. Il nuovo pacchetto verrà attivato subito.`}
                </div>
              );
            })()}
            <div className="input-group"><label>Numero lezioni *</label><input type="number" min="1" value={pkgForm.packageLessons} onChange={e => setPkgForm({ ...pkgForm, packageLessons: e.target.value })} placeholder="10" /></div>
            <div className="input-group">
              <label>Costo pacchetto (€) <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 400 }}>opzionale</span></label>
              <input type="number" value={pkgForm.packageCost} onChange={e => setPkgForm({ ...pkgForm, packageCost: e.target.value })} placeholder="0" />
            </div>
            <div className="input-group"><label>Data acquisto</label><input type="date" value={pkgForm.packagePurchasedAt} onChange={e => setPkgForm({ ...pkgForm, packagePurchasedAt: e.target.value })} /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowPkgModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleAddPackage}>+ Aggiungi pacchetto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
