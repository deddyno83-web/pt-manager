// src/pages/Schede.js
import React, { useState, useMemo } from 'react';
import { useSchede } from '../hooks/useSchede';
import { useClients } from '../hooks/useClients';
import { ESERCIZI_DEFAULT, CATEGORIE } from '../data/esercizi';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { it } from 'date-fns/locale';

const GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const TODAY = new Date().toISOString().split('T')[0];

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`toast ${type}`}>{msg}</div>;
}

function EsercizioCard({ esercizio, onSelect, selected }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div onClick={() => onSelect(esercizio)} style={{
      border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
      background: selected ? 'var(--accent-light)' : 'var(--surface)',
      transition: 'all 0.15s',
    }}>
      <div style={{ height: 90, overflow: 'hidden', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!imgError ? (
          <img src={esercizio.foto} alt={esercizio.nome} onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ fontSize: 28 }}>💪</div>
        )}
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: selected ? 'var(--accent)' : 'var(--text)', marginBottom: 2 }}>{esercizio.nome}</div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--surface2)', borderRadius: 4, padding: '1px 6px', display: 'inline-block' }}>{esercizio.categoria}</div>
      </div>
    </div>
  );
}

// Modal selezione esercizio
function ModalEsercizio({ onSelect, onClose, esercizi }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState({ nome: '', categoria: 'Petto', descrizione: '' });

  const filtered = esercizi.filter(e =>
    (!cat || e.categoria === cat) &&
    e.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleCustom = () => {
    if (!custom.nome) return;
    onSelect({ id: 'custom_' + Date.now(), ...custom, foto: '' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, maxHeight: '85vh' }}>
        <div className="modal-header">
          <h3>Scegli esercizio</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <input placeholder="Cerca esercizio..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
          <select value={cat} onChange={e => setCat(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Tutte le categorie</option>
            {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxHeight: 380, overflowY: 'auto', marginBottom: 14 }}>
          {filtered.map(e => (
            <EsercizioCard key={e.id} esercizio={e} onSelect={onSelect} selected={false} />
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCustom(s => !s)} style={{ marginBottom: showCustom ? 12 : 0 }}>
            + Crea esercizio personalizzato
          </button>
          {showCustom && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
                  <label>Nome esercizio *</label>
                  <input value={custom.nome} onChange={e => setCustom({ ...custom, nome: e.target.value })} placeholder="Es. Curl con elastico" />
                </div>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Categoria</label>
                  <select value={custom.categoria} onChange={e => setCustom({ ...custom, categoria: e.target.value })}>
                    {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Descrizione / Note</label>
                <textarea rows={2} value={custom.descrizione} onChange={e => setCustom({ ...custom, descrizione: e.target.value })} placeholder="Descrivi l'esercizio..." />
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleCustom} style={{ alignSelf: 'flex-start' }}>
                Aggiungi esercizio personalizzato →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Builder di una singola serie/esercizio nella scheda
function EsercizioRow({ item, onChange, onDelete, esercizi, onOpenPicker }) {
  const [showDesc, setShowDesc] = useState(false);
  const eInfo = esercizi.find(e => e.id === item.esercizioId);
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Foto */}
        <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={onOpenPicker}>
          {eInfo?.foto && !imgError ? (
            <img src={eInfo.foto} alt="" onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : <span style={{ fontSize: 20 }}>💪</span>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button onClick={onOpenPicker} style={{ flex: 1, textAlign: 'left', background: item.nome ? 'var(--surface2)' : 'var(--accent-light)', border: `1px solid ${item.nome ? 'var(--border)' : '#bfdbfe'}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontWeight: item.nome ? 600 : 400, color: item.nome ? 'var(--text)' : 'var(--accent)' }}>
              {item.nome || 'Seleziona esercizio...'}
            </button>
            <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4, borderRadius: 6, fontSize: 14 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { key: 'serie', label: 'Serie', placeholder: '3', type: 'number', width: 70 },
              { key: 'ripetizioni', label: 'Rip.', placeholder: '12', type: 'text', width: 80 },
              { key: 'carico', label: 'Carico (kg)', placeholder: 'es. 20', type: 'text', width: 100 },
              { key: 'recupero', label: 'Recupero', placeholder: '60s', type: 'text', width: 90 },
            ].map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</label>
                <input type={f.type} value={item[f.key] || ''} onChange={e => onChange({ ...item, [f.key]: e.target.value })}
                  placeholder={f.placeholder} style={{ width: f.width, fontSize: 13, padding: '5px 8px' }} />
              </div>
            ))}
          </div>
          {item.note !== undefined && (
            <div style={{ marginTop: 8 }}>
              <input value={item.note || ''} onChange={e => onChange({ ...item, note: e.target.value })} placeholder="Note esercizio..." style={{ fontSize: 12, padding: '4px 8px' }} />
            </div>
          )}
        </div>
      </div>
      {eInfo?.descrizione && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setShowDesc(s => !s)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, cursor: 'pointer', padding: 0 }}>
            {showDesc ? '▲ Nascondi' : '▼ Descrizione esercizio'}
          </button>
          {showDesc && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.5, background: 'var(--accent-light)', padding: '8px 10px', borderRadius: 6 }}>{eInfo.descrizione}</div>}
        </div>
      )}
    </div>
  );
}

// Form builder scheda
function SchedaBuilder({ scheda, onChange, clienteId, esercizi }) {
  const [pickerTarget, setPickerTarget] = useState(null); // { giorno, idx }
  const [giornoAttivo, setGiornoAttivo] = useState(0);

  const giorni = scheda.giorni || {};

  const addEsercizio = (giorno) => {
    const curr = giorni[giorno] || [];
    onChange({
      ...scheda,
      giorni: { ...giorni, [giorno]: [...curr, { id: Date.now().toString(), esercizioId: '', nome: '', serie: '', ripetizioni: '', carico: '', recupero: '', note: '' }] }
    });
  };

  const updateEsercizio = (giorno, idx, data) => {
    const curr = [...(giorni[giorno] || [])];
    curr[idx] = data;
    onChange({ ...scheda, giorni: { ...giorni, [giorno]: curr } });
  };

  const deleteEsercizio = (giorno, idx) => {
    const curr = [...(giorni[giorno] || [])];
    curr.splice(idx, 1);
    onChange({ ...scheda, giorni: { ...giorni, [giorno]: curr } });
  };

  const toggleGiorno = (giorno) => {
    const curr = { ...giorni };
    if (curr[giorno] !== undefined) { delete curr[giorno]; }
    else { curr[giorno] = []; }
    onChange({ ...scheda, giorni: curr });
  };

  const handleSelectEsercizio = (e) => {
    if (!pickerTarget) return;
    const { giorno, idx } = pickerTarget;
    updateEsercizio(giorno, idx, {
      ...((giorni[giorno] || [])[idx] || {}),
      esercizioId: e.id,
      nome: e.nome,
    });
    setPickerTarget(null);
  };

  const giornoSelezionato = GIORNI[giornoAttivo];
  const esercizi_giorno = giorni[giornoSelezionato] || [];
  const giornoAbilitato = giorni[giornoSelezionato] !== undefined;

  return (
    <div>
      {/* Selezione giorni */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Giorni di allenamento</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GIORNI.map((g, i) => {
            const abilitato = giorni[g] !== undefined;
            const count = (giorni[g] || []).length;
            return (
              <button key={g} onClick={() => { toggleGiorno(g); if (!abilitato) setGiornoAttivo(i); }}
                style={{ padding: '6px 12px', borderRadius: 6, border: `1.5px solid ${abilitato ? 'var(--accent)' : 'var(--border)'}`, background: abilitato ? 'var(--accent-light)' : 'var(--surface2)', color: abilitato ? 'var(--accent)' : 'var(--text-3)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s' }}>
                {g.slice(0, 3)}{abilitato && count > 0 ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab giorni abilitati */}
      {Object.keys(giorni).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 16, flexWrap: 'wrap' }}>
            {GIORNI.filter(g => giorni[g] !== undefined).map((g, i) => (
              <button key={g} onClick={() => setGiornoAttivo(GIORNI.indexOf(g))}
                style={{ padding: '8px 14px', border: 'none', borderBottom: `2px solid ${GIORNI[giornoAttivo] === g ? 'var(--accent)' : 'transparent'}`, background: 'none', color: GIORNI[giornoAttivo] === g ? 'var(--accent)' : 'var(--text-3)', fontWeight: GIORNI[giornoAttivo] === g ? 700 : 500, fontSize: 13, cursor: 'pointer' }}>
                {g}
              </button>
            ))}
          </div>

          {giornoAbilitato && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{giornoSelezionato}</div>
              {esercizi_giorno.map((item, idx) => (
                <EsercizioRow key={item.id} item={item} esercizi={esercizi}
                  onChange={data => updateEsercizio(giornoSelezionato, idx, data)}
                  onDelete={() => deleteEsercizio(giornoSelezionato, idx)}
                  onOpenPicker={() => setPickerTarget({ giorno: giornoSelezionato, idx })}
                />
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => addEsercizio(giornoSelezionato)}>
                + Aggiungi esercizio
              </button>
            </div>
          )}
        </div>
      )}

      {pickerTarget && (
        <ModalEsercizio esercizi={esercizi} onSelect={handleSelectEsercizio} onClose={() => setPickerTarget(null)} />
      )}
    </div>
  );
}

export default function Schede() {
  const { schede, addScheda, updateScheda, deleteScheda } = useSchede();
  const { clients } = useClients();
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editScheda, setEditScheda] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [filterCliente, setFilterCliente] = useState('');
  const [form, setForm] = useState({ nome: '', clienteId: '', dataInizio: TODAY, dataFine: '', giorni: {}, note: '' });
  const [esercizi, setEsercizi] = useState(ESERCIZI_DEFAULT);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const clientiIndividuali = clients.filter(c => c.type === 'individuale');

  const filtered = useMemo(() =>
    schede.filter(s => !filterCliente || s.clienteId === filterCliente),
    [schede, filterCliente]
  );

  const getStatus = (scheda) => {
    const today = new Date();
    if (!scheda.dataFine) return 'attiva';
    const fine = parseISO(scheda.dataFine);
    if (isBefore(fine, today)) return 'scaduta';
    if (isBefore(fine, addDays(today, 7))) return 'in_scadenza';
    return 'attiva';
  };

  const openAdd = () => {
    setEditScheda(null);
    setForm({ nome: '', clienteId: '', dataInizio: TODAY, dataFine: '', giorni: {}, note: '' });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditScheda(s);
    setForm({ nome: s.nome || '', clienteId: s.clienteId || '', dataInizio: s.dataInizio || TODAY, dataFine: s.dataFine || '', giorni: s.giorni || {}, note: s.note || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.clienteId) return showToast('Nome scheda e cliente obbligatori', 'error');
    if (editScheda) {
      await updateScheda(editScheda.id, form);
      showToast('Scheda aggiornata!');
    } else {
      await addScheda(form);
      showToast('Scheda creata!');
    }
    setShowModal(false);
  };

  const toggleAllenamentoFatto = async (scheda, giorno, idx) => {
    const giorni = { ...scheda.giorni };
    const esercizi_giorno = [...(giorni[giorno] || [])];
    esercizi_giorno[idx] = { ...esercizi_giorno[idx], fatto: !esercizi_giorno[idx].fatto };
    giorni[giorno] = esercizi_giorno;
    await updateScheda(scheda.id, { giorni });
  };

  const markGiornoFatto = async (scheda, giorno, fatto) => {
    const giorni = { ...scheda.giorni };
    giorni[giorno] = (giorni[giorno] || []).map(e => ({ ...e, fatto }));
    await updateScheda(scheda.id, { giorni });
  };

  const statusBadge = (s) => {
    const st = getStatus(s);
    if (st === 'scaduta') return <span className="badge badge-red">Scaduta</span>;
    if (st === 'in_scadenza') return <span className="badge badge-yellow">Scade presto</span>;
    return <span className="badge badge-green">Attiva</span>;
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h2>Schede Allenamento</h2><p>{schede.length} schede totali</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Nuova scheda</button>
      </div>

      {/* Filtro cliente */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
        <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)} style={{ maxWidth: 260 }}>
          <option value="">Tutti i clienti</option>
          {clientiIndividuali.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <h3>Nessuna scheda</h3>
          <p>Crea la prima scheda di allenamento per un cliente</p>
          <button className="btn btn-primary" onClick={openAdd}>+ Crea scheda</button>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(s => {
            const cliente = clients.find(c => c.id === s.clienteId);
            const giorniAttivi = Object.keys(s.giorni || {});
            const totEsercizi = giorniAttivi.reduce((sum, g) => sum + (s.giorni[g]?.length || 0), 0);
            const totFatti = giorniAttivi.reduce((sum, g) => sum + (s.giorni[g]?.filter(e => e.fatto)?.length || 0), 0);
            const st = getStatus(s);
            return (
              <div key={s.id} className="client-card" onClick={() => setShowDetail(s)} style={st === 'scaduta' ? { borderColor: 'var(--red-border)' } : st === 'in_scadenza' ? { borderColor: 'var(--amber-border)' } : {}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
                  {statusBadge(s)}
                </div>
                <h4 style={{ marginBottom: 2 }}>{s.nome}</h4>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>{cliente ? `${cliente.nome} ${cliente.cognome}` : '—'}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
                  <span>📅 {giorniAttivi.length} giorni</span>
                  <span>💪 {totEsercizi} esercizi</span>
                </div>
                {totEsercizi > 0 && (
                  <div>
                    <div className="progress-bar">
                      <div className="progress-fill green" style={{ width: `${(totFatti / totEsercizi) * 100}%` }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{totFatti}/{totEsercizi} esercizi completati</div>
                  </div>
                )}
                {s.dataFine && (
                  <div style={{ fontSize: 11, color: st === 'scaduta' ? 'var(--red)' : st === 'in_scadenza' ? 'var(--amber)' : 'var(--text-3)', marginTop: 8 }}>
                    Scade: {format(parseISO(s.dataFine), 'd MMM yyyy', { locale: it })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && (() => {
        const s = showDetail;
        const cliente = clients.find(c => c.id === s.clienteId);
        const giorni = s.giorni || {};
        return (
          <div className="modal-overlay" onClick={() => setShowDetail(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
              <div className="modal-header">
                <div>
                  <h3>{s.nome}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{cliente ? `${cliente.nome} ${cliente.cognome}` : '—'} · {statusBadge(s)}</div>
                </div>
                <button className="modal-close" onClick={() => setShowDetail(null)}>✕</button>
              </div>

              {/* Info scheda */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                {s.dataInizio && <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}><div style={{ color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', marginBottom: 2 }}>Inizio</div>{format(parseISO(s.dataInizio), 'd MMM yyyy', { locale: it })}</div>}
                {s.dataFine && <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}><div style={{ color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', marginBottom: 2 }}>Scadenza</div>{format(parseISO(s.dataFine), 'd MMM yyyy', { locale: it })}</div>}
              </div>

              {/* Giorni allenamento */}
              {GIORNI.filter(g => giorni[g] !== undefined).map(giorno => {
                const lista = giorni[giorno] || [];
                const tuttiFatti = lista.length > 0 && lista.every(e => e.fatto);
                return (
                  <div key={giorno} style={{ marginBottom: 16, background: 'var(--bg)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{giorno}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{lista.filter(e => e.fatto).length}/{lista.length} fatti</span>
                        <button className={`btn btn-sm ${tuttiFatti ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => markGiornoFatto(s, giorno, !tuttiFatti)}>
                          {tuttiFatti ? '↩ Riapri' : '✓ Segna tutto fatto'}
                        </button>
                      </div>
                    </div>
                    {lista.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>Nessun esercizio impostato</div>
                    ) : (
                      lista.map((item, idx) => {
                        const eInfo = esercizi.find(e => e.id === item.esercizioId);
                        const [imgErr, setImgErr] = useState(false);
                        return (
                          <div key={item.id || idx} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', borderRadius: 7, background: item.fatto ? 'var(--green-light)' : 'var(--surface)', border: `1px solid ${item.fatto ? 'var(--green-border)' : 'var(--border)'}`, marginBottom: 6, opacity: item.fatto ? 0.8 : 1 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 7, overflow: 'hidden', background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {eInfo?.foto && !imgErr
                                ? <img src={eInfo.foto} alt="" onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: 16 }}>💪</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: item.fatto ? 'var(--green)' : 'var(--text)', textDecoration: item.fatto ? 'line-through' : 'none' }}>{item.nome || 'Esercizio'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                                {[item.serie && `${item.serie} serie`, item.ripetizioni && `${item.ripetizioni} rip`, item.carico && `${item.carico} kg`, item.recupero && `rec. ${item.recupero}`].filter(Boolean).join(' · ')}
                              </div>
                            </div>
                            <button onClick={() => toggleAllenamentoFatto(s, giorno, idx)} style={{ background: item.fatto ? 'var(--green)' : 'var(--surface2)', border: `1px solid ${item.fatto ? 'var(--green)' : 'var(--border)'}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: item.fatto ? '#fff' : 'var(--text-3)', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                              {item.fatto ? '✓ Fatto' : 'Segna'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}

              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => { openEdit(s); setShowDetail(null); }}>Modifica scheda</button>
                <button className="btn btn-danger" onClick={async () => { await deleteScheda(s.id); setShowDetail(null); showToast('Scheda eliminata', 'warning'); }}>Elimina</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '92vh' }}>
            <div className="modal-header">
              <h3>{editScheda ? 'Modifica scheda' : 'Nuova scheda allenamento'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Info base */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
              <div className="input-group" style={{ flex: 2 }}><label>Nome scheda *</label><input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Es. Scheda Massa Upper/Lower" /></div>
              <div className="input-group" style={{ flex: 2 }}>
                <label>Cliente *</label>
                <select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })}>
                  <option value="">— Seleziona cliente —</option>
                  {clientiIndividuali.map(c => <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div className="input-group" style={{ flex: 1 }}><label>Data inizio</label><input type="date" value={form.dataInizio} onChange={e => setForm({ ...form, dataInizio: e.target.value })} /></div>
              <div className="input-group" style={{ flex: 1 }}><label>Data scadenza</label><input type="date" value={form.dataFine} onChange={e => setForm({ ...form, dataFine: e.target.value })} /></div>
              <div className="input-group" style={{ flex: 2 }}><label>Note</label><input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Note generali sulla scheda..." /></div>
            </div>

            {/* Builder giorni */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <SchedaBuilder scheda={form} onChange={setForm} esercizi={esercizi} clienteId={form.clienteId} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSave}>{editScheda ? 'Salva modifiche' : 'Crea scheda'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
