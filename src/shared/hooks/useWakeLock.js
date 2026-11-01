// src/shared/hooks/useWakeLock.js
// Tiene lo schermo acceso mentre `active` è true (allenamento o timer in corso).
import { useEffect } from 'react';

export default function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const l = await navigator.wakeLock.request('screen');
        if (cancelled) l.release(); else lock = l;
      } catch { /* non supportato o negato: nessun problema */ }
    };
    // Il lock viene rilasciato dal browser quando la pagina va in background.
    const onVisible = () => document.visibilityState === 'visible' && acquire();

    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (lock) lock.release().catch(() => {});
    };
  }, [active]);
}
