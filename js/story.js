// Enduro Drinking Kingdom — la storia: scene animate a tutto schermo (camera in movimento, effetti, narratore, voci), si possono saltare
import { L } from './i18n.js';
import { CHARS } from './kingdom.js';

// ogni scena: img, cam (movimento della camera), fx (effetti), narr (voce narrante), lines (battute dei personaggi)
export const STORY = {
  intro: {
    title: L`Capitolo 1`, name: L`Un giro easy`,
    scenes: [
      { img: 'st1_1', cam: 'up', fx: ['sun', 'dust'], narr: { t: L`All'alba… l'Enduro Drinking Team sale nella valle, in cerca di un posto tutto suo.`, v: 's_narr0' } },
      { img: 'st1_2', cam: 'in', fx: ['leaves', 'sun'], lines: [{ who: 'gabbah', t: L`Ragazzi… qui ci facciamo il Campo Base!`, v: 's_gabbah0' }] },
      { img: 'st1_3', cam: 'out', fx: ['confetti', 'sparkle'], narr: { t: L`Bandiera piantata, birre stappate: il Campo Base dell'EDT è nato!`, v: 's_narr1' } },
      { img: 'st1_4', cam: 'punch', fx: ['leaves', 'shake'], lines: [{ who: 'forestale', t: L`Alt! Qui non si può! Questa è una multa!`, v: 's_forestale0' }] },
      { img: 'st1_5', cam: 'left', fx: ['sparkle', 'leaves'], lines: [{ who: 'gabbah', t: L`Tranquilli… è un giro easy!`, v: 's_gabbah1' }] },
    ],
    end: { t: L`Vinci i livelli, costruisci il Campo Base… e fai scappare la Forestale!`, v: 's_narr2' },
  },
  passo: {
    title: L`Capitolo 2`, name: L`Verso il Passo`,
    scenes: [
      { img: 'st2_1', cam: 'right', fx: ['dust', 'sparkle'], narr: { t: L`Il Campo Base è finito. La Forestale scappa in jeep… ma ha giurato vendetta.`, v: 's_narr3' }, lines: [{ who: 'forestale', t: L`Non finisce qui! Ci vediamo al Passo!`, v: 's_forestale1' }] },
      { img: 'st2_2', cam: 'in', fx: ['snow'], lines: [{ who: 'miti', t: L`Ragazzi, guardate le tracce! È salita al Passo!`, v: 's_miti0' }] },
      { img: 'st2_3', cam: 'left', fx: ['blizzard', 'shiver'], lines: [{ who: 'mirco', t: L`Campa giù… fa un freddo cane… io torno in mutua!`, v: 's_mirco0' }] },
      { img: 'st2_4', cam: 'punch', fx: ['snow', 'shake'], lines: [{ who: 'forestale2', t: L`Quassù comando io! Catene da neve obbligatorie!`, v: 's_forestale2' }] },
    ],
    end: { t: L`Conquista il Passo: neve, ghiaccio… e una Forestale col colbacco.`, v: 's_narr4' },
  },
  cava: {
    title: L`Capitolo 3`, name: L`La Cava`,
    scenes: [
      { img: 'st3_1', cam: 'down', fx: ['avalanche', 'shake'], narr: { t: L`Una valanga travolge la Forestale… e la porta giù, fino a una vecchia cava di marmo.`, v: 's_narr5' }, lines: [{ who: 'forestale2', t: L`Aiutooo!`, v: 's_forestale3' }] },
      { img: 'st3_2', cam: 'right', fx: ['splash', 'sparkle'], lines: [{ who: 'costa', t: L`Guarda che laghetto… qui ci sono trote enormi!`, v: 's_costa0' }] },
      { img: 'st3_3', cam: 'in', fx: ['dust'], lines: [{ who: 'forestale3', t: L`Cantiere chiuso! Caschetto obbligatorio!`, v: 's_forestale4' }] },
      { img: 'st3_4', cam: 'punch', fx: ['debris', 'dust', 'shake'], lines: [{ who: 'purcello', t: L`Ci penso io. Da dietro, come sempre!`, v: 's_purcello0' }] },
    ],
    end: { t: L`Riapri la Cava: nastri, sassi e casse ovunque.`, v: 's_narr6' },
  },
  finale: {
    title: L`Finale`, name: L`Festa in cava`,
    scenes: [
      { img: 'st4_1', cam: 'up', fx: ['fireworks', 'lights'], narr: { t: L`La Cava è dell'EDT. Stanotte… si festeggia!`, v: 's_narr7' }, lines: [{ who: 'svetlana', t: L`Ciao ragazzi! Stasera si balla!`, v: 's_svetlana0' }] },
      { img: 'st4_2', cam: 'in', fx: ['sparkle', 'lights'], lines: [{ who: 'gabbah', t: L`Dai, Forestale… una birra e facciamo pace.`, v: 's_gabbah2' }, { who: 'forestale3', t: L`Va bene… ma solo una!`, v: 's_forestale5' }] },
      { img: 'st4_3', cam: 'out', fx: ['fireworks', 'confetti'], lines: [{ who: 'gabbah', t: L`EDT per sempre! Giro easy!`, v: 's_gabbah3' }] },
    ],
    end: { t: L`La festa va avanti fino all'alba… ma qualcuno ha un piano.`, v: 's_narr9' },
  },
  marocco: {
    title: L`Capitolo 4`, name: L`Il Marocco`,
    scenes: [
      { img: 'st5_1', cam: 'right', fx: ['sun', 'sparkle'], narr: { t: L`Intanto, la Forestale ha un cugino… in Marocco. E l'EDT carica le moto: si parte!`, v: 's_narr10' } },
      { img: 'st5_2', cam: 'punch', fx: ['dust', 'shiver'], lines: [{ who: 'mirco', t: L`Campa giù… qui c'è più sabbia che birra!`, v: 's_mirco1' }, { who: 'costa', t: L`Tieni duro, Mirco! Ti tiro fuori con la canna da pesca!`, v: 's_costa1' }] },
      { img: 'st5_3', cam: 'in', fx: ['sun', 'shake'], lines: [{ who: 'forestale4', t: L`Benvenuti in Marocco! L'autovelox ce l'ho anche nel deserto!`, v: 's_forestale6' }] },
      { img: 'st5_4', cam: 'out', fx: ['lights', 'sparkle'], lines: [{ who: 'svetlana', t: L`Un tè alla menta… e poi si balla!`, v: 's_svetlana1' }, { who: 'gabbah', t: L`Tranquilli… anche qui è un giro easy!`, v: 's_gabbah4' }] },
    ],
    end: { t: L`Conquista il Marocco: sabbia, dune… e autovelox nel deserto!`, v: 's_narr11' },
  },
  fine: {
    title: L`Finale`, name: L`Il Marocco è dell'EDT`,
    scenes: [
      { img: 'st5_5', cam: 'out', fx: ['fireworks', 'confetti'], narr: { t: L`Dopo mille dune e mille tè alla menta… il Marocco è dell'EDT.`, v: 's_narr12' }, lines: [{ who: 'gabbah', t: L`EDT per sempre! Giro easy!`, v: 's_gabbah3' }] },
    ],
    end: { t: L`Ma a settembre, a Monaco di Baviera, apre il tendone più grande del mondo…`, v: 's_narr13' },
  },
  oktober: {
    title: L`Capitolo 5`, name: L`L'Oktoberfest`,
    scenes: [
      { img: 'st6_1', cam: 'right', fx: ['confetti', 'sun'], narr: { t: L`Monaco di Baviera. L'EDT parcheggia le moto davanti al tendone più grande del mondo.`, v: 's_narr14' }, lines: [{ who: 'gabbah', t: L`Lederhosen addosso… si entra!`, v: 's_gabbah5' }] },
      { img: 'st6_2', cam: 'punch', fx: ['sparkle', 'shake'], lines: [{ who: 'forestale5', t: L`Ozapft is! Prima di entrare… il conto!`, v: 's_forestale7' }] },
      { img: 'st6_3', cam: 'in', fx: ['lights', 'confetti'], lines: [{ who: 'svetlana', t: L`Prosit, ragazzi! Tutti sui tavoli!`, v: 's_svetlana2' }, { who: 'mirco', t: L`Campa giù… un altro boccale!`, v: 's_mirco2' }] },
    ],
    end: { t: L`Conquista l'Oktoberfest: boccali da riempire, festoni… e conti da pagare!`, v: 's_narr15' },
  },
  oktofine: {
    title: L`Finale`, name: L`Prosit EDT!`,
    scenes: [
      { img: 'st6_4', cam: 'out', fx: ['fireworks', 'confetti'], narr: { t: L`Dieci boccali, cento brezel e mille cori dopo… l'Oktoberfest è dell'EDT.`, v: 's_narr16' }, lines: [{ who: 'forestale5', t: L`Va bene, va bene… offro io! Prosit!`, v: 's_forestale8' }, { who: 'gabbah', t: L`EDT per sempre! Giro easy!`, v: 's_gabbah3' }] },
    ],
    end: { t: L`Ma la strada di casa passa per un bosco… e stanotte è Halloween.`, v: 's_narr20' },
  },
  hallo: {
    title: L`Capitolo 6`, name: L`Halloween nel bosco`,
    scenes: [
      { img: 'st7_1', cam: 'in', fx: ['leaves', 'dust'], narr: { t: L`Dopo l'Oktoberfest, l'EDT torna a casa di notte… e sbaglia strada. Nel bosco c'è la nebbia, e la luna è piena.`, v: 's_narr17' } },
      { img: 'st7_2', cam: 'left', fx: ['leaves', 'shiver'], lines: [{ who: 'mirco', t: L`Campa giù… qui ci sono i fantasmi! Io torno in tenda!`, v: 's_mirco3' }] },
      { img: 'st7_3', cam: 'punch', fx: ['sparkle', 'shake'], lines: [{ who: 'forestale6', t: L`Benvenuti nel mio bosco… La multa ve la firmo a mezzanotte! Muahahah!`, v: 's_forestale9' }] },
      { img: 'st7_4', cam: 'out', fx: ['sparkle', 'lights'], lines: [{ who: 'svetlana', t: L`Tranquilli ragazzi: una pozione delle mie… e la Forestale torna normale!`, v: 's_svetlana3' }, { who: 'gabbah', t: L`Dolcetto o scherzetto? Per noi… birretta!`, v: 's_gabbah6' }] },
    ],
    end: { t: L`Accendi le lanterne, costruisci il villaggio di Halloween… e caccia la Forestale vampira!`, v: 's_narr18' },
  },
  hallofine: {
    title: L`Finale`, name: L`Il bosco è dell'EDT`,
    scenes: [
      { img: 'st7_5', cam: 'out', fx: ['fireworks', 'confetti'], narr: { t: L`All'alba la nebbia si alza. La Forestale vampira scappa nel suo castello… e il bosco è dell'EDT.`, v: 's_narr19' }, lines: [{ who: 'forestale6', t: L`Va bene, va bene… me ne vado. Tanto odio l'alba!`, v: 's_forestale10' }, { who: 'gabbah', t: L`EDT per sempre! Giro easy!`, v: 's_gabbah3' }] },
    ],
    end: { t: L`Fine… per ora. Grazie per aver giocato con l'Enduro Drinking Team!`, v: 's_narr8' },
  },
};
export const STORY_ORDER = ['intro', 'passo', 'cava', 'finale', 'marocco', 'fine', 'oktober', 'oktofine', 'hallo', 'hallofine'];

