// src/features/music/MusicContext.js
// Playlist salvate + brano/playlist in riproduzione. Sta sopra le pagine: la musica non si
// interrompe quando cambi schermata, perché il player (MusicDock) resta montato.
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useUserCollection } from '../../core/useUserCollection';
import { parseAnyLink } from './providers';

const Ctx = createContext(null);
export const useMusic = () => useContext(Ctx);

export function MusicProvider({ children }) {
  const { items, loading, add, remove } = useUserCollection('playlists', { orderField: 'createdAt', direction: 'desc' });
  const [current, setCurrent] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const play = useCallback((playlist) => {
    setCurrent(playlist);
    setExpanded(true);
  }, []);

  const stop = useCallback(() => setCurrent(null), []);

  // Salva un link; ritorna { ok, error }.
  const savePlaylist = useCallback(async (link, title) => {
    const parsed = parseAnyLink(link);
    if (!parsed) return { ok: false, error: 'Link non riconosciuto. Incolla un link di Spotify (open.spotify.com/…).' };
    const finalTitle = title.trim() || (await parsed.provider.fetchTitle?.(parsed.url)) || `${parsed.provider.name} · ${parsed.kind}`;
    const data = {
      provider: parsed.provider.id,
      kind: parsed.kind,
      externalId: parsed.externalId,
      url: parsed.url,
      embedUrl: parsed.embedUrl,
      title: finalTitle,
    };
    add(data);
    return { ok: true };
  }, [add]);

  const removePlaylist = useCallback((id) => {
    setCurrent((c) => (c && c.id === id ? null : c));
    remove(id);
  }, [remove]);

  const value = useMemo(() => ({
    playlists: items, loading, current, expanded, setExpanded, play, stop, savePlaylist, removePlaylist,
  }), [items, loading, current, expanded, play, stop, savePlaylist, removePlaylist]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
