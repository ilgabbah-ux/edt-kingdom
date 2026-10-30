// EDT Kingdom — livelli
import { L } from './i18n.js';
import { makeRng, ROWS, COLS } from './engine.js';

// Layout (9 righe x 8 colonne):
// '.' normale   '#' casella vuota (fuori griglia)
// m/M fango (1/2 strati)   r/R sasso (1/2 colpi)   c/C cassa di birra (1/2 colpi)
// k tessera incatenata   t multa della Forestale (si allarga!)
const LY = (s) => s.trim().split('\n').map((x) => x.trim());

const HAND = {
  1: { moves: 20, colors: 5, tiles: [[0, 12]],
    intro: ['gabbah', L`Primo giro: metti in fila 3 birre uguali e sono tue. Tranquillo, è un giro easy.`] },
  2: { moves: 20, colors: 5, tiles: [[1, 14], [3, 10]], layout: LY(`
    ##....##
    #......#
    ........
    ........
    ........
    ........
    ........
    #......#
    ##....##`),
    intro: ['miti', L`Metti in fila 4 tessere e ti esce una <b>moto</b>: parte a manetta e si porta via tutta la riga.`] },
  3: { moves: 24, colors: 5, layout: LY(`
    ........
    ........
    ........
    ..mmmm..
    .mmmmmm.
    .mmmmmm.
    ..mmmm..
    ........
    ........`),
    intro: ['mirco', L`Qui è tutto fango. Fai i tris sopra le pozze per pulirle. Io vi guardo da qui... campa giù.`] },
  4: { moves: 25, colors: 5, layout: LY(`
    ........
    ........
    r..rr..r
    ........
    ........
    .r.rr.r.
    ........
    ........
    ........`),
    intro: ['purcello', L`Sassi in mezzo al sentiero! Fai i tris <b>accanto</b> ai sassi per spaccarli. E se ti pianti, arrivo io da dietro.`] },
  5: { moves: 24, colors: 5, boss: { hp: 150, every: 5 },
    intro: ['forestale', L`Alt! Forestale. Sentiero chiuso. Ogni 5 mosse vi tiro un sasso in mezzo ai piedi, e poi vi faccio pure la multa.`] },
  6: { moves: 26, colors: 5, layout: LY(`
    ........
    ........
    ........
    ........
    cc....cc
    ........
    ..cccc..
    ........
    ........`),
    intro: ['gabbah', L`Casse di birra in mezzo al sentiero! Si aprono come i sassi: fai i tris lì accanto. Peccato sprecarle.`] },
  7: { moves: 27, colors: 5, tiles: [[2, 12]], layout: LY(`
    ........
    ........
    .k....k.
    ..k..k..
    ...kk...
    ..k..k..
    .k....k.
    ........
    ........`),
    intro: ['renard', L`Qualcuno ha incatenato i pezzi del garage! Non si spostano, ma se li metti in un tris la catena salta.`] },
  8: { moves: 26, colors: 5, layout: LY(`
    ###..###
    ##....##
    #.mmmm.#
    .mMMMMm.
    .mMMMMm.
    .mMMMMm.
    #.mmmm.#
    ##....##
    ###..###`),
    intro: ['mirco', L`Fango profondo, quello col <b>2</b>: va pulito due volte. Io aspetto all'asciutto.`] },
  9: { moves: 26, colors: 5, layout: LY(`
    ........
    ........
    ........
    ...tt...
    ...tt...
    ........
    ........
    ........
    ........`),
    intro: ['forestale', L`Vi ho lasciato qualche <b>multa</b>. Se in un turno non ne togliete nessuna, se ne aggiunge un'altra. Buon divertimento!`] },
  10: { moves: 26, colors: 5, boss: { hp: 170, every: 5 }, layout: LY(`
    ........
    ........
    r......r
    ........
    ...rr...
    ........
    r......r
    ........
    ........`),
    intro: ['forestale', L`Libretto, assicurazione e patente. E quella gomma lì è omologata?`] },
  11: { moves: 26, colors: 5, layout: LY(`
    #mmmmmm#
    mm....mm
    m......m
    m......m
    m......m
    m......m
    m......m
    mm....mm
    #mmmmmm#`),
    intro: ['costa', L`Il fango ha circondato la mia bancarella! Pulisci tutto il bordo, che il pesce deve restare fresco.`] },
  12: { moves: 27, colors: 5, tiles: [[0, 18]], layout: LY(`
    ........
    ........
    CC....CC
    ........
    ...CC...
    ........
    cc....cc
    ........
    ........`),
    intro: ['gabbah', L`Casse doppie: ci vogliono due colpi. E intanto raccogli le birre, che stasera si festeggia.`] },
  13: { moves: 29, colors: 6, layout: LY(`
    ........
    .mmmmmm.
    .mkmmkm.
    .mmmmmm.
    ...kk...
    .mmmmmm.
    .mkmmkm.
    .mmmmmm.
    ........`),
    intro: ['purcello', L`Fango e catene insieme. Ce la fai da solo o ti serve la spinta?`] },
  14: { moves: 26, colors: 6, layout: LY(`
    ........
    .r....r.
    ........
    ..t..t..
    ........
    ..t..t..
    ........
    .r....r.
    ........`),
    intro: ['forestale', L`Multe e sassi, il mio menù preferito. Se lasciate correre, le multe si moltiplicano.`] },
  15: { moves: 27, colors: 6, boss: { hp: 190, every: 4 }, layout: LY(`
    ........
    ........
    ........
    cc....cc
    ........
    ..cccc..
    ........
    ........
    ........`),
    intro: ['forestale', L`Ho sequestrato le vostre casse di birra. E ora tiro sassi ogni 4 mosse!`] },
  16: { moves: 28, colors: 6, layout: LY(`
    ........
    .m....m.
    ........
    ..MMMM..
    ...MM...
    ..MMMM..
    ........
    ........
    mmmmmmmm`),
    intro: ['mirco', L`Questo è il sentiero dopo tre giorni di pioggia. Buona fortuna, io resto in tenda.`] },
  17: { moves: 24, colors: 6, tiles: [[4, 16], [5, 16]], layout: LY(`
    ###..###
    ##....##
    #......#
    ........
    ........
    ........
    #......#
    ##....##
    ###..###`),
    intro: ['renard', L`Mi servono gomme e stivali per il garage. Tante. Tranquillo, te li pago... prima o poi.`] },
  18: { moves: 30, colors: 6, layout: LY(`
    ........
    .CCCCCC.
    .C....C.
    .C.kk.C.
    .C.kk.C.
    .C....C.
    .CCCCCC.
    ........
    ........`),
    intro: ['gabbah', L`Il forte delle casse! Dentro ci sono i pezzi incatenati. Sfondalo e libera tutto.`] },
  19: { moves: 32, colors: 6, layout: LY(`
    ##mmmm##
    #m....m#
    .r.tt.r.
    ...kk...
    m.c..c.m
    ...kk...
    .r....r.
    #m....m#
    ##mmmm##`),
    intro: ['miti', L`Un po' di tutto: fango, sassi, casse, catene e pure una multa. Io riprendo, tu spacca.`] },
  20: { moves: 28, colors: 6, boss: { hp: 220, every: 4 }, layout: LY(`
    ........
    ........
    ........
    ..t..t..
    ........
    ........
    .r....r.
    ........
    ........`),
    intro: ['forestale', L`Ancora voi? Oggi ho il blocchetto nuovo, ancora da inaugurare. E pure le multe che si allargano!`] },
};

