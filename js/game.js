// EDT Kingdom — interfaccia, animazioni, campo base
import { L, LANG, setLang } from './i18n.js';
import { BUDDIES, BUDDY, unlockedBuddies } from './piloti.js';
import { Board, ROWS, COLS, key, unkey, inside, newTile } from './engine.js';
import { getLevel, MAX_LEVEL, isHard } from './levels.js';
import { BUILDINGS, CHARS, ZONES, zoneOfLevel } from './kingdom.js';
import * as FX from './fx.js';
import * as AU from './audio.js';
import * as RANK from './rank.js';
import { initStory, playStory, STORY, STORY_ORDER } from './story.js';
import * as V from './viral.js';

const $ = (s) => document.querySelector(s);
// tocca la griglia durante cascate e bonus finale: tutto va 3 volte più veloce
const SPD = { f: 1 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms / SPD.f));
function fastTip() { if (save.seen.fastTip || SPD.f > 1) return; save.seen.fastTip = 1; persist(); toast(L`Tocca la griglia per accelerare »`, 1800); }
// "Salta »" a fine livello: niente scoppi finali, si va dritti al risultato
function skipBtn(on = true) {
  let b = document.getElementById('skipEnd');
  if (!on) { if (b) b.remove(); return; }
  if (b) return;
  G.skipEnd = false;
  b = document.createElement('button');
  b.id = 'skipEnd'; b.className = 'btn skipend'; b.innerHTML = L`Salta »`;
  b.onclick = (e) => { e.stopPropagation(); G.skipEnd = true; setFast(true); SPD.f = 40; b.remove(); };
  $('#game').appendChild(b);
}
function setFast(on) { SPD.f = on ? 3 : 1; const g = document.getElementById('game'); if (g) g.classList.toggle('fast', !!on); }
const app = $('#app');

// ---------- grafica in cache ----------
const SRC = (n) => (window.__A && window.__A[n]) || `img/${n}.webp`;
const I = (n) => `url('${SRC(n)}')`;
const TILE_URI = ['t0_birra', 't1_casco', 't2_maschera', 't3_chiave', 't4_gomma', 't5_stivale'].map(I);
const RIDER_UP = I('r_up'), RIDER_DOWN = I('r_down');
const RIDE_URI = { mH: I('fx_moto'), mV: I('fx_moto_v'), drone: I('fx_drone') };   // senza medaglione, per le animazioni
const POWER_URI = { mH: I('p_moto'), mV: I('p_moto_v'), bomb: I('p_tanica'), grappa: I('p_grappa'), drone: I('p_drone') };
let ROCK_URI = [null, I('o_sasso1'), I('o_sasso2')];
let MUD_URI = [null, I('o_fango1'), I('o_fango2')];
let FORESTALE_URI = I('forestale');
let CRATE_URI = [null, I('o_cassa1'), I('o_cassa2')];
const MUG_URI = [I('o_boccale3'), I('o_boccale2'), I('o_boccale1'), I('o_boccale0')];   // per colpi rimasti: 0 pieno … 3 vuoto
let CHAIN_URI = I('o_catena');
let MULTA_URI = I('o_multa');
const VELOX_URI = I('o_autovelox'), GOMME_URI = I('o_gomme'), DROP_URI = I('o_fusto');

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
  setFast(false);
  $('#card').innerHTML = html;
  $('#card').classList.toggle('precard', html.includes('class="prebox"'));
  $('#card').scrollTop = 0;
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
// compagni di giro con la voce vera (ElevenLabs): file v_<id>0 e v_<id>1 = le due battute in piloti.js
const BUD_VOICED = ['angelo', 'erika', 'maggie', 'alex', 'giacu'];
function budVoice(id, i) {
  if (!save.voice || !save.sfx || !BUD_VOICED.includes(id)) return;
  const src = (window.__V && window.__V['v_' + id + i]) || `audio/v_${id}${i}.mp3`;
  try { if (vAudio) vAudio.pause(); vAudio = new Audio(src); vAudio.play().catch(() => {}); AU.duck(1.8); lastVoice = performance.now(); } catch { /* niente */ }
}
// battuta del compagno: testo nel fumetto e, se c'è, la sua voce
function budLine(b) { const i = Math.floor(Math.random() * b.lines.length); peekSay(b.lines[i]); budVoice(b.id, i); }
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
function say(who, text, btn = L`Ok!`, vIdx = -1) {
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
['drone', 'hammer', 'moves'].forEach((k) => { if (save.inv[k] == null) save.inv[k] = 0; });
if (!save.gold) save.gold = {};   // edifici dorati: id -> giorno dell'ultimo regalo ritirato
if (!save.frames) save.frames = [];
// vecchi salvataggi: i livelli già vinti valgono almeno 1 stella
for (let n = 1; n < Math.min(save.level, 61); n++) if (!save.best[n]) save.best[n] = 1;
const stepsOf = (b) => save.steps[b.id] || 0;
const isBuilt = (b) => stepsOf(b) >= STEPS;
const nextBuilding = () => BUILDINGS.find((b) => !isBuilt(b));
const zoneOf = (b) => ZONES.find((z) => z.id === b.zone);
const zoneDone = (z) => z.buildings.every(isBuilt);
let pendingStar = 0;      // stelle in volo verso il contatore
let viewZone = null;      // zona che si sta guardando

// mappa scorrevole: sopra l'immagine c'è una fascia in più (alta quanto l'intestazione), così si può scorrere e vedere anche gli edifici in alto
const MAPG = { W: 400, H: 700, band: 0, Hc: 700 };
function bldTop(b) { return b.ix != null ? bldXY(b)[1] : (MAPG.band + (14 + b.y * 0.72) / 100 * MAPG.H) / MAPG.Hc * 100; }
function bldX(b) { return b.ix != null ? bldXY(b)[0] : b.x; }
// edifici posizionati sulle radure dell'immagine (zona Marocco)
function bldXY(b) {
  const [px, py] = mapPoint(null, b.ix * 12.8, b.iy * 12.8);
  return [px / MAPG.W * 100, py / MAPG.Hc * 100 - 3 * MAPG.H / MAPG.Hc];
}
// quanto dell'edificio è già su (dal basso): tappa 0 niente, 1 fondamenta, 2 metà, 3 finito
const RISE = [0, 0.3, 0.68, 1];
const riseClip = (st) => `inset(${Math.round((1 - RISE[Math.max(0, Math.min(st, STEPS))]) * 100)}% 0 0 0)`;
const homeTrack = () => ({ oktober: 'okt', hallo: 'hall' }[currentZone().id] || 'home');
function currentZone() { const nb = nextBuilding(); return nb ? zoneOf(nb) : ZONES[ZONES.length - 1]; }
// il tema della partita (sfondo, ostacoli, musica, boss) segue la zona che stai costruendo sulla mappa
function lvZone() { return Math.max(0, ZONES.indexOf(currentZone())); }

// converte un punto dell'immagine della mappa (1280x1280, "cover") in pixel sullo schermo
function mapPoint(map, x, y) {
  const { W, H, band } = MAPG, k = Math.max(W / 1280, H / 1280);
  return [(W - 1280 * k) / 2 + x * k, band + (H - 1280 * k) / 2 + y * k];
}

// le etichette degli edifici non devono finire sotto i pulsanti laterali né fuori dallo schermo
function fitTags(map) {
  const side = document.querySelector('#home .sidebtns'), mr = map.getBoundingClientRect();
  const minX = side ? side.getBoundingClientRect().right + 4 : mr.left + 4, maxX = mr.right - 4;
  const sr = null;
  // niente etichette o barre nascoste sotto il cartello della zona: le spostiamo appena sotto
  const under = (r) => sr && r.top < sr.bottom + 3 && r.bottom > sr.top && r.left < sr.right && r.right > sr.left ? sr.bottom + 4 - r.top : 0;
  map.querySelectorAll('.bld .pbar').forEach((t) => { t.style.translate = ''; const dy = under(t.getBoundingClientRect()); if (dy) t.style.translate = `0 ${Math.round(dy)}px`; });
  map.querySelectorAll('.bld .tag').forEach((t) => {
    t.style.transform = '';
    const r = t.getBoundingClientRect();
    let dx = 0;
    if (r.left < minX) dx = minX - r.left; else if (r.right > maxX) dx = maxX - r.right;
    const dy = under({ top: r.top, bottom: r.bottom, left: r.left + dx, right: r.right + dx });
    if (dx || dy) t.style.transform = `translate(${Math.round(dx)}px, ${Math.round(dy)}px)`;
  });
  // etichette che dopo lo spostamento si accavallano: quella più in basso scende sotto l'altra
  const tags = [...map.querySelectorAll('.bld .tag')].map((t) => ({ t, r: t.getBoundingClientRect() })).sort((a, b) => a.r.top - b.r.top);
  for (let i = 0; i < tags.length; i++) for (let j = i + 1; j < tags.length; j++) {
    const A = tags[i].r, B = tags[j];
    if (B.r.top < A.bottom + 2 && B.r.bottom > A.top && B.r.left < A.right && B.r.right > A.left) {
      const dy = A.bottom + 3 - B.r.top, m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(B.t.style.transform) || [0, 0, 0];
      B.t.style.transform = `translate(${+m[1]}px, ${Math.round(+m[2] + dy)}px)`;
      B.r = B.t.getBoundingClientRect();
    }
  }
}
// la mappa finisce sopra il pannello in basso, così nessun edificio resta nascosto dietro "Prossimo lavoro"
function fitMap() {
  const hb = document.querySelector('#home .homebar'), map = $('#map');
  if (!hb || !map || !hb.offsetHeight) return;
  const b = Math.max(0, hb.offsetHeight - 26) + 'px';
  if (map.style.bottom !== b) map.style.bottom = b;
}
window.addEventListener('resize', () => { fitMap(); });
// ---------------- edifici dorati e negozio ----------------
// (giorno di oggi: dayKey, definita più sotto)
const GOLD_COST = 600;
const giftsReady = () => BUILDINGS.filter((b) => isBuilt(b) && save.gold[b.id] != null && save.gold[b.id] !== dayKey());
function takeGift(b) {
  save.gold[b.id] = dayKey();
  const r = Math.random(), pw = r < .25 ? pick(['mH', 'bomb', 'hammer']) : null, coins = pw ? 0 : 30 + Math.floor(Math.random() * 4) * 10;
  if (pw) save.inv[pw] = (save.inv[pw] || 0) + 1; else save.coins += coins;
  return { pw, coins };
}
// tutti i regali degli edifici d'oro in un colpo solo
function collectAll() {
  const list = giftsReady(); if (!list.length) return;
  let coins = 0; const pws = {};
  list.forEach((b) => { const g = takeGift(b); coins += g.coins; if (g.pw) pws[g.pw] = (pws[g.pw] || 0) + 1; });
  persist(); sfx.win(); fireworks(900); renderHome();
  const names = { mH: L`Moto`, bomb: L`Tanica`, hammer: L`Martello` };
  const parts = [coins ? `<b>+${coins} ${IC_C}</b>` : '', ...Object.entries(pws).map(([k, n]) => `<b>+${n} ${names[k]}</b>`)].filter(Boolean).join(' · ');
  showCard(L`<h2>Regali raccolti!</h2><p>${list.length} edifici d'oro ti hanno fatto un regalo:</p><p>${parts}</p>
    <div class="row"><button id="cOk" class="btn btn-play">Grazie!</button></div>`, { cOk: hideCard });
}
function openBuilt(b) {
  sfx.click();
  const gold = save.gold[b.id] != null;
  if (gold && save.gold[b.id] !== dayKey()) {   // regalo del giorno dell'edificio dorato
    const { pw, coins } = takeGift(b);
    persist(); sfx.win(); renderHome();
    say(b.who, L`Ecco il regalo di oggi dal mio edificio d'oro: <b>${pw ? { mH: L`una Moto`, bomb: L`una Tanica`, hammer: L`un Martello` }[pw] : coins + ' ' + IC_C}</b>!`, L`Grazie!`);
    return;
  }
  showCard(`${speakerHTML(b.who, b.text)}${gold ? `<p class="small">${L`✨ Edificio d'oro: torna domani per il prossimo regalo.`}</p>` : `<p class="small">${L`Rendilo <b>d'oro</b>: brilla sulla mappa e ogni giorno ti fa un regalo (monete o potenziamenti).`}</p>`}
    <div class="row">${gold ? '' : `<button id="cGold" class="btn btn-gold">✨ ${GOLD_COST} ${IC_C}</button>`}<button id="cOk" class="btn btn-play">${L`Bello!`}</button></div>`, {
    cOk: hideCard,
    cGold: () => {
      if (save.coins < GOLD_COST) { toast(L`Servono ${GOLD_COST} monete`, 1200); return; }
      save.coins -= GOLD_COST; save.gold[b.id] = ''; persist(); hideCard(); sfx.win(); fireworks(900); renderHome(b.id);
      FX.banner(L`Edificio d'oro!`, b.name, '#ffd34d');
    },
  });
}
const SHOP_PW = [
  { k: 'mH', img: 'p_moto', name: L`Moto`, cost: 100 }, { k: 'bomb', img: 'p_tanica', name: L`Tanica`, cost: 150 },
  { k: 'grappa', img: 'p_grappa', name: L`Grappa`, cost: 220 }, { k: 'hammer', img: 'u_martello', name: L`Martello`, cost: 90 },
  { k: 'moves', img: 'u_nuvola', name: L`+5 mosse`, cost: 180, icon: '+5' },
];
const SHOP_PACKS = [
  { id: 'kit', name: L`Kit del pilota`, desc: L`2 Moto, 1 Tanica, 1 Martello`, cost: 380, give: { mH: 2, bomb: 1, hammer: 1 } },
  { id: 'boss', name: L`Kit anti-Forestale`, desc: L`2 Tanica, 1 Grappa, 2 +5 mosse`, cost: 780, give: { bomb: 2, grappa: 1, moves: 2 } },
];
function openShop(tab = 0) {
  if (G.building || pendingStar) return;
  sfx.click();
  const TABS = [L`Aiuti`, L`Figurine`, L`Stile`, L`Campo Base`];
  const tabs = `<div class="gtabs">${TABS.map((t, i) => `<button class="gtab${i === tab ? ' on' : ''}" data-sh="${i}">${t}</button>`).join('')}</div>`;
  let body = '';
  if (tab === 0) {
    body = `<div class="shgrid">${SHOP_PW.map((p) => `<button class="shit" data-pw="${p.k}"><span class="pi" style="background-image:${I(p.img)}">${p.icon ? `<em>${p.icon}</em>` : ''}</span><b>${p.name}</b><small>${L`ne hai`} ${save.inv[p.k] || 0}</small><i>${p.cost} ${IC_C}</i></button>`).join('')}</div>
      ${SHOP_PACKS.map((p) => `<button class="shpack" data-pk="${p.id}"><div><b>${p.name}</b><small>${p.desc}</small></div><i>${p.cost} ${IC_C}</i></button>`).join('')}
      <p class="small">${L`Li trovi prima di ogni livello ("Parti con un aiuto?") e nei pulsanti in basso durante la partita.`}</p>`;
  } else if (tab === 1) {
    body = `<p>${L`Album`}: <b>${V.albumCount()}/${V.albumTotal()}</b></p>
      <button class="shpack" data-st="3"><div><b>${L`Busta da 3 figurine`}</b><small>${L`3 figurine a caso`}</small></div><i>250 ${IC_C}</i></button>
      <button class="shpack gold" data-st="6"><div><b>${L`Busta d'oro`}</b><small>${L`6 figurine, risparmi 50 monete`}</small></div><i>450 ${IC_C}</i></button>`;
  } else if (tab === 2) {
    body = `<p class="small">${L`Cornici per il tuo pilota: le vedono tutti in classifica.`}</p><div class="shgrid">${V.FRAMES.map((f) => {
      const own = save.frames.includes(f.id);
      return `<button class="shit${own ? ' own' : ''}" data-fr="${f.id}"><span class="rkav fr-${f.id}" style="background-image:${I(CHARS[V.me().who].img)};width:54px;height:54px"></span><b>${f.name}</b><i>${own ? L`Tua ✔` : f.cost + ' ' + IC_C}</i></button>`; }).join('')}</div>
      <div class="row"><button id="cPil" class="btn btn-gray">${L`Il tuo pilota`}</button></div>`;
  } else {
    const built = BUILDINGS.filter(isBuilt);
    body = `<p class="small">${L`Un edificio d'oro brilla sulla mappa e <b>ogni giorno</b> ti regala monete o un potenziamento: tocca il 🎁 sopra l'edificio.`}</p>
      <div class="shgrid">${built.map((b) => { const g = save.gold[b.id] != null; return `<button class="shit${g ? ' own' : ''}" data-gb="${b.id}"><span class="pi" style="background-image:${I('b_' + b.id)}"></span><b>${b.name}</b><i>${g ? L`D'oro ✔` : GOLD_COST + ' ' + IC_C}</i></button>`; }).join('') || `<p>${L`Costruisci il primo edificio!`}</p>`}</div>`;
  }
  showCard(`<h2>${L`Negozio`}</h2><p class="shcoins">${IC_C} <b>${save.coins}</b></p>${tabs}<div class="shbody">${body}</div>
    <div class="row"><button id="cClose" class="btn btn-play">${L`Chiudi`}</button></div>`, { cClose: () => { hideCard(); renderHome(); }, cPil: () => V.openPilot(() => openShop(2)) });
  document.querySelectorAll('.gtab[data-sh]').forEach((b) => { b.onclick = () => openShop(+b.dataset.sh); });
  const pay = (cost) => { if (save.coins < cost) { toast(L`Servono ${cost} monete`, 1200); return false; } save.coins -= cost; persist(); sfx.win(); return true; };
  document.querySelectorAll('[data-pw]').forEach((b) => { b.onclick = () => { const p = SHOP_PW.find((x) => x.k === b.dataset.pw); if (pay(p.cost)) { save.inv[p.k] = (save.inv[p.k] || 0) + 1; persist(); toast(L`${p.name} nello zaino!`, 900); openShop(0); } }; });
  document.querySelectorAll('[data-pk]').forEach((b) => { b.onclick = () => { const p = SHOP_PACKS.find((x) => x.id === b.dataset.pk); if (pay(p.cost)) { for (const [k, n] of Object.entries(p.give)) save.inv[k] = (save.inv[k] || 0) + n; persist(); fireworks(700); openShop(0); } }; });
  document.querySelectorAll('[data-st]').forEach((b) => { b.onclick = async () => {
    const n = +b.dataset.st; if (!pay(n === 3 ? 250 : 450)) return;
    hideCard();
    for (let i = 0; i < n; i++) await V.revealSticker(V.drawSticker());
    openShop(1);
  }; });
  document.querySelectorAll('[data-fr]').forEach((b) => { b.onclick = () => {
    const f = V.FRAMES.find((x) => x.id === b.dataset.fr);
    if (save.frames.includes(f.id)) { V.me().fr = f.id; persist(); toast(L`Cornice messa!`, 900); openShop(2); return; }
    if (pay(f.cost)) { save.frames.push(f.id); V.me().fr = f.id; persist(); fireworks(700); openShop(2); }
  }; });
  document.querySelectorAll('[data-gb]').forEach((b) => { b.onclick = () => {
    const id = b.dataset.gb; if (save.gold[id] != null) return;
    if (pay(GOLD_COST)) { save.gold[id] = ''; persist(); fireworks(800); openShop(3); }
  }; });
}
function renderHome(popId = null) {
  fitMap(); setTimeout(sideUI, 0);
  renderWeekBadge();
  $('#albPct').textContent = `${V.albumCount()}/${V.albumTotal()}`;
  { const ep = V.eventProgress(), be = $('#btnEvent');
    if (be) { be.hidden = !ep; if (ep) { be.querySelector('span').style.backgroundImage = I(ep.ev.img); $('#evPct').textContent = ep.st.n; } } }
  $('#hStars').textContent = save.stars - pendingStar;
  $('#hCoins').textContent = save.coins;
  const zone = viewZone || currentZone();
  const box = $('#map');
  const sameZone = box.dataset.zone === zone.id, prevTop = box.scrollTop;
  box.innerHTML = '';
  box.dataset.zone = zone.id; $('#home').dataset.zone = zone.id;
  // cartello della zona (fisso, fuori dalla parte che scorre)
  document.querySelector('#home > .zonesign')?.remove();
  const zi = ZONES.indexOf(zone), cz = ZONES.indexOf(currentZone());
  const sign = document.createElement('div');
  sign.className = 'zonesign';
  sign.innerHTML = `${zi > 0 ? '<button class="zarr" data-d="-1">◀</button>' : ''}<span>${zone.name}</span>${zi < cz ? '<button class="zarr" data-d="1">▶</button>' : ''}`;
  sign.querySelectorAll('.zarr').forEach((bt) => { bt.onclick = (e) => { e.stopPropagation(); viewZone = ZONES[zi + +bt.dataset.d]; sfx.click(); renderHome(); }; });
  $('#home').appendChild(sign);
  { const W = box.clientWidth || 400, H = box.clientHeight || 700;
    const band = Math.max(0, Math.round(sign.getBoundingClientRect().bottom - box.getBoundingClientRect().top + 6));
    Object.assign(MAPG, { W, H, band, Hc: H + band }); }
  const map = document.createElement('div');
  map.className = 'mapin'; map.style.height = MAPG.Hc + 'px';
  { const k = Math.max(MAPG.W / 1280, MAPG.H / 1280), ox = (MAPG.W - 1280 * k) / 2, oy = (MAPG.H - 1280 * k) / 2;
    const bg = { backgroundImage: I(zone.bg), backgroundSize: `${1280 * k}px ${1280 * k}px`, backgroundPosition: `${ox}px ${oy}px` };
    const img = document.createElement('div'); img.className = 'mapimg'; Object.assign(img.style, bg, { top: MAPG.band + 'px', height: MAPG.H + 'px' });
    const fill = document.createElement('div'); fill.className = 'mapfill'; Object.assign(fill.style, bg, { height: MAPG.band + 'px', backgroundPosition: `${ox}px ${oy}px` });
    map.append(fill, img); }
  box.appendChild(map);
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
    const gold = built && save.gold[b.id] != null, goldReady = gold && save.gold[b.id] !== dayKey();
    d.className = 'bld ' + (built ? 'built' : isNext ? 'next' : 'ghost') + (b.id === popId ? ' pop' : '') + (gold ? ' golden' : '') + (goldReady ? ' gready' : '');
    d.dataset.id = b.id;
    d.style.left = bldX(b) + '%';
    d.style.top = bldTop(b) + '%';
    d.innerHTML = (isNext ? `<div class="img ghostL" style="background-image:${I('b_' + b.id)}"></div><div class="img rise" style="background-image:${I('b_' + b.id)};clip-path:${riseClip(st)}"></div><div class="img scaf s${st}" style="background-image:${I('b_cantiere')}"></div>`
      : `<div class="img" style="background-image:${I('b_' + b.id)}"></div>`) + `
      ${isNext ? `<div class="pbar"><i style="width:${st / STEPS * 100}%"></i><span>${st}/${STEPS}</span></div>` : ''}
      ${built ? '<div class="flags"><i></i><i></i></div>' : ''}
      ${built && CHARS[b.who] ? `<div class="resident" style="background-image:${I(CHARS[b.who].img)};animation-delay:${((b.x || b.ix) + (b.y || b.iy)) % 7 * -0.4}s"></div>` : ''}
      ${built && (b.id === 'bar' || b.id === 'rifugio' || b.id === 'sauna') ? '<div class="smoke"><i></i><i></i><i></i></div>' : ''}
      <div class="tag">${built ? b.name : isNext ? `<i class="ic ic-hammer"></i> ${b.name}` : `<i class="ic ic-lock"></i> ${b.name}`}</div>`;
    if (goldReady) { const g = document.createElement('div'); g.className = 'goldgift'; g.textContent = '🎁'; d.appendChild(g); }
    d.onclick = () => (isNext ? tryBuild() : built ? openBuilt(b) : lockedInfo(b));
    map.appendChild(d);
  }
  if (nb && zoneOf(nb) === zone && save.stars >= STEP_COST) {
    const a = document.createElement('div');
    a.className = 'arrow'; a.textContent = '▼';
    a.style.left = bldX(nb) + '%'; a.style.top = (bldTop(nb) - 12) + '%';
    map.appendChild(a);
  }
  // la moto che gira sul sentiero (solo se c'è almeno un edificio costruito nella zona)
  // moto sul sentiero tolta: non seguiva bene la strada
  // posizione di partenza: come prima (fascia nascosta), ma se il prossimo lavoro è in alto lo mostriamo
  { let top = sameZone ? prevTop : MAPG.band;
    if (!sameZone && nb && zoneOf(nb) === zone) { const y = bldTop(nb) / 100 * MAPG.Hc; if (y - top < MAPG.band + 30) top = Math.max(0, y - MAPG.band - 40); }
    box.scrollTop = top; }
  requestAnimationFrame(() => fitTags(box));
  // "Raccogli tutto" quando ci sono almeno 2 regali pronti
  { let ga = document.getElementById('giftAll'); const gr = giftsReady().length;
    if (gr >= 2) { if (!ga) { ga = document.createElement('button'); ga.id = 'giftAll'; ga.className = 'giftall'; ga.onclick = (e) => { e.stopPropagation(); collectAll(); }; $('#home').appendChild(ga); } ga.innerHTML = L`🎁 Raccogli tutto <b>${gr}</b>`; }
    else if (ga) ga.remove(); }

  const btnB = $('#btnBuild');
  if (nb) {
    $('#job').hidden = false;
    $('#jobImg').style.backgroundImage = I('b_' + nb.id);
    $('#jobName').textContent = nb.name;
    $('#jobSteps').innerHTML = Array.from({ length: STEPS }, (_, k) => `<i class="${k < stepsOf(nb) ? 'on' : ''}"></i>`).join('');
    const ok = save.stars >= STEP_COST;
    btnB.classList.toggle('ready', ok); btnB.classList.toggle('wait', !ok);
    $('#buildLbl').textContent = L`Costruisci`;
    $('#buildCost').innerHTML = (ok ? L`usa` : L`serve`) + ' ' + IC_S + ' ' + STEP_COST;
  } else {
    $('#jobImg').style.backgroundImage = I('b_palazzo');
    $('#jobName').textContent = L`Campo Base completo!`;
    $('#jobSteps').innerHTML = '';
    btnB.classList.remove('ready'); btnB.classList.add('wait');
    $('#buildLbl').textContent = L`Fatto`; $('#buildCost').textContent = L`Completo`;
  }
  $('#btnPlay').innerHTML = save.level > MAX_LEVEL ? L`Finito! 🏆` : L`Gioca <b>livello ${save.level}</b>`;
}

