// EDT Kingdom — livelli
import { makeRng, ROWS, COLS } from './engine.js';

// Layout (9 righe x 8 colonne):
// '.' normale   '#' casella vuota (fuori griglia)
// m/M fango (1/2 strati)   r/R sasso (1/2 colpi)   c/C cassa di birra (1/2 colpi)
// k tessera incatenata   t multa della Forestale (si allarga!)
const L = (s) => s.trim().split('\n').map((x) => x.trim());

const HAND = {
  1: { moves: 20, colors: 5, tiles: [[0, 12]],
    intro: ['gabbah', 'Primo giro: metti in fila 3 birre uguali e sono tue. Tranquillo, è un giro easy.'] },
  2: { moves: 20, colors: 5, tiles: [[1, 14], [3, 10]], layout: L(`
    ##....##
    #......#
    ........
    ........
    ........
    ........
    ........
    #......#
    ##....##`),
    intro: ['miti', 'Metti in fila 4 tessere e ti esce una <b>moto</b>: parte a manetta e si porta via tutta la riga.'] },
  3: { moves: 24, colors: 5, layout: L(`
    ........
    ........
    ........
    ..mmmm..
    .mmmmmm.
    .mmmmmm.
    ..mmmm..
    ........
    ........`),
    intro: ['mirco', 'Qui è tutto fango. Fai i tris sopra le pozze per pulirle. Io vi guardo da qui... campa giù.'] },
  4: { moves: 25, colors: 5, layout: L(`
    ........
    ........
    r..rr..r
    ........
    ........
    .r.rr.r.
    ........
    ........
    ........`),
    intro: ['purcello', 'Sassi in mezzo al sentiero! Fai i tris <b>accanto</b> ai sassi per spaccarli. E se ti pianti, arrivo io da dietro.'] },
  5: { moves: 24, colors: 5, boss: { hp: 150, every: 5 },
    intro: ['forestale', 'Alt! Forestale. Sentiero chiuso. Ogni 5 mosse vi tiro un sasso in mezzo ai piedi, e poi vi faccio pure la multa.'] },
  6: { moves: 26, colors: 5, layout: L(`
    ........
    ........
    ........
    ........
    cc....cc
    ........
    ..cccc..
    ........
    ........`),
    intro: ['gabbah', 'Casse di birra in mezzo al sentiero! Si aprono come i sassi: fai i tris lì accanto. Peccato sprecarle.'] },
  7: { moves: 27, colors: 5, tiles: [[2, 12]], layout: L(`
    ........
    ........
    .k....k.
    ..k..k..
    ...kk...
    ..k..k..
    .k....k.
    ........
    ........`),
    intro: ['renard', 'Qualcuno ha incatenato i pezzi del garage! Non si spostano, ma se li metti in un tris la catena salta.'] },
  8: { moves: 26, colors: 5, layout: L(`
    ###..###
    ##....##
    #.mmmm.#
    .mMMMMm.
    .mMMMMm.
    .mMMMMm.
    #.mmmm.#
    ##....##
    ###..###`),
    intro: ['mirco', 'Fango profondo, quello col <b>2</b>: va pulito due volte. Io aspetto all\'asciutto.'] },
  9: { moves: 26, colors: 5, layout: L(`
    ........
    ........
    ........
    ...tt...
    ...tt...
    ........
    ........
    ........
    ........`),
    intro: ['forestale', 'Vi ho lasciato qualche <b>multa</b>. Se in un turno non ne togliete nessuna, se ne aggiunge un\'altra. Buon divertimento!'] },
  10: { moves: 26, colors: 5, boss: { hp: 170, every: 5 }, layout: L(`
    ........
    ........
    r......r
    ........
    ...rr...
    ........
    r......r
    ........
    ........`),
    intro: ['forestale', 'Libretto, assicurazione e patente. E quella gomma lì è omologata?'] },
  11: { moves: 26, colors: 5, layout: L(`
    #mmmmmm#
    mm....mm
    m......m
    m......m
    m......m
    m......m
    m......m
    mm....mm
    #mmmmmm#`),
    intro: ['costa', 'Il fango ha circondato la mia bancarella! Pulisci tutto il bordo, che il pesce deve restare fresco.'] },
  12: { moves: 27, colors: 5, tiles: [[0, 18]], layout: L(`
    ........
    ........
    CC....CC
    ........
    ...CC...
    ........
    cc....cc
    ........
    ........`),
    intro: ['gabbah', 'Casse doppie: ci vogliono due colpi. E intanto raccogli le birre, che stasera si festeggia.'] },
  13: { moves: 29, colors: 6, layout: L(`
    ........
    .mmmmmm.
    .mkmmkm.
    .mmmmmm.
    ...kk...
    .mmmmmm.
    .mkmmkm.
    .mmmmmm.
    ........`),
    intro: ['purcello', 'Fango e catene insieme. Ce la fai da solo o ti serve la spinta?'] },
  14: { moves: 26, colors: 6, layout: L(`
    ........
    .r....r.
    ........
    ..t..t..
    ........
    ..t..t..
    ........
    .r....r.
    ........`),
    intro: ['forestale', 'Multe e sassi, il mio menù preferito. Se lasciate correre, le multe si moltiplicano.'] },
  15: { moves: 27, colors: 6, boss: { hp: 190, every: 4 }, layout: L(`
    ........
    ........
    ........
    cc....cc
    ........
    ..cccc..
    ........
    ........
    ........`),
    intro: ['forestale', 'Ho sequestrato le vostre casse di birra. E ora tiro sassi ogni 4 mosse!'] },
  16: { moves: 28, colors: 6, layout: L(`
    ........
    .m....m.
    ........
    ..MMMM..
    ...MM...
    ..MMMM..
    ........
    ........
    mmmmmmmm`),
    intro: ['mirco', 'Questo è il sentiero dopo tre giorni di pioggia. Buona fortuna, io resto in tenda.'] },
  17: { moves: 24, colors: 6, tiles: [[4, 16], [5, 16]], layout: L(`
    ###..###
    ##....##
    #......#
    ........
    ........
    ........
    #......#
    ##....##
    ###..###`),
    intro: ['renard', 'Mi servono gomme e stivali per il garage. Tante. Tranquillo, te li pago... prima o poi.'] },
  18: { moves: 30, colors: 6, layout: L(`
    ........
    .CCCCCC.
    .C....C.
    .C.kk.C.
    .C.kk.C.
    .C....C.
    .CCCCCC.
    ........
    ........`),
    intro: ['gabbah', 'Il forte delle casse! Dentro ci sono i pezzi incatenati. Sfondalo e libera tutto.'] },
  19: { moves: 32, colors: 6, layout: L(`
    ##mmmm##
    #m....m#
    .r.tt.r.
    ...kk...
    m.c..c.m
    ...kk...
    .r....r.
    #m....m#
    ##mmmm##`),
    intro: ['miti', 'Un po\' di tutto: fango, sassi, casse, catene e pure una multa. Io riprendo, tu spacca.'] },
  20: { moves: 28, colors: 6, boss: { hp: 220, every: 4 }, layout: L(`
    ........
    ........
    ........
    ..t..t..
    ........
    ........
    .r....r.
    ........
    ........`),
    intro: ['forestale', 'Ancora voi? Oggi ho il blocchetto nuovo, ancora da inaugurare. E pure le multe che si allargano!'] },
};

