// src/app/AppLayout.js
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, ListChecks, Timer, LineChart, Music2 } from 'lucide-react';
import RestTimerBar from '../features/timer/RestTimerBar';
import MusicDock from '../features/music/MusicDock';
import { useActiveSession } from '../features/session/ActiveSessionContext';

const TABS = [
  { to: '/', label: 'Oggi', icon: Home, end: true },
  { to: '/schede', label: 'Schede', icon: ListChecks },
  { to: '/timer', label: 'Timer', icon: Timer },
  { to: '/progressi', label: 'Progressi', icon: LineChart },
  { to: '/musica', label: 'Musica', icon: Music2 },
];

export default function AppLayout() {
  const { active } = useActiveSession();
  return (
    <div className="app">
      <main className="main"><Outlet /></main>

      {/* Timer e player stanno qui: restano visibili su tutte le pagine. */}
      <div className="dock-stack">
        <RestTimerBar />
        <MusicDock />
      </div>

      <nav className="bottom-nav">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'on' : '')}>
            <span className="nav-ico">
              <Icon size={22} />
              {to === '/' && active && <i className="nav-dot" />}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