let riderRAF = 0;
// Miti che fa il giro del Campo Base: sentiero curvo, frena in curva, si piega, in cima fa inversione; ogni tanto salta o impenna
function smoothTrail(trail, stepLen = 3) {
  const P = [];
  const g = (i) => trail[Math.max(0, Math.min(trail.length - 1, i))];
  for (let i = 0; i < trail.length - 1; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / stepLen));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a0, a1, a2, a3) => 0.5 * (2 * a1 + (-a0 + a2) * t + (2 * a0 - 5 * a1 + 4 * a2 - a3) * t2 + (-a0 + 3 * a1 - 3 * a2 + a3) * t3);
      P.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  P.push(trail[trail.length - 1].slice());
  const D = [0], H = [];
  for (let i = 1; i < P.length; i++) D.push(D[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  for (let i = 0; i < P.length; i++) { const a2 = P[Math.max(0, i - 2)], b2 = P[Math.min(P.length - 1, i + 2)]; H.push(Math.atan2(b2[1] - a2[1], b2[0] - a2[0])); }
  // curvatura (cambio di direzione per unità di strada), un po' ammorbidita
  const K = H.map((h, i) => { const j = Math.min(H.length - 1, i + 4), d = D[j] - D[i] || 1; let dh = H[j] - h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI; return Math.abs(dh) / d; });
  return { P, D, H, K, tot: D[D.length - 1] };
}
function startTrailRider(map, trail) {
  cancelAnimationFrame(riderRAF);
  const el = document.createElement('div');
  el.className = 'trailrider';
  el.innerHTML = '<i></i>';
  const spr = el.firstChild;
  el.onclick = (e) => { e.stopPropagation(); sfx.moto(); say('miti', L`Sono io che faccio il giro del Campo Base per riprendere i lavori con la GoPro! Più edifici costruisci, più è bello il giro.`, L`Vai Miti!`); };
  map.appendChild(el);
  const T = smoothTrail(trail);
  const idx = (d) => { let lo = 0, hi = T.D.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T.D[m] <= d) lo = m; else hi = m; } return lo; };
  const at = (d) => { d = Math.max(0, Math.min(T.tot, d)); const i = idx(d), j = Math.min(i + 1, T.P.length - 1), seg = T.D[j] - T.D[i] || 1, f = (d - T.D[i]) / seg; return [T.P[i][0] + (T.P[j][0] - T.P[i][0]) * f, T.P[i][1] + (T.P[j][1] - T.P[i][1]) * f]; };
  const curveAhead = (d, dir, len) => { let m = 0; for (let x = 0; x <= len; x += 6) { const k = T.K[idx(Math.max(0, Math.min(T.tot, d + dir * x)))]; if (k > m) m = k; } return m; };
  const VMAX = 70, VMIN = 24;
  let s = 0, dir = 1, v = 0, mode = 'ride', modeT = 0;
  let sx = 1, faceX = 1, away = true, lean = 0, lastH = null;
  let trick = null, lastDust = 0, last = performance.now(), nextTrick = 4 + Math.random() * 5;
  const home = $('#home');
  spr.style.backgroundImage = RIDER_UP;
  const dust = (px, py, sc, n = 1, spread = 6) => {
    for (let k = 0; k < n; k++) {
      const p = document.createElement('b'); p.className = 'tdust';
      p.style.transform = `translate(${px - spread / 2 + Math.random() * spread}px, ${py - 6 + Math.random() * 3}px) scale(${sc * (0.7 + Math.random() * 0.6)})`;
      map.appendChild(p); setTimeout(() => p.remove(), 900);
    }
  };
  const step = (now) => {
    if (!el.isConnected || !home.classList.contains('active')) { riderRAF = 0; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    modeT += dt;
    if (mode === 'ride') {
      const vt = trick && trick.kind === 'wheelie' ? VMAX * 0.8 : VMAX - (VMAX - VMIN) * Math.min(1, curveAhead(s, dir, 70) / 0.028);
      v += (vt > v ? 38 : -95) * dt; v = Math.max(VMIN * 0.4, Math.min(v, VMAX));
      s += dir * v * dt;
      if (s <= 0 || s >= T.tot) { s = Math.max(0, Math.min(T.tot, s)); mode = 'stop'; modeT = 0; trick = null; }
    } else if (mode === 'stop') {
      v = 0;
      if (modeT > 0.9) { mode = 'turn'; modeT = 0; }
    } else if (mode === 'turn') {
      if (modeT > 0.75) { mode = 'ride'; modeT = 0; dir = -dir; v = 4; lastH = null; }
    }
    const [x, y] = at(s);
    const [x2, y2] = at(s + dir * 10);
    let hx = x2 - x, hy = y2 - y; const hl = Math.hypot(hx, hy) || 1; hx /= hl; hy /= hl;
    // durante l'inversione guarda già verso la nuova direzione a metà manovra
    if (mode === 'turn' && modeT > 0.37) { hx = -hx; hy = -hy; }
    if (mode !== 'stop') {
      if (hy < -0.3) away = true; else if (hy > 0.3) away = false;
      if (hx > 0.18) faceX = 1; else if (hx < -0.18) faceX = -1;
    }
    sx += (faceX - sx) * Math.min(1, dt * (mode === 'turn' ? 7 : 9));
    const img = away ? RIDER_UP : RIDER_DOWN;
    const want = away ? 'u' : 'd';
    if (spr.dataset.img !== want && (mode !== 'turn' || Math.abs(sx) < 0.6)) { spr.dataset.img = want; spr.style.backgroundImage = img; }
    // piega in curva: velocità di rotazione della direzione
    const h = Math.atan2(hy, hx);
    let om = 0;
    if (lastH !== null && mode === 'ride') { om = h - lastH; while (om > Math.PI) om -= 2 * Math.PI; while (om < -Math.PI) om += 2 * Math.PI; om /= dt || 1; }
    lastH = h;
    lean += (Math.max(-15, Math.min(15, om * 9)) - lean) * Math.min(1, dt * 6);
    // salti e impennate sul dritto
    nextTrick -= dt;
    if (!trick && mode === 'ride' && nextTrick <= 0 && v > VMAX * 0.75 && curveAhead(s, dir, 90) < 0.008) {
      trick = Math.random() < 0.55 ? { kind: 'jump', t: 0, dur: 0.6 } : { kind: 'wheelie', t: 0, dur: 1.3 };
      nextTrick = 6 + Math.random() * 7;
    } else if (!trick && nextTrick <= 0) nextTrick = 1;
    let hop = 0, pitch = 0;
    if (trick) {
      trick.t += dt; const u = Math.min(1, trick.t / trick.dur);
      if (trick.kind === 'jump') { hop = Math.sin(Math.PI * u) * 26; pitch = (u < 0.5 ? -10 : -10 + (u - 0.5) * 36); }
      else { const e = u < 0.2 ? u / 0.2 : u > 0.8 ? (1 - u) / 0.2 : 1; pitch = -16 * e; }
      if (u >= 1) { if (trick.kind === 'jump') trick.landed = true; const was = trick; trick = null; if (was.kind === 'jump') { const [lx, ly] = mapPoint(map, x, y); dust(lx, ly, 0.55 + (y / 1280) * 0.55, 6, 22); } }
    }
    if (mode === 'turn') { const u = modeT / 0.75; hop = Math.sin(Math.PI * u) * 6; pitch = -8 * Math.sin(Math.PI * u); }
    const [px, py] = mapPoint(map, x, y);
    const sc = 0.55 + (y / 1280) * 0.55;
    const bob = mode === 'stop' ? Math.abs(Math.sin(now / 160)) * 0.8 : Math.abs(Math.sin(now / 85)) * (0.8 + 1.8 * v / VMAX);
    el.style.transform = `translate(${px}px, ${py}px) scale(${sc})`;
    // il sprite guarda a destra: l'impennata alza la ruota davanti (verso faceX)
    const rot = lean + pitch * Math.sign(sx || 1);
    spr.style.transform = `translate(-50%, ${-88 - bob}%) translateY(${-hop}px) rotate(${rot}deg) scaleX(${Math.max(0.12, Math.abs(sx)) * Math.sign(sx || 1)})`;
    // polvere dalla ruota dietro, più fitta quando va forte; niente in volo
    const rate = mode === 'ride' ? 220 - 140 * (v / VMAX) : mode === 'turn' ? 70 : 9999;
    if (hop < 3 && now - lastDust > rate) {
      lastDust = now;
      const k = (12 + 8 * (v / VMAX)) * sc;
      dust(px - hx * k, py - hy * k * 0.6, sc, trick && trick.kind === 'wheelie' ? 2 : 1);
    }
    riderRAF = requestAnimationFrame(step);
  };
  riderRAF = requestAnimationFrame(step);
}

function lockedInfo(b) {
  const idx = BUILDINGS.indexOf(b);
  const before = BUILDINGS.slice(0, idx).reduce((s, x) => s + (STEPS - stepsOf(x)) * STEP_COST, 0);
  const nb = nextBuilding();
  say('gabbah', L`<b>${b.name}</b> arriva più avanti. Prima finiamo <b>${nb.name}</b>: servono ancora <b>${before} ${IC_S}</b> prima di arrivarci.`, L`Ok`);
}

