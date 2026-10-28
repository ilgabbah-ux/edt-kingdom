// EDT Kingdom — interfaccia, animazioni, campo base
import { Board, ROWS, COLS, key, unkey, inside } from './engine.js';
import { getLevel, MAX_LEVEL } from './levels.js';
import { BUILDINGS, CHARS } from './kingdom.js';
import * as FX from './fx.js';
import * as AU from './audio.js';

const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const app = $('#app');

// ---------- grafica in cache ----------
const SRC = (n) => (window.__A && window.__A[n]) || `img/${n}.webp`;
const I = (n) => `url('${SRC(n)}')`;
const TILE_URI = ['t0_birra', 't1_casco', 't2_maschera', 't3_chiave', 't4_gomma', 't5_stivale'].map(I);
const POWER_URI = { mH: I('p_moto'), mV: I('p_moto_v'), bomb: I('p_tanica'), grappa: I('p_grappa'), drone: I('p_drone') };
const ROCK_URI = [null, I('o_sasso1'), I('o_sasso2')];
const MUD_URI = [null, I('o_fango1'), I('o_fango2')];
const FORESTALE_URI = I('forestale');
const CRATE_URI = [null, I('o_cassa1'), I('o_cassa2')];
const CHAIN_URI = I('o_catena');
const MULTA_URI = I('o_multa');

// ---------- salvataggio ----------
const SAVE_KEY = 'edtKingdom_v1';
const save = (() => {
  const def = { level: 1, stars: 0, coins: 300, built: [], welcomed: false, muted: false };
  try { return { ...def, ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch { return def; }
})();
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* niente */ } };

// ---------- audio ----------
const sfx = AU.sfx;
const beep = AU.beep;
if (save.music === undefined) save.music = !save.muted;
if (save.sfx === undefined) save.sfx = !save.muted;
if (save.vibra === undefined) save.vibra = true;
AU.setMusic(save.music); AU.setSfx(save.sfx); FX.setVibra(save.vibra);
document.addEventListener('pointerdown', () => AU.unlock(), { capture: true });

// ---------- overlay / toast ----------
function showCard(html, binds = {}) {
  $('#card').innerHTML = html;
  $('#overlay').classList.remove('hidden');
  for (const [id, fn] of Object.entries(binds)) {
    const b = document.getElementById(id);
    if (b) b.onclick = (e) => { e.stopPropagation(); fn(); };
  }
}
const hideCard = () => $('#overlay').classList.add('hidden');
let toastT = 0;
function toast(text, ms = 900) {
  const t = $('#toast');
  t.style.top = FX.freeSpotY() + 'px';
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), ms);
}
function speakerHTML(who, text) {
  const ch = CHARS[who] || CHARS.gabbah;
  return `<div class="speaker"><div class="avatar" style="background-image:${I(ch.img)}"></div>
    <div class="bubble"><b>${ch.name}</b><p>${text}</p></div></div>`;
}
function say(who, text, btn = 'Ok!') {
  return new Promise((res) => showCard(`${speakerHTML(who, text)}<div class="row"><button id="cOk" class="btn btn-play">${btn}</button></div>`,
    { cOk: () => { hideCard(); res(); } }));
}

// =================== CAMPO BASE ===================
const STEPS = 3;
if (!save.steps) { save.steps = {}; (save.built || []).forEach((id) => { save.steps[id] = STEPS; }); }
const stepsOf = (b) => save.steps[b.id] || 0;
const isBuilt = (b) => stepsOf(b) >= STEPS;
const nextBuilding = () => BUILDINGS.find((b) => !isBuilt(b));
let pendingStar = false;

function bldTop(b) { return 14 + b.y * 0.72; }

function renderHome(popId = null) {
  $('#hStars').textContent = save.stars - (pendingStar ? 1 : 0);
  $('#hCoins').textContent = save.coins;
  const map = $('#map');
  map.style.backgroundImage = I('map_bg');
  map.innerHTML = '';
  [[3, 34, 46], [9, 24, 62], [1, 28, 38]].forEach(([top, w, dur], i) => {
    const cl = document.createElement('div');
    cl.className = 'cloud';
    Object.assign(cl.style, { top: top + '%', left: '0', width: w + '%', aspectRatio: '2.2', animationDuration: dur + 's', animationDelay: (-dur * (i * .37 + .1)) + 's' });
    map.appendChild(cl);
  });
  const nb = nextBuilding();
  for (const b of BUILDINGS) {
    const built = isBuilt(b);
    const isNext = b === nb;
    const st = stepsOf(b);
    const d = document.createElement('div');
    d.className = 'bld ' + (built ? 'built' : isNext ? 'next' : 'ghost') + (b.id === popId ? ' pop' : '');
    d.dataset.id = b.id;
    d.style.left = b.x + '%';
    d.style.top = bldTop(b) + '%';
    d.innerHTML = `<div class="img" style="background-image:${I(built || !isNext ? 'b_' + b.id : 'b_cantiere')}"></div>
      ${isNext ? `<div class="chip">${st}/${STEPS}</div>` : ''}
      <div class="tag">${built ? b.name : isNext ? `<i class="ic ic-hammer"></i> ${b.name}` : `<i class="ic ic-lock"></i> ${b.name}`}</div>`;
    d.onclick = () => (isNext ? tryBuild() : built ? say(b.who, b.text, 'Bello!') : lockedInfo(b));
    map.appendChild(d);
  }
  if (nb && save.stars >= 1) {
    const a = document.createElement('div');
    a.className = 'arrow'; a.textContent = '▼';
    a.style.left = nb.x + '%'; a.style.top = (bldTop(nb) - 12) + '%';
    map.appendChild(a);
  }
  const btnB = $('#btnBuild');
  if (nb) {
    $('#job').hidden = false;
    $('#jobImg').style.backgroundImage = I('b_' + nb.id);
    $('#jobName').textContent = nb.name;
    $('#jobSteps').innerHTML = Array.from({ length: STEPS }, (_, k) => `<i class="${k < stepsOf(nb) ? 'on' : ''}"></i>`).join('');
    const ok = save.stars >= 1;
    btnB.classList.toggle('ready', ok); btnB.classList.toggle('wait', !ok);
    $('#buildLbl').textContent = 'Costruisci';
    $('#buildCost').innerHTML = (ok ? 'usa ' : 'serve ') + IC_S + ' 1';
  } else {
    $('#jobImg').style.backgroundImage = I('b_statua');
    $('#jobName').textContent = 'Campo Base completo!';
    $('#jobSteps').innerHTML = '';
    btnB.classList.remove('ready'); btnB.classList.add('wait');
    $('#buildLbl').textContent = 'Fatto'; $('#buildCost').textContent = 'Completo';
  }
  $('#btnPlay').innerHTML = save.level > MAX_LEVEL ? 'Finito! 🏆' : `Gioca <b>livello ${save.level}</b>`;
}

function lockedInfo(b) {
  const idx = BUILDINGS.indexOf(b);
  const before = BUILDINGS.slice(0, idx).reduce((s, x) => s + (STEPS - stepsOf(x)), 0);
  const nb = nextBuilding();
  say('gabbah', `<b>${b.name}</b> arriva più avanti. Prima finiamo <b>${nb.name}</b>: mancano ancora <b>${before} ${IC_S}</b> prima di arrivarci.`, 'Ok');
}

