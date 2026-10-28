// EDT Kingdom — audio generato in tempo reale (Web Audio): niente file da scaricare.
// Tre musiche originali (campo base, partita, boss) + effetti sonori.

let ctx = null, master, musicBus, sfxBus, noiseBuf = null;
const state = { music: true, sfx: true };
let unlocked = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createDynamicsCompressor();
  master.threshold.value = -14; master.ratio.value = 4; master.release.value = 0.2;
  master.connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = state.music ? 0.32 : 0; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = state.sfx ? 0.9 : 0; sfxBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

// da chiamare a ogni tocco: sblocca l'audio su iPhone/Android
export function unlock() {
  if (!ensure()) return;
  if (ctx.state === 'suspended') ctx.resume();
  if (!unlocked) { unlocked = true; if (wantTrack) startTrack(wantTrack); }
}

export function setMusic(on) {
  state.music = on;
  if (ctx) musicBus.gain.setTargetAtTime(on ? 0.32 : 0, ctx.currentTime, 0.05);
  if (on && wantTrack && !timer) startTrack(wantTrack);
}
export function setSfx(on) { state.sfx = on; if (ctx) sfxBus.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.02); }
export function pause(p) { if (!ctx) return; if (p) ctx.suspend(); else if (unlocked) ctx.resume(); }

// ---------------- mattoni sonori ----------------
function env(g, t, a, peak, d, sus = 0.0001) {
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + d);
}
function tone(bus, { f = 440, f2 = 0, type = 'sine', t = 0, a = 0.005, d = 0.15, vol = 0.2, detune = 0, lp = 0 }) {
  if (!ensure()) return;
  const t0 = ctx.currentTime + t;
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); o.detune.value = detune;
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t0 + a + d);
  const g = ctx.createGain(); env(g, t0, a, vol, d);
  let node = o;
  if (lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); node = fl; }
  node.connect(g).connect(bus);
  o.start(t0); o.stop(t0 + a + d + 0.05);
}
function noise(bus, { t = 0, a = 0.002, d = 0.2, vol = 0.3, type = 'bandpass', f = 1200, f2 = 0, q = 1 }) {
  if (!ensure()) return;
  const t0 = ctx.currentTime + t;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t0); fl.Q.value = q;
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + a + d);
  const g = ctx.createGain(); env(g, t0, a, vol, d);
  s.connect(fl).connect(g).connect(bus);
  s.start(t0, Math.random() * 0.5); s.stop(t0 + a + d + 0.05);
}

