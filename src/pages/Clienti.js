// src/pages/Clienti.js
import React, { useState, useMemo } from 'react';
import { useClients } from '../hooks/useClients';
import { useAppointments } from '../hooks/useAppointments';
import { getPackageQueue } from '../utils/packageUtils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const INITIAL_FORM = {
  nome: '', cognome: '', telefono: '', email: '',
  type: 'individuale',
  packageLessons: '', packageCost: '',
  packagePurchasedAt: new Date().toISOString().split('T')[0],
  partecipanti: '', monthlyFee: '', note: '',
};

const INITIAL_PKG = {
  packageLessons: '', packageCost: '',
  packagePurchasedAt: new Date().toISOString().split('T')[0],
};

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`toast ${type}`}>{msg}</div>;
}

function ProgressBar({ remaining, total }) {
  const pct = total > 0 ? Math.max(0, (remaining / total) * 100) : 0;
  const color = remaining === 0 ? 'red' : remaining <= 2 ? 'yellow' : 'green';
  return (
    <div className="progress-bar">
      <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function PackageQueueView({ queue, onAddPackage, onRemovePackage }) {
  if (!queue) return null;
  const { packages, totalRemaining, totalLessons } = queue;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          Lezioni totali:{' '}
          <span style={{ color: totalRemaining <= 2 ? 'var(--red)' : 'var(--green)' }}>
            {totalRemaining}
          </span> / {totalLessons}
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAddPackage} style={{ fontSize: 11, padding: '5px 12px' }}>
          + Aggiungi pacchetto
        </button>
      </div>
      {packages.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: '12px 0' }}>Nessun pacchetto</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {packages.map((pkg, i) => (
            <div key={pkg.id || i} style={{
              background: pkg.exhausted ? 'var(--surface2)' : 'var(--surface)',
              border: `1px solid ${!pkg.exhausted && i === 0 ? 'rgba(79,124,255,0.3)' : 'var(--border)'}`,
              borderRadius: 8, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: pkg.exhausted ? 0.55 : 1,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: pkg.exhausted ? 'var(--text-dim)' : i === 0 ? 'var(--blue)' : 'var(--text-dim)',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                    {pkg.exhausted ? 'Esaurito' : i === 0 ? 'Attivo' : `In coda (${i + 1}°)`}
                    {' · '}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                      {pkg.lessons} lezioni
                      {pkg.cost > 0 && ` · €${pkg.cost}`}
                      {pkg.purchasedAt && ` · ${format(new Date(pkg.purchasedAt), 'd MMM yyyy', { locale: it })}`}
                    </span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: pkg.remaining === 0 ? 'var(--text-dim)' : pkg.remaining <= 2 ? 'var(--yellow)' : 'var(--green)' }}>
                    {pkg.remaining}/{pkg.lessons}
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 3 }}>
                  <div className={`progress-fill ${pkg.remaining === 0 ? 'red' : pkg.remaining <= 2 ? 'yellow' : 'green'}`}
                    style={{ width: `${Math.max(0, (pkg.remaining / pkg.lessons) * 100)}%` }} />
                </div>
              </div>
              {!pkg.exhausted && i > 0 && (
                <button onClick={() => onRemovePackage(pkg.id)} style={{
                  background: 'none', border: 'none', color: 'var(--text-dim)',
                  cursor: 'pointer', fontSize: 18, padding: 4, lineHeight: 1, flexShrink: 0,
                }} title="Rimuovi dalla coda">×</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = useMemo(() =>
    clients.filter(c => {
      const matchSearch = `${c.nome} ${c.cognome} ${c.email}`.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'tutti' || c.type === filter;
      return matchSearch && matchFilter;
    }),
    [clients, search, filter]
  );

  const openAdd = () => { setEditClient(null); setForm(INITIAL_FORM); setShowModal(true); };

  const openEdit = (c) => {
    setEditClient(c);
    setForm({
      nome: c.nome || '', cognome: c.cognome || '',
      telefono: c.telefono || '', email: c.email || '',
      type: c.type || 'individuale',
      packageLessons: '', packageCost: '',
      packagePurchasedAt: new Date().toISOString().split('T')[0],
      partecipanti: c.partecipanti || '',
      monthlyFee: c.monthlyFee || '',
      note: c.note || '',
    });
    setShowModal(true);
  };

  const openAddPackage = (c) => { setPkgClient(c); setPkgForm(INITIAL_PKG); setShowPkgModal(true); };

  const handleRemoveQueuedPackage = async (client, pkgId) => {
    const packages = (client.packages || []).filter(p => p.id !== pkgId);
    await updateClient(client.id, { packages });
    showToast('Pacchetto rimosso dalla coda', 'warning');
    setShowDetail(prev => prev ? { ...prev, packages } : prev);
  };

  const handleSave = async () => {
    if (!form.nome || !form.cognome) return showToast('Nome e cognome obbligatori', 'error');
    if (editClient) {
      await updateClient(editClient.id, {
        nome: form.nome, cognome: form.cognome,
        telefono: form.telefono, email: form.email,
        type: form.type,
        partecipanti: Number(form.partecipanti) || 0,
        monthlyFee: Number(form.monthlyFee) || 0,
        note: form.note,
      });
      showToast('Cliente aggiornato!');
    } else {
      const packages = form.type === 'individuale' && form.packageLessons ? [{
        id: Date.now().toString(),
        lessons: Number(form.packageLessons),
        cost: Number(form.packageCost) || 0,
        purchasedAt: form.packagePurchasedAt,
      }] : [];
      await addClient({
        nome: form.nome, cognome: form.cognome,
        telefono: form.telefono, email: form.email,
        type: form.type, packages,
        packageLessons: Number(form.packageLessons) || 0,
        packageCost: Number(form.packageCost) || 0,
        packagePurchasedAt: form.packagePurchasedAt,
        partecipanti: Number(form.partecipanti) || 0,
        monthlyFee: Number(form.monthlyFee) || 0,
        note: form.note,
      });
      showToast('Cliente aggiunto!');
    }
    setShowModal(false);
  };

  const handleAddPackage = async () => {
    if (!pkgForm.packageLessons) return showToast('Inserisci il numero di lezioni', 'error');
    const existingPackages = pkgClient.packages ? [...pkgClient.packages] : [];
    if (existingPackages.length === 0 && pkgClient.packageLessons > 0) {
      existingPackages.push({
        id: 'legacy', lessons: pkgClient.packageLessons,
        cost: pkgClient.packageCost || 0, purchasedAt: pkgClient.packagePurchasedAt || '',
      });
    }
    const newPkg = {
      id: Date.now().toString(),
      lessons: Number(pkgForm.packageLessons),
      cost: Number(pkgForm.packageCost) || 0,
      purchasedAt: pkgForm.packagePurchasedAt,
    };
    const updatedPackages = [...existingPackages, newPkg];
    await updateClient(pkgClient.id, {
      packages: updatedPackages,
      packageLessons: newPkg.lessons,
      packageCost: newPkg.cost,
      packagePurchasedAt: newPkg.purchasedAt,
    });
    const queue = getPackageQueue({ ...pkgClient, packages: updatedPackages }, appointments);
    const active = queue ? queue.packages.filter(p => !p.exhausted).length : 1;
    showToast(`Pacchetto aggiunto! ${active > 1 ? `${active} pacchetti in coda` : 'Attivo'}`);
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
          <h2>Clienti</h2>
          <p>{clients.length} clienti totali</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nuovo Cliente</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
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
          <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
          <h3>Nessun cliente</h3>
          <p>Aggiungi il tuo primo cliente per iniziare</p>
          <button className="btn btn-primary" onClick={openAdd}>+ Aggiungi Cliente</button>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(client => {
            const queue = getPackageQueue(client, appointments);
            const isExpiring = queue && queue.isExpiring;
            return (
              <div key={client.id} className="client-card"
                onClick={() => setShowDetail(client)}
                style={{ borderColor: isExpiring ? 'rgba(240,168,50,0.4)' : undefined }}>
                {isExpiring && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'rgba(240,168,50,0.08)', border: '1px solid rgba(240,168,50,0.3)',
                    borderRadius: 5, padding: '2px 8px', fontSize: 10, color: 'var(--yellow)', fontWeight: 700,
                  }}>
                    {queue.totalRemaining === 0 ? 'Esaurito' : `${queue.totalRemaining} rimaste`}
                  </div>
                )}
                <div className="client-avatar" style={client.type === 'corso' ? {
                  background: 'rgba(45,201,160,0.08)', color: 'var(--teal)', border: '1px solid rgba(45,201,160,0.15)',
                } : {}}>
                  {(client.nome?.[0] || '?').toUpperCase()}
                </div>
                <h4>{client.nome} {client.cognome}</h4>
                <div className="client-type">{client.type === 'corso' ? 'Corso di gruppo' : 'Individuale'}</div>
                {client.type === 'individuale' && queue && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
                      <span>Lezioni</span>
                      <span>{queue.totalRemaining}/{queue.totalLessons}</span>
                    </div>
                    <ProgressBar remaining={queue.totalRemaining} total={queue.totalLessons} />
                    {queue.packages.filter(p => !p.exhausted).length > 1 && (
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 5 }}>
                        {queue.packages.filter(p => !p.exhausted).length} pacchetti in coda
                      </div>
                    )}
                    {queue.activePackage?.cost > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                        Pacchetto attivo: <strong style={{ color: 'var(--green)' }}>€{queue.activePackage.cost}</strong>
                      </div>
                    )}
                  </>
                )}
                {client.type === 'corso' && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {client.partecipanti} partecipanti
                    {client.monthlyFee > 0 && <> · <strong style={{ color: 'var(--green)' }}>€{client.monthlyFee}/mese</strong></>}
                  </div>
                )}
                {client.telefono && (
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>📞 {client.telefono}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (() => {
        const c = clients.find(x => x.id === showDetail.id) || showDetail;
        const queue = getPackageQueue(c, appointments);
        const aptList = appointments.filter(a => a.clientId === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        return (
          <div className="modal-overlay" onClick={() => { setShowDetail(null); setConfirmDelete(null); }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
              <div className="modal-header">
                <h3 style={{ fontSize: 20 }}>{c.nome} {c.cognome}</h3>
                <button className="modal-close" onClick={() => { setShowDetail(null); setConfirmDelete(null); }}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {c.telefono && (
                  <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Telefono</div>
                    <div style={{ fontSize: 14 }}>{c.telefono}</div>
                  </div>
                )}
                {c.email && (
                  <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</div>
                    <div style={{ fontSize: 14 }}>{c.email}</div>
                  </div>
                )}
              </div>
              {c.type === 'individuale' && queue && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                    Pacchetti lezioni
                  </div>
                  <PackageQueueView
                    queue={queue}
                    onAddPackage={() => { openAddPackage(c); setShowDetail(null); }}
                    onRemovePackage={(pkgId) => handleRemoveQueuedPackage(c, pkgId)}
                  />
                </>
              )}
              {c.type === 'corso' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Partecipanti</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue)' }}>{c.partecipanti}</div>
                  </div>
                  <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Costo mensile</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>€{c.monthlyFee}</div>
                  </div>
                </div>
              )}
              {aptList.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                    Ultime lezioni ({aptList.length} totali)
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                    {aptList.slice(0, 8).map(apt => (
                      <div key={apt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span>{format(new Date(apt.date), "EEE d MMM yyyy 'alle' HH:mm", { locale: it })}</span>
                        {apt.note && <span style={{ color: 'var(--text-muted)' }}>{apt.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { openEdit(c); setShowDetail(null); }}>Modifica</button>
                <button className="btn btn-danger" onClick={() => setConfirmDelete(c.id)}>Elimina</button>
              </div>
              {confirmDelete === c.id && (
                <div className="alert alert-danger" style={{ marginTop: 12 }}>
                  Confermi eliminazione di <strong>{c.nome}</strong>?
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
              <h3 style={{ fontSize: 20 }}>{editClient ? 'Modifica cliente' : 'Nuovo cliente'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Nome *</label>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Mario" />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Cognome *</label>
                <input value={form.cognome} onChange={e => setForm({ ...form, cognome: e.target.value })} placeholder="Rossi" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Telefono</label>
                <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="+39 333 1234567" />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Email</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="mario@email.com" type="email" />
              </div>
            </div>
            <div className="input-group">
              <label>Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="individuale">Individuale</option>
                <option value="corso">Corso di gruppo</option>
              </select>
            </div>
            {form.type === 'individuale' && !editClient && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, marginTop: 4 }}>
                  Primo pacchetto
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Lezioni</label>
                    <input type="number" value={form.packageLessons} onChange={e => setForm({ ...form, packageLessons: e.target.value })} placeholder="10" min="1" />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Costo (€)</label>
                    <input type="number" value={form.packageCost} onChange={e => setForm({ ...form, packageCost: e.target.value })} placeholder="300" />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Data acquisto</label>
                    <input type="date" value={form.packagePurchasedAt} onChange={e => setForm({ ...form, packagePurchasedAt: e.target.value })} />
                  </div>
                </div>
              </>
            )}
            {form.type === 'corso' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Partecipanti</label>
                  <input type="number" value={form.partecipanti} onChange={e => setForm({ ...form, partecipanti: e.target.value })} placeholder="8" min="1" />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Costo mensile (€)</label>
                  <input type="number" value={form.monthlyFee} onChange={e => setForm({ ...form, monthlyFee: e.target.value })} placeholder="80" />
                </div>
              </div>
            )}
            <div className="input-group">
              <label>Note</label>
              <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Note aggiuntive..." rows={2} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSave}>{editClient ? 'Salva modifiche' : 'Aggiungi Cliente'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Package Modal */}
      {showPkgModal && pkgClient && (() => {
        const queue = getPackageQueue(pkgClient, appointments);
        const activeCount = queue ? queue.packages.filter(p => !p.exhausted).length : 0;
        return (
          <div className="modal-overlay" onClick={() => setShowPkgModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="modal-header">
                <h3 style={{ fontSize: 20 }}>Aggiungi pacchetto</h3>
                <button className="modal-close" onClick={() => setShowPkgModal(false)}>✕</button>
              </div>
              <div className="alert alert-warning" style={{ marginBottom: 20 }}>
                {activeCount === 0
                  ? `Primo pacchetto per ${pkgClient.nome} ${pkgClient.cognome}`
                  : `${pkgClient.nome} ha ancora ${queue.totalRemaining} lezioni — il nuovo pacchetto verrà messo in coda e si attiverà automaticamente`
                }
              </div>
              {queue && activeCount > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Coda attuale</div>
                  {queue.packages.filter(p => !p.exhausted).map((pkg, i) => (
                    <div key={pkg.id} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                      {i + 1}° · {pkg.lessons} lezioni · {pkg.remaining} rimaste{pkg.cost > 0 && ` · €${pkg.cost}`}
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 6 }}>
                    + Nuovo (verrà aggiunto in fondo alla coda)
                  </div>
                </div>
              )}
              <div className="input-group">
                <label>Numero lezioni *</label>
                <input type="number" value={pkgForm.packageLessons} onChange={e => setPkgForm({ ...pkgForm, packageLessons: e.target.value })} placeholder="10" min="1" />
              </div>
              <div className="input-group">
                <label>Costo (€)</label>
                <input type="number" value={pkgForm.packageCost} onChange={e => setPkgForm({ ...pkgForm, packageCost: e.target.value })} placeholder="300" />
              </div>
              <div className="input-group">
                <label>Data acquisto</label>
                <input type="date" value={pkgForm.packagePurchasedAt} onChange={e => setPkgForm({ ...pkgForm, packagePurchasedAt: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowPkgModal(false)}>Annulla</button>
                <button className="btn btn-primary" onClick={handleAddPackage}>
                  ✓ {activeCount > 0 ? 'Aggiungi in coda' : 'Aggiungi pacchetto'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