const BOSS_LINES = [
  'Marmitta aperta in zona protetta? Questa la scrivo in stampatello.',
  'Vi ho visto dal binocolo. Anche quando nascondevate la birra.',
  'Qui i cinghiali dormono. Spegnete quei motori o arrivano i sassi!',
  'Libretto, assicurazione e patente. E quella gomma lì è omologata?',
];

// obiettivi calcolati dal disegno della griglia
function goalsFrom(layout = [], tiles = []) {
  const all = layout.join('');
  const cnt = (re) => (all.match(re) || []).length;
  const goals = tiles.map(([t, n]) => ({ type: 'tile', t, n }));
  const mud = cnt(/m/g) + cnt(/M/g) * 2;
  if (mud) goals.push({ type: 'mud', n: mud });
  const rock = cnt(/r/g) + cnt(/R/g);
  if (rock) goals.push({ type: 'rock', n: rock });
  const crate = cnt(/[cC]/g);
  if (crate) goals.push({ type: 'crate', n: crate });
  const chain = cnt(/k/g);
  if (chain) goals.push({ type: 'chain', n: chain });
  const multa = cnt(/t/g);
  if (multa) goals.push({ type: 'multa', n: multa });
  return goals;
}

export function getLevel(n) {
  const lv0 = baseLevel(n);
  if (BALANCE[n]) lv0.moves = BALANCE[n];
  return lv0;
}

// mosse calibrate con il simulatore (tools/tune.mjs)
const BALANCE = {1: 20, 2: 20, 3: 20, 4: 16, 5: 18, 6: 16, 7: 16, 8: 18, 9: 16, 10: 16, 11: 26, 12: 16, 13: 29, 14: 26, 15: 24, 16: 30, 17: 20, 18: 34, 19: 36, 20: 28, 21: 16, 22: 26, 23: 16, 24: 27, 25: 26, 26: 23, 27: 17, 28: 36, 29: 16, 30: 28, 31: 36, 32: 21, 33: 36, 34: 27, 35: 30, 36: 32, 37: 16, 38: 23, 39: 24, 40: 34, 41: 29, 42: 29, 43: 16, 44: 28, 45: 27, 46: 31, 47: 23, 48: 30, 49: 25, 50: 36, 51: 17, 52: 30, 53: 26, 54: 27, 55: 34, 56: 28, 57: 31, 58: 24, 59: 28, 60: 34};