// ---------------- effetti ----------------
const S = () => (state.sfx && ensure() ? sfxBus : null);
export const sfx = {
  pop(n = 0) { const b = S(); if (!b) return; const f = 520 * Math.pow(1.06, Math.min(n, 12)); tone(b, { f, f2: f * 1.6, type: 'triangle', d: 0.09, vol: 0.18 }); tone(b, { f: f * 2, type: 'sine', t: 0.01, d: 0.06, vol: 0.06 }); },
  swap() { const b = S(); if (!b) return; noise(b, { f: 900, f2: 2600, d: 0.09, vol: 0.08, q: 2 }); tone(b, { f: 300, f2: 420, d: 0.07, vol: 0.06 }); },
  bad() { const b = S(); if (!b) return; tone(b, { f: 200, f2: 150, type: 'square', d: 0.12, vol: 0.07, lp: 900 }); tone(b, { f: 160, f2: 120, type: 'square', t: 0.1, d: 0.12, vol: 0.06, lp: 900 }); },
  moto() { const b = S(); if (!b) return; tone(b, { f: 70, f2: 210, type: 'sawtooth', a: 0.02, d: 0.42, vol: 0.16, lp: 1400 }); tone(b, { f: 72, f2: 216, type: 'sawtooth', a: 0.02, d: 0.42, vol: 0.12, detune: 18, lp: 1400 }); noise(b, { f: 400, f2: 1800, d: 0.4, vol: 0.06, q: 0.7 }); },
  boom() { const b = S(); if (!b) return; noise(b, { type: 'lowpass', f: 1800, f2: 120, a: 0.004, d: 0.6, vol: 0.55 }); tone(b, { f: 110, f2: 38, type: 'sine', d: 0.5, vol: 0.45 }); },
  power() { const b = S(); if (!b) return; [0, 4, 7, 12].forEach((s, i) => tone(b, { f: 523 * Math.pow(2, s / 12), type: 'triangle', t: i * 0.04, d: 0.18, vol: 0.12 })); noise(b, { type: 'highpass', f: 5000, d: 0.3, vol: 0.05 }); },
  grappa() { const b = S(); if (!b) return; [0, 7, 12, 16, 19, 24].forEach((s, i) => tone(b, { f: 392 * Math.pow(2, s / 12), type: 'sine', t: i * 0.05, d: 0.5, vol: 0.09 })); },
  drone() { const b = S(); if (!b) return; tone(b, { f: 300, f2: 520, type: 'sawtooth', a: 0.05, d: 0.45, vol: 0.06, lp: 2200 }); noise(b, { f: 3000, d: 0.45, vol: 0.05, q: 3 }); },
  combo(step) { const b = S(); if (!b) return; const base = 392 * Math.pow(2, Math.min(step, 7) * 2 / 12); [0, 4, 7].forEach((s, i) => tone(b, { f: base * Math.pow(2, s / 12), type: 'square', t: i * 0.05, d: 0.12, vol: 0.06, lp: 3000 })); },
  coin() { const b = S(); if (!b) return; tone(b, { f: 988, type: 'square', d: 0.07, vol: 0.06, lp: 4000 }); tone(b, { f: 1319, type: 'square', t: 0.07, d: 0.18, vol: 0.06, lp: 4000 }); },
  star() { const b = S(); if (!b) return; [0, 5, 9, 12].forEach((s, i) => tone(b, { f: 659 * Math.pow(2, s / 12), type: 'triangle', t: i * 0.06, d: 0.25, vol: 0.1 })); },
  win() { const b = S(); if (!b) return; [[0, 0], [4, .12], [7, .24], [12, .36], [7, .52], [12, .64]].forEach(([s, t]) => tone(b, { f: 523 * Math.pow(2, s / 12), type: 'square', t, d: 0.2, vol: 0.08, lp: 3500 })); tone(b, { f: 131, type: 'triangle', t: 0.36, d: 0.6, vol: 0.2 }); },
  lose() { const b = S(); if (!b) return; [[7, 0], [6, .2], [5, .4], [4, .6]].forEach(([s, t]) => tone(b, { f: 262 * Math.pow(2, s / 12), type: 'triangle', t, d: 0.3, vol: 0.12 })); },
  whistle() { const b = S(); if (!b) return; [0, 0.18].forEach((t, i) => { tone(b, { f: 2100, type: 'sine', t, a: 0.01, d: i ? 0.32 : 0.12, vol: 0.09 }); tone(b, { f: 2150, type: 'sine', t, a: 0.01, d: i ? 0.32 : 0.12, vol: 0.05 }); }); },
  hammer() { const b = S(); if (!b) return; noise(b, { f: 1400, d: 0.08, vol: 0.25, q: 3 }); tone(b, { f: 180, f2: 90, type: 'square', d: 0.08, vol: 0.08, lp: 1200 }); },
  build() { const b = S(); if (!b) return; [[0, 0], [5, .1], [9, .2], [12, .3]].forEach(([s, t]) => tone(b, { f: 392 * Math.pow(2, s / 12), type: 'square', t, d: 0.16, vol: 0.07, lp: 3000 })); noise(b, { type: 'highpass', f: 6000, t: 0.3, d: 0.6, vol: 0.05 }); },
  click() { const b = S(); if (!b) return; tone(b, { f: 700, f2: 900, type: 'triangle', d: 0.04, vol: 0.08 }); },
  splash() { const b = S(); if (!b) return; noise(b, { type: 'lowpass', f: 900, f2: 200, d: 0.2, vol: 0.18 }); },
  crack() { const b = S(); if (!b) return; noise(b, { f: 2500, d: 0.06, vol: 0.2, q: 5 }); noise(b, { f: 1200, t: 0.04, d: 0.1, vol: 0.15, q: 4 }); },
  chain() { const b = S(); if (!b) return; [0, .05, .1].forEach((t) => tone(b, { f: 1800 + Math.random() * 600, type: 'square', t, d: 0.05, vol: 0.04, lp: 6000 })); },
  ticket() { const b = S(); if (!b) return; noise(b, { f: 3000, f2: 800, d: 0.15, vol: 0.1, q: 1.5 }); },
};
// compatibilità con il vecchio beep()
export function beep(freq = 440, dur = 0.08, type = 'sine', vol = 0.12, slide = 0) {
  const b = S(); if (!b || freq <= 0) return;
  tone(b, { f: freq, f2: slide ? freq + slide : 0, type, d: dur, vol: vol * 0.8 });
}

