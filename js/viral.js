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
