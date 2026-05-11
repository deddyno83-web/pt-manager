// src/utils/packageUtils.js
// Regole:
// - Un solo pacchetto alla volta ha active:true
// - Quando si attiva un nuovo pacchetto, il vecchio viene archiviato (archived:true)
// - I pacchetti archived sono solo storico, non mostrano "Attiva ora"
// - Le lezioni consumate dal pacchetto attivo = (apt passati - usedAtActivation) + manualUsed
// - I pacchetti in coda (active:false, archived:false) mostrano le lezioni totali disponibili

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

  // ── Retrocompatibilità: nessun pacchetto ha active:true ──
  // Questa logica si attiva SOLO per dati vecchi senza il flag active
  const hasActiveMarked = packages.some(p => p.active === true);
  if (!hasActiveMarked) {
    let consumed = aptTotal;
    let found = false;
    packages = packages.map(p => {
      if (found) return p;
      if (consumed >= p.lessons) { consumed -= p.lessons; return { ...p, archived: true }; }
      found = true;
      return { ...p, active: true, usedAtActivation: Math.max(0, aptTotal - consumed) };
    });
    if (!found && packages.length > 0) {
      packages[0] = { ...packages[0], active: true, usedAtActivation: packages[0].usedAtActivation ?? 0 };
    }
  }

  // ── Calcola stato per ogni pacchetto ──
  const packagesWithStatus = packages.map(pkg => {
    const isActive = pkg.active === true;
    const isArchived = pkg.archived === true;
    const manualUsed = pkg.manualUsed || 0;

    let used = 0;
    let remaining = pkg.lessons;

    if (isActive) {
      const aptSince = Math.max(0, aptTotal - (pkg.usedAtActivation ?? 0));
      used = Math.min(aptSince + manualUsed, pkg.lessons);
      remaining = Math.max(0, pkg.lessons - used);
    } else if (isArchived) {
      // Archiviato: mostra le lezioni usate (full) per lo storico
      used = pkg.lessonsUsedSnapshot ?? pkg.lessons;
      remaining = 0;
    }
    // in coda (active:false, archived:false): used=0, remaining=pkg.lessons

    const exhausted = isActive && remaining === 0;
    const paid = pkg.paid !== false;
    return { ...pkg, used, remaining, exhausted, paid, isActive, isArchived };
  });

  // ── Ordinamento: attivo → in coda → archiviati ──
  packagesWithStatus.sort((a, b) => {
    const order = p => {
      if (p.isActive && !p.exhausted) return 0; // attivo con lezioni
      if (p.isActive && p.exhausted) return 1;  // attivo esaurito (transiente)
      if (!p.isArchived) return 2;              // in coda
      return 3;                                 // archivio/storico
    };
    return order(a) - order(b);
  });

  const activePackage = packagesWithStatus.find(p => p.isActive) || null;
  const totalRemaining = activePackage ? activePackage.remaining : 0;
  const hasQueue = packagesWithStatus.some(p => !p.isActive && !p.isArchived);

  const totalPaid   = packagesWithStatus.filter(p => p.paid).reduce((s, p) => s + (p.cost || 0), 0);
  const totalUnpaid = packagesWithStatus.filter(p => !p.paid).reduce((s, p) => s + (p.cost || 0), 0);

  const unpaidLastLesson = !!(activePackage && !activePackage.paid && activePackage.remaining === 1);
  const unpaidExhausted  = !!(activePackage && activePackage.exhausted && !activePackage.paid);
  const canBook = !!(activePackage && !activePackage.exhausted);

  return {
    packages: packagesWithStatus,
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
