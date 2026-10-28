// EDT Kingdom — interfaccia, animazioni, campo base
import { Board, ROWS, COLS, key, unkey, inside } from './engine.js';
import { getLevel, MAX_LEVEL } from './levels.js';
import { BUILDINGS, CHARS } from './kingdom.js';
import * as FX from './fx.js';

const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const app = $('#app');

// ---------- grafica in cache ----------
const I = (n) => `url('img/${n}.webp')`;
const TILE_URI = ['t0_birra', 't1_casco', 't2_maschera', 't3_chiave', 't4_gomma', 't5_stivale'].map(I);
const POWER_URI = { mH: I('p_moto'), mV: I('p_moto_v'), bomb: I('p_tanica'), grappa: I('p_grappa'), drone: I('p_drone') };
const ROCK_URI = [null, I('o_sasso1'), I('o_sasso2')];
const MUD_URI = [null, I('o_fango1'), I('o_fango2')];
const FORESTALE_URI = I('forestale');

// ---------- salvataggio ----------
const SAVE_KEY = 'edtKingdom_v1';
const save = (() => {
  const def = { level: 1, stars: 0, coins: 300, built: [], welcomed: false, muted: false };
  try { return { ...def, ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch { return def; }
})();
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* niente */ } };

// ---------- audio (effetti sintetizzati; la musica sarà quella del Gabbah) ----------
let actx = null;
function beep(freq = 440, dur = 0.08, type = 'sine', vol = 0.12, slide = 0) {
  if (save.muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, actx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), actx.currentTime + dur);
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.connect(g).connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur + 0.02);
  } catch { /* audio non disponibile */ }
}
const sfx = {
  pop: (n = 0) => beep(520 + n * 70, 0.09, 'triangle', 0.1),
  swap: () => beep(300, 0.06, 'sine', 0.08, 120),
  bad: () => beep(180, 0.15, 'square', 0.06, -60),
  moto: () => beep(140, 0.35, 'sawtooth', 0.07, 260),
  boom: () => beep(90, 0.4, 'sawtooth', 0.12, -50),
  power: () => beep(660, 0.18, 'triangle', 0.1, 400),
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'triangle', 0.12), i * 120)),
  lose: () => [392, 330, 262].forEach((f, i) => setTimeout(() => beep(f, 0.22, 'triangle', 0.1), i * 160)),
  whistle: () => { beep(1800, 0.12, 'sine', 0.08); setTimeout(() => beep(1800, 0.3, 'sine', 0.08), 160); },
  build: () => [392, 523, 659].forEach((f, i) => setTimeout(() => beep(f, 0.14, 'square', 0.06), i * 90)),
};

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
const nextBuilding = () => BUILDINGS.find((b) => !save.built.includes(b.id));

function renderHome(popId = null) {
  $('#hStars').textContent = save.stars;
  $('#hCoins').textContent = save.coins;
  $('#hLevel').textContent = Math.min(save.level, MAX_LEVEL);
  const map = $('#map');
  map.style.backgroundImage = I('map_bg');
  map.innerHTML = '';
  const nb = nextBuilding();
  for (const b of BUILDINGS) {
    const built = save.built.includes(b.id);
    const isNext = !built && b === nb;
    const d = document.createElement('div');
    d.className = 'bld ' + (built ? 'built' : isNext ? 'next' : 'ghost') + (b.id === popId ? ' pop' : '');
    d.style.left = b.x + '%';
    d.style.top = (14 + b.y * 0.72) + '%';
    d.innerHTML = `<div class="img" style="background-image:${I(built || !isNext ? 'b_' + b.id : 'b_cantiere')}"></div>
      <div class="tag">${built ? b.name : isNext ? `🔨 ${b.name} · ⭐${b.cost}` : `🔒 ${b.name}`}</div>`;
    if (isNext) d.onclick = () => tryBuild();
    map.appendChild(d);
  }
  const btnB = $('#btnBuild');
  if (nb) {
    $('#buildCost').textContent = `⭐ ${save.stars}/${nb.cost}`;
    btnB.disabled = false;
  } else {
    $('#buildCost').textContent = 'Campo completo!';
    btnB.disabled = true;
  }
  $('#btnPlay').innerHTML = save.level > MAX_LEVEL ? 'Finito! 🏆' : `Livello <b>${save.level}</b>`;
}