async function tryBuild() {
  const nb = nextBuilding();
  if (!nb || G.building || pendingStar) return;
  if (save.stars < 1) {
    showCard(`${speakerHTML('gabbah', `Per costruire ci vogliono le stelle: <b>ogni livello vinto vale ${IC_S} 1</b>, e ogni stella è un pezzo di <b>${nb.name}</b>. Andiamo a guadagnarne una!`)}
      <div class="row"><button id="cNo" class="btn btn-gray">Dopo</button><button id="cGo" class="btn btn-play">Gioca!</button></div>`,
      { cNo: hideCard, cGo: () => { hideCard(); openLevel(); } });
    return;
  }
  G.building = true;
  save.stars -= 1;
  save.steps[nb.id] = stepsOf(nb) + 1;
  persist();
  const done = isBuilt(nb);
  const map = $('#map');
  const el = map.querySelector(`.bld[data-id="${nb.id}"]`);
  // zoom sul cantiere
  map.style.transformOrigin = `${nb.x}% ${bldTop(nb)}%`;
  map.style.transform = 'scale(1.45)';
  $('#hStars').textContent = save.stars;
  await sleep(650);
  const r = el.getBoundingClientRect(), ar = app.getBoundingClientRect();
  const cx = r.left - ar.left + r.width / 2, cy = r.top - ar.top + r.height * .55;
  const h = document.createElement('div');
  h.className = 'hammer ic-hammer';
  h.style.left = (cx + r.width * .2) + 'px'; h.style.top = (cy - r.height * .5) + 'px';
  app.appendChild(h);
  for (let k = 0; k < 4; k++) {
    setTimeout(() => { FX.dust(cx + (Math.random() - .5) * r.width * .7, cy + (Math.random() - .2) * r.height * .3, 4, 'rgba(210,180,140,.9)'); sfx.hammer(); FX.shake(2, .15); }, k * 300 + 150);
  }
  await sleep(1250);
  h.remove();
  for (let k = 0; k < 8; k++) FX.dust(cx + (Math.random() - .5) * r.width, cy + (Math.random() - .5) * r.height * .5, 3, 'rgba(230,210,180,.95)');
  if (done) {
    sfx.build();
    renderHome(nb.id);
    const cols = ['#ffd34d', '#ff5a3c', '#3d8bff', '#4fd25f', '#ff4fa3', '#ffffff'];
    for (let k = 0; k < 6; k++) FX.burst(cx + (Math.random() - .5) * 60, cy - 30, cols[k], 14, 1.6);
    FX.glow(cx, cy, r.width * .8); FX.flash(.4);
    FX.banner(nb.name, 'Costruito!', '#ffd34d');
  } else {
    beep(660, 0.12, 'triangle', 0.1);
    renderHome();
    FX.banner(`Tappa ${stepsOf(nb)} di ${STEPS}`, nb.name, '#ffd34d');
  }
  await sleep(1100);
  map.style.transform = '';
  await sleep(500);
  G.building = false;
  if (done) {
    await say(nb.who, nb.text, 'Grande!');
    if (!nextBuilding()) await say('forestale', 'Un campo base intero, con tanto di statua? Qui serve il blocchetto grande. Tornerò con i rinforzi!', 'Ti aspettiamo');
  }
}

function flyStarToCounter() {
  const pill = $('#hStars').parentElement.getBoundingClientRect(), ar = app.getBoundingClientRect();
  const s2 = document.createElement('div');
  s2.className = 'flystar ic-star';
  s2.style.left = (ar.width / 2 - 35) + 'px'; s2.style.top = (ar.height * .45 - 35) + 'px';
  s2.style.transform = 'scale(2.2)';
  app.appendChild(s2);
  FX.glow(ar.width / 2, ar.height * .45, 90);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    s2.style.transform = `translate(${pill.left - ar.left + 18 - ar.width / 2}px, ${pill.top - ar.top + 18 - ar.height * .45}px) scale(.5)`;
  }));
  setTimeout(() => {
    s2.remove(); pendingStar = false;
    $('#hStars').textContent = save.stars;
    const p = $('#hStars').parentElement; p.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 300 });
    FX.burst(pill.left - ar.left + 20, pill.top - ar.top + 18, '#ffd34d', 10);
    sfx.star();
    renderHome();
    if (!save.tutBuild && save.stars >= 1 && nextBuilding()) {
      save.tutBuild = true; persist();
      setTimeout(() => say('gabbah', 'Hai guadagnato una <b>stella</b>! Le stelle servono a costruire il Campo Base: tocca <b>Costruisci</b> qui sotto, o il cantiere con la freccia.', 'Ci provo'), 250);
    }
  }, 950);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}

// =================== PARTITA ===================
const G = {
  board: null, level: null, moves: 0, goals: [], boss: null,
  busy: false, els: new Map(), mudEls: [], S: 44,
  sel: null, hammer: false, shield: false, over: false, hintT: 0,
};

function goalURI(gl) {
  if (gl.type === 'tile') return TILE_URI[gl.t];
  if (gl.type === 'mud') return MUD_URI[1];
  if (gl.type === 'rock') return ROCK_URI[1];
  if (gl.type === 'crate') return CRATE_URI[2];
  if (gl.type === 'chain') return CHAIN_URI;
  if (gl.type === 'multa') return MULTA_URI;
  return FORESTALE_URI;
}
const goalLeft = (gl) => Math.max(0, gl.n - gl.done);

function renderGoals(bumpIdx = -1) {
  const box = $('#goals');
  if (!box.children.length || box.children.length !== G.goals.length) {
    box.innerHTML = G.goals.map((gl, i) => `<div class="goal" data-i="${i}" style="background-image:${goalURI(gl)}"><b></b></div>`).join('');
  }
  G.goals.forEach((gl, i) => {
    const el = box.children[i];
    el.querySelector('b').textContent = goalLeft(gl) ? goalLeft(gl) : '✓';
    el.classList.toggle('done', !goalLeft(gl));
    if (i === bumpIdx) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  });
  if (G.boss) {
    const gl = G.goals[0];
    const pct = Math.max(0, (gl.n - gl.done) / gl.n) * 100;
    $('#bossHp').style.width = pct + '%';
    $('#bossTxt').textContent = `Pazienza della Forestale: ${goalLeft(gl)}`;
    $('#bossCount').textContent = G.boss.count;
  }
}
function renderMoves() {
  $('#moves').textContent = G.moves;
  $('.moves').classList.toggle('low', G.moves <= 5);
  $('#bHammer').classList.toggle('active', G.hammer);
  $('#bShield').classList.toggle('on', G.shield);
}

function layout() {
  const appR = app.getBoundingClientRect();
  const top = $('.gamebar').getBoundingClientRect().height + (G.boss ? 64 : 0);
  const bottom = $('.boosters').getBoundingClientRect().height || 80;
  const availW = appR.width - 16;
  const availH = appR.height - top - bottom - 20;
  G.S = Math.floor(Math.min(availW / COLS, availH / ROWS, 64));
  document.documentElement.style.setProperty('--cell', G.S + 'px');
  const wrap = $('#boardWrap');
  wrap.style.width = G.S * COLS + 'px';
  wrap.style.height = G.S * ROWS + 'px';
}

const pos = (r, c) => `translate(${c * G.S}px, ${r * G.S}px)`;

function artFor(t) {
  if (t.rock) return t.kind === 'crate' ? CRATE_URI[t.rock] : ROCK_URI[t.rock];
  if (t.power) return POWER_URI[t.power];
  return TILE_URI[t.color];
}
function makeTileEl(t, r, c) {
  const el = document.createElement('div');
  el.className = 'tile' + (t.power ? ' power' : '') + (t.chain ? ' chained' : '');
  el.style.backgroundImage = artFor(t);
  el.style.transform = pos(r, c);
  $('#board').appendChild(el);
  G.els.set(t.id, el);
  return el;
}
function refreshArt(t) {
  const el = G.els.get(t.id);
  if (!el) return;
  el.style.backgroundImage = artFor(t);
  el.classList.toggle('power', !!t.power);
  el.classList.toggle('chained', !!t.chain);
}

