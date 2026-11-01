// src/features/music/providers/index.js
// Registro dei servizi musicali. Per aggiungerne uno (es. Apple Music) basta un nuovo file
// con la stessa forma di `spotify.js` ({ id, name, parseLink }) e una riga qui sotto.
import { spotify } from './spotify';

export const providers = [spotify];

export function parseAnyLink(input) {
  for (const p of providers) {
    const parsed = p.parseLink(input);
    if (parsed) return { provider: p, ...parsed };
  }
  return null;
}

export const providerById = (id) => providers.find((p) => p.id === id);
