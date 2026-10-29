// EDT Kingdom — effetti speciali (particelle su canvas, scossoni, banner combo)
const parts = [];
let cv, ctx, app, raf = 0, dpr = 1;

export const TILE_COLORS = ['#ffc531', '#ff3b2f', '#3d8bff', '#4fd25f', '#b25cff', '#ff8a1c'];

export function initFX(canvas, root) {
  cv = canvas; app = root; ctx = cv.getContext('2d');
  const fit = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = app.getBoundingClientRect();
    cv.width = r.width * dpr; cv.height = r.height * dpr;
    cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
  };
  fit();
  window.addEventListener('resize', fit);
}

const rnd = (a, b) => a + Math.random() * (b - a);
const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

let lastT = 0;
function loop(now = performance.now()) {
  const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60; lastT = now;
  const f = dt * 60;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.t += dt;
    if (p.t >= p.life) { parts.splice(i, 1); continue; }
    const k = p.t / p.life;
    const dr = Math.pow(p.drag, f);
    p.vx *= dr; p.vy = p.vy * dr + p.g * f;
    p.x += p.vx * f; p.y += p.vy * f; p.rot += p.vr * f;
    ctx.save();
    ctx.globalAlpha = p.fade ? 1 - k * k : 1;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    if (p.kind === 'chunk') {
      // scheggia lucida che gira su se stessa (si schiaccia e si riapre come se ruotasse in 3D)
      const s = p.size * (1 - k * 0.45) * 3.2;
      const flip = Math.cos(p.t * p.spin);
      ctx.scale(Math.max(0.18, Math.abs(flip)), 1);
      ctx.drawImage(gemSprite(p.color, p.shape), -s / 2, -s / 2, s, s);
    } else if (p.kind === 'spark') {
      // scintilla luminosa a 4 punte con alone
      const s = p.size * (1 - k) * (0.8 + 0.4 * Math.sin(p.t * 30));
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(SPARK(), -s * 3, -s * 3, s * 6, s * 6);
    } else if (p.kind === 'flame') {
      // fiammata: nucleo bianco, poi colore, sfumata e additiva (niente dischi piatti)
      const r = p.size * (0.5 + k * 1.1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (1 - k) * 0.9;
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      gr.addColorStop(0, 'rgba(255,255,235,1)'); gr.addColorStop(0.35, p.color); gr.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    } else if (p.kind === 'puff') {
      const s = p.size * (0.6 + k * 1.4);
      ctx.globalAlpha = (1 - k) * 0.7;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, 7); ctx.fill();
    } else if (p.kind === 'ring') {
      const r = p.size * (0.15 + Math.sqrt(k) * 0.85);
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = p.color; ctx.lineWidth = p.w * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
    } else if (p.kind === 'glow') {
      const r = p.size * (0.5 + k);
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      gr.addColorStop(0, 'rgba(255,255,240,' + (1 - k) + ')');
      gr.addColorStop(.4, p.color);
      gr.addColorStop(1, 'rgba(255,200,60,0)');
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    } else if (p.kind === 'streak') {
      ctx.rotate(-p.rot);
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = p.color; ctx.lineCap = 'round';
      ctx.lineWidth = p.w * (1 - k * .6); ctx.globalAlpha = (1 - k) * .75;
      ctx.shadowColor = '#fff6a0'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(p.dx, p.dy); ctx.stroke();
    } else if (p.kind === 'bubble') {
      const grow = Math.min(1, k * 1.6), pop = k > .75;
      const rr = p.size * (0.4 + grow * .6) * (pop ? 1 + (k - .75) * 4 : 1);
      ctx.globalAlpha = pop ? 1 - (k - .75) * 4 : .95;
      ctx.fillStyle = 'rgba(120,75,35,.85)'; ctx.strokeStyle = 'rgba(230,190,140,.95)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, 7); if (!pop) ctx.fill(); ctx.stroke();
      if (!pop) { ctx.fillStyle = 'rgba(255,240,210,.9)'; ctx.beginPath(); ctx.arc(-rr * .35, -rr * .35, rr * .28, 0, 7); ctx.fill(); }
    } else if (p.kind === 'rays') {
      ctx.globalAlpha = (1 - k) * .8;
      ctx.fillStyle = p.color;
      const n = 12, R = p.size * (0.6 + k * .8);
      for (let j = 0; j < n; j++) {
        const a = (j / n) * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a - .09) * R, Math.sin(a - .09) * R);
        ctx.lineTo(Math.cos(a + .09) * R, Math.sin(a + .09) * R);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }
  raf = parts.length ? requestAnimationFrame(loop) : 0;
  if (!raf) lastT = 0;
}
function add(p) {
  parts.push({ t: 0, vx: 0, vy: 0, g: 0, drag: 1, rot: 0, vr: 0, fade: true, ...p });
  if (parts.length > 700) parts.splice(0, parts.length - 700);
  if (!raf) raf = requestAnimationFrame(loop);
}