function buildBoardDOM() {
  const b = $('#board');
  b.innerHTML = '';
  G.els.clear();
  G.ticketEls = Array.from({ length: ROWS }, () => []); G.mudEls = []; G.badges = Array.from({ length: ROWS }, () => []); G.badgeEls = [];
  for (let r = 0; r < ROWS; r++) {
    G.mudEls.push([]);
    for (let c = 0; c < COLS; c++) {
      if (!G.board.hole[r][c]) {
        const fr = document.createElement('div');
        fr.className = 'cellframe'; fr.dataset.r = r; fr.dataset.c = c; fr.style.transform = pos(r, c);
        b.insertBefore(fr, b.firstChild);
      }
      const bg = document.createElement('div');
      bg.className = 'cellbg' + ((r + c) % 2 ? ' dark' : '') + (G.board.hole[r][c] ? ' hole' : '');
      bg.style.transform = pos(r, c);
      b.appendChild(bg);
      const m = document.createElement('div');
      m.className = 'mud';
      m.style.transform = pos(r, c);
      b.appendChild(m);
      G.mudEls[r].push(m);
      const tk = document.createElement('div');
      tk.className = 'ticket'; tk.style.transform = pos(r, c);
      b.appendChild(tk);
      G.ticketEls[r].push(tk);
      const bd = document.createElement('div');
      bd.className = 'mudbadge'; bd.textContent = '2'; bd.hidden = true;
      bd.style.transform = pos(r, c);
      G.badgeEls.push(bd);
      G.badges[r].push(bd);
    }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (G.board.grid[r][c]) {
    const el = makeTileEl(G.board.grid[r][c], r, c);
    el.animate([{ transform: pos(r - ROWS, c), opacity: 0 }, { transform: pos(r, c), opacity: 1 }], { duration: 420, delay: (ROWS - r) * 35 + c * 12, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'backwards' });
  }
  G.badgeEls.forEach((bd) => b.appendChild(bd));
  renderMud();
}
function renderMud() {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const v = G.board.mud[r][c];
    const m = G.mudEls[r][c];
    m.style.backgroundImage = v ? MUD_URI[v] : 'none';
    m.style.opacity = v ? 1 : 0;
    m.classList.toggle('on', !!v);
    G.badges[r][c].hidden = v < 2;
    G.ticketEls[r][c].classList.toggle('on', !!G.board.ticket[r][c]);
    m.style.animationDelay = ((r * 7 + c * 3) % 10) * -0.3 + 's';
  }
}
function repositionAll(instant = true) {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = G.board.grid[r][c];
    const el = t && G.els.get(t.id);
    if (!el) continue;
    el.style.backgroundImage = artFor(t);
    if (instant) el.style.transition = 'none';
    el.style.transform = pos(r, c);
    if (instant) { void el.offsetWidth; el.style.transition = ''; }
  }
  G.badgeEls?.forEach((bd, i) => { bd.style.transform = pos(Math.floor(i / COLS), i % COLS); });
  G.ticketEls?.flat().forEach((el, i) => { el.style.transform = pos(Math.floor(i / COLS), i % COLS); });
  document.querySelectorAll('.cellframe').forEach((el) => { el.style.transform = pos(+el.dataset.r, +el.dataset.c); });
  document.querySelectorAll('.cellbg,#board > .mud').forEach((el, i) => {
    const k = Math.floor(i / 2);
    el.style.transform = pos(Math.floor(k / COLS), k % COLS);
  });
}