// ---------------- musica ----------------
// accordi in semitoni rispetto alla tonica (MIDI)
const TRACKS = {
  home: { bpm: 96, root: 55, swing: 0.08, prog: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]],
    lead: [12, -1, 16, 14, 12, -1, 9, -1, 7, 9, 12, -1, 14, -1, 12, -1], bassPat: [1, 0, 0, 1, 0, 0, 1, 0], drums: 'soft', leadType: 'triangle' },
  game: { bpm: 124, root: 57, swing: 0.04, prog: [[0, 4, 7], [7, 11, 14], [-3, 0, 4], [5, 9, 12]],
    lead: [12, 14, 16, -1, 19, -1, 16, 14, 12, -1, 14, 16, 14, -1, 9, -1], bassPat: [1, 0, 1, 0, 1, 0, 1, 1], drums: 'rock', leadType: 'square' },
  boss: { bpm: 138, root: 52, swing: 0, prog: [[0, 3, 7], [0, 3, 7], [-4, 0, 3], [-2, 2, 5]],
    lead: [12, -1, 12, 15, -1, 14, 12, -1, 11, -1, 12, -1, 7, -1, 8, 7], bassPat: [1, 1, 0, 1, 1, 0, 1, 1], drums: 'drive', leadType: 'sawtooth' },
};
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let wantTrack = null, timer = 0, step = 0, nextT = 0, cur = null;

function startTrack(name) {
  stopTimer();
  if (!state.music || !unlocked || !ensure()) return;
  cur = TRACKS[name]; step = 0; nextT = ctx.currentTime + 0.1;
  timer = setInterval(schedule, 25);
}
function stopTimer() { if (timer) { clearInterval(timer); timer = 0; } }
export function playMusic(name) {
  if (wantTrack === name && timer) return;
  wantTrack = name;
  if (ctx) musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  setTimeout(() => { startTrack(name); if (ctx && state.music) musicBus.gain.setTargetAtTime(0.32, ctx.currentTime, 0.3); }, 180);
}
export function stopMusic() { wantTrack = null; stopTimer(); }

function mtone(f, t, d, vol, type, lp = 2400, a = 0.008) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
  const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp;
  const g = ctx.createGain(); env(g, t, a, vol, d);
  o.connect(fl).connect(g).connect(musicBus); o.start(t); o.stop(t + a + d + 0.05);
}
function mnoise(t, d, vol, type, f, q = 1) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = ctx.createGain(); env(g, t, 0.002, vol, d);
  s.connect(fl).connect(g).connect(musicBus); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.05);
}
function kick(t, v = 0.6) { const o = ctx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); const g = ctx.createGain(); env(g, t, 0.002, v, 0.18); o.connect(g).connect(musicBus); o.start(t); o.stop(t + 0.25); }

function schedule() {
  if (!cur || !ctx) return;
  const st16 = 60 / cur.bpm / 4;
  while (nextT < ctx.currentTime + 0.12) {
    const t = nextT + (step % 2 ? cur.swing * st16 : 0);
    const bar = Math.floor(step / 16) % cur.prog.length;
    const s16 = step % 16;
    const chord = cur.prog[bar];
    const root = cur.root + chord[0];
    // basso
    if (s16 % 2 === 0 && cur.bassPat[(s16 / 2) % 8]) mtone(mtof(root - 12), t, st16 * 1.6, 0.22, 'triangle', 900);
    // accordo (pad leggero sui tempi forti)
    if (s16 === 0 || s16 === 8) chord.forEach((n) => mtone(mtof(cur.root + n), t, st16 * 7, 0.045, 'sawtooth', 1200, 0.03));
    // arpeggio nelle battute pari
    if (cur.drums !== 'soft' || bar % 2 === 1) { if (s16 % 2 === 1) mtone(mtof(cur.root + chord[(s16 >> 1) % 3] + 12), t, st16 * 0.8, 0.035, 'square', 2600); }
    // melodia: 2 battute sì e 2 no, per non stancare
    const phrase = Math.floor(step / 32) % 4;
    const ln = cur.lead[s16];
    if (phrase !== 3 && ln >= 0) mtone(mtof(cur.root + ln + (phrase === 2 ? 2 : 0)), t, st16 * 1.8, 0.07, cur.leadType, 3200);
    // batteria
    if (cur.drums === 'soft') {
      if (s16 === 0 || s16 === 10) kick(t, 0.35);
      if (s16 === 8) mnoise(t, 0.12, 0.08, 'bandpass', 1800, 0.8);
      if (s16 % 4 === 2) mnoise(t, 0.04, 0.03, 'highpass', 7000);
    } else {
      if (s16 % 4 === 0 || (cur.drums === 'drive' && s16 % 4 === 2 && s16 > 8)) kick(t, 0.55);
      if (s16 === 4 || s16 === 12) { mnoise(t, 0.16, 0.16, 'bandpass', 1900, 0.7); mtone(180, t, 0.08, 0.06, 'triangle', 1200); }
      if (s16 % 2 === 0) mnoise(t, 0.035, s16 % 4 === 2 ? 0.05 : 0.03, 'highpass', 8000);
      if (step % 64 === 60) [0, 1, 2, 3].forEach((i) => mnoise(t + i * st16, 0.1, 0.1, 'bandpass', 900 + i * 300, 0.8));
    }
    nextT += st16;
    step++;
  }
}
