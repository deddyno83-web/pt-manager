// src/shared/ui/Toaster.js
import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';
import { subscribeNotify } from '../../core/notify';

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => subscribeNotify((t) => {
    setToasts((list) => [...list.slice(-2), t]);
    if (!t.sticky) setTimeout(() => setToasts((list) => list.filter((x) => x.id !== t.id)), 7000);
  }), []);

  const close = (id) => setToasts((list) => list.filter((x) => x.id !== id));
  if (toasts.length === 0) return null;

  return (
    <div className="toaster" role="status">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.kind === 'info' ? <Info size={18} /> : <AlertTriangle size={18} />}
          <span>{t.message}</span>
          <button className="icon-btn" onClick={() => close(t.id)} aria-label="Chiudi"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}