// ---------- coordinate effetti ----------
function cellCenter(r, c) { // relativo a #app
  const br = $('#board').getBoundingClientRect();
  const ar = app.getBoundingClientRect();
  return [br.left - ar.left + (c + 0.5) * G.S, br.top - ar.top + (r + 0.5) * G.S];
}
function fxEl(cls, x, y, w, h) {
  const d = document.createElement('div');
  d.className = cls;
  Object.assign(d.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  $('#fx').appendChild(d);
  setTimeout(() => d.remove(), 700);
  return d;
}
function fxPower(power, r, c, cells) {
  const S = G.S;
  const [x, y] = cellCenter(r, c);
  const br = $('#board').getBoundingClientRect(), ar = app.getBoundingClientRect();
  const bx = br.left - ar.left, by = br.top - ar.top;
  if (power === 'mH') {
    sfx.moto();
    const dir = c < COLS / 2 ? 1 : -1;
    FX.rideAcross(POWER_URI.mH, dir > 0 ? bx - S : bx + COLS * S + S, y, dir > 0 ? bx + COLS * S + S : bx - S, y, 360);
    FX.streak(bx, y, bx + COLS * S, y, '#fff6c8', S * 0.55);
    FX.shake(4, .25);
  } else if (power === 'mV') {
    sfx.moto();
    FX.rideAcross(POWER_URI.mV, x, by + ROWS * S + S, x, by - S, 380);
    FX.streak(x, by + ROWS * S, x, by, '#fff6c8', S * 0.55);
    FX.shake(4, .25);
  } else if (power === 'bomb') {
    sfx.boom();
    FX.glow(x, y, S * 2.8); FX.ring(x, y, S * 3, '#ffe9a0', 14); FX.fire(x, y, S * 2.4);
    FX.flash(.35); FX.shake(10, .4);
  } else if (power === 'grappa') {
    sfx.grappa();
    FX.rays(x, y, S * 4); FX.glow(x, y, S * 2, 'rgba(255,240,170,.9)'); FX.flash(.45);
    let i = 0;
    for (const k of cells) {
      const [rr, cc] = unkey(k);
      const [tx, ty] = cellCenter(rr, cc);
      setTimeout(() => { FX.streak(x, y, tx, ty, '#fff3a8', 4); FX.ring(tx, ty, S * .7, '#ffffff', 5); }, (i++ % 16) * 25);
    }
    FX.shake(6, .35);
  } else if (power === 'drone') {
    sfx.drone();
    FX.ring(x, y, S * 1.6, '#c4f1ff', 8); FX.dust(x, y, 6, 'rgba(220,240,255,.9)');
  }
}
function floater(text, r, c) {
  const S = G.S;
  const d = fxEl('floater', (c + 0.5) * S, r * S, 0, 0);
  d.style.width = 'auto'; d.style.height = 'auto';
  d.textContent = text;
  setTimeout(() => d.remove(), 1100);
}
async function flyDrone(fromK, toK) {
  const [r1, c1] = unkey(fromK), [r2, c2] = unkey(toK);
  const [x1, y1] = cellCenter(r1, c1), [x2, y2] = cellCenter(r2, c2);
  const d = document.createElement('div');
  d.className = 'flyer';
  d.style.backgroundImage = POWER_URI.drone;
  d.style.transform = `translate(${x1 - 20}px, ${y1 - 20}px) scale(1.2)`;
  app.appendChild(d);
  void d.offsetWidth;
  d.style.transform = `translate(${x2 - 20}px, ${y2 - 20}px) scale(1.4)`;
  await sleep(500);
  d.remove();
}
function flyToGoal(goalIdx, uri, r, c) {
  const gEl = $('#goals').children[goalIdx];
  if (!gEl) return;
  const ar = app.getBoundingClientRect();
  const gr = gEl.getBoundingClientRect();
  const [x1, y1] = cellCenter(r, c);
  const d = document.createElement('div');
  d.className = 'flyer';
  d.style.backgroundImage = uri;
  d.style.transform = `translate(${x1 - 20}px, ${y1 - 20}px)`;
  app.appendChild(d);
  void d.offsetWidth;
  d.style.transform = `translate(${gr.left - ar.left + gr.width / 2 - 20}px, ${gr.top - ar.top + gr.height / 2 - 20}px) scale(.6)`;
  d.style.opacity = '0.4';
  setTimeout(() => { d.remove(); renderGoals(goalIdx); }, 560);
}

// ---------- obiettivi ----------
let flyBudget = 0;
function credit(type, r, c, color = -1, amount = 1) {
  G.goals.forEach((gl, i) => {
    if (gl.done >= gl.n) return;
    let hit = false;
    if (gl.type === type && (type !== 'tile' || gl.t === color)) hit = true;
    if (gl.type === 'boss' && type !== 'boss') { gl.done += type === 'tile' || type === 'mud' ? 1 : 2; hit = 'boss'; }
    if (hit === true) {
      gl.done = Math.min(gl.n, gl.done + amount);
      if (flyBudget-- > 0) flyToGoal(i, goalURI(gl), r, c); else renderGoals(i);
    }
    if (hit === 'boss') {
      gl.done = Math.min(gl.n, gl.done);
      const f = $('#bossFace');
      f.classList.remove('hit'); void f.offsetWidth; f.classList.add('hit');
    }
  });
}
const IC_S = '<i class="ic ic-star"></i>', IC_C = '<i class="ic ic-coin"></i>';
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const WIN_TITLES = ['Giro easy!', 'Che manetta!', 'Grande EDT!', 'Sentiero pulito!', 'Da manuale!'];
const WIN_LINES = [
  ['gabbah', 'Fatto senza nemmeno sporcare il casco. Quasi.'],
  ['miti', 'Ho ripreso tutto con la GoPro. Questa la mettiamo nel video!'],
  ['mirco', 'Bravo. Io intanto mi sono riposato. Campa giù!'],
  ['costa', 'Per festeggiare offro io: grigliata di trote per tutti!'],
  ['purcello', 'Visto? Non hai avuto bisogno della mia spinta. Stavolta.'],
  ['svetlana', 'Che classe. Quasi quasi ti presto il trono.'],
];
const LOSE_LINES = [
  'Sei rimasto piantato nel fango. Ti do una spinta io da dietro?',
  'Mosse finite e sentiero ancora chiuso. Ci penso io: aggancio e tiro!',
  'Ti sei insabbiato? Tranquillo, Purcello arriva sempre da dietro.',
];
const allDone = () => G.goals.every((gl) => gl.done >= gl.n);

// ---------- risoluzione ----------
const CASCADE = [
  ['Bella!', '#ffd34d'], ['Che manetta!', '#ffb02e'], ['Gas aperto!', '#ff8a1c'],
  ['Fuori giri!', '#ff5a3c'], ['Campa giù!', '#ff4fa3'], ['LEGGENDARIO!', '#b07bff'],
];
const POWER_SHOUT = { mH: 'Moto!', mV: 'Moto!', bomb: 'Tanica!', drone: 'Drone!', grappa: 'San Braulio!' };
const COMBO_NAMES = {
  'mH+mH': 'Doppia sgasata!', 'mH+mV': 'Doppia sgasata!', 'mV+mV': 'Doppia sgasata!',
  'bomb+mH': 'Moto in fiamme!', 'bomb+mV': 'Moto in fiamme!', 'bomb+bomb': 'Mega tanica!',
  'drone+drone': 'Squadriglia droni!', 'drone+mH': 'Drone con moto!', 'drone+mV': 'Drone con moto!', 'bomb+drone': 'Drone bombarolo!',
  'grappa+grappa': 'Miracolo di San Braulio!',
};

async function doClear(clear, matched, created, pre = []) {
  const b = G.board;
  const protect = new Set(created.map((x) => x.at));
  const triggered = new Set(pre);
  flyBudget = 10;
  burstBudget = 24;

  // reazione a catena dei power-up
  let changed = true;
  let wave = 0;
  while (changed) {
    changed = false;
    for (const k of [...clear]) {
      if (protect.has(k) || triggered.has(k)) continue;
      const [r, c] = unkey(k);
      const t = b.grid[r][c];
      if (!t || !t.power) continue;
      triggered.add(k);
      const cells = b.blast(t.power, r, c, G.goals);
      if (t.power === 'drone' && cells.droneTarget !== undefined) {
        fxPower('drone', r, c, cells);
        await flyDrone(k, cells.droneTarget);
        const [tr, tc] = unkey(cells.droneTarget);
        const [dx, dy] = cellCenter(tr, tc);
        FX.ring(dx, dy, G.S * 1.4, '#ffffff', 8); FX.glow(dx, dy, G.S * 1.2); FX.shake(3, .2);
      } else fxPower(t.power, r, c, cells);
      cells.forEach((x) => clear.add(x));
      changed = true;
      wave++;
      await sleep(70);
    }
  }

  // sassi: colpiti dai blast o accanto ai match
  const rockHits = new Set();
  for (const k of clear) { const [r, c] = unkey(k); if (b.grid[r][c]?.rock) rockHits.add(k); }
  for (const k of matched) {
    const [r, c] = unkey(k);
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr, cc = c + dc;
      if (inside(rr, cc) && b.grid[rr][cc]?.rock) rockHits.add(key(rr, cc));
    }
  }

  let n = 0;
  for (const k of rockHits) {
    const [r, c] = unkey(k);
    const t = b.grid[r][c];
    t.rock--;
    if (t.rock <= 0) {
      killTile(t, r, c);
      b.grid[r][c] = null;
      credit(t.kind === 'crate' ? 'crate' : 'rock', r, c);
    } else {
      refreshArt(t); credit('boss', r, c); sfx.crack();
      const [hx, hy] = cellCenter(r, c);
      FX.burst(hx, hy, t.kind === 'crate' ? '#b07a40' : '#9a958f', 6);
      G.els.get(t.id)?.animate([{ transform: pos(r, c) + ' rotate(-8deg) scale(1.1)' }, { transform: pos(r, c) }], { duration: 260 });
    }
  }
  for (const k of clear) {
    const [r, c] = unkey(k);
    const t = b.grid[r][c];
    if (b.ticket[r][c]) {
      b.ticket[r][c] = 0; G.ticketCleared = true; credit('multa', r, c); sfx.ticket();
      const [tx, ty] = cellCenter(r, c); FX.burst(tx, ty, '#ffd646', 8); FX.ring(tx, ty, G.S * .7, '#fff6a0', 5);
    }
    if (!t || t.rock !== 0 && t.rock !== undefined && t.rock > 0) continue;
    if (rockHits.has(k)) continue;
    if (t.chain) {
      t.chain = false; refreshArt(t); credit('chain', r, c); sfx.chain();
      const [cx2, cy2] = cellCenter(r, c); FX.burst(cx2, cy2, '#b9bec8', 9); FX.ring(cx2, cy2, G.S * .8, '#e6ebf2', 6);
      if (b.mud[r][c] > 0) { b.mud[r][c]--; credit('mud', r, c); mudSplash(r, c, b.mud[r][c]); }
      continue;
    }
    if (protect.has(k)) {
      credit('tile', r, c, t.color);
    } else {
      if (t.color >= 0) credit('tile', r, c, t.color);
      else credit('boss', r, c);
      killTile(t, r, c, n++);
      b.grid[r][c] = null;
    }
    if (b.mud[r][c] > 0) { b.mud[r][c]--; credit('mud', r, c); mudSplash(r, c, b.mud[r][c]); }
  }
  for (const cr of created) {
    const [r, c] = unkey(cr.at);
    const t = b.grid[r][c];
    if (!t) continue;
    t.power = cr.power;
    t.color = -1;
    refreshArt(t);
    const el = G.els.get(t.id);
    el.animate([{ transform: pos(r, c) + ' scale(1.7) rotate(-15deg)' }, { transform: pos(r, c) + ' scale(.9)' }, { transform: pos(r, c) }], { duration: 420, easing: 'cubic-bezier(.2,1.6,.4,1)' });
    const [x, y] = cellCenter(r, c);
    FX.glow(x, y, G.S * 1.3); FX.ring(x, y, G.S * 1.2, '#fff6a0', 6);
    floater(POWER_SHOUT[cr.power], r, c);
  }
  sfx.pop(Math.min(n, 8) / 2);
  renderMud();
  renderGoals();
  await sleep(230);
}

let burstBudget = 0;
function mudSplash(r, c, left) {
  sfx.splash();
  const [mx, my] = cellCenter(r, c);
  FX.burst(mx, my, left ? '#4a2a10' : '#8a5a2e', 7, .9);
  FX.dust(mx, my, 2, 'rgba(110,70,30,.85)');
  const m = G.mudEls[r][c];
  if (left) {
    m.animate([{ transform: pos(r, c) + ' scale(1.25)' }, { transform: pos(r, c) + ' scale(.9)' }, { transform: pos(r, c) }], { duration: 380, easing: 'ease-out' });
  } else {
    const ghost = m.cloneNode(); ghost.className = 'mud'; ghost.style.opacity = 1;
    m.parentNode.insertBefore(ghost, m);
    ghost.animate([{ transform: pos(r, c) + ' scale(1)', opacity: 1 }, { transform: pos(r, c) + ' scale(1.45)', opacity: 0 }], { duration: 380, easing: 'ease-out' }).onfinish = () => ghost.remove();
    FX.ring(mx, my, G.S * .75, '#ffffff', 5); FX.glow(mx, my, G.S * .7, 'rgba(255,255,220,.8)');
  }
}
// bollicine nel fango
setInterval(() => {
  if (!G.board || G.over || !$('#game').classList.contains('active')) return;
  const cells = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (G.board.mud[r][c]) cells.push([r, c]);
  for (let i = 0; i < Math.min(2, cells.length); i++) {
    const [r, c] = cells[Math.floor(Math.random() * cells.length)];
    const [x, y] = cellCenter(r, c);
    FX.bubble(x + (Math.random() - .5) * G.S * .7, y + (Math.random() - .5) * G.S * .7, G.S * (.08 + Math.random() * .07));
  }
}, 650);
function killTile(t, r, c) {
  const el = G.els.get(t.id);
  if (!el) return;
  const [x, y] = cellCenter(r, c);
  const col = t.rock ? '#9a958f' : t.power ? '#fff3a8' : t.color >= 0 ? FX.TILE_COLORS[t.color] : '#9a958f';
  if (burstBudget-- > 0) FX.burst(x, y, col, t.rock !== undefined && t.color < 0 ? 10 : 7);
  else FX.burst(x, y, col, 2);
  el.classList.add('dying');
  el.style.transform = pos(r, c) + ' scale(0.2)';
  G.els.delete(t.id);
  setTimeout(() => el.remove(), 260);
}

