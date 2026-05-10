// src/components/layout/Sidebar.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const BASE_NAV = [
  { path: '/', label: 'Dashboard' },
  { path: '/clienti', label: 'Clienti' },
  { path: '/calendario', label: 'Calendario' },
];

const OPTIONAL_NAV = [
  { path: '/schede', label: 'Schede', key: 'schedeEnabled' },
  { path: '/template', label: 'Template', key: 'templateEnabled' },
];

// Legge le impostazioni dal localStorage
function getSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('ptm_settings') || '{}');
    return {
      schedeEnabled: s.schedeEnabled !== false, // default: abilitato
      templateEnabled: s.templateEnabled !== false,
    };
  } catch {
    return { schedeEnabled: true, templateEnabled: true };
  }
}

function saveSettings(settings) {
  localStorage.setItem('ptm_settings', JSON.stringify(settings));
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(getSettings);

  useEffect(() => { setMobileOpen(false); setShowSettings(false); }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handle = (e) => {
      if (!e.target.closest('.sidebar') && !e.target.closest('.mobile-menu-btn')) setMobileOpen(false);
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, [mobileOpen]);

  const toggleSetting = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveSettings(next);
    // Se stiamo disabilitando la sezione corrente, torna alla dashboard
    const opt = OPTIONAL_NAV.find(n => n.key === key);
    if (opt && location.pathname === opt.path && !next[key]) {
      navigate('/');
    }
  };

  const navItems = [
    ...BASE_NAV,
    ...OPTIONAL_NAV.filter(n => settings[n.key]),
  ];

  return (
    <>
      <div className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(o => !o)}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {mobileOpen ? <path d="M6 18L18 6M6 6l12 12"/> : <path d="M3 12h18M3 6h18M3 18h18"/>}
          </svg>
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>PT Manager</span>
        <div style={{ width: 36 }} />
      </div>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <div className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <h1>PT Manager</h1>
          <span>Personal Trainer</span>
          <div className="sidebar-logo-line" />
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Impostazioni sezioni */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowSettings(s => !s)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
              fontSize: 12, fontWeight: 600, padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
            <span>⚙ Impostazioni</span>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              style={{ transform: showSettings ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {showSettings && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Sezioni del menu</div>
              {OPTIONAL_NAV.map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <div
                    onClick={() => toggleSetting(key)}
                    style={{
                      width: 32, height: 18, borderRadius: 9, position: 'relative', transition: 'background 0.2s',
                      background: settings[key] ? 'var(--accent)' : 'var(--border)', cursor: 'pointer', flexShrink: 0,
                    }}>
                    <div style={{
                      position: 'absolute', top: 2, left: settings[key] ? 16 : 2,
                      width: 14, height: 14, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-user">
          {user?.photoURL ? (
            <img className="user-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
          ) : (
            <div className="user-avatar" style={{ background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', fontSize: 13 }}>
              {user?.displayName?.[0] || 'U'}
            </div>
          )}
          <div className="user-info">
            <div className="name">{user?.displayName?.split(' ')[0] || 'Trainer'}</div>
            <div className="role">Personal Trainer</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Esci">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
