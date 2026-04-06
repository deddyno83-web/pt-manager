// src/pages/Clienti.js
import React, { useState, useMemo } from 'react';
import { useClients } from '../hooks/useClients';
import { useAppointments } from '../hooks/useAppointments';
import { getPackageQueue } from '../utils/packageUtils';
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

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

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
    } else {
      const firstPkg = form.type === 'individuale' && form.packageLessons ? [{ id: Date.now().toString(), lessons: Number(form.packageLessons), cost: Number(form.packageCost) || 0, purchasedAt: form.packagePurchasedAt }] : [];
      await addClient({ nome: form.nome, cognome: form.cognome, telefono: form.telefono, email: form.email, type: form.type, packages: firstPkg, partecipanti: Number(form.partecipanti) || 0, monthlyFee: Number(form.monthlyFee) || 0, note: form.note });
      showToast('Cliente aggiunto!');
    }
    setShowModal(false);
  };

  const handleAddPackage = async () => {
    if (!pkgForm.packageLessons) return showToast('Inserisci il numero di lezioni', 'error');
    const newPkg = { id: Date.now().toString(), lessons: Number(pkgForm.packageLessons), cost: Number(pkgForm.packageCost) || 0, purchasedAt: pkgForm.packagePurchasedAt };
    const existing = pkgClient.packages || [];
    if (existing.length === 0 && pkgClient.packageLessons > 0) {
      existing.push({ id: 'legacy', lessons: pkgClient.packageLessons || 0, cost: pkgClient.packageCost || 0, purchasedAt: pkgClient.packagePurchasedAt || '' });
    }
    await updateClient(pkgClient.id, { packages: [...existing, newPkg] });
    showToast(`Pacchetto di ${newPkg.lessons} lezioni aggiunto in coda!`);
    setShowPkgModal(false); setPkgClient(null);
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

  const generatePDF = (client) => {
    const q = getPackageQueue(client, appointments);
    const schedeCliente = schede.filter(s => s.clienteId === client.id);
    const aptList = appointments.filter(a => a.clientId === client.id).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Use window.jspdf if available, otherwise dynamic import
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      // Load jsPDF dynamically
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => generatePDF(client);
      document.head.appendChild(script);
      return;
    }

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 0;

    // ── HEADER ──
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PT MANAGER', 14, 12);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Scheda Cliente', 14, 21);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString('it-IT'), pageW - 14, 21, { align: 'right' });

    y = 38;

    // ── DATI CLIENTE ──
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${client.nome} ${client.cognome}`, 14, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const tipo = client.type === 'corso' ? 'Corso di gruppo' : 'Cliente individuale';
    doc.text(tipo, 14, y);
    y += 8;

    // Info line
    const infos = [];
    if (client.telefono) infos.push(`Tel: ${client.telefono}`);
    if (client.email) infos.push(`Email: ${client.email}`);
    if (infos.length > 0) {
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.text(infos.join('   ·   '), 14, y);
      y += 8;
    }

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    // ── PACCHETTI ──
    if (client.type === 'individuale' && q) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Pacchetti Lezioni', 14, y);
      y += 7;

      // Summary box
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(14, y, pageW - 28, 16, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Lezioni rimaste: ${q.totalRemaining}/${q.totalLessons}`, 20, y + 7);
      const totCosto = (q.packages || []).reduce((s, p) => s + (p.cost || 0), 0);
      doc.text(`Valore totale pacchetti: €${totCosto.toLocaleString('it-IT')}`, 20, y + 13);
      y += 22;

      // Package list
      if (q.packages && q.packages.length > 0) {
        q.packages.forEach((pkg, i) => {
          const status = pkg.exhausted ? 'Esaurito' : pkg.id === q.activePackage?.id ? 'In corso' : 'In coda';
          const statusColor = pkg.exhausted ? [220, 38, 38] : pkg.id === q.activePackage?.id ? [37, 99, 235] : [22, 163, 74];
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...statusColor);
          doc.text(`${i + 1}. ${status}`, 14, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(`${pkg.lessons} lezioni  ·  €${pkg.cost}  ·  ${pkg.remaining}/${pkg.lessons} rimaste`, 50, y);
          if (pkg.purchasedAt) doc.text(`Acquistato: ${pkg.purchasedAt}`, pageW - 14, y, { align: 'right' });
          y += 6;
        });
      }
      y += 6;
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y, pageW - 14, y);
      y += 8;
    }

    // ── SCHEDE ALLENAMENTO ──
    if (schedeCliente.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Schede Allenamento', 14, y);
      y += 8;

      schedeCliente.forEach((scheda) => {
        // Check page space
        if (y > 250) { doc.addPage(); y = 20; }

        const oggi = new Date();
        const scaduta = scheda.dataFine && new Date(scheda.dataFine) < oggi;
        const inScadenza = scheda.dataFine && !scaduta && new Date(scheda.dataFine) < new Date(oggi.getTime() + 7*86400000);
        const statusColor = scaduta ? [220, 38, 38] : inScadenza ? [217, 119, 6] : [22, 163, 74];
        const statusText = scaduta ? 'Scaduta' : inScadenza ? 'Scade presto' : 'Attiva';

        // Scheda header
        doc.setFillColor(248, 250, 251);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, y - 2, pageW - 28, 12, 1, 1, 'FD');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(scheda.nome, 18, y + 6);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...statusColor);
        doc.text(statusText, pageW - 18, y + 6, { align: 'right' });
        y += 16;

        // Date
        if (scheda.dataInizio || scheda.dataFine) {
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          const dateStr = [scheda.dataInizio && `Inizio: ${scheda.dataInizio}`, scheda.dataFine && `Scadenza: ${scheda.dataFine}`].filter(Boolean).join('   ·   ');
          doc.text(dateStr, 18, y);
          y += 6;
        }

        // Giorni e esercizi
        const giorni = scheda.giorni || {};
        const GIORNI_ORDER = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
        GIORNI_ORDER.filter(g => giorni[g]).forEach(giorno => {
          if (y > 260) { doc.addPage(); y = 20; }

          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(37, 99, 235);
          doc.text(`▸ ${giorno}`, 18, y);

          const lista = giorni[giorno] || [];
          const fattCount = lista.filter(e => e.fatto).length;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(`${lista.length} esercizi  ·  ${fattCount}/${lista.length} completati`, 60, y);
          y += 5;

          lista.forEach((es) => {
            if (y > 265) { doc.addPage(); y = 20; }
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(es.fatto ? 22 : 71, es.fatto ? 163 : 85, es.fatto ? 74 : 105);
            const check = es.fatto ? '✓ ' : '○ ';
            const details = [es.serie && `${es.serie}×${es.ripetizioni}`, es.carico && `${es.carico}kg`, es.recupero && `rec.${es.recupero}`].filter(Boolean).join(' ');
            doc.text(`    ${check}${es.nome || 'Esercizio'}${details ? '  —  ' + details : ''}`, 18, y);
            y += 5;
          });
          y += 3;
        });
        y += 6;
      });

      doc.setDrawColor(226, 232, 240);
      doc.line(14, y, pageW - 14, y);
      y += 8;
    }

    // ── STORICO APPUNTAMENTI ──
    if (aptList.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Storico Appuntamenti', 14, y);
      y += 8;

      const recenti = aptList.slice(0, 15);
      recenti.forEach((apt) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const d = new Date(apt.date);
        const dateStr = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        let line = `${dateStr}  ${timeStr}`;
        if (apt.oraFine) line += ` → ${apt.oraFine}`;
        if (apt.giornoScheda) line += `  ·  🏋 ${apt.giornoScheda}`;
        if (apt.note) line += `  ·  ${apt.note}`;
        doc.text(line, 18, y);
        y += 5.5;
      });
      if (aptList.length > 15) {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`... e altri ${aptList.length - 15} appuntamenti`, 18, y);
      }
    }

    // ── FOOTER ──
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(248, 250, 251);
      doc.rect(0, 285, pageW, 12, 'F');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('PT Manager — Generato il ' + new Date().toLocaleDateString('it-IT'), 14, 292);
      doc.text(`Pagina ${i} di ${pageCount}`, pageW - 14, 292, { align: 'right' });
    }

    doc.save(`${client.nome}_${client.cognome}_scheda.pdf`);
    showToast('PDF generato!');
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
                onClick={() => setShowDetail(client)}>
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
                {client.type === 'individuale' && q && (
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
                {client.type === 'corso' && (
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                    {client.partecipanti} partecipanti · <strong style={{ color: 'var(--green)' }}>€{client.monthlyFee}/mese</strong>
                  </div>
                )}
                {client.telefono && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>📞 {client.telefono}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && (() => {
        const c = showDetail;
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

              {/* Pacchetti in coda */}
              {c.type === 'individuale' && q && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Coda pacchetti ({q.packages.length})</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: q.allExhausted ? 'var(--red)' : 'var(--accent)' }}>{q.totalRemaining} lezioni rimaste</div>
                  </div>
                  {q.packages.map((pkg, i) => {
                    const status = pkg.exhausted ? 'exhausted' : pkg.id === q.activePackage?.id ? 'active' : 'queued';
                    return (
                      <div key={pkg.id} className={`pkg-item ${status}`}>
                        <div className={`pkg-num ${status}`}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                              {status === 'exhausted' ? '✓ Esaurito' : status === 'active' ? '▶ In corso' : '⏳ In coda'}
                              {' · '}{pkg.lessons} lezioni {pkg.cost > 0 ? `· €${pkg.cost}` : ''}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{pkg.remaining}/{pkg.lessons}</span>
                          </div>
                          <ProgressBar remaining={pkg.remaining} total={pkg.lessons} />
                          {pkg.purchasedAt && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Acquistato: {pkg.purchasedAt}</div>}
                        </div>
                        {pkg.used === 0 && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeletePackage(c, pkg.id)}>✕</button>
                        )}
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

              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => generatePDF(c)} style={{ color: 'var(--red)' }}>
                  📄 Scarica PDF
                </button>
                <button className="btn btn-ghost" onClick={() => { openEdit(c); setShowDetail(null); }}>Modifica</button>
                <button className="btn btn-danger" onClick={() => setConfirmDelete(c.id)}>Elimina</button>
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
            {!editClient && form.type === 'individuale' && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Primo pacchetto</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="input-group" style={{ flex: 1 }}><label>Lezioni</label><input type="number" min="1" value={form.packageLessons} onChange={e => setForm({ ...form, packageLessons: e.target.value })} placeholder="10" /></div>
                  <div className="input-group" style={{ flex: 1 }}><label>Costo (€)</label><input type="number" value={form.packageCost} onChange={e => setForm({ ...form, packageCost: e.target.value })} placeholder="300" /></div>
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
              <h3>Aggiungi pacchetto in coda</h3>
              <button className="modal-close" onClick={() => setShowPkgModal(false)}>✕</button>
            </div>
            {(() => {
              const q = getPackageQueue(pkgClient, appointments);
              return (
                <div className={`alert ${q && q.totalRemaining > 0 ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: 16 }}>
                  {q && q.totalRemaining > 0
                    ? `${pkgClient.nome} ha ancora ${q.totalRemaining} lezioni. Il nuovo pacchetto partirà automaticamente dopo.`
                    : `Aggiungi un nuovo pacchetto per ${pkgClient.nome} ${pkgClient.cognome}.`}
                </div>
              );
            })()}
            <div className="input-group"><label>Numero lezioni *</label><input type="number" min="1" value={pkgForm.packageLessons} onChange={e => setPkgForm({ ...pkgForm, packageLessons: e.target.value })} placeholder="10" /></div>
            <div className="input-group"><label>Costo pacchetto (€)</label><input type="number" value={pkgForm.packageCost} onChange={e => setPkgForm({ ...pkgForm, packageCost: e.target.value })} placeholder="300" /></div>
            <div className="input-group"><label>Data acquisto</label><input type="date" value={pkgForm.packagePurchasedAt} onChange={e => setPkgForm({ ...pkgForm, packagePurchasedAt: e.target.value })} /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowPkgModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleAddPackage}>+ Aggiungi in coda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
