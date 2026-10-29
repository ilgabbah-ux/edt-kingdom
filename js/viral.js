// Enduro Drinking Kingdom — tutto quello che fa tornare a giocare e far giocare gli amici:
// condivisione con immagine, sfida via link, album figurine, ruota della fortuna, forziere, gara del weekend.
import { CHARS } from './kingdom.js';

let X = {};   // contesto passato da game.js: save, persist, showCard, hideCard, I, SRC, sfx, toast, FX, beep, getNick, coinsUI, startLevel, fireworks
export function initViral(ctx) { X = ctx; if (!X.save.album) X.save.album = {}; if (!X.save.albumDone) X.save.albumDone = {}; }
const R = (a) => a[Math.floor(Math.random() * a.length)];
const esc = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------------- link del gioco ----------------
export function gameURL(params = null) {
  let base = 'https://ilgabbah-ux.github.io/edt-kingdom/';
  try { if (/^https?:/.test(location.protocol) && /github\.io$/.test(location.hostname)) base = location.origin + location.pathname; } catch { /* */ }
  return params ? base + '?' + new URLSearchParams(params).toString() : base;
}

// ---------------- immagine da condividere ----------------
function loadImg(n) { return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = X.SRC(n); }); }
function cover(ctx, im, W, H) { if (!im) return; const k = Math.max(W / im.width, H / im.height); const w = im.width * k, h = im.height * k; ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); }
function contain(ctx, im, x, y, w, h) { if (!im) return; const k = Math.min(w / im.width, h / im.height); const ww = im.width * k, hh = im.height * k; ctx.drawImage(im, x + (w - ww) / 2, y + (h - hh) / 2, ww, hh); }
function outlined(ctx, txt, x, y, size, fill, stroke = '#0e1d3d', font = 'EDT Display') {
  ctx.font = `${size}px "${font}", Impact, sans-serif`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  while (size > 30 && ctx.measureText(txt).width > 960) { size -= 4; ctx.font = `${size}px "${font}", Impact, sans-serif`; }
  ctx.lineWidth = size * .22; ctx.strokeStyle = stroke; ctx.strokeText(txt, x, y);
  ctx.fillStyle = fill; ctx.fillText(txt, x, y);
}
// opts: { bg, title, line1, stars (0-3), who, img (figurina), footer }
export async function makeCard(o) {
  try { await Promise.all([document.fonts.load('90px "EDT Display"'), document.fonts.load('800 40px "EDT Body"')]); } catch { /* */ }
  const W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const [bg, logo, star, face, pic] = await Promise.all([loadImg(o.bg || 'map_bg'), loadImg('edt_title'), loadImg('u_stella'), loadImg(CHARS[o.who || 'gabbah'].img), o.img ? loadImg(o.img) : null]);
  cover(ctx, bg, W, H);
  let g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(14,29,61,.75)'); g.addColorStop(.35, 'rgba(14,29,61,.15)'); g.addColorStop(.7, 'rgba(14,29,61,.35)'); g.addColorStop(1, 'rgba(8,16,36,.92)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // raggi dietro al centro
  ctx.save(); ctx.translate(W / 2, 900); ctx.globalAlpha = .18; ctx.fillStyle = '#ffe27a';
  for (let i = 0; i < 18; i++) { ctx.rotate(Math.PI / 9); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-60, -1100); ctx.lineTo(60, -1100); ctx.fill(); }
  ctx.restore();
  contain(ctx, logo, 140, 60, 800, 360);
  outlined(ctx, o.title, W / 2, 520, o.title.length > 18 ? 74 : 92, '#ffd34d');
  if (o.line1) outlined(ctx, o.line1, W / 2, 610, 54, '#ffffff', '#0e1d3d', 'EDT Body');
  if (o.stars) for (let k = 0; k < 3; k++) { ctx.globalAlpha = k < o.stars ? 1 : .25; contain(ctx, star, W / 2 - 330 + k * 230, 650, 200, 200); ctx.globalAlpha = 1; }
  if (pic) {
    ctx.save(); ctx.translate(W / 2, 1180); ctx.rotate(-.05);
    ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40; ctx.fillRect(-300, -380, 600, 760); ctx.shadowBlur = 0;
    ctx.drawImage(pic, -270, -350, 540, 640); ctx.restore();
  } else contain(ctx, face, 190, 880, 700, 760);
  // fascia in basso
  ctx.fillStyle = '#e8322a'; ctx.fillRect(0, 1640, W, 170);
  ctx.fillStyle = '#f2c94c'; ctx.fillRect(0, 1632, W, 10); ctx.fillRect(0, 1810, W, 10);
  outlined(ctx, o.footer || 'MI BATTI? 🍺', W / 2, 1745, 86, '#ffffff', '#7d120d');
  ctx.font = '800 38px "EDT Body", sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText('ilgabbah-ux.github.io/edt-kingdom', W / 2, 1885);
  return new Promise((res) => c.toBlob(res, 'image/jpeg', .88));
}

