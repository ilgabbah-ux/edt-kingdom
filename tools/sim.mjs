// Simulatore senza grafica: un giocatore "goloso" prova tutte le mosse e sceglie la migliore.
// Serve per bilanciare il numero di mosse dei livelli.  Uso: node tools/sim.mjs [daLivello] [aLivello] [partite]
import { Board, ROWS, COLS, key, unkey, inside } from '../js/engine.js';
import { getLevel } from '../js/levels.js';

function clone(b) {
  const n = Object.create(Board.prototype);
  n.rng = Math.random; n.colors = b.colors;
  n.grid = b.grid.map((row) => row.map((t) => (t ? { ...t } : null)));
  n.mud = b.mud.map((r) => r.slice()); n.hole = b.hole; n.ticket = b.ticket.map((r) => r.slice());
  return n;
}

function credit(st, type, color = -1) {
  for (const gl of st.goals) {
    if (gl.done >= gl.n) continue;
    if (gl.type === type && (type !== 'tile' || gl.t === color)) gl.done++;
    if (gl.type === 'boss' && type !== 'boss') gl.done = Math.min(gl.n, gl.done + (type === 'tile' || type === 'mud' ? 1 : 2));
  }
}

function doClear(st, clear, matched, created, pre = []) {
  const b = st.board;
  const protect = new Set(created.map((x) => x.at));
  const trig = new Set(pre);
  let changed = true;
  while (changed) {
    changed = false;
    for (const k of [...clear]) {
      if (protect.has(k) || trig.has(k)) continue;
      const [r, c] = unkey(k); const t = b.grid[r][c];
      if (!t || !t.power) continue;
      trig.add(k);
      b.blast(t.power, r, c, st.goals).forEach((x) => clear.add(x));
      changed = true;
    }
  }
  const rockHits = new Set();
  for (const k of clear) { const [r, c] = unkey(k); if (b.grid[r][c]?.rock) rockHits.add(k); }
  for (const k of matched) {
    const [r, c] = unkey(k);
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr, cc = c + dc;
      if (inside(rr, cc) && b.grid[rr][cc]?.rock) rockHits.add(key(rr, cc));
    }
  }
  for (const k of rockHits) {
    const [r, c] = unkey(k); const t = b.grid[r][c];
    t.rock--;
    if (t.rock <= 0) { b.grid[r][c] = null; credit(st, t.kind === 'crate' ? 'crate' : 'rock'); } else credit(st, 'boss');
  }
  for (const k of clear) {
    const [r, c] = unkey(k); const t = b.grid[r][c];
    if (b.ticket[r][c]) { b.ticket[r][c] = 0; st.ticketCleared = true; credit(st, 'multa'); }
    if (!t || t.rock > 0) continue;
    if (rockHits.has(k)) continue;
    if (t.chain) { t.chain = false; credit(st, 'chain'); if (b.mud[r][c] > 0) { b.mud[r][c]--; credit(st, 'mud'); } continue; }
    if (protect.has(k)) credit(st, 'tile', t.color);
    else { if (t.color >= 0) credit(st, 'tile', t.color); else credit(st, 'boss'); b.grid[r][c] = null; }
    if (b.mud[r][c] > 0) { b.mud[r][c]--; credit(st, 'mud'); }
  }
  for (const cr of created) { const [r, c] = unkey(cr.at); const t = b.grid[r][c]; if (t) { t.power = cr.power; t.color = -1; } }
}

function resolve(st, pending = [], swapCells = []) {
  for (let step = 0; step < 40; step++) {
    const groups = st.board.findMatches(swapCells); swapCells = [];
    if (!groups.length && !pending.length) break;
    const clear = new Set(), matched = new Set(), created = [], pre = [];
    for (const g of groups) { g.cells.forEach((k) => { clear.add(k); matched.add(k); }); if (g.power) created.push({ at: g.at, power: g.power }); }
    for (const p of pending) { p.cells.forEach((k) => clear.add(k)); (p.pre || []).forEach((k) => pre.push(k)); }
    pending = [];
    doClear(st, clear, matched, created, pre);
    st.board.gravity();
  }
}

