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
    MMMMMMMM
    M......M
    M.mmmm.M
    M.m..m.M
    M.m..m.M
    M.m..m.M
    M.mmmm.M
    M......M
    MMMMMMMM`),
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
    #mm..mm#
    mr.tt.rm
    m..kk..m
    m.c..c.m
    m..kk..m
    mr....rm
    #mm..mm#
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
  const layout = makeLayout(rng, tier, kind, rng() < 0.5);
  const tiles = kind.includes('tile') ? [[Math.floor(rng() * colors), 16 + Math.min(tier, 6) * 2]] : [];
  const goals = goalsFrom(layout, tiles);
  const weight = goals.reduce((s, g) => s + (g.type === 'tile' ? g.n / 6 : g.type === 'mud' ? g.n / 5 : g.type === 'multa' ? 3 : g.n / 3), 0);
  const moves = Math.round(20 + weight * 0.9 + Math.min(tier, 4));
  return { n, moves: Math.min(moves, 34), colors, goals, layout };
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
      if (sh === 'blob') on = cr * cr / 9 + cc * cc / 8 < 1.2;
      if (sh === 'stripes') on = r % 3 === 1;
      if (sh === 'frame') on = r === 1 || r === ROWS - 2 || c === 0 || c === COLS - 1;
      if (sh === 'checker') on = (r + c) % 2 === 0 && r > 1 && r < ROWS - 1;
      if (on) G[r][c] = rng() < 0.4 ? 'M' : 'm';
    }
  }
  const scatter = (ch, n) => {
    for (let i = 0, g = 0; i < n && g < 200; g++) {
      const r = 1 + Math.floor(rng() * (ROWS - 2)), c = Math.floor(rng() * (COLS / 2));
      if (!free(r, c)) continue;
      sym(r, c, ch); i += 2;
    }
  };
  if (kind.includes('rock')) scatter(rng() < 0.5 ? 'R' : 'r', 6 + Math.min(tier, 4));
  if (kind.includes('crate')) scatter(rng() < 0.6 ? 'C' : 'c', 6 + Math.min(tier, 4));
  if (kind.includes('chain')) scatter('k', 8 + Math.min(tier, 4));
  if (kind.includes('multa')) { G[4][3] = G[4][4] = 't'; if (tier > 5) G[2][3] = G[2][4] = 't'; }
  return G.map((row) => row.join(''));
}

export const MAX_LEVEL = 60;