let opts = {};
export function initStory(o) { opts = o; }   // { I, SRC, voiceSrc, duck, canVoice, click }

// ---------- effetti (particelle su canvas) ----------
const R = (a, b) => a + Math.random() * (b - a);
const CONF = ['#ffd34d', '#e8322a', '#2f5fa8', '#ffffff', '#4fd25f', '#ff4fa3'];
function makeFx(cv) {
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, parts = [], kinds = [], raf = 0, last = 0, t = 0, boomT = 0;
  const fit = () => { const d = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  fit();
  const spawn = (k, init) => {
    const y0 = init ? R(0, H) : -20;
    switch (k) {
      case 'snow': return { k, x: R(0, W), y: y0, r: R(1.5, 4.5), vx: R(-15, 15), vy: R(30, 80), a: R(.6, 1), w: R(0, 6) };
      case 'blizzard': return { k: 'snow', x: init ? R(0, W) : -10, y: R(0, H), r: R(1.5, 4), vx: R(260, 480), vy: R(40, 110), a: R(.5, .95), w: 0 };
      case 'avalanche': return { k: 'puff', x: R(-.1, .7) * W, y: init ? R(0, H) : -60, r: R(30, 90), vx: R(20, 90), vy: R(220, 420), a: R(.35, .7), c: '255,255,255' };
      case 'dust': return { k: 'puff', x: R(0, W), y: R(H * .55, H * 1.05), r: R(20, 60), vx: R(-25, 25), vy: R(-30, -8), a: R(.12, .3), c: '225,195,150', life: R(3, 6) };
      case 'leaves': return { k, x: R(0, W), y: y0, r: R(5, 10), vx: R(-30, 30), vy: R(35, 70), a: 1, rot: R(0, 6), vr: R(-3, 3), c: ['#5aa83a', '#8cc63f', '#3f7f2a', '#d9a521'][Math.floor(R(0, 4))] };
      case 'confetti': return { k, x: R(0, W), y: y0, r: R(4, 8), vx: R(-40, 40), vy: R(70, 150), a: 1, rot: R(0, 6), vr: R(-8, 8), c: CONF[Math.floor(R(0, CONF.length))] };
      case 'sparkle': return { k, x: R(0, W), y: R(0, H), r: R(2, 5), a: 0, ph: R(0, 6.3), sp: R(2, 4), life: R(1.5, 3) };
      case 'lights': return { k: 'bokeh', x: R(0, W), y: R(0, H * .6), r: R(6, 20), a: 0, ph: R(0, 6.3), sp: R(.8, 1.6), c: ['255,210,90', '255,120,200', '120,200,255'][Math.floor(R(0, 3))], life: R(3, 6) };
      case 'splash': return { k: 'drop', x: R(.1, .8) * W, y: R(H * .55, H * .75), r: R(2, 4), vx: R(-60, 60), vy: R(-320, -160), a: 1, life: 1.4 };
      case 'debris': return { k: 'rock', x: R(.4, 1) * W, y: R(H * .45, H * .7), r: R(3, 8), vx: R(-260, 40), vy: R(-380, -150), a: 1, rot: R(0, 6), vr: R(-10, 10), life: 2 };
      default: return null;
    }
  };
  const RATE = { snow: 26, blizzard: 60, avalanche: 14, dust: 4, leaves: 3, confetti: 22, sparkle: 6, lights: 4, splash: 14, debris: 8 };
  const MAX = { snow: 140, blizzard: 220, avalanche: 60, dust: 26, leaves: 18, confetti: 120, sparkle: 26, lights: 22, splash: 60, debris: 40 };
  const acc = {};
  const firework = () => {
    const x = R(.15, .85) * W, y = R(.08, .38) * H, c = CONF[Math.floor(R(0, CONF.length))], n = 34;
    for (let i = 0; i < n; i++) { const a = (i / n) * 6.283, s = R(90, 200); parts.push({ k: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: R(1.6, 3), a: 1, c, life: R(1, 1.6), age: 0 }); }
  };
  const step = (now) => {
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; t += dt;
    ctx.clearRect(0, 0, W, H);
    for (const k of kinds) {
      if (k === 'fireworks') { boomT -= dt; if (boomT <= 0) { firework(); boomT = R(.5, 1.1); } continue; }
      if (!RATE[k]) continue;
      acc[k] = (acc[k] || 0) + RATE[k] * dt;
      const cur = parts.filter((p) => p.src === k).length;
      while (acc[k] >= 1) { acc[k] -= 1; if (cur < MAX[k]) { const p = spawn(k, false); if (p) { p.src = k; p.age = 0; parts.push(p); } } }
    }
    parts = parts.filter((p) => {
      p.age = (p.age || 0) + dt;
      if (p.life && p.age > p.life) return false;
      if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; }
      if (p.k === 'snow') p.x += Math.sin(t * 2 + (p.w || 0)) * 12 * dt;
      if (p.k === 'drop' || p.k === 'rock' || p.k === 'spark') p.vy += (p.k === 'spark' ? 90 : 700) * dt;
      if (p.rot !== undefined) p.rot += p.vr * dt;
      if (p.y > H + 80 || p.x > W + 120 || p.x < -120) return false;
      let a = p.a;
      if (p.k === 'sparkle' || p.k === 'bokeh') a = Math.max(0, Math.sin((p.age / p.life) * Math.PI)) * (p.k === 'bokeh' ? .45 : 1);
      if (p.k === 'spark' || p.k === 'puff' && p.life) a = p.a * (1 - p.age / p.life);
      ctx.globalAlpha = a;
      switch (p.k) {
        case 'snow': ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); break;
        case 'puff': { const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, `rgba(${p.c},1)`); g.addColorStop(1, `rgba(${p.c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); break; }
        case 'leaves': case 'confetti': case 'rock':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.k === 'rock' ? '#ddd6c8' : p.c;
          if (p.k === 'leaves') { ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .45, 0, 0, 6.283); ctx.fill(); } else if (p.k === 'rock') { ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .8); } else { ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); }
          ctx.restore(); break;
        case 'sparkle': { ctx.fillStyle = '#fff6c8'; const s = p.r * 2.2; ctx.beginPath(); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + p.r * .5, p.y); ctx.lineTo(p.x, p.y + s); ctx.lineTo(p.x - p.r * .5, p.y); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x, p.y + p.r * .5); ctx.lineTo(p.x + s, p.y); ctx.lineTo(p.x, p.y - p.r * .5); ctx.closePath(); ctx.fill(); break; }
        case 'bokeh': { const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, `rgba(${p.c},1)`); g.addColorStop(1, `rgba(${p.c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); break; }
        case 'drop': ctx.fillStyle = '#bfeaff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); break;
        case 'spark': ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); break;
        default: break;
      }
      return true;
    });
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return {
    set(list) {
      kinds = list || []; parts = parts.filter((p) => p.k === 'spark');
      for (const k of kinds) { const n = Math.round((MAX[k] || 0) * (k === 'avalanche' || k === 'debris' || k === 'splash' ? .2 : .55)); for (let i = 0; i < n; i++) { const p = spawn(k, true); if (p) { p.src = k; p.age = p.life ? R(0, p.life) : 0; parts.push(p); } } }
      if (kinds.includes('fireworks')) { firework(); boomT = .4; }
    },
    stop() { cancelAnimationFrame(raf); },
  };
}