async function tryBuild() {
  const nb = nextBuilding();
  if (!nb || G.building || pendingStar) return;
  if (viewZone && viewZone !== zoneOf(nb)) { viewZone = null; renderHome(); }
  if (save.stars < STEP_COST) {
    showCard(L`${speakerHTML('gabbah', L`Ogni pezzo di <b>${nb.name}</b> costa <b>${STEP_COST} ${IC_S}</b> e ne hai ${save.stars}. Vinci i livelli: con poche mosse usate prendi fino a <b>3 ${IC_S}</b>!`)}
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
  const map = $('#map .mapin') || $('#map');
  const M = () => $('#map .mapin') || $('#map');
  const el0 = map.querySelector(`.bld[data-id="${nb.id}"]`);
  { const box = $('#map'), y = bldTop(nb) / 100 * MAPG.Hc; if (y - box.scrollTop < MAPG.band + 30 || y - box.scrollTop > MAPG.H) box.scrollTop = Math.max(0, y - MAPG.band - 60); }
  map.style.transformOrigin = `${bldX(nb)}% ${bldTop(nb)}%`;
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
    M().style.transformOrigin = `${bldX(nb)}% ${bldTop(nb)}%`; M().style.transform = 'scale(1.45)';
    M().querySelector(`.bld[data-id="${nb.id}"]`)?.classList.add('rising');
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
      ban.innerHTML = L`<small>COSTRUITO!</small><b>${nb.name}</b>`; app.appendChild(ban);
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
        setTimeout(() => { c.remove(); beep(1200, .05, 'square', .04); if (k === 5) { $('#hCoins').textContent = save.coins; const pl = $('#hCoins').parentElement; pl.classList.remove('bump'); void pl.offsetWidth; pl.classList.add('bump'); toast(L`+${PRIZE} monete`, 900); } }, 900 + k * 70);
      }
    }, 1500);
  } else {
    beep(660, 0.12, 'triangle', 0.1);
    renderHome();
    M().style.transformOrigin = `${bldX(nb)}% ${bldTop(nb)}%`; M().style.transform = 'scale(1.45)';
    FX.banner(L`Tappa ${stepsOf(nb)} di ${STEPS}`, nb.name, '#ffd34d');
  }
  await sleep(done ? 2600 : 1100);
  wk.classList.add('leave'); setTimeout(() => wk.remove(), 500);
  M().style.transform = '';
  await sleep(500);
  G.building = false;
  if (done) {
    await say(nb.who, nb.text, L`Grande!`);
    if (zoneFinished) {
      const z = zoneOf(nb), nz = ZONES[ZONES.indexOf(z) + 1];
      fireworks(2600);
      await sleep(1800);
      if (nz) {
        if (nz.id === 'marocco') await showStory('finale');
        if (nz.id === 'oktober') await showStory('fine');
        if (nz.id === 'hallo') await showStory('oktofine');
        await showStory(nz.id);
        viewZone = null; renderHome();
        FX.banner(nz.name, L`Nuova zona sbloccata!`, '#bdf0ff');
      } else {
        await showStory('hallofine');
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
            setTimeout(() => say('gabbah', L`Hai abbastanza <b>stelle</b>! Ogni pezzo del Campo Base costa ${STEP_COST} ${IC_S}: tocca <b>Costruisci</b> qui sotto, o il cantiere con la freccia.`, L`Ci provo`), 250);
          }
        }
      }, 950);
    }, i * 260);
  }
}

// ---------------- premio del giorno ----------------
// calendario di 7 giorni: premio crescente, il 7° giorno è il grosso
const DAILY = [
  { coins: 50 }, { inv: 'hammer' }, { coins: 100 }, { inv: 'mH' }, { coins: 150 }, { inv: 'bomb' }, { coins: 300, inv: 'grappa', stk: 1 },
];
const P_NAME = { mH: L`Moto`, bomb: L`Tanica`, grappa: L`Grappa`, hammer: L`Martello` };
const P_IMG = { mH: 'p_moto', bomb: 'p_tanica', grappa: 'p_grappa', hammer: 'u_martello' };
function calTile(d, i, streak) {
  const st = i + 1 < streak ? ' got' : i + 1 === streak ? ' now' : '';
  const ico = d.inv ? `<span class="pi" style="background-image:${I(P_IMG[d.inv])}"></span>` : `<span class="cc">${IC_C}</span>`;
  return `<div class="cal${st}${i === 6 ? ' big' : ''}"><small>${L`Giorno`} ${i + 1}</small>${ico}<b>${d.coins ? '+' + d.coins : ''}${d.inv && d.coins ? ' ' : ''}${d.inv ? P_NAME[d.inv] : ''}${d.stk ? ' 📒' : ''}</b>${i + 1 < streak ? '<em>✓</em>' : ''}</div>`;
}
function dailyCalendar(streak, next) {
  const d = DAILY[streak - 1];
  showCard(L`<h2>Premio del giorno</h2><p>${streak > 1 ? L`Sei tornato <b>${streak} giorni di fila</b>!` : L`Torna ogni giorno: il premio cresce!`}${streak < 7 ? L` Al <b>7° giorno</b> c'è il premio grosso.` : ''}</p>
    <div class="calgrid">${DAILY.map((x, i) => calTile(x, i, streak)).join('')}</div>
    <div class="row"><button id="cCal" class="btn btn-play">${L`Ritira!`}</button></div>`, {
    cCal: async () => {
      if (d.coins) save.coins += d.coins;
      if (d.inv) save.inv[d.inv] = (save.inv[d.inv] || 0) + 1;
      persist(); $('#hCoins').textContent = save.coins; sfx.coin(); fireworks(streak === 7 ? 1600 : 700); hideCard();
      FX.banner([d.coins ? '+' + d.coins + ' ' + L`monete` : '', d.inv ? '+1 ' + P_NAME[d.inv] : ''].filter(Boolean).join(' · '), streak === 7 ? L`premio grosso!` : '', '#ffd34d');
      if (d.stk) { await new Promise((r) => setTimeout(r, 900)); await V.revealSticker(V.drawSticker()); }
      setTimeout(next, d.stk ? 200 : 900);
    },
  });
}
function dayKey(d = new Date()) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function checkDaily() {
  const today = dayKey();
  if (!save.welcomed || (save.daily && save.daily.last === today)) return false;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const streak = save.daily && save.daily.last === dayKey(y) ? (save.daily.streak % 7) + 1 : 1;
  save.daily = { last: today, streak }; persist();
  dailyCalendar(streak, () => V.spinWheel(streak, () => { if (typeof offerEvent === 'function') offerEvent(); }));
  return true;
}

// ---------------- sfida della settimana ----------------
const WEEKLY = [
  { t: L`Togli <b>400 birre</b>`, kind: 'tile', color: 0, n: 400, img: 't0_birra' },
  { t: L`Pulisci <b>120 pozze di fango</b>`, kind: 'mud', n: 120, img: 'o_fango1' },
  { t: L`Spacca <b>80 sassi o casse</b>`, kind: 'block', n: 80, img: 'o_sasso1' },
  { t: L`Crea <b>30 potenziamenti</b>`, kind: 'power', n: 30, img: 'p_tanica' },
  { t: L`Supera <b>8 livelli nuovi</b>`, kind: 'win', n: 8, img: 'u_stella' },
  { t: L`Togli <b>400 caschi</b>`, kind: 'tile', color: 1, n: 400, img: 't1_casco' },
  { t: L`Togli <b>400 gomme</b>`, kind: 'tile', color: 4, n: 400, img: 't4_gomma' },
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
  if (save.week.done >= w.n) { persist(); setTimeout(() => toast(L`Sfida della settimana completata!`, 1600), 400); }
  renderWeekBadge();
}
// ---------------- missioni del giorno: 3 piccoli obiettivi, si rinnovano a mezzanotte ----------------
const MISSIONS = [
  { id: 'birre', t: L`Togli <b>60 birre</b>`, kind: 'tile', color: 0, n: 60, img: 't0_birra', c: 40 },
  { id: 'caschi', t: L`Togli <b>60 caschi</b>`, kind: 'tile', color: 1, n: 60, img: 't1_casco', c: 40 },
  { id: 'gomme', t: L`Togli <b>60 gomme</b>`, kind: 'tile', color: 4, n: 60, img: 't4_gomma', c: 40 },
  { id: 'fango', t: L`Pulisci <b>15 pozze di fango</b>`, kind: 'mud', n: 15, img: 'o_fango1', c: 50 },
  { id: 'sassi', t: L`Spacca <b>12 sassi o casse</b>`, kind: 'block', n: 12, img: 'o_sasso1', c: 50 },
  { id: 'power', t: L`Crea <b>6 potenziamenti</b>`, kind: 'power', n: 6, img: 'p_moto', c: 60 },
  { id: 'win2', t: L`Vinci <b>2 livelli</b>`, kind: 'anywin', n: 2, img: 'u_stella', c: 60 },
  { id: 'stars', t: L`Prendi <b>5 stelle</b>`, kind: 'stars', n: 5, img: 'u_stella', c: 70 },
  { id: 'buddy', t: L`Vinci un livello <b>con un compagno di giro</b>`, kind: 'buddy', n: 1, img: 'c_angelo', c: 60 },
];
const MISS_BONUS = 100;   // premio extra quando le fai tutte e 3
function missions() {
  const d = dayKey();
  if (!save.miss || save.miss.d !== d) {
    // scelta fissa per il giorno (uguale per tutti), mai due dello stesso tipo
    let h = 0; for (const ch of d) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const pool = MISSIONS.filter((m) => m.kind !== 'buddy' || unlockedBuddies(save.level).length);
    const ids = [], kinds = new Set();
    for (let k = 0; ids.length < 3 && k < 60; k++) { h = (h * 1103515245 + 12345) >>> 0; const m = pool[h % pool.length]; if (!kinds.has(m.kind)) { kinds.add(m.kind); ids.push(m.id); } }
    save.miss = { d, ids, done: [0, 0, 0], got: [0, 0, 0], bonus: 0 }; persist();
  }
  return save.miss.ids.map((id, i) => ({ ...MISSIONS.find((m) => m.id === id), done: save.miss.done[i], got: save.miss.got[i], i }));
}
function missTrack(kind, color = -1, amount = 1) {
  if (G.exhibit) return;
  let changed = false;
  missions().forEach((m) => {
    if (m.got || m.done >= m.n || m.kind !== kind || (kind === 'tile' && m.color !== color)) return;
    save.miss.done[m.i] = Math.min(m.n, m.done + amount); changed = true;
    if (save.miss.done[m.i] >= m.n) setTimeout(() => toast(L`Missione completata!`, 1400), 300);
  });
  if (changed) renderWeekBadge();
}
const missReady = () => missions().filter((m) => !m.got && m.done >= m.n).length + (save.miss.got.every(Boolean) && !save.miss.bonus ? 1 : 0);
function missHTML() {
  const ms = missions();
  const rows = ms.map((m) => `<div class="wk ms${m.got ? ' got' : ''}"><span class="hi" style="background-image:${I(m.img)}"></span><div><p>${m.t}</p>
    <div class="wkbar"><i style="width:${Math.min(100, m.done / m.n * 100)}%"></i><span>${m.done} / ${m.n}</span></div></div>
    ${m.got ? '<b class="mok">✓</b>' : m.done >= m.n ? `<button class="btn btn-play mgo" data-m="${m.i}">+${m.c}</button>` : `<b class="mrw">+${m.c} ${IC_C}</b>`}</div>`).join('');
  const all = save.miss.got.every(Boolean);
  return L`<h3 class="msh">Missioni di oggi</h3>${rows}
    <p class="small">${all ? (save.miss.bonus ? L`Tutte fatte! Domani ne arrivano 3 nuove.` : '') : L`Falle tutte e 3: <b>+${MISS_BONUS} ${IC_C}</b> e un <b>Martello</b> in regalo`}</p>
    ${all && !save.miss.bonus ? L`<div class="row"><button id="cMBonus" class="btn btn-play">Ritira il bonus!</button></div>` : ''}`;
}
function claimMission(i) {
  const m = missions()[i]; if (!m || m.got || m.done < m.n) return;
  save.miss.got[i] = 1; save.coins += m.c; persist(); sfx.coin();
  $('#hCoins').textContent = save.coins; renderWeekBadge();
}
function renderWeekBadge() {
  const b = $('#weekPct'); if (!b) return;
  const w = weekly(), mr = missReady(), wr = !w.claimed && w.done >= w.n;
  b.textContent = mr || wr ? '!' : missions().filter((m) => m.got).length + '/3';
  b.parentElement.classList.toggle('ready', !!(mr || wr));
}
function openWeekly() {
  const w = weekly();
  const pct = Math.min(100, w.done / w.n * 100);
  const daysLeft = 7 - ((new Date().getDay() + 6) % 7);
  showCard(L`<h2>Missioni e sfide</h2>${missHTML()}
    <h3 class="msh">Sfida della settimana</h3>
    <div class="wk"><span class="hi" style="background-image:${I(w.img)}"></span><div><p>${w.t} entro domenica.</p>
    <div class="wkbar"><i style="width:${pct}%"></i><span>${w.done} / ${w.n}</span></div></div></div>
    <p class="small">Premio: <b>500 ${IC_C}</b> + <b>Grappa</b> + <b>Tanica</b> + <b>2 figurine</b> · ${w.claimed ? L`già ritirato, la prossima sfida arriva lunedì` : (daysLeft === 1 ? L`ultimo giorno` : L`mancano ${daysLeft} giorni`)}</p>
    <div class="row">${!w.claimed && w.done >= w.n ? L`<button id="cClaim" class="btn btn-play">Ritira il premio!</button>` : L`<button id="cClose" class="btn btn-play">Ok</button>`}</div>`, {
    cClose: hideCard,
    cMBonus: () => {
      save.miss.bonus = 1; save.coins += MISS_BONUS; save.inv.hammer = (save.inv.hammer || 0) + 1; persist();
      sfx.coin(); fireworks(1000); $('#hCoins').textContent = save.coins; renderWeekBadge();
      FX.banner(L`Missioni completate!`, L`+${MISS_BONUS} monete e un Martello`, '#7fe36f'); openWeekly();
    },
    cClaim: async () => {
      save.week.claimed = true; save.coins += 500; save.inv.grappa = (save.inv.grappa || 0) + 1; save.inv.bomb = (save.inv.bomb || 0) + 1;
      persist(); hideCard(); sfx.coin(); fireworks(1500); voice('gabbah', 2);
      $('#hCoins').textContent = save.coins; renderWeekBadge();
      FX.banner(L`Sfida vinta!`, L`+500 monete, Grappa, Tanica e 2 figurine`, '#ffd34d');
      await new Promise((r) => setTimeout(r, 1600));
      for (let k = 0; k < 2; k++) await V.revealSticker(V.drawSticker());
    },
  });
  document.querySelectorAll('.mgo[data-m]').forEach((b) => { b.onclick = () => { claimMission(+b.dataset.m); openWeekly(); }; });
}

// ---------------- classifica EDT online ----------------
const esc = (v) => String(v).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
// statistiche anonime: per ogni livello quante volte l'hai perso (una cifra base 36, max 35)
const statsG = () => { const l = save.lost || {}; let g = 'K1'; const top = Math.min(MAX_LEVEL, Math.max(save.level, ...Object.keys(l).map(Number), 1)); for (let n = 1; n <= top; n++) g += Math.min(35, l[n] || 0).toString(36); return g; };
async function openStats() {
  showCard(L`<h2>Statistiche livelli</h2><p>Caricamento...</p>`, {});
  try {
    const st = await RANK.levelStats();
    const rows = Object.entries(st.lv).map(([n, v]) => ({ n: +n, ...v })).filter((r) => r.lost).sort((a, b) => b.lost - a.lost).slice(0, 20);
    showCard(L`<h2>Dove si perde di più</h2><p>Dati anonimi di <b>${st.players}</b> giocatori in classifica.</p>
      <div class="stlist">${rows.length ? rows.map((r) => `<div class="strow"><b>${L`Livello`} ${r.n}${isHard(r.n) ? ' 💀' : ''}</b><span>${r.lost} ${L`sconfitte`}</span><small>${r.who} ${L`giocatori`}</small></div>`).join('') : L`<p>Ancora pochi dati: torna tra qualche giorno.</p>`}</div>
      <div class="row"><button id="cClose" class="btn btn-play">Ok</button></div>`, { cClose: hideCard });
  } catch { showCard(L`<h2>Statistiche livelli</h2><p>Connessione assente, riprova.</p><div class="row"><button id="cClose" class="btn btn-play">Ok</button></div>`, { cClose: hideCard }); }
}
const totalStars = () => Object.values(save.best).reduce((a, b) => a + b, 0);
function submitScore() {
  if (!RANK.getNick()) return;
  RANK.submit(totalStars(), save.level, V.riderTag(), statsG()).then((r) => { if (r && r.taken) toast(L`Nome già preso da un altro telefono`, 1600); }).catch(() => {});
}
function askNick() {
  showCard(L`<h2>Classifica EDT</h2><p>Scegli il nome con cui comparire in classifica (lo stesso di Giro Easy, se ci giochi).</p>
    <input id="nickIn" class="nickin" maxlength="16" placeholder="Il tuo nome" value="${RANK.getNick().replace(/"/g, '')}">
    <div class="row"><button id="cNo" class="btn btn-gray">Dopo</button><button id="cOk" class="btn btn-play">Entra</button></div>`, {
    cNo: hideCard,
    cOk: () => {
      const n = RANK.cleanNick($('#nickIn').value);
      if (n.length < 2) { toast(L`Nome troppo corto`, 900); return; }
      if (RANK.badNick(n)) { toast(L`Nome non ammesso: scegline un altro`, 1400); return; }
      RANK.setNick(n);
      V.openPilot(() => openRanking(true));
    },
  });
  setTimeout(() => $('#nickIn') && $('#nickIn').focus(), 50);
}
async function openRanking(justJoined = false) {
  if (G.building || pendingStar) return;
  if (!RANK.getNick()) { askNick(); return; }
  const me = RANK.getNick().toLowerCase();
  showCard(L`<h2>Classifica EDT</h2><p class="rkload">Chiedo i risultati al Campo Base…</p>
    <div class="row"><button id="cClose" class="btn btn-play">Chiudi</button></div>`, { cClose: hideCard });
  let list, taken = false;
  try {
    const r = totalStars() > 0 ? await RANK.submit(totalStars(), save.level, V.riderTag()) : null;
    if (r) { list = r.list; taken = r.taken; } else list = await RANK.top();
  } catch {
    const p = document.querySelector('.rkload'); if (p) p.textContent = L`Niente rete: la classifica si vede quando torni online.`;
    return;
  }
  if (!document.querySelector('.rkload')) return;   // chiusa nel frattempo
  const medal = ['🥇', '🥈', '🥉'];
  const crown = save.crown && save.crown.name ? String(save.crown.name).toLowerCase() : '';
  const rows = list.map((e, i) => `<div class="rk${String(e.name).toLowerCase() === me ? ' me' : ''}"><span class="pos">${medal[i] || i + 1}</span>${V.avatarHTML(String(e.name).toLowerCase() === me ? V.me() : V.parseRider(e.rider))}<b>${String(e.name).toLowerCase() === crown ? '👑 ' : ''}${esc(e.name)}</b><span class="st">${+e.stars || 0} ${IC_S}</span><small>liv ${+e.level || 0}</small></div>`).join('');
  showCard(L`<h2>Classifica EDT</h2>${RK_TABS(0)}
    ${taken ? L`<p class="red">Il nome <b>` + RANK.getNick() + L`</b> è già di un altro telefono: cambialo.</p>` : ''}
    <div class="rklist">${rows || L`<p>Ancora nessuno in classifica: fai tu il primo!</p>`}</div>
    <p class="small">Sei <b>${RANK.getNick()}</b> · ${totalStars()} ${IC_S} · <a href="#" id="cNick">cambia nome</a> · <a href="#" id="cPilot">il tuo pilota</a></p>
    <div class="row"><button id="cClose" class="btn btn-play">Chiudi</button></div>`, { cClose: hideCard });
  const cn = $('#cNick'); if (cn) cn.onclick = (e) => { e.preventDefault(); askNick(); };
  const cp = $('#cPilot'); if (cp) cp.onclick = (e) => { e.preventDefault(); V.openPilot(() => openRanking()); };
  bindRkTabs();
  if (justJoined && !taken) FX.banner(L`Sei in classifica!`, '', '#ffd34d');
}
const RK_TABS = (on) => `<div class="gtabs"><button class="gtab${on === 0 ? ' on' : ''}" data-rk="0">${L`Generale`}</button><button class="gtab${on === 1 ? ' on' : ''}" data-rk="1">${L`🏁 Weekend`}</button><button class="gtab${on === 2 ? ' on' : ''}" data-rk="2">${L`🤝 Squadra`}</button></div>`;
function bindRkTabs() { document.querySelectorAll('.gtab[data-rk]').forEach((b) => { b.onclick = () => { sfx.click(); if (b.dataset.rk === '1') openWeekend(); else if (b.dataset.rk === '2') openTeam(); else openRanking(); }; }); }
// ---------------- forziere di squadra: le vittorie di tutta l'EDT nella settimana riempiono un forziere comune ----------------
const teamWeek = () => Math.floor((Date.now() / 86400000 + 3) / 7);   // settimane che iniziano il lunedì
const TEAM_GOALS = [{ n: 30, coins: 150, txt: L`150 monete` }, { n: 80, coins: 200, pw: 'bomb', txt: L`200 monete + 1 Tanica` }, { n: 150, coins: 400, pw: 'grappa', txt: L`400 monete + 1 Grappa` }];
function teamTrack() {
  const w = teamWeek();
  if (!save.team || save.team.w !== w) save.team = { w, wins: 0, claimed: [] };
  save.team.wins++; persist();
  if (RANK.getNick()) RANK.teamSubmit(w, save.team.wins, V.riderTag()).catch(() => {});
}
async function openTeam() {
  if (!RANK.getNick()) { askNick(); return; }
  const w = teamWeek(), me = RANK.getNick().toLowerCase();
  if (!save.team || save.team.w !== w) { save.team = { w, wins: 0, claimed: [] }; persist(); }
  showCard(`<h2>${L`Forziere di squadra`}</h2>${RK_TABS(2)}<p class="rkload">${L`Conto le vittorie dell'EDT…`}</p><div class="row"><button id="cClose" class="btn btn-play">${L`Chiudi`}</button></div>`, { cClose: hideCard });
  bindRkTabs();
  let list;
  try { const r = save.team.wins ? await RANK.teamSubmit(w, save.team.wins, V.riderTag()) : null; list = r ? r.list : await RANK.teamTop(); }
  catch { const p = document.querySelector('.rkload'); if (p) p.textContent = L`Niente rete: riprova quando torni online.`; return; }
  if (!document.querySelector('.rkload')) return;
  const cur = list.filter((e) => e.w === w).sort((a, b) => b.wins - a.wins);
  const tot = Math.max(cur.reduce((a, e) => a + e.wins, 0), save.team.wins);
  const max = TEAM_GOALS[TEAM_GOALS.length - 1].n;
  const goals = TEAM_GOALS.map((g, i) => {
    const ok = tot >= g.n, got = save.team.claimed.includes(i);
    return `<div class="tgoal${ok ? ' ok' : ''}"><b>${g.n}</b><span>${g.txt}</span>${ok && !got ? `<button class="btn btn-play tclaim" data-i="${i}">${L`Ritira!`}</button>` : got ? '<em>✔</em>' : '<em>🔒</em>'}</div>`;
  }).join('');
  const rows = cur.slice(0, 12).map((e, i) => `<div class="rk${String(e.name).toLowerCase() === me ? ' me' : ''}"><span class="pos">${i + 1}</span>${V.avatarHTML(String(e.name).toLowerCase() === me ? V.me() : V.parseRider(e.rider))}<b>${esc(e.name)}</b><span class="st">${e.wins} 🏁</span></div>`).join('');
  showCard(`<h2>${L`Forziere di squadra`}</h2>${RK_TABS(2)}
    <p class="small">${L`Ogni livello vinto da chiunque dell'EDT riempie il forziere della settimana. Più vincete insieme, più premi per tutti!`}</p>
    <div class="tbar"><i style="width:${Math.min(100, tot / max * 100)}%"></i><span>${tot} / ${max} ${L`vittorie`}</span></div>
    <div class="tgoals">${goals}</div>
    <div class="rklist short">${rows || `<p>${L`Questa settimana ancora nessuno: vinci un livello e apri le danze!`}</p>`}</div>
    <div class="row"><button id="cGift" class="btn btn-share">${V.canGiftToday() ? L`🎁 Regala un aiuto a un amico` : L`🎁 Regalo di oggi già fatto`}</button></div>
    <div class="row"><button id="cClose" class="btn btn-play">${L`Chiudi`}</button></div>`, { cClose: hideCard, cGift: () => V.shareGift() });
  bindRkTabs();
  document.querySelectorAll('.tclaim').forEach((b) => { b.onclick = () => {
    const i = +b.dataset.i, g = TEAM_GOALS[i]; if (save.team.claimed.includes(i)) return;
    save.team.claimed.push(i); save.coins += g.coins; if (g.pw) save.inv[g.pw] = (save.inv[g.pw] || 0) + 1; persist();
    sfx.win(); fireworks(900); renderHome(); openTeam();
  }; });
}
async function openWeekend() {
  if (!RANK.getNick()) { askNick(); return; }
  const w = V.weekendInfo(), me = RANK.getNick().toLowerCase();
  const head = w.active ? L`<p>Da <b>venerdì a domenica</b>: ogni stella vale 1 punto, ogni livello nuovo 2 in più. Chi vince è <b>👑 Re del Giro Easy</b> per tutta la settimana dopo!</p>`
    : L`<p>La gara è chiusa: riapre <b>venerdì</b>. Il vincitore dell'ultimo weekend è <b>👑 Re del Giro Easy</b> fino alla prossima gara.</p>`;
  showCard(L`<h2>Gara del weekend</h2>${RK_TABS(1)}${head}<p class="rkload">Chiedo i risultati…</p><div class="row"><button id="cClose" class="btn btn-play">Chiudi</button></div>`, { cClose: hideCard });
  bindRkTabs();
  let list;
  try {
    const mine = save.we && save.we.id === w.id ? save.we.pts : 0;
    const r = w.active && mine ? await RANK.weSubmit(w.id, mine, V.riderTag()) : null;
    list = r ? r.list : await RANK.weTop();
  } catch { const p = document.querySelector('.rkload'); if (p) p.textContent = L`Niente rete: riprova quando torni online.`; return; }
  if (!document.querySelector('.rkload')) return;
  const last = list.filter((e) => e.id === w.last).sort((a, b) => b.pts - a.pts);
  if (last[0]) { save.crown = { id: w.last, name: last[0].name }; persist(); }
  const cur = w.active ? list.filter((e) => e.id === w.id).sort((a, b) => b.pts - a.pts) : last;
  const medal = ['🥇', '🥈', '🥉'];
  const rows = cur.slice(0, 20).map((e, i) => `<div class="rk${String(e.name).toLowerCase() === me ? ' me' : ''}"><span class="pos">${i === 0 && !w.active ? '👑' : medal[i] || i + 1}</span>${V.avatarHTML(String(e.name).toLowerCase() === me ? V.me() : V.parseRider(e.rider))}<b>${esc(e.name)}</b><span class="st">${e.pts} pt</span></div>`).join('');
  showCard(L`<h2>Gara del weekend</h2>${RK_TABS(1)}${head}
    ${save.crown && save.crown.name ? L`<p class="crownline">👑 Re del Giro Easy: <b>${esc(save.crown.name)}</b></p>` : ''}
    <div class="rklist">${rows || `<p>${w.active ? L`Ancora nessuno questo weekend: vinci un livello e sei primo!` : L`Lo scorso weekend nessuno ha giocato.`}</p>`}</div>
    ${w.active ? L`<p class="small">I tuoi punti: <b>${save.we && save.we.id === w.id ? save.we.pts : 0}</b></p>` : ''}
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
    cells.push(`<button class="lv${n === last && n === save.level ? ' cur' : ''}${boss ? ' boss' : ''}${isHard(n) ? ' hard' : ''}" data-n="${n}"><b>${n}</b><span>${[1, 2, 3].map((k) => `<i class="${k <= st ? 'on' : ''}"></i>`).join('')}</span></button>`);
  }
  const tot = Object.values(save.best).reduce((a, b) => a + b, 0);
  showCard(L`<h2>I tuoi livelli</h2><p>Stelle prese: <b>${tot}</b> su <b>${(last - (save.level > last ? 0 : 1)) * 3}</b>. Rigioca un livello per prendere le stelle che mancano.</p>
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
  if (gl.type === 'velox') return VELOX_URI;
  if (gl.type === 'gomme') return GOMME_URI;
  if (gl.type === 'drop') return DROP_URI;
  if (gl.type === 'mug') return MUG_URI[0];
  return FORESTALE_URI;
}
const goalLeft = (gl) => Math.max(0, gl.n - gl.done);

function renderGoals(bumpIdx = -1) {
  const box = $('#goals');
  if (!box.children.length || box.children.length !== G.goals.length) {
    box.innerHTML = G.goals.map((gl, i) => `<div class="goal" data-i="${i}" data-t="${gl.type}" style="background-image:${goalURI(gl)}"><b></b></div>`).join('');
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
    $('#bossTxt').textContent = L`Pazienza della Forestale: ${goalLeft(gl)}`;
    $('#bossCount').textContent = G.boss.count;
  }
}
function goalInfo(gl) {
  sfx.click();
  if (gl.type === 'tile') { tipBubble('t0_birra', L`Togli <b>${goalLeft(gl)}</b> di queste tessere facendo tris con loro.`, goalURI(gl)); return; }
  const zl = lvZone(G.level.n);
  const k = gl.type === 'chain' && zl ? ['chain', 'ice', 'tape', 'sand', 'garland', 'web'][zl] : gl.type === 'multa' && zl === 3 ? 'water' : gl.type === 'multa' && zl === 4 ? 'bill' : gl.type === 'multa' && zl === 5 ? 'potion' : zl === 5 && gl.type === 'rock' ? 'pumpkin' : zl === 5 && gl.type === 'crate' ? 'coffin' : zl === 3 && gl.type === 'rock' ? 'dune' : zl === 3 && gl.type === 'crate' ? 'spice' : zl === 3 && gl.type === 'mud' ? 'redmud' : zl === 4 && gl.type === 'rock' ? 'barrel' : zl === 4 && gl.type === 'crate' ? 'bottles' : zl === 4 && gl.type === 'mud' ? 'beer' : gl.type;
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
  if (G.time) {
    const s2 = Math.max(0, Math.ceil(G.timeLeft));
    $('#moves').textContent = `${Math.floor(s2 / 60)}:${String(s2 % 60).padStart(2, '0')}`;
    $('.moves small').textContent = L`TEMPO`;
    $('.moves').classList.add('timed');
    $('.moves').classList.toggle('low', s2 <= 10);
  } else {
    $('#moves').textContent = G.moves;
    $('.moves small').textContent = L`MOSSE`;
    $('.moves').classList.remove('timed');
    $('.moves').classList.toggle('low', G.moves <= 5);
  }
  $('#bHammer').classList.toggle('active', G.hammer);
  { const hb = $('#bHammer b'), fr = G.freeHammer > 0, own = save.inv.hammer || 0, key2 = fr + '|' + own; if (hb && hb.dataset.fr !== key2) { hb.dataset.fr = key2; hb.innerHTML = fr ? L`GRATIS` : own ? `x${own}` : '100 <i class="ic ic-coin"></i>'; } $('#bHammer').classList.toggle('free', fr || own > 0); }
  for (const [id, k, cost] of [['bMoto', 'mH', 120], ['bTanica', 'bomb', 180]]) { const e = document.querySelector('#' + id + ' b'); if (!e) continue; const own = save.inv[k] || 0, key2 = String(own); if (e.dataset.own !== key2) { e.dataset.own = key2; e.innerHTML = own ? `x${own}` : cost + ' <i class="ic ic-coin"></i>'; } document.getElementById(id).classList.toggle('free', own > 0); }
  $('#bShield').classList.toggle('on', G.shield);
}

function layout() {
  const appR = app.getBoundingClientRect();
  // telefoni lunghi: barra in alto e mensola più grandi, come nei match-3 veri
  $('#game').classList.toggle('roomy', appR.width < 600 && appR.height / appR.width > 1.8);
  const top = $('.gamebar').getBoundingClientRect().height + (G.boss ? 64 : 0);
  const bottom = $('.boosters').getBoundingClientRect().height || 80;
  const availW = appR.width - 18;
  const availH = appR.height - top - bottom - 20;
  G.S = Math.floor(Math.min(availW / COLS, availH / ROWS, 92));
  document.documentElement.style.setProperty('--cell', G.S + 'px');
  const wrap = $('#boardWrap');
  wrap.style.width = G.S * COLS + 'px';
  wrap.style.height = G.S * ROWS + 'px';
}

const pos = (r, c) => `translate(${c * G.S}px, ${r * G.S}px)`;

let EV_URI = null;
function artFor(t) {
  if (t.ev && EV_URI && !t.power && !t.rock && !t.drop) return `${EV_URI}, ${TILE_URI[t.color]}`;
  if (t.drop) return DROP_URI;
  if (t.rock) return t.kind === 'mug' ? MUG_URI[t.rock] : t.kind === 'velox' ? VELOX_URI : t.kind === 'gomme' ? GOMME_URI : t.kind === 'crate' ? CRATE_URI[t.rock] : ROCK_URI[t.rock];
  if (t.power) return POWER_URI[t.power];
  return TILE_URI[t.color];
}
function makeTileEl(t, r, c) {
  const el = document.createElement('div');
  el.className = 'tile' + (t.power ? ' power' : '') + (t.chain ? ' chained' : '') + (t.power === 'mH' ? ' dirH' : t.power === 'mV' ? ' dirV' : '') + (t.gold ? ' gold' : '') + (t.drop ? ' drop' : '') + (t.ev && EV_URI && !t.power && !t.rock && !t.drop ? ' ev' : '');
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
  el.classList.toggle('drop', !!t.drop);
  el.classList.toggle('ev', !!t.ev && !!EV_URI && !t.power && !t.rock && !t.drop);
}
// evento a data: un paio di tessere portano il simbolo (zucca, regalo, brezel)
function placeEventTokens() {
  const p = V.eventProgress(); EV_URI = p ? I(p.ev.img) : null;
  if (!EV_URI || !G.board || G.exhibit) return;
  const b = G.board;
  let have = b.grid.flat().filter((t) => t && t.ev).length;
  const list = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const t = b.grid[r][c]; if (t && !t.rock && !t.chain && !t.power && !t.drop && t.color >= 0 && !t.ev && !t.gold) list.push(t); }
  while (have < 2 && list.length) { const t = list.splice(Math.floor(Math.random() * list.length), 1)[0]; t.ev = true; refreshArt(t); have++; }
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
  { who: 'miti', txt: L`Arriva Miti col drone!`, pw: 'drone' },
  { who: 'renard', txt: L`Renard ti lancia una tanica!`, pw: 'bomb' },
  { who: 'costa', txt: L`Costa ti presta la moto!`, pw: 'mH' },
  { who: 'svetlana', txt: L`Svetlana porta la grappa!`, pw: 'grappa' },
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
  if (type === 'tile') { weekTrack('tile', color, amount); missTrack('tile', color, amount); }
  else if (type === 'mud') { weekTrack('mud'); missTrack('mud'); }
  else if (type === 'rock' || type === 'crate') { weekTrack('block'); missTrack('block'); }
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
const WIN_TITLES = [L`Giro easy!`, L`Che manetta!`, L`Grande EDT!`, L`Sentiero pulito!`, L`Da manuale!`];
const WIN_LINES = [
  ['gabbah', L`Fatto senza nemmeno sporcare il casco. Quasi.`],
  ['miti', L`Ho ripreso tutto con la GoPro. Questa la mettiamo nel video!`],
  ['mirco', L`Bravo. Io intanto mi sono riposato. Campa giù!`],
  ['costa', L`Per festeggiare offro io: grigliata di trote per tutti!`],
  ['purcello', L`Visto? Non hai avuto bisogno della mia spinta. Stavolta.`],
  ['svetlana', L`Che classe. Quasi quasi ti presto il trono.`],
];
const LOSE_LINES = [
  L`Sei rimasto piantato nel fango. Ti do una spinta io da dietro?`,
  L`Mosse finite e sentiero ancora chiuso. Ci penso io: aggancio e tiro!`,
  L`Ti sei insabbiato? Tranquillo, Purcello arriva sempre da dietro.`,
];
const allDone = () => G.goals.every((gl) => gl.done >= gl.n);

// ---------- risoluzione ----------
const CASCADE = [
  [L`Grande!`, '#ffd34d'], [L`Easy!`, '#7ee06a'], [L`Che manetta!`, '#ffb02e'], [L`Gas aperto!`, '#ff8a1c'],
  [L`Giro Easy!`, '#ff5a3c'], [L`Campa giù!`, '#ff4fa3'], [L`LEGGENDARIO!`, '#b07bff'],
];
const PEEK_LINES = [L`Easy!`, L`Che manetta!`, L`Tranquilli, è un giro easy!`, L`Gas! Gas! Gas!`, L`Questa la pago io!`];
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
const POWER_SHOUT = { mH: L`Moto!`, mV: L`Moto!`, bomb: L`Tanica!`, drone: L`Drone!`, grappa: L`San Braulio!` };
const PW_NAME = { mH: L`moto`, mV: L`moto`, bomb: L`taniche`, drone: L`droni` };
function comboDesc(k) {
  if (k === 'grappa+grappa') return L`Via tutta la griglia!`;
  if (k.includes('grappa')) { const o = k.split('+').find((x) => x !== 'grappa'); return L`Un colore intero diventa ${PW_NAME[o] || L`potenziamenti`}`; }
  if (k === 'bomb+bomb') return L`Esplosione gigante 7×7`;
  if (k === 'drone+drone') return L`Croce + 3 droni sugli obiettivi`;
  if (k === 'bomb+drone') return L`Il drone porta una tanica sull'obiettivo`;
  if (k.includes('drone')) return L`Il drone porta una moto sull'obiettivo`;
  if (k.includes('bomb')) return L`3 righe e 3 colonne`;
  return L`Una riga e una colonna intere`;
}
// prima dello scoppio: le caselle colpite si accendono a onda partendo dal centro
async function showZone(cells, r, c, ms = 520) {
  const fx = $('#fx'); const made = [];
  let far = 0;
  for (const k of cells) {
    const [rr, cc] = unkey(k); if (!inside(rr, cc)) continue;
    const d = Math.max(Math.abs(rr - r), Math.abs(cc - c)); far = Math.max(far, d);
    const z = document.createElement('div'); z.className = 'zonehit'; z.style.transform = pos(rr, cc); z.style.animationDelay = d * 45 + 'ms';
    fx.appendChild(z); made.push(z);
  }
  await sleep(ms + far * 45);
  return () => made.forEach((z) => { z.classList.add('go'); setTimeout(() => z.remove(), 260); });
}
// le tessere colpite scoppiano a onda dal centro, non tutte insieme
async function popWave(cells, r, c) {
  let far = 0;
  for (const k of cells) {
    const [rr, cc] = unkey(k); const t = G.board.grid[rr] && G.board.grid[rr][cc]; if (!t) continue;
    const e = G.els.get(t.id); if (!e) continue;
    const d = Math.max(Math.abs(rr - r), Math.abs(cc - c)); far = Math.max(far, d);
    e.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(2.2) drop-shadow(0 0 8px #fff)', offset: .5 }, { filter: 'brightness(1.6)' }], { duration: 220, delay: d * 40, fill: 'forwards' });
  }
  await sleep(120 + far * 40);
}
const COMBO_NAMES = {
  'mH+mH': L`Doppia sgasata!`, 'mH+mV': L`Doppia sgasata!`, 'mV+mV': L`Doppia sgasata!`,
  'bomb+mH': L`Moto in fiamme!`, 'bomb+mV': L`Moto in fiamme!`, 'bomb+bomb': L`Mega tanica!`,
  'drone+drone': L`Squadriglia droni!`, 'drone+mH': L`Drone con moto!`, 'drone+mV': L`Drone con moto!`, 'bomb+drone': L`Drone bombarolo!`,
  'grappa+grappa': L`Miracolo di San Braulio!`,
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
  const rolls = [];
  for (const k of rockHits) {
    const [r, c] = unkey(k);
    const t = b.grid[r][c];
    t.rock--;
    if (t.rock <= 0) {
      killTile(t, r, c);
      b.grid[r][c] = null;
      credit(t.kind === 'crate' ? 'crate' : t.kind === 'velox' ? 'velox' : t.kind === 'gomme' ? 'gomme' : t.kind === 'mug' ? 'mug' : 'rock', r, c);
      if (t.kind === 'mug') {   // boccale pieno: PROSIT! schiuma che pulisce tutto intorno
        const [mx, my] = cellCenter(r, c); FX.burst(mx, my, '#fff6d8', 22, 1.8); FX.burst(mx, my, '#ffb52e', 14, 1.4); FX.ring(mx, my, G.S * 2.4, '#fff3c4', 9); FX.shake(6, .25);
        floater(L`PROSIT!`, r, c); sfx.boom();
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if ((dr || dc) && inside(rr, cc) && b.grid[rr][cc] && !b.grid[rr][cc].rock) clear.add(key(rr, cc)); }
      }
      if (t.kind === 'velox') { const [vx, vy] = cellCenter(r, c); FX.burst(vx, vy, '#ffffff', 12, 1.4); FX.ring(vx, vy, G.S, '#bdf0ff', 6); }
    } else if (t.kind === 'mug') {
      refreshArt(t); credit('boss', r, c); beep(380 + (3 - t.rock) * 160, .12, 'triangle', .08, 200);
      const [hx, hy] = cellCenter(r, c); FX.burst(hx, hy, '#ffc94a', 8, 1.1);
      G.els.get(t.id)?.animate([{ transform: pos(r, c) + ' scale(1.18)' }, { transform: pos(r, c) }], { duration: 280, easing: 'ease-out' });
    } else if (t.kind === 'gomme') {
      sfx.crack(); credit('boss', r, c);
      const to = b.rollTarget(r, c);
      if (to && !clear.has(key(...to))) rolls.push([t, r, c, to]);
      const el = G.els.get(t.id); if (el) { el.classList.remove('hp3', 'hp2', 'hp1'); el.classList.add('hp' + t.rock); }
    } else {
      refreshArt(t); credit('boss', r, c); sfx.crack();
      const [hx, hy] = cellCenter(r, c);
      FX.burst(hx, hy, t.kind === 'crate' ? '#b07a40' : '#9a958f', 6);
      G.els.get(t.id)?.animate([{ transform: pos(r, c) + ' rotate(-8deg) scale(1.1)' }, { transform: pos(r, c) }], { duration: 260 });
    }
  }
  // le gomme colpite rotolano nella casella accanto
  for (const [t, r, c, [r2, c2]] of rolls) {
    if (b.grid[r][c] !== t) continue;
    const o = b.grid[r2][c2]; if (!o || o.rock) continue;
    b.grid[r2][c2] = t; b.grid[r][c] = o;
    const et = G.els.get(t.id), eo = G.els.get(o.id);
    if (et) et.animate([{ transform: pos(r, c) + ' rotate(0deg)' }, { transform: pos(r2, c2) + ` rotate(${c2 > c || r2 > r ? 360 : -360}deg)` }], { duration: 380, easing: 'ease-in-out' });
    if (et) et.style.transform = pos(r2, c2);
    if (eo) eo.style.transform = pos(r, c);
    clear.delete(key(r, c)); clear.delete(key(r2, c2));
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
    if (t.drop) continue;   // i fusti non si rompono: vanno portati in fondo
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
      if (t.ev && EV_URI) {
        const got = V.eventGain(1); if (got.length) { G.evRew = (G.evRew || []).concat(got); toast(L`Premio evento sbloccato!`, 1000); }
        const [ex, ey] = cellCenter(r, c); FX.burst(ex, ey, '#ff9a3c', 12, 1.3);
        const pi = V.eventProgress(); if (pi) floater(`+1 ${pi.ev.one}`, r, c);
      }
      if (t.gold) {
        credit('tile', r, c, t.color); save.coins += 10;
        const [gx, gy] = cellCenter(r, c); FX.burst(gx, gy, '#ffd34d', 18, 1.6); FX.ring(gx, gy, G.S * 1.2, '#fff3a8', 7);
        floater(L`Birra d'oro! +10`, r, c); beep(1320, .12, 'triangle', .1, 400);
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
    weekTrack('power'); missTrack('power');
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
      if (step >= 2) { if (G.buddyObj) { budCheerT = 0; buddyCheer('combo'); } else peekSay(PEEK_LINES[Math.min(step - 2, PEEK_LINES.length - 1)]); }
      if (step >= 2) FX.shake(2 + step * 1.5, .3);
      if (step >= 3) fastTip();
    }
    await applyGravity();
    while (await collectDrops()) await applyGravity();
    step++;
  }
}
// i fusti arrivati in fondo alla colonna vengono raccolti
async function collectDrops() {
  const b = G.board; if (!b.dropCount()) return 0;
  const got = b.collectDrops();
  for (const [r, c] of got) {
    const t = b.grid[r][c];
    const [x, y] = cellCenter(r, c);
    FX.burst(x, y, '#ffd34d', 16, 1.5); FX.ring(x, y, G.S * 1.2, '#fff3a8', 7); beep(880, .1, 'triangle', .1, 300);
    credit('drop', r, c);
    floater(L`Fusto!`, r, c);
    killTile(t, r, c, 0);
    b.grid[r][c] = null;
  }
  if (got.length) await sleep(260);
  return got.length;
}
// rimette fusti in cima finché ne servono
function topUpDrops() {
  const b = G.board, gl = G.goals.find((g) => g.type === 'drop'); if (!gl) return;
  let need = gl.n - gl.done - b.dropCount();
  if (need <= 0 || b.dropCount() >= 2) return;
  const cols = [...Array(COLS).keys()].sort(() => Math.random() - .5);
  for (const c of cols) {
    if (need <= 0 || b.dropCount() >= 2) break;
    let r = 0; while (r < ROWS && b.hole[r][c]) r++;
    const t = b.grid[r] && b.grid[r][c];
    if (!t || t.rock || t.chain || t.power || t.drop) continue;
    t.drop = true; t.color = -1; t.gold = false; refreshArt(t);
    G.els.get(t.id)?.animate([{ transform: pos(r, c) + ' scale(0)' }, { transform: pos(r, c) + ' scale(1.2)' }, { transform: pos(r, c) }], { duration: 400 });
    need--;
  }
}
// ogni 3 mosse gli autovelox fotografano e bloccano una tessera vicina (sabbia/catena)
async function veloxFlash() {
  const b = G.board; let any = false;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = b.grid[r][c];
    if (!t || t.kind !== 'velox') continue;
    const cand = b.veloxTargets(r, c); if (!cand.length) continue;
    const [r2, c2] = cand[Math.floor(Math.random() * cand.length)];
    const o = b.grid[r2][c2]; o.chain = true; refreshArt(o);
    const [x, y] = cellCenter(r, c); FX.glow(x, y, G.S * 1.6, 'rgba(255,255,255,.95)'); FX.ring(x, y, G.S * 1.4, '#ffffff', 8);
    const [x2, y2] = cellCenter(r2, c2); FX.streak(x, y, x2, y2, '#ffffff', 5);
    any = true;
  }
  if (any) { FX.flash(.25); beep(1800, .06, 'square', .06); setTimeout(() => beep(1800, .06, 'square', .06), 90); toast(L`FLASH! Autovelox`, 800); await sleep(500); }
}