async function applyGravity() {
  const { moves, spawns } = G.board.gravity();
  let maxD = 0;
  for (const m of moves) {
    const el = G.els.get(m.tile.id);
    if (!el) continue;
    const d = Math.max(1, m.to - m.from);
    el.style.transitionDuration = (0.08 + d * 0.05) + 's';
    el.style.transform = pos(m.to, m.c);
    maxD = Math.max(maxD, d);
  }
  for (const s2 of spawns) {
    const el = makeTileEl(s2.tile, s2.from, s2.fromC);
    el.style.transition = 'none';
    el.style.transform = pos(s2.from, s2.fromC);
    void el.offsetWidth;
    const d = Math.max(1, s2.to - s2.from);
    el.style.transition = '';
    el.style.transitionDuration = (0.08 + d * 0.05) + 's';
    el.style.transform = pos(s2.to, s2.c);
    maxD = Math.max(maxD, d);
  }
  await sleep((0.08 + maxD * 0.05) * 1000 + 40);
  G.els.forEach((el) => { el.style.transitionDuration = ''; });
}

async function resolve({ pending = [], swapCells = [] } = {}) {
  let step = 0;
  while (true) {
    const groups = G.board.findMatches(swapCells);
    swapCells = [];
    if (!groups.length && !pending.length) break;
    const clear = new Set(), matched = new Set(), created = [], pre = [];
    for (const g of groups) {
      g.cells.forEach((k) => { clear.add(k); matched.add(k); });
      if (g.power) created.push({ at: g.at, power: g.power });
    }
    for (const p of pending) { p.cells.forEach((k) => clear.add(k)); (p.pre || []).forEach((k) => pre.push(k)); }
    pending = [];
    await doClear(clear, matched, created, pre);
    if (step >= 1) {
      const lv = CASCADE[Math.min(step - 1, CASCADE.length - 1)];
      FX.banner(lv[0], `Combo x${step + 1}`, lv[1]);
      sfx.combo(step);
      if (step >= 2) FX.shake(2 + step * 1.5, .3);
    }
    await applyGravity();
    step++;
  }
}

// ---------- mosse ----------
function useMove() {
  G.moves--;
  G.moveCount = (G.moveCount || 0) + 1;
  if (G.boss) G.boss.count--;
  renderMoves();
  renderGoals();
}

async function trySwap(a, bCell) {
  if (G.busy || G.over || !inside(...bCell)) return;
  const b = G.board;
  const ta = b.get(...a), tb = b.get(...bCell);
  if (!b.isSwappable(ta) || !b.isSwappable(tb)) { sfx.bad(); return; }
  G.busy = true; clearHint(); setSel(null);
  b.swap(a, bCell);
  G.els.get(ta.id).style.transform = pos(...bCell);
  G.els.get(tb.id).style.transform = pos(...a);
  sfx.swap();
  await sleep(170);

  const ka = key(...bCell); // ta ora è in bCell
  const kb = key(...a);     // tb ora è in a
  if (ta.power && tb.power) {
    useMove();
    await comboPowers(ta, tb, bCell, ka, kb);
  } else if (ta.power || tb.power) {
    useMove();
    const [pt, pk, other] = ta.power ? [ta, ka, tb] : [tb, kb, ta];
    if (pt.power === 'grappa') {
      const [r, c] = unkey(pk);
      const cells = new Set([pk, ...b.cellsOfColor(other.color)]);
      fxPower('grappa', r, c, cells);
      await sleep(250);
      await resolve({ pending: [{ cells, pre: [pk] }], swapCells: [a, bCell] });
    } else {
      await resolve({ pending: [{ cells: new Set([pk]) }], swapCells: [a, bCell] });
    }
  } else if (b.findMatches([a, bCell]).length) {
    useMove();
    await resolve({ swapCells: [a, bCell] });
  } else {
    b.swap(a, bCell);
    sfx.bad();
    G.els.get(ta.id).style.transform = pos(...a);
    G.els.get(tb.id).style.transform = pos(...bCell);
    await sleep(180);
    G.busy = false;
    scheduleHint();
    return;
  }
  await endTurn();
}

async function comboPowers(ta, tb, at, ka, kb) {
  const b = G.board;
  const [r, c] = at;
  const res = b.comboBlast(ta.power, tb.power, r, c, G.goals);
  const keyName = [ta.power, tb.power].sort().join('+');
  const nm = COMBO_NAMES[keyName] || (keyName.includes('grappa') ? 'Benedizione di San Braulio!' : 'Super combo!');
  FX.banner(nm, 'SUPER COMBO', '#ffd34d');
  const [cx, cy] = cellCenter(r, c);
  FX.flash(.7); FX.shake(12, .5); FX.glow(cx, cy, G.S * 3.5); FX.ring(cx, cy, G.S * 4.5, '#ffffff', 16);
  if (res.convert) {
    sfx.power(); FX.rays(cx, cy, G.S * 5);
    const want = res.convert.power;
    res.convert.cells = res.convert.cells.filter((k) => { const [rr, cc] = unkey(k); const t = b.grid[rr][cc]; return t && !t.chain && !t.rock; });
    for (const k of res.convert.cells) {
      const [rr, cc] = unkey(k);
      const t = b.grid[rr][cc];
      credit('tile', rr, cc, t.color);
      t.power = want === 'mH' || want === 'mV' ? (Math.random() < 0.5 ? 'mH' : 'mV') : want;
      t.color = -1;
      refreshArt(t);
      const [tx, ty] = cellCenter(rr, cc);
      FX.streak(cx, cy, tx, ty, '#fff3a8', 4); FX.ring(tx, ty, G.S * .8, '#fff', 5);
    }
    await sleep(500);
    await resolve({ pending: [{ cells: new Set([ka, kb, ...res.convert.cells]), pre: [ka, kb] }] });
    return;
  }
  if (res.cells.droneTarget !== undefined) await flyDrone(ka, res.cells.droneTarget);
  // effetto grande
  const S = G.S;
  const br = $('#board').getBoundingClientRect(), ar = app.getBoundingClientRect();
  const bx = br.left - ar.left, by = br.top - ar.top;
  if (keyName === 'bomb+bomb') { FX.fire(cx, cy, S * 4); FX.ring(cx, cy, S * 5.5, '#ffe9a0', 20); }
  else if (keyName.startsWith('drone+drone')) { FX.dust(cx, cy, 14, 'rgba(220,240,255,.9)'); }
  else {
    const w = keyName.includes('bomb') ? S * 2.6 : S * .9;
    FX.streak(bx, cy, bx + COLS * S, cy, '#fff6c8', w); FX.streak(cx, by, cx, by + ROWS * S, '#fff6c8', w);
    FX.rideAcross(POWER_URI.mH, bx - S, cy, bx + COLS * S + S, cy, 380);
    FX.rideAcross(POWER_URI.mV, cx, by + ROWS * S + S, cx, by - S, 400);
    if (keyName.includes('bomb')) FX.fire(cx, cy, S * 2.5);
  }
  sfx.boom();
  res.cells.add(ka); res.cells.add(kb);
  await resolve({ pending: [{ cells: res.cells, pre: [ka, kb] }] });
}

async function tapPower(cell) {
  if (G.busy || G.over) return;
  G.busy = true; clearHint(); setSel(null);
  useMove();
  await resolve({ pending: [{ cells: new Set([key(...cell)]) }] });
  await endTurn();
}

