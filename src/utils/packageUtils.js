// src/utils/packageUtils.js
// Pacchetti INDIPENDENTI — nessun FIFO automatico.
// Il pacchetto attivo è quello con active: true (o il primo se nessuno è marcato, per retrocompatibilità).
// Solo il pacchetto attivo viene consumato da appuntamenti + manualUsed.
// I pacchetti in coda restano intatti finché l'utente non li attiva manualmente.

export function getPackageQueue(client, appointments) {
  let packages = [...(client.packages || [])];

  // ── Migrazione vecchio formato (packageLessons flat) ──
  if (packages.length === 0 && client.packageLessons > 0) {
    packages.push({
      id: 'legacy',
      lessons: client.packageLessons || 0,
      cost: client.packageCost || 0,
      purchasedAt: client.packagePurchasedAt || '',
      paid: true,
      manualUsed: 0,
      active: true,
    });
  }

  if (packages.length === 0) return {
    packages: [], totalRemaining: 0, activePackage: null,
    allExhausted: true, isExpiring: false,
    unpaidExhausted: false, totalPaid: 0, totalUnpaid: 0,
    canBook: false,
  };

  // ── Retrocompatibilità: se nessun pacchetto ha active:true, marca il primo non esaurito ──
  // (vecchi dati salvati senza il campo active)
  const hasActiveMarked = packages.some(p => p.active === true);
  if (!hasActiveMarked) {
    // Calcola quale sarebbe il "primo" in logica FIFO precedente e marcalo attivo
    // così i dati vecchi continuano a funzionare senza migrazione forzata
    let lessonsLeft = appointments.filter(a => a.clientId === client.id).length
      + packages.reduce((s, p) => s + (p.manualUsed || 0), 0);
    let activeFallbackSet = false;
    packages = packages.map(p => {
      if (activeFallbackSet) return p;
      const used = Math.min(lessonsLeft, p.lessons);
      lessonsLeft = Math.max(0, lessonsLeft - p.lessons);
      const remaining = p.lessons - used;
      if (remaining > 0) {
        activeFallbackSet = true;
        return { ...p, active: true };
      }
      return p; // esaurito — non attivo
    });
    // Se tutti esauriti, considera il primo come attivo (sarà esaurito, mostrato correttamente)
    if (!activeFallbackSet && packages.length > 0) {
      packages = packages.map((p, i) => i === 0 ? { ...p, active: true } : p);
    }
  }

  // ── Lezioni usate da appuntamenti reali — imputate SOLO al pacchetto attivo ──
  const aptUsed = appointments.filter(a => a.clientId === client.id).length;

  const packagesWithStatus = packages.map((pkg) => {
    const isActive = pkg.active === true;
    const usedFromApt = isActive ? aptUsed : 0;
    const usedManual = pkg.manualUsed || 0;
    const totalUsed = usedFromApt + usedManual;
    const used = Math.min(totalUsed, pkg.lessons);
    const remaining = Math.max(0, pkg.lessons - used);
    const exhausted = remaining === 0;
    const paid = pkg.paid !== false; // default true se non specificato
    return { ...pkg, used, remaining, exhausted, paid, isActive };
  });

  const activePackage = packagesWithStatus.find(p => p.isActive) || null;
  const totalRemaining = activePackage ? activePackage.remaining : 0;

  // Revenue
  const totalPaid   = packagesWithStatus.filter(p => p.paid).reduce((s, p) => s + (p.cost || 0), 0);
  const totalUnpaid = packagesWithStatus.filter(p => !p.paid).reduce((s, p) => s + (p.cost || 0), 0);

  const unpaidLastLesson  = activePackage && !activePackage.paid && activePackage.remaining === 1;
  const unpaidExhausted   = packagesWithStatus.some(p => p.exhausted && !p.paid && p.isActive);
  const unpaidAlmostDone  = unpaidLastLesson;

  // Si possono prendere appuntamenti solo se c'è un pacchetto attivo con lezioni rimaste
  const canBook = !!activePackage && activePackage.remaining > 0;

  return {
    packages: packagesWithStatus,
    totalRemaining,
    totalLessons: packagesWithStatus.reduce((s, p) => s + p.lessons, 0),
    activePackage,
    allExhausted: !activePackage || activePackage.remaining === 0,
    isExpiring: totalRemaining <= 2 && totalRemaining >= 0,
    unpaidExhausted,
    unpaidAlmostDone,
    unpaidLastLesson,
    totalPaid,
    totalUnpaid,
    aptUsed,
    canBook,
  };
}