function baseLevel(n) {
  if (HAND[n]) {
    const h = HAND[n];
    const lv = { n, moves: h.moves, colors: h.colors, layout: h.layout, boss: h.boss };
    lv.goals = h.boss ? [{ type: 'boss', n: h.boss.hp }] : goalsFrom(h.layout, h.tiles);
    if (h.boss) { const extra = goalsFrom(h.layout).filter((g) => g.type === 'multa'); lv.goals.push(...extra); }
    lv.intro = { who: h.intro[0], text: h.intro[1] };
    return lv;
  }
  const rng = makeRng(n * 7919 + 13);
  const tier = Math.floor((n - 1) / 5);
  const isBoss = n % 5 === 0;
  const colors = 6;
  if (isBoss) {
    const hp = 220 + (tier - 3) * 15;
    const layout = makeLayout(rng, tier, rng() < 0.5 ? 'rock' : 'crate', false);
    return {
      n, moves: 28, colors, boss: { hp, every: 4 },
      goals: [{ type: 'boss', n: hp }], layout,
      intro: { who: 'forestale', text: BOSS_LINES[tier % BOSS_LINES.length] },
    };
  }
  const kinds = ['mud', 'rock', 'crate', 'chain', 'multa', 'mud+rock', 'mud+chain', 'crate+multa', 'tile+mud', 'tile+crate'];
  const kind = kinds[Math.floor(rng() * kinds.length)];
  const layout = thin(makeLayout(rng, tier, kind, rng() < 0.5), rng, 18 + Math.min(tier, 6));
  const tiles = kind.includes('tile') ? [[Math.floor(rng() * colors), 16 + Math.min(tier, 6) * 2]] : [];
  const goals = goalsFrom(layout, tiles);
  const weight = goals.reduce((s, g) => s + (g.type === 'tile' ? g.n / 6 : g.type === 'mud' ? g.n / 5 : g.type === 'multa' ? 3 : g.n / 3), 0);
  const moves = Math.round(20 + weight * 0.9 + Math.min(tier, 4));
  return { n, moves: Math.min(moves, 34), colors, goals, layout };
}

// toglie ostacoli finché il livello non è troppo lungo da completare
function thin(layout, rng, maxWeight) {
  const G = layout.map((r) => r.split(''));
  const w = { m: 1 / 5, M: 2 / 5, r: 1 / 3, R: 1 / 3, c: 1 / 3, C: 1 / 3, k: 1 / 3, t: 0.5 };
  const weight = () => G.flat().reduce((s, ch) => s + (w[ch] || 0), 0) * 3.3;
  let guard = 0;
  while (weight() > maxWeight && guard++ < 200) {
    const cells = [];
    G.forEach((row, r) => row.forEach((ch, c) => { if (w[ch]) cells.push([r, c]); }));
    const [r, c] = cells[Math.floor(rng() * cells.length)];
    const ch = G[r][c];
    const c2 = 7 - c;
    const down = ch === 'M' ? 'm' : ch === 'R' ? 'r' : ch === 'C' ? 'c' : '.';
    G[r][c] = down; if (G[r][c2] === ch) G[r][c2] = down;
  }
  return G.map((r) => r.join(''));
}

function makeLayout(rng, tier, kind, holes) {
  const G = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
  if (holes) {
    const cut = 1 + Math.floor(rng() * 2);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const d = Math.min(r, ROWS - 1 - r) + Math.min(c, COLS - 1 - c);
      if (d < cut) G[r][c] = '#';
    }
  }
  const free = (r, c) => G[r][c] === '.';
  const sym = (r, c, ch) => { if (free(r, c)) G[r][c] = ch; const c2 = COLS - 1 - c; if (free(r, c2)) G[r][c2] = ch; };
  if (kind.includes('mud')) {
    const sh = ['blob', 'stripes', 'frame', 'checker'][Math.floor(rng() * 4)];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (!free(r, c)) continue;
      const cr = r - 4, cc = c - 3.5;
      let on = false;
      if (sh === 'blob') on = cr * cr / 9 + cc * cc / 8 < 1.0;
      if (sh === 'stripes') on = r % 4 === 1;
      if (sh === 'frame') on = r === 1 || r === ROWS - 2 || c === 0 || c === COLS - 1;
      if (sh === 'checker') on = (r + c) % 2 === 0 && r > 2 && r < ROWS - 2;
      if (on) G[r][c] = rng() < Math.min(0.3, 0.08 + tier * 0.03) ? 'M' : 'm';
    }
  }
  const scatter = (ch, n) => {
    for (let i = 0, g = 0; i < n && g < 200; g++) {
      const r = 1 + Math.floor(rng() * (ROWS - 2)), c = Math.floor(rng() * (COLS / 2));
      if (!free(r, c)) continue;
      sym(r, c, ch); i += 2;
    }
  };
  if (kind.includes('rock')) scatter(rng() < 0.4 ? 'R' : 'r', 6 + Math.min(tier, 3));
  if (kind.includes('crate')) scatter(rng() < 0.45 ? 'C' : 'c', 6 + Math.min(tier, 3));
  if (kind.includes('chain')) scatter('k', 6 + Math.min(tier, 4));
  if (kind.includes('multa')) { G[4][3] = G[4][4] = 't'; if (tier > 5) G[2][3] = G[2][4] = 't'; }
  return G.map((row) => row.join(''));
}

export const MAX_LEVEL = 60;
