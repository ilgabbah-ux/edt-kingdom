// Classifica EDT online. Usa la stessa app web (Google Apps Script + foglio) della classifica di EDT Giro Easy:
// EDT Kingdom scrive nel "percorso" 19, che Giro Easy non usa. Stessi nomi protetti col codice del telefono,
// e su ilgabbah-ux.github.io nome e codice sono già quelli di Giro Easy.
// Punteggio = stelle * 100 + livello raggiunto (vince chi ha più stelle, a parità chi è più avanti).
const API = 'https://script.google.com/macros/s/AKfycbxb8Ky6HSkHLF01ZT-ku_oGIVbS9Fl2pFT427gk38hx_mCL_DQn81IqEl3OtTKykeY/exec';
export const MODE = 19;
const NICK_KEY = 'edt-giro-easy-nick', CODE_KEY = 'edt-giro-easy-code';

const ls = {
  get: (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* */ } },
};
export function getCode() {
  let c = ls.get(CODE_KEY);
  if (!c) { c = Array.from({ length: 6 }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)]).join(''); ls.set(CODE_KEY, c); }
  return c;
}
export const getNick = () => ls.get(NICK_KEY);
export const cleanNick = (n) => String(n || '').replace(/[<>"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
export const setNick = (n) => ls.set(NICK_KEY, cleanNick(n));
const dayISO = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

function jsonp(url, ms = 20000) {
  return new Promise((resolve, reject) => {
    const cb = '__edtk' + Math.random().toString(36).slice(2);
    const s = document.createElement('script');
    const done = (fn, v) => { clearTimeout(t); delete window[cb]; s.remove(); fn(v); };
    const t = setTimeout(() => done(reject, new Error('timeout')), ms);
    window[cb] = (data) => done(resolve, data);
    s.onerror = () => done(reject, new Error('script'));
    s.src = url + '&callback=' + cb;
    document.head.appendChild(s);
  });
}
async function call(params) {
  const url = API + '?' + new URLSearchParams({ minv: 0, act: String(MODE), grp: 'edt', day: dayISO(), ...params }).toString();
  let data;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow' }); clearTimeout(t);
    data = await r.json();
  } catch { data = await jsonp(url); }
  if (!data || !data.ok) throw new Error('risposta');
  return data;
}
const listOf = (d) => ((d.boards && d.boards[MODE]) || []).map((e) => ({ name: e.n, stars: Math.floor(e.s / 100), level: e.s % 100 }));

export async function top() { return listOf(await call({ action: 'top' })); }
export async function submit(stars, level) {
  const name = getNick();
  if (!name || stars <= 0) return null;
  const d = await call({ action: 'add', name, score: stars * 100 + Math.min(99, level), mode: MODE, rider: 'EDT Kingdom', time: 0, win: 0, v: '1', k: getCode() });
  return { taken: !!d.taken, list: listOf(d) };
}

// ---- gara del weekend: percorso 18 (libero in Giro Easy). Punteggio = id del weekend * 1000 + punti del weekend,
// così il weekend nuovo supera sempre il vecchio; i punti si leggono con s % 1000, il weekend con s / 1000.
export const WE_MODE = 18;
const weOf = (d) => ((d.boards && d.boards[WE_MODE]) || []).map((e) => ({ name: e.n, id: Math.floor(e.s / 1000), pts: e.s % 1000 }));
export async function weTop() { return weOf(await call({ action: 'top', act: String(WE_MODE) })); }
export async function weSubmit(id, pts) {
  const name = getNick();
  if (!name || pts <= 0) return null;
  const d = await call({ action: 'add', act: String(WE_MODE), name, score: id * 1000 + Math.min(999, pts), mode: WE_MODE, rider: 'EDT Kingdom weekend', time: 0, win: 0, v: '1', k: getCode() });
  return { taken: !!d.taken, list: weOf(d) };
}
