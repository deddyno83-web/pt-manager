// src/components/layout/Sidebar.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/clienti', label: 'Clienti' },
  { path: '/calendario', label: 'Calendario' },
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
            {item.label}
          </button>
        ))}
      </nav>
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
  );
}
