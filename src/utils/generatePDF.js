// src/utils/generatePDF.js
// Generazione PDF professionale cliente usando jsPDF

const BLUE       = '#2563EB';
const BLUE_DARK  = '#1D4ED8';
const BLUE_LIGHT = '#EFF6FF';
const NAVY       = '#0F172A';
const GRAY       = '#64748B';
const GRAY_LIGHT = '#F8FAFF';
const BORDER     = '#E2E8F0';
const GREEN      = '#16A34A';
const GREEN_L    = '#F0FDF4';
const GREEN_B    = '#BBFFD0';
const AMBER      = '#D97706';
const AMBER_L    = '#FFFBEB';
const AMBER_B    = '#FDE68A';
const RED        = '#DC2626';
const RED_L      = '#FEF2F2';
const RED_B      = '#FECACA';
const WHITE      = '#FFFFFF';

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}

function loadJsPDF() {
  return new Promise((resolve) => {
    if (window.jspdf) return resolve(window.jspdf.jsPDF);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => resolve(window.jspdf.jsPDF);
    document.head.appendChild(s);
  });
}

const GIORNI_ORDER = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];

export async function generateClientePDF(cliente, packages, schedeCliente, appointments) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PW = 210; // page width mm
  const PH = 297;
  const ML = 12;  // margin left
  const MR = 12;  // margin right
  const CW = PW - ML - MR; // content width
  let y = 0;

  const today = new Date().toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' });

  // ── HELPERS ──
  const rgb = (hex) => hexToRgb(hex);

  function setFill(hex) { const [r,g,b] = rgb(hex); doc.setFillColor(r,g,b); }
  function setStroke(hex) { const [r,g,b] = rgb(hex); doc.setDrawColor(r,g,b); }
  function setFont(hex) { const [r,g,b] = rgb(hex); doc.setTextColor(r,g,b); }

  function rect(x, yw, w, h, fillHex, strokeHex, radius=0) {
    setFill(fillHex || WHITE);
    if (strokeHex) { setStroke(strokeHex); doc.setLineWidth(0.3); }
    if (radius > 0) doc.roundedRect(x, yw, w, h, radius, radius, strokeHex ? 'FD' : 'F');
    else doc.rect(x, yw, w, h, strokeHex ? 'FD' : 'F');
  }

  function text(str, x, yw, opts={}) {
    setFont(opts.color || NAVY);
    doc.setFontSize(opts.size || 10);
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    if (opts.align === 'right') doc.text(str, x, yw, { align: 'right' });
    else if (opts.align === 'center') doc.text(str, x, yw, { align: 'center' });
    else doc.text(str, x, yw);
  }

  function line(x1, y1, x2, y2, hex=BORDER, w=0.3) {
    setStroke(hex); doc.setLineWidth(w);
    doc.line(x1, y1, x2, y2);
  }

  function addPage() {
    doc.addPage();
    drawFooter();
    y = 16;
  }

  function checkPage(needed = 20) {
    if (y + needed > PH - 16) addPage();
  }

  // ── HEADER ──
  function drawHeader() {
    // Sfondo blu
    rect(0, 0, PW, 42, BLUE_DARK);
    // Accento laterale
    rect(0, 0, 5, 42, BLUE);
    // Logo
    text('PT MANAGER', ML+2, 14, { color: WHITE, size: 16, bold: true });
    text('Scheda Cliente  —  Creact Srl  —  info@tmsnc.it', ML+2, 20, { color: '#BFDBFE', size: 8 });
    // Data
    text(today, PW - MR, 12, { color: '#BFDBFE', size: 8, align: 'right' });
    // Nome cliente
    const nome = `${cliente.nome} ${cliente.cognome}`;
    text(nome, ML+2, 31, { color: WHITE, size: 20, bold: true });
    // Tipo
    const tipo = cliente.type === 'corso' ? 'Corso di Gruppo' : 'Cliente Individuale';
    text(tipo, ML+2, 38, { color: '#BFDBFE', size: 9 });
    y = 48;
  }

  // ── FOOTER su ogni pagina ──
  function drawFooter() {
    rect(0, PH-10, PW, 10, GRAY_LIGHT);
    line(0, PH-10, PW, PH-10, BORDER, 0.3);
    text('PT Manager  ·  info@tmsnc.it  ·  3666646314  ·  Creact Srl', ML, PH-4, { color: GRAY, size: 7.5 });
    text(`Pagina ${doc.internal.getCurrentPageInfo().pageNumber}`, PW-MR, PH-4, { color: GRAY, size: 7.5, align: 'right' });
  }

  // ── SECTION TITLE ──
  function sectionTitle(title, iconChar='') {
    checkPage(14);
    text(`${iconChar}  ${title}`, ML, y, { color: BLUE, size: 11, bold: true });
    y += 6;
  }

  // ── INFO CLIENTE ──
  function drawInfoCliente() {
    const rows = [];
    if (cliente.telefono) rows.push(['Telefono', cliente.telefono]);
    if (cliente.email)    rows.push(['Email', cliente.email]);
    if (cliente.note)     rows.push(['Note', cliente.note]);
    if (!rows.length) return;

    rows.forEach((r, i) => {
      rect(ML, y, CW, 7, i%2===0 ? WHITE : GRAY_LIGHT, BORDER);
      text(r[0], ML+3, y+4.8, { color: GRAY, size: 8.5 });
      text(r[1], ML+40, y+4.8, { color: NAVY, size: 9 });
      y += 7;
    });
    y += 4;
  }

  // ── PACCHETTI ──
  function drawPacchetti() {
    if (cliente.type === 'corso' || !packages || packages.length === 0) return;

    sectionTitle('Pacchetti Lezioni');

    const totalL = packages.reduce((s,p) => s + (p.lessons||0), 0);
    const totalR = packages.reduce((s,p) => s + (p.remaining !== undefined ? p.remaining : p.lessons||0), 0);
    const totalC = packages.reduce((s,p) => s + (p.cost||0), 0);

    const isRed   = totalR === 0;
    const isAmber = totalR > 0 && totalR <= 2;
    const bgC  = isRed ? RED_L : isAmber ? AMBER_L : GREEN_L;
    const bdC  = isRed ? RED_B : isAmber ? AMBER_B : GREEN_B;
    const valC = isRed ? RED   : isAmber ? AMBER   : GREEN;
    const statTxt = isRed ? 'ESAURITO' : isAmber ? `⚠ Solo ${totalR} rimaste` : `✓ ${totalR} disponibili`;

    // Summary box
    rect(ML, y, CW, 16, bgC, bdC, 2);
    text(`${totalR}/${totalL}`, ML+8, y+7, { color: valC, size: 14, bold: true });
    text('lezioni rimaste', ML+8, y+12, { color: GRAY, size: 7.5 });
    text(`€${totalC.toLocaleString('it-IT')}`, ML+55, y+7, { color: NAVY, size: 14, bold: true });
    text('valore totale', ML+55, y+12, { color: GRAY, size: 7.5 });
    text(`${packages.length} pacchetti`, ML+100, y+7, { color: NAVY, size: 11, bold: true });
    text(statTxt, PW-MR-5, y+9, { color: valC, size: 9.5, bold: true, align: 'right' });
    y += 20;

    // Barra progresso
    const pct = totalL > 0 ? totalR / totalL : 0;
    rect(ML, y, CW, 3, BORDER, null, 1);
    if (pct > 0) rect(ML, y, CW*pct, 3, valC, null, 1);
    y += 7;

    // Tabella pacchetti
    const cols = [10, 28, 25, 22, 22, 26, 33];
    const headers = ['#', 'Stato', 'Lezioni', 'Usate', 'Rimaste', 'Costo', 'Acquistato'];
    // Header
    rect(ML, y, CW, 6.5, GRAY_LIGHT, BORDER);
    let cx = ML;
    headers.forEach((h,i) => {
      text(h, cx+2, y+4.5, { color: GRAY, size: 7.5, bold: true });
      cx += cols[i];
    });
    y += 6.5;

    packages.forEach((p, i) => {
      const rem = p.remaining !== undefined ? p.remaining : p.lessons||0;
      const used = (p.lessons||0) - rem;
      const exh = p.exhausted || rem === 0;
      const isActive = !exh && packages.slice(0,i).every(x => x.exhausted || (x.remaining !== undefined ? x.remaining : 0) === 0);
      const stTxt = exh ? 'Esaurito' : isActive ? 'In corso' : 'In coda';
      const stCol = exh ? RED : isActive ? BLUE : AMBER;

      rect(ML, y, CW, 6.5, i%2===0 ? WHITE : GRAY_LIGHT, BORDER);
      cx = ML;
      const vals = [String(i+1), stTxt, String(p.lessons||0), String(used), String(rem), `€${p.cost||0}`, p.purchasedAt||'—'];
      vals.forEach((v,j) => {
        const col = j===1 ? stCol : j===4 ? (rem<=2 && rem>0 ? AMBER : rem===0 ? RED : NAVY) : NAVY;
        const bold = j===1;
        text(v, cx+2, y+4.5, { color: col, size: 8, bold });
        cx += cols[j];
      });
      y += 6.5;
    });
    y += 6;
  }

  // ── SCHEDE ──
  function drawSchede() {
    if (!schedeCliente || schedeCliente.length === 0) return;

    checkPage(20);
    line(ML, y, PW-MR, y);
    y += 5;
    sectionTitle('Schede di Allenamento');

    schedeCliente.forEach(scheda => {
      checkPage(25);
      const oggi = new Date();
      const fine = scheda.dataFine ? new Date(scheda.dataFine) : null;
      const scaduta = fine && fine < oggi;
      const inScad  = fine && !scaduta && (fine - oggi) / 86400000 <= 7;

      const bgC  = scaduta ? RED_L   : inScad ? AMBER_L   : GREEN_L;
      const bdC  = scaduta ? RED_B   : inScad ? AMBER_B   : GREEN_B;
      const stC  = scaduta ? RED     : inScad ? AMBER     : GREEN;
      const stTx = scaduta ? 'Scaduta' : inScad ? 'Scade presto' : 'Attiva';

      // Header scheda
      rect(ML, y, CW, 10, bgC, bdC, 2);
      text(scheda.nome, ML+5, y+6.5, { color: NAVY, size: 11, bold: true });
      text(stTx, PW-MR-3, y+6.5, { color: stC, size: 9, bold: true, align: 'right' });
      y += 12;

      // Date
      if (scheda.dataInizio || scheda.dataFine) {
        const dateStr = [scheda.dataInizio && `Dal ${scheda.dataInizio}`, scheda.dataFine && `al ${scheda.dataFine}`].filter(Boolean).join(' ');
        text(dateStr, ML+2, y+3.5, { color: GRAY, size: 8 });
        y += 7;
      }

      // Giorni
      const giorni = scheda.giorni || {};
      GIORNI_ORDER.forEach(giorno => {
        if (!giorni[giorno]) return;
        const lista = giorni[giorno];
        const fatti = lista.filter(e => e.fatto).length;

        checkPage(10 + lista.length * 6);

        // Giorno header
        rect(ML, y, CW, 7, BLUE_LIGHT, '#DBEAFE');
        text(giorno, ML+4, y+4.8, { color: BLUE, size: 9.5, bold: true });
        text(`${lista.length} esercizi  ·  ${fatti}/${lista.length} completati`, PW-MR-3, y+4.8, { color: GRAY, size: 8, align: 'right' });
        y += 7;

        // Esercizi
        lista.forEach((es, i) => {
          const done = !!es.fatto;
          rect(ML, y, CW, 6.5, i%2===0 ? WHITE : GRAY_LIGHT, BORDER);
          
          // Check circle
          const cc = done ? GREEN : BORDER;
          const [cr,cg,cb] = rgb(cc);
          doc.setFillColor(cr,cg,cb);
          doc.circle(ML+5, y+3.2, 2, done ? 'F' : 'D');
          if (done) { doc.setFillColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.text('✓', ML+3.5, y+4.2); }

          const nameCol = done ? GREEN : NAVY;
          text(es.nome||'Esercizio', ML+10, y+4.5, { color: nameCol, size: 9, bold: true });

          const details = [
            es.serie && es.ripetizioni ? `${es.serie} × ${es.ripetizioni} rip` : '',
            es.carico ? `${es.carico} kg` : '',
            es.recupero ? `Rec. ${es.recupero}` : '',
          ].filter(Boolean).join('   ');
          if (details) text(details, PW-MR-3, y+4.5, { color: GRAY, size: 8, align: 'right' });
          y += 6.5;
        });
        y += 4;
      });
      y += 5;
    });
  }

  // ── STORICO APPUNTAMENTI ──
  function drawStoico() {
    if (!appointments || appointments.length === 0) return;
    checkPage(20);
    line(ML, y, PW-MR, y);
    y += 5;
    sectionTitle('Storico Appuntamenti');

    const cols2 = [40, 18, 18, 40, 70];
    const headers2 = ['Data', 'Ora', 'Fine', 'Allenamento', 'Note'];
    rect(ML, y, CW, 6.5, GRAY_LIGHT, BORDER);
    let cx = ML;
    headers2.forEach((h,i) => { text(h, cx+2, y+4.5, { color: GRAY, size: 7.5, bold: true }); cx += cols2[i]; });
    y += 6.5;

    const sorted = [...appointments].sort((a,b) => new Date(b.date) - new Date(a.date));
    sorted.slice(0, 20).forEach((apt, i) => {
      checkPage(7);
      const d = new Date(apt.date);
      const dateStr = d.toLocaleDateString('it-IT', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
      const timeStr = d.toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' });
      rect(ML, y, CW, 6.5, i%2===0 ? WHITE : GRAY_LIGHT, BORDER);
      cx = ML;
      const vals2 = [dateStr, timeStr, apt.oraFine||'—', apt.giornoScheda||'—', apt.note||''];
      vals2.forEach((v,j) => { text(v, cx+2, y+4.5, { color: NAVY, size: 8 }); cx += cols2[j]; });
      y += 6.5;
    });

    if (appointments.length > 20) {
      y += 3;
      text(`... e altri ${appointments.length - 20} appuntamenti`, ML, y, { color: GRAY, size: 8 });
    }
  }

  // ── BUILD ──
  drawHeader();
  drawFooter();
  drawInfoCliente();
  drawPacchetti();
  drawSchede();
  drawStoico();

  // Salva
  const filename = `${cliente.nome}_${cliente.cognome}_scheda.pdf`;
  doc.save(filename);
  return filename;
}
