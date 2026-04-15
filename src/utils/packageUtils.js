// src/utils/packageUtils.js
// Gestione coda pacchetti FIFO con:
// - manualUsed: lezioni scalate manualmente (non da appuntamenti)
// - paid: true/false per ogni pacchetto
// - avviso se lezioni esaurite e pacchetto non pagato

export function getPackageQueue(client, appointments) {
  if (client.type === 'corso') return null;

  const packages = [...(client.packages || [])];

  // Migrazione vecchio formato
  if (packages.length === 0 && client.packageLessons > 0) {
    packages.push({
      id: 'legacy',
      lessons: client.packageLessons || 0,
      cost: client.packageCost || 0,
      purchasedAt: client.packagePurchasedAt || '',
      paid: true,
      manualUsed: 0,
    });
  }

  if (packages.length === 0) return {
    packages: [], totalRemaining: 0, activePackage: null,
    allExhausted: true, isExpiring: false,
    unpaidExhausted: false, totalPaid: 0, totalUnpaid: 0,
  };

  // Lezioni usate da appuntamenti reali
  const aptUsed = appointments.filter(a => a.clientId === client.id).length;
  // Lezioni scalate manualmente + da appuntamenti
  const totalUsed = aptUsed + packages.reduce((s, p) => s + (p.manualUsed || 0), 0);

  // Calcola stato FIFO
  let lessonsLeft = totalUsed;
  const packagesWithStatus = packages.map((pkg) => {
    const used = Math.min(lessonsLeft, pkg.lessons);
    lessonsLeft = Math.max(0, lessonsLeft - pkg.lessons);
    const remaining = pkg.lessons - used;
    const exhausted = remaining === 0;
    const paid = pkg.paid !== false; // default true se non specificato
    return { ...pkg, used, remaining, exhausted, paid };
  });

  const totalRemaining = packagesWithStatus.reduce((s, p) => s + p.remaining, 0);
  const activePackage = packagesWithStatus.find(p => !p.exhausted) || null;

  // Revenue: solo pacchetti pagati
  const totalPaid = packagesWithStatus.filter(p => p.paid).reduce((s, p) => s + (p.cost || 0), 0);
  const totalUnpaid = packagesWithStatus.filter(p => !p.paid).reduce((s, p) => s + (p.cost || 0), 0);

  // Avviso SOLO se è l'ultima lezione (remaining === 1) e il pacchetto NON è pagato
  const unpaidLastLesson = activePackage && !activePackage.paid && activePackage.remaining === 1;

  // Avviso se le lezioni sono finite (remaining === 0) e il pacchetto NON è pagato
  const unpaidExhausted = packagesWithStatus.some(p => p.exhausted && !p.paid);

  // Alias per compatibilità con il codice esistente
  const unpaidAlmostDone = unpaidLastLesson;

  return {
    packages: packagesWithStatus,
    totalRemaining,
    totalLessons: packagesWithStatus.reduce((s, p) => s + p.lessons, 0),
    activePackage,
    allExhausted: totalRemaining === 0,
    isExpiring: totalRemaining <= 2 && totalRemaining >= 0,
    unpaidExhausted,
    unpaidAlmostDone,
    unpaidLastLesson,
    totalPaid,
    totalUnpaid,
    aptUsed,
  };
}
