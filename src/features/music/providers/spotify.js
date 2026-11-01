// src/features/music/providers/spotify.js
// Provider Spotify — FASE 1: incolla un link e lo riproduci con il player incorporato.
// Funziona senza chiavi né backend. Con Spotify Premium (e login a Spotify nel browser)
// il player riproduce i brani interi, altrimenti anteprime di 30 secondi.
//
// FASE 2 (futuro): collegamento vero all'account (OAuth PKCE + Web API) per elencare le
// tue playlist e controllare la riproduzione dall'app. Richiede di creare un'app su
// developer.spotify.com e usare il suo Client ID; si aggiunge qui senza toccare il resto,
// completando questo provider con `connect()` e `listPlaylists()`.
const KINDS = ['playlist', 'album', 'track', 'artist', 'episode', 'show'];

export const spotify = {
  id: 'spotify',
  name: 'Spotify',

  // Accetta link web (anche con /intl-it/ e ?si=…) e URI "spotify:playlist:ID".
  parseLink(input) {
    const text = (input || '').trim();
    let kind;
    let externalId;

    const uri = text.match(/^spotify:([a-z]+):([A-Za-z0-9]+)$/);
    if (uri) {
      [, kind, externalId] = uri;
    } else {
      try {
        const u = new URL(text);
        if (u.hostname !== 'open.spotify.com') return null;
        const parts = u.pathname.split('/').filter(Boolean).filter((p) => !p.startsWith('intl-'));
        [kind, externalId] = parts;
      } catch {
        return null;
      }
    }
    if (!KINDS.includes(kind) || !/^[A-Za-z0-9]+$/.test(externalId || '')) return null;

    return {
      provider: 'spotify',
      kind,
      externalId,
      url: `https://open.spotify.com/${kind}/${externalId}`,
      embedUrl: `https://open.spotify.com/embed/${kind}/${externalId}?utm_source=generator&theme=0`,
    };
  },

  // Titolo "ufficiale" tramite oEmbed pubblico; se non risponde si usa quello scritto a mano.
  async fetchTitle(url) {
    try {
      const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      return (await res.json()).title || null;
    } catch {
      return null;
    }
  },
};
