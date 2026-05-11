// src/utils/packageUtils.js
//
// LOGICA DEFINITIVA — basata sulla posizione nell'array, non su flag extra:
//
//   [ pkg0, pkg1, pkg2(active), pkg3, pkg4 ]
//        ↑ storico ↑              ↑ coda ↑
//
// - Il pacchetto con active:true è quello corrente
// - Tutti i pacchetti che vengono PRIMA nell'array → storico (già usati)
// - Tutti i pacchetti che vengono DOPO nell'array  → coda (da usare)
// - Nessun flag extra necessario (archived, ecc.)
//
// "Attiva ora" appare SOLO sui pacchetti in coda (dopo l'attivo).
// Quando si attiva un pacchetto, il vecchio attivo rimane nell'array
// ma viene prima → diventa automaticamente storico.

export function getPackageQueue(client, appointments) {
  let packages = [...(client.packages || [])];

  // ── Migrazione formato flat legacy ──
  if (packages.length === 0 && client.packageLessons > 0) {
    packages.push({
      id: 'legacy',
      lessons: client.packageLessons || 0,
      cost: client.packageCost || 0,
      purchasedAt: client.packagePurchasedAt || '',
      paid: true,
      manualUsed: 0,
      active: true,
      usedAtActivation: 0,
    });
  }

  if (packages.length === 0) return {
    packages: [], totalRemaining: 0, totalLessons: 0, activePackage: null,
    allExhausted: true, isExpiring: false, hasQueue: false,
    unpaidExhausted: false, unpaidLastLesson: false, unpaidAlmostDone: false,
    totalPaid: 0, totalUnpaid: 0, canBook: false, aptUsed: 0, aptTotal: 0,
  };

  // Appuntamenti passati (oggi incluso)
  const now = new Date();
  const aptTotal = appointments.filter(
    a => a.clientId === client.id && new Date(a.date) <= now
  ).length;

  // ── Se nessuno ha active:true (dati vecchissimi senza flag) ──
  // Usa la logica a consumo progressivo per trovare quello corrente
  const activeIdx = packages.findIndex(p => p.active === true);
  if (activeIdx === -1) {
    let consumed = aptTotal;
    let foundIdx = -1;
    for (let i = 0; i < packages.length; i++) {
      if (consumed < packages[i].lessons) { foundIdx = i; break; }
      consumed -= packages[i].lessons;
    }
    if (foundIdx === -1) foundIdx = packages.length - 1;
    const usedAtActivation = Math.max(0, aptTotal - (aptTotal - consumed > 0 ? consumed : 0));
    packages = packages.map((p, i) =>
      i === foundIdx ? { ...p, active: true, usedAtActivation } : { ...p, active: false }
    );
  }

  // ── Indice del pacchetto attivo (posizione pivot) ──
  const pivotIdx = packages.findIndex(p => p.active === true);

  // ── Calcola stato per ogni pacchetto in base alla posizione ──
  const packagesWithStatus = packages.map((pkg, i) => {
    const isActive = i === pivotIdx;
    const isBefore = i < pivotIdx;  // storico
    const isAfter  = i > pivotIdx;  // coda
    const manualUsed = pkg.manualUsed || 0;

    let used = 0;
    let remaining = pkg.lessons;
    let role; // 'active' | 'history' | 'queue'

    if (isActive) {
      role = 'active';
      const aptSince = Math.max(0, aptTotal - (pkg.usedAtActivation ?? 0));
      used = Math.min(aptSince + manualUsed, pkg.lessons);
      remaining = Math.max(0, pkg.lessons - used);
    } else if (isBefore) {
      role = 'history';
      // Per lo storico mostriamo le lezioni del pacchetto come completate
      used = pkg.lessonsUsedSnapshot ?? pkg.lessons;
      remaining = 0;
    } else {
      role = 'queue';
      used = 0;
      remaining = pkg.lessons;
    }

    const exhausted = isActive && remaining === 0;
    const paid = pkg.paid !== false;
    return { ...pkg, used, remaining, exhausted, paid, isActive, role };
  });

  // ── Riordina per visualizzazione: attivo → coda → storico ──
  const ordered = [
    ...packagesWithStatus.filter(p => p.role === 'active'),
    ...packagesWithStatus.filter(p => p.role === 'queue'),
    ...packagesWithStatus.filter(p => p.role === 'history'),
  ];

  const activePackage = ordered.find(p => p.isActive) || null;
  const totalRemaining = activePackage ? activePackage.remaining : 0;
  const hasQueue = ordered.some(p => p.role === 'queue');

  const totalPaid   = ordered.filter(p => p.paid).reduce((s, p) => s + (p.cost || 0), 0);
  const totalUnpaid = ordered.filter(p => !p.paid).reduce((s, p) => s + (p.cost || 0), 0);

  const unpaidLastLesson = !!(activePackage && !activePackage.paid && activePackage.remaining === 1);
  const unpaidExhausted  = !!(activePackage && activePackage.exhausted && !activePackage.paid);
  const canBook = !!(activePackage && !activePackage.exhausted);

  return {
    packages: ordered,
    totalRemaining,
    totalLessons: activePackage ? activePackage.lessons : 0,
    activePackage,
    allExhausted: !canBook,
    isExpiring: totalRemaining > 0 && totalRemaining <= 2,
    hasQueue,
    unpaidExhausted,
    unpaidLastLesson,
    unpaidAlmostDone: unpaidLastLesson,
    totalPaid,
    totalUnpaid,
    aptUsed: activePackage ? activePackage.used : 0,
    canBook,
    aptTotal,
  };
}