async function tryBuild() {
  const nb = nextBuilding();
  if (!nb) return;
  if (save.stars < nb.cost) {
    showCard(`${speakerHTML('gabbah', `Per <b>${nb.name}</b> servono <b>${nb.cost} ⭐</b> e ne hai ${save.stars}. Fai ancora qualche giro e torniamo col materiale.`)}
      <div class="row"><button id="cNo" class="btn btn-gray">Dopo</button><button id="cGo" class="btn btn-play">Gioca!</button></div>`,
      { cNo: hideCard, cGo: () => { hideCard(); openLevel(); } });
    return;
  }
  save.stars -= nb.cost;
  save.built.push(nb.id);
  persist();
  sfx.build();
  renderHome(nb.id);
  await sleep(700);
  await say(nb.who, nb.text, 'Grande!');
  if (!nextBuilding()) await say('forestale', 'Un campo base intero, con tanto di statua? Qui serve il blocchetto grande. Tornerò con i rinforzi!', 'Ti aspettiamo');
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
  wrap.style.width = G.S * COLS + 8 + 'px';
  wrap.style.height = G.S * ROWS + 8 + 'px';
}

const pos = (r, c) => `translate(${c * G.S}px, ${r * G.S}px)`;

function artFor(t) {
  if (t.rock) return ROCK_URI[t.rock];
  if (t.power) return POWER_URI[t.power];
  return TILE_URI[t.color];
}
function makeTileEl(t, r, c) {
  const el = document.createElement('div');
  el.className = 'tile' + (t.power ? ' power' : '');
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
}

function buildBoardDOM() {
  const b = $('#board');
  b.innerHTML = '';
  G.els.clear();
  G.mudEls = [];
  for (let r = 0; r < ROWS; r++) {
    G.mudEls.push([]);
    for (let c = 0; c < COLS; c++) {
      const bg = document.createElement('div');
      bg.className = 'cellbg' + ((r + c) % 2 ? ' dark' : '');
      bg.style.transform = pos(r, c);
      b.appendChild(bg);
      const m = document.createElement('div');
      m.className = 'mud';
      m.style.transform = pos(r, c);
      b.appendChild(m);
      G.mudEls[r].push(m);
    }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) makeTileEl(G.board.grid[r][c], r, c);
  renderMud();
}
function renderMud() {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const v = G.board.mud[r][c];
    const m = G.mudEls[r][c];
    m.style.backgroundImage = v ? MUD_URI[v] : 'none';
    m.style.opacity = v ? 1 : 0;
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
  document.querySelectorAll('.cellbg,.mud').forEach((el, i) => {
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
  const bx = br.left - ar.left + 4, by = br.top - ar.top + 4;
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
    sfx.power();
    FX.rays(x, y, S * 4); FX.glow(x, y, S * 2, 'rgba(255,240,170,.9)'); FX.flash(.45);
    let i = 0;
    for (const k of cells) {
      const [rr, cc] = unkey(k);
      const [tx, ty] = cellCenter(rr, cc);
      setTimeout(() => { FX.streak(x, y, tx, ty, '#fff3a8', 4); FX.ring(tx, ty, S * .7, '#ffffff', 5); }, (i++ % 16) * 25);
    }
    FX.shake(6, .35);
  } else if (power === 'drone') {
    sfx.power();
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
    if (gl.type === 'boss' && (type === 'tile' || type === 'rock' || type === 'mud')) { gl.done += type === 'rock' ? 2 : 1; hit = 'boss'; }
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
      credit('rock', r, c);
    } else { refreshArt(t); credit('boss', r, c); }
  }
  for (const k of clear) {
    const [r, c] = unkey(k);
    const t = b.grid[r][c];
    if (!t || t.rock !== 0 && t.rock !== undefined && t.rock > 0) continue;
    if (rockHits.has(k)) continue;
    if (protect.has(k)) {
      credit('tile', r, c, t.color);
    } else {
      if (t.color >= 0) credit('tile', r, c, t.color);
      else credit('boss', r, c);
      killTile(t, r, c, n++);
      b.grid[r][c] = null;
    }
    if (b.mud[r][c] > 0) { b.mud[r][c]--; credit('mud', r, c); }
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
    const d = m.to - m.from;
    el.style.transitionDuration = (0.08 + d * 0.05) + 's';
    el.style.transform = pos(m.to, m.c);
    maxD = Math.max(maxD, d);
  }
  for (const s of spawns) {
    const el = makeTileEl(s.tile, s.from, s.c);
    el.style.transition = 'none';
    el.style.transform = pos(s.from, s.c);
    void el.offsetWidth;
    const d = s.to - s.from;
    el.style.transition = '';
    el.style.transitionDuration = (0.08 + d * 0.05) + 's';
    el.style.transform = pos(s.to, s.c);
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
      beep(520 + step * 90, 0.12, 'triangle', 0.1, 240);
      if (step >= 2) FX.shake(2 + step * 1.5, .3);
    }
    await applyGravity();
    step++;
  }
}