async function useHammer(cell) {
  if (G.busy || G.over) return;
  if (!G.board.get(...cell)) return;
  G.hammer = false;
  if (save.coins < 100) { renderMoves(); return; }
  save.coins -= 100; persist();
  G.busy = true; clearHint();
  renderMoves();
  const [r, c] = cell;
  { const [hx, hy] = cellCenter(r, c); FX.ring(hx, hy, G.S * 1.3, '#fff', 10); FX.shake(8, .3); }
  sfx.boom();
  await resolve({ pending: [{ cells: new Set([key(r, c)]) }] });
  await endTurn();
}

async function forestaleStrike() {
  const f = $('#bossFace');
  f.classList.remove('angry'); void f.offsetWidth; f.classList.add('angry');
  sfx.whistle();
  if (G.shield) {
    G.shield = false;
    toast('Miti para il colpo!', 1100);
    renderMoves();
    await sleep(900);
    return;
  }
  toast('MULTA!', 1000); $('#toast').classList.add('red'); setTimeout(() => $('#toast').classList.remove('red'), 1000);
  await sleep(500);
  const b = G.board;
  const cand = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = b.grid[r][c];
    if (r > 0 && t && !t.rock && !t.power && !t.chain) cand.push([r, c]);
  }
  const n = 2 + Math.floor((G.level.n / 5 - 1) / 2);
  for (let i = 0; i < n && cand.length; i++) {
    const [r, c] = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
    const t = b.grid[r][c];
    t.rock = 1; t.color = -1;
    refreshArt(t);
    G.els.get(t.id).animate([{ transform: pos(r, c) + ' translateY(-60px) scale(1.3)', opacity: 0 }, { transform: pos(r, c), opacity: 1 }], { duration: 380, easing: 'ease-in' });
    await sleep(120);
  }
  await sleep(300);
}

async function endTurn() {
  if (allDone()) { await winLevel(); return; }
  const mg = G.goals.find((g) => g.type === 'multa');
  if (mg && !G.ticketCleared && G.board.ticketCount() > 0) {
    const cell = G.board.spreadTicket();
    if (cell) {
      mg.n++; renderMud(); renderGoals();
      const [r, c] = cell; const [x, y] = cellCenter(r, c);
      FX.ring(x, y, G.S, '#ffd646', 6);
      G.ticketEls[r][c].animate([{ transform: pos(r, c) + ' scale(0) rotate(-40deg)' }, { transform: pos(r, c) + ' scale(1.2)' }, { transform: pos(r, c) }], { duration: 420, easing: 'ease-out' });
      sfx.whistle();
      coach('multa');
    }
  }
  G.ticketCleared = false;
  if (G.boss && G.boss.count <= 0 && G.moves > 0) {
    await forestaleStrike();
    G.boss.count = G.boss.every;
    renderGoals();
  }
  if (G.moves <= 0) { await loseLevel(); return; }
  if (!G.board.hasMoves()) {
    toast('Si rimescola!', 900);
    await sleep(400);
    G.board.shuffle();
    if (!G.board.hasMoves()) {
      const list = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const t = G.board.grid[r][c]; if (t && !t.rock && !t.chain && t.color >= 0) list.push(t); }
      const t = list[Math.floor(Math.random() * list.length)];
      if (t) { t.power = 'bomb'; t.color = -1; }
    }
    repositionAll(false);
    await sleep(400);
  }
  G.busy = false;
  checkStuck();
  scheduleHint();
}

// ---------- vittoria / sconfitta ----------
async function winLevel() {
  G.over = true;
  clearHint();
  if (G.boss) await say('forestale', pick(['Va bene, passate. Ma ho preso la targa!', 'Per oggi niente multa. Ma vi tengo d\'occhio, eh.', 'Il fischietto è scarico... Passate, va.']), 'Arrivederci!');
  else { FX.banner('Livello superato!', '', '#ffd34d'); FX.flash(.3); await sleep(1100); }
  // bonus mosse avanzate: moto che partono a caso
  const left = G.moves;
  const b = G.board;
  const shots = Math.min(left, 6);
  if (shots > 0) {
    FX.banner('Mosse avanzate!', 'Partono le moto', '#7ee06a');
    const cells = new Set();
    for (let i = 0; i < shots; i++) {
      const r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
      const t = b.grid[r][c];
      if (!t || t.rock || t.power) continue;
      t.power = Math.random() < 0.5 ? 'mH' : 'mV'; t.color = -1;
      refreshArt(t);
      cells.add(key(r, c));
      G.moves--; renderMoves();
      await sleep(120);
    }
    await resolve({ pending: [{ cells }] });
  }
  const coins = 50 + left * 10;
  save.stars += 1;
  pendingStar = true;
  save.streak = Math.min(3, (save.streak || 0) + 1);
  save.coins += coins;
  save.level += 1;
  persist();
  sfx.win();
  const nb = nextBuilding();
  const [who, line] = pick(WIN_LINES);
  showCard(`<h2>${pick(WIN_TITLES)}</h2><div class="stars3"><i class="ic ic-star"></i></div>
    <p><b>+1 stella</b> · <b>+${coins} ${IC_C}</b>${nb ? `<br>Con la stella costruisci un pezzo di <b>${nb.name}</b>.` : ''}</p>
    ${speakerHTML(who, line)}
    <div class="row"><button id="cHome" class="btn btn-play">Campo base</button></div>`,
    { cHome: () => { hideCard(); goHome(); } });
}

async function loseLevel() {
  G.over = true;
  sfx.lose();
  const canBuy = save.coins >= 200;
  const left = G.goals.filter((g) => g.done < g.n).map((g) => `${goalLeft(g)}`).join(', ');
  showCard(`${speakerHTML('purcello', `${pick(LOSE_LINES)}<br>Ti mancavano <b>${left}</b>. Con <b>200 ${IC_C}</b> hai <b>5 mosse</b> in più.`)}
    <div class="row">
      <button id="cQuit" class="btn btn-gray">Mollo</button>
      <button id="cMore" class="btn btn-play" ${canBuy ? '' : 'disabled style="filter:grayscale(1)"'}>+5 mosse</button>
    </div>`, {
    cQuit: () => { hideCard(); save.streak = 0; persist(); retryOrHome(); },
    cMore: () => {
      if (!canBuy) return;
      save.coins -= 200; persist();
      hideCard();
      G.moves += 5; G.over = false; G.busy = false;
      renderMoves();
      FX.banner('Spinta di Purcello!', '+5 mosse', '#ff8a1c');
      scheduleHint();
    },
  });
}
function retryOrHome() {
  showCard(`<h2 class="red">Insabbiato!</h2><p>Questo sentiero è tosto. Si riparte?</p>
    <div class="row"><button id="cH" class="btn btn-gray">Campo base</button><button id="cR" class="btn btn-play">Riprova</button></div>`,
  { cH: () => { hideCard(); goHome(); }, cR: () => { hideCard(); startLevel(G.level.n); } });
}

// ---------- suggerimenti ----------
// ---------- suggerimenti ----------
function clearHint() {
  clearTimeout(G.hintT);
  document.querySelectorAll('.hintring,.hinthand').forEach((e) => e.remove());
}
function showHint() {
  clearHint();
  if (G.busy || G.over || !G.board) return;
  const mv = G.board.bestMove(G.goals) || G.board.findMove();
  if (!mv) return;
  const fx = $('#fx');
  const cells = mv.filter(Boolean);
  for (const [r, c] of cells) {
    const d = document.createElement('div');
    d.className = 'hintring';
    d.style.transform = pos(r, c);
    fx.appendChild(d);
  }
  const [a, b] = cells;
  const h = document.createElement('div');
  h.className = 'hinthand';
  h.textContent = '👆';
  const S = G.S;
  h.style.setProperty('--x1', (a[1] + .5) * S + 'px'); h.style.setProperty('--y1', (a[0] + .75) * S + 'px');
  const bb = b || a;
  h.style.setProperty('--x2', (bb[1] + .5) * S + 'px'); h.style.setProperty('--y2', (bb[0] + .75) * S + 'px');
  fx.appendChild(h);
}
function scheduleHint() {
  clearHint();
  G.hintT = setTimeout(showHint, G.level && G.level.n <= 3 ? 2500 : 5000);
}