// ---------- mosse ----------
function useMove() {
  if (!G.time) G.moves--;
  G.moveCount = (G.moveCount || 0) + 1;
  if (G.boss) G.boss.count--;
  renderMoves();
  renderGoals();
}

async function trySwap(a, bCell) {
  setFast(false);
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
function cutIn(who, title, desc = '') {
  const c = CHARS[who]; if (!c) return;
  document.querySelectorAll('.cutin').forEach((e) => e.remove());
  const d = document.createElement('div');
  d.className = 'cutin';
  d.innerHTML = `<div class="ci-band"></div><div class="ci-face" style="background-image:${I(c.img)}"></div><div class="ci-txt"><small>SUPER COMBO</small><b>${title}</b>${desc ? `<em>${desc}</em>` : ''}</div>`;
  app.appendChild(d);
  setTimeout(() => d.classList.add('out'), 1900);
  setTimeout(() => d.remove(), 2300);
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
  if (big) { const hl = document.createElement("div"); hl.className = "holylight"; app.appendChild(hl); setTimeout(() => hl.remove(), 1700); }
}

async function comboPowers(ta, tb, at, ka, kb) {
  const b = G.board;
  const [r, c] = at;
  const keyName = [ta.power, tb.power].sort().join('+');
  const nm = COMBO_NAMES[keyName] || (keyName.includes('grappa') ? L`Benedizione di San Braulio!` : L`Super combo!`);
  await fuseIntro(ta, tb, at, unkey(kb));
  const res = b.comboBlast(ta.power, tb.power, r, c, G.goals);
  const who = COMBO_WHO(keyName);
  cutIn(who, nm, comboDesc(keyName));
  voice(who, 2, 5000);
  const [cx, cy] = cellCenter(r, c);
  const droneCarry = res.cells.droneTarget !== undefined && keyName !== 'drone+drone';   // drone+moto/tanica: la zona si vede dopo il volo
  const endZone = await showZone(res.convert ? res.convert.cells : droneCarry ? [key(r, c)] : res.cells, r, c);
  FX.flash(.3); FX.shake(14, .55); FX.glow(cx, cy, G.S * 3.5); FX.ring(cx, cy, G.S * 4.5, '#ffffff', 16);
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
      beep(600 + Math.random() * 300, .05, 'triangle', .05, 300);
      await sleep(45);
    }
    endZone();
    await sleep(450);
    await resolve({ pending: [{ cells: new Set([ka, kb, ...res.convert.cells]), pre: [ka, kb] }] });
    return;
  }
  endZone();
  if (res.cells.droneTarget !== undefined) {
    await flyDrone(ka, res.cells.droneTarget);
    if (droneCarry) { const [tr, tc] = unkey(res.cells.droneTarget); const e2 = await showZone(res.cells, tr, tc, 300); e2(); }
  }
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
  await popWave(res.cells, r, c);
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
  if (G.freeHammer > 0) G.freeHammer--;
  else if (save.inv.hammer > 0) { save.inv.hammer--; persist(); }
  else { if (save.coins < 100) { renderMoves(); return; } save.coins -= 100; persist(); }
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
    toast(L`Miti para il colpo!`, 1100);
    renderMoves();
    await sleep(900);
    return;
  }
  voice('forestale', Math.random() < .5 ? 0 : 1, 8000);
  toast(L`MULTA!`, 1000); $('#toast').classList.add('red'); setTimeout(() => $('#toast').classList.remove('red'), 1000);
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
  if (G.time && G.timeLeft <= 0) { await loseLevel(); return; }
  if (G.moves <= 0) { await loseLevel(); return; }
  if (!G.board.hasMoves()) {
    toast(L`Si rimescola!`, 900);
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
  if ((G.moveCount || 0) % 3 === 0 && G.board.grid.flat().some((t) => t && t.kind === 'velox')) await veloxFlash();
  topUpDrops();
  if ((G.moveCount || 0) % 2 === 0) placeEventTokens();
  if ((G.moveCount || 0) % 4 === 0 && Math.random() < 0.6) makeGold();
  if (!G.boss && !G.helped && !G.exhibit && (G.moveCount || 0) >= 5 && G.moves > 3 && Math.random() < 0.22) await surpriseHelper();
  if (G.buddyObj && !G.nearSaid && !G.time && G.goals.reduce((a, g) => a + goalLeft(g), 0) <= 3) { G.nearSaid = true; budCheerT = 0; buddyCheer('near'); }
  if (G.buddyObj && G.buddyObj.perk.sprint && !G.sprinted && !G.time && G.moves <= 5 && G.moves > 0) { G.sprinted = true; placeStartPowers(['mH']); peekSay(L`Maggie: sprint finale, tieni una moto!`); }
  saveRun();
  if (G.explainQ.size) { const ks = [...G.explainQ]; G.explainQ.clear(); await explain(ks, ks.length > 1 ? L`Nuovi potenziamenti!` : L`Nuovo potenziamento!`); }
  G.busy = false;
  checkStuck();
  scheduleHint();
}

