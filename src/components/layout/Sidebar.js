// src/components/layout/Sidebar.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '▦' },
  { path: '/clienti', label: 'Clienti', icon: '◉' },
  { path: '/calendario', label: 'Calendario', icon: '◫' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>PT Manager</h1>
        <span>Personal Trainer</span>
        <div className="sidebar-logo-line" />
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        {user?.photoURL ? (
          <img className="user-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <div className="user-avatar" style={{
            background: 'var(--accent-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: 'var(--accent)', fontSize: 14
          }}>
            {user?.displayName?.[0] || 'U'}
          </div>
        )}
        <div className="user-info">
          <div className="name">{user?.displayName || 'Trainer'}</div>
          <div className="role">Personal Trainer</div>
        </div>
        <button className="logout-btn" onClick={logout} title="Esci">
          ⏻
        </button>
      </div>
    </div>
  );
}
