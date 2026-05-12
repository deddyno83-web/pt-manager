// src/utils/packageUtils.js
//
// LOGICA POSIZIONE-BASED:
//   [ pkg0, pkg1, pkg2(active:true), pkg3, pkg4 ]
//        ↑ storico ↑                  ↑  coda  ↑
//
// usedAtActivation = snapshot appuntamenti passati al momento dell'attivazione.
// Lezioni consumate = (aptPassati - usedAtActivation) + manualUsed
// Se usedAtActivation manca (dati vecchi) → default 0 (conta tutto dall'inizio)

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
    _needsMigration: false,
  };

  // Appuntamenti passati (oggi incluso), ordinati per data
  const now = new Date();
  const pastApts = appointments
    .filter(a => a.clientId === client.id && new Date(a.date) <= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const aptTotal = pastApts.length;

  // ── Se nessun pacchetto ha active:true ──
  // Questo accade con dati vecchi O se il primo pacchetto è stato salvato con active:false
  const hasActiveMarked = packages.some(p => p.active === true);
  if (!hasActiveMarked) {
    // Caso semplice: un solo pacchetto → attivalo con usedAtActivation:0
    if (packages.length === 1) {
      packages = [{ ...packages[0], active: true, usedAtActivation: packages[0].usedAtActivation ?? 0 }];
    } else {
      // Più pacchetti: usa consumo progressivo per trovare quale era attivo
      let consumed = aptTotal;
      let foundIdx = -1;
      for (let i = 0; i < packages.length; i++) {
        if (consumed < packages[i].lessons) { foundIdx = i; break; }
        consumed -= packages[i].lessons;
      }
      if (foundIdx === -1) foundIdx = packages.length - 1;
      const pivotUsed = aptTotal - consumed;
      packages = packages.map((p, i) =>
        i === foundIdx
          ? { ...p, active: true, usedAtActivation: p.usedAtActivation ?? pivotUsed }
          : { ...p, active: false }
      );
    }
  }

  // ── Pivot = indice del pacchetto active:true ──
  const pivotIdx = packages.findIndex(p => p.active === true);

  // ── Calcola stato per ogni pacchetto ──
  const packagesWithStatus = packages.map((pkg, i) => {
    const isActive = i === pivotIdx;
    const isBefore = i < pivotIdx;
    const manualUsed = pkg.manualUsed || 0;

    let used = 0;
    let remaining = pkg.lessons;
    let role;

    if (isActive) {
      role = 'active';
      // usedAtActivation: quanti apt passati esistevano quando il pacchetto è stato attivato
      // Se manca (dato Firestore vecchio senza il campo) → 0 = conta tutto dall'inizio
      const baseline = pkg.usedAtActivation ?? 0;
      const aptSince = Math.max(0, aptTotal - baseline);
      used = Math.min(aptSince + manualUsed, pkg.lessons);
      remaining = Math.max(0, pkg.lessons - used);
    } else if (isBefore) {
      role = 'history';
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

  // ── Riordina: attivo → coda → storico ──
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

  // Flag per il chiamante: questo cliente ha pacchetti senza usedAtActivation
  // → dovrebbe essere migrato su Firestore (una tantum)
  const _needsMigration = packages.some(
    (p, i) => i === pivotIdx && p.active && p.usedAtActivation === undefined
  );

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
    _needsMigration,
  };
}