// orologio dei livelli a tempo: si ferma con le schede aperte, in pausa e quando l'app è in secondo piano
setInterval(() => {
  if (!G.time || G.over || !G.board || document.hidden) return;
  if (!$('#game').classList.contains('active') || !$('#overlay').classList.contains('hidden') || document.getElementById('story')) return;
  G.timeLeft = Math.max(0, G.timeLeft - 0.25);
  if (Math.abs(G.timeLeft - Math.round(G.timeLeft)) < 0.01) { renderMoves(); if (G.timeLeft <= 10 && G.timeLeft > 0) beep(1200, .03, 'square', .03); }
  if (G.timeLeft <= 0 && !G.busy) { G.busy = true; loseLevel(); }
}, 250);
// ---------- vittoria / sconfitta ----------
async function winLevel() {
  G.over = true;
  clearRun();
  clearHint();
  const lv = G.level, n = lv.n;
  const left = G.time ? Math.min(10, Math.ceil(G.timeLeft / 6)) : G.moves;
  const ratio = G.time ? G.timeLeft / G.time : left / lv.moves;
  const stars = ratio >= 0.35 ? 3 : ratio >= 0.15 ? 2 : 1;
  if (G.boss) {
    $('#bossFace').classList.add('beaten');
    await say(ZONES[lvZone(n)].boss, pick([L`Va bene, passate. Ma ho preso la targa!`, L`Per oggi niente multa. Ma vi tengo d'occhio, eh.`, L`Il fischietto è scarico... Passate, va.`]), L`Arrivederci!`, 2);
  } else { skipBtn(); FX.banner(L`Livello superato!`, '', '#ffd34d'); FX.flash(.3); await sleep(1100); }
  // bonus mosse avanzate: moto che partono a caso
  const b = G.board;
  const shots = Math.min(left, 6);
  if (shots > 0) {
    FX.banner(L`Mosse avanzate!`, L`Partono le moto`, '#7ee06a');
    fastTip();
    const cells = new Set();
    skipBtn();
    for (let i = 0; i < shots && !G.skipEnd; i++) {
      const r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
      const t = b.grid[r][c];
      if (!t || t.rock || t.power || t.chain) continue;
      t.power = Math.random() < 0.5 ? 'mH' : 'mV'; t.color = -1;
      refreshArt(t);
      cells.add(key(r, c));
      G.moves--; renderMoves();
      await sleep(120);
    }
    if (!G.skipEnd) await resolve({ pending: [{ cells }] });
  }
  skipBtn(false);
  if (G.exhibit) {   // sfida su un livello non ancora sbloccato
    save.coins += 20; persist(); sfx.win();
    showCard(L`<h2 class="wintitle">Sfida superata!</h2>
      <div class="stars3 fill">${[1, 2, 3].map((k) => `<i class="ic ic-star slot${k <= stars ? ' on' : ''}" data-k="${k}"></i>`).join('')}</div>
      ${V.challengeResult(n, stars, true, left)}<p>Questo livello lo sblocchi davvero più avanti: intanto <b>+20 ${IC_C}</b>.</p>
      <button id="cShare" class="btn btn-share">📣 Rilancia la sfida</button>
      <div class="row"><button id="cHome" class="btn btn-play">Campo base</button></div>`,
    { cShare: () => V.shareWin(n, stars, ZONES[lvZone(n)].bg, { seed: G.seed, left }), cHome: () => { hideCard(); goHome(); } });
    fireworks(1500);
    return;
  }
  const first = n >= save.level;
  if (first) weekTrack('win');   // contano solo i livelli nuovi, non quelli rigiocati
  missTrack('anywin'); missTrack('stars', -1, stars); if (G.buddyObj) missTrack('buddy');
  teamTrack();
  const prev = save.best[n] || 0;
  const gain = Math.max(0, stars - prev);
  save.best[n] = Math.max(prev, stars);
  if (save.fail && save.fail.n === n) save.fail = null;
  const coins = Math.round((first ? 30 + left * 6 : 10 + left * 2) * (1 + ((G.buddyObj && G.buddyObj.perk.coins) || 0) / 100) * (lv.hard ? 2 : 1));
  save.stars += gain;
  pendingStar += gain;
  if (first) save.streak = Math.min(3, (save.streak || 0) + 1);
  save.coins += coins;
  save.level = Math.max(save.level, n + 1);
  persist();
  submitScore();
  // gara del weekend: stelle prese + 2 per ogni livello nuovo
  { const pts = V.weekendPoints(stars + (first ? 2 : 0)); const w = V.weekendInfo(); if (pts && RANK.getNick()) RANK.weSubmit(w.id, pts, V.riderTag()).catch(() => {}); }
  // figurina: sempre al primo passaggio, a volte rigiocando
  const sticker = first || Math.random() < 0.4 ? V.drawSticker() : null;
  const chest = V.chestTick(true);
  const chRes = V.challengeResult(n, stars, true, left);
  sfx.win();
  const nb = nextBuilding();
  const [who, line] = pick(WIN_LINES);
  setTimeout(() => voice(who, 2), 900);
  const gainTxt = gain ? `<b>+${gain} ${gain > 1 ? L`stelle` : L`stella`}</b>` : (first ? '' : L`Nessuna stella nuova`);
  showCard(L`<h2 class="wintitle">${pick(WIN_TITLES)}</h2>
    <div class="stars3 fill">${[1, 2, 3].map((k) => `<i class="ic ic-star slot" data-k="${k}"></i>`).join('')}</div>
    <p class="winsub">${stars === 3 ? L`Perfetto! Tre stelle piene.` : L`Con meno mosse usate prendi ${stars === 1 ? L`fino a 3` : L`la terza`} ${IC_S}`}</p>
    <p>${gainTxt}${gainTxt ? ' · ' : ''}<b>+${coins} ${IC_C}</b>${nb && gain ? L`<br>Con ${STEP_COST} ${IC_S} costruisci un pezzo di <b>${nb.name}</b>.` : ''}</p>
    ${chRes}
    <div class="cheer">${speakerHTML(who, line)}</div>
    ${sticker ? L`<p class="stkhint">📒 Hai trovato una figurina!</p>` : ''}
    <div class="row sharerow"><button id="cShare" class="btn btn-share">📣 Condividi e sfida</button><button id="cVid" class="btn btn-share vid">🎬 Video TikTok</button></div>
    <div class="row">${stars < 3 ? L`<button id="cAgain" class="btn btn-gray">Rigioca</button>` : ''}<button id="cHome" class="btn btn-play">Campo base</button></div>`,
    { cShare: () => V.shareWin(n, stars, ZONES[lvZone(n)].bg, { seed: G.seed, left }), cVid: () => V.shareVideo(n, stars, ZONES[lvZone(n)].bg),
      cHome: async () => { hideCard(); await afterWin(); explain(['coins'], L`Hai guadagnato monete!`).then(goHome); },
      cAgain: async () => { hideCard(); await afterWin(); goHome(); const again = () => (pendingStar || G.building ? setTimeout(again, 200) : openLevel(n)); setTimeout(again, 500); } });
  async function afterWin() { await announceBuddies(); if (sticker) await V.revealSticker(sticker); if (chest) await V.openChest(); if (G.evRew && G.evRew.length) { const l = G.evRew; G.evRew = []; await V.eventRewardsPopup(l); } }
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
  if (G.buddyObj && G.buddyObj.perk.save && !G.buddySaved && !G.exhibit) {
    G.buddySaved = true;
    if (G.time) G.timeLeft += 20; else G.moves += G.buddyObj.perk.save;
    G.over = false; G.busy = false;
    budVoice('giacu', 0);
    FX.banner(L`Ci pensa Giacu!`, G.time ? L`+20 secondi` : L`+${G.buddyObj.perk.save} mosse gratis`, '#ff4fa3');
    renderMoves(); saveRun(); scheduleHint();
    return;
  }
  G.over = true;
  clearRun();
  V.chestTick(false);
  if (!G.exhibit && !G.duel && G.level && G.level.n <= MAX_LEVEL) { save.lost = save.lost || {}; save.lost[G.level.n] = (save.lost[G.level.n] || 0) + 1; persist(); }
  const leftN = G.goals.reduce((a, g) => a + goalLeft(g), 0), totN = G.goals.reduce((a, g) => a + g.n, 0);
  if (leftN <= Math.max(3, totN * 0.08)) {   // perso per un soffio
    FX.shake(10, .4); FX.flash(.3);
    const q = document.createElement('div'); q.className = 'quasi'; q.innerHTML = L`<b>QUASI!</b><small>ti mancava${leftN === 1 ? '' : L`no`} solo ${leftN}</small>`;
    app.appendChild(q); setTimeout(() => q.remove(), 1900);
    voice('purcello', 1, 3000);
    await sleep(1700);
  }
  sfx.lose();
  const ownMoves = !G.time && save.inv.moves > 0;
  const canBuy = ownMoves || save.coins >= 200;
  const left = G.goals.filter((g) => g.done < g.n).map((g) => `${goalLeft(g)}`).join(', ');
  showCard(L`${speakerHTML('purcello', L`${pick(LOSE_LINES)}<br>Ti mancavano <b>${left}</b>. Con <b>200 ${IC_C}</b> hai <b>${G.time ? '20 secondi' : L`5 mosse`}</b> in più.`)}
    <div class="row">
      <button id="cQuit" class="btn btn-gray">Mollo</button>
      <button id="cMore" class="btn btn-play" ${canBuy ? '' : 'disabled style="filter:grayscale(1)"'}>${G.time ? L`+20 secondi` : L`+5 mosse`}${ownMoves ? ` <small>(x${save.inv.moves})</small>` : ''}</button>
    </div>`, {
    cQuit: () => { hideCard(); if (!G.exhibit) { const f = save.fail && save.fail.n === G.level.n ? save.fail.c : 0; save.fail = { n: G.level.n, c: f + 1 }; } if (G.buddyObj && G.buddyObj.perk.streak && save.streak) toast(L`Sergio ti salva la serie di vittorie!`, 1400); else save.streak = 0; persist(); clearRun(); retryOrHome(); },
    cMore: () => {
      if (!canBuy) return;
      if (ownMoves) save.inv.moves--; else save.coins -= 200;
      persist();
      hideCard();
      if (G.time) G.timeLeft += 20; else G.moves += 5;
      G.over = false; G.busy = false;
      saveRun();
      renderMoves();
      FX.banner(L`Spinta di Purcello!`, G.time ? L`+20 secondi` : L`+5 mosse`, '#ff8a1c');
      scheduleHint();
    },
  });
}
function retryOrHome() {
  showCard(L`<h2 class="red">Insabbiato!</h2><p>Questo sentiero è tosto. Si riparte?</p>
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
  mug: ['claudio', L`I boccali si riempiono con <b>3 tris accanto</b>. Quando sono pieni fanno PROSIT e puliscono tutto intorno!`],
  garland: ['gabbah', L`I festoni bloccano le tessere: mettile in un tris per liberarle.`],
  web: ['svetlana', L`Le ragnatele bloccano le tessere: fai un tris con quelle tessere per liberarle.`],
  potion: ['forestale6', L`Se in un turno non togli nessuna pozione, se ne versa un'altra. Muahahah!`],
  pumpkin: ['costa', L`Le zucche si rompono facendo tris <b>accanto</b>. Quelle scure vanno colpite due volte.`],
  dune: ['miti', L`I blocchi di sabbia si sgretolano facendo tris <b>accanto</b>. Quelli interi vanno colpiti due volte.`],
  spice: ['costa', L`Le ceste di spezie si aprono con i tris <b>accanto</b> o con un potenziamento.`],
  redmud: ['mirco', L`Il fango rosso del deserto si pulisce facendo tris <b>sopra</b>. Quello scuro va fatto due volte.`],
  barrel: ['albertone', L`Le botti si aprono facendo tris <b>accanto</b>. Quelle intere vanno colpite due volte.`],
  bottles: ['claudio', L`Le casse di bottiglie si rompono con i tris <b>accanto</b> o con un potenziamento.`],
  beer: ['mirco', L`La birra rovesciata si asciuga facendo tris <b>sopra</b>. Quella con più schiuma va fatta due volte.`],
  coffin: ['luigi', L`Le bare si aprono con i tris <b>accanto</b> o con un potenziamento.`],
  bill: ['forestale5', L`Ogni turno che non paghi un conto, se ne aggiunge un altro. Pagate, pagate!`],
  tile: ['gabbah', L`Cerca le tessere dell'obiettivo in alto: fai tris con quelle, il resto viene da sé.`],
  mud: ['mirco', L`Il fango si pulisce solo facendo tris <b>sopra</b> le pozze. Quelle col 2 vanno fatte due volte.`],
  rock: ['purcello', L`I sassi si spaccano facendo un tris <b>accanto</b>. Moto e taniche li prendono anche da lontano.`],
  crate: ['gabbah', L`Le casse si aprono con un tris lì vicino. Una tanica ne apre tante in un colpo.`],
  chain: ['renard', L`I pezzi incatenati non si spostano: mettili in un tris con le tessere vicine e la catena salta.`],
  multa: ['forestale', L`Se in un turno non togli nemmeno una multa, se ne aggiunge un'altra. Toglile in fretta!`],
  boss: ['miti', L`Ogni tessera che rompi scarica la pazienza della Forestale. Combo e power-up la svuotano prima!`],
  power: ['miti', L`Hai un power-up sulla griglia: toccalo o scambialo con un altro per una super combo.`],
  hammer: ['renard', L`Ti manca poco? Il mio <b>martello</b> qui sotto spacca la tessera che vuoi.`],
  velox: ['forestale4', L`Gli autovelox si rompono con <b>2 tris accanto</b>. Ogni 3 mosse fanno FLASH e insabbiano una tessera!`],
  gomme: ['purcello', L`Le gomme vanno colpite <b>3 volte</b>, e ogni colpo le fa rotolare. Inseguile!`],
  drop: ['miti', L`Togli le tessere <b>sotto</b> i fusti: devono arrivare fino in fondo alla griglia.`],
  time: ['gabbah', L`Qui conta l'orologio, non le mosse: veloce ma senza panico, è un giro easy!`],
};
function coach(key, force = false) {
  if (!force && G.coached.has(key)) return;
  G.coached.add(key);
  if (!COACH[key]) return;
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
    if (G.busy || G.over) { if (G.board && $('#overlay').classList.contains('hidden')) setFast(true); return; }
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
    tip.innerHTML = L`Tocca di nuovo: via tutte le <span class="tipico" style="background-image:${TILE_URI[col]}"></span><br>oppure scambiala col colore da togliere`;
  } else tip.textContent = L`Tocca di nuovo per usarla, o scambiala`;
  app.appendChild(tip);
  sfx.click();
}