// riproduce un capitolo; restituisce una promise che si risolve alla fine o quando si salta
export function playStory(id) {
  const ch = STORY[id];
  if (!ch) return Promise.resolve();
  ch.scenes.forEach((sc) => { const im = new Image(); im.src = opts.SRC(sc.img); });
  return new Promise((done) => {
    const root = document.createElement('div');
    root.id = 'story';
    root.innerHTML = L`<div class="st-stage"></div><div class="st-rays"></div><canvas class="st-fx"></canvas>
      <div class="st-dots">${ch.scenes.map(() => '<i></i>').join('')}</div>
      <button class="st-skip">Salta ⏭</button>
      <div class="st-cap"></div>
      <div class="st-title"><img src="${opts.SRC('edt_title')}" alt=""><small>${ch.title}</small><b>${ch.name}</b></div>`;
    document.getElementById('app').appendChild(root);
    const stage = root.querySelector('.st-stage'), cap = root.querySelector('.st-cap'), dots = [...root.querySelectorAll('.st-dots i')];
    const fx = makeFx(root.querySelector('.st-fx'));
    // sequenza piatta di passi: [scena, battuta]
    const steps = [];
    ch.scenes.forEach((s, si) => {
      const ls = [];
      if (s.narr) ls.push({ who: null, t: s.narr.t, v: s.narr.v });
      (s.lines || []).forEach((l) => ls.push(l));
      ls.forEach((l, k) => steps.push({ si, first: k === 0, l }));
    });
    steps.push({ si: -1, first: true, l: { who: null, t: ch.end.t, v: ch.end.v, end: true } });
    let n = -1, timer = 0, audio = null, finished = false, curImg = null;
    const stopAudio = () => { if (audio) { try { audio.pause(); } catch { /* */ } audio = null; } };
    const finish = () => {
      if (finished) return; finished = true;
      clearTimeout(timer); stopAudio(); fx.stop();
      root.classList.add('out');
      setTimeout(() => { root.remove(); done(); }, 450);
    };
    const showScene = (s, si) => {
      dots.forEach((d, k) => d.classList.toggle('on', k <= si));
      const img = document.createElement('div');
      img.className = 'st-img cam-' + (s.cam || 'in');
      img.innerHTML = `<i style="background-image:${opts.I(s.img)}"></i>`;
      stage.appendChild(img);
      requestAnimationFrame(() => img.classList.add('show'));
      [...stage.children].slice(0, -2).forEach((e) => e.remove());
      curImg = img;
      const f = s.fx || [];
      root.classList.toggle('fx-shake', f.includes('shake'));
      root.classList.toggle('fx-shiver', f.includes('shiver'));
      root.classList.toggle('fx-sun', f.includes('sun'));
      root.classList.toggle('fx-night', f.includes('lights') || f.includes('fireworks'));
      fx.set(f);
    };
    const say = (l) => {
      const c = l.who && CHARS[l.who];
      cap.className = 'st-cap' + (c ? '' : ' narr');
      cap.innerHTML = c ? `<div class="st-av" style="background-image:${opts.I(c.img)}"></div><div><b>${c.name}</b><p>${l.t}</p></div>`
        : `<div><p class="st-narr${l.end ? ' st-end' : ''}">${l.t}</p></div>`;
      void cap.offsetWidth; cap.classList.add('in');
      if (c && curImg) { curImg.classList.remove('punch'); void curImg.offsetWidth; curImg.classList.add('punch'); }
      const after = l.end ? finish : next;
      clearTimeout(timer); timer = setTimeout(after, 3200 + l.t.length * 50);
      if (l.v && opts.canVoice()) {
        stopAudio();
        try {
          const a = new Audio(opts.voiceSrc(l.v)); audio = a;
          a.play().catch(() => {});
          opts.duck(5);
          const setDur = () => { if (audio === a && isFinite(a.duration) && a.duration > 0) { clearTimeout(timer); timer = setTimeout(after, Math.max(2400, a.duration * 1000 + (l.end ? 1600 : 900))); } };
          if (a.readyState >= 1) setDur(); else a.addEventListener('loadedmetadata', setDur);
        } catch { /* niente */ }
      }
    };
    const next = () => {
      if (finished) return;
      n++;
      if (n >= steps.length) { finish(); return; }
      const st = steps[n];
      if (st.l.end) { root.querySelector('.st-skip').textContent = L`Gioca ▶`; root.classList.add('ending'); }
      if (st.first && st.si >= 0) showScene(ch.scenes[st.si], st.si);
      say(st.l);
    };
    root.querySelector('.st-skip').onclick = (e) => { e.stopPropagation(); opts.click(); finish(); };
    root.onclick = () => { opts.click(); clearTimeout(timer); stopAudio(); next(); };
    // cartello del capitolo, poi la prima scena
    setTimeout(() => { root.querySelector('.st-title').classList.add('gone'); next(); }, 2200);
  });
}
