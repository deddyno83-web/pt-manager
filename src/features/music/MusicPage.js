// src/features/music/MusicPage.js
import React, { useState } from 'react';
import { Play, Trash2, Plus, Music2 } from 'lucide-react';
import { useMusic } from './MusicContext';

export default function MusicPage() {
  const { playlists, loading, current, play, savePlaylist, removePlaylist } = useMusic();
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await savePlaylist(link, title);
    setBusy(false);
    if (res.ok) { setLink(''); setTitle(''); } else setError(res.error);
  };

  return (
    <div className="page">
      <header className="page-head"><h1>Musica</h1></header>

      <form className="card" onSubmit={submit}>
        <h3 className="section-title" style={{ marginTop: 0 }}>Aggiungi una playlist Spotify</h3>
        <input
          className="input"
          placeholder="Incolla il link (open.spotify.com/playlist/…)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <input
          className="input"
          placeholder="Nome (facoltativo)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary block" disabled={!link.trim() || busy}>
          <Plus size={16} /> {busy ? 'Salvo…' : 'Salva'}
        </button>
        <p className="muted small">
          In Spotify: playlist → ⋯ → Condividi → Copia link. Il player resta attivo mentre ti muovi nell’app.
          Per i brani interi serve Spotify Premium con login nel browser, altrimenti sono anteprime di 30 secondi.
        </p>
      </form>

      <h3 className="section-title">Le tue playlist</h3>
      {!loading && playlists.length === 0 && <p className="muted pad">Nessuna playlist salvata.</p>}
      {playlists.map((p) => (
        <div key={p.id} className={`card music-row ${current?.id === p.id ? 'playing' : ''}`}>
          <Music2 size={20} />
          <div className="grow">
            <b className="ellipsis">{p.title}</b>
            <small className="muted">Spotify · {p.kind}</small>
          </div>
          <button className="btn btn-primary" onClick={() => play(p)}><Play size={16} /> Play</button>
          <button className="icon-btn faint" onClick={() => window.confirm('Rimuovere la playlist?') && removePlaylist(p.id)} aria-label="Rimuovi">
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <div className="card soon">
        <b>Prossimamente</b>
        <ul>
          <li>Collegamento all’account Spotify: elenco automatico delle tue playlist e controlli play/pausa dall’app.</li>
          <li>Smartwatch (Apple Watch / Salute): frequenza cardiaca e calorie dentro ogni allenamento.</li>
        </ul>
      </div>
    </div>
  );
}