const BOSS_LINES = [
  L`Marmitta aperta in zona protetta? Questa la scrivo in stampatello.`,
  L`Vi ho visto dal binocolo. Anche quando nascondevate la birra.`,
  L`Qui i cinghiali dormono. Spegnete quei motori o arrivano i sassi!`,
  L`Libretto, assicurazione e patente. E quella gomma lì è omologata?`,
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
  const velox = cnt(/v/g);
  if (velox) goals.push({ type: 'velox', n: velox });
  const gomme = cnt(/g/g);
  if (gomme) goals.push({ type: 'gomme', n: gomme });
  const mug = cnt(/b/g);
  if (mug) goals.push({ type: 'mug', n: mug });
  return goals;
}

// livelli difficili (come in Royal Match): uno ogni 10, segnati in rosso e pagati il doppio
const HARD = new Set([17, 27, 37, 47, 56, 66, 79, 87, 98, 107, 117, 127, 137, 147, 157, 168, 177]);
export const isHard = (n) => HARD.has(n);
export function getLevel(n) {
  const lv0 = baseLevel(n);
  if (BALANCE[n]) lv0.moves = BALANCE[n];
  lv0.hard = isHard(n);
  return lv0;
}

// mosse calibrate con il simulatore (tools/tune.mjs)
const BALANCE = {1: 20, 2: 20, 3: 20, 4: 16, 5: 18, 6: 16, 7: 16, 8: 18, 9: 16, 10: 16, 11: 26, 12: 19, 13: 29, 14: 26, 15: 24, 16: 30, 17: 20, 18: 34, 19: 39, 20: 28, 21: 16, 22: 26, 23: 16, 24: 30, 25: 26, 26: 23, 27: 19, 28: 36, 29: 16, 30: 28, 31: 34, 32: 20, 33: 28, 34: 29, 35: 30, 36: 28, 37: 25, 38: 23, 39: 15, 40: 30, 41: 15, 42: 27, 43: 29, 44: 29, 45: 35, 46: 31, 47: 21, 48: 36, 49: 26, 50: 33, 51: 17, 52: 23, 53: 22, 54: 21, 55: 36, 56: 21, 57: 15, 58: 29, 59: 15, 60: 37, 61: 25, 62: 26, 63: 28, 64: 23, 65: 34, 66: 21, 67: 34, 68: 35, 69: 25, 70: 37, 71: 15, 72: 20, 73: 30, 74: 28, 75: 36, 76: 24, 77: 15, 78: 15, 79: 19, 80: 38, 81: 31, 82: 15, 83: 25, 84: 40, 85: 40, 86: 33, 87: 30, 88: 22, 89: 40, 90: 42};  // ritoccate (ott. 2026) dove i giocatori normali perdevano troppo