// sprite delle schegge: una per colore e forma, disegnate una volta sola
const gemCache = new Map();
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
function gemSprite(color, shape) {
  const key = color + shape;
  let c = gemCache.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 48;
  const g = c.getContext('2d');
  const hex = /^#[0-9a-f]{6}$/i.test(color) ? color : '#ffd34d';
  g.translate(24, 24);
  g.beginPath();
  if (shape === 0) { g.moveTo(0, -18); g.quadraticCurveTo(15, -4, 13, 6); g.quadraticCurveTo(8, 17, 0, 17); g.quadraticCurveTo(-11, 15, -14, 3); g.quadraticCurveTo(-13, -7, 0, -18); }   // goccia
  else if (shape === 1) { g.moveTo(0, -17); g.lineTo(15, -3); g.lineTo(8, 15); g.lineTo(-9, 15); g.lineTo(-15, -3); g.closePath(); }   // gemma
  else { g.ellipse(0, 0, 15, 11, 0.4, 0, 7); }   // sassolino tondo
  g.closePath();
  const gr = g.createRadialGradient(-5, -7, 1, 0, 0, 20);
  gr.addColorStop(0, shade(hex, 0.7)); gr.addColorStop(0.45, hex); gr.addColorStop(1, shade(hex, -0.45));
  g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 3; g.shadowOffsetY = 2;
  g.fillStyle = gr; g.fill();
  g.shadowColor = 'transparent';
  g.lineWidth = 1.6; g.strokeStyle = shade(hex, -0.55); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.85)';
  g.beginPath(); g.ellipse(-5, -8, 5, 2.6, -0.6, 0, 7); g.fill();
  gemCache.set(key, c);
  return c;
}
let sparkC = null;
function SPARK() {
  if (sparkC) return sparkC;
  sparkC = document.createElement('canvas'); sparkC.width = sparkC.height = 64;
  const g = sparkC.getContext('2d'); g.translate(32, 32);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 30);
  gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.25, 'rgba(255,230,140,.55)'); gr.addColorStop(1, 'rgba(255,200,80,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.fill();
  g.fillStyle = '#fffdf0';
  g.beginPath();
  for (let j = 0; j < 4; j++) { const a = j * Math.PI / 2; g.lineTo(Math.cos(a) * 28, Math.sin(a) * 28); g.lineTo(Math.cos(a + Math.PI / 4) * 4, Math.sin(a + Math.PI / 4) * 4); }
  g.closePath(); g.fill();
  return sparkC;
}

// schegge lucide colorate che schizzano via da una tessera distrutta
export function burst(x, y, color, n = 8, power = 1) {
  if (reduce()) n = Math.ceil(n / 3);
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(2, 5.5) * power;
    add({ kind: 'chunk', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, g: .28, drag: .985, size: rnd(3, 6.5), color, shape: i % 3, spin: rnd(8, 16), rot: rnd(0, 6), vr: rnd(-.25, .25), life: rnd(.55, .85) });
  }
  for (let i = 0; i < Math.ceil(n / 2); i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(1, 3.5) * power;
    add({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: .93, size: rnd(2.5, 4.5), color: '#fffbe0', vr: rnd(-.1, .1), life: rnd(.35, .6) });
  }
  // lampo morbido del colore della tessera
  add({ kind: 'glow', x, y, size: 16 + n * 1.5, color: hexA(color, .55), life: .3 });
}
function hexA(hex, a) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return 'rgba(255,214,90,' + a + ')';
  const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
