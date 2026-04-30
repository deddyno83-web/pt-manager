// src/utils/packageUtils.js
// Ogni pacchetto è INDIPENDENTE.
// Quando un pacchetto viene attivato si salva `usedAtActivation` = numero di appuntamenti
// esistenti in quel momento. Le lezioni consumate dal pacchetto attivo sono:
//   (aptTotal - usedAtActivation) + manualUsed
// I pacchetti in coda non vengono toccati finché non vengono attivati manualmente.

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
    packages: [], totalRemaining: 0, activePackage: null,
    allExhausted: true, isExpiring: false,
    unpaidExhausted: false, totalPaid: 0, totalUnpaid: 0,
    canBook: false, aptUsed: 0,
  };

  // Totale appuntamenti del cliente
  const aptTotal = appointments.filter(a => a.clientId === client.id).length;

  // ── Retrocompatibilità: nessun pacchetto ha active:true ──
  const hasActiveMarked = packages.some(p => p.active === true);
  if (!hasActiveMarked) {
    let consumed = aptTotal;
    let activeFallbackSet = false;
    packages = packages.map(p => {
      if (activeFallbackSet) return p;
      if (consumed >= p.lessons) {
        consumed -= p.lessons;
        return p;
      }
      activeFallbackSet = true;
      const usedAtActivation = Math.max(0, aptTotal - consumed);
      return { ...p, active: true, usedAtActivation };
    });
    if (!activeFallbackSet && packages.length > 0) {
      packages = packages.map((p, i) => i === 0
        ? { ...p, active: true, usedAtActivation: p.usedAtActivation ?? 0 }
        : p
      );
    }
  }

  // ── Calcolo stato per ogni pacchetto ──
  const packagesWithStatus = packages.map(pkg => {
    const isActive = pkg.active === true;
    const manualUsed = pkg.manualUsed || 0;

    let used, remaining;
    if (isActive) {
      const aptSinceActivation = Math.max(0, aptTotal - (pkg.usedAtActivation ?? 0));
      used = Math.min(aptSinceActivation + manualUsed, pkg.lessons);
      remaining = Math.max(0, pkg.lessons - used);
    } else {
      used = 0;
      remaining = pkg.lessons;
    }

    const exhausted = remaining === 0;
    const paid = pkg.paid !== false;
    return { ...pkg, used, remaining, exhausted, paid, isActive };
  });

  const activePackage = packagesWithStatus.find(p => p.isActive) || null;
  const totalRemaining = activePackage ? activePackage.remaining : 0;

  const totalPaid   = packagesWithStatus.filter(p => p.paid).reduce((s, p) => s + (p.cost || 0), 0);
  const totalUnpaid = packagesWithStatus.filter(p => !p.paid).reduce((s, p) => s + (p.cost || 0), 0);

  const unpaidLastLesson = activePackage && !activePackage.paid && activePackage.remaining === 1;
  const unpaidExhausted  = !!activePackage && activePackage.exhausted && !activePackage.paid;
  const unpaidAlmostDone = unpaidLastLesson;

  const canBook = !!activePackage && activePackage.remaining > 0;

  return {
    packages: packagesWithStatus,
    totalRemaining,
    totalLessons: activePackage ? activePackage.lessons : 0,
    activePackage,
    allExhausted: !activePackage || activePackage.remaining === 0,
    isExpiring: totalRemaining <= 2 && totalRemaining > 0,
    unpaidExhausted,
    unpaidAlmostDone,
    unpaidLastLesson,
    totalPaid,
    totalUnpaid,
    aptUsed: activePackage ? activePackage.used : 0,
    canBook,
  };
}