const BOSS_LINES3 = [
  L`Cantiere chiuso! Caschetto, giubbino arancione e un blocchetto nuovo di zecca.`,
  L`In cava si va a passo d'uomo. Voi andate a passo di moto: multa!`,
  L`Ho chiamato anche i rinforzi. Sono io, con un altro cappello.`,
  L`Qui ogni sasso è sotto sequestro. E presto anche voi.`,
];
const BOSS_LINES2 = [
  L`Quassù comanda la Forestale d'alta quota. Gomme da neve? Senza, è multa!`,
  L`Ho le ciaspole, il fischietto e un blocchetto nuovo. Fate i bravi.`,
  L`Il ghiaccio è dalla mia parte. Vediamo quanto scivolate.`,
  L`Al Passo i limiti li decido io. E sono bassissimi.`,
];
const BOSS_LINES4 = [
  L`Sono in vacanza, ma il blocchetto me lo porto sempre dietro.`,
  L`Nel deserto il limite è 30 all'ora. Anche per i cammelli.`,
  L`Ho messo autovelox dietro ogni duna. Sorridete!`,
  L`Mio cugino al Passo vi saluta. E vi fa la multa.`,
];
// zona 4, il Marocco: sabbia (k), acqua che si allarga (t), autovelox (v), gomme (g), fusti da portare giù (d), livelli a tempo
function moroccoLevel(n, rng, tier) {
  const colors = 6;
  const pick = ['sand', 'velox', 'drop', 'time', 'gomme', 'water', 'velox+sand', 'drop+sand', 'gomme+mud', 'time', 'drop', 'velox+gomme'];
  const FIRST = { 91: 'sand', 92: 'velox', 93: 'drop', 94: 'time', 96: 'gomme', 97: 'water' };   // ogni novità da sola, la prima volta
  const kind = FIRST[n] || pick[(n * 5 + Math.floor(rng() * 3)) % pick.length];
  if (kind === 'time') {
    const a = Math.floor(rng() * colors), b2 = (a + 1 + Math.floor(rng() * (colors - 1))) % colors;
    const layout = thin(makeLayout(rng, tier, rng() < .5 ? 'mud' : 'chain', rng() < .4), rng, 10);
    const goals = [{ type: 'tile', t: a, n: 22 + Math.min(tier, 6) }, { type: 'tile', t: b2, n: 22 + Math.min(tier, 6) }, ...goalsFrom(layout)];
    return { n, moves: 999, time: 105 + goals.length * 10, colors, goals, layout };
  }
  const base = kind.includes('sand') ? 'chain' : kind.includes('water') ? 'multa' : kind.includes('mud') ? 'mud' : '';
  const G = makeLayout(rng, tier, base || 'none', rng() < 0.45).map((r) => r.split(''));
  const free = (r, c) => G[r][c] === '.';
  const sym = (r, c, ch) => { if (free(r, c)) G[r][c] = ch; if (free(r, 7 - c)) G[r][7 - c] = ch; };
  if (kind.includes('velox')) for (let i = 0, g = 0; i < 2 + (tier > 20 ? 1 : 0) && g < 80; g++) { const r = 2 + Math.floor(rng() * 5), c = Math.floor(rng() * 4); if (free(r, c)) { sym(r, c, 'v'); i++; } }
  if (kind.includes('gomme')) for (let i = 0, g = 0; i < 2 && g < 80; g++) { const r = 2 + Math.floor(rng() * 5), c = 1 + Math.floor(rng() * 3); if (free(r, c)) { sym(r, c, 'g'); i++; } }
  let drops = 0;
  if (kind.includes('drop')) {
    for (const c of [2, 5]) { for (let r = 0; r < 2; r++) if (G[r][c] === '#') G[r][c] = '.'; G[0][c] = 'd'; }
    for (let c = 0; c < 8; c++) if (G[8][c] === '#') G[8][c] = '.';   // il fondo deve essere aperto
    drops = 4 + Math.min(2, Math.floor((n - 90) / 10));
  }
  let layout = G.map((r) => r.join(''));
  layout = thin(layout, rng, 18);
  const goals = goalsFrom(layout);
  if (drops) goals.unshift({ type: 'drop', n: drops });
  // pesi ritarati col simulatore (ott. 2026): i fusti sono duri, autovelox/gomme/acqua erano troppo facili
  const weight = goals.reduce((s2, g) => s2 + (g.type === 'drop' ? g.n * 3.6 : g.type === 'mud' ? g.n / 5 : g.type === 'multa' ? 0 : g.type === 'velox' ? g.n * 1.0 : g.type === 'gomme' ? g.n * 0.5 : g.n / 3), 0);
  const moves = Math.round(17 + weight * 0.9 + 3);
  return { n, moves: Math.min(moves, drops ? 44 : 38), colors, goals, layout, drops };
}
// Oktoberfest (121+): festoni (k), conti da pagare (t), boccali da riempire (b), fusti (d), livelli a tempo
function oktoberLevel(n, rng, tier) {
  const colors = 6;
  const pick = ['mug', 'garland', 'mug+mud', 'bill', 'drop', 'time', 'mug+garland', 'crate+bill', 'drop+garland', 'mug', 'time', 'mug+crate'];
  const FIRST = { 121: 'garland', 122: 'mug', 123: 'bill' };
  const kind = FIRST[n] || pick[(n * 7 + Math.floor(rng() * 3)) % pick.length];
  if (kind === 'time') {
    const a = Math.floor(rng() * colors), b2 = (a + 2) % colors;
    const layout = thin(makeLayout(rng, tier, rng() < .5 ? 'mud' : 'chain', rng() < .4), rng, 10);
    const goals = [{ type: 'tile', t: a, n: 24 + Math.min(tier, 6) }, { type: 'tile', t: b2, n: 24 + Math.min(tier, 6) }, ...goalsFrom(layout)];
    return { n, moves: 999, time: 105 + goals.length * 10, colors, goals, layout };
  }
  const base = kind.includes('garland') ? 'chain' : kind.includes('bill') ? 'multa' : kind.includes('mud') ? 'mud' : kind.includes('crate') ? 'crate' : '';
  const G = makeLayout(rng, tier, base || 'none', rng() < 0.45).map((r) => r.split(''));
  const free = (r, c) => G[r][c] === '.';
  const sym = (r, c, ch) => { if (free(r, c)) G[r][c] = ch; if (free(r, 7 - c)) G[r][7 - c] = ch; };
  if (kind.includes('mug')) for (let i = 0, g = 0; i < 2 + (tier > 26 ? 1 : 0) && g < 80; g++) { const r = 2 + Math.floor(rng() * 5), c = Math.floor(rng() * 4); if (free(r, c)) { sym(r, c, 'b'); i++; } }
  let drops = 0;
  if (kind.includes('drop')) {
    for (const c of [2, 5]) { for (let r = 0; r < 2; r++) if (G[r][c] === '#') G[r][c] = '.'; G[0][c] = 'd'; }
    for (let c = 0; c < 8; c++) if (G[8][c] === '#') G[8][c] = '.';
    drops = 4 + Math.min(2, Math.floor((n - 120) / 10));
  }
  let layout = thin(G.map((r) => r.join('')), rng, 18);
  const goals = goalsFrom(layout);
  if (drops) goals.unshift({ type: 'drop', n: drops });
  const weight = goals.reduce((s2, g) => s2 + (g.type === 'drop' ? g.n * 3.6 : g.type === 'mud' ? g.n / 5 : g.type === 'multa' ? 0 : g.type === 'mug' ? g.n * 1.2 : g.n / 3), 0);
  const moves = Math.round(18 + weight * 0.9 + 3);
  return { n, moves: Math.min(moves, drops ? 44 : 38), colors, goals, layout, drops };
}
const BOSS_LINES5 = [
  L`Ozapft is! E anche la multa è servita.`,
  L`Lederhosen, piuma sul cappello e blocchetto nuovo. Prost!`,
  L`Qui si canta, si beve e si paga. Soprattutto si paga.`,
  L`Il tendone è mio. Voi state fuori, in fila, a pagare.`,
];
// Halloween nel bosco (151+): ragnatele (k), pozioni che si allargano (t), zucche (r), bare (c), fango, fusti, livelli a tempo
function halloLevel(n, rng, tier) {
  const colors = 6;
  const pick = ['web', 'pumpkin', 'potion', 'web+mud', 'coffin+potion', 'drop', 'time', 'pumpkin+web', 'coffin', 'drop+web', 'mud+pumpkin', 'time', 'coffin+web'];
  const FIRST = { 151: 'web', 152: 'pumpkin', 153: 'potion', 154: 'coffin' };
  const kind = FIRST[n] || pick[(n * 11 + Math.floor(rng() * 3)) % pick.length];
  if (kind === 'time') {
    const a = Math.floor(rng() * colors), b2 = (a + 3) % colors;
    const layout = thin(makeLayout(rng, tier, rng() < .5 ? 'mud' : 'chain', rng() < .4), rng, 10);
    const goals = [{ type: 'tile', t: a, n: 25 + Math.min(tier, 6) }, { type: 'tile', t: b2, n: 25 + Math.min(tier, 6) }, ...goalsFrom(layout)];
    return { n, moves: 999, time: 105 + goals.length * 10, colors, goals, layout };
  }
  const base = [kind.includes('web') ? 'chain' : '', kind.includes('potion') ? 'multa' : '', kind.includes('mud') ? 'mud' : '', kind.includes('pumpkin') ? 'rock' : '', kind.includes('coffin') ? 'crate' : ''].filter(Boolean).join('+') || 'none';
  const G = makeLayout(rng, tier, base, rng() < 0.45).map((r) => r.split(''));
  let drops = 0;
  if (kind.includes('drop')) {
    for (const c of [2, 5]) { for (let r = 0; r < 2; r++) if (G[r][c] === '#') G[r][c] = '.'; G[0][c] = 'd'; }
    for (let c = 0; c < 8; c++) if (G[8][c] === '#') G[8][c] = '.';
    drops = 4 + Math.min(2, Math.floor((n - 150) / 10));
  }
  let layout = thin(G.map((r) => r.join('')), rng, 18);
  const goals = goalsFrom(layout);
  if (drops) goals.unshift({ type: 'drop', n: drops });
  const weight = goals.reduce((s2, g) => s2 + (g.type === 'drop' ? g.n * 3.6 : g.type === 'mud' ? g.n / 5 : g.type === 'multa' ? 0 : g.n / 3), 0);
  const moves = Math.round(18 + weight * 0.9 + 3);
  return { n, moves: Math.min(moves, drops ? 44 : 38), colors, goals, layout, drops };
}
const BOSS_LINES6 = [
  L`Benvenuti nel mio bosco… la multa ve la firmo a mezzanotte!`,
  L`Dolcetto o scherzetto? Per voi solo scherzetto: multa!`,
  L`Ho dormito tutto il giorno nella bara. Adesso sono pieno di energia.`,
  L`I fantasmi lavorano per me. Anche loro hanno il blocchetto.`,
];
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
  if (n > 150 && !isBoss) return halloLevel(n, rng, tier);
  if (n > 120 && !isBoss) return oktoberLevel(n, rng, tier);
  if (n > 90 && !isBoss) return moroccoLevel(n, rng, tier);
  if (isBoss) {
    const hp = 220 + (tier - 3) * 15;
    const layout = makeLayout(rng, tier, n > 150 ? (rng() < 0.5 ? 'rock' : 'chain') : n > 120 ? (rng() < 0.5 ? 'crate' : 'chain') : n > 90 ? (rng() < 0.5 ? 'gomme' : 'chain') : rng() < 0.5 ? 'rock' : 'crate', false);
    return {
      n, moves: n > 90 ? 42 : 28, colors, boss: { hp, every: 4 },
      goals: [{ type: 'boss', n: hp }], layout,
      intro: n > 150 ? { who: 'forestale6', text: BOSS_LINES6[tier % BOSS_LINES6.length] } : n > 120 ? { who: 'forestale5', text: BOSS_LINES5[tier % BOSS_LINES5.length] } : n > 90 ? { who: 'forestale4', text: BOSS_LINES4[tier % BOSS_LINES4.length] } : n > 60 ? { who: 'forestale3', text: BOSS_LINES3[tier % BOSS_LINES3.length] } : n > 30 ? { who: 'forestale2', text: BOSS_LINES2[tier % BOSS_LINES2.length] } : { who: 'forestale', text: BOSS_LINES[tier % BOSS_LINES.length] },
    };
  }
  // al Passo (31+) il ghiaccio (k) è l'ostacolo di casa
  const kinds = n > 60
    ? ['chain', 'rock', 'crate', 'mud+chain', 'crate+multa', 'tile+crate', 'rock', 'chain', 'mud+rock', 'multa']
    : n > 30
    ? ['chain', 'mud+chain', 'chain', 'rock', 'tile+crate', 'mud+chain', 'multa', 'chain', 'crate+multa', 'tile+mud']
    : ['mud', 'rock', 'crate', 'chain', 'multa', 'mud+rock', 'mud+chain', 'crate+multa', 'tile+mud', 'tile+crate'];
  const kind = kinds[Math.floor(rng() * kinds.length)];
  const layout = thin(makeLayout(rng, tier, kind, rng() < 0.5), rng, n > 30 ? 17 : 18 + Math.min(tier, 6));
  const tiles = kind.includes('tile') ? [[Math.floor(rng() * colors), 16 + Math.min(tier, 6) * 2]] : [];
  const goals = goalsFrom(layout, tiles);
  const weight = goals.reduce((s, g) => s + (g.type === 'tile' ? g.n / 6 : g.type === 'mud' ? g.n / 5 : g.type === 'multa' ? 3 : g.n / 3), 0);
  const moves = Math.round(20 + weight * 0.9 + Math.min(tier, 4));
  return { n, moves: Math.min(moves, 34), colors, goals, layout };
}

// toglie ostacoli finché il livello non è troppo lungo da completare
function thin(layout, rng, maxWeight) {
  const G = layout.map((r) => r.split(''));
  const w = { m: 1 / 5, M: 2 / 5, r: 1 / 3, R: 1 / 3, c: 1 / 3, C: 1 / 3, k: 1 / 3, t: 0.5, v: 0.6, g: 0.5 };
  const weight = () => G.flat().reduce((s, ch) => s + (w[ch] || 0), 0) * 3.3;
  let guard = 0;
  while (weight() > maxWeight && guard++ < 200) {
    const cells = [];
    G.forEach((row, r) => row.forEach((ch, c) => { if (w[ch]) cells.push([r, c]); }));
    const [r, c] = cells[Math.floor(rng() * cells.length)];
    const ch = G[r][c];
    const c2 = 7 - c;
    const down = ch === 'M' ? 'm' : ch === 'R' ? 'r' : ch === 'C' ? 'c' : '.';
    if (ch === 'v' && cells.filter(([a, b]) => G[a][b] === 'v').length <= 2) break;   // almeno un paio di autovelox restano
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

export const MAX_LEVEL = 180;
