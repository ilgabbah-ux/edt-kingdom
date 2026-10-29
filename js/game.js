// EDT Kingdom — interfaccia, animazioni, campo base
import { Board, ROWS, COLS, key, unkey, inside, newTile } from './engine.js';
import { getLevel, MAX_LEVEL } from './levels.js';
import { BUILDINGS, CHARS, ZONES, zoneOfLevel } from './kingdom.js';
import * as FX from './fx.js';
import * as AU from './audio.js';
import * as RANK from './rank.js';
import { initStory, playStory, STORY, STORY_ORDER } from './story.js';
import * as V from './viral.js';

const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const app = $('#app');

// ---------- grafica in cache ----------
const SRC = (n) => (window.__A && window.__A[n]) || `img/${n}.webp`;
const I = (n) => `url('${SRC(n)}')`;
const TILE_URI = ['t0_birra', 't1_casco', 't2_maschera', 't3_chiave', 't4_gomma', 't5_stivale'].map(I);
const RIDER_UP = I('r_up'), RIDER_DOWN = I('r_down');
const RIDE_URI = { mH: I('fx_moto'), mV: I('fx_moto_v'), drone: I('fx_drone') };   // senza medaglione, per le animazioni
const POWER_URI = { mH: I('p_moto'), mV: I('p_moto_v'), bomb: I('p_tanica'), grappa: I('p_grappa'), drone: I('p_drone') };
const ROCK_URI = [null, I('o_sasso1'), I('o_sasso2')];
const MUD_URI = [null, I('o_fango1'), I('o_fango2')];
let FORESTALE_URI = I('forestale');
const CRATE_URI = [null, I('o_cassa1'), I('o_cassa2')];
let CHAIN_URI = I('o_catena');
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
  return `<div class="speaker talk-${who}"><div class="avatar talking" style="background-image:${I(ch.img)}"></div>
    <div class="bubble"><b>${ch.name}</b><p>${text}</p></div></div>`;
}
// voci dei personaggi (ElevenLabs): 0 e 1 = battute, 2 = esultanza (per la Forestale: resa)
const VOICED = ['gabbah', 'miti', 'mirco', 'purcello', 'costa', 'renard', 'svetlana', 'forestale'];
let vAudio = null, lastVoice = 0;
if (save.voice === undefined) save.voice = true;
function voice(who, idx = -1, minGap = 0) {
  if (!save.voice || !save.sfx) return;
  const w = (who || '').startsWith('forestale') ? 'forestale' : who;
  if (!VOICED.includes(w)) return;
  const now = performance.now();
  if (now - lastVoice < minGap) return;
  lastVoice = now;
  const i = idx >= 0 ? idx : Math.floor(Math.random() * 2);
  const src = (window.__V && window.__V['v_' + w + i]) || `audio/v_${w}${i}.mp3`;
  try {
    if (vAudio) vAudio.pause();
    vAudio = new Audio(src); vAudio.volume = 1;
    vAudio.play().catch(() => {});
    AU.duck(1.8);
  } catch { /* niente */ }
}
function say(who, text, btn = 'Ok!', vIdx = -1) {
  voice(who, vIdx);
  return new Promise((res) => showCard(`${speakerHTML(who, text)}<div class="row"><button id="cOk" class="btn btn-play">${btn}</button></div>`,
    { cOk: () => { hideCard(); res(); } }));
}

// =================== CAMPO BASE ===================
const STEPS = 3;
const STEP_COST = 2;   // stelle per ogni tappa di costruzione
if (!save.steps) { save.steps = {}; (save.built || []).forEach((id) => { save.steps[id] = STEPS; }); }
if (!save.best) save.best = {};
if (!save.inv) save.inv = { mH: 0, bomb: 0, grappa: 0 };
// vecchi salvataggi: i livelli già vinti valgono almeno 1 stella
for (let n = 1; n < Math.min(save.level, 61); n++) if (!save.best[n]) save.best[n] = 1;
const stepsOf = (b) => save.steps[b.id] || 0;
const isBuilt = (b) => stepsOf(b) >= STEPS;
const nextBuilding = () => BUILDINGS.find((b) => !isBuilt(b));
const zoneOf = (b) => ZONES.find((z) => z.id === b.zone);
const zoneDone = (z) => z.buildings.every(isBuilt);
let pendingStar = 0;      // stelle in volo verso il contatore
let viewZone = null;      // zona che si sta guardando

function bldTop(b) { return 14 + b.y * 0.72; }
// quanto dell'edificio è già su (dal basso): tappa 0 niente, 1 fondamenta, 2 metà, 3 finito
const RISE = [0, 0.3, 0.68, 1];
const riseClip = (st) => `inset(${Math.round((1 - RISE[Math.max(0, Math.min(st, STEPS))]) * 100)}% 0 0 0)`;
function currentZone() { const nb = nextBuilding(); return nb ? zoneOf(nb) : ZONES[ZONES.length - 1]; }

// converte un punto dell'immagine della mappa (1280x1280, "cover") in pixel sullo schermo
function mapPoint(map, x, y) {
  const W = map.clientWidth, H = map.clientHeight, k = Math.max(W / 1280, H / 1280);
  return [(W - 1280 * k) / 2 + x * k, (H - 1280 * k) / 2 + y * k];
}

function renderHome(popId = null) {
  renderWeekBadge();
  $('#albPct').textContent = `${V.albumCount()}/${V.albumTotal()}`;
  $('#hStars').textContent = save.stars - pendingStar;
  $('#hCoins').textContent = save.coins;
  const zone = viewZone || currentZone();
  const map = $('#map');
  map.style.backgroundImage = I(zone.bg);
  map.innerHTML = '';
  map.dataset.zone = zone.id;
  [[3, 34, 46], [9, 24, 62], [1, 28, 38]].forEach(([top, w, dur], i) => {
    const cl = document.createElement('div');
    cl.className = 'cloud';
    Object.assign(cl.style, { top: top + '%', left: '0', width: w + '%', aspectRatio: '2.2', animationDuration: dur + 's', animationDelay: (-dur * (i * .37 + .1)) + 's' });
    map.appendChild(cl);
  });
  const nb = nextBuilding();
  for (const b of zone.buildings) {
    const built = isBuilt(b);
    const isNext = b === nb;
    const st = stepsOf(b);
    const d = document.createElement('div');
    d.className = 'bld ' + (built ? 'built' : isNext ? 'next' : 'ghost') + (b.id === popId ? ' pop' : '');
    d.dataset.id = b.id;
    d.style.left = b.x + '%';
    d.style.top = bldTop(b) + '%';
    d.innerHTML = (isNext ? `<div class="img ghostL" style="background-image:${I('b_' + b.id)}"></div><div class="img rise" style="background-image:${I('b_' + b.id)};clip-path:${riseClip(st)}"></div><div class="img scaf s${st}" style="background-image:${I('b_cantiere')}"></div>`
      : `<div class="img" style="background-image:${I('b_' + b.id)}"></div>`) + `
      ${isNext ? `<div class="pbar"><i style="width:${st / STEPS * 100}%"></i><span>${st}/${STEPS}</span></div>` : ''}
      ${built ? '<div class="flags"><i></i><i></i></div>' : ''}
      ${built && CHARS[b.who] ? `<div class="resident" style="background-image:${I(CHARS[b.who].img)};animation-delay:${(b.x + b.y) % 7 * -0.4}s"></div>` : ''}
      ${built && (b.id === 'bar' || b.id === 'rifugio' || b.id === 'sauna') ? '<div class="smoke"><i></i><i></i><i></i></div>' : ''}
      <div class="tag">${built ? b.name : isNext ? `<i class="ic ic-hammer"></i> ${b.name}` : `<i class="ic ic-lock"></i> ${b.name}`}</div>`;
    d.onclick = () => (isNext ? tryBuild() : built ? say(b.who, b.text, 'Bello!') : lockedInfo(b));
    map.appendChild(d);
  }
  if (nb && zoneOf(nb) === zone && save.stars >= STEP_COST) {
    const a = document.createElement('div');
    a.className = 'arrow'; a.textContent = '▼';
    a.style.left = nb.x + '%'; a.style.top = (bldTop(nb) - 12) + '%';
    map.appendChild(a);
  }
  // la moto che gira sul sentiero (solo se c'è almeno un edificio costruito nella zona)
  if (zone.trail && zone.buildings.some(isBuilt)) startTrailRider(map, zone.trail);
  // cartello della zona e frecce per guardare le altre zone sbloccate
  const zi = ZONES.indexOf(zone), cz = ZONES.indexOf(currentZone());
  const sign = document.createElement('div');
  sign.className = 'zonesign';
  sign.innerHTML = `${zi > 0 ? '<button class="zarr" data-d="-1">◀</button>' : ''}<span>${zone.name}</span>${zi < cz ? '<button class="zarr" data-d="1">▶</button>' : ''}`;
  sign.querySelectorAll('.zarr').forEach((bt) => { bt.onclick = (e) => { e.stopPropagation(); viewZone = ZONES[zi + +bt.dataset.d]; sfx.click(); renderHome(); }; });
  map.appendChild(sign);

  const btnB = $('#btnBuild');
  if (nb) {
    $('#job').hidden = false;
    $('#jobImg').style.backgroundImage = I('b_' + nb.id);
    $('#jobName').textContent = nb.name;
    $('#jobSteps').innerHTML = Array.from({ length: STEPS }, (_, k) => `<i class="${k < stepsOf(nb) ? 'on' : ''}"></i>`).join('');
    const ok = save.stars >= STEP_COST;
    btnB.classList.toggle('ready', ok); btnB.classList.toggle('wait', !ok);
    $('#buildLbl').textContent = 'Costruisci';
    $('#buildCost').innerHTML = (ok ? 'usa ' : 'serve ') + IC_S + ' ' + STEP_COST;
  } else {
    $('#jobImg').style.backgroundImage = I('b_palazzo');
    $('#jobName').textContent = 'Campo Base completo!';
    $('#jobSteps').innerHTML = '';
    btnB.classList.remove('ready'); btnB.classList.add('wait');
    $('#buildLbl').textContent = 'Fatto'; $('#buildCost').textContent = 'Completo';
  }
  $('#btnPlay').innerHTML = save.level > MAX_LEVEL ? 'Finito! 🏆' : `Gioca <b>livello ${save.level}</b>`;
}

let riderRAF = 0;
// Miti che fa il giro del Campo Base: sale sul sentiero e poi torna giù, con sobbalzi e polvere
function startTrailRider(map, trail) {
  cancelAnimationFrame(riderRAF);
  const el = document.createElement('div');
  el.className = 'trailrider';
  el.innerHTML = '<i></i>';
  const spr = el.firstChild;
  el.onclick = (e) => { e.stopPropagation(); sfx.moto(); say('miti', 'Sono io che faccio il giro del Campo Base per riprendere i lavori con la GoPro! Più edifici costruisci, più è bello il giro.', 'Vai Miti!'); };
  map.appendChild(el);
  const segs = []; let tot = 0;
  for (let i = 1; i < trail.length; i++) { const d = Math.hypot(trail[i][0] - trail[i - 1][0], trail[i][1] - trail[i - 1][1]); segs.push(d); tot += d; }
  const leg = 30000, t0 = performance.now();   // 30 s in salita, 30 s in discesa
  let lastDust = 0, lastUp = null;
  const home = $('#home');
  const at = (dist) => {
    let i = 0;
    while (i < segs.length - 1 && dist > segs[i]) { dist -= segs[i]; i++; }
    const f = Math.min(1, dist / segs[i]);
    return [trail[i][0] + (trail[i + 1][0] - trail[i][0]) * f, trail[i][1] + (trail[i + 1][1] - trail[i][1]) * f];
  };
  const step = (now) => {
    // fuori dal Campo Base il giro si ferma (riparte con renderHome quando si torna)
    if (!el.isConnected || !home.classList.contains('active')) { riderRAF = 0; return; }
    const ph = ((now - t0) % (leg * 2)) / leg;   // 0..2
    const up = ph < 1;
    // velocità che rallenta un po' nelle curve: si usa una piccola ondulazione
    const k = up ? ph : 2 - ph;
    const dist = k * tot;
    const [x, y] = at(dist);
    const [x2, y2] = at(Math.min(tot, Math.max(0, dist + (up ? 14 : -14))));
    const [px, py] = mapPoint(map, x, y);
    const dirX = x2 >= x ? 1 : -1;
    const sc = 0.55 + (y / 1280) * 0.55;   // più piccolo in lontananza
    const bob = Math.abs(Math.sin(now / 90)) * 2.2;
    if (up !== lastUp) { lastUp = up; spr.style.backgroundImage = up ? RIDER_UP : RIDER_DOWN; }
    el.style.transform = `translate(${px}px, ${py}px) scale(${sc})`;
    spr.style.transform = `translate(-50%, ${-88 - bob}%) scaleX(${dirX})`;
    if (now - lastDust > 140) {
      lastDust = now;
      const p = document.createElement('b'); p.className = 'tdust';
      p.style.transform = `translate(${px - 6 + Math.random() * 6}px, ${py - 6}px) scale(${sc})`;
      map.appendChild(p); setTimeout(() => p.remove(), 900);
    }
    riderRAF = requestAnimationFrame(step);
  };
  riderRAF = requestAnimationFrame(step);
}