// =================== GUIDA E SPIEGAZIONI ===================
// ogni cosa del gioco ha una scheda: si vede la prima volta che la incontri e sempre nella Guida (?)
const HELP = {
  mug: { img: 'o_boccale2', t: L`Boccale da riempire`, d: L`Fai <b>3 tris accanto</b> al boccale per riempirlo. Quando è pieno: <b>PROSIT!</b> La schiuma pulisce tutte le caselle intorno.` },
  garland: { img: 'o_ghirlanda', t: L`Festone bavarese`, d: L`All'Oktoberfest i festoni bianchi e blu legano le tessere: non si spostano finché non le metti in un tris o le colpisci con un potenziamento.` },
  web: { img: 'o_ragnatela', t: L`Ragnatela`, d: L`Nel bosco di Halloween le ragnatele legano le tessere: non si spostano finché non le metti in un tris o le colpisci con un potenziamento.` },
  potion: { img: 'o_pozione', t: L`Pozione rovesciata`, d: L`Copre la casella e si toglie con un tris sopra. Se in un turno <b>non ne togli nessuna</b>, la Forestale vampira ne rovescia un'altra.` },
  pumpkin: { img: 'o_zucca', t: L`Zucca`, d: L`Blocca la casella. Si rompe facendo un tris <b>accanto</b> o con un potenziamento. Le zucche scure vanno colpite due volte.` },
  dune: { img: 'o_duna2', t: L`Blocco di sabbia`, d: L`Blocca la casella. Si sgretola facendo un tris <b>accanto</b> o con un potenziamento. Quelli interi vanno colpiti due volte.` },
  spice: { img: 'o_spezie2', t: L`Cesta di spezie`, d: L`Blocca la casella come una cassa. Si apre con i tris <b>accanto</b> o con un potenziamento.` },
  redmud: { img: 'o_fango_m1', t: L`Fango rosso`, d: L`Sta <b>sotto</b> le tessere. Si pulisce facendo un tris sopra la pozza. Quello scuro va pulito due volte.` },
  barrel: { img: 'o_barile', t: L`Botte di birra`, d: L`Blocca la casella. Si apre facendo un tris <b>accanto</b> o con un potenziamento. Le botti intere vanno colpite due volte.` },
  bottles: { img: 'o_bottiglie', t: L`Cassa di bottiglie`, d: L`Blocca la casella come una cassa. Si rompe con i tris <b>accanto</b> o con un potenziamento.` },
  beer: { img: 'o_birra2', t: L`Birra rovesciata`, d: L`Sta <b>sotto</b> le tessere. Si asciuga facendo un tris sopra la pozza. Quella con più schiuma va asciugata due volte.` },
  coffin: { img: 'o_bara', t: L`Bara`, d: L`Blocca la casella come una cassa. Si apre con i tris <b>accanto</b> o con un potenziamento.` },
  bill: { img: 'o_conto', t: L`Conto da pagare`, d: L`Copre la casella e si paga con un tris sopra. Se in un turno <b>non ne paghi nessuno</b>, ne arriva un altro.` },
  // come si gioca
  swap: { img: 't0_birra', t: L`Fai tris`, d: L`Trascina una tessera sulla vicina (o toccale una dopo l'altra) per scambiarle. Se ne metti <b>3 o più uguali in fila</b> spariscono e quelle sopra cadono.` },
  goals: { img: 't1_casco', t: L`Obiettivi e mosse`, d: L`In alto vedi cosa devi togliere e quante <b>mosse</b> hai. Ogni scambio è una mossa. Finisci gli obiettivi prima che finiscano le mosse.` },
  stars: { img: 'u_stella', t: L`Stelle`, d: L`Vinci = da <b>1 a 3 stelle</b>. Più mosse ti avanzano, più stelle prendi (2 stelle se avanzi il 15%, 3 se avanzi il 35%). Puoi rigiocare i livelli per migliorare.` },
  // potenziamenti
  mH: { img: 'p_moto', t: L`Moto`, how: L`4 tessere in fila`, d: L`Parte a manetta e si porta via <b>tutta la riga</b> (o tutta la colonna, se la moto è in piedi). Scambiala con una tessera vicina o <b>toccala due volte</b>.` },
  bomb: { img: 'p_tanica', t: L`Tanica`, how: L`tessere a L o a T`, d: L`Esplode e pulisce <b>tutto intorno a sé, fino a 2 caselle</b> di distanza: perfetta per sassi, casse e fango. Scambiala o toccala due volte.` },
  drone: { img: 'p_drone', t: L`Drone`, how: L`4 tessere a quadrato`, d: L`Pulisce una croce dove si trova e poi <b>vola da solo</b> su una tessera che ti serve per l'obiettivo. Scambialo o toccalo due volte.` },
  grappa: { img: 'p_grappa', t: L`Grappa di San Braulio`, how: L`5 tessere in fila`, d: L`Toglie <b>tutte le tessere di un colore</b>: scambiala con la tessera del colore che vuoi far sparire.` },
  combo: { img: 'p_grappa', t: L`Super combo`, how: 'scambia due potenziamenti tra loro', d: L`Due potenziamenti vicini, scambiati, fanno un colpo molto più forte: moto+moto = croce, tanica+moto = tre righe e tre colonne, tanica+tanica = esplosione enorme, drone+drone = tre droni, grappa+qualcosa = trasforma un colore intero in quel potenziamento, grappa+grappa = <b>pulisce tutta la griglia</b>.` },
  // ostacoli
  mud: { img: 'o_fango1', t: L`Fango`, d: L`Sta <b>sotto</b> le tessere. Si pulisce facendo un tris sopra la pozza. Il fango scuro va pulito due volte.` },
  rock: { img: 'o_sasso1', t: L`Sasso`, d: L`Non si sposta e blocca la caduta. Si spacca con un tris <b>accanto</b>, o colpendolo con moto e taniche. Quelli grossi vanno colpiti due volte.` },
  crate: { img: 'o_cassa1', t: L`Cassa`, d: L`Blocca la casella e non cade. Un tris <b>accanto</b> la rompe, moto e taniche la prendono anche da lontano. Le casse già crepate vanno colpite ancora una volta.` },
  chain: { img: 'o_catena', t: L`Catena`, d: L`La tessera incatenata non si può spostare. Mettila in un tris con le tessere vicine (o colpiscila con un potenziamento) e la catena salta.` },
  tape: { img: 'o_nastro', t: L`Nastro del cantiere`, d: L`Alla Cava la Forestale transenna le tessere col nastro: non si spostano finché non le metti in un tris o le colpisci con un potenziamento.` },
  sand: { img: 'o_sabbia', t: L`Sabbia`, d: L`In Marocco la sabbia copre le tessere: non si spostano finché non le metti in un tris o le colpisci con un potenziamento.` },
  water: { img: 'o_acqua', t: L`Acqua del ruscello`, d: L`Copre la casella e si toglie con un tris sopra. Attento: se in un turno <b>non ne togli nessuna</b>, il ruscello si allarga.` },
  velox: { img: 'o_autovelox', t: L`Autovelox della Forestale`, d: L`Ogni <b>3 mosse</b> fa FLASH e blocca una tessera vicina nella sabbia. Si rompe con <b>2 tris accanto</b> o con un potenziamento.` },
  gomme: { img: 'o_gomme', t: L`Pila di gomme`, d: L`Servono <b>3 colpi</b> per toglierla, e ogni volta che la colpisci <b>rotola</b> nella casella accanto!` },
  drop: { img: 'o_fusto', t: L`Fusti di birra`, d: L`Non si rompono: devi farli <b>scendere fino in fondo</b> alla griglia, togliendo le tessere sotto di loro. Arrivati giù sono tuoi.` },
  time: { img: 'u_nuvola', t: L`Livello a tempo`, d: L`Niente mosse contate: hai un <b>orologio</b>. Fai gli obiettivi prima che finisca il tempo. Più tempo avanza, più stelle prendi.` },
  ice: { img: 'o_ghiaccio', t: L`Ghiaccio`, d: L`Al Passo le tessere possono essere congelate: non si spostano finché non le metti in un tris o le colpisci con un potenziamento.` },
  multa: { img: 'o_multa', t: L`Multa`, d: L`Copre la casella. Si toglie con un tris accanto. Attento: se in un turno <b>non togli nessuna multa</b>, la Forestale ne aggiunge un'altra.` },
  boss: { img: 'forestale', t: L`La Forestale (boss)`, d: L`Ogni tessera che rompi le toglie <b>pazienza</b> (la barra rossa). Ogni poche mosse (il numero col sasso) ti tira dei <b>sassi</b> sulla griglia. Svuota la barra per vincere.` },
  // aiuti
  hammer: { img: 'u_martello', t: L`Martello di Renard`, d: L`Costa <b>100 monete</b>. Tocca il martello, poi tocca una casella: spacca quella tessera o ostacolo senza usare mosse.` },
  shield: { img: 'u_scudo', t: L`Scudo di Miti`, d: L`Solo coi boss. Costa <b>150 monete</b> e para il prossimo lancio di sassi della Forestale.` },
  hint: { img: 'u_stella', t: L`Aiuto`, d: L`Ti mostra una mossa buona (cerchio arancio e manina) e ti ricorda come togliere gli ostacoli. È gratis.` },
  pre: { img: 'p_tanica', t: L`Aiuti di partenza`, d: L`Prima del livello puoi mettere in griglia una Moto, una Tanica o una Grappa (con le monete o gratis se li hai vinti). Se vinci più livelli di fila li ricevi in <b>regalo</b>.` },
  coins: { img: 'u_moneta', t: L`Monete`, d: L`Le guadagni vincendo (50 più 10 per ogni mossa avanzata; meno se rigiochi un livello) e col premio del giorno. Servono per gli aiuti: <b>Martello</b> 100, <b>Scudo</b> 150, aiuti di partenza (Moto 60, Tanica 90, Grappa 140) e <b>+5 mosse</b> quando perdi (200). Per costruire servono le stelle, non le monete.` },
  // campo base
  build: { img: 'b_cantiere', t: L`Costruire`, d: L`Ogni edificio ha <b>3 pezzi</b> e ogni pezzo costa <b>2 stelle</b>. Tocca <b>Costruisci</b> o il cantiere con la freccia. Finita una zona, se ne apre una nuova.` },
  zones: { img: 'map2_bg', t: L`Zone`, d: L`Prima <b>La Valle</b>, poi <b>Il Passo</b> sulla neve (dal livello 31) e <b>La Cava</b> (dal livello 61), ognuna con edifici, ostacoli e boss nuovi. Col cartello in alto guardi le zone già sbloccate.` },
  daily: { img: 'u_moneta', t: L`Ruota del giorno`, d: L`Apri il gioco ogni giorno e gira la <b>Ruota del Giro Easy</b>: monete, Moto, Tanica, Grappa o una figurina. Al settimo giorno di fila la giri <b>due volte</b>.` },
  levels: { img: 'u_stella', t: L`Livelli`, d: L`Dal pulsante <b>Livelli</b> rigiochi quelli già fatti per prendere le stelle che mancano.` },
  album: { img: 'c_miti', t: L`Album figurine EDT`, d: L`Vincendo i livelli trovi figurine dei piloti, della Forestale e dei momenti EDT: comuni, rare e d'oro. Completa una pagina e vinci tante monete e una Grappa. I doppioni diventano monete.` },
  chest: { img: 'u_moneta', t: L`Forziere`, d: L`Vinci <b>3 livelli di fila</b> senza perdere e si apre il forziere EDT: monete, un potenziamento e una figurina.` },
  weekend: { img: 'u_stella', t: L`Gara del weekend`, d: L`Da venerdì a domenica, in Classifica → Gara del weekend: ogni stella vale 1 punto e ogni livello nuovo 2 in più. Chi vince è <b>👑 Re del Giro Easy</b> per tutta la settimana dopo.` },
  share: { img: 'c_gabbah', t: L`Condividi e sfida`, d: L`Dopo una vittoria tocca <b>Condividi e sfida un amico</b>: parte un'immagine per WhatsApp o le Storie con il link. Chi lo apre deve battere le tue stelle su quel livello.` },
  gold: { img: 't0_birra', t: L`Birra d'oro`, d: L`Ogni tanto una birra luccica d'oro: falla sparire in un tris e vale doppio per l'obiettivo, più 10 monete.` },
  helper: { img: 'c_svetlana', t: L`Aiuto a sorpresa`, d: L`Nei livelli senza la Forestale, a volte arriva un amico EDT e ti lascia un potenziamento sulla griglia.` },
  weekly: { img: 'u_stella', t: L`Sfida della settimana`, d: L`Dal pulsante <b>Sfida</b>: ogni settimana un obiettivo nuovo (togliere tante tessere di un tipo, pulire il fango, creare potenziamenti...). Lo completi giocando qualsiasi livello e vinci monete e potenziamenti. Si rinnova il lunedì.` },
  rank: { img: 'u_lucchetto', t: L`Classifica EDT`, d: L`Dal pulsante <b>Classifica</b> scegli il nome e sfidi gli altri dell'EDT: conta chi ha più stelle.` },
  rider: { img: 'fx_moto', t: L`Il giro di Miti`, d: L`Quando costruisci il primo edificio di una zona, Miti inizia a girare sul sentiero del Campo Base. Non serve a niente: fa scena.` },
};
const GUIDE = [
  [L`Come si gioca`, ['swap', 'goals', 'stars', 'hint']],
  [L`Potenziamenti`, ['mH', 'bomb', 'drone', 'grappa', 'combo']],
  [L`Ostacoli`, ['mud', 'rock', 'crate', 'chain', 'ice', 'tape', 'sand', 'garland', 'web', 'multa', 'water', 'bill', 'potion', 'pumpkin', 'coffin', 'dune', 'spice', 'redmud', 'barrel', 'bottles', 'beer', 'velox', 'gomme', 'drop', 'mug', 'time', 'boss']],
  [L`Aiuti`, ['coins', 'hammer', 'shield', 'pre']],
  [L`Campo Base`, ['build', 'zones', 'daily', 'weekly', 'levels', 'rank']],
  [L`Extra`, ['album', 'chest', 'weekend', 'share', 'gold', 'helper']],
];
if (!save.seen) { save.seen = {}; if (save.level > 3) { save.seen.swap = 1; save.seen.goals = 1; } }
const helpRow = (k) => { const h = HELP[k]; return `<div class="hrow"><span class="hi" style="background-image:${I(h.img)}"></span><div><b>${h.t}</b>${h.how ? L`<em>Si crea con: ${h.how}</em>` : ''}<p>${h.d}</p></div></div>`; };
function openGuide(tab = 0) {
  const tabs = GUIDE.map(([n], i) => `<button class="gtab${i === tab ? ' on' : ''}" data-t="${i}">${n}</button>`).join('');
  showCard(L`<h2>Guida</h2><div class="gtabs">${tabs}</div><div class="hlist">${GUIDE[tab][1].map(helpRow).join('')}</div>
    <div class="row"><button id="cStory" class="btn btn-gray">🎬 La storia</button><button id="cClose" class="btn btn-play">Chiudi</button></div>`, { cClose: hideCard, cStory: openStoryList });
  document.querySelectorAll('.gtab').forEach((b) => { b.onclick = () => { sfx.click(); openGuide(+b.dataset.t); }; });
}
// ---------- condivisione, sfide, album, ruota, forziere, gara del weekend ----------
V.initViral({ save, persist, showCard, hideCard, I, SRC, sfx, toast, FX, beep, getNick: RANK.getNick, coinsUI: () => { $('#hCoins').textContent = save.coins; }, startLevel: (...a) => startLevel(...a), fireworks, speakerHTML: (...a) => speakerHTML(...a), IC_S, MAX_LEVEL, getCode: RANK.getCode,
  replaceSave: (sv, nick, code) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(sv)); if (nick) RANK.setNick(nick); if (code) localStorage.setItem('edt-giro-easy-code', code); } catch { /* */ } location.reload(); } });
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
  if (id === 'finale') return save.level > 90 || !!save.story.marocco;
  if (id === 'fine') return save.level > 120 || !!save.story.oktober;
  if (id === 'oktofine') return save.level > 150 || !!save.story.hallo || !!save.story.oktofine;
  const z = ZONES.find((zz) => zz.id === id);
  return z ? save.level >= z.from : false;
}
function openStoryList() {
  const rows = STORY_ORDER.map((id) => {
    const ch = STORY[id], ok = storyUnlocked(id);
    return `<button class="strow${ok ? '' : ' locked'}" data-s="${id}" ${ok ? '' : 'disabled'}><span style="background-image:${ok ? I(ch.scenes[0].img) : I('u_lucchetto')}"></span><div><small>${ch.title}</small><b>${ok ? ch.name : '???'}</b></div></button>`;
  }).join('');
  showCard(L`<h2>La storia</h2><div class="stlist">${rows}</div><div class="row"><button id="cBack" class="btn btn-gray">Indietro</button></div>`, { cBack: () => { sfx.click(); openGuide(); } });
  document.querySelectorAll('.strow:not(.locked)').forEach((b) => { b.onclick = () => { sfx.click(); showStory(b.dataset.s); }; });
}
// scheda "Novità!" la prima volta che incontri una cosa (si ferma il gioco finché non tocchi Ok)
function explain(keys, title = L`Novità!`) {
  keys = keys.filter((k) => HELP[k] && !save.seen[k]);
  if (!keys.length) return Promise.resolve();
  keys.forEach((k) => { save.seen[k] = 1; }); persist();
  return new Promise((res) => showCard(`<h2>${title}</h2><div class="hlist">${keys.map(helpRow).join('')}</div>
    <div class="row"><button id="cOk" class="btn btn-play">${L`Ho capito!`}</button></div>`, { cOk: () => { hideCard(); res(); } }));
}
const KIND = (p) => (p === 'mV' ? 'mH' : p);
// tipi di ostacoli presenti in un livello
function levelThings(lv) {
  const LYS = (lv.layout || []).join('');
  const out = [];
  const hz = lvZone(lv.n) === 5, mz = lvZone(lv.n) === 3, oz = lvZone(lv.n) === 4;
  if (/[mM]/.test(LYS)) out.push(mz ? 'redmud' : oz ? 'beer' : 'mud');
  if (/[rR]/.test(LYS)) out.push(hz ? 'pumpkin' : mz ? 'dune' : oz ? 'barrel' : 'rock');
  if (/[cC]/.test(LYS)) out.push(hz ? 'coffin' : mz ? 'spice' : oz ? 'bottles' : 'crate');
  if (/k/.test(LYS)) out.push(['chain', 'ice', 'tape', 'sand', 'garland', 'web'][lvZone(lv.n)]);
  if (/b/.test(LYS)) out.push('mug');
  if (/v/.test(LYS)) out.push('velox');
  if (/g/.test(LYS)) out.push('gomme');
  if (lv.drops) out.push('drop');
  if (lv.time) out.push('time');
  if (/t/.test(LYS)) out.push(lvZone(lv.n) === 3 ? 'water' : lvZone(lv.n) === 4 ? 'bill' : lvZone(lv.n) === 5 ? 'potion' : 'multa');
  if (lv.boss) out.push('boss');
  return out;
}

