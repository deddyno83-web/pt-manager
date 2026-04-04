// src/utils/packageUtils.js
// Gestione coda pacchetti: ogni cliente ha packages = [{lessons, cost, date, id}]
// Le lezioni scalano dal pacchetto più vecchio attivo (FIFO)

export function getPackageQueue(client, appointments) {
  if (client.type === 'corso') return null;

  // Supporto vecchio formato (singolo pacchetto) + nuovo formato (array)
  const packages = client.packages || [];

  // Migrazione dal vecchio formato
  if (packages.length === 0 && client.packageLessons > 0) {
    packages.push({
      id: 'legacy',
      lessons: client.packageLessons || 0,
      cost: client.packageCost || 0,
      purchasedAt: client.packagePurchasedAt || '',
    });
  }

  if (packages.length === 0) return { packages: [], totalRemaining: 0, activePackage: null, allExhausted: true };

  // Conta appuntamenti totali del cliente
  const totalUsed = appointments.filter(a => a.clientId === client.id).length;

  // Calcola quante lezioni sono usate in ogni pacchetto (FIFO)
  let lessonsLeft = totalUsed;
  const packagesWithStatus = packages.map((pkg) => {
    const used = Math.min(lessonsLeft, pkg.lessons);
    lessonsLeft = Math.max(0, lessonsLeft - pkg.lessons);
    const remaining = pkg.lessons - used;
    return { ...pkg, used, remaining, exhausted: remaining === 0 };
  });

  const totalRemaining = packagesWithStatus.reduce((s, p) => s + p.remaining, 0);
  // Il pacchetto attivo è il primo non esaurito
  const activePackage = packagesWithStatus.find(p => !p.exhausted) || null;

  return {
    packages: packagesWithStatus,
    totalRemaining,
    totalLessons: packagesWithStatus.reduce((s, p) => s + p.lessons, 0),
    activePackage,
    allExhausted: totalRemaining === 0,
    isExpiring: totalRemaining <= 2 && totalRemaining >= 0,
  };
}