export async function shareImage(opts, text, url) {
  X.toast('Preparo l\'immagine…', 900);
  const blob = await makeCard(opts);
  const file = blob && new File([blob], 'enduro-drinking-kingdom.jpg', { type: 'image/jpeg' });
  const full = `${text} ${url}`;
  try {
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: full }); return; }
    if (navigator.share) { await navigator.share({ text, url }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  // computer: scarica l'immagine e copia il testo
  if (blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'enduro-drinking-kingdom.jpg'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  try { await navigator.clipboard.writeText(full); X.toast('Immagine scaricata e link copiato!', 1500); } catch { X.toast('Immagine scaricata!', 1200); }
}

// vittoria di un livello: immagine + link-sfida
export function shareWin(n, stars, bg) {
  const nick = X.getNick() || 'Un amico';
  const url = gameURL({ sfida: n, s: stars, da: nick });
  X.sfx.click();
  shareImage({ bg, title: `LIVELLO ${n} SUPERATO!`, line1: `${nick} ti sfida`, stars, who: R(['gabbah', 'miti', 'purcello', 'svetlana']), footer: 'MI BATTI? 🍺' },
    `🏍️🍺 Ho fatto ${stars} ⭐ al livello ${n} di Enduro Drinking Kingdom! Mi batti?`, url);
}

// ---------------- sfida via link ----------------
export function readChallenge() {
  try {
    const q = new URLSearchParams(location.search);
    const n = parseInt(q.get('sfida'), 10);
    if (n > 0 && n <= X.MAX_LEVEL) {
      X.save.challenge = { n, s: Math.min(3, Math.max(1, parseInt(q.get('s'), 10) || 1)), da: String(q.get('da') || 'Un amico').replace(/[<>"'`\\]/g, '').slice(0, 16) };
      X.persist();
      history.replaceState(null, '', location.pathname);
    }
  } catch { /* */ }
}
export function offerChallenge() {
  const ch = X.save.challenge; if (!ch) return false;
  X.showCard(`<h2>🏁 Sfida!</h2>${X.speakerHTML('gabbah', `<b>${esc(ch.da)}</b> ti sfida: fai almeno <b>${ch.s} ${X.IC_S}</b> al <b>livello ${ch.n}</b>. Ce la fai?`)}
    <div class="chstars">${[1, 2, 3].map((k) => `<i class="ic ic-star${k <= ch.s ? ' on' : ''}"></i>`).join('')}</div>
    <div class="row"><button id="cLater" class="btn btn-gray">Dopo</button><button id="cGo" class="btn btn-play">Accetto!</button></div>`, {
    cLater: X.hideCard,
    cGo: () => { X.hideCard(); X.startLevel(ch.n, [], null, true); },
  });
  return true;
}
// a fine livello: com'è andata la sfida
export function challengeResult(n, stars, won) {
  const ch = X.save.challenge;
  if (!ch || ch.n !== n) return '';
  if (won && stars >= ch.s) { X.save.challenge = null; X.persist(); return `<p class="chres ok">🏆 Sfida vinta contro <b>${esc(ch.da)}</b>!</p>`; }
  return `<p class="chres">${esc(ch.da)} ne ha fatte <b>${ch.s} ${X.IC_S}</b>: riprova!</p>`;
}

// ---------------- album figurine ----------------
export const PAGES = [
  { id: 'piloti', name: 'I piloti EDT', prize: 300, items: [
    ['gabbah', 'Il Gabbah', 'c_gabbah', 3], ['miti', 'Miti', 'c_miti', 2], ['mirco', 'Mirco', 'c_mirco', 1], ['purcello', 'Purcello', 'c_purcello', 1],
    ['costa', 'Costa', 'c_costa', 1], ['renard', 'Renard', 'c_renard', 1], ['svetlana', 'Svetlana', 'c_svetlana', 2], ['statua', 'La statua d\'oro', 'b_statua', 3]] },
  { id: 'forestale', name: 'La Forestale', prize: 250, items: [
    ['fo1', 'La Forestale', 'forestale', 1], ['fo2', 'Forestale col colbacco', 'forestale2', 2], ['fo3', 'Forestale del cantiere', 'forestale3', 2],
    ['multa', 'La multa', 'o_multa', 1], ['nastro', 'Cantiere chiuso', 'o_nastro', 1], ['catena', 'Catene da neve', 'o_catena', 1]] },
  { id: 'momenti', name: 'Momenti EDT', prize: 400, items: [
    ['m1', 'All\'alba nella valle', 'st1_1', 1], ['m2', 'La bandiera', 'st1_3', 1], ['m3', 'Tranquilli, è un giro easy', 'st1_5', 2], ['m4', 'Mirco gela', 'st2_3', 1],
    ['m5', 'La valanga', 'st3_1', 2], ['m6', 'La ruspa di Purcello', 'st3_4', 1], ['m7', 'Svetlana in concerto', 'st4_1', 2], ['m8', 'Foto di gruppo', 'st4_3', 3]] },
];
const RAR = { 1: ['Comune', 10], 2: ['Rara', 4], 3: ['D\'oro', 1] };
const ALL = PAGES.flatMap((p) => p.items.map(([id, name, img, r]) => ({ id, name, img, r, page: p })));
export const albumCount = () => ALL.filter((s) => X.save.album[s.id]).length;
export const albumTotal = () => ALL.length;
// pesca una figurina (le d'oro sono rare); restituisce { s, dup }
export function drawSticker() {
  const pool = ALL.flatMap((s) => Array(RAR[s.r][1]).fill(s));
  const s = R(pool);
  const dup = !!X.save.album[s.id];
  X.save.album[s.id] = (X.save.album[s.id] || 0) + 1;
  if (dup) X.save.coins += 15;
  X.persist();
  return { s, dup };
}
// figurina che si gira, poi eventuale premio della pagina completa
export function revealSticker(res) {
  return new Promise((done) => {
    const { s, dup } = res;
    const page = s.page, have = page.items.filter(([id]) => X.save.album[id]).length;
    const complete = have === page.items.length && !X.save.albumDone[page.id];
    X.showCard(`<h2>${dup ? 'Doppione!' : 'Nuova figurina!'}</h2>
      <div class="stk-flip r${s.r}"><div class="stk-back"></div><div class="stk-front"><i style="background-image:${X.I(s.img)}"></i><b>${s.name}</b><small>${RAR[s.r][0]}</small></div></div>
      <p>${dup ? 'Ce l\'avevi già: diventa <b>+15 monete</b>.' : `Pagina <b>${page.name}</b>: ${have}/${page.items.length}`}</p>
      <div class="row"><button id="cAlb" class="btn btn-gray">Album</button><button id="cOk" class="btn btn-play">Ok!</button></div>`, {
      cAlb: () => { X.hideCard(); openAlbum(PAGES.indexOf(page)); done(); },
      cOk: () => { X.hideCard(); if (complete) pageComplete(page).then(done); else done(); },
    });
    X.beep(660, .1, 'triangle', .1); setTimeout(() => { X.sfx.coin(); if (s.r > 1) X.fireworks(s.r === 3 ? 1600 : 700); }, 700);
  });
}
function pageComplete(page) {
  X.save.albumDone[page.id] = 1; X.save.coins += page.prize; X.save.inv.grappa = (X.save.inv.grappa || 0) + 1; X.persist();
  return new Promise((done) => {
    X.fireworks(2400);
    X.showCard(`<h2>Pagina completa!</h2><p>Hai tutta la pagina <b>${page.name}</b>!</p><p><b>+${page.prize} monete</b> e una <b>Grappa</b> per il prossimo livello.</p>
      <div class="row"><button id="cSh" class="btn btn-gray">📣 Condividi</button><button id="cOk" class="btn btn-play">Grande!</button></div>`, {
      cSh: () => shareImage({ title: 'PAGINA COMPLETA!', line1: page.name, img: page.items[page.items.length - 1][2], who: 'gabbah', footer: 'TU A CHE PUNTO SEI?' }, `📒 Ho completato la pagina "${page.name}" dell'album di Enduro Drinking Kingdom!`, gameURL()),
      cOk: () => { X.hideCard(); X.coinsUI(); done(); },
    });
  });
}
export function openAlbum(pi = 0) {
  const p = PAGES[pi];
  const tabs = PAGES.map((pp, i) => `<button class="gtab${i === pi ? ' on' : ''}" data-p="${i}">${pp.name}${X.save.albumDone[pp.id] ? ' ✓' : ''}</button>`).join('');
  const grid = p.items.map(([id, name, img, r]) => X.save.album[id]
    ? `<div class="stk r${r}"><i style="background-image:${X.I(img)}"></i><b>${name}</b>${X.save.album[id] > 1 ? `<em>x${X.save.album[id]}</em>` : ''}</div>`
    : `<div class="stk empty r${r}"><i></i><b>?</b></div>`).join('');
  const have = p.items.filter(([id]) => X.save.album[id]).length;
  X.showCard(`<h2>Album EDT</h2><div class="gtabs">${tabs}</div>
    <p class="small">${have}/${p.items.length} figurine · completa la pagina: <b>+${p.prize} monete</b> · le trovi vincendo i livelli</p>
    <div class="stkgrid">${grid}</div>
    <div class="row"><button id="cClose" class="btn btn-play">Chiudi</button></div>`, { cClose: X.hideCard });
  document.querySelectorAll('.gtab[data-p]').forEach((b) => { b.onclick = () => { X.sfx.click(); openAlbum(+b.dataset.p); }; });
}

// ---------------- ruota della fortuna (premio del giorno) ----------------
const WHEEL = [
  { t: '50', coins: 50, w: 6, c: '#2f5fa8' }, { t: 'Moto', p: 'mH', w: 4, c: '#e8322a' }, { t: '100', coins: 100, w: 4, c: '#ffffff' },
  { t: 'Figurina', stk: 1, w: 4, c: '#ffd34d' }, { t: '25', coins: 25, w: 6, c: '#2f5fa8' }, { t: 'Tanica', p: 'bomb', w: 3, c: '#e8322a' },
  { t: '200', coins: 200, w: 2, c: '#ffffff' }, { t: 'Grappa', p: 'grappa', w: 1, c: '#ffd34d' },
];
const P_NAME = { mH: 'Moto', bomb: 'Tanica', grappa: 'Grappa' };
export function spinWheel(streak, onDone) {
  const n = WHEEL.length, seg = 360 / n;
  const grad = WHEEL.map((s, i) => `${s.c} ${i * seg}deg ${(i + 1) * seg}deg`).join(',');
  const labels = WHEEL.map((s, i) => `<span style="transform:rotate(${i * seg + seg / 2}deg)"><b style="color:${s.c === '#ffffff' || s.c === '#ffd34d' ? '#1b3566' : '#fff'}">${s.p ? `<i style="background-image:${X.I({ mH: 'p_moto', bomb: 'p_tanica', grappa: 'p_grappa' }[s.p])}"></i>` : s.stk ? '📒' : `${s.t}<i class="ic ic-coin"></i>`}</b></span>`).join('');
  const spins = streak >= 7 ? 2 : 1;
  X.showCard(`<h2>Ruota del Giro Easy</h2><p>${streak > 1 ? `Sei tornato <b>${streak} giorni di fila</b>!` : 'Torna ogni giorno a girarla!'}${spins > 1 ? ' Oggi giri <b>due volte</b>!' : ''}</p>
    <div class="wheelbox"><div class="wptr"></div><div class="wheel" id="wheel" style="background:conic-gradient(${grad})">${labels}<div class="whub"></div></div></div>
    <div class="row"><button id="cSpin" class="btn btn-play">GIRA!</button></div>`, { cSpin: () => go(spins) });
  let rot = 0, busy = false;
  function go(left) {
    if (busy) return; busy = true;
    const btn = document.getElementById('cSpin'); if (btn) btn.disabled = true;
    const pool = WHEEL.flatMap((s, i) => Array(s.w).fill(i));
    const idx = R(pool);
    const target = 360 * 6 + (360 - (idx * seg + seg / 2)) + (Math.random() - .5) * seg * .6;
    rot += target - (rot % 360);
    const w = document.getElementById('wheel');
    w.style.transition = 'transform 4.2s cubic-bezier(.12,.75,.15,1)'; w.style.transform = `rotate(${rot}deg)`;
    let tick = 0; const ti = setInterval(() => { X.beep(900 - tick * 12, .02, 'square', .03); if (++tick > 40) clearInterval(ti); }, 95);
    setTimeout(() => {
      const s = WHEEL[idx];
      let msg;
      if (s.coins) { X.save.coins += s.coins; msg = `+${s.coins} monete`; }
      if (s.p) { X.save.inv[s.p] = (X.save.inv[s.p] || 0) + 1; msg = `+1 ${P_NAME[s.p]}`; }
      X.persist(); X.coinsUI(); X.sfx.coin(); X.fireworks(800);
      if (s.stk) { X.hideCard(); revealSticker(drawSticker()).then(() => (left > 1 ? spinWheel(1, onDone) : onDone && onDone())); return; }
      X.FX.banner(msg, s.p ? 'la trovi a inizio livello' : '', '#ffd34d');
      busy = false;
      if (left > 1) { const b = document.getElementById('cSpin'); if (b) { b.disabled = false; b.textContent = 'GIRA ANCORA!'; b.onclick = () => go(left - 1); } }
      else { const b = document.getElementById('cSpin'); if (b) { b.disabled = false; b.textContent = 'Ritira!'; b.onclick = () => { X.hideCard(); onDone && onDone(); }; } }
    }, 4400);
  }
}

// ---------------- forziere ogni 3 vittorie di fila ----------------
export function chestTick(won) {
  X.save.winRow = won ? (X.save.winRow || 0) + 1 : 0;
  X.persist();
  return won && X.save.winRow >= 3;
}
export function openChest() {
  X.save.winRow = 0;
  const p = R(['mH', 'bomb', 'grappa', 'mH', 'bomb']);
  X.save.coins += 150; X.save.inv[p] = (X.save.inv[p] || 0) + 1; X.persist();
  return new Promise((done) => {
    X.showCard(`<h2>Forziere EDT!</h2><p>3 vittorie di fila!</p><div class="chest" id="chest"><i class="lid"></i><i class="box"></i></div>
      <p id="chestTxt" style="opacity:0"><b>+150 monete</b> · <b>+1 ${P_NAME[p]}</b> · <b>+1 figurina</b></p>
      <div class="row"><button id="cOk" class="btn btn-play">Apri!</button></div>`, {
      cOk: () => {
        const ch = document.getElementById('chest');
        if (!ch.classList.contains('open')) {
          ch.classList.add('open'); X.sfx.build(); X.fireworks(1400);
          document.getElementById('chestTxt').style.opacity = 1;
          document.getElementById('cOk').textContent = 'Prendi!';
          return;
        }
        X.hideCard(); X.coinsUI(); revealSticker(drawSticker()).then(done);
      },
    });
  });
}

// ---------------- gara del weekend ----------------
// il weekend va da venerdì a domenica; id = numero del venerdì (giorni dal 1970 / 7)
export function weekendInfo(d = new Date()) {
  const day = d.getDay();
  const active = day === 5 || day === 6 || day === 0;
  const fri = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((day + 2) % 7));
  const id = Math.floor(Date.UTC(fri.getFullYear(), fri.getMonth(), fri.getDate()) / 864e5 / 7);
  return { active, id: active ? id : id, last: active ? id - 1 : id, next: active ? null : new Date(fri.getTime() + 7 * 864e5) };
}
export function weekendPoints(gain) {
  const w = weekendInfo();
  if (!w.active) return 0;
  if (!X.save.we || X.save.we.id !== w.id) X.save.we = { id: w.id, pts: 0 };
  X.save.we.pts += gain;
  X.persist();
  return X.save.we.pts;
}

// ---------------- trasferire i progressi su un altro telefono / iPad ----------------
const b64u = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
async function pack(obj) {
  const txt = new TextEncoder().encode(JSON.stringify(obj));
  if (window.CompressionStream) {
    const cs = new Blob([txt]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return 'z' + b64u(new Uint8Array(await new Response(cs).arrayBuffer()));
  }
  return 'j' + b64u(txt);
}
async function unpack(s) {
  const raw = unb64u(s.slice(1));
  if (s[0] === 'z') { const ds = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return JSON.parse(await new Response(ds).text()); }
  return JSON.parse(new TextDecoder().decode(raw));
}
export async function shareProgress() {
  const keep = { ...X.save }; delete keep.run; delete keep.challenge;
  const code = await pack({ v: 1, save: keep, nick: X.getNick(), code: X.getCode() });
  const url = gameURL({ salva: code });
  const text = 'Apri questo link sull\'altro telefono o iPad per portarti dietro i progressi di Enduro Drinking Kingdom:';
  try { if (navigator.share) { await navigator.share({ text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); X.toast('Link copiato! Incollalo sull\'altro dispositivo', 1800); } catch { prompt('Copia questo link:', url); }
}
export async function readProgressLink() {
  let code = null;
  try { code = new URLSearchParams(location.search).get('salva'); } catch { /* */ }
  if (!code) return false;
  try { history.replaceState(null, '', location.pathname); } catch { /* */ }
  let data;
  try { data = await unpack(code); } catch { X.toast('Link dei progressi non valido', 1500); return false; }
  if (!data || !data.save) return false;
  const s = data.save;
  X.showCard(`<h2>Progressi trovati</h2><p>Livello <b>${Math.min(s.level || 1, X.MAX_LEVEL)}</b> · <b>${s.coins || 0}</b> monete${data.nick ? ` · nome <b>${esc(data.nick)}</b>` : ''}.</p>
    <p>Li carico su questo dispositivo? Quelli che ci sono adesso (livello <b>${X.save.level || 1}</b>) vengono sostituiti.</p>
    <div class="row"><button id="cNo" class="btn btn-gray">No</button><button id="cYes" class="btn btn-play">Sì, caricali</button></div>`, {
    cNo: X.hideCard,
    cYes: () => { X.replaceSave(s, data.nick, data.code); },
  });
  return true;
}

// ---------------- eventi a data (Halloween, Natale, Oktoberfest) ----------------
// durante l'evento alcune tessere portano un simbolo: toglile per riempire la barra e ritirare i premi
export const EVENTS = [
  { id: 'halloween', name: 'Halloween EDT', item: 'zucche', one: 'zucca', img: 'e_zucca', from: [10, 20], to: [11, 5], color: '#ff7a1a', who: 'gabbah',
    intro: 'Dolcetto o multetto? Nei livelli spuntano le <b>zucche col casco</b>: toglile e vinci i premi di Halloween!' },
  { id: 'natale', name: 'Natale EDT', item: 'regali', one: 'regalo', img: 'e_regalo', from: [12, 8], to: [1, 6], color: '#2f8fd3', who: 'svetlana',
    intro: 'Babbo Natale ha perso i regali sul sentiero! Raccoglili nei livelli e vinci i premi di Natale.' },
  { id: 'oktoberfest', name: 'Oktoberfest EDT', item: 'brezel', one: 'brezel', img: 'e_brezel', from: [9, 18], to: [10, 6], color: '#3d8bff', who: 'purcello',
    intro: 'O\'zapft is! Nei livelli trovi i <b>brezel</b>: raccoglili e vinci i premi dell\'Oktoberfest.' },
];
export const EV_STEPS = [
  { n: 10, coins: 100 }, { n: 25, p: 'mH' }, { n: 45, coins: 200, stk: 1 }, { n: 70, p: 'bomb' }, { n: 100, coins: 400, p: 'grappa', stk: 1 },
];
const inRange = (d, [m1, d1], [m2, d2]) => {
  const v = (d.getMonth() + 1) * 100 + d.getDate(), a = m1 * 100 + d1, b = m2 * 100 + d2;
  return a <= b ? v >= a && v <= b : v >= a || v <= b;
};
export function currentEvent(d = new Date()) {
  try { const f = new URLSearchParams(location.search).get('evento'); if (f) return EVENTS.find((e) => e.id === f) || null; } catch { /* */ }
  return EVENTS.find((e) => inRange(d, e.from, e.to)) || null;
}
function evState(ev) {
  const yr = new Date().getFullYear() - (ev.id === 'natale' && new Date().getMonth() === 0 ? 1 : 0);
  const id = ev.id + yr;
  if (!X.save.ev || X.save.ev.id !== id) { X.save.ev = { id, n: 0, got: 0 }; X.persist(); }
  return X.save.ev;
}
export function eventProgress() { const ev = currentEvent(); return ev ? { ev, st: evState(ev) } : null; }
// +n oggetti dell'evento; restituisce i premi appena sbloccati
export function eventGain(n = 1) {
  const ev = currentEvent(); if (!ev) return [];
  const st = evState(ev); st.n += n;
  const out = [];
  while (st.got < EV_STEPS.length && st.n >= EV_STEPS[st.got].n) {
    const r = EV_STEPS[st.got]; st.got++;
    if (r.coins) X.save.coins += r.coins;
    if (r.p) X.save.inv[r.p] = (X.save.inv[r.p] || 0) + 1;
    out.push(r);
  }
  X.persist();
  return out;
}
const rewardTxt = (r) => [r.coins ? `+${r.coins} monete` : '', r.p ? `+1 ${P_NAME[r.p]}` : '', r.stk ? '+1 figurina' : ''].filter(Boolean).join(' · ');
export function eventRewardsPopup(list) {
  if (!list.length) return Promise.resolve();
  const ev = currentEvent();
  const stk = list.some((r) => r.stk);
  return new Promise((done) => {
    X.fireworks(1400);
    X.showCard(`<h2>${ev.name}</h2><div class="evbig" style="background-image:${X.I(ev.img)}"></div><p>Premio sbloccato!</p><p><b>${list.map(rewardTxt).join('<br>')}</b></p>
      <div class="row"><button id="cOk" class="btn btn-play">Grande!</button></div>`, { cOk: () => { X.hideCard(); X.coinsUI(); if (stk) revealSticker(drawSticker()).then(done); else done(); } });
  });
}
export function openEvent() {
  const p = eventProgress(); if (!p) return;
  const { ev, st } = p;
  const max = EV_STEPS[EV_STEPS.length - 1].n;
  const marks = EV_STEPS.map((r, i) => `<div class="evm${i < st.got ? ' got' : ''}" style="left:${r.n / max * 100}%"><i></i><small>${r.n}</small></div>`).join('');
  const list = EV_STEPS.map((r, i) => `<div class="evr${i < st.got ? ' got' : ''}"><b>${r.n}</b><span>${rewardTxt(r)}</span><i>${i < st.got ? '✓' : ''}</i></div>`).join('');
  const end = new Date(new Date().getFullYear() + (ev.to[0] < ev.from[0] && new Date().getMonth() + 1 >= ev.from[0] ? 1 : 0), ev.to[0] - 1, ev.to[1], 23, 59);
  const days = Math.max(0, Math.ceil((end - new Date()) / 864e5));
  X.showCard(`<h2>${ev.name}</h2>${X.speakerHTML(ev.who, ev.intro)}
    <div class="evbar"><div class="evfill" style="width:${Math.min(100, st.n / max * 100)}%;background:${ev.color}"></div>${marks}</div>
    <p class="evcount"><span class="evico" style="background-image:${X.I(ev.img)}"></span> <b>${st.n}</b> ${ev.item} · finisce tra <b>${days} ${days === 1 ? 'giorno' : 'giorni'}</b></p>
    <div class="evlist">${list}</div>
    <div class="row"><button id="cClose" class="btn btn-play">Gioca!</button></div>`, { cClose: X.hideCard });
}

// ---------------- il tuo pilota: personaggio e colore del casco (si vede in classifica) ----------------
export const PILOTS = ['gabbah', 'miti', 'mirco', 'purcello', 'costa', 'renard', 'svetlana'];
export const HELMETS = ['#e8322a', '#2f5fa8', '#ffd34d', '#4fd25f', '#ff4fa3', '#8a4fff', '#ff7a1a', '#ffffff'];
export function me() { if (!X.save.me) X.save.me = { who: 'gabbah', col: 1 }; return X.save.me; }
export const riderTag = () => `EDTK|${me().who}|${me().col}`;
export function parseRider(r) { const m = /^EDTK\|(\w+)\|(\d+)/.exec(r || ''); return m && CHARS[m[1]] ? { who: m[1], col: +m[2] } : null; }
export function avatarHTML(p, size = 34) {
  if (!p) return `<span class="rkav" style="width:${size}px;height:${size}px"></span>`;
  return `<span class="rkav" style="width:${size}px;height:${size}px;background-image:${X.I(CHARS[p.who].img)};box-shadow:0 0 0 3px ${HELMETS[p.col] || HELMETS[1]}"></span>`;
}
export function openPilot(onDone) {
  const m = me();
  const faces = PILOTS.map((w) => `<button class="pilot${w === m.who ? ' on' : ''}" data-w="${w}" style="background-image:${X.I(CHARS[w].img)}"></button>`).join('');
  const cols = HELMETS.map((c, i) => `<button class="hcol${i === m.col ? ' on' : ''}" data-c="${i}" style="background:${c}"></button>`).join('');
  X.showCard(`<h2>Il tuo pilota</h2><p>Scegli chi sei e il colore del casco: ti vedono così in classifica.</p>
    <div class="pilotprev">${avatarHTML(m, 86)}<b>${X.getNick() || 'Tu'}</b></div>
    <div class="pilots">${faces}</div><div class="hcols">${cols}</div>
    <div class="row"><button id="cOk" class="btn btn-play">Fatto</button></div>`, { cOk: () => { X.hideCard(); onDone && onDone(); } });
  document.querySelectorAll('.pilot').forEach((b) => { b.onclick = () => { m.who = b.dataset.w; X.persist(); X.sfx.click(); openPilot(onDone); }; });
  document.querySelectorAll('.hcol').forEach((b) => { b.onclick = () => { m.col = +b.dataset.c; X.persist(); X.sfx.click(); openPilot(onDone); }; });
}

// ---------------- video della vittoria (6 secondi, verticale) per TikTok / Reels ----------------
export async function makeVideo(o) {
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) throw new Error('nosupport');
  const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  const mime = types.find((t) => MediaRecorder.isTypeSupported(t));
  if (!mime) throw new Error('nosupport');
  try { await Promise.all([document.fonts.load('90px "EDT Display"'), document.fonts.load('800 40px "EDT Body"')]); } catch { /* */ }
  const W = 720, H = 1280, c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const [bg, logo, star, face] = await Promise.all([loadImg(o.bg || 'map_bg'), loadImg('edt_title'), loadImg('u_stella'), loadImg(CHARS[o.who || 'gabbah'].img)]);
  const stream = c.captureStream(30);
  // audio: fanfara di vittoria
  let actx = null;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = actx.createMediaStreamDestination();
    const buf = await fetch((window.__V && window.__V.j_win) || 'audio/j_win.mp3').then((r) => r.arrayBuffer()).then((a) => actx.decodeAudioData(a));
    const src = actx.createBufferSource(); src.buffer = buf; src.connect(dest); src.start(actx.currentTime + 0.3);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  } catch { /* video senza audio */ }
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4e6 });
  const chunks = []; rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const parts = [];
  const DUR = 6000, t0 = performance.now();
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const pop = (x) => { x = Math.min(1, Math.max(0, x)); return x < .6 ? ease(x / .6) * 1.15 : 1.15 - (x - .6) / .4 * .15; };
  rec.start(100);
  await new Promise((res) => {
    const frame = (now) => {
      const t = now - t0, k = t / 1000;
      const z = 1.08 + k * 0.03;
      const bw = W * z, bh = bw * (bg ? bg.height / bg.width : 1);
      ctx.drawImage(bg, (W - bw) / 2, (H - Math.max(bh, H * z)) / 2, bw, Math.max(bh, H * z));
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(14,29,61,.7)'); g.addColorStop(.45, 'rgba(14,29,61,.15)'); g.addColorStop(1, 'rgba(8,16,36,.9)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // raggi
      ctx.save(); ctx.translate(W / 2, 600); ctx.rotate(k * .25); ctx.globalAlpha = .16; ctx.fillStyle = '#ffe27a';
      for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-45, -900); ctx.lineTo(45, -900); ctx.fill(); }
      ctx.restore();
      // logo che cade
      const ly = -260 + ease(k / .6) * 300;
      contain(ctx, logo, 110, ly, 500, 230);
      // titolo
      const ts = pop((k - .6) / .5);
      if (ts > 0) { ctx.save(); ctx.translate(W / 2, 360); ctx.scale(ts, ts); outlined(ctx, o.title, 0, 0, 64, '#ffd34d'); ctx.restore(); }
      if (k > 1.1 && o.line1) { ctx.globalAlpha = Math.min(1, (k - 1.1) * 3); outlined(ctx, o.line1, W / 2, 425, 38, '#fff', '#0e1d3d', 'EDT Body'); ctx.globalAlpha = 1; }
      // stelle una alla volta con scintille
      for (let s2 = 0; s2 < 3; s2++) {
        const st = k - 1.4 - s2 * .35; const sc = pop(st / .4);
        const sx = W / 2 - 200 + s2 * 200, sy = 540;
        if (s2 < o.stars && sc > 0) {
          ctx.save(); ctx.translate(sx, sy); ctx.scale(sc, sc); ctx.rotate((1 - Math.min(1, st / .4)) * -1.2); contain(ctx, star, -80, -80, 160, 160); ctx.restore();
          if (st > 0 && st < .25 && parts.length < 300) for (let i = 0; i < 14; i++) parts.push({ x: sx, y: sy, vx: (Math.random() - .5) * 18, vy: (Math.random() - .7) * 18, l: 1, c: ['#ffd34d', '#fff', '#e8322a', '#2f5fa8'][i % 4] });
        } else { ctx.globalAlpha = .25; contain(ctx, star, sx - 70, sy - 70, 140, 140); ctx.globalAlpha = 1; }
      }
      // personaggio che entra
      const fx = W - ease((k - 2.2) / .6) * 560 - 40;
      if (k > 2.2) contain(ctx, face, fx - 180, 660, 560, 500);
      // coriandoli
      if (k > 2.4 && parts.length < 300) parts.push({ x: Math.random() * W, y: -10, vx: (Math.random() - .5) * 3, vy: 4 + Math.random() * 4, l: 2.5, c: ['#ffd34d', '#fff', '#e8322a', '#2f5fa8'][Math.floor(Math.random() * 4)], r: 1 });
      for (const p of parts) { p.x += p.vx; p.y += p.vy; if (!p.r) p.vy += .6; p.l -= 1 / 30; ctx.globalAlpha = Math.max(0, Math.min(1, p.l)); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.r ? 10 : 7, p.r ? 6 : 7); }
      ctx.globalAlpha = 1;
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].l <= 0 || parts[i].y > H) parts.splice(i, 1);
      // fascia finale
      if (k > 3.4) {
        const fy = H - ease((k - 3.4) / .4) * 210;
        ctx.fillStyle = '#f2c94c'; ctx.fillRect(0, fy - 6, W, 6);
        ctx.fillStyle = '#e8322a'; ctx.fillRect(0, fy, W, 130);
        outlined(ctx, o.footer || 'MI BATTI? 🍺', W / 2, fy + 88, 62, '#fff', '#7d120d');
        ctx.fillStyle = '#0e1d3d'; ctx.fillRect(0, fy + 130, W, 80);
        ctx.font = '800 28px "EDT Body", sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('ilgabbah-ux.github.io/edt-kingdom', W / 2, fy + 180);
      }
      if (t < DUR) requestAnimationFrame(frame); else res();
    };
    requestAnimationFrame(frame);
  });
  await new Promise((res) => { rec.onstop = res; rec.stop(); });
  try { actx && actx.close(); } catch { /* */ }
  return new Blob(chunks, { type: mime.split(';')[0] });
}
export async function shareVideo(n, stars, bg) {
  X.toast('Preparo il video… (6 secondi)', 2500);
  let blob;
  try { blob = await makeVideo({ bg, title: `LIVELLO ${n} SUPERATO!`, line1: `${X.getNick() || 'Io'} ti sfida`, stars, who: me().who }); } catch { X.toast('Questo telefono non sa registrare il video: uso l\'immagine', 1800); shareWin(n, stars, bg); return; }
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const file = new File([blob], `enduro-drinking-kingdom-livello-${n}.${ext}`, { type: blob.type });
  const url = gameURL({ sfida: n, s: stars, da: X.getNick() || 'Un amico' });
  const text = `🏍️🍺 Livello ${n} di Enduro Drinking Kingdom con ${stars} ⭐! Mi batti?`;
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: `${text} ${url}` }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  try { await navigator.clipboard.writeText(`${text} ${url}`); } catch { /* */ }
  X.toast('Video salvato! Caricalo su TikTok o Reels', 1800);
}
