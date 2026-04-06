// src/pages/Template.js
import React, { useState, useMemo } from 'react';
import { useTemplate } from '../hooks/useTemplate';
import { useSchede } from '../hooks/useSchede';
import { useClients } from '../hooks/useClients';
import { ESERCIZI_DEFAULT, CATEGORIE, CATEGORIE_SCHEDE } from '../data/esercizi';

const GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const TODAY = new Date().toISOString().split('T')[0];

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`toast ${type}`}>{msg}</div>;
}

// Componente immagine esercizio con fallback
function ExImg({ src, size = 36 }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{ width: size, height: size, borderRadius: 7, overflow: 'hidden', background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {src && !err
        ? <img src={src} alt="" onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.45 }}>💪</span>}
    </div>
  );
}

// Modal selezione esercizio (stessa logica di Schede.js ma standalone)
function PickerModal({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ nome: '', categoria: 'Petto', descrizione: '' });

  const filtered = ESERCIZI_DEFAULT.filter(e =>
    (!cat || e.categoria === cat) &&
    e.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, maxHeight: '85vh' }}>
        <div className="modal-header">
          <h3>Scegli esercizio</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input placeholder="Cerca..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
          <select value={cat} onChange={e => setCat(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Tutte le categorie</option>
            {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, maxHeight: 360, overflowY: 'auto', marginBottom: 14 }}>
          {filtered.map(e => (
            <div key={e.id} onClick={() => onSelect(e)} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: 'var(--surface)', transition: 'all 0.15s' }}
              onMouseEnter={ev => ev.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={ev => ev.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ height: 80, overflow: 'hidden', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ExImg src={e.foto} size={80} />
              </div>
              <div style={{ padding: '7px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{e.nome}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--surface2)', borderRadius: 4, padding: '1px 5px', display: 'inline-block', marginTop: 2 }}>{e.categoria}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCustom(s => !s)}>+ Esercizio personalizzato</button>
          {showCustom && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div className="input-group" style={{ flex: 2, marginBottom: 0 }}><label>Nome *</label><input value={custom.nome} onChange={e => setCustom({ ...custom, nome: e.target.value })} placeholder="Es. Curl con elastico" /></div>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><label>Categoria</label><select value={custom.categoria} onChange={e => setCustom({ ...custom, categoria: e.target.value })}>{CATEGORIE.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}><label>Descrizione</label><textarea rows={2} value={custom.descrizione} onChange={e => setCustom({ ...custom, descrizione: e.target.value })} placeholder="Descrivi l'esercizio..." /></div>
              <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { if (custom.nome) onSelect({ id: 'custom_' + Date.now(), ...custom, foto: '' }); }}>Aggiungi →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Builder giorni per il template
function GiorniBuilder({ giorni, onChange }) {
  const [giornoAttivo, setGiornoAttivo] = useState(null);
  const [picker, setPicker] = useState(null); // idx esercizio

  const toggleGiorno = (g) => {
    const curr = { ...giorni };
    if (curr[g] !== undefined) { delete curr[g]; if (giornoAttivo === g) setGiornoAttivo(null); }
    else { curr[g] = []; setGiornoAttivo(g); }
    onChange(curr);
  };

  const addEs = () => {
    if (!giornoAttivo) return;
    const curr = { ...giorni, [giornoAttivo]: [...(giorni[giornoAttivo] || []), { id: Date.now().toString(), esercizioId: '', nome: '', serie: '3', ripetizioni: '12', carico: '', recupero: '60s', note: '' }] };
    onChange(curr);
  };

  const updateEs = (idx, data) => {
    const list = [...(giorni[giornoAttivo] || [])];
    list[idx] = data;
    onChange({ ...giorni, [giornoAttivo]: list });
  };

  const delEs = (idx) => {
    const list = [...(giorni[giornoAttivo] || [])];
    list.splice(idx, 1);
    onChange({ ...giorni, [giornoAttivo]: list });
  };

  const lista = giornoAttivo ? (giorni[giornoAttivo] || []) : [];

  return (
    <div>
      {/* Selezione giorni */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Giorni allenamento</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GIORNI.map(g => {
            const on = giorni[g] !== undefined;
            const count = (giorni[g] || []).length;
            return (
              <button key={g} onClick={() => { toggleGiorno(g); if (!on) setGiornoAttivo(g); else if (giornoAttivo === g) setGiornoAttivo(null); }}
                style={{ padding: '6px 12px', borderRadius: 6, border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-light)' : 'var(--surface2)', color: on ? 'var(--accent)' : 'var(--text-3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {g.slice(0, 3)}{on && count > 0 ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab giorni abilitati */}
      {Object.keys(giorni).length > 0 && (
        <div>
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 14, overflowX: 'auto' }}>
            {GIORNI.filter(g => giorni[g] !== undefined).map(g => (
              <button key={g} onClick={() => setGiornoAttivo(g)}
                style={{ padding: '7px 14px', border: 'none', borderBottom: `2px solid ${giornoAttivo === g ? 'var(--accent)' : 'transparent'}`, background: 'none', color: giornoAttivo === g ? 'var(--accent)' : 'var(--text-3)', fontWeight: giornoAttivo === g ? 700 : 500, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {g}
              </button>
            ))}
          </div>

          {giornoAttivo && (
            <div>
              {lista.map((item, idx) => (
                <div key={item.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <ExImg src={ESERCIZI_DEFAULT.find(e => e.id === item.esercizioId)?.foto} size={44} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <button onClick={() => setPicker(idx)} style={{ flex: 1, textAlign: 'left', background: item.nome ? 'var(--surface2)' : 'var(--accent-light)', border: `1px solid ${item.nome ? 'var(--border)' : '#bfdbfe'}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontWeight: item.nome ? 600 : 400, color: item.nome ? 'var(--text)' : 'var(--accent)' }}>
                          {item.nome || 'Seleziona esercizio...'}
                        </button>
                        <button onClick={() => delEs(idx)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: '4px 6px' }}>✕</button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[{ k: 'serie', l: 'Serie', p: '3', w: 65 }, { k: 'ripetizioni', l: 'Rip.', p: '12', w: 80 }, { k: 'carico', l: 'Carico', p: 'kg', w: 90 }, { k: 'recupero', l: 'Recupero', p: '60s', w: 90 }].map(f => (
                          <div key={f.k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.l}</label>
                            <input value={item[f.k] || ''} onChange={e => updateEs(idx, { ...item, [f.k]: e.target.value })} placeholder={f.p} style={{ width: f.w, fontSize: 12, padding: '5px 8px' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={addEs}>+ Aggiungi esercizio</button>
            </div>
          )}
        </div>
      )}

      {picker !== null && (
        <PickerModal onSelect={e => { updateEs(picker, { ...(lista[picker] || {}), esercizioId: e.id, nome: e.nome }); setPicker(null); }} onClose={() => setPicker(null)} />
      )}
    </div>
  );
}

export default function Template() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplate();
  const { addScheda } = useSchede();
  const { clients } = useClients();
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editTpl, setEditTpl] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [showAssign, setShowAssign] = useState(null);
  const [filterCat, setFilterCat] = useState('');
  const [newCatModal, setNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [customCats, setCustomCats] = useState([]);
  const [form, setForm] = useState({ nome: '', categoria: 'massa', livello: 'Intermedio', descrizione: '', giorni: {} });
  const [assignForm, setAssignForm] = useState({ clienteId: '', dataInizio: TODAY, dataFine: '', note: '' });

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const allCats = [...CATEGORIE_SCHEDE, ...customCats.map(c => ({ id: c.id, nome: c.nome, emoji: '✨', descrizione: 'Categoria personalizzata' }))];

  const filtered = useMemo(() =>
    templates.filter(t => !filterCat || t.categoria === filterCat),
    [templates, filterCat]
  );

  const clientiIndividuali = clients.filter(c => c.type === 'individuale');

  const openAdd = () => {
    setEditTpl(null);
    setForm({ nome: '', categoria: 'massa', livello: 'Intermedio', descrizione: '', giorni: {} });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditTpl(t);
    setForm({ nome: t.nome, categoria: t.categoria, livello: t.livello || 'Intermedio', descrizione: t.descrizione || '', giorni: t.giorni || {} });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome) return showToast('Nome obbligatorio', 'error');
    if (editTpl) {
      await updateTemplate(editTpl.id, form);
      showToast('Template aggiornato!');
    } else {
      await addTemplate(form);
      showToast('Template salvato!');
    }
    setShowModal(false);
  };

  const handleAssign = async () => {
    if (!assignForm.clienteId) return showToast('Seleziona un cliente', 'error');
    const tpl = showAssign;
    await addScheda({
      nome: tpl.nome,
      clienteId: assignForm.clienteId,
      categoria: tpl.categoria,
      livello: tpl.livello,
      giorni: tpl.giorni,
      dataInizio: assignForm.dataInizio,
      dataFine: assignForm.dataFine,
      note: assignForm.note || `Da template: ${tpl.nome}`,
      fromTemplate: tpl.id,
    });
    showToast(`Scheda assegnata a ${clients.find(c => c.id === assignForm.clienteId)?.nome}!`);
    setShowAssign(null);
    setAssignForm({ clienteId: '', dataInizio: TODAY, dataFine: '', note: '' });
  };

  const handleAddCat = () => {
    if (!newCatName.trim()) return;
    const id = 'custom_' + Date.now();
    setCustomCats(prev => [...prev, { id, nome: newCatName.trim() }]);
    setNewCatModal(false);
    setNewCatName('');
    showToast('Categoria creata!');
  };

  const getCatInfo = (id) => allCats.find(c => c.id === id) || { nome: id, emoji: '📋' };

  const LIVELLI = ['Principiante', 'Intermedio', 'Avanzato'];

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Template Schede</h2>
          <p>{templates.length} template salvati — riutilizzabili per qualsiasi cliente</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setNewCatModal(true)}>+ Categoria</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Nuovo template</button>
        </div>
      </div>

      {/* Filtri categoria */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className={`btn btn-sm ${filterCat === '' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterCat('')}>Tutti</button>
        {allCats.map(cat => {
          const count = templates.filter(t => t.categoria === cat.id).length;
          if (count === 0 && filterCat !== cat.id) return null;
          return (
            <button key={cat.id} className={`btn btn-sm ${filterCat === cat.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterCat(cat.id)}>
              {cat.emoji} {cat.nome} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <h3>Nessun template</h3>
          <p>Crea un template riutilizzabile da assegnare rapidamente ai clienti</p>
          <button className="btn btn-primary" onClick={openAdd}>+ Crea primo template</button>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(t => {
            const cat = getCatInfo(t.categoria);
            const giorniAttivi = Object.keys(t.giorni || {});
            const totEs = giorniAttivi.reduce((s, g) => s + (t.giorni[g]?.length || 0), 0);
            return (
              <div key={t.id} className="client-card" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {cat.emoji}
                  </div>
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>{t.livello || 'Intermedio'}</span>
                </div>
                <h4 style={{ marginBottom: 4 }}>{t.nome}</h4>
                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{cat.emoji} {cat.nome}</div>
                {t.descrizione && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, lineHeight: 1.4 }}>{t.descrizione}</div>}
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>
                  <span>📅 {giorniAttivi.length} giorni</span>
                  <span>💪 {totEs} esercizi</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {giorniAttivi.slice(0, 4).map(g => (
                    <span key={g} style={{ fontSize: 10, background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid #bfdbfe', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>{g.slice(0, 3)}</span>
                  ))}
                  {giorniAttivi.length > 4 && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>+{giorniAttivi.length - 4}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowAssign(t); setAssignForm({ clienteId: '', dataInizio: TODAY, dataFine: '', note: '' }); }}>
                    ↗ Assegna
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowDetail(t)}>Vedi</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={async () => { await deleteTemplate(t.id); showToast('Template eliminato', 'warning'); }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h3>{showDetail.nome}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                  {getCatInfo(showDetail.categoria).emoji} {getCatInfo(showDetail.categoria).nome} · {showDetail.livello}
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowDetail(null)}>✕</button>
            </div>
            {showDetail.descrizione && <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.5 }}>{showDetail.descrizione}</p>}
            {GIORNI.filter(g => showDetail.giorni?.[g]).map(g => (
              <div key={g} style={{ marginBottom: 14, background: 'var(--bg)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--text)' }}>{g}</div>
                {(showDetail.giorni[g] || []).map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <ExImg src={ESERCIZI_DEFAULT.find(ex => ex.id === e.esercizioId)?.foto} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{e.nome || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {[e.serie && `${e.serie} serie`, e.ripetizioni && `${e.ripetizioni} rip`, e.carico && `${e.carico} kg`, e.recupero && `rec. ${e.recupero}`].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { openEdit(showDetail); setShowDetail(null); }}>Modifica</button>
              <button className="btn btn-primary" onClick={() => { setShowAssign(showDetail); setShowDetail(null); }}>↗ Assegna a cliente</button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {showAssign && (
        <div className="modal-overlay" onClick={() => setShowAssign(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Assegna a cliente</h3>
              <button className="modal-close" onClick={() => setShowAssign(null)}>✕</button>
            </div>
            <div style={{ background: 'var(--accent-light)', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, marginBottom: 18, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
              📋 {showAssign.nome} — {getCatInfo(showAssign.categoria).emoji} {getCatInfo(showAssign.categoria).nome}
            </div>
            <div className="input-group">
              <label>Cliente *</label>
              <select value={assignForm.clienteId} onChange={e => setAssignForm({ ...assignForm, clienteId: e.target.value })}>
                <option value="">— Seleziona cliente —</option>
                {clientiIndividuali.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="input-group" style={{ flex: 1 }}><label>Data inizio</label><input type="date" value={assignForm.dataInizio} onChange={e => setAssignForm({ ...assignForm, dataInizio: e.target.value })} /></div>
              <div className="input-group" style={{ flex: 1 }}><label>Data scadenza</label><input type="date" value={assignForm.dataFine} onChange={e => setAssignForm({ ...assignForm, dataFine: e.target.value })} /></div>
            </div>
            <div className="input-group"><label>Note aggiuntive</label><input value={assignForm.note} onChange={e => setAssignForm({ ...assignForm, note: e.target.value })} placeholder="Note per questo cliente..." /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAssign(null)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleAssign}>✓ Assegna scheda</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '92vh' }}>
            <div className="modal-header">
              <h3>{editTpl ? 'Modifica template' : 'Nuovo template'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="input-group" style={{ flex: 3 }}><label>Nome template *</label><input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Es. Scheda Massa 3 giorni" /></div>
              <div className="input-group" style={{ flex: 2 }}>
                <label>Categoria</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                  {allCats.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Livello</label>
                <select value={form.livello} onChange={e => setForm({ ...form, livello: e.target.value })}>
                  {LIVELLI.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="input-group"><label>Descrizione</label><textarea rows={2} value={form.descrizione} onChange={e => setForm({ ...form, descrizione: e.target.value })} placeholder="Descrivi brevemente questa scheda, obiettivi, intensità..." /></div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <GiorniBuilder giorni={form.giorni} onChange={giorni => setForm({ ...form, giorni })} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSave}>{editTpl ? 'Salva modifiche' : 'Salva template'}</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CATEGORY MODAL */}
      {newCatModal && (
        <div className="modal-overlay" onClick={() => setNewCatModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3>Nuova categoria</h3>
              <button className="modal-close" onClick={() => setNewCatModal(false)}>✕</button>
            </div>
            <div className="input-group"><label>Nome categoria *</label><input autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCat()} placeholder="Es. Yoga, Pilates, Funzionale..." /></div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>Le categorie di default sono: {CATEGORIE_SCHEDE.slice(0, 5).map(c => c.nome).join(', ')}...</div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setNewCatModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleAddCat}>Crea categoria</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