export function dust(x, y, n = 3, color = 'rgba(196,150,96,.9)') {
  for (let i = 0; i < n; i++) add({ kind: 'puff', x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: rnd(-1, 1), vy: rnd(-1.4, -.2), drag: .96, size: rnd(6, 12), color, life: rnd(.5, .9) });
}
export function bubble(x, y, R) { add({ kind: 'bubble', x, y, size: R, fade: false, life: .9 }); }
export function ring(x, y, R, color = '#fff6a0', w = 10) { add({ kind: 'ring', x, y, size: R, color, w, life: .45 }); }
export function glow(x, y, R, color = 'rgba(255,214,90,.8)') { add({ kind: 'glow', x, y, size: R, color, life: .5 }); }
export function streak(x1, y1, x2, y2, color = '#fffbe0', w = 6) { add({ kind: 'streak', x: x1, y: y1, dx: x2 - x1, dy: y2 - y1, color, w, life: .4 }); }
export function rays(x, y, R) { add({ kind: 'rays', x, y, size: R, color: 'rgba(255,236,150,.55)', vr: .02, life: .9 }); }
export function fire(x, y, R) {
  const cols = ['rgba(255,230,120,.9)', 'rgba(255,170,40,.85)', 'rgba(255,110,30,.8)'];
  add({ kind: 'flame', x, y, size: R * .55, color: 'rgba(255,200,80,.9)', life: .35 });
  for (let i = 0; i < 16; i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(2, 6) * R / 120;
    add({ kind: 'flame', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: .9, size: rnd(14, 26) * R / 120, color: cols[i % 3], life: rnd(.3, .55) });
  }
  add({ kind: 'ring', x, y, size: R * 1.1, color: 'rgba(255,240,200,.9)', w: 8, life: .4 });
  for (let i = 0; i < 6; i++) add({ kind: 'puff', x: x + rnd(-R / 3, R / 3), y: y + rnd(-R / 3, R / 3), vy: rnd(-1.5, -.5), drag: .97, size: rnd(12, 20), color: 'rgba(70,60,55,.35)', life: rnd(.7, 1) });
}
let vibra = true;
export function setVibra(v) { vibra = v; }
export function buzz(pattern) { if (!vibra) return; try { navigator.vibrate && navigator.vibrate(pattern); } catch { /* niente */ } }
export function shake(intensity = 6, dur = 0.35) {
  if (vibra && intensity >= 8) { try { navigator.vibrate && navigator.vibrate(Math.round(intensity * 4)); } catch { /* niente */ } }
  if (reduce()) return;
  app.style.setProperty('--si', intensity + 'px');
  app.style.setProperty('--sd', dur + 's');
  app.classList.remove('shake'); void app.offsetWidth; app.classList.add('shake');
  clearTimeout(shake.t); shake.t = setTimeout(() => app.classList.remove('shake'), dur * 1000);
}
export function flash(op = 0.6) {
  const f = document.createElement('div');
  f.className = 'flash'; f.style.setProperty('--fo', op);
  app.appendChild(f); setTimeout(() => f.remove(), 400);
}
// centro dello spazio libero più grande sopra o sotto la griglia (così le scritte non coprono le tessere)
export function freeSpotY() {
  const board = document.querySelector('#board');
  const game = document.querySelector('#game');
  const ar = app.getBoundingClientRect();
  if (!board || !game.classList.contains('active')) return ar.height * 0.34;
  const br = board.getBoundingClientRect();
  const topEl = document.querySelector('#bossbar:not(.hidden)') || document.querySelector('.gamebar');
  const top = topEl.getBoundingClientRect().bottom - ar.top;
  const bot = document.querySelector('.boosters').getBoundingClientRect().top - ar.top;
  const gapA = br.top - ar.top - top, gapB = bot - (br.bottom - ar.top);
  if (Math.max(gapA, gapB) < 60) return br.top - ar.top + 24; // poco spazio: in alto sulla griglia
  return gapA >= gapB ? top + gapA / 2 : br.bottom - ar.top + gapB / 2;
}
export function banner(word, sub = '', color = '#ffd34d') {
  app.querySelectorAll('.combo').forEach((e) => e.remove());
  const d = document.createElement('div');
  d.className = 'combo';
  d.style.top = freeSpotY() + 'px';
  const longest = Math.max(...word.split(' ').map((w) => w.length));
  const size = Math.max(24, Math.min(40, Math.floor(Math.min(520 / word.length, 280 / longest))));
  d.innerHTML = `<span class="w" style="color:${color};font-size:${size}px">${word}</span>${sub ? `<span class="n">${sub}</span>` : ''}`;
  app.appendChild(d);
  setTimeout(() => d.remove(), 950);
}

// sprite che attraversa (moto) lasciando polvere
export function rideAcross(uri, x1, y1, x2, y2, ms = 380) {
  return new Promise((res) => {
    const d = document.createElement('div');
    d.className = 'rider';
    d.style.backgroundImage = uri;
    app.appendChild(d);
    const w = d.offsetWidth;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = k * k * (3 - 2 * k);
      const x = x1 + (x2 - x1) * e, y = y1 + (y2 - y1) * e;
      d.style.transform = `translate(${x - w / 2}px, ${y - w / 2}px)`;
      dust(x - Math.sign(x2 - x1) * w * .35, y + (y2 === y1 ? w * .25 : -Math.sign(y2 - y1) * w * .35), 1);
      if (k < 1) requestAnimationFrame(step); else { d.remove(); res(); }
    };
    requestAnimationFrame(step);
  });
}