function play(st, a, bc) {
  const b = st.board;
  if (!bc) { resolve(st, [{ cells: new Set([key(...a)]) }]); return true; }
  const ta = b.get(...a), tb = b.get(...bc);
  if (!b.isSwappable(ta) || !b.isSwappable(tb)) return false;
  b.swap(a, bc);
  const ka = key(...bc), kb = key(...a);
  if (ta.power && tb.power) {
    const res = b.comboBlast(ta.power, tb.power, bc[0], bc[1], st.goals);
    if (res.convert) { for (const k of res.convert.cells) { const [r, c] = unkey(k); const t = b.grid[r][c]; t.power = res.convert.power; t.color = -1; } resolve(st, [{ cells: new Set([ka, kb, ...res.convert.cells]), pre: [ka, kb] }]); }
    else { res.cells.add(ka); res.cells.add(kb); resolve(st, [{ cells: res.cells, pre: [ka, kb] }]); }
  } else if (ta.power || tb.power) {
    const [pt, pk, other] = ta.power ? [ta, ka, tb] : [tb, kb, ta];
    if (pt.power === 'grappa') resolve(st, [{ cells: new Set([pk, ...b.cellsOfColor(other.color)]), pre: [pk] }], [a, bc]);
    else resolve(st, [{ cells: new Set([pk]) }], [a, bc]);
  } else if (b.findMatches([a, bc]).length) resolve(st, [], [a, bc]);
  else { b.swap(a, bc); return false; }
  return true;
}

const progress = (goals) => goals.reduce((s, g) => s + Math.min(g.done, g.n) / g.n, 0);
const powers = (b) => b.grid.flat().filter((t) => t && t.power).length;

function candidates(b) {
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = b.grid[r][c];
    if (t && t.power) out.push([[r, c], null]);
    if (c + 1 < COLS && b.wouldMatch([r, c], [r, c + 1])) out.push([[r, c], [r, c + 1]]);
    if (r + 1 < ROWS && b.wouldMatch([r, c], [r + 1, c])) out.push([[r, c], [r + 1, c]]);
  }
  return out;
}

function runLevel(n, skill = 1) {
  const lv = getLevel(n);
  const ov = (process.env.EDT_MOVES || '').split(':'); if (+ov[0] === n) lv.moves = +ov[1];
  const st = { board: new Board(lv), goals: lv.goals.map((g) => ({ ...g, done: 0 })), ticketCleared: false };
  let moves = lv.moves, bossCount = lv.boss ? lv.boss.every : 0;
  while (moves > 0) {
    const cands = candidates(st.board);
    if (!cands.length) { st.board.shuffle(); continue; }
    let best = null, bestScore = -1;
    const pool = skill >= 1 ? cands : cands.filter(() => Math.random() < skill);
    for (const [a, bc] of (pool.length ? pool : cands)) {
      const sim = { board: clone(st.board), goals: st.goals.map((g) => ({ ...g })), ticketCleared: false };
      if (!play(sim, a, bc)) continue;
      const sc = progress(sim.goals) * 100 + powers(sim.board) * 1.5 + Math.random() * 0.5;
      if (sc > bestScore) { bestScore = sc; best = [a, bc]; }
    }
    st.ticketCleared = false;
    play(st, ...best);
    moves--;
    if (st.goals.every((g) => g.done >= g.n)) return { win: true, left: moves };
    const mg = st.goals.find((g) => g.type === 'multa');
    if (mg && !st.ticketCleared && st.board.ticketCount() > 0 && st.board.spreadTicket()) mg.n++;
    if (lv.boss && --bossCount <= 0) {
      bossCount = lv.boss.every;
      const cand = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const t = st.board.grid[r][c]; if (t && !t.rock && !t.power) cand.push(t); }
      const k = 2 + Math.floor((n / 5 - 1) / 2);
      for (let i = 0; i < k && cand.length; i++) { const t = cand.splice(Math.floor(Math.random() * cand.length), 1)[0]; t.rock = 1; t.color = -1; }
    }
    if (!st.board.hasMoves()) st.board.shuffle();
  }
  return { win: false, left: 0, prog: progress(st.goals) / st.goals.length };
}

const [from = 1, to = 20, games = 12, skill = 1] = process.argv.slice(2).map(Number);
for (let n = from; n <= to; n++) {
  let wins = 0, left = 0, prog = 0;
  for (let g = 0; g < games; g++) { const r = runLevel(n, skill); if (r.win) { wins++; left += r.left; } else prog += r.prog; }
  const lv = getLevel(n);
  const ov2 = (process.env.EDT_MOVES || '').split(':'); if (+ov2[0] === n) lv.moves = +ov2[1];
  console.log(`L${n}\tmosse ${lv.moves}\tvinte ${wins}/${games}\tmosse avanzate ${wins ? (left / wins).toFixed(1) : '-'}\tprogresso perse ${games - wins ? (prog / (games - wins) * 100).toFixed(0) + '%' : '-'}\t${lv.goals.map((g) => g.type + g.n).join(' ')}`);
}