function lockedInfo(b) {
  const idx = BUILDINGS.indexOf(b);
  const before = BUILDINGS.slice(0, idx).reduce((s, x) => s + (STEPS - stepsOf(x)) * STEP_COST, 0);
  const nb = nextBuilding();
  say('gabbah', `<b>${b.name}</b> arriva più avanti. Prima finiamo <b>${nb.name}</b>: servono ancora <b>${before} ${IC_S}</b> prima di arrivarci.`, 'Ok');
}

async function tryBuild() {
  const nb = nextBuilding();
  if (!nb || G.building || pendingStar) return;
  if (viewZone && viewZone !== zoneOf(nb)) { viewZone = null; renderHome(); }
  if (save.stars < STEP_COST) {
    showCard(`${speakerHTML('gabbah', `Ogni pezzo di <b>${nb.name}</b> costa <b>${STEP_COST} ${IC_S}</b> e ne hai ${save.stars}. Vinci i livelli: con poche mosse usate prendi fino a <b>3 ${IC_S}</b>!`)}
      <div class="row"><button id="cNo" class="btn btn-gray">Dopo</button><button id="cGo" class="btn btn-play">Gioca!</button></div>`,
      { cNo: hideCard, cGo: () => { hideCard(); openLevel(); } });
    return;
  }
  G.building = true;
  save.stars -= STEP_COST;
  save.steps[nb.id] = stepsOf(nb) + 1;
  persist();
  const done = isBuilt(nb);
  const zoneFinished = done && zoneDone(zoneOf(nb));
  const map = $('#map');
  const el0 = map.querySelector(`.bld[data-id="${nb.id}"]`);
  map.style.transformOrigin = `${nb.x}% ${bldTop(nb)}%`;
  map.style.transform = 'scale(1.45)';
  $('#hStars').textContent = save.stars;
  const ar = app.getBoundingClientRect();
  // le stelle volano dal contatore al cantiere
  await sleep(450);
  {
    const pill = $('#hStars').parentElement.getBoundingClientRect();
    const tr = el0.getBoundingClientRect();
    for (let k = 0; k < STEP_COST; k++) {
      const st = document.createElement('div'); st.className = 'flystar ic-star';
      const x0 = pill.left - ar.left + 18, y0 = pill.top - ar.top + 18;
      const x1 = tr.left - ar.left + tr.width * .5, y1 = tr.top - ar.top + tr.height * .5;
      st.style.left = x0 + 'px'; st.style.top = y0 + 'px'; app.appendChild(st);
      st.animate([{ transform: 'translate(-50%,-50%) scale(.6)' }, { transform: `translate(calc(-50% + ${(x1 - x0) * .5}px), calc(-50% + ${(y1 - y0) * .5 - 90}px)) scale(1.4) rotate(180deg)` }, { transform: `translate(calc(-50% + ${x1 - x0}px), calc(-50% + ${y1 - y0}px)) scale(.4) rotate(360deg)` }], { duration: 700, delay: k * 140, easing: 'ease-in-out', fill: 'forwards' });
      setTimeout(() => { st.remove(); beep(880 + k * 220, .08, 'triangle', .08); FX.burst(x1, y1, '#ffd34d', 8, 1); }, 700 + k * 140);
    }
  }
  await sleep(850);
  const el = map.querySelector(`.bld[data-id="${nb.id}"]`);
  const r = el.getBoundingClientRect();
  const cx = r.left - ar.left + r.width / 2, cy = r.top - ar.top + r.height * .55;
  // il personaggio dell'edificio arriva di corsa e martella
  const who = CHARS[nb.who] ? nb.who : 'gabbah';
  const wk = document.createElement('div');
  wk.className = 'worker'; wk.style.backgroundImage = I(CHARS[who].img);
  wk.style.left = (cx - r.width * .6) + 'px'; wk.style.top = (cy - r.height * .05) + 'px';
  app.appendChild(wk);
  const h = document.createElement('div');
  h.className = 'hammer ic-hammer';
  h.style.left = (cx + r.width * .12) + 'px'; h.style.top = (cy - r.height * .55) + 'px';
  app.appendChild(h);
  // pezzi che cadono e si incastrano
  const PIECES = ['#a8683a', '#c94a2a', '#8a8f99', '#e9b23a'];
  for (let k = 0; k < 7; k++) {
    setTimeout(() => {
      const pc = document.createElement('div'); pc.className = 'piece';
      pc.style.background = PIECES[k % 4];
      const px = cx + (Math.random() - .5) * r.width * .6, py = cy + (Math.random() - .3) * r.height * .25;
      pc.style.left = px + 'px'; pc.style.top = py + 'px'; app.appendChild(pc);
      pc.animate([{ transform: `translate(-50%, -${260 + Math.random() * 80}px) rotate(${Math.random() * 360}deg)` }, { transform: 'translate(-50%, 0) rotate(0deg)', offset: .75 }, { transform: 'translate(-50%, -14px) rotate(0)', offset: .87 }, { transform: 'translate(-50%, 0)', opacity: 0 }], { duration: 620, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' });
      setTimeout(() => { FX.dust(px, py, 3, 'rgba(225,200,160,.95)'); pc.remove(); }, 620);
    }, k * 160);
  }
  for (let k = 0; k < 5; k++) {
    setTimeout(() => { FX.burst(cx + r.width * .12, cy - r.height * .15, '#ffe27a', 6, .9); sfx.hammer(); FX.shake(2, .12); }, k * 260 + 150);
  }
  // la parte costruita sale e la barra si riempie
  const rise = el.querySelector('.rise');
  if (rise) rise.animate([{ clipPath: riseClip(stepsOf(nb) - 1) }, { clipPath: riseClip(stepsOf(nb)) }], { duration: 1300, delay: 200, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'forwards' });
  const bar = el.querySelector('.pbar i');
  if (bar) { bar.style.transition = 'width 1.2s cubic-bezier(.3,1.3,.5,1) .3s'; requestAnimationFrame(() => { bar.style.width = (stepsOf(nb) / STEPS * 100) + '%'; }); }
  const sc = el.querySelector('.scaf'); if (sc && done) { sc.style.transition = 'opacity .8s .6s'; sc.style.opacity = '0'; }
  await sleep(1450);
  h.remove();
  wk.classList.add('cheer');
  for (let k = 0; k < 8; k++) FX.dust(cx + (Math.random() - .5) * r.width, cy + (Math.random() - .5) * r.height * .5, 3, 'rgba(230,210,180,.95)');
  if (done) {
    sfx.build();
    renderHome(nb.id);
    map.style.transform = 'scale(1.45)';
    map.querySelector(`.bld[data-id="${nb.id}"]`)?.classList.add('rising');
    const rays = document.createElement('div'); rays.className = 'bldrays';
    rays.style.left = cx + 'px'; rays.style.top = (cy - r.height * .1) + 'px'; app.appendChild(rays);
    setTimeout(() => rays.remove(), 2600);
    setTimeout(() => {
      FX.ring(cx, cy + r.height * .3, r.width * .9, 'rgba(240,225,195,.95)', 14);
      for (let k = 0; k < 14; k++) FX.dust(cx + (Math.random() - .5) * r.width * 1.3, cy + r.height * .3, 3, 'rgba(230,210,180,.95)');
      FX.shake(6, .3);
      const cols = ['#ffffff', '#e8322a', '#2f5fa8', '#ffd34d', '#ffffff', '#e8322a'];
      for (let k = 0; k < 6; k++) FX.burst(cx + (Math.random() - .5) * 80, cy - 40, cols[k], 16, 1.8);
      FX.glow(cx, cy, r.width * .9); FX.flash(.35);
      const ban = document.createElement('div'); ban.className = 'builtban';
      ban.innerHTML = `<small>COSTRUITO!</small><b>${nb.name}</b>`; app.appendChild(ban);
      setTimeout(() => ban.remove(), 2400);
    }, 380);
    voice(who, 1, 4000);
    // premio in monete che volano al contatore
    const PRIZE = 40;
    save.coins += PRIZE; persist();
    setTimeout(() => {
      const cp = $('#hCoins').parentElement.getBoundingClientRect();
      for (let k = 0; k < 6; k++) {
        const c = document.createElement('div'); c.className = 'flystar ic-coin'; c.style.left = cx + 'px'; c.style.top = cy + 'px'; app.appendChild(c);
        c.animate([{ transform: 'translate(-50%,-50%) scale(.4)' }, { transform: `translate(calc(-50% + ${(Math.random() - .5) * 120}px), calc(-50% - ${60 + Math.random() * 60}px)) scale(1.1)`, offset: .35 }, { transform: `translate(calc(-50% + ${cp.left - ar.left + 18 - cx}px), calc(-50% + ${cp.top - ar.top + 18 - cy}px)) scale(.6)` }], { duration: 900, delay: k * 70, easing: 'ease-in-out', fill: 'forwards' });
        setTimeout(() => { c.remove(); beep(1200, .05, 'square', .04); if (k === 5) { $('#hCoins').textContent = save.coins; const pl = $('#hCoins').parentElement; pl.classList.remove('bump'); void pl.offsetWidth; pl.classList.add('bump'); toast(`+${PRIZE} monete`, 900); } }, 900 + k * 70);
      }
    }, 1500);
  } else {
    beep(660, 0.12, 'triangle', 0.1);
    renderHome();
    map.style.transform = 'scale(1.45)';
    FX.banner(`Tappa ${stepsOf(nb)} di ${STEPS}`, nb.name, '#ffd34d');
  }
  await sleep(done ? 2600 : 1100);
  wk.classList.add('leave'); setTimeout(() => wk.remove(), 500);
  map.style.transform = '';
  await sleep(500);
  G.building = false;
  if (done) {
    await say(nb.who, nb.text, 'Grande!');
    if (zoneFinished) {
      const z = zoneOf(nb), nz = ZONES[ZONES.indexOf(z) + 1];
      fireworks(2600);
      await sleep(1800);
      if (nz) {
        await showStory(nz.id);
        viewZone = null; renderHome();
        FX.banner(nz.name, 'Nuova zona sbloccata!', '#bdf0ff');
      } else {
        await showStory('finale');
        fireworks(2600);
      }
    }
  }
}

function fireworks(ms = 2000) {
  const ar = app.getBoundingClientRect();
  const cols = ['#ffd34d', '#ff5a3c', '#3d8bff', '#4fd25f', '#ff4fa3', '#bdf0ff'];
  const n = Math.round(ms / 220);
  for (let k = 0; k < n; k++) {
    setTimeout(() => {
      const x = ar.width * (0.15 + Math.random() * 0.7), y = ar.height * (0.12 + Math.random() * 0.3);
      const c = cols[k % cols.length];
      FX.burst(x, y, c, 18, 1.8); FX.ring(x, y, 60, c, 5);
      beep(300 + Math.random() * 300, 0.25, 'sine', 0.05, -200);
    }, k * 220);
  }
}

function flyStarToCounter() {
  const pill = $('#hStars').parentElement.getBoundingClientRect(), ar = app.getBoundingClientRect();
  const n = pendingStar;
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const s2 = document.createElement('div');
      s2.className = 'flystar ic-star';
      s2.style.left = (ar.width / 2 - 35 + (i - (n - 1) / 2) * 60) + 'px'; s2.style.top = (ar.height * .45 - 35) + 'px';
      s2.style.transform = 'scale(2.2)';
      app.appendChild(s2);
      FX.glow(ar.width / 2, ar.height * .45, 90);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        s2.style.transform = `translate(${pill.left - ar.left + 18 - (ar.width / 2 + (i - (n - 1) / 2) * 60)}px, ${pill.top - ar.top + 18 - ar.height * .45}px) scale(.5)`;
      }));
      setTimeout(() => {
        s2.remove(); pendingStar--;
        $('#hStars').textContent = save.stars - pendingStar;
        const p = $('#hStars').parentElement; p.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 300 });
        FX.burst(pill.left - ar.left + 20, pill.top - ar.top + 18, '#ffd34d', 10);
        sfx.star();
        if (!pendingStar) {
          renderHome();
          if (!save.tutBuild && save.stars >= STEP_COST && nextBuilding()) {
            save.tutBuild = true; persist();
            setTimeout(() => say('gabbah', `Hai abbastanza <b>stelle</b>! Ogni pezzo del Campo Base costa ${STEP_COST} ${IC_S}: tocca <b>Costruisci</b> qui sotto, o il cantiere con la freccia.`, 'Ci provo'), 250);
          }
        }
      }, 950);
    }, i * 260);
  }
}

