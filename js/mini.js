// Minigiochi "Pausa": ogni 5 livelli nuovi si sblocca una partita a uno dei due minigiochi (a rotazione, uno al giorno).
// Premi solo in monete (niente stelle: il regno non si sballa). Classifica della settimana sul percorso 16.
import { L } from './i18n.js';
import { CHARS } from './kingdom.js';

let X = null;
export const MINI_EVERY = 5;
const GAMES = ['trapano', 'memory'];
const NAMES = () => ({ trapano: L`Il trapano di Gusta`, memory: L`Memory dei piloti` });
const ICONS = { trapano: 'b_trapano', memory: 'c_gabbah' };
const dayNo = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };
export const todayGame = () => GAMES[dayNo() % GAMES.length];
const weekNo = () => Math.floor((Date.now() / 86400000 + 3) / 7);   // settimane che iniziano il lunedì (come la squadra)

function st() {
  const s = X.save;
  if (!s.mini) s.mini = { ready: s.level > MINI_EVERY, best: {}, wk: weekNo(), pts: 0, plays: 0 };
  if (s.mini.wk !== weekNo()) { s.mini.wk = weekNo(); s.mini.pts = 0; }
  return s.mini;
}
export function initMini(deps) { X = deps; st(); }
export const miniReady = () => !!st().ready;
// chiamata quando si vince per la prima volta il livello n
export function miniOnWin(n) { if (n % MINI_EVERY === 0) { st().ready = true; st().intro = 0; X.persist(); } }
// la tappa va presentata da sola una volta, appena si torna sulla mappa
export const miniAuto = () => !!st().ready && !st().intro;
export const miniLeft = (level) => { const next = Math.ceil(level / MINI_EVERY) * MINI_EVERY; return Math.max(1, next - level + 1); };

let raf = 0, timer = 0, alive = false;
function stop() { alive = false; cancelAnimationFrame(raf); clearInterval(timer); raf = 0; timer = 0; }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------- tappa obbligata: presentazione ----------------
export function openMiniStage() {
  stop();
  const m = st(), g = todayGame(), nm = NAMES();
  if (!m.intro) { m.intro = 1; X.persist(); }
  const talk = g === 'trapano'
    ? L`Alt! Ogni <b>${MINI_EVERY} livelli</b> si passa dal mio banco. Prima di ripartire mi devi chiodare una gomma: è un attimo, e ti pago in monete.`
    : L`Fermi tutti! Ogni <b>${MINI_EVERY} livelli</b> c'è la <b>tappa minigioco</b>. Prima di ripartire vediamo se ti ricordi le facce della squadra: ti pago in monete.`;
  const how = g === 'trapano'
    ? L`Tocca <b>TRAPANA!</b> quando la lancetta è nel verde. 10 chiodi, 3 errori al massimo.`
    : L`Gira le carte e trova le <b>8 coppie</b> di piloti in 60 secondi.`;
  X.showCard(`<h2>${L`Tappa minigioco`}</h2>${X.speakerHTML(g === 'trapano' ? 'gusta' : 'gabbah', talk)}
    <div class="mini-today"><span style="background-image:${X.I(ICONS[g])}"></span><b>${nm[g]}<small>${how}</small></b></div>
    <p class="mini-tip">${L`Più punti fai, più monete vinci. Finita la tappa si riparte con i livelli.`}</p>
    <div class="row"><button id="mClose" class="btn btn-gray">${L`Dopo`}</button><button id="mGo" class="btn btn-play">${L`Gioca!`}</button></div>`,
  { mClose: X.hideCard, mGo: () => { X.sfx.click(); (g === 'trapano' ? playTrapano : playMemory)(); } });
}

