// EDT Kingdom — la storia: scene animate a tutto schermo (zoom lento, sottotitoli, voci), si possono saltare
import { CHARS } from './kingdom.js';

export const STORY = {
  intro: {
    title: 'Capitolo 1', name: 'Un giro easy',
    scenes: [
      { img: 'st1_1', text: 'All\'alba, l\'Enduro Drinking Team sale nella valle in cerca di un posto tutto suo…' },
      { img: 'st1_2', who: 'gabbah', line: 'Ragazzi… qui ci facciamo il Campo Base!', v: 's_gabbah0' },
      { img: 'st1_3', text: 'Bandiera piantata, birre stappate: il Campo Base dell\'EDT è nato!' },
      { img: 'st1_4', who: 'forestale', line: 'Alt! Qui non si può! Questa è una multa!', v: 's_forestale0' },
      { img: 'st1_5', who: 'gabbah', line: 'Tranquilla… è un giro easy.', v: 's_gabbah1' },
    ],
    end: 'Vinci i livelli, costruisci il Campo Base e fai scappare la Forestale!',
  },
  passo: {
    title: 'Capitolo 2', name: 'Verso il Passo',
    scenes: [
      { img: 'st2_1', who: 'forestale', line: 'Non finisce qui! Ci vediamo al Passo!', v: 's_forestale1' },
      { img: 'st2_2', who: 'miti', line: 'Ragazzi, guardate le tracce! È salita al Passo!', v: 's_miti0' },
      { img: 'st2_3', who: 'mirco', line: 'Campa giù… fa un freddo cane… io torno in mutua!', v: 's_mirco0' },
      { img: 'st2_4', who: 'forestale2', line: 'Quassù comando io! Catene da neve obbligatorie!', v: 's_forestale2' },
    ],
    end: 'Conquista Il Passo: neve, ghiaccio e una Forestale col colbacco.',
  },
  cava: {
    title: 'Capitolo 3', name: 'La Cava',
    scenes: [
      { img: 'st3_1', who: 'forestale2', line: 'Aiutooo!', v: 's_forestale3', text: 'Una valanga travolge la Forestale e la porta giù, fino a una vecchia cava di marmo…' },
      { img: 'st3_2', who: 'costa', line: 'Guarda che laghetto… qui ci sono trote enormi!', v: 's_costa0' },
      { img: 'st3_3', who: 'forestale3', line: 'Cantiere chiuso! Caschetto obbligatorio!', v: 's_forestale4' },
      { img: 'st3_4', who: 'purcello', line: 'Ci penso io. Da dietro, come sempre!', v: 's_purcello0' },
    ],
    end: 'Riapri La Cava: nastri, sassi e casse ovunque.',
  },
  finale: {
    title: 'Finale', name: 'Festa in cava',
    scenes: [
      { img: 'st4_1', who: 'svetlana', line: 'Ciao ragazzi! Stasera si balla!', v: 's_svetlana0' },
      { img: 'st4_2', who: 'gabbah', line: 'Dai, Forestale… una birra e facciamo pace.', v: 's_gabbah2', then: { who: 'forestale3', line: 'Va bene… ma solo una!', v: 's_forestale5' } },
      { img: 'st4_3', who: 'gabbah', line: 'EDT per sempre! Giro easy!', v: 's_gabbah3' },
    ],
    end: 'Fine… per ora. Grazie per aver giocato con l\'Enduro Drinking Team!',
  },
};
export const STORY_ORDER = ['intro', 'passo', 'cava', 'finale'];

let opts = {};
export function initStory(o) { opts = o; }   // { I, SRC, voiceSrc, duck, canVoice, click, onMusic }

// riproduce un capitolo; restituisce una promise che si risolve alla fine o quando si salta
export function playStory(id) {
  const ch = STORY[id];
  if (!ch) return Promise.resolve();
  ch.scenes.forEach((sc) => { const im = new Image(); im.src = opts.SRC(sc.img); });
  return new Promise((done) => {
    const root = document.createElement('div');
    root.id = 'story';
    root.innerHTML = `<div class="st-stage"></div>
      <div class="st-dots">${ch.scenes.map(() => '<i></i>').join('')}</div>
      <button class="st-skip">Salta ⏭</button>
      <div class="st-cap"></div>
      <div class="st-title"><img src="${opts.SRC('edt_title')}" alt=""><small>${ch.title}</small><b>${ch.name}</b></div>`;
    document.getElementById('app').appendChild(root);
    const stage = root.querySelector('.st-stage'), cap = root.querySelector('.st-cap'), dots = [...root.querySelectorAll('.st-dots i')];
    let i = -1, timer = 0, audio = null, finished = false, sub = 0;
    const stopAudio = () => { if (audio) { try { audio.pause(); } catch { /* */ } audio = null; } };
    const finish = () => {
      if (finished) return; finished = true;
      clearTimeout(timer); stopAudio();
      root.classList.add('out');
      setTimeout(() => { root.remove(); done(); }, 450);
    };
    const say = (who, line, v, after) => {
      const c = CHARS[who];
      cap.innerHTML = c ? `<div class="st-av" style="background-image:${opts.I(c.img)}"></div><div><b>${c.name}</b><p>${line}</p></div>` : `<div><p class="st-narr">${line}</p></div>`;
      cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
      let dur = 3600 + line.length * 45;
      if (v && opts.canVoice()) {
        stopAudio();
        try {
          audio = new Audio(opts.voiceSrc(v)); audio.play().catch(() => {});
          opts.duck(4);
          audio.addEventListener('loadedmetadata', () => { if (audio && isFinite(audio.duration)) { clearTimeout(timer); timer = setTimeout(after, Math.max(2600, audio.duration * 1000 + 1300)); } });
        } catch { /* niente */ }
      }
      clearTimeout(timer); timer = setTimeout(after, dur);
    };
    const next = () => {
      if (finished) return;
      const sc = ch.scenes[i];
      // seconda battuta nella stessa scena
      if (sc && sc.then && sub === 0) { sub = 1; say(sc.then.who, sc.then.line, sc.then.v, next); return; }
      sub = 0; i++;
      if (i >= ch.scenes.length) {
        cap.innerHTML = `<div><p class="st-narr st-end">${ch.end}</p></div>`;
        cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
        root.querySelector('.st-skip').textContent = 'Gioca ▶';
        clearTimeout(timer); timer = setTimeout(finish, 3800);
        return;
      }
      dots.forEach((d, k) => d.classList.toggle('on', k <= i));
      const s = ch.scenes[i];
      const img = document.createElement('div');
      img.className = 'st-img ' + (i % 2 ? 'kb2' : 'kb1');
      img.style.backgroundImage = opts.I(s.img);
      stage.appendChild(img);
      requestAnimationFrame(() => img.classList.add('show'));
      [...stage.children].slice(0, -2).forEach((e) => e.remove());
      if (s.text && s.who) {   // prima il narratore, poi la battuta
        say(null, s.text, null, () => say(s.who, s.line, s.v, next));
      } else if (s.who) say(s.who, s.line, s.v, next);
      else say(null, s.text, null, next);
    };
    root.querySelector('.st-skip').onclick = (e) => { e.stopPropagation(); opts.click(); finish(); };
    root.onclick = () => { opts.click(); if (i >= ch.scenes.length) finish(); else { clearTimeout(timer); next(); } };
    // cartello del capitolo, poi la prima scena
    setTimeout(() => { root.querySelector('.st-title').classList.add('gone'); next(); }, 2200);
  });
}