// ---------- mosse ----------
function useMove() {
  G.moves--;
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
    for (const k of res.convert.cells) {
      const [rr, cc] = unkey(k);
      const t = b.grid[rr][cc];
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
  const bx = br.left - ar.left + 4, by = br.top - ar.top + 4;
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
    if (t && !t.rock && !t.power) cand.push([r, c]);
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
    repositionAll(false);
    await sleep(400);
  }
  G.busy = false;
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
  save.coins += coins;
  save.level += 1;
  persist();
  sfx.win();
  const nb = nextBuilding();
  const [who, line] = pick(WIN_LINES);
  showCard(`<h2>${pick(WIN_TITLES)}</h2><div class="stars3">⭐</div>
    <p><b>+1 stella</b> · <b>+${coins} 🪙</b>${nb && save.stars >= nb.cost ? `<br>Hai le stelle per costruire <b>${nb.name}</b>.` : ''}</p>
    ${speakerHTML(who, line)}
    <div class="row"><button id="cHome" class="btn btn-play">Campo base</button></div>`,
    { cHome: () => { hideCard(); goHome(); } });
}

async function loseLevel() {
  G.over = true;
  sfx.lose();
  const canBuy = save.coins >= 200;
  const left = G.goals.filter((g) => g.done < g.n).map((g) => `${goalLeft(g)}`).join(', ');
  showCard(`${speakerHTML('purcello', `${pick(LOSE_LINES)}<br>Ti mancavano <b>${left}</b>. Con <b>200 🪙</b> hai <b>5 mosse</b> in più.`)}
    <div class="row">
      <button id="cQuit" class="btn btn-gray">Mollo</button>
      <button id="cMore" class="btn btn-play" ${canBuy ? '' : 'disabled style="filter:grayscale(1)"'}>+5 mosse</button>
    </div>`, {
    cQuit: () => { hideCard(); retryOrHome(); },
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
function clearHint() {
  clearTimeout(G.hintT);
  document.querySelectorAll('.tile.hint').forEach((e) => e.classList.remove('hint'));
}
function scheduleHint() {
  clearHint();
  G.hintT = setTimeout(() => {
    if (G.busy || G.over) return;
    const mv = G.board.findMove();
    if (!mv) return;
    mv.filter(Boolean).forEach(([r, c]) => G.els.get(G.board.grid[r][c].id)?.classList.add('hint'));
  }, 6000);
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
  const c = Math.floor((e.clientX - br.left - 4) / G.S);
  const r = Math.floor((e.clientY - br.top - 4) / G.S);
  return inside(r, c) ? [r, c] : null;
}
function initInput() {
  const el = $('#board');
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    beep(0, 0.001, 'sine', 0.0001); // sblocca l'audio su iOS
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
async function startLevel(n) {
  const lv = getLevel(n);
  G.level = lv;
  G.board = new Board(lv);
  G.moves = lv.moves;
  G.goals = lv.goals.map((g) => ({ ...g, done: 0 }));
  G.boss = lv.boss ? { ...lv.boss, count: lv.boss.every } : null;
  G.over = false; G.busy = false; G.hammer = false; G.shield = false; G.sel = null;
  $('#goals').innerHTML = '';
  $('#gLevel').textContent = n;
  $('#bossbar').classList.toggle('hidden', !G.boss);
  $('#bShield').style.visibility = G.boss ? 'visible' : 'hidden';
  if (G.boss) $('#bossFace').style.backgroundImage = FORESTALE_URI;
  showScreen('game');
  layout();
  buildBoardDOM();
  renderGoals();
  renderMoves();
  scheduleHint();
}

async function openLevel() {
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
  showCard(`<h2>${lv.boss ? 'Arriva la Forestale!' : `Livello ${lv.n}`}</h2>${intro}
    <div class="goalrow">${goalsHTML}</div><p>Hai <b>${lv.moves} mosse</b>${lv.boss ? '. Svuota la sua pazienza prima che ti riempia di sassi!' : ''}</p>
    <div class="row"><button id="cBack" class="btn btn-gray">Indietro</button><button id="cPlay" class="btn btn-play">Gioca!</button></div>`,
  { cBack: hideCard, cPlay: () => { hideCard(); startLevel(lv.n); } });
}

function goHome() {
  clearHint();
  showScreen('home');
  renderHome();
}

// ---------- pulsanti ----------
$('#btnPlay').onclick = () => openLevel();
$('#btnBuild').onclick = () => tryBuild();
$('#btnBack').onclick = () => {
  if (G.busy) return;
  showCard(`<h2 class="red">Torni al campo?</h2><p>Se esci adesso perdi questo giro.</p>
    <div class="row"><button id="cS" class="btn btn-play">Resto</button><button id="cL" class="btn btn-red">Esco</button></div>`,
  { cS: hideCard, cL: () => { hideCard(); G.over = true; goHome(); } });
};
$('#bHammer').onclick = () => {
  if (G.busy || G.over) return;
  if (!G.hammer && save.coins < 100) { toast('Servono 100 🪙', 1000); return; }
  G.hammer = !G.hammer;
  if (G.hammer) toast('Tocca cosa spaccare', 1000);
  renderMoves();
};
$('#bShield').onclick = () => {
  if (G.busy || G.over || G.shield) return;
  if (save.coins < 150) { toast('Servono 150 🪙', 900); return; }
  save.coins -= 150; persist();
  G.shield = true;
  toast('Miti ti copre!', 1000);
  renderMoves();
};
window.addEventListener('resize', () => {
  if ($('#game').classList.contains('active') && G.board) { layout(); repositionAll(); }
});

FX.initFX($('#fxc'), app);
initInput();
renderHome();
if (!save.welcomed) {
  save.welcomed = true; persist();
  setTimeout(() => say('gabbah', 'Benvenuto in <b>EDT Kingdom</b>! Ogni livello vinto vale una stella, e con le stelle tiriamo su il Campo Base dell\'Enduro Drinking Team. Occhio alla Forestale, che ha già il blocchetto in mano.', 'Si parte!'), 300);
}

// per i test automatici
window.__EDT = { G, save, startLevel, trySwap, goHome };