// ---------- avvio livello ----------
// ---------- compagno di giro (piloti di Giro Easy) ----------
function curBuddy() {
  const ul = unlockedBuddies(save.level);
  if (!ul.length) return null;
  return ul.find((b) => b.id === save.buddy) || ul[ul.length - 1];
}
function buddyBoxHTML(b, line) {
  return `<div class="buddy"><span class="bav" style="background-image:${I('c_' + b.id)}"></span>
    <div class="btx"><small>${L`Compagno di giro`}</small><b>${b.name} <em>· ${b.nick}</em></b><p>${b.desc}</p>${line ? `<q>${line}</q>` : ''}</div>
    <button id="cBuddy" class="bchg">${L`Cambia`}</button></div>`;
}
function openBuddyPicker(back) {
  const cur = curBuddy();
  const cells = BUDDIES.map((b) => {
    const ok = save.level > b.at;
    return `<button class="bpick${ok ? '' : ' lock'}${cur && cur.id === b.id ? ' on' : ''}" data-id="${b.id}" ${ok ? '' : 'disabled'}>
      <span class="bav" style="background-image:${I('c_' + b.id)}"></span><b>${ok ? b.name : '?'}</b><small>${ok ? b.nick : L`dopo il livello ${b.at}`}</small></button>`;
  }).join('');
  showCard(`<h2>${L`Compagno di giro`}</h2><p class="small">${L`Scegli chi ti accompagna: ognuno ha il suo aiuto. Se ne sblocca uno nuovo ogni 3 livelli.`}</p>
    <div class="bgrid">${cells}</div><p class="bdesc" id="bDesc">${cur ? `<b>${cur.name}</b>: ${cur.desc}` : ''}</p>
    <div class="row"><button id="cBOk" class="btn btn-play">${L`Fatto`}</button></div>`, { cBOk: () => { hideCard(); back && back(); } });
  document.querySelectorAll('.bpick:not(.lock)').forEach((el) => {
    el.onclick = () => {
      sfx.click(); save.buddy = el.dataset.id; persist();
      document.querySelectorAll('.bpick').forEach((x) => x.classList.toggle('on', x === el));
      const b = BUDDY[el.dataset.id]; $('#bDesc').innerHTML = `<b>${b.name}</b>: ${b.desc}`;
    };
  });
}
// annuncia i compagni appena sbloccati (dopo una vittoria, al ritorno al campo base)
async function announceBuddies() {
  save.buddySeen = save.buddySeen || [];
  const fresh = unlockedBuddies(save.level).filter((b) => !save.buddySeen.includes(b.id));
  if (fresh.length > 1) {   // chi aveva già tanti livelli: un'unica scheda con tutti
    fresh.forEach((b) => save.buddySeen.push(b.id)); save.buddy = fresh[fresh.length - 1].id; persist();
    await new Promise((res) => showCard(`<h2>${L`Arrivano i piloti di Giro Easy!`}</h2>
      <div class="bgrid mini">${fresh.map((b) => `<span class="bav" style="background-image:${I('c_' + b.id)}"></span>`).join('')}</div>
      <p>${L`Da ora ogni livello lo fai con un <b>compagno di giro</b>: ognuno ha il suo aiuto. Ne hai già <b>${fresh.length}</b>, gli altri si sbloccano andando avanti.`}</p>
      <div class="row"><button id="cBGo" class="btn btn-play">${L`Vediamoli!`}</button></div>`, { cBGo: () => { hideCard(); res(); } }));
    fireworks(900);
    return;
  }
  for (const b of fresh) {
    save.buddySeen.push(b.id); save.buddy = b.id; persist();
    sfx.win && sfx.win();
    await new Promise((res) => showCard(`<h2>${L`Nuovo compagno di giro!`}</h2>
      <div class="bnew"><span class="bav big" style="background-image:${I('c_' + b.id)}"></span></div>
      <h3 class="bname">${b.name} <em>· ${b.nick}</em></h3><p>${b.desc}</p><p class="small"><q>${b.lines[0]}</q></p>
      <div class="row"><button id="cBGo" class="btn btn-play">${L`Si parte!`}</button></div>`, { cBGo: () => { hideCard(); res(); } }));
    fireworks(900);
  }
}
// il compagno entra in scena: vola al centro con nome e aiuto, poi torna in basso a sinistra
function buddyEntrance(b) {
  if (G.over || !$('#game').classList.contains('active')) return;
  const d = document.createElement('div'); d.className = 'budfly';
  d.innerHTML = `<span class="bav" style="background-image:${I('c_' + b.id)}"></span><div class="budtag"><b>${b.name}</b><small>${b.nick}</small></div>`;
  app.appendChild(d);
  beep(520, .08, 'triangle', .08, 200); setTimeout(() => beep(780, .1, 'triangle', .08, 200), 120);
  setTimeout(() => { d.classList.add('back'); }, 1350);
  setTimeout(() => { d.remove(); budLine(b); const pk = $('#peek'); if (pk) { pk.classList.add('hop'); setTimeout(() => pk.classList.remove('hop'), 600); } }, 1900);
}
// il compagno esulta durante la partita (combo, potenziamenti, quasi fatta)
const BUD_CHEER = [L`Che manetta!`, L`Così si fa!`, L`Easy!`, L`Vai che ci siamo!`, L`Campa giù!`, L`Spettacolo!`];
let budCheerT = 0;
function buddyCheer(kind) {
  if (!G.buddyObj || performance.now() - budCheerT < 4000) return;
  budCheerT = performance.now();
  if (kind !== 'near' && Math.random() < .35) { budLine(G.buddyObj); return; }
  peekSay(kind === 'near' ? L`Manca pochissimo!` : pick(BUD_CHEER));
}
// applica l'aiuto del compagno all'inizio del livello
function applyBuddy(extras) {
  const b = G.buddyObj; if (!b) return extras;
  const p = b.perk;
  if (p.moves) { if (G.time) { G.time += p.moves * 4; G.timeLeft += p.moves * 4; } else G.moves += p.moves; }
  if (p.hammer) G.freeHammer = p.hammer;
  if (p.clear) setTimeout(() => buddyClear(p.clear, p.n), 1700);
  setTimeout(() => buddyEntrance(b), 350);
  return p.power ? [...extras, ...p.power] : extras;
}
async function buddyClear(type, n) {
  if (G.over || !G.board) return;
  if (G.busy) { setTimeout(() => buddyClear(type, n), 400); return; }
  const b = G.board, cand = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = b.grid[r][c];
    if (type === 'mud' && b.mud[r][c] > 0) cand.push([r, c]);
    else if (type === 'rock' && t && t.rock && !t.kind) cand.push([r, c]);
    else if (type === 'crate' && t && t.kind === 'crate') cand.push([r, c]);
    else if (type === 'chain' && t && t.chain) cand.push([r, c]);
  }
  if (!cand.length) return;
  const cells = new Set();
  for (let i = 0; i < n && cand.length; i++) { const [r, c] = cand.splice(Math.floor(Math.random() * cand.length), 1)[0]; cells.add(key(r, c)); const [x, y] = cellCenter(r, c); FX.ring(x, y, G.S * 1.2, '#fff6a0', 7); }
  G.busy = true; sfx.boom();
  await resolve({ pending: [{ cells }] });
  G.busy = false;
  if (allDone()) { await winLevel(); return; }
  saveRun(); scheduleHint();
}
// numeri casuali con seme: stessa griglia e stesse tessere in arrivo per i duelli tra amici
function seededRng(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const PRE = [
  { id: 'mH', name: L`Moto`, cost: 100, img: 'p_moto' },
  { id: 'bomb', name: L`Tanica`, cost: 150, img: 'p_tanica' },
  { id: 'grappa', name: L`Grappa`, cost: 220, img: 'p_grappa' },
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
    boss: G.boss ? G.boss.count : null, shield: G.shield, time: G.time ? G.timeLeft : null,
    grid: b.grid.map((row) => row.map((t) => (t ? [t.color, t.power || 0, t.rock || 0, t.chain ? 1 : 0, t.kind || 0, t.drop ? 1 : 0] : null))),
    mud: b.mud, ticket: b.ticket, buddy: G.buddyObj ? G.buddyObj.id : null, bsaved: G.buddySaved, sprint: G.sprinted, hused: G.buddyObj && G.buddyObj.perk.hammer && !G.freeHammer,
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
  showCard(L`<h2>Partita in corso</h2>${speakerHTML('gabbah', L`Eri a metà del <b>livello ${R.n}</b> con <b>${R.moves} mosse</b> rimaste. Riprendiamo da lì?`)}
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
  const dSeed = challenge && save.challenge && save.challenge.n === n && save.challenge.seed ? save.challenge.seed : 0;
  G.seed = dSeed || (1 + Math.floor(Math.random() * 2147483000));
  G.board = new Board(lv, seededRng(G.seed));
  G.moves = lv.moves;
  G.goals = lv.goals.map((g) => ({ ...g, done: 0 }));
  G.boss = lv.boss ? { ...lv.boss, count: lv.boss.every } : null;
  G.ticketCleared = false; G.explainQ = new Set(); G.coached = new Set(); G.lastProg = 0; G.idleMoves = 0;
  G.over = false; G.busy = false; G.hammer = false; G.shield = false; G.sel = null; G.droneFix = null; G.helped = false; G.moveCount = 0;
  G.time = lv.time || 0; G.timeLeft = resume && resume.time != null ? resume.time : G.time;
  G.buddyObj = resume ? (resume.buddy ? BUDDY[resume.buddy] : null) : challenge ? null : curBuddy(); G.freeHammer = 0; G.buddySaved = !!(resume && resume.bsaved); G.sprinted = !!(resume && resume.sprint); G.nearSaid = false;
  clearPreview(); clearHint();
  if (resume) {
    const b = G.board;
    b.grid = resume.grid.map((row) => row.map((v) => {
      if (!v) return null;
      const t = newTile(v[0], v[1] || null, v[2]);
      if (v[3]) t.chain = true;
      if (v[4]) t.kind = v[4];
      if (v[5]) t.drop = true;
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
  $('#game').classList.toggle('hardlv', !!lv.hard);
  $('#bossbar').classList.toggle('hidden', !G.boss);
  $('#bShield').style.display = G.boss ? '' : 'none';
  const zl = lvZone(n);
  setZoneArt(zl);
  $('#board').classList.toggle('fest', zl === 4);
  $('#board').classList.toggle('hallo', zl === 5);
  $('#game').classList.toggle('hallo', zl === 5);
  $('#game').classList.toggle('fest', zl === 4);
  $('#board').classList.toggle('desert', zl === 3);
  $('#game').classList.toggle('desert', zl === 3);
  $('#board').classList.toggle('ice', zl === 1);
  $('#board').classList.toggle('tape', zl === 2);
  $('#game').classList.toggle('winter', zl === 1);
  $('#game').classList.toggle('quarry', zl === 2);
  const bf = $('#bossFace');
  bf.classList.remove('beaten', 'angry', 'hit');
  if (G.boss) bf.style.backgroundImage = FORESTALE_URI;
  showScreen('game');
  AU.playMusic(lv.boss ? 'boss' : lvZone(n) === 4 ? 'okt' : lvZone(n) === 5 ? 'hall' : 'game');
  layout();
  { const pk = document.querySelector('#peek i'); if (pk) pk.style.backgroundImage = G.buddyObj ? I('c_' + G.buddyObj.id) : I(CHARS[V.me().who].img); $('#peek').classList.toggle('bud', !!G.buddyObj); }
  buildBoardDOM();
  if (!G.boss) setTimeout(makeGold, 900);
  setTimeout(placeEventTokens, 1000);
  renderGoals();
  renderMoves();
  scheduleHint();
  if (!resume) extras = applyBuddy(extras);
  else if (G.buddyObj && G.buddyObj.perk.hammer && !resume.hused) G.freeHammer = G.buddyObj.perk.hammer;
  renderMoves();
  if (extras.length) placeStartPowers(extras);
  setTimeout(() => { if (G.level === lv && !G.busy) saveRun(); }, 100);
  if (resume) { FX.banner(L`Si riparte!`, L`Livello ${n}`, '#ffd34d'); return; }
  setTimeout(async () => {
    if (G.level !== lv || G.over) return;
    const ks = ['swap', 'goals', ...extras.map(KIND)];
    if (ks.some((k) => !save.seen[k])) { G.busy = true; await explain(ks, n === 1 ? L`Come si gioca` : L`Novità!`); G.busy = false; }
  }, extras.length ? 1400 : 500);
}

function setZoneArt(zl) {
  FORESTALE_URI = I(ZONES[zl].boss);
  CHAIN_URI = I(['o_catena', 'o_ghiaccio', 'o_nastro', 'o_sabbia', 'o_ghirlanda', 'o_ragnatela'][zl]);
  MULTA_URI = I(zl === 3 ? 'o_acqua' : zl === 4 ? 'o_conto' : zl === 5 ? 'o_pozione' : 'o_multa');
  ROCK_URI = zl === 5 ? [null, I('o_zucca'), I('o_zucca2')] : zl === 4 ? [null, I('o_barile1'), I('o_barile')] : zl === 3 ? [null, I('o_duna1'), I('o_duna2')] : [null, I('o_sasso1'), I('o_sasso2')];
  CRATE_URI = zl === 5 ? [null, I('o_bara'), I('o_bara2')] : zl === 4 ? [null, I('o_bottiglie1'), I('o_bottiglie')] : zl === 3 ? [null, I('o_spezie1'), I('o_spezie2')] : [null, I('o_cassa1'), I('o_cassa2')];
  MUD_URI = zl === 3 ? [null, I('o_fango_m1'), I('o_fango_m2')] : zl === 4 ? [null, I('o_birra1'), I('o_birra2')] : [null, I('o_fango1'), I('o_fango2')];
}
async function openLevel(num) {
  const n = num || save.level;
  if (G.building || pendingStar) return;
  if (n > MAX_LEVEL) {
    await say('gabbah', L`Hai finito tutti i sentieri! Nuove zone (e nuove multe) arrivano coi prossimi aggiornamenti.`);
    return;
  }
  if (unlockedBuddies(save.level).some((b) => !(save.buddySeen || []).includes(b.id))) await announceBuddies();
  const lv = getLevel(n);
  setZoneArt(lvZone(n));
  const best = save.best[n] || 0;
  const goalsHTML = lv.goals.map((g) => `<div class="goal" style="background-image:${goalURI(g)}"><b>${g.n}</b></div>`).join('');
  const TIPS = [
    ['miti', L`Consiglio da Protettore: due power-up scambiati tra loro fanno una super combo.`],
    ['gabbah', L`Cinque in fila e arriva la Grappa di San Braulio: si porta via un colore intero.`],
    ['purcello', L`Quattro tessere a quadrato e parte il drone: va dritto dove serve.`],
    ['costa', L`Una L o una T fanno la tanica. Tenetela lontana dal mio pesce.`],
    ['mirco', L`Io faccio il tifo da qui. Seduto. Campa giù!`],
    ['renard', L`Se una tessera non si sposta, c'è il mio martello. Costa poco, giuro.`],
  ];
  const tip = lv.intro || (() => { const t = TIPS[lv.n % TIPS.length]; return { who: t[0], text: t[1] }; })();
  const bud = curBuddy();
  const hasNews = levelThings(lv).some((k) => !save.seen[k]);   // se c'è la scheda delle novità, la battuta del personaggio non serve
  const intro = bud ? (lv.intro && !hasNews ? speakerHTML(tip.who, tip.text) : '') + buddyBoxHTML(bud, '') : hasNews ? '' : speakerHTML(tip.who, tip.text);
  const news = levelThings(lv).filter((k) => !save.seen[k]);
  const newsHTML = news.length ? L`<div class="newsbox"><div class="prehead">Novità in questo livello</div><div class="hlist">${news.map(helpRow).join('')}</div></div>` : '';
  const gifts = streakGifts();
  const fails = save.fail && save.fail.n === n ? save.fail.c : 0;
  const help = fails >= 5 ? ['bomb', 'mH'] : fails >= 3 ? ['bomb'] : [];
  const helpHTML = help.length ? `<div class="failhelp">${speakerHTML('purcello', fails >= 5 ? L`Questo livello ti sta facendo dannare. Parti con una <b>Tanica</b> e una <b>Moto</b> gratis, offro io.` : L`Ci hai già provato ${fails} volte: ti regalo una <b>Tanica</b> in griglia per partire meglio.`)}</div>` : '';
  const chosen = new Set();
  const preHTML = PRE.map((p) => {
    const gift = gifts.includes(p.id);
    const own = save.inv[p.id] || 0;
    return `<button class="pre${gift ? ' gift' : ''}${own && !gift ? ' own' : ''}" data-id="${p.id}" ${gift ? 'disabled' : ''}>
      <span class="pi" style="background-image:${I(p.img)}"></span><small>${p.name}</small>
      <b>${gift ? L`Regalo` : own ? L`Ne hai ${own}` : p.cost + ' ' + IC_C}</b></button>`;
  }).join('');
  const streak = save.streak || 0;
  const bestHTML = n < save.level ? `<div class="bestrow">${[1, 2, 3].map((k) => `<i class="ic ic-star${k <= best ? '' : ' off'}"></i>`).join('')}<span>${best >= 3 ? L`già perfetto` : L`record: prova a fare meglio`}</span></div>` : '';
  showCard(L`<h2${lv.hard ? ' class="red"' : ''}>${lv.boss ? L`Arriva la Forestale!` : lv.hard ? L`Livello ${lv.n} 💀` : L`Livello ${lv.n}`}</h2>${lv.hard ? L`<p class="hardnote">Livello difficile: se lo vinci, <b>monete doppie</b>.</p>` : ''}${bestHTML}${intro}
    ${newsHTML + helpHTML}<div class="goalrow">${goalsHTML}</div><p>Hai <b>${lv.moves} mosse</b>${lv.boss ? L`. Svuota la sua pazienza prima che ti riempia di sassi!` : ''}</p>
    <div class="prebox"><div class="prehead">${streak ? L`🔥 Serie di vittorie: <b>${streak}</b>` : L`Parti con un aiuto?`}<span>${streak ? L`regali già in griglia` : L`vinci di fila per averli gratis`}</span></div>
    <div class="prerow">${preHTML}</div><div class="prehelp"><b>Moto</b> pulisce una riga · <b>Tanica</b> esplode intorno · <b>Grappa</b> via un colore</div></div>
    <div class="row"><button id="cBack" class="btn btn-gray">Indietro</button><button id="cPlay" class="btn btn-play">Gioca!</button></div>`,
  { cBack: hideCard, cBuddy: () => openBuddyPicker(() => openLevel(n)), cPlay: () => {
    let cost = 0;
    chosen.forEach((id) => { if (save.inv[id] > 0) save.inv[id]--; else cost += PRE.find((p) => p.id === id).cost; });
    save.coins -= cost; persist();
    news.forEach((k) => { save.seen[k] = 1; }); persist();
    hideCard(); startLevel(lv.n, [...gifts, ...help, ...chosen]);
  } });
  const total = () => [...chosen].reduce((sum, id) => sum + (save.inv[id] > 0 ? 0 : PRE.find((p) => p.id === id).cost), 0);
  document.querySelectorAll('.pre:not(.gift)').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      if (chosen.has(id)) chosen.delete(id);
      else if (save.inv[id] > 0 || total() + PRE.find((p) => p.id === id).cost <= save.coins) chosen.add(id);
      else { toast(L`Monete finite!`, 900); return; }
      btn.classList.toggle('on', chosen.has(id));
    };
  });
}

