// src/features/music/MusicDock.js
// Mini player fisso in basso. Anche da "ridotto" l'iframe resta montato (solo nascosto),
// così la riproduzione non si ferma.
import React from 'react';
import { ChevronDown, ChevronUp, X, Music2 } from 'lucide-react';
import { useMusic } from './MusicContext';

export default function MusicDock() {
  const { current, expanded, setExpanded, stop } = useMusic();
  if (!current) return null;

  return (
    <div className={`music-dock ${expanded ? '' : 'min'}`}>
      <div className="music-bar">
        <Music2 size={16} />
        <span className="ellipsis grow">{current.title}</span>
        <button className="icon-btn" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Riduci' : 'Espandi'}>
          {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
        <button className="icon-btn" onClick={stop} aria-label="Chiudi player"><X size={18} /></button>
      </div>
      <iframe
        key={current.id}
        title={current.title}
        src={current.embedUrl}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    </div>
  );
}
