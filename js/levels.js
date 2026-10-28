// EDT Kingdom — livelli
import { makeRng, ROWS, COLS } from './engine.js';

// Layout: '.' normale, m/M fango (1/2 strati), r/R roccia (1/2 colpi)
const HAND = {
  1: { moves: 20, colors: 5, goals: [{ type: 'tile', t: 0, n: 12 }],
    intro: { who: 'gabbah', text: 'Benvenuto al Campo Base EDT! Allinea 3 birre per raccoglierle. Tranquillo, è un giro easy.' } },
  2: { moves: 20, colors: 5, goals: [{ type: 'tile', t: 1, n: 14 }, { type: 'tile', t: 3, n: 10 }],
    intro: { who: 'miti', text: 'Allinea 4 tessere e ti esce una MOTO: sfreccia e spazza via una riga intera!' } },
  3: { moves: 25, colors: 5, goals: [{ type: 'mud', n: 16 }],
    layout: ['........', '........', '........', '..mmmm..', '.mmmmmm.', '.mmmmmm.', '..mmmm..', '........', '........'],
    intro: { who: 'mirco', text: 'Fango ovunque! Fai match sopra al fango per pulirlo. Io intanto... campa giù.' } },
  4: { moves: 25, colors: 5, goals: [{ type: 'rock', n: 8 }],
    layout: ['........', '........', 'r..rr..r', '........', '........', '.r.rr.r.', '........', '........', '........'],
    intro: { who: 'purcello', text: 'Sassi in mezzo al sentiero: fai match ACCANTO ai sassi per spaccarli. Se ti pianti, ti spingo io da dietro!' } },
  5: { moves: 24, colors: 5, boss: { hp: 150, every: 5 }, goals: [{ type: 'boss', n: 150 }],
    intro: { who: 'forestale', text: 'ALT! Forestale. Questo sentiero è chiuso. Chi passa prende la multa... e io lancio SASSI ogni 5 mosse!' } },
};

const BOSS_LINES = [
  'Libretto e assicurazione, prego.',
  'Silenziatore omologato? Non mi pare.',
  'Qui è zona protetta: niente sgasate!',
  'Vi ho visti, eh. Anche dietro la birra.',
  'Ancora voi? Stavolta vi faccio la multa doppia.',
];

export function getLevel(n) {
  if (HAND[n]) return { n, ...HAND[n] };
  const rng = makeRng(n * 7919 + 13);
  const tier = Math.floor((n - 1) / 5);
  const isBoss = n % 5 === 0;
  const colors = n < 12 ? 5 : 6;
  if (isBoss) {
    const hp = 140 + tier * 20;
    const layout = makeLayout(rng, tier, rng() < 0.5 ? 'rock' : 'none');
    return {
      n, moves: 24 + Math.min(tier, 4), colors, boss: { hp, every: Math.max(3, 5 - Math.floor(tier / 2)) },
      goals: [{ type: 'boss', n: hp }], layout,
      intro: { who: 'forestale', text: BOSS_LINES[tier % BOSS_LINES.length] },
    };
  }
  const kinds = ['tile', 'mud', 'rock', 'tile+mud', 'tile+rock', 'mud+rock'];
  const kind = kinds[Math.floor(rng() * kinds.length)];
  const goals = [];
  let layoutKind = 'none';
  if (kind.includes('mud')) layoutKind = 'mud';
  if (kind.includes('rock')) layoutKind = layoutKind === 'mud' ? 'both' : 'rock';
  const layout = makeLayout(rng, tier, layoutKind);
  const countMud = layout.join('').split('').reduce((s, ch) => s + (ch === 'm' ? 1 : ch === 'M' ? 2 : 0), 0);
  const countRock = layout.join('').split('').filter((ch) => ch === 'r' || ch === 'R').length;
  if (kind.includes('tile')) {
    const t = Math.floor(rng() * colors);
    goals.push({ type: 'tile', t, n: 14 + tier * 3 });
    if (kind === 'tile') goals.push({ type: 'tile', t: (t + 2) % colors, n: 12 + tier * 3 });
  }
  if (countMud) goals.push({ type: 'mud', n: countMud });
  if (countRock) goals.push({ type: 'rock', n: countRock });
  const moves = 20 + Math.round(countMud / 6) + Math.round(countRock / 4) + Math.min(tier, 3);
  return { n, moves, colors, goals, layout };
}

function makeLayout(rng, tier, kind) {
  const L = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
  if (kind === 'mud' || kind === 'both') {
    const shapes = ['blob', 'stripes', 'frame', 'checker'];
    const sh = shapes[Math.floor(rng() * shapes.length)];
    const deep = tier >= 2;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      let on = false;
      const cr = r - 4, cc = c - 3.5;
      if (sh === 'blob') on = cr * cr / 9 + cc * cc / 8 < 1.2;
      if (sh === 'stripes') on = r % 3 === 1;
      if (sh === 'frame') on = r === 1 || r === ROWS - 2 || c === 0 || c === COLS - 1;
      if (sh === 'checker') on = (r + c) % 2 === 0 && r > 1 && r < ROWS - 1;
      if (on) L[r][c] = deep && rng() < 0.35 ? 'M' : 'm';
    }
  }
  if (kind === 'rock' || kind === 'both') {
    const nRocks = 6 + Math.min(tier, 4) * 2;
    let placed = 0, guard = 0;
    while (placed < nRocks && guard++ < 200) {
      const r = 1 + Math.floor(rng() * (ROWS - 2));
      const c = Math.floor(rng() * COLS);
      if (L[r][c] !== '.') continue;
      // simmetria per un look più "disegnato"
      const c2 = COLS - 1 - c;
      const ch = tier >= 2 && rng() < 0.4 ? 'R' : 'r';
      L[r][c] = ch; placed++;
      if (L[r][c2] === '.' && placed < nRocks) { L[r][c2] = ch; placed++; }
    }
  }
  return L.map((row) => row.join(''));
}

export const MAX_LEVEL = 60;