// ---------------- premio del giorno ----------------
const DAILY = [
  { coins: 50 }, { coins: 80 }, { p: 'mH' }, { coins: 120 }, { p: 'bomb' }, { coins: 200 }, { p: 'grappa', coins: 150 },
];
const P_NAME = { mH: 'Moto', bomb: 'Tanica', grappa: 'Grappa' };
const P_IMG = { mH: 'p_moto', bomb: 'p_tanica', grappa: 'p_grappa' };
function dayKey(d = new Date()) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function checkDaily() {
  const today = dayKey();
  if (!save.welcomed || (save.daily && save.daily.last === today)) return false;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const streak = save.daily && save.daily.last === dayKey(y) ? (save.daily.streak % 7) + 1 : 1;
  save.daily = { last: today, streak }; persist();
  V.spinWheel(streak, () => {});
  return true;
}

// ---------------- sfida della settimana ----------------
const WEEKLY = [
  { t: 'Togli <b>400 birre</b>', kind: 'tile', color: 0, n: 400, img: 't0_birra' },
  { t: 'Pulisci <b>120 pozze di fango</b>', kind: 'mud', n: 120, img: 'o_fango1' },
  { t: 'Spacca <b>80 sassi o casse</b>', kind: 'block', n: 80, img: 'o_sasso1' },
  { t: 'Crea <b>30 potenziamenti</b>', kind: 'power', n: 30, img: 'p_tanica' },
  { t: 'Supera <b>8 livelli nuovi</b>', kind: 'win', n: 8, img: 'u_stella' },
  { t: 'Togli <b>400 caschi</b>', kind: 'tile', color: 1, n: 400, img: 't1_casco' },
  { t: 'Togli <b>400 gomme</b>', kind: 'tile', color: 4, n: 400, img: 't4_gomma' },
];
function weekNo(d = new Date()) {   // numero della settimana (si cambia il lunedì)
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(x.getUTCFullYear(), 0, 4));
  return x.getUTCFullYear() * 100 + 1 + Math.round(((x - first) / 864e5 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
}
function weekly() {
  const k = weekNo();
  if (!save.week || save.week.k !== k) { save.week = { k, done: 0, claimed: false }; persist(); }
  return { ...WEEKLY[k % WEEKLY.length], ...save.week };
}
function weekTrack(kind, color = -1, amount = 1) {
  const w = weekly();
  if (w.claimed || w.done >= w.n || w.kind !== kind || (kind === 'tile' && w.color !== color)) return;
  save.week.done = Math.min(w.n, w.done + amount);
  if (save.week.done >= w.n) { persist(); setTimeout(() => toast('Sfida della settimana completata!', 1600), 400); }
  renderWeekBadge();
}
function renderWeekBadge() {
  const b = $('#weekPct'); if (!b) return;
  const w = weekly();
  b.textContent = w.claimed ? '✓' : w.done >= w.n ? '!' : Math.floor(w.done / w.n * 100) + '%';
  b.parentElement.classList.toggle('ready', !w.claimed && w.done >= w.n);
}
function openWeekly() {
  const w = weekly();
  const pct = Math.min(100, w.done / w.n * 100);
  const daysLeft = 7 - ((new Date().getDay() + 6) % 7);
  showCard(`<h2>Sfida della settimana</h2>
    <div class="wk"><span class="hi" style="background-image:${I(w.img)}"></span><div><p>${w.t} entro domenica.</p>
    <div class="wkbar"><i style="width:${pct}%"></i><span>${w.done} / ${w.n}</span></div></div></div>
    <p class="small">Premio: <b>300 ${IC_C}</b> + <b>1 Grappa</b> + <b>1 Tanica</b> · ${w.claimed ? 'già ritirato, la prossima sfida arriva lunedì' : (daysLeft === 1 ? 'ultimo giorno' : `mancano ${daysLeft} giorni`)}</p>
    <div class="row">${!w.claimed && w.done >= w.n ? '<button id="cClaim" class="btn btn-play">Ritira il premio!</button>' : '<button id="cClose" class="btn btn-play">Ok</button>'}</div>`, {
    cClose: hideCard,
    cClaim: () => {
      save.week.claimed = true; save.coins += 300; save.inv.grappa = (save.inv.grappa || 0) + 1; save.inv.bomb = (save.inv.bomb || 0) + 1;
      persist(); hideCard(); sfx.coin(); fireworks(1500); voice('gabbah', 2);
      $('#hCoins').textContent = save.coins; renderWeekBadge();
      FX.banner('Sfida vinta!', '+300 monete, Grappa e Tanica', '#ffd34d');
    },
  });
}

// ---------------- classifica EDT online ----------------
const esc = (v) => String(v).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const totalStars = () => Object.values(save.best).reduce((a, b) => a + b, 0);
function submitScore() {
  if (!RANK.getNick()) return;
  RANK.submit(totalStars(), save.level).then((r) => { if (r && r.taken) toast('Nome già preso da un altro telefono', 1600); }).catch(() => {});
}
function askNick() {
  showCard(`<h2>Classifica EDT</h2><p>Scegli il nome con cui comparire in classifica (lo stesso di Giro Easy, se ci giochi).</p>
    <input id="nickIn" class="nickin" maxlength="16" placeholder="Il tuo nome" value="${RANK.getNick().replace(/"/g, '')}">
    <div class="row"><button id="cNo" class="btn btn-gray">Dopo</button><button id="cOk" class="btn btn-play">Entra</button></div>`, {
    cNo: hideCard,
    cOk: () => {
      const n = RANK.cleanNick($('#nickIn').value);
      if (n.length < 2) { toast('Nome troppo corto', 900); return; }
      RANK.setNick(n);
      openRanking(true);
    },
  });
  setTimeout(() => $('#nickIn') && $('#nickIn').focus(), 50);
}
async function openRanking(justJoined = false) {
  if (G.building || pendingStar) return;
  if (!RANK.getNick()) { askNick(); return; }
  const me = RANK.getNick().toLowerCase();
  showCard(`<h2>Classifica EDT</h2><p class="rkload">Chiedo i risultati al Campo Base…</p>
    <div class="row"><button id="cClose" class="btn btn-play">Chiudi</button></div>`, { cClose: hideCard });
  let list, taken = false;
  try {
    const r = totalStars() > 0 ? await RANK.submit(totalStars(), save.level) : null;
    if (r) { list = r.list; taken = r.taken; } else list = await RANK.top();
  } catch {
    const p = document.querySelector('.rkload'); if (p) p.textContent = 'Niente rete: la classifica si vede quando torni online.';
    return;
  }
  if (!document.querySelector('.rkload')) return;   // chiusa nel frattempo
  const medal = ['🥇', '🥈', '🥉'];
  const crown = save.crown && save.crown.name ? String(save.crown.name).toLowerCase() : '';
  const rows = list.map((e, i) => `<div class="rk${String(e.name).toLowerCase() === me ? ' me' : ''}"><span class="pos">${medal[i] || i + 1}</span><b>${String(e.name).toLowerCase() === crown ? '👑 ' : ''}${esc(e.name)}</b><span class="st">${+e.stars || 0} ${IC_S}</span><small>liv ${+e.level || 0}</small></div>`).join('');
  showCard(`<h2>Classifica EDT</h2>${RK_TABS(0)}
    ${taken ? '<p class="red">Il nome <b>' + RANK.getNick() + '</b> è già di un altro telefono: cambialo.</p>' : ''}
    <div class="rklist">${rows || '<p>Ancora nessuno in classifica: fai tu il primo!</p>'}</div>
    <p class="small">Sei <b>${RANK.getNick()}</b> · ${totalStars()} ${IC_S} · <a href="#" id="cNick">cambia nome</a></p>
    <div class="row"><button id="cClose" class="btn btn-play">Chiudi</button></div>`, { cClose: hideCard });
  const cn = $('#cNick'); if (cn) cn.onclick = (e) => { e.preventDefault(); askNick(); };
  bindRkTabs();
  if (justJoined && !taken) FX.banner('Sei in classifica!', '', '#ffd34d');
}
const RK_TABS = (on) => `<div class="gtabs"><button class="gtab${on === 0 ? ' on' : ''}" data-rk="0">Generale</button><button class="gtab${on === 1 ? ' on' : ''}" data-rk="1">🏁 Gara del weekend</button></div>`;
function bindRkTabs() { document.querySelectorAll('.gtab[data-rk]').forEach((b) => { b.onclick = () => { sfx.click(); if (b.dataset.rk === '1') openWeekend(); else openRanking(); }; }); }
async function openWeekend() {
  if (!RANK.getNick()) { askNick(); return; }
  const w = V.weekendInfo(), me = RANK.getNick().toLowerCase();
  const head = w.active ? '<p>Da <b>venerdì a domenica</b>: ogni stella vale 1 punto, ogni livello nuovo 2 in più. Chi vince è <b>👑 Re del Giro Easy</b> per tutta la settimana dopo!</p>'
    : `<p>La gara è chiusa: riapre <b>venerdì</b>. Il vincitore dell'ultimo weekend è <b>👑 Re del Giro Easy</b> fino alla prossima gara.</p>`;
  showCard(`<h2>Gara del weekend</h2>${RK_TABS(1)}${head}<p class="rkload">Chiedo i risultati…</p><div class="row"><button id="cClose" class="btn btn-play">Chiudi</button></div>`, { cClose: hideCard });
  bindRkTabs();
  let list;
  try {
    const mine = save.we && save.we.id === w.id ? save.we.pts : 0;
    const r = w.active && mine ? await RANK.weSubmit(w.id, mine) : null;
    list = r ? r.list : await RANK.weTop();
  } catch { const p = document.querySelector('.rkload'); if (p) p.textContent = 'Niente rete: riprova quando torni online.'; return; }
  if (!document.querySelector('.rkload')) return;
  const last = list.filter((e) => e.id === w.last).sort((a, b) => b.pts - a.pts);
  if (last[0]) { save.crown = { id: w.last, name: last[0].name }; persist(); }
  const cur = w.active ? list.filter((e) => e.id === w.id).sort((a, b) => b.pts - a.pts) : last;
  const medal = ['🥇', '🥈', '🥉'];
  const rows = cur.slice(0, 20).map((e, i) => `<div class="rk${String(e.name).toLowerCase() === me ? ' me' : ''}"><span class="pos">${i === 0 && !w.active ? '👑' : medal[i] || i + 1}</span><b>${esc(e.name)}</b><span class="st">${e.pts} pt</span></div>`).join('');
  showCard(`<h2>Gara del weekend</h2>${RK_TABS(1)}${head}
    ${save.crown && save.crown.name ? `<p class="crownline">👑 Re del Giro Easy: <b>${esc(save.crown.name)}</b></p>` : ''}
    <div class="rklist">${rows || `<p>${w.active ? 'Ancora nessuno questo weekend: vinci un livello e sei primo!' : 'Lo scorso weekend nessuno ha giocato.'}</p>`}</div>
    ${w.active ? `<p class="small">I tuoi punti: <b>${save.we && save.we.id === w.id ? save.we.pts : 0}</b></p>` : ''}
    <div class="row"><button id="cClose" class="btn btn-play">Chiudi</button></div>`, { cClose: hideCard });
  bindRkTabs();
}

// ---------------- elenco livelli (per rigiocarli e prendere 3 stelle) ----------------
function openLevelList() {
  if (G.building || pendingStar) return;
  const last = Math.min(save.level, MAX_LEVEL);
  const cells = [];
  for (let n = 1; n <= last; n++) {
    const st = save.best[n] || 0;
    const boss = n % 5 === 0;
    cells.push(`<button class="lv${n === last && n === save.level ? ' cur' : ''}${boss ? ' boss' : ''}" data-n="${n}"><b>${n}</b><span>${[1, 2, 3].map((k) => `<i class="${k <= st ? 'on' : ''}"></i>`).join('')}</span></button>`);
  }
  const tot = Object.values(save.best).reduce((a, b) => a + b, 0);
  showCard(`<h2>I tuoi livelli</h2><p>Stelle prese: <b>${tot}</b> su <b>${(last - (save.level > last ? 0 : 1)) * 3}</b>. Rigioca un livello per prendere le stelle che mancano.</p>
    <div class="lvgrid">${cells.join('')}</div>
    <div class="row"><button id="cClose" class="btn btn-play">Chiudi</button></div>`, { cClose: hideCard });
  document.querySelectorAll('.lv').forEach((b) => { b.onclick = () => { sfx.click(); openLevel(+b.dataset.n); }; });
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
    [...box.children].forEach((el, i) => { el.onclick = () => goalInfo(G.goals[i]); });
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
function goalInfo(gl) {
  sfx.click();
  if (gl.type === 'tile') { tipBubble('t0_birra', `Togli <b>${goalLeft(gl)}</b> di queste tessere facendo tris con loro.`, goalURI(gl)); return; }
  const zl = zoneOfLevel(G.level.n);
  const k = gl.type === 'chain' && zl ? (zl === 2 ? 'tape' : 'ice') : gl.type;
  const h = HELP[k]; if (h) tipBubble(h.img, `<b>${h.t}</b>: ${h.d}`);
}
function tipBubble(img, html, uri) {
  $('#coach')?.remove();
  const d = document.createElement('div');
  d.id = 'coach';
  d.innerHTML = `<div class="cav sq" style="background-image:${uri || I(img)}"></div><p>${html}</p>`;
  d.onclick = () => d.remove();
  $('#game').appendChild(d);
  setTimeout(() => d.classList.add('out'), 6500);
  setTimeout(() => d.remove(), 6900);
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
  const availW = appR.width - 34;
  const availH = appR.height - top - bottom - 20;
  G.S = Math.floor(Math.min(availW / COLS, availH / ROWS, 92));
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
  el.className = 'tile' + (t.power ? ' power' : '') + (t.chain ? ' chained' : '') + (t.power === 'mH' ? ' dirH' : t.power === 'mV' ? ' dirV' : '') + (t.gold ? ' gold' : '');
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
  el.classList.toggle('dirH', t.power === 'mH');
  el.classList.toggle('dirV', t.power === 'mV');
  el.classList.toggle('gold', !!t.gold && !t.power);
}
// birra d'oro: una tessera birra luccicante che vale doppio e dà monete
function makeGold() {
  const b = G.board; if (!b) return;
  if (b.grid.flat().some((t) => t && t.gold)) return;
  const list = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const t = b.grid[r][c]; if (t && !t.rock && !t.chain && !t.power && t.color === 0) list.push(t); }
  const t = list[Math.floor(Math.random() * list.length)];
  if (!t) return;
  t.gold = true; refreshArt(t);
}
// a sorpresa, una volta per livello, un amico dell'EDT dà una mano
const HELPERS = [
  { who: 'miti', txt: 'Arriva Miti col drone!', pw: 'drone' },
  { who: 'renard', txt: 'Renard ti lancia una tanica!', pw: 'bomb' },
  { who: 'costa', txt: 'Costa ti presta la moto!', pw: 'mH' },
  { who: 'svetlana', txt: 'Svetlana porta la grappa!', pw: 'grappa' },
];
async function surpriseHelper() {
  const h = HELPERS[Math.floor(Math.random() * (G.level.n > 15 ? 4 : 3))];
  G.helped = true;
  const c = CHARS[h.who];
  const d = document.createElement('div'); d.className = 'helper';
  d.innerHTML = `<i style="background-image:${I(c.img)}"></i><span>${h.txt}</span>`;
  app.appendChild(d); setTimeout(() => d.remove(), 2600);
  voice(h.who, 0, 4000); sfx.power && sfx.power();
  await sleep(700);
  placeStartPowers([h.pw]);
  await sleep(900);
}

function buildBoardDOM() {
  const b = $('#board');
  b.innerHTML = '';
  G.els.clear();
  const frames = { 'fr-sh': [], 'fr-gold': [], 'fr-in': [] };
  G.ticketEls = Array.from({ length: ROWS }, () => []); G.mudEls = []; G.badges = Array.from({ length: ROWS }, () => []); G.badgeEls = [];
  for (let r = 0; r < ROWS; r++) {
    G.mudEls.push([]);
    for (let c = 0; c < COLS; c++) {
      if (!G.board.hole[r][c]) {
        ['fr-sh', 'fr-gold', 'fr-in'].forEach((k) => {
          const fr = document.createElement('div');
          fr.className = 'cellframe ' + k; fr.dataset.r = r; fr.dataset.c = c; fr.style.transform = pos(r, c);
          frames[k].push(fr);
        });
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
  b.prepend(...frames['fr-sh'], ...frames['fr-gold'], ...frames['fr-in']);
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
function fxEl(cls, x, y, w, h, life = 700) {
  const d = document.createElement('div');
  d.className = cls;
  Object.assign(d.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  $('#fx').appendChild(d);
  setTimeout(() => d.remove(), life);
  return d;
}
function fxPower(power, r, c, cells) {
  const S = G.S;
  const [x, y] = cellCenter(r, c);
  const br = $('#board').getBoundingClientRect(), ar = app.getBoundingClientRect();
  const bx = br.left - ar.left, by = br.top - ar.top;
  FX.buzz({ mH: [30, 30, 70], mV: [30, 30, 70], bomb: [90, 40, 140], grappa: [20, 30, 20, 30, 20, 30, 90], drone: [15, 20, 15, 20, 15, 20, 15] }[power] || 20);
  if (power === 'mH') {
    sfx.moto();
    const dir = c < COLS / 2 ? 1 : -1;
    FX.rideAcross(RIDE_URI.mH, dir > 0 ? bx - S : bx + COLS * S + S, y, dir > 0 ? bx + COLS * S + S : bx - S, y, 360);
    FX.streak(bx, y, bx + COLS * S, y, '#fff6c8', S * 0.55);
    FX.shake(4, .25);
  } else if (power === 'mV') {
    sfx.moto();
    FX.rideAcross(RIDE_URI.mV, x, by + ROWS * S + S, x, by - S, 380);
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
// scritte sulla griglia: una alla volta, grandi, con rimbalzo e il colore del potenziamento
let floatQ = 0;
const FLOAT_COL = { 'Moto!': '#ffb347', 'Tanica!': '#ff6b4a', 'Drone!': '#6fc3ff', 'San Braulio!': '#ffe066' };
function floater(text, r, c) {
  const S = G.S;
  const delay = Math.max(0, floatQ - performance.now());
  floatQ = performance.now() + delay + 260;
  setTimeout(() => {
    const x = Math.min(Math.max((c + 0.5) * S, S * 1.6), S * (COLS - 1.6));
    const d = fxEl('floater pop', x, r * S, 0, 0, 1200);
    d.style.width = 'auto'; d.style.height = 'auto';
    if (FLOAT_COL[text]) d.style.color = FLOAT_COL[text];
    d.textContent = text;
  }, delay);
}
async function flyDrone(fromK, toK) {
  const [r1, c1] = unkey(fromK), [r2, c2] = unkey(toK);
  const [x1, y1] = cellCenter(r1, c1), [x2, y2] = cellCenter(r2, c2);
  const d = document.createElement('div');
  d.className = 'flyer';
  d.style.backgroundImage = RIDE_URI.drone;
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
  if (type === 'tile') weekTrack('tile', color, amount);
  else if (type === 'mud') weekTrack('mud');
  else if (type === 'rock' || type === 'crate') weekTrack('block');
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
  ['Grande!', '#ffd34d'], ['Easy!', '#7ee06a'], ['Che manetta!', '#ffb02e'], ['Gas aperto!', '#ff8a1c'],
  ['Giro Easy!', '#ff5a3c'], ['Campa giù!', '#ff4fa3'], ['LEGGENDARIO!', '#b07bff'],
];
const PEEK_LINES = ['Easy!', 'Che manetta!', 'Tranquilli, è un giro easy!', 'Gas! Gas! Gas!', 'Questa la pago io!'];
let peekT = 0;
function peekSay(txt) {
  const p = $('#peek'); if (!p) return;
  $('#peekTxt').textContent = txt;
  p.classList.remove('talk'); void p.offsetWidth; p.classList.add('talk');
  clearTimeout(peekT); peekT = setTimeout(() => p.classList.remove('talk'), 2200);
}
// luccichio: ogni tanto un riflesso passa su una tessera a caso
setInterval(() => {
  if (!G.board || G.over || document.hidden || !$('#game').classList.contains('active')) return;
  const els = [...G.els.values()]; if (!els.length) return;
  const el = els[Math.floor(Math.random() * els.length)];
  el.classList.remove('shine'); void el.offsetWidth; el.classList.add('shine');
  setTimeout(() => el.classList.remove('shine'), 900);
}, 700);
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
      const fix = G.droneFix && G.droneFix.k === k ? G.droneFix.tk : undefined;
      const cells = b.blast(t.power, r, c, G.goals, fix);
      if (fix !== undefined) G.droneFix = null;
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
      if (t.gold) {
        credit('tile', r, c, t.color); save.coins += 10;
        const [gx, gy] = cellCenter(r, c); FX.burst(gx, gy, '#ffd34d', 18, 1.6); FX.ring(gx, gy, G.S * 1.2, '#fff3a8', 7);
        floater('Birra d\'oro! +10', r, c); beep(1320, .12, 'triangle', .1, 400);
      }
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
    if (!save.seen[KIND(cr.power)]) G.explainQ.add(KIND(cr.power));
    weekTrack('power');
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
      if (step >= 2) peekSay(PEEK_LINES[Math.min(step - 2, PEEK_LINES.length - 1)]);
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
  clearPreview();
  const b = G.board;
  const ta = b.get(...a), tb = b.get(...bCell);
  if (!b.isSwappable(ta) || !b.isSwappable(tb)) { sfx.bad(); setSel(null); return; }
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

// chi compare a urlare nella super combo
const COMBO_WHO = (k) => k.includes('grappa') ? (k === 'grappa+grappa' ? 'svetlana' : 'costa') : k === 'bomb+bomb' ? 'gabbah' : k.includes('bomb') ? 'purcello' : k.includes('drone') ? 'miti' : 'mirco';
// i due potenziamenti si agganciano: volano uno sull'altro girando, il tabellone rallenta e zooma
async function fuseIntro(ta, tb, at, from) {
  const ea = G.els.get(ta.id), eb = G.els.get(tb.id);
  const P = pos(...at), Q = pos(...from);
  const wrap = $('#boardWrap');
  app.classList.add('fusing');
  wrap.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }, { transform: 'scale(1.04)' }], { duration: 700, easing: 'ease-out', fill: 'forwards' });
  [ea, eb].forEach((e) => { if (e) e.style.zIndex = 30; });
  eb?.animate([{ transform: Q + ' scale(1)' }, { transform: P + ' scale(1.35) rotate(-200deg)' }, { transform: P + ' scale(.6) rotate(-540deg)' }], { duration: 650, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' });
  ea?.animate([{ transform: P + ' scale(1)' }, { transform: P + ' scale(1.5) rotate(180deg)' }, { transform: P + ' scale(.6) rotate(540deg)' }], { duration: 650, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' });
  const [cx, cy] = cellCenter(...at);
  for (let k = 0; k < 5; k++) setTimeout(() => { FX.ring(cx, cy, G.S * (1.6 - k * .22), k % 2 ? '#ffe27a' : '#ffffff', 5); beep(500 + k * 140, .08, 'triangle', .08, 200); }, k * 110);
  FX.buzz([20, 40, 20, 40, 60]);
  await sleep(640);
  wrap.animate([{ transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'forwards' });
  app.classList.remove('fusing');
}
// il personaggio entra in grande di lato con il nome della combo
function cutIn(who, title) {
  const c = CHARS[who]; if (!c) return;
  document.querySelectorAll('.cutin').forEach((e) => e.remove());
  const d = document.createElement('div');
  d.className = 'cutin';
  d.innerHTML = `<div class="ci-band"></div><div class="ci-face" style="background-image:${I(c.img)}"></div><div class="ci-txt"><small>SUPER COMBO</small><b>${title}</b></div>`;
  app.appendChild(d);
  setTimeout(() => d.classList.add('out'), 1250);
  setTimeout(() => d.remove(), 1650);
}
function flyer(uri, cls = '') { const d = document.createElement('div'); d.className = 'rider ' + cls; d.style.backgroundImage = uri; app.appendChild(d); return d; }
// squadriglia: 3 droni decollano, girano sopra la griglia e picchiano
function droneSwarm(cx, cy) {
  const S = G.S;
  for (let i = 0; i < 3; i++) {
    const d = flyer(RIDE_URI.drone, 'drone-fx'), w = d.offsetWidth || S;
    const t0 = performance.now(), dur = 1100, a0 = i * 2.094;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const R = S * (0.4 + 2.2 * Math.sin(k * Math.PI)), a = a0 + k * 7;
      const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * .7 - S * 1.2 * Math.sin(k * Math.PI);
      d.style.transform = `translate(${x - w / 2}px, ${y - w / 2}px) rotate(${Math.cos(a) * 18}deg) scale(${1 + .3 * Math.sin(k * Math.PI)})`;
      if (k < 1) requestAnimationFrame(step); else { FX.ring(x, y, S, '#bdf0ff', 6); FX.burst(x, y, '#bdf0ff', 10, 1.2); d.remove(); }
    };
    requestAnimationFrame(step);
  }
}
// bottiglia di grappa che gira in aria e versa luce
function grappaBottle(cx, cy, big) {
  const d = flyer(I('p_grappa'), 'bottle-fx' + (big ? ' big' : ''));
  const w = d.offsetWidth || G.S * 1.6;
  d.style.left = (cx - w / 2) + 'px'; d.style.top = (cy - w / 2) + 'px';
  setTimeout(() => d.remove(), 1500);
  if (big) { const L = document.createElement('div'); L.className = 'holylight'; app.appendChild(L); setTimeout(() => L.remove(), 1700); }
}

async function comboPowers(ta, tb, at, ka, kb) {
  const b = G.board;
  const [r, c] = at;
  const keyName = [ta.power, tb.power].sort().join('+');
  const nm = COMBO_NAMES[keyName] || (keyName.includes('grappa') ? 'Benedizione di San Braulio!' : 'Super combo!');
  await fuseIntro(ta, tb, at, unkey(kb));
  const res = b.comboBlast(ta.power, tb.power, r, c, G.goals);
  const who = COMBO_WHO(keyName);
  cutIn(who, nm);
  voice(who, 2, 5000);
  const [cx, cy] = cellCenter(r, c);
  FX.flash(.8); FX.shake(14, .55); FX.glow(cx, cy, G.S * 3.5); FX.ring(cx, cy, G.S * 4.5, '#ffffff', 16);
  if (keyName.includes('grappa')) grappaBottle(cx, cy, keyName === 'grappa+grappa');
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
  if (keyName === 'bomb+bomb') {
    // maxi esplosione a fungo: palla di fuoco, onde d'urto in sequenza, detriti, colonna di fumo
    FX.fire(cx, cy, S * 4.5);
    for (let k = 0; k < 4; k++) setTimeout(() => FX.ring(cx, cy, S * (2.5 + k * 1.6), k % 2 ? '#ffb340' : '#fff3c0', 18 - k * 3), k * 120);
    for (let k = 0; k < 3; k++) setTimeout(() => { FX.fire(cx + (Math.random() - .5) * S * 3, cy + (Math.random() - .5) * S * 3, S * 2); FX.shake(10 - k * 2, .3); }, 160 + k * 170);
    ['#8a5a2e', '#bdb6a8', '#5e3818', '#ffd34d'].forEach((col) => FX.burst(cx, cy, col, 16, 2.4));
    for (let k = 0; k < 8; k++) setTimeout(() => FX.dust(cx + (Math.random() - .5) * S, cy - k * S * .35, 3, 'rgba(70,60,55,.55)'), k * 60);
    app.classList.add('bigboom'); setTimeout(() => app.classList.remove('bigboom'), 700);
    FX.buzz([80, 40, 160]);
  } else if (keyName.startsWith('drone+drone')) {
    droneSwarm(cx, cy); FX.dust(cx, cy, 14, 'rgba(220,240,255,.9)');
  } else if (keyName.includes('bomb')) {
    // moto in fiamme: tre righe e tre colonne di fuoco, le moto passano infuocate
    for (let d = -1; d <= 1; d++) {
      const yy = cy + d * S, xx = cx + d * S;
      setTimeout(() => {
        FX.streak(bx, yy, bx + COLS * S, yy, '#ffb340', S * .8); FX.streak(xx, by, xx, by + ROWS * S, '#ffb340', S * .8);
        for (let k = 0; k < COLS; k++) setTimeout(() => FX.fire(bx + (k + .5) * S, yy, S * .9), k * 35);
        for (let k = 0; k < ROWS; k++) setTimeout(() => FX.fire(xx, by + (k + .5) * S, S * .9), k * 35);
      }, (d + 1) * 90);
    }
    FX.rideAcross(RIDE_URI.mH, bx - S, cy, bx + COLS * S + S, cy, 420).then(() => {});
    FX.rideAcross(RIDE_URI.mV, cx, by + ROWS * S + S, cx, by - S, 440);
    setTimeout(() => document.querySelectorAll('.rider').forEach((e) => e.classList.add('onfire')), 10);
    FX.fire(cx, cy, S * 3);
  } else {
    // doppia sgasata: due moto a croce con scia di polvere, poi altre due di ritorno
    const w = S * .9;
    FX.streak(bx, cy, bx + COLS * S, cy, '#fff6c8', w); FX.streak(cx, by, cx, by + ROWS * S, '#fff6c8', w);
    FX.rideAcross(RIDE_URI.mH, bx - S, cy, bx + COLS * S + S, cy, 380);
    FX.rideAcross(RIDE_URI.mV, cx, by + ROWS * S + S, cx, by - S, 400);
    setTimeout(() => { FX.rideAcross(RIDE_URI.mH, bx + COLS * S + S, cy + S * .35, bx - S, cy + S * .35, 360); FX.rideAcross(RIDE_URI.mV, cx + S * .35, by - S, cx + S * .35, by + ROWS * S + S, 380); }, 260);
    for (let k = 0; k < 10; k++) setTimeout(() => { FX.dust(bx + Math.random() * COLS * S, cy + S * .3, 2); FX.dust(cx + S * .3, by + Math.random() * ROWS * S, 2); }, k * 40);
    sfx.moto && sfx.moto();
  }
  sfx.boom();
  res.cells.add(ka); res.cells.add(kb);
  await resolve({ pending: [{ cells: res.cells, pre: [ka, kb] }] });
}

async function tapPower(cell) {
  if (G.busy || G.over) return;
  const ad = G.armedDrone;
  G.droneFix = ad && ad.k === key(...cell) ? ad : null;
  clearPreview();
  G.busy = true; clearHint(); setSel(null);
  useMove();
  await resolve({ pending: [{ cells: new Set([key(...cell)]) }] });
  G.droneFix = null;
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
  voice('forestale', Math.random() < .5 ? 0 : 1, 8000);
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
  if ((G.moveCount || 0) % 4 === 0 && Math.random() < 0.6) makeGold();
  if (!G.boss && !G.helped && !G.exhibit && (G.moveCount || 0) >= 5 && G.moves > 3 && Math.random() < 0.22) await surpriseHelper();
  saveRun();
  if (G.explainQ.size) { const ks = [...G.explainQ]; G.explainQ.clear(); await explain(ks, ks.length > 1 ? 'Nuovi potenziamenti!' : 'Nuovo potenziamento!'); }
  G.busy = false;
  checkStuck();
  scheduleHint();
}

// ---------- vittoria / sconfitta ----------
async function winLevel() {
  G.over = true;
  clearRun();
  clearHint();
  const lv = G.level, n = lv.n;
  const left = G.moves;
  const ratio = left / lv.moves;
  const stars = ratio >= 0.35 ? 3 : ratio >= 0.15 ? 2 : 1;
  if (G.boss) {
    $('#bossFace').classList.add('beaten');
    await say(ZONES[zoneOfLevel(n)].boss, pick(['Va bene, passate. Ma ho preso la targa!', 'Per oggi niente multa. Ma vi tengo d\'occhio, eh.', 'Il fischietto è scarico... Passate, va.']), 'Arrivederci!', 2);
  } else { FX.banner('Livello superato!', '', '#ffd34d'); FX.flash(.3); await sleep(1100); }
  // bonus mosse avanzate: moto che partono a caso
  const b = G.board;
  const shots = Math.min(left, 6);
  if (shots > 0) {
    FX.banner('Mosse avanzate!', 'Partono le moto', '#7ee06a');
    const cells = new Set();
    for (let i = 0; i < shots; i++) {
      const r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
      const t = b.grid[r][c];
      if (!t || t.rock || t.power || t.chain) continue;
      t.power = Math.random() < 0.5 ? 'mH' : 'mV'; t.color = -1;
      refreshArt(t);
      cells.add(key(r, c));
      G.moves--; renderMoves();
      await sleep(120);
    }
    await resolve({ pending: [{ cells }] });
  }
  if (G.exhibit) {   // sfida su un livello non ancora sbloccato
    save.coins += 20; persist(); sfx.win();
    showCard(`<h2 class="wintitle">Sfida superata!</h2>
      <div class="stars3 fill">${[1, 2, 3].map((k) => `<i class="ic ic-star slot${k <= stars ? ' on' : ''}" data-k="${k}"></i>`).join('')}</div>
      ${V.challengeResult(n, stars, true)}<p>Questo livello lo sblocchi davvero più avanti: intanto <b>+20 ${IC_C}</b>.</p>
      <button id="cShare" class="btn btn-share">📣 Rilancia la sfida</button>
      <div class="row"><button id="cHome" class="btn btn-play">Campo base</button></div>`,
    { cShare: () => V.shareWin(n, stars, ZONES[zoneOfLevel(n)].bg), cHome: () => { hideCard(); goHome(); } });
    fireworks(1500);
    return;
  }
  const first = n >= save.level;
  if (first) weekTrack('win');   // contano solo i livelli nuovi, non quelli rigiocati
  const prev = save.best[n] || 0;
  const gain = Math.max(0, stars - prev);
  save.best[n] = Math.max(prev, stars);
  const coins = first ? 50 + left * 10 : 20 + left * 3;
  save.stars += gain;
  pendingStar += gain;
  if (first) save.streak = Math.min(3, (save.streak || 0) + 1);
  save.coins += coins;
  save.level = Math.max(save.level, n + 1);
  persist();
  submitScore();
  // gara del weekend: stelle prese + 2 per ogni livello nuovo
  { const pts = V.weekendPoints(stars + (first ? 2 : 0)); const w = V.weekendInfo(); if (pts && RANK.getNick()) RANK.weSubmit(w.id, pts).catch(() => {}); }
  // figurina: sempre al primo passaggio, a volte rigiocando
  const sticker = first || Math.random() < 0.4 ? V.drawSticker() : null;
  const chest = V.chestTick(true);
  const chRes = V.challengeResult(n, stars, true);
  sfx.win();
  const nb = nextBuilding();
  const [who, line] = pick(WIN_LINES);
  setTimeout(() => voice(who, 2), 900);
  const gainTxt = gain ? `<b>+${gain} ${gain > 1 ? 'stelle' : 'stella'}</b>` : (first ? '' : 'Nessuna stella nuova');
  showCard(`<h2 class="wintitle">${pick(WIN_TITLES)}</h2>
    <div class="stars3 fill">${[1, 2, 3].map((k) => `<i class="ic ic-star slot" data-k="${k}"></i>`).join('')}</div>
    <p class="winsub">${stars === 3 ? 'Perfetto! Tre stelle piene.' : `Con meno mosse usate prendi ${stars === 1 ? 'fino a 3' : 'la terza'} ${IC_S}`}</p>
    <p>${gainTxt}${gainTxt ? ' · ' : ''}<b>+${coins} ${IC_C}</b>${nb && gain ? `<br>Con ${STEP_COST} ${IC_S} costruisci un pezzo di <b>${nb.name}</b>.` : ''}</p>
    ${chRes}
    <div class="cheer">${speakerHTML(who, line)}</div>
    ${sticker ? `<p class="stkhint">📒 Hai trovato una figurina!</p>` : ''}
    <button id="cShare" class="btn btn-share">📣 Condividi e sfida un amico</button>
    <div class="row">${stars < 3 ? '<button id="cAgain" class="btn btn-gray">Rigioca</button>' : ''}<button id="cHome" class="btn btn-play">Campo base</button></div>`,
    { cShare: () => V.shareWin(n, stars, ZONES[zoneOfLevel(n)].bg),
      cHome: async () => { hideCard(); await afterWin(); explain(['coins'], 'Hai guadagnato monete!').then(goHome); },
      cAgain: async () => { hideCard(); await afterWin(); goHome(); const again = () => (pendingStar || G.building ? setTimeout(again, 200) : openLevel(n)); setTimeout(again, 500); } });
  async function afterWin() { if (sticker) await V.revealSticker(sticker); if (chest) await V.openChest(); }
  // le stelle si riempiono una alla volta, poi fuochi d'artificio
  const ar = app.getBoundingClientRect();
  for (let k = 1; k <= stars; k++) {
    await sleep(380);
    const el = document.querySelector(`.stars3 .slot[data-k="${k}"]`);
    if (!el) break;
    el.classList.add('on');
    const r = el.getBoundingClientRect();
    FX.burst(r.left - ar.left + r.width / 2, r.top - ar.top + r.height / 2, '#ffd34d', 16, 1.4);
    FX.ring(r.left - ar.left + r.width / 2, r.top - ar.top + r.height / 2, r.width, '#fff6a0', 5);
    beep(520 + k * 160, 0.18, 'triangle', 0.12, 200);
  }
  await sleep(250);
  fireworks(stars === 3 ? 2400 : 1300);
}

async function loseLevel() {
  G.over = true;
  clearRun();
  V.chestTick(false);
  const leftN = G.goals.reduce((a, g) => a + goalLeft(g), 0), totN = G.goals.reduce((a, g) => a + g.n, 0);
  if (leftN <= Math.max(3, totN * 0.08)) {   // perso per un soffio
    FX.shake(10, .4); FX.flash(.3);
    const q = document.createElement('div'); q.className = 'quasi'; q.innerHTML = `<b>QUASI!</b><small>ti mancava${leftN === 1 ? '' : 'no'} solo ${leftN}</small>`;
    app.appendChild(q); setTimeout(() => q.remove(), 1900);
    voice('purcello', 1, 3000);
    await sleep(1700);
  }
  sfx.lose();
  const canBuy = save.coins >= 200;
  const left = G.goals.filter((g) => g.done < g.n).map((g) => `${goalLeft(g)}`).join(', ');
  showCard(`${speakerHTML('purcello', `${pick(LOSE_LINES)}<br>Ti mancavano <b>${left}</b>. Con <b>200 ${IC_C}</b> hai <b>5 mosse</b> in più.`)}
    <div class="row">
      <button id="cQuit" class="btn btn-gray">Mollo</button>
      <button id="cMore" class="btn btn-play" ${canBuy ? '' : 'disabled style="filter:grayscale(1)"'}>+5 mosse</button>
    </div>`, {
    cQuit: () => { hideCard(); save.streak = 0; clearRun(); retryOrHome(); },
    cMore: () => {
      if (!canBuy) return;
      save.coins -= 200; persist();
      hideCard();
      G.moves += 5; G.over = false; G.busy = false;
      saveRun();
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
  if (t?.power) {
    if (G.armed && G.armed[0] === cell[0] && G.armed[1] === cell[1]) { clearPreview(); tapPower(cell); return; }
    showPreview(cell, t); return;
  }
  clearPreview();
  if (t && !t.rock) setSel(cell); else setSel(null);
}
// anteprima del colpo: si illuminano le caselle che il potenziamento prenderà
function clearPreview() { G.armed = null; G.armedDrone = null; document.querySelectorAll('.prevcell,.prevtip').forEach((e) => e.remove()); }
function showPreview(cell, t) {
  clearPreview(); clearHint();
  // resta selezionata: toccando una vicina si scambia, toccandola di nuovo parte
  setSel(cell);
  G.armed = cell;
  const cells = G.board.blast(t.power, cell[0], cell[1], G.goals);
  // il drone poi va davvero sulla casella mostrata nell'anteprima
  if (cells.droneTarget !== undefined) G.armedDrone = { k: key(...cell), tk: cells.droneTarget };
  const fx = $('#fx');
  let i = 0;
  for (const k of cells) {
    const [r, c] = unkey(k);
    const d = document.createElement('div');
    d.className = 'prevcell' + (k === key(...cell) ? ' src' : '');
    d.style.transform = pos(r, c);
    d.style.animationDelay = (i++ % 12) * 25 + 'ms';
    fx.appendChild(d);
  }
  if (cells.droneTarget !== undefined) {
    const [r, c] = unkey(cells.droneTarget);
    const d = document.createElement('div'); d.className = 'prevcell target'; d.style.transform = pos(r, c); fx.appendChild(d);
  }
  const tip = document.createElement('div');
  tip.className = 'prevtip';
  if (t.power === 'grappa') {
    const col = G.board.mostCommonColor();
    tip.innerHTML = `Tocca di nuovo: via tutte le <span class="tipico" style="background-image:${TILE_URI[col]}"></span><br>oppure scambiala col colore da togliere`;
  } else tip.textContent = 'Tocca di nuovo per usarla, o scambiala';
  app.appendChild(tip);
  sfx.click();
}

// =================== GUIDA E SPIEGAZIONI ===================
// ogni cosa del gioco ha una scheda: si vede la prima volta che la incontri e sempre nella Guida (?)
const HELP = {
  // come si gioca
  swap: { img: 't0_birra', t: 'Fai tris', d: 'Trascina una tessera sulla vicina (o toccale una dopo l\'altra) per scambiarle. Se ne metti <b>3 o più uguali in fila</b> spariscono e quelle sopra cadono.' },
  goals: { img: 't1_casco', t: 'Obiettivi e mosse', d: 'In alto vedi cosa devi togliere e quante <b>mosse</b> hai. Ogni scambio è una mossa. Finisci gli obiettivi prima che finiscano le mosse.' },
  stars: { img: 'u_stella', t: 'Stelle', d: 'Vinci = da <b>1 a 3 stelle</b>. Più mosse ti avanzano, più stelle prendi (2 stelle se avanzi il 15%, 3 se avanzi il 35%). Puoi rigiocare i livelli per migliorare.' },
  // potenziamenti
  mH: { img: 'p_moto', t: 'Moto', how: '4 tessere in fila', d: 'Parte a manetta e si porta via <b>tutta la riga</b> (o tutta la colonna, se la moto è in piedi). Scambiala con una tessera vicina o <b>toccala due volte</b>.' },
  bomb: { img: 'p_tanica', t: 'Tanica', how: 'tessere a L o a T', d: 'Esplode e pulisce <b>tutto intorno a sé, fino a 2 caselle</b> di distanza: perfetta per sassi, casse e fango. Scambiala o toccala due volte.' },
  drone: { img: 'p_drone', t: 'Drone', how: '4 tessere a quadrato', d: 'Pulisce una croce dove si trova e poi <b>vola da solo</b> su una tessera che ti serve per l\'obiettivo. Scambialo o toccalo due volte.' },
  grappa: { img: 'p_grappa', t: 'Grappa di San Braulio', how: '5 tessere in fila', d: 'Toglie <b>tutte le tessere di un colore</b>: scambiala con la tessera del colore che vuoi far sparire.' },
  combo: { img: 'p_grappa', t: 'Super combo', how: 'scambia due potenziamenti tra loro', d: 'Due potenziamenti vicini, scambiati, fanno un colpo molto più forte: moto+moto = croce, tanica+moto = tre righe e tre colonne, tanica+tanica = esplosione enorme, drone+drone = tre droni, grappa+qualcosa = trasforma un colore intero in quel potenziamento, grappa+grappa = <b>pulisce tutta la griglia</b>.' },
  // ostacoli
  mud: { img: 'o_fango1', t: 'Fango', d: 'Sta <b>sotto</b> le tessere. Si pulisce facendo un tris sopra la pozza. Il fango scuro va pulito due volte.' },
  rock: { img: 'o_sasso1', t: 'Sasso', d: 'Non si sposta e blocca la caduta. Si spacca con un tris <b>accanto</b>, o colpendolo con moto e taniche. Quelli grossi vanno colpiti due volte.' },
  crate: { img: 'o_cassa1', t: 'Cassa', d: 'Blocca la casella e non cade. Un tris <b>accanto</b> la rompe, moto e taniche la prendono anche da lontano. Le casse già crepate vanno colpite ancora una volta.' },
  chain: { img: 'o_catena', t: 'Catena', d: 'La tessera incatenata non si può spostare. Mettila in un tris con le tessere vicine (o colpiscila con un potenziamento) e la catena salta.' },
  tape: { img: 'o_nastro', t: 'Nastro del cantiere', d: 'Alla Cava la Forestale transenna le tessere col nastro: non si spostano finché non le metti in un tris o le colpisci con un potenziamento.' },
  ice: { img: 'o_ghiaccio', t: 'Ghiaccio', d: 'Al Passo le tessere possono essere congelate: non si spostano finché non le metti in un tris o le colpisci con un potenziamento.' },
  multa: { img: 'o_multa', t: 'Multa', d: 'Copre la casella. Si toglie con un tris accanto. Attento: se in un turno <b>non togli nessuna multa</b>, la Forestale ne aggiunge un\'altra.' },
  boss: { img: 'forestale', t: 'La Forestale (boss)', d: 'Ogni tessera che rompi le toglie <b>pazienza</b> (la barra rossa). Ogni poche mosse (il numero col sasso) ti tira dei <b>sassi</b> sulla griglia. Svuota la barra per vincere.' },
  // aiuti
  hammer: { img: 'u_martello', t: 'Martello di Renard', d: 'Costa <b>100 monete</b>. Tocca il martello, poi tocca una casella: spacca quella tessera o ostacolo senza usare mosse.' },
  shield: { img: 'u_scudo', t: 'Scudo di Miti', d: 'Solo coi boss. Costa <b>150 monete</b> e para il prossimo lancio di sassi della Forestale.' },
  hint: { img: 'u_stella', t: 'Aiuto', d: 'Ti mostra una mossa buona (cerchio arancio e manina) e ti ricorda come togliere gli ostacoli. È gratis.' },
  pre: { img: 'p_tanica', t: 'Aiuti di partenza', d: 'Prima del livello puoi mettere in griglia una Moto, una Tanica o una Grappa (con le monete o gratis se li hai vinti). Se vinci più livelli di fila li ricevi in <b>regalo</b>.' },
  coins: { img: 'u_moneta', t: 'Monete', d: 'Le guadagni vincendo (50 più 10 per ogni mossa avanzata; meno se rigiochi un livello) e col premio del giorno. Servono per gli aiuti: <b>Martello</b> 100, <b>Scudo</b> 150, aiuti di partenza (Moto 60, Tanica 90, Grappa 140) e <b>+5 mosse</b> quando perdi (200). Per costruire servono le stelle, non le monete.' },
  // campo base
  build: { img: 'b_cantiere', t: 'Costruire', d: 'Ogni edificio ha <b>3 pezzi</b> e ogni pezzo costa <b>2 stelle</b>. Tocca <b>Costruisci</b> o il cantiere con la freccia. Finita una zona, se ne apre una nuova.' },
  zones: { img: 'map2_bg', t: 'Zone', d: 'Prima <b>La Valle</b>, poi <b>Il Passo</b> sulla neve (dal livello 31) e <b>La Cava</b> (dal livello 61), ognuna con edifici, ostacoli e boss nuovi. Col cartello in alto guardi le zone già sbloccate.' },
  daily: { img: 'u_moneta', t: 'Ruota del giorno', d: 'Apri il gioco ogni giorno e gira la <b>Ruota del Giro Easy</b>: monete, Moto, Tanica, Grappa o una figurina. Al settimo giorno di fila la giri <b>due volte</b>.' },
  levels: { img: 'u_stella', t: 'Livelli', d: 'Dal pulsante <b>Livelli</b> rigiochi quelli già fatti per prendere le stelle che mancano.' },
  album: { img: 'c_miti', t: 'Album figurine EDT', d: 'Vincendo i livelli trovi figurine dei piloti, della Forestale e dei momenti EDT: comuni, rare e d\'oro. Completa una pagina e vinci tante monete e una Grappa. I doppioni diventano monete.' },
  chest: { img: 'u_moneta', t: 'Forziere', d: 'Vinci <b>3 livelli di fila</b> senza perdere e si apre il forziere EDT: monete, un potenziamento e una figurina.' },
  weekend: { img: 'u_stella', t: 'Gara del weekend', d: 'Da venerdì a domenica, in Classifica → Gara del weekend: ogni stella vale 1 punto e ogni livello nuovo 2 in più. Chi vince è <b>👑 Re del Giro Easy</b> per tutta la settimana dopo.' },
  share: { img: 'c_gabbah', t: 'Condividi e sfida', d: 'Dopo una vittoria tocca <b>Condividi e sfida un amico</b>: parte un\'immagine per WhatsApp o le Storie con il link. Chi lo apre deve battere le tue stelle su quel livello.' },
  gold: { img: 't0_birra', t: 'Birra d\'oro', d: 'Ogni tanto una birra luccica d\'oro: falla sparire in un tris e vale doppio per l\'obiettivo, più 10 monete.' },
  helper: { img: 'c_svetlana', t: 'Aiuto a sorpresa', d: 'Nei livelli senza la Forestale, a volte arriva un amico EDT e ti lascia un potenziamento sulla griglia.' },
  weekly: { img: 'u_stella', t: 'Sfida della settimana', d: 'Dal pulsante <b>Sfida</b>: ogni settimana un obiettivo nuovo (togliere tante tessere di un tipo, pulire il fango, creare potenziamenti...). Lo completi giocando qualsiasi livello e vinci monete e potenziamenti. Si rinnova il lunedì.' },
  rank: { img: 'u_lucchetto', t: 'Classifica EDT', d: 'Dal pulsante <b>Classifica</b> scegli il nome e sfidi gli altri dell\'EDT: conta chi ha più stelle.' },
  rider: { img: 'fx_moto', t: 'Il giro di Miti', d: 'Quando costruisci il primo edificio di una zona, Miti inizia a girare sul sentiero del Campo Base. Non serve a niente: fa scena.' },
};
const GUIDE = [
  ['Come si gioca', ['swap', 'goals', 'stars', 'hint']],
  ['Potenziamenti', ['mH', 'bomb', 'drone', 'grappa', 'combo']],
  ['Ostacoli', ['mud', 'rock', 'crate', 'chain', 'ice', 'tape', 'multa', 'boss']],
  ['Aiuti', ['coins', 'hammer', 'shield', 'pre']],
  ['Campo Base', ['build', 'zones', 'daily', 'weekly', 'levels', 'rank']],
  ['Extra', ['album', 'chest', 'weekend', 'share', 'gold', 'helper']],
];
if (!save.seen) { save.seen = {}; if (save.level > 3) { save.seen.swap = 1; save.seen.goals = 1; } }
const helpRow = (k) => { const h = HELP[k]; return `<div class="hrow"><span class="hi" style="background-image:${I(h.img)}"></span><div><b>${h.t}</b>${h.how ? `<em>Si crea con: ${h.how}</em>` : ''}<p>${h.d}</p></div></div>`; };
function openGuide(tab = 0) {
  const tabs = GUIDE.map(([n], i) => `<button class="gtab${i === tab ? ' on' : ''}" data-t="${i}">${n}</button>`).join('');
  showCard(`<h2>Guida</h2><div class="gtabs">${tabs}</div><div class="hlist">${GUIDE[tab][1].map(helpRow).join('')}</div>
    <div class="row"><button id="cStory" class="btn btn-gray">🎬 La storia</button><button id="cClose" class="btn btn-play">Chiudi</button></div>`, { cClose: hideCard, cStory: openStoryList });
  document.querySelectorAll('.gtab').forEach((b) => { b.onclick = () => { sfx.click(); openGuide(+b.dataset.t); }; });
}
// ---------- condivisione, sfide, album, ruota, forziere, gara del weekend ----------
V.initViral({ save, persist, showCard, hideCard, I, SRC, sfx, toast, FX, beep, getNick: RANK.getNick, coinsUI: () => { $('#hCoins').textContent = save.coins; }, startLevel: (...a) => startLevel(...a), fireworks, speakerHTML: (...a) => speakerHTML(...a), IC_S, MAX_LEVEL });
V.readChallenge();
// ---------- la storia ----------
if (!save.story) save.story = {};
initStory({ I, SRC, voiceSrc: (v) => (window.__V && window.__V[v]) || `audio/${v}.mp3`, duck: (t) => AU.duck(t), canVoice: () => save.voice && save.sfx, click: () => sfx.click() });
async function showStory(id) {
  hideCard();
  save.story[id] = 1; persist();
  await playStory(id);
}
function storyUnlocked(id) {
  if (id === 'intro') return true;
  if (save.story[id]) return true;
  const z = ZONES.find((zz) => zz.id === id);
  return z ? save.level >= z.from : false;
}
function openStoryList() {
  const rows = STORY_ORDER.map((id) => {
    const ch = STORY[id], ok = storyUnlocked(id);
    return `<button class="strow${ok ? '' : ' locked'}" data-s="${id}" ${ok ? '' : 'disabled'}><span style="background-image:${ok ? I(ch.scenes[0].img) : I('u_lucchetto')}"></span><div><small>${ch.title}</small><b>${ok ? ch.name : '???'}</b></div></button>`;
  }).join('');
  showCard(`<h2>La storia</h2><div class="stlist">${rows}</div><div class="row"><button id="cBack" class="btn btn-gray">Indietro</button></div>`, { cBack: () => { sfx.click(); openGuide(); } });
  document.querySelectorAll('.strow:not(.locked)').forEach((b) => { b.onclick = () => { sfx.click(); showStory(b.dataset.s); }; });
}
// scheda "Novità!" la prima volta che incontri una cosa (si ferma il gioco finché non tocchi Ok)
function explain(keys, title = 'Novità!') {
  keys = keys.filter((k) => HELP[k] && !save.seen[k]);
  if (!keys.length) return Promise.resolve();
  keys.forEach((k) => { save.seen[k] = 1; }); persist();
  return new Promise((res) => showCard(`<h2>${title}</h2><div class="hlist">${keys.map(helpRow).join('')}</div>
    <div class="row"><button id="cOk" class="btn btn-play">Ho capito!</button></div>`, { cOk: () => { hideCard(); res(); } }));
}
const KIND = (p) => (p === 'mV' ? 'mH' : p);
// tipi di ostacoli presenti in un livello
function levelThings(lv) {
  const L = (lv.layout || []).join('');
  const out = [];
  if (/[mM]/.test(L)) out.push('mud');
  if (/[rR]/.test(L)) out.push('rock');
  if (/[cC]/.test(L)) out.push('crate');
  if (/k/.test(L)) out.push(['chain', 'ice', 'tape'][zoneOfLevel(lv.n)]);
  if (/t/.test(L)) out.push('multa');
  if (lv.boss) out.push('boss');
  return out;
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

// ---------- partita in corso: si salva a ogni mossa e si riprende se chiudi il gioco ----------
function saveRun() {
  if (!G.board || G.over) return;
  const b = G.board;
  save.run = {
    n: G.level.n, moves: G.moves, goals: G.goals.map((g) => g.done), extraN: G.goals.map((g) => g.n),
    boss: G.boss ? G.boss.count : null, shield: G.shield,
    grid: b.grid.map((row) => row.map((t) => (t ? [t.color, t.power || 0, t.rock || 0, t.chain ? 1 : 0, t.kind || 0] : null))),
    mud: b.mud, ticket: b.ticket,
  };
  persist();
}
function clearRun() { if (save.run) { delete save.run; persist(); } }
function resumeRun() {
  const R = save.run;
  startLevel(R.n, [], R);
}
function offerResume() {
  const R = save.run;
  if (!R || !R.grid) return false;
  showCard(`<h2>Partita in corso</h2>${speakerHTML('gabbah', `Eri a metà del <b>livello ${R.n}</b> con <b>${R.moves} mosse</b> rimaste. Riprendiamo da lì?`)}
    <div class="row"><button id="cDrop" class="btn btn-gray">Lascia stare</button><button id="cRes" class="btn btn-play">Riprendi</button></div>`, {
    cDrop: () => { clearRun(); save.streak = 0; persist(); hideCard(); setTimeout(checkDaily, 300); },
    cRes: () => { hideCard(); resumeRun(); },
  });
  return true;
}

async function startLevel(n, extras = [], resume = null, challenge = false) {
  const lv = getLevel(n);
  G.exhibit = challenge && n > save.level;   // sfida di un amico su un livello non ancora sbloccato: si gioca ma non fa avanzare
  G.level = lv;
  G.board = new Board(lv);
  G.moves = lv.moves;
  G.goals = lv.goals.map((g) => ({ ...g, done: 0 }));
  G.boss = lv.boss ? { ...lv.boss, count: lv.boss.every } : null;
  G.ticketCleared = false; G.explainQ = new Set(); G.coached = new Set(); G.lastProg = 0; G.idleMoves = 0;
  G.over = false; G.busy = false; G.hammer = false; G.shield = false; G.sel = null; G.droneFix = null; G.helped = false; G.moveCount = 0;
  clearPreview(); clearHint();
  if (resume) {
    const b = G.board;
    b.grid = resume.grid.map((row) => row.map((v) => {
      if (!v) return null;
      const t = newTile(v[0], v[1] || null, v[2]);
      if (v[3]) t.chain = true;
      if (v[4]) t.kind = v[4];
      return t;
    }));
    b.mud = resume.mud; b.ticket = resume.ticket;
    G.moves = resume.moves;
    G.goals.forEach((g, i) => { g.done = resume.goals[i] || 0; if (resume.extraN && resume.extraN[i]) g.n = resume.extraN[i]; });
    if (G.boss && resume.boss != null) G.boss.count = resume.boss;
    G.shield = !!resume.shield;
    G.lastProg = G.goals.reduce((s2, g) => s2 + Math.min(g.done, g.n), 0);
    extras = [];
  }
  $('#goals').innerHTML = '';
  $('#gLevel').textContent = n;
  $('#bossbar').classList.toggle('hidden', !G.boss);
  $('#bShield').style.display = G.boss ? '' : 'none';
  const zl = zoneOfLevel(n);
  FORESTALE_URI = I(ZONES[zl].boss);
  CHAIN_URI = I(['o_catena', 'o_ghiaccio', 'o_nastro'][zl]);
  $('#board').classList.toggle('ice', zl === 1);
  $('#board').classList.toggle('tape', zl === 2);
  $('#game').classList.toggle('winter', zl === 1);
  $('#game').classList.toggle('quarry', zl === 2);
  const bf = $('#bossFace');
  bf.classList.remove('beaten', 'angry', 'hit');
  if (G.boss) bf.style.backgroundImage = FORESTALE_URI;
  showScreen('game');
  AU.playMusic(lv.boss ? 'boss' : 'game');
  layout();
  buildBoardDOM();
  if (!G.boss) setTimeout(makeGold, 900);
  renderGoals();
  renderMoves();
  scheduleHint();
  if (extras.length) placeStartPowers(extras);
  setTimeout(() => { if (G.level === lv && !G.busy) saveRun(); }, 100);
  if (resume) { FX.banner('Si riparte!', `Livello ${n}`, '#ffd34d'); return; }
  setTimeout(async () => {
    if (G.level !== lv || G.over) return;
    const ks = ['swap', 'goals', ...extras.map(KIND)];
    if (ks.some((k) => !save.seen[k])) { G.busy = true; await explain(ks, n === 1 ? 'Come si gioca' : 'Novità!'); G.busy = false; }
  }, extras.length ? 1400 : 500);
}

async function openLevel(num) {
  const n = num || save.level;
  if (G.building || pendingStar) return;
  if (n > MAX_LEVEL) {
    await say('gabbah', 'Hai finito tutti i sentieri! Nuove zone (e nuove multe) arrivano coi prossimi aggiornamenti.');
    return;
  }
  const lv = getLevel(n);
  const best = save.best[n] || 0;
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
  const news = levelThings(lv).filter((k) => !save.seen[k]);
  const newsHTML = news.length ? `<div class="newsbox"><div class="prehead">Novità in questo livello</div><div class="hlist">${news.map(helpRow).join('')}</div></div>` : '';
  const gifts = streakGifts();
  const chosen = new Set();
  const preHTML = PRE.map((p) => {
    const gift = gifts.includes(p.id);
    const own = save.inv[p.id] || 0;
    return `<button class="pre${gift ? ' gift' : ''}${own && !gift ? ' own' : ''}" data-id="${p.id}" ${gift ? 'disabled' : ''}>
      <span class="pi" style="background-image:${I(p.img)}"></span><small>${p.name}</small>
      <b>${gift ? 'Regalo' : own ? `Ne hai ${own}` : p.cost + ' ' + IC_C}</b></button>`;
  }).join('');
  const streak = save.streak || 0;
  const bestHTML = n < save.level ? `<div class="bestrow">${[1, 2, 3].map((k) => `<i class="ic ic-star${k <= best ? '' : ' off'}"></i>`).join('')}<span>${best >= 3 ? 'già perfetto' : 'record: prova a fare meglio'}</span></div>` : '';
  showCard(`<h2>${lv.boss ? 'Arriva la Forestale!' : `Livello ${lv.n}`}</h2>${bestHTML}${intro}
    ${newsHTML}<div class="goalrow">${goalsHTML}</div><p>Hai <b>${lv.moves} mosse</b>${lv.boss ? '. Svuota la sua pazienza prima che ti riempia di sassi!' : ''}</p>
    <div class="prebox"><div class="prehead">${streak ? `🔥 Serie di vittorie: <b>${streak}</b>` : 'Parti con un aiuto?'}<span>${streak ? 'regali già in griglia' : 'vinci di fila per averli gratis'}</span></div>
    <div class="prerow">${preHTML}</div><div class="prehelp"><b>Moto</b> pulisce una riga · <b>Tanica</b> esplode intorno · <b>Grappa</b> via un colore</div></div>
    <div class="row"><button id="cBack" class="btn btn-gray">Indietro</button><button id="cPlay" class="btn btn-play">Gioca!</button></div>`,
  { cBack: hideCard, cPlay: () => {
    let cost = 0;
    chosen.forEach((id) => { if (save.inv[id] > 0) save.inv[id]--; else cost += PRE.find((p) => p.id === id).cost; });
    save.coins -= cost; persist();
    news.forEach((k) => { save.seen[k] = 1; }); persist();
    hideCard(); startLevel(lv.n, [...gifts, ...chosen]);
  } });
  const total = () => [...chosen].reduce((sum, id) => sum + (save.inv[id] > 0 ? 0 : PRE.find((p) => p.id === id).cost), 0);
  document.querySelectorAll('.pre:not(.gift)').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      if (chosen.has(id)) chosen.delete(id);
      else if (save.inv[id] > 0 || total() + PRE.find((p) => p.id === id).cost <= save.coins) chosen.add(id);
      else { toast('Monete finite!', 900); return; }
      btn.classList.toggle('on', chosen.has(id));
    };
  });
}

function goHome() {
  clearHint(); clearPreview();
  showScreen('home');
  AU.playMusic('home');
  renderHome();
  if (pendingStar) setTimeout(flyStarToCounter, 350);
}

// ---------- pulsanti ----------
$('#btnPlay').onclick = () => openLevel();
$('#btnBuild').onclick = () => tryBuild();
$('#btnLevels').onclick = () => { sfx.click(); openLevelList(); };
$('#btnRank').onclick = () => { sfx.click(); openRanking(); };
$('#hCoins').parentElement.onclick = () => { sfx.click(); showCard(`<h2>Monete</h2><div class="hlist">${helpRow('coins')}</div><div class="row"><button id="cClose" class="btn btn-play">Ok</button></div>`, { cClose: hideCard }); };
$('#hStars').parentElement.onclick = () => { sfx.click(); showCard(`<h2>Stelle</h2><div class="hlist">${helpRow('stars')}${helpRow('build')}</div><div class="row"><button id="cClose" class="btn btn-play">Ok</button></div>`, { cClose: hideCard }); };
$('#btnWeek').onclick = () => { sfx.click(); openWeekly(); };
$('#btnGuide').onclick = () => { sfx.click(); openGuide(); };
$('#btnAlbum').onclick = () => { if (G.building || pendingStar) return; sfx.click(); V.openAlbum(); };
// ---------- impostazioni ----------
function togglesHTML() {
  const row = (id, label, on) => `<button class="tog${on ? ' on' : ''}" id="${id}"><span>${label}</span><i></i></button>`;
  return `<div class="toggles">${row('tMusic', 'Musica', save.music)}${row('tSfx', 'Suoni', save.sfx)}${row('tVib', 'Vibrazione', save.vibra)}${row('tVoice', 'Voci', save.voice)}</div>`;
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
  flip('tVoice', 'voice', () => {});
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
    const keep = { music: save.music, sfx: save.sfx, vibra: save.vibra, voice: save.voice };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...keep })); } catch { /* */ }
    location.reload();
  } });
}
$('#btnSettings').onclick = openSettings;
$('#btnBack').onclick = () => {
  if (G.busy) return;
  showCard(`<h2>Pausa</h2>${togglesHTML()}
    <div class="row"><button id="cG" class="btn btn-gray">? Guida</button></div>
    <div class="row"><button id="cL" class="btn btn-red">Esci dal livello</button><button id="cS" class="btn btn-play">Riprendi</button></div>
    <p class="small">Se esci adesso perdi questo giro e la serie di vittorie.</p>`,
  { cS: hideCard, cG: () => openGuide(), cL: () => { hideCard(); G.over = true; save.streak = 0; clearRun(); goHome(); } });
  bindToggles();
};
$('#bossbar').onclick = () => { if (G.boss) goalInfo({ type: 'boss' }); };
$('#bHelp').onclick = () => { if (G.busy || G.over) return; sfx.click(); showHint(); const open = G.goals.filter((g) => g.done < g.n).map((g) => g.type); const k = open.find((t) => !G.coached.has(t)) || open[0]; if (k && COACH[k]) coach(k, true); };
$('#bHammer').onclick = async () => {
  if (G.busy || G.over) return;
  if (!save.seen.hammer) { await explain(['hammer']); }
  if (!G.hammer && save.coins < 100) { toast('Servono 100 monete', 1000); return; }
  G.hammer = !G.hammer;
  if (G.hammer) toast('Tocca cosa spaccare', 1000);
  renderMoves();
};
async function buyPower(pw, cost, name) {
  if (G.busy || G.over) return;
  if (save.coins < cost) { toast(`Servono ${cost} monete`, 1000); return; }
  save.coins -= cost; persist();
  sfx.click();
  placeStartPowers([pw]);
  peekSay(pw === 'bomb' ? 'Tanica piena, si parte!' : 'Ecco una moto: toccala!');
  toast(`${name} sulla griglia: toccala o scambiala`, 1400);
  setTimeout(() => saveRun(), 900);
}
$('#bMoto').onclick = () => buyPower('mH', 120, 'Moto');
$('#bTanica').onclick = () => buyPower('bomb', 180, 'Tanica');
$('#bShield').onclick = async () => {
  if (G.busy || G.over || G.shield) return;
  if (!save.seen.shield) { await explain(['shield']); return; }
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
  'o_sasso1', 'o_sasso2', 'o_fango1', 'o_fango2', 'o_cassa1', 'o_cassa2', 'o_catena', 'o_multa', 'forestale', 'b_cantiere', 'map2_bg', 'o_ghiaccio', 'map3_bg', 'o_nastro', 'fx_moto', 'fx_moto_v', 'fx_drone', 'r_up', 'r_down',
  ...BUILDINGS.map((b) => 'b_' + b.id), ...Object.values(CHARS).map((c) => c.img), 'u_stella', 'u_moneta', 'u_martello', 'u_scudo', 'u_lucchetto', 'u_nuvola'];
const preload = Promise.all(ASSETS.map((n) => new Promise((res) => { const im = new Image(); im.onload = im.onerror = () => res(); im.src = SRC(n); if (im.decode) im.decode().then(res, res); })));
document.addEventListener('visibilitychange', () => AU.pause(document.hidden));
initInput();
renderHome();
AU.playMusic('home');
preload.then(() => { const l = $('#loading'); if (l) { l.classList.add('done'); setTimeout(() => l.remove(), 400); } });
const firstStory = !save.story.intro;
const startup = () => { if (!offerResume() && !V.offerChallenge()) checkDaily(); };
if (save.welcomed && firstStory) preload.then(() => setTimeout(async () => { await showStory('intro'); startup(); }, 500));
else if (save.welcomed) setTimeout(startup, 600);
if (!save.welcomed) {
  save.welcomed = true; persist();
  // primo minuto: storia (saltabile) e poi dritti nel livello 1, oppure nella sfida dell'amico
  preload.then(() => setTimeout(async () => { await showStory('intro'); if (!V.offerChallenge()) { startLevel(1); toast('Scambia due tessere vicine!', 1600); } }, 500));
}

// per i test automatici
window.__EDT = { V, loseLevel, surpriseHelper, makeGold, showStory, G, save, startLevel, trySwap, goHome, openLevel, winLevel, checkDaily, openLevelList, renderHome };