// consigli dei personaggi quando sei in difficoltà (piccolo fumetto, non blocca il gioco)
const COACH = {
  tile: ['gabbah', 'Cerca le tessere dell\'obiettivo in alto: fai tris con quelle, il resto viene da sé.'],
  mud: ['mirco', 'Il fango si pulisce solo facendo tris <b>sopra</b> le pozze. Quelle col 2 vanno fatte due volte.'],
  rock: ['purcello', 'I sassi si spaccano facendo un tris <b>accanto</b>. Moto e taniche li prendono anche da lontano.'],
  crate: ['gabbah', 'Le casse si aprono con un tris lì vicino. Una tanica ne apre tante in un colpo.'],
  chain: ['renard', 'I pezzi incatenati non si spostano: mettili in un tris con le tessere vicine e la catena salta.'],
  multa: ['forestale', 'Se in un turno non togli nemmeno una multa, se ne aggiunge un\'altra. Toglile in fretta!'],
  boss: ['miti', 'Ogni tessera che rompi scarica la pazienza della Forestale. Combo e power-up la svuotano prima!'],
  power: ['miti', 'Hai un power-up sulla griglia: toccalo o scambialo con un altro per una super combo.'],
  hammer: ['renard', 'Ti manca poco? Il mio <b>martello</b> qui sotto spacca la tessera che vuoi.'],
};
function coach(key, force = false) {
  if (!force && G.coached.has(key)) return;
  G.coached.add(key);
  const [who, text] = COACH[key];
  $('#coach')?.remove();
  const d = document.createElement('div');
  d.id = 'coach';
  d.innerHTML = `<div class="cav" style="background-image:${I(CHARS[who].img)}"></div><p>${text}</p>`;
  d.onclick = () => d.remove();
  $('#game').appendChild(d);
  sfx.click();
  setTimeout(() => d.classList.add('out'), 5200);
  setTimeout(() => d.remove(), 5600);
}
function progressSnapshot() { return G.goals.reduce((s2, g) => s2 + Math.min(g.done, g.n), 0); }
function checkStuck() {
  const now = progressSnapshot();
  if (now > G.lastProg) { G.lastProg = now; G.idleMoves = 0; return; }
  G.idleMoves++;
  const open = G.goals.filter((g) => g.done < g.n);
  if (!open.length) return;
  if (G.moves <= 4 && save.coins >= 100 && !G.coached.has('hammer')) { coach('hammer'); return; }
  if (G.idleMoves >= 3) {
    const hasPower = G.board.grid.flat().some((t) => t && t.power);
    const pick2 = hasPower && !G.coached.has('power') ? 'power' : open.map((g) => g.type).find((t) => !G.coached.has(t));
    if (pick2) { coach(pick2); G.idleMoves = 0; showHint(); }
  }
}
function setSel(cell) {
  document.querySelectorAll('.tile.sel').forEach((e) => e.classList.remove('sel'));
  G.sel = cell;
  if (cell) G.els.get(G.board.grid[cell[0]][cell[1]]?.id)?.classList.add('sel');
}

// ---------- input touch/mouse ----------
let drag = null;
function cellFromEvent(e) {
  const br = $('#board').getBoundingClientRect();
  const c = Math.floor((e.clientX - br.left) / G.S);
  const r = Math.floor((e.clientY - br.top) / G.S);
  return inside(r, c) ? [r, c] : null;
}
function initInput() {
  const el = $('#board');
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (G.busy || G.over) return;
    const cell = cellFromEvent(e);
    if (!cell) return;
    drag = { cell, x: e.clientX, y: e.clientY, moved: false };
    try { el.setPointerCapture(e.pointerId); } catch { /* ok */ }
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag || drag.moved || G.hammer) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < G.S * 0.35) return;
    drag.moved = true;
    const [r, c] = drag.cell;
    const target = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
    trySwap(drag.cell, target);
  });
  const up = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) onTap(d.cell);
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', () => { drag = null; });
}
function onTap(cell) {
  if (G.busy || G.over) return;
  if (G.hammer) { useHammer(cell); return; }
  const t = G.board.get(...cell);
  if (G.sel) {
    const [r, c] = G.sel;
    const adj = Math.abs(r - cell[0]) + Math.abs(c - cell[1]) === 1;
    const prev = G.sel;
    if (adj) { trySwap(prev, cell); return; }
    if (r === cell[0] && c === cell[1]) { setSel(null); if (t?.power) tapPower(cell); return; }
  }
  if (t?.power) { tapPower(cell); return; }
  if (t && !t.rock) setSel(cell); else setSel(null);
}

// ---------- avvio livello ----------
const PRE = [
  { id: 'mH', name: 'Moto', cost: 60, img: 'p_moto' },
  { id: 'bomb', name: 'Tanica', cost: 90, img: 'p_tanica' },
  { id: 'grappa', name: 'Grappa', cost: 140, img: 'p_grappa' },
];
const streakGifts = () => PRE.slice(0, Math.min(save.streak || 0, 3)).map((p) => p.id);

function placeStartPowers(list) {
  const b = G.board;
  const cand = [];
  for (let r = 2; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) {
    const t = b.grid[r][c];
    if (t && !t.rock && !t.chain && !t.power && t.color >= 0) cand.push([r, c]);
  }
  list.forEach((pw, i) => {
    if (!cand.length) return;
    const [r, c] = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
    const t = b.grid[r][c];
    t.power = pw === 'mH' && Math.random() < .5 ? 'mV' : pw; t.color = -1;
    refreshArt(t);
    setTimeout(() => {
      let r2 = r, c2 = c;
      for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) if (G.board.grid[rr][cc] === t) { r2 = rr; c2 = cc; }
      const [x, y] = cellCenter(r2, c2);
      FX.glow(x, y, G.S * 1.4); FX.ring(x, y, G.S * 1.3, '#fff6a0', 7);
      G.els.get(t.id)?.animate([{ transform: pos(r2, c2) + ' scale(0) rotate(-90deg)' }, { transform: pos(r2, c2) + ' scale(1.4)' }, { transform: pos(r2, c2) }], { duration: 480, easing: 'ease-out' });
      beep(620 + i * 120, 0.12, 'triangle', 0.1, 300);
    }, 500 + i * 280);
  });
}

async function startLevel(n, extras = []) {
  const lv = getLevel(n);
  G.level = lv;
  G.board = new Board(lv);
  G.moves = lv.moves;
  G.goals = lv.goals.map((g) => ({ ...g, done: 0 }));
  G.boss = lv.boss ? { ...lv.boss, count: lv.boss.every } : null;
  G.ticketCleared = false; G.coached = new Set(); G.lastProg = 0; G.idleMoves = 0;
  G.over = false; G.busy = false; G.hammer = false; G.shield = false; G.sel = null;
  $('#goals').innerHTML = '';
  $('#gLevel').textContent = n;
  $('#bossbar').classList.toggle('hidden', !G.boss);
  $('#bShield').style.visibility = G.boss ? 'visible' : 'hidden';
  if (G.boss) $('#bossFace').style.backgroundImage = FORESTALE_URI;
  showScreen('game');
  AU.playMusic(lv.boss ? 'boss' : 'game');
  layout();
  buildBoardDOM();
  renderGoals();
  renderMoves();
  scheduleHint();
  if (extras.length) placeStartPowers(extras);
}

