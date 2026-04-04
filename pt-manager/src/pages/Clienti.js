// src/pages/Clienti.js
import React, { useState, useMemo } from 'react';
import { useClients } from '../hooks/useClients';
import { useAppointments } from '../hooks/useAppointments';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const INITIAL_FORM = {
  nome: '', cognome: '', telefono: '', email: '',
  type: 'individuale',
  packageLessons: '', packageCost: '',
  packagePurchasedAt: new Date().toISOString().split('T')[0],
  partecipanti: '', monthlyFee: '',
  note: '',
};

const INITIAL_PKG = {
  packageLessons: '', packageCost: '',
  packagePurchasedAt: new Date().toISOString().split('T')[0],
};

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`toast ${type}`}>{msg}</div>;
}

export default function Clienti() {
  const { clients, addClient, updateClient, deleteClient } = useClients();
  const { appointments } = useAppointments();
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [pkgClient, setPkgClient] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [pkgForm, setPkgForm] = useState(INITIAL_PKG);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('tutti');
  const [toast, setToast] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() =>
    clients.filter(c => {
      const matchSearch = `${c.nome} ${c.cognome} ${c.email}`.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'tutti' || c.type === filter;
      return matchSearch && matchFilter;
    }),
    [clients, search, filter]
  );

  const getLessonsInfo = (client) => {
    if (client.type === 'corso') return null;
    const used = appointments.filter(a => a.clientId === client.id).length;
    const remaining = (client.packageLessons || 0) - used;
    return { used, remaining, total: client.packageLessons || 0 };
  };

  const openAdd = () => {
    setEditClient(null);
    setForm(INITIAL_FORM);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditClient(c);
    setForm({
      nome: c.nome || '', cognome: c.cognome || '',
      telefono: c.telefono || '', email: c.email || '',
      type: c.type || 'individuale',
      packageLessons: c.packageLessons || '',
      packageCost: c.packageCost || '',
      packagePurchasedAt: c.packagePurchasedAt || new Date().toISOString().split('T')[0],
      partecipanti: c.partecipanti || '',
      monthlyFee: c.monthlyFee || '',
      note: c.note || '',
    });
    setShowModal(true);
  };

  const openAddPackage = (c) => {
    setPkgClient(c);
    setPkgForm(INITIAL_PKG);
    setShowPkgModal(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.cognome) return showToast('Nome e cognome obbligatori', 'error');
    const data = {
      ...form,
      packageLessons: Number(form.packageLessons) || 0,
      packageCost: Number(form.packageCost) || 0,
      partecipanti: Number(form.partecipanti) || 0,
      monthlyFee: Number(form.monthlyFee) || 0,
    };
    if (editClient) {
      await updateClient(editClient.id, data);
      showToast('Cliente aggiornato!');
    } else {
      await addClient(data);
      showToast('Cliente aggiunto!');
    }
    setShowModal(false);
  };

  const handleAddPackage = async () => {
    if (!pkgForm.packageLessons) return showToast('Inserisci il numero di lezioni', 'error');
    // Reset counter by updating client's packageLessons and clearing used count
    // We add a packageHistory entry and reset the appointment counter
    await updateClient(pkgClient.id, {
      packageLessons: Number(pkgForm.packageLessons),
      packageCost: Number(pkgForm.packageCost) || 0,
      packagePurchasedAt: pkgForm.packagePurchasedAt,
      appointmentsFromPackageStart: appointments.filter(a => a.clientId === pkgClient.id).length,
    });
    showToast('Nuovo pacchetto aggiunto! ✓');
    setShowPkgModal(false);
    setPkgClient(null);
  };

  const handleDelete = async (id) => {
    await deleteClient(id);
    showToast('Cliente eliminato', 'warning');
    setConfirmDelete(null);
    setShowDetail(null);
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>CLIENTI</h2>
          <p>{clients.length} clienti totali</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Nuovo Cliente
        </button>
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Cerca cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {['tutti', 'individuale', 'corso'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'tutti' ? 'Tutti' : f === 'individuale' ? 'Individuali' : 'Corsi'}
            </button>
          ))}
        </div>
      </div>

      {/* Client cards grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <h3>Nessun cliente</h3>
          <p>Aggiungi il tuo primo cliente per iniziare</p>
          <button className="btn btn-primary" onClick={openAdd}>+ Aggiungi Cliente</button>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(client => {
            const info = getLessonsInfo(client);
            const isExpiring = info && info.remaining <= 2 && info.remaining >= 0;
            const pct = info ? Math.max(0, (info.remaining / info.total) * 100) : 100;
            return (
              <div key={client.id} className="client-card" onClick={() => setShowDetail(client)}>
                {isExpiring && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 6, padding: '2px 8px',
                    fontSize: 11, color: 'var(--yellow)'
                  }}>
                    {info.remaining === 0 ? '⚠ Esaurito' : `⚠ ${info.remaining} rimaste`}
                  </div>
                )}
                <div className="client-avatar" style={client.type === 'corso' ? {
                  background: 'rgba(45,201,160,0.08)',
                  color: 'var(--teal)',
                  border: '1px solid rgba(45,201,160,0.15)'
                } : {}}>
                  {(client.nome?.[0] || '?').toUpperCase()}
                </div>
                <h4>{client.nome} {client.cognome}</h4>
                <div className="client-type">
                  {client.type === 'corso' ? '📚 Corso' : '🏋️ Individuale'}
                </div>

                {client.type === 'individuale' && info && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <span>Lezioni</span>
                      <span>{info.remaining}/{info.total}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${info.remaining <= 1 ? 'red' : info.remaining <= 3 ? 'yellow' : 'green'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {client.packageCost > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                        Pacchetto: <strong style={{ color: 'var(--green)' }}>€{client.packageCost}</strong>
                      </div>
                    )}
                  </>
                )}

                {client.type === 'corso' && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {client.partecipanti} partecipanti · <strong style={{ color: 'var(--green)' }}>€{client.monthlyFee}/mese</strong>
                  </div>
                )}

                {client.telefono && (
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
                    📞 {client.telefono}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (() => {
        const c = showDetail;
        const info = getLessonsInfo(c);
        const aptList = appointments.filter(a => a.clientId === c.id).sort((a,b) => new Date(b.date) - new Date(a.date));
        return (
          <div className="modal-overlay" onClick={() => setShowDetail(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
              <div className="modal-header">
                <h3>{c.nome} {c.cognome}</h3>
                <button className="modal-close" onClick={() => setShowDetail(null)}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {c.telefono && (
                  <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>TELEFONO</div>
                    <div style={{ fontSize: 14 }}>{c.telefono}</div>
                  </div>
                )}
                {c.email && (
                  <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>EMAIL</div>
                    <div style={{ fontSize: 14 }}>{c.email}</div>
                  </div>
                )}
                {c.type === 'individuale' && info && (
                  <>
                    <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>LEZIONI RIMASTE</div>
                      <div style={{ fontSize: 28, fontFamily: 'Bebas Neue', color: info.remaining <= 2 ? 'var(--yellow)' : 'var(--green)' }}>
                        {info.remaining}/{info.total}
                      </div>
                    </div>
                    <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>COSTO PACCHETTO</div>
                      <div style={{ fontSize: 28, fontFamily: 'Bebas Neue', color: 'var(--green)' }}>€{c.packageCost}</div>
                    </div>
                  </>
                )}
                {c.type === 'corso' && (
                  <>
                    <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>PARTECIPANTI</div>
                      <div style={{ fontSize: 28, fontFamily: 'Bebas Neue', color: 'var(--blue)' }}>{c.partecipanti}</div>
                    </div>
                    <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>COSTO MENSILE</div>
                      <div style={{ fontSize: 28, fontFamily: 'Bebas Neue', color: 'var(--green)' }}>€{c.monthlyFee}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Storico lezioni */}
              {aptList.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                    Ultime lezioni
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {aptList.slice(0, 8).map(apt => (
                      <div key={apt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span>{format(new Date(apt.date), "EEE d MMM yyyy 'alle' HH:mm", { locale: it })}</span>
                        {apt.note && <span style={{ color: 'var(--text-muted)' }}>{apt.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-footer">
                {c.type === 'individuale' && info && info.remaining <= 2 && (
                  <button className="btn btn-primary" onClick={() => { openAddPackage(c); setShowDetail(null); }}>
                    + Nuovo Pacchetto
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => { openEdit(c); setShowDetail(null); }}>
                  Modifica
                </button>
                <button className="btn btn-danger" onClick={() => setConfirmDelete(c.id)}>
                  Elimina
                </button>
              </div>

              {confirmDelete === c.id && (
                <div className="alert alert-danger" style={{ marginTop: 12 }}>
                  <div>Confermi eliminazione di {c.nome}? Non potrai recuperarlo.</div>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editClient ? 'MODIFICA CLIENTE' : 'NUOVO CLIENTE'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Nome *</label>
                <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Mario" />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Cognome *</label>
                <input value={form.cognome} onChange={e => setForm({...form, cognome: e.target.value})} placeholder="Rossi" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Telefono</label>
                <input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="+39 333 1234567" />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Email</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="mario@email.com" type="email" />
              </div>
            </div>

            <div className="input-group">
              <label>Tipo</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="individuale">Individuale</option>
                <option value="corso">Corso di gruppo</option>
              </select>
            </div>

            {form.type === 'individuale' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Lezioni nel pacchetto</label>
                  <input type="number" value={form.packageLessons} onChange={e => setForm({...form, packageLessons: e.target.value})} placeholder="10" min="1" />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Costo pacchetto (€)</label>
                  <input type="number" value={form.packageCost} onChange={e => setForm({...form, packageCost: e.target.value})} placeholder="300" />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Data acquisto</label>
                  <input type="date" value={form.packagePurchasedAt} onChange={e => setForm({...form, packagePurchasedAt: e.target.value})} />
                </div>
              </div>
            )}

            {form.type === 'corso' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Partecipanti</label>
                  <input type="number" value={form.partecipanti} onChange={e => setForm({...form, partecipanti: e.target.value})} placeholder="8" min="1" />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Costo mensile (€)</label>
                  <input type="number" value={form.monthlyFee} onChange={e => setForm({...form, monthlyFee: e.target.value})} placeholder="80" />
                </div>
              </div>
            )}

            <div className="input-group">
              <label>Note</label>
              <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Note aggiuntive..." rows={2} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editClient ? 'Salva modifiche' : 'Aggiungi Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Package Modal */}
      {showPkgModal && pkgClient && (
        <div className="modal-overlay" onClick={() => setShowPkgModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>NUOVO PACCHETTO</h3>
              <button className="modal-close" onClick={() => setShowPkgModal(false)}>✕</button>
            </div>

            <div className="alert alert-warning" style={{ marginBottom: 20 }}>
              Stai aggiungendo un nuovo pacchetto per <strong>{pkgClient.nome} {pkgClient.cognome}</strong>
            </div>

            <div className="input-group">
              <label>Numero lezioni *</label>
              <input type="number" value={pkgForm.packageLessons} onChange={e => setPkgForm({...pkgForm, packageLessons: e.target.value})} placeholder="10" min="1" />
            </div>

            <div className="input-group">
              <label>Costo pacchetto (€)</label>
              <input type="number" value={pkgForm.packageCost} onChange={e => setPkgForm({...pkgForm, packageCost: e.target.value})} placeholder="300" />
            </div>

            <div className="input-group">
              <label>Data acquisto</label>
              <input type="date" value={pkgForm.packagePurchasedAt} onChange={e => setPkgForm({...pkgForm, packagePurchasedAt: e.target.value})} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowPkgModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleAddPackage}>
                ✓ Aggiungi Pacchetto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