function goHome() {
  clearHint(); clearPreview();
  showScreen('home');
  AU.playMusic(homeTrack());
  renderHome();
  if (pendingStar) setTimeout(flyStarToCounter, 350);
  else setTimeout(shopTutorial, 900);
}
// primo acquisto guidato: quando hai monete e non hai mai aperto il Negozio, Gabbah te lo mostra e ti regala una Moto
function shopTutorial() {
  if (save.seen.shop || save.seen.shopTut || save.coins < 150 || save.level < 6) return;
  if (!$('#home').classList.contains('active') || !$('#overlay').classList.contains('hidden') || G.building || pendingStar) return;
  save.seen.shopTut = 1; persist();
  showCard(`${speakerHTML('gabbah', L`Hai già <b>${save.coins} monete</b>! Le monete servono: nel <b>Negozio</b> compri Moto, Taniche, Grappe e Martelli. Per il tuo primo acquisto ti regalo io una <b>Moto</b>!`)}
    <div class="row"><button id="cLater" class="btn">${L`Dopo`}</button><button id="cShop" class="btn btn-play">${L`Apri il Negozio`}</button></div>`, {
    cLater: hideCard,
    cShop: () => {
      save.inv.mH = (save.inv.mH || 0) + 1; save.seen.shop = 1; persist();
      const cp = $('#hCoins') && $('#hCoins').closest('.pill'); if (cp) cp.classList.remove('newshop');
      hideCard(); sfx.coin(); FX.banner(L`+1 Moto in regalo`, L`la trovi a inizio livello`, '#ffd34d');
      setTimeout(() => { openShop(0); const b = document.querySelector('.shit[data-pw="mH"]'); if (b) b.classList.add('tut'); }, 900);
    },
  });
}

// ---------- pulsanti ----------
$('#btnPlay').onclick = () => openLevel();
$('#btnBuild').onclick = () => tryBuild();
$('#btnLevels').onclick = () => { sfx.click(); openLevelList(); };
$('#btnRank').onclick = () => { sfx.click(); openRanking(); };
$('#hCoins').parentElement.onclick = () => { sfx.click(); showCard(L`<h2>Monete</h2><div class="hlist">${helpRow('coins')}</div><div class="row"><button id="cClose" class="btn btn-play">Ok</button></div>`, { cClose: hideCard }); };
$('#hStars').parentElement.onclick = () => { sfx.click(); showCard(L`<h2>Stelle</h2><div class="hlist">${helpRow('stars')}${helpRow('build')}</div><div class="row"><button id="cClose" class="btn btn-play">Ok</button></div>`, { cClose: hideCard }); };
$('#btnWeek').onclick = () => { sfx.click(); openWeekly(); };
$('#btnGuide').onclick = () => { sfx.click(); openGuide(); };
// pulsanti laterali richiudibili (sugli schermi piccoli coprono la mappa)
function sideUI() {
  const sb = $('#home .sidebtns'); if (!sb) return;
  sb.classList.toggle('shut', !!save.sideShut);
  const t = $('#btnSide'); t.querySelector('span').textContent = save.sideShut ? '»' : '«';
  t.classList.toggle('dot', !!save.sideShut && !!sb.querySelector('.sidebtn.ready:not([hidden])'));
}
$('#btnSide').onclick = () => { sfx.click(); save.sideShut = !save.sideShut; persist(); sideUI(); const m = $('#map'); if (m) fitTags(m); };
sideUI();
$('#btnEvent').onclick = () => { if (G.building || pendingStar) return; sfx.click(); V.openEvent(); };
$('#btnAlbum').onclick = () => { if (G.building || pendingStar) return; sfx.click(); V.openAlbum(); };
// ---------- impostazioni ----------
function togglesHTML() {
  const row = (id, label, on) => `<button class="tog${on ? ' on' : ''}" id="${id}"><span>${label}</span><i></i></button>`;
  return `<div class="toggles">${row('tMusic', L`Musica`, save.music)}${row('tSfx', L`Suoni`, save.sfx)}${row('tVib', L`Vibrazione`, save.vibra)}${row('tVoice', L`Voci`, save.voice)}</div>`;
}
function bindToggles() {
  const flip = (id, key, apply) => {
    const b = document.getElementById(id);
    if (!b) return;
    b.onclick = () => { save[key] = !save[key]; persist(); apply(save[key]); b.classList.toggle('on', save[key]); sfx.click(); if (key === 'vibra' && save.vibra) { try { navigator.vibrate && navigator.vibrate(40); } catch { /* */ } } };
  };
  flip('tMusic', 'music', (v) => { AU.setMusic(v); if (v) AU.playMusic($('#game').classList.contains('active') ? (G.boss ? 'boss' : G.level && lvZone(G.level.n) === 4 ? 'okt' : G.level && lvZone(G.level.n) === 5 ? 'hall' : 'game') : homeTrack()); });
  flip('tSfx', 'sfx', AU.setSfx);
  flip('tVib', 'vibra', FX.setVibra);
  flip('tVoice', 'voice', () => {});
}
function openSettings() {
  if (G.building || pendingStar) return;
  showCard(L`<h2>Impostazioni</h2>${togglesHTML()}
    <button id="cMove" class="btn btn-share">📲 Porta i progressi su un altro telefono/iPad</button>
    <div class="row"><button id="cReset" class="btn btn-red">Ricomincia da zero</button></div>
    <div class="row"><button id="cClose" class="btn btn-play">Fatto</button></div>`,
  { cClose: hideCard, cReset: confirmReset, cMove: () => V.shareProgress() });
  bindToggles();
  const mv = document.getElementById('cMove');
  if (mv) {
    const lr = document.createElement('div'); lr.className = 'langrow';
    lr.innerHTML = `<span>🌍</span><button data-l="it" class="${LANG === 'it' ? 'on' : ''}">🇮🇹 Italiano</button><button data-l="en" class="${LANG === 'en' ? 'on' : ''}">🇬🇧 English</button>`;
    lr.querySelectorAll('button').forEach((b) => { b.onclick = () => { sfx.click(); if (b.dataset.l !== LANG) setLang(b.dataset.l); }; });
    mv.parentNode.insertBefore(lr, mv);
  }
}
function confirmReset() {
  showCard(L`<h2 class="red">Ricominci da zero?</h2>
    <p>Perdi <b>stelle, monete, livelli</b> e tutto il <b>Campo Base</b>. Non si torna indietro.</p>
    <div class="row"><button id="cNo" class="btn btn-gray">No, tengo tutto</button><button id="cYes" class="btn btn-red">Sì, azzera</button></div>`,
  { cNo: openSettings, cYes: () => {
    const keep = { music: save.music, sfx: save.sfx, vibra: save.vibra, voice: save.voice };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...keep })); } catch { /* */ }
    location.reload();
  } });
}
$('#btnSettings').onclick = openSettings;
{ const cp = $('#hCoins') && $('#hCoins').closest('.pill'); if (cp) { cp.classList.add('shoppill'); cp.classList.toggle('newshop', !save.seen.shop); cp.onclick = () => { if (!save.seen.shop) { save.seen.shop = 1; persist(); cp.classList.remove('newshop'); } openShop(0); }; } }
$('#btnBack').onclick = () => {
  if (G.busy) return;
  showCard(L`<h2>Pausa</h2>${togglesHTML()}
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
  if (!G.hammer && save.coins < 100 && !(G.freeHammer > 0) && !(save.inv.hammer > 0)) { toast(L`Servono 100 monete`, 1000); return; }
  G.hammer = !G.hammer;
  if (G.hammer) toast(L`Tocca cosa spaccare`, 1000);
  renderMoves();
};
async function buyPower(pw, cost, name) {
  if (G.busy || G.over) return;
  if (save.inv[pw] > 0) { save.inv[pw]--; persist(); renderMoves(); }
  else { if (save.coins < cost) { toast(L`Servono ${cost} monete`, 1000); return; } save.coins -= cost; persist(); }
  sfx.click();
  placeStartPowers([pw]);
  peekSay(pw === 'bomb' ? L`Tanica piena, si parte!` : L`Ecco una moto: toccala!`);
  toast(L`${name} sulla griglia: toccala o scambiala`, 1400);
  setTimeout(() => saveRun(), 900);
}
$('#bMoto').onclick = () => buyPower('mH', 120, L`Moto`);
$('#bTanica').onclick = () => buyPower('bomb', 180, L`Tanica`);
$('#bShield').onclick = async () => {
  if (G.busy || G.over || G.shield) return;
  if (!save.seen.shield) { await explain(['shield']); return; }
  if (save.coins < 150) { toast(L`Servono 150 monete`, 900); return; }
  save.coins -= 150; persist();
  G.shield = true;
  toast(L`Miti ti copre!`, 1000);
  renderMoves();
};
window.addEventListener('resize', () => {
  if ($('#game').classList.contains('active') && G.board) { layout(); repositionAll(); }
});

FX.initFX($('#fxc'), app);
// precarica tutte le immagini prima di mostrare il gioco
const ASSETS = ['map_bg', 't0_birra', 't1_casco', 't2_maschera', 't3_chiave', 't4_gomma', 't5_stivale', 'p_moto', 'p_moto_v', 'p_tanica', 'p_grappa', 'p_drone',
  'o_sasso1', 'o_sasso2', 'o_fango1', 'o_fango2', 'o_cassa1', 'o_cassa2', 'o_catena', 'o_multa', 'forestale', 'b_cantiere', 'map2_bg', 'o_ghiaccio', 'map3_bg', 'o_nastro', 'fx_moto', 'fx_moto_v', 'fx_drone', 'r_up', 'r_down', 'map4_bg', 'o_sabbia', 'o_acqua', 'o_autovelox', 'o_gomme', 'o_fusto', 'e_zucca', 'e_regalo', 'e_brezel', 'map5_bg', 'o_ghirlanda', 'o_conto', 'o_barile', 'o_bottiglie', 'o_boccale0', 'o_boccale1', 'o_boccale2', 'o_boccale3', 'map6_bg', 'o_ragnatela', 'o_pozione', 'o_zucca', 'o_zucca2', 'o_bara', 'o_bara2', 'o_duna1', 'o_duna2', 'o_spezie1', 'o_spezie2', 'o_fango_m1', 'o_fango_m2', 'o_birra1', 'o_birra2', 'o_barile1', 'o_bottiglie1',
  ...BUILDINGS.map((b) => 'b_' + b.id), ...Object.values(CHARS).map((c) => c.img), 'u_stella', 'u_moneta', 'u_martello', 'u_scudo', 'u_lucchetto', 'u_nuvola'];
// caricamento leggero: prima solo quello che serve subito (tessere, ostacoli e la zona attuale), il resto dopo con calma
const loadImg = (n) => new Promise((res) => { const im = new Image(); im.onload = im.onerror = () => res(); im.src = SRC(n); if (im.decode) im.decode().then(res, res); });
const CORE = ASSETS.filter((n) => !/^(b_|map|c_|forestale)/.test(n)).concat((() => { const z = ZONES[Math.min(ZONES.length - 1, lvZone(Math.min(save.level, MAX_LEVEL)))]; return [z.bg, z.boss, 'c_gabbah', ...z.buildings.map((b) => 'b_' + b.id)]; })());
const preload = Promise.all(CORE.map(loadImg));
preload.then(() => setTimeout(() => { const rest = ASSETS.filter((n) => !CORE.includes(n)); (function next() { const n = rest.shift(); if (n) loadImg(n).then(() => setTimeout(next, 30)); })(); }, 1500));
document.addEventListener('visibilitychange', () => AU.pause(document.hidden));
initInput();
renderHome();
AU.playMusic(homeTrack());
preload.then(() => { const l = $('#loading'); if (l) { l.classList.add('done'); setTimeout(() => l.remove(), 400); } });
const firstStory = !save.story.intro;
const offerEvent = () => { const ep = V.eventProgress(); if (!ep || save.evSeen === ep.st.id) return false; save.evSeen = ep.st.id; persist(); V.openEvent(); return true; };
const startup = async () => { if (/[?&]stats\b/.test(location.search)) { openStats(); return; } if (await V.readProgressLink()) return; if (V.readGift()) return; if (currentZone().id === 'oktober' && !save.story.oktober && save.story.marocco) { if (!save.story.fine) await showStory('fine'); await showStory('oktober'); viewZone = null; renderHome(); }
  if (currentZone().id === 'hallo' && !save.story.hallo && save.story.oktober) { if (!save.story.oktofine) await showStory('oktofine'); await showStory('hallo'); viewZone = null; renderHome(); } if (!offerResume() && !V.offerChallenge() && !checkDaily()) offerEvent(); };
if (save.welcomed && firstStory) preload.then(() => setTimeout(async () => { await showStory('intro'); startup(); }, 500));
else if (save.welcomed) setTimeout(startup, 600);
if (!save.welcomed) {
  save.welcomed = true; persist();
  // primo minuto: storia (saltabile) e poi dritti nel livello 1, oppure nella sfida dell'amico
  if (/[?&]salva=/.test(location.search)) preload.then(() => V.readProgressLink());
  else preload.then(() => setTimeout(async () => { await showStory('intro'); if (!V.offerChallenge()) { startLevel(1); toast(L`Scambia due tessere vicine!`, 1600); } }, 500));
}

// per i test automatici
window.__EDT = { V, loseLevel, surpriseHelper, makeGold, showStory, G, save, startLevel, trySwap, goHome, openLevel, winLevel, checkDaily, openLevelList, renderHome };