async function openLevel() {
  if (G.building || pendingStar) return;
  if (save.level > MAX_LEVEL) {
    await say('gabbah', 'Hai finito tutti i sentieri! Nuove zone (e nuove multe) arrivano coi prossimi aggiornamenti.');
    return;
  }
  const lv = getLevel(save.level);
  const goalsHTML = lv.goals.map((g) => `<div class="goal" style="background-image:${goalURI(g)}"><b>${g.n}</b></div>`).join('');
  const TIPS = [
    ['miti', 'Consiglio da Protettore: due power-up scambiati tra loro fanno una super combo.'],
    ['gabbah', 'Cinque in fila e arriva la Grappa di San Braulio: si porta via un colore intero.'],
    ['purcello', 'Quattro tessere a quadrato e parte il drone: va dritto dove serve.'],
    ['costa', 'Una L o una T fanno la tanica. Tenetela lontana dal mio pesce.'],
    ['mirco', 'Io faccio il tifo da qui. Seduto. Campa giù!'],
    ['renard', 'Se una tessera non si sposta, c\'è il mio martello. Costa poco, giuro.'],
  ];
  const tip = lv.intro || (() => { const t = TIPS[lv.n % TIPS.length]; return { who: t[0], text: t[1] }; })();
  const intro = speakerHTML(tip.who, tip.text);
  const gifts = streakGifts();
  const chosen = new Set();
  const preHTML = PRE.map((p) => {
    const gift = gifts.includes(p.id);
    return `<button class="pre${gift ? ' gift' : ''}" data-id="${p.id}" ${gift ? 'disabled' : ''}>
      <span class="pi" style="background-image:${I(p.img)}"></span><small>${p.name}</small>
      <b>${gift ? 'Regalo' : p.cost + ' ' + IC_C}</b></button>`;
  }).join('');
  const streak = save.streak || 0;
  showCard(`<h2>${lv.boss ? 'Arriva la Forestale!' : `Livello ${lv.n}`}</h2>${intro}
    <div class="goalrow">${goalsHTML}</div><p>Hai <b>${lv.moves} mosse</b>${lv.boss ? '. Svuota la sua pazienza prima che ti riempia di sassi!' : ''}</p>
    <div class="prebox"><div class="prehead">${streak ? `🔥 Serie di vittorie: <b>${streak}</b>` : 'Parti con un aiuto?'}<span>${streak ? 'regali già in griglia' : 'vinci di fila per averli gratis'}</span></div>
    <div class="prerow">${preHTML}</div></div>
    <div class="row"><button id="cBack" class="btn btn-gray">Indietro</button><button id="cPlay" class="btn btn-play">Gioca!</button></div>`,
  { cBack: hideCard, cPlay: () => {
    let cost = 0; chosen.forEach((id) => { cost += PRE.find((p) => p.id === id).cost; });
    save.coins -= cost; persist();
    hideCard(); startLevel(lv.n, [...gifts, ...chosen]);
  } });
  const total = () => [...chosen].reduce((sum, id) => sum + PRE.find((p) => p.id === id).cost, 0);
  document.querySelectorAll('.pre:not(.gift)').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      if (chosen.has(id)) chosen.delete(id);
      else if (total() + PRE.find((p) => p.id === id).cost <= save.coins) chosen.add(id);
      else { toast('Monete finite!', 900); return; }
      btn.classList.toggle('on', chosen.has(id));
    };
  });
}

function goHome() {
  clearHint();
  showScreen('home');
  AU.playMusic('home');
  renderHome();
  if (pendingStar) setTimeout(flyStarToCounter, 350);
}

// ---------- pulsanti ----------
$('#btnPlay').onclick = () => openLevel();
$('#btnBuild').onclick = () => tryBuild();
// ---------- impostazioni ----------
function togglesHTML() {
  const row = (id, label, on) => `<button class="tog${on ? ' on' : ''}" id="${id}"><span>${label}</span><i></i></button>`;
  return `<div class="toggles">${row('tMusic', 'Musica', save.music)}${row('tSfx', 'Suoni', save.sfx)}${row('tVib', 'Vibrazione', save.vibra)}</div>`;
}
function bindToggles() {
  const flip = (id, key, apply) => {
    const b = document.getElementById(id);
    if (!b) return;
    b.onclick = () => { save[key] = !save[key]; persist(); apply(save[key]); b.classList.toggle('on', save[key]); sfx.click(); if (key === 'vibra' && save.vibra) { try { navigator.vibrate && navigator.vibrate(40); } catch { /* */ } } };
  };
  flip('tMusic', 'music', (v) => { AU.setMusic(v); if (v) AU.playMusic($('#game').classList.contains('active') ? (G.boss ? 'boss' : 'game') : 'home'); });
  flip('tSfx', 'sfx', AU.setSfx);
  flip('tVib', 'vibra', FX.setVibra);
}
function openSettings() {
  if (G.building || pendingStar) return;
  showCard(`<h2>Impostazioni</h2>${togglesHTML()}
    <div class="row"><button id="cReset" class="btn btn-red">Ricomincia da zero</button></div>
    <div class="row"><button id="cClose" class="btn btn-play">Fatto</button></div>`,
  { cClose: hideCard, cReset: confirmReset });
  bindToggles();
}
function confirmReset() {
  showCard(`<h2 class="red">Ricominci da zero?</h2>
    <p>Perdi <b>stelle, monete, livelli</b> e tutto il <b>Campo Base</b>. Non si torna indietro.</p>
    <div class="row"><button id="cNo" class="btn btn-gray">No, tengo tutto</button><button id="cYes" class="btn btn-red">Sì, azzera</button></div>`,
  { cNo: openSettings, cYes: () => {
    const keep = { music: save.music, sfx: save.sfx, vibra: save.vibra };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...keep })); } catch { /* */ }
    location.reload();
  } });
}
$('#btnSettings').onclick = openSettings;
$('#btnBack').onclick = () => {
  if (G.busy) return;
  showCard(`<h2>Pausa</h2>${togglesHTML()}
    <div class="row"><button id="cL" class="btn btn-red">Esci dal livello</button><button id="cS" class="btn btn-play">Riprendi</button></div>
    <p class="small">Se esci adesso perdi questo giro e la serie di vittorie.</p>`,
  { cS: hideCard, cL: () => { hideCard(); G.over = true; save.streak = 0; persist(); goHome(); } });
  bindToggles();
};
$('#bHelp').onclick = () => { if (G.busy || G.over) return; sfx.click(); showHint(); const open = G.goals.filter((g) => g.done < g.n).map((g) => g.type); const k = open.find((t) => !G.coached.has(t)) || open[0]; if (k && COACH[k]) coach(k, true); };
$('#bHammer').onclick = () => {
  if (G.busy || G.over) return;
  if (!G.hammer && save.coins < 100) { toast('Servono 100 monete', 1000); return; }
  G.hammer = !G.hammer;
  if (G.hammer) toast('Tocca cosa spaccare', 1000);
  renderMoves();
};
$('#bShield').onclick = () => {
  if (G.busy || G.over || G.shield) return;
  if (save.coins < 150) { toast('Servono 150 monete', 900); return; }
  save.coins -= 150; persist();
  G.shield = true;
  toast('Miti ti copre!', 1000);
  renderMoves();
};
window.addEventListener('resize', () => {
  if ($('#game').classList.contains('active') && G.board) { layout(); repositionAll(); }
});

FX.initFX($('#fxc'), app);
// precarica tutte le immagini prima di mostrare il gioco
const ASSETS = ['map_bg', 't0_birra', 't1_casco', 't2_maschera', 't3_chiave', 't4_gomma', 't5_stivale', 'p_moto', 'p_moto_v', 'p_tanica', 'p_grappa', 'p_drone',
  'o_sasso1', 'o_sasso2', 'o_fango1', 'o_fango2', 'o_cassa1', 'o_cassa2', 'o_catena', 'o_multa', 'forestale', 'b_cantiere',
  ...BUILDINGS.map((b) => 'b_' + b.id), ...Object.values(CHARS).map((c) => c.img), 'u_stella', 'u_moneta', 'u_martello', 'u_scudo', 'u_lucchetto', 'u_nuvola'];
const preload = Promise.all(ASSETS.map((n) => new Promise((res) => { const im = new Image(); im.onload = im.onerror = () => res(); im.src = SRC(n); if (im.decode) im.decode().then(res, res); })));
document.addEventListener('visibilitychange', () => AU.pause(document.hidden));
initInput();
renderHome();
AU.playMusic('home');
preload.then(() => { const l = $('#loading'); if (l) { l.classList.add('done'); setTimeout(() => l.remove(), 400); } });
if (!save.welcomed) {
  save.welcomed = true; persist();
  setTimeout(() => say('gabbah', 'Benvenuto in <b>EDT Kingdom</b>! Ogni livello vinto vale una stella, e con le stelle tiriamo su il Campo Base dell\'Enduro Drinking Team. Occhio alla Forestale, che ha già il blocchetto in mano.', 'Si parte!'), 300);
}

// per i test automatici
window.__EDT = { G, save, startLevel, trySwap, goHome };