// ---------------- scheda dei minigiochi ----------------
export function openMiniHub() {
  stop();
  const m = st(), g = todayGame(), nm = NAMES();
  const ready = m.ready;
  const info = ready
    ? L`<p>C'è una <b>tappa minigioco</b> da giocare: oggi tocca a <b>${nm[g]}</b>. Più punti fai, più monete porti a casa.</p>`
    : L`<p>La tappa minigioco arriva <b>ogni ${MINI_EVERY} livelli</b> nuovi. Ti mancano <b>${miniLeft(X.save.level)}</b> livelli.</p>`;
  X.showCard(`<h2>${L`Minigiochi`}</h2>${info}
    <div class="mini-today"><span style="background-image:${X.I(ICONS[g])}"></span><b>${nm[g]}<small>${L`record`}: ${m.best[g] || 0} · ${L`questa settimana`}: ${m.pts || 0} ${L`punti`}</small></b></div>
    <div class="mini-rank" id="miniRank"><p class="rkload">${L`Chiedo la classifica della settimana…`}</p></div>
    <div class="row"><button id="mClose" class="btn btn-gray">${L`Chiudi`}</button>${ready ? `<button id="mGo" class="btn btn-play">${L`Gioca!`}</button>` : ''}</div>`,
  { mClose: X.hideCard, mGo: () => { X.sfx.click(); (g === 'trapano' ? playTrapano : playMemory)(); } });
  loadRank();
}
async function loadRank() {
  const box = () => document.getElementById('miniRank');
  let list;
  try { list = await X.RANK.miniTop(); } catch { if (box()) box().innerHTML = `<p class="rkload">${L`Niente rete: la classifica torna quando sei online.`}</p>`; return; }
  if (!box()) return;
  const w = weekNo(), me = (X.RANK.getNick() || '').toLowerCase();
  const rows = list.filter((e) => e.w === w).sort((a, b) => b.pts - a.pts).slice(0, 5);
  box().innerHTML = rows.length
    ? `<small class="mini-rk-h">${L`Classifica della settimana`}</small>` + rows.map((e, i) => `<div class="rk${String(e.name).toLowerCase() === me ? ' me' : ''}"><span class="pos">${['🥇', '🥈', '🥉'][i] || i + 1}</span><b>${esc(e.name)}</b><span class="st">${e.pts}</span></div>`).join('')
    : `<p class="rkload">${L`Questa settimana non ha ancora giocato nessuno: il primo posto è libero!`}</p>`;
}

// ---------------- fine partita: premio ----------------
function finish(game, score, line) {
  stop();
  const m = st(), nm = NAMES();
  const record = score > (m.best[game] || 0);
  if (record) m.best[game] = score;
  const coins = 20 + Math.round(score / 2) + (record && m.plays > 0 ? 25 : 0);
  m.ready = false; m.plays = (m.plays || 0) + 1; m.pts = (m.pts || 0) + score;
  X.save.coins += coins; X.persist(); X.coinsUI();
  X.sfx.win(); setTimeout(() => X.sfx.coin(), 500);
  if (X.RANK.getNick()) X.RANK.miniSubmit(weekNo(), m.pts, X.riderTag()).catch(() => {});
  X.showCard(`<h2>${nm[game]}</h2>${X.speakerHTML(game === 'trapano' ? 'gusta' : 'gabbah', line)}
    <div class="mini-res"><b>${score}</b><small>${L`punti`}${record ? ' · ' + L`nuovo record!` : ''}</small></div>
    <p>${L`Premio`}: <b>+${coins}</b> ${L`monete`}. ${L`Tappa superata: si riparte! La prossima arriva tra ${MINI_EVERY} livelli.`}</p>
    <div class="row"><button id="mOk" class="btn btn-play">${L`Avanti`}</button></div>`, { mOk: () => { X.hideCard(); X.refreshHome(); } });
}

// ---------------- 1) Il trapano di Gusta: ferma la barra nel verde ----------------
function playTrapano() {
  stop(); alive = true;
  const TOT = 10, MAXERR = 3;
  let done = 0, err = 0, score = 0, pos = 0, dir = 1, last = 0, lock = false;
  X.showCard(`<h2>${L`Il trapano di Gusta`}</h2>
    <p class="mini-tip">${L`Tocca <b>TRAPANA!</b> quando la lancetta è nel verde. Al centro vale di più. Tre errori e la gomma è da buttare.`}</p>
    <div class="trap-tyre" style="background-image:${X.I('o_chiodata1')}"><div id="trStuds"></div></div>
    <div class="trap-bar"><i id="trZone"></i><i id="trCore"></i><em id="trPin"></em></div>
    <div class="trap-info"><span id="trDone">0/${TOT}</span><span id="trErr">${'🔩'.repeat(MAXERR)}</span><span id="trScore">0</span></div>
    <div class="row"><button id="trGo" class="btn btn-play">${L`TRAPANA!`}</button></div>`, {});
  const zone = document.getElementById('trZone'), core = document.getElementById('trCore'), pin = document.getElementById('trPin');
  const zw = () => Math.max(13, 30 - done * 1.8);            // larghezza del verde in %
  const speed = () => 62 + done * 9;                           // % al secondo
  let zc = 50;
  const place = () => { zc = 22 + Math.random() * 56; const w = zw(); zone.style.left = (zc - w / 2) + '%'; zone.style.width = w + '%'; core.style.left = (zc - w / 6) + '%'; core.style.width = (w / 3) + '%'; };
  place();
  const studs = document.getElementById('trStuds');
  const tick = (t) => {
    if (!alive || !document.getElementById('trPin')) { stop(); return; }
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
    if (!lock) { pos += dir * speed() * dt; if (pos >= 100) { pos = 100; dir = -1; } if (pos <= 0) { pos = 0; dir = 1; } pin.style.left = pos + '%'; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  const hit = () => {
    if (lock || !alive) return;
    const w = zw(), d = Math.abs(pos - zc);
    lock = true;
    if (d <= w / 2) {
      const perfect = d <= w / 6;
      done += 1; score += perfect ? 15 : 10;
      X.sfx.hammer(); if (perfect) X.sfx.star();
      const a = (done - 1) / TOT * Math.PI * 2 - Math.PI / 2;
      const s = document.createElement('i'); s.style.left = (50 + Math.cos(a) * 34) + '%'; s.style.top = (50 + Math.sin(a) * 34) + '%'; if (perfect) s.className = 'gold'; studs.appendChild(s);
      pin.classList.add('ok');
    } else { err += 1; X.sfx.bad(); pin.classList.add('ko'); }
    document.getElementById('trDone').textContent = `${done}/${TOT}`;
    document.getElementById('trErr').textContent = '🔩'.repeat(MAXERR - err) + '✖️'.repeat(err);
    document.getElementById('trScore').textContent = score;
    setTimeout(() => {
      if (!alive) return;
      pin.classList.remove('ok', 'ko');
      if (done >= TOT || err >= MAXERR) {
        const line = done >= TOT ? (err === 0 ? L`Dieci chiodi su dieci! Questa gomma morde anche il ghiaccio.` : L`Gomma chiodata! Più ignorante è la modifica, meglio va.`) : L`Tre buchi storti… questa gomma la usiamo come fioriera.`;
        finish('trapano', score, line); return;
      }
      place(); lock = false;
    }, 420);
  };
  const b = document.getElementById('trGo'); b.onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); hit(); };
}

// ---------------- 2) Memory dei piloti: trova le coppie prima che scada il tempo ----------------
function playMemory() {
  stop(); alive = true;
  const PAIRS = 8, TIME = 60;
  const pool = Object.keys(CHARS).filter((k) => !/^forestale/.test(k) && CHARS[k] && CHARS[k].img && /^c_/.test(CHARS[k].img));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const ids = pool.slice(0, PAIRS), deck = [...ids, ...ids];
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  let open = [], found = 0, left = TIME, busy = false, started = false;
  X.showCard(`<h2>${L`Memory dei piloti`}</h2>
    <p class="mini-tip">${L`Trova le <b>${PAIRS} coppie</b> di piloti prima che scada il tempo. Ogni secondo che avanza vale un punto.`}</p>
    <div class="mem-info"><span id="mmFound">0/${PAIRS}</span><span id="mmName"></span><span id="mmTime">${TIME}</span></div>
    <div class="mem-grid">${deck.map((id, i) => `<button class="mem-card" data-i="${i}"><i style="background-image:${X.I(CHARS[id].img)}"></i></button>`).join('')}</div>`, {});
  const end = () => {
    const complete = found >= PAIRS, score = found * 10 + (complete ? left : 0);
    finish('memory', score, complete ? L`Li conosci tutti! Con una memoria così la Forestale non ti frega più.` : L`Tempo scaduto! Hai bevuto troppo per ricordarti le facce.`);
  };
  const start = () => { if (started) return; started = true; timer = setInterval(() => { if (!alive || !document.getElementById('mmTime')) { stop(); return; } left -= 1; document.getElementById('mmTime').textContent = left; if (left <= 0) end(); }, 1000); };
  document.querySelectorAll('.mem-card').forEach((c) => {
    c.onpointerdown = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (busy || !alive || c.classList.contains('up') || c.classList.contains('ok')) return;
      start(); X.sfx.swap(); c.classList.add('up'); open.push(c);
      if (open.length < 2) return;
      const [a, b] = open, ia = deck[+a.dataset.i], ib = deck[+b.dataset.i];
      if (ia === ib) {
        a.classList.add('ok'); b.classList.add('ok'); open = []; found += 1; X.sfx.star();
        document.getElementById('mmFound').textContent = `${found}/${PAIRS}`;
        document.getElementById('mmName').textContent = CHARS[ia].name || '';
        if (found >= PAIRS) setTimeout(() => { if (alive) end(); }, 500);
      } else {
        busy = true; X.sfx.bad();
        setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); open = []; busy = false; }, 650);
      }
    };
  });
}
