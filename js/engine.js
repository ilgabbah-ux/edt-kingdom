// EDT Kingdom — logica pura del match-3 (nessun DOM qui)
export const ROWS = 9;
export const COLS = 8;

let nextId = 1;
export const newTile = (color, power = null, rock = 0) => ({ id: nextId++, color, power, rock });

export function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const inside = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const key = (r, c) => r * COLS + c;
const unkey = (k) => [Math.floor(k / COLS), k % COLS];

export class Board {
  constructor(level, rng = Math.random) {
    this.rng = rng;
    this.colors = level.colors;
    this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.mud = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    this.hole = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    this.ticket = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    const lay = level.layout || [];
    const chains = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = (lay[r] || '')[c] || '.';
        if (ch === 'm') this.mud[r][c] = 1;
        if (ch === 'M') this.mud[r][c] = 2;
        if (ch === '#') this.hole[r][c] = true;
        if (ch === 't') this.ticket[r][c] = 1;
        if (ch === 'k') chains.push([r, c]);
        if (ch === 'r') this.grid[r][c] = newTile(-1, null, 1);
        else if (ch === 'R') this.grid[r][c] = newTile(-1, null, 2);
        else if (ch === 'c' || ch === 'C') { const t = newTile(-1, null, ch === 'c' ? 1 : 2); t.kind = 'crate'; this.grid[r][c] = t; }
      }
    }
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (!this.grid[r][c] && !this.hole[r][c]) this.grid[r][c] = newTile(this.safeColor(r, c));
    for (const [r, c] of chains) if (this.grid[r][c]) this.grid[r][c].chain = true;
    this.fixMatches();
    let guard = 0;
    while (!this.hasMoves() && guard++ < 50) { this.shuffle(); this.fixMatches(); }
  }

  fixMatches() {
    for (let i = 0; i < 30; i++) {
      const gs = this.findMatches();
      if (!gs.length) return;
      for (const g of gs) for (const k of g.cells) {
        const [r, c] = unkey(k);
        const t = this.grid[r][c];
        if (t.power || t.rock) continue;
        t.color = (t.color + 1 + Math.floor(this.rng() * (this.colors - 1))) % this.colors;
      }
    }
  }

  randColor() { return Math.floor(this.rng() * this.colors); }

  // colore che non crea un tris immediato
  safeColor(r, c) {
    for (let t = 0; t < 20; t++) {
      const col = this.randColor();
      const g = this.grid;
      const L1 = c >= 1 && g[r][c - 1], L2 = c >= 2 && g[r][c - 2];
      const U1 = r >= 1 && g[r - 1][c], U2 = r >= 2 && g[r - 2][c];
      const R1 = c + 1 < COLS && g[r][c + 1], R2 = c + 2 < COLS && g[r][c + 2];
      const D1 = r + 1 < ROWS && g[r + 1][c], D2 = r + 2 < ROWS && g[r + 2][c];
      const same = (a, b) => a && b && a.color === col && b.color === col;
      if (same(L1, L2) || same(U1, U2) || same(R1, R2) || same(D1, D2) || same(L1, R1) || same(U1, D1)) continue;
      return col;
    }
    return this.randColor();
  }

  get(r, c) { return inside(r, c) ? this.grid[r][c] : null; }
  isMatchable(t) { return t && t.color >= 0 && !t.power && !t.rock; }
  isSwappable(t) { return t && !t.rock && !t.chain; }

  swap(a, b) {
    const t = this.grid[a[0]][a[1]];
    this.grid[a[0]][a[1]] = this.grid[b[0]][b[1]];
    this.grid[b[0]][b[1]] = t;
  }

  // Trova gruppi di match. swapCells: celle coinvolte nello scambio (per piazzare il power-up)
  findMatches(swapCells = []) {
    const runs = [];
    const g = this.grid;
    for (let r = 0; r < ROWS; r++) {
      let c = 0;
      while (c < COLS) {
        const t = g[r][c];
        if (!this.isMatchable(t)) { c++; continue; }
        let e = c + 1;
        while (e < COLS && this.isMatchable(g[r][e]) && g[r][e].color === t.color) e++;
        if (e - c >= 3) runs.push({ dir: 'H', cells: Array.from({ length: e - c }, (_, i) => key(r, c + i)), color: t.color });
        c = e;
      }
    }
    for (let c = 0; c < COLS; c++) {
      let r = 0;
      while (r < ROWS) {
        const t = g[r][c];
        if (!this.isMatchable(t)) { r++; continue; }
        let e = r + 1;
        while (e < ROWS && this.isMatchable(g[e][c]) && g[e][c].color === t.color) e++;
        if (e - r >= 3) runs.push({ dir: 'V', cells: Array.from({ length: e - r }, (_, i) => key(r + i, c)), color: t.color });
        r = e;
      }
    }
    const squares = [];
    for (let r = 0; r < ROWS - 1; r++)
      for (let c = 0; c < COLS - 1; c++) {
        const a = g[r][c];
        if (!this.isMatchable(a)) continue;
        const cells = [key(r, c), key(r, c + 1), key(r + 1, c), key(r + 1, c + 1)];
        if (cells.every((k) => { const t = g[unkey(k)[0]][unkey(k)[1]]; return this.isMatchable(t) && t.color === a.color; }))
          squares.push({ dir: 'S', cells, color: a.color });
      }

    // unisci run che condividono celle
    const groups = [];
    const owner = new Map();
    const addToGroup = (item) => {
      const hits = new Set(item.cells.filter((k) => owner.has(k)).map((k) => owner.get(k)));
      let gObj;
      if (hits.size === 0) {
        gObj = { cells: new Set(), runs: [], color: item.color };
        groups.push(gObj);
      } else {
        const list = [...hits];
        gObj = list[0];
        for (const other of list.slice(1)) {
          other.cells.forEach((k) => { gObj.cells.add(k); owner.set(k, gObj); });
          gObj.runs.push(...other.runs);
          groups.splice(groups.indexOf(other), 1);
        }
      }
      item.cells.forEach((k) => { gObj.cells.add(k); owner.set(k, gObj); });
      gObj.runs.push(item);
    };
    runs.forEach(addToGroup);
    // un quadrato conta solo se aggiunge qualcosa o se forma un gruppo nuovo
    for (const sq of squares) {
      const already = sq.cells.every((k) => owner.has(k));
      if (already) continue;
      addToGroup(sq);
    }

    const swapKeys = swapCells.map(([r, c]) => key(r, c));
    return groups.map((gr) => {
      const lineRuns = gr.runs.filter((x) => x.dir !== 'S');
      const maxLen = Math.max(0, ...lineRuns.map((x) => x.cells.length));
      const hasH = lineRuns.some((x) => x.dir === 'H');
      const hasV = lineRuns.some((x) => x.dir === 'V');
      const hasSq = gr.runs.some((x) => x.dir === 'S');
      let power = null;
      if (maxLen >= 5) power = 'grappa';
      else if (hasH && hasV) power = 'bomb';
      else if (maxLen === 4) power = lineRuns.find((x) => x.cells.length === 4).dir === 'H' ? 'mV' : 'mH';
      else if (hasSq) power = 'drone';
      const cells = [...gr.cells];
      let at = cells.find((k) => swapKeys.includes(k));
      if (at === undefined) {
        // per L/T: la cella d'incrocio
        if (power === 'bomb') {
          const cnt = new Map();
          lineRuns.forEach((x) => x.cells.forEach((k) => cnt.set(k, (cnt.get(k) || 0) + 1)));
          at = [...cnt].find(([, v]) => v > 1)?.[0];
        }
        if (at === undefined) {
          const longest = lineRuns.sort((a, b) => b.cells.length - a.cells.length)[0] || gr.runs[0];
          at = longest.cells[Math.floor(longest.cells.length / 2)];
        }
      }
      return { cells, power, at, color: gr.color };
    });
  }

  colorCount() {
    const cnt = Array(6).fill(0);
    for (const row of this.grid) for (const t of row) if (this.isMatchable(t)) cnt[t.color]++;
    return cnt;
  }

  mostCommonColor() {
    const cnt = this.colorCount();
    let best = 0;
    cnt.forEach((v, i) => { if (v > cnt[best]) best = i; });
    return best;
  }

  cellsOfColor(color) {
    const out = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.grid[r][c];
      if (t && t.color === color && !t.power) out.push(key(r, c));
    }
    return out;
  }

  // bersaglio del drone: prima i goal ancora aperti
  droneTarget(goals, exclude = new Set()) {
    const cands = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const k = key(r, c);
      if (exclude.has(k)) continue;
      if (this.hole[r][c]) continue;
      const t = this.grid[r][c];
      let w = 1;
      for (const gl of goals) {
        if (gl.done >= gl.n) continue;
        if (gl.type === 'rock' && t && t.rock && t.kind !== 'crate') w += 6;
        if (gl.type === 'crate' && t && t.kind === 'crate') w += 6;
        if (gl.type === 'chain' && t && t.chain) w += 5;
        if (gl.type === 'multa' && this.ticket[r][c]) w += 6;
        if (gl.type === 'mud' && this.mud[r][c] > 0) w += 5;
        if (gl.type === 'tile' && t && t.color === gl.t && !t.power) w += 3;
      }
      cands.push([k, w]);
    }
    const maxW = Math.max(...cands.map((x) => x[1]));
    const best = cands.filter((x) => x[1] === maxW);
    return best[Math.floor(this.rng() * best.length)][0];
  }

  // celle colpite da un power-up in (r,c)
  blast(power, r, c, goals = []) {
    const out = new Set();
    const add = (rr, cc) => { if (inside(rr, cc)) out.add(key(rr, cc)); };
    if (power === 'mH') for (let x = 0; x < COLS; x++) add(r, x);
    else if (power === 'mV') for (let y = 0; y < ROWS; y++) add(y, c);
    else if (power === 'bomb') {
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++)
        if (Math.abs(dr) + Math.abs(dc) <= 2 || (Math.abs(dr) <= 1 && Math.abs(dc) <= 1)) add(r + dr, c + dc);
    } else if (power === 'drone') {
      add(r, c); add(r - 1, c); add(r + 1, c); add(r, c - 1); add(r, c + 1);
      const tk = this.droneTarget(goals, out);
      out.add(tk);
      out.droneTarget = tk;
    } else if (power === 'grappa') {
      add(r, c);
      this.cellsOfColor(this.mostCommonColor()).forEach((k) => out.add(k));
    }
    return out;
  }

  // combo di due power-up scambiati (a = cella di arrivo)
  comboBlast(pa, pb, r, c, goals) {
    const out = new Set();
    const add = (rr, cc) => { if (inside(rr, cc)) out.add(key(rr, cc)); };
    const s = [pa, pb].sort().join('+');
    if (pa === 'grappa' && pb === 'grappa') {
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) add(y, x);
      return { cells: out };
    }
    if (pa === 'grappa' || pb === 'grappa') {
      const other = pa === 'grappa' ? pb : pa;
      const color = this.mostCommonColor();
      const targets = this.cellsOfColor(color);
      return { cells: out, convert: { power: other, cells: targets } };
    }
    if (s === 'mH+mH' || s === 'mV+mV' || s === 'mH+mV') {
      for (let x = 0; x < COLS; x++) add(r, x);
      for (let y = 0; y < ROWS; y++) add(y, c);
    } else if (s === 'bomb+mH' || s === 'bomb+mV') {
      for (let d = -1; d <= 1; d++) {
        for (let x = 0; x < COLS; x++) add(r + d, x);
        for (let y = 0; y < ROWS; y++) add(y, c + d);
      }
    } else if (s === 'bomb+bomb') {
      for (let dr = -3; dr <= 3; dr++) for (let dc = -3; dc <= 3; dc++) add(r + dr, c + dc);
    } else if (s === 'drone+drone') {
      add(r, c); add(r - 1, c); add(r + 1, c); add(r, c - 1); add(r, c + 1);
      for (let i = 0; i < 3; i++) out.add(this.droneTarget(goals, out));
    } else if (pa === 'drone' || pb === 'drone') {
      const other = pa === 'drone' ? pb : pa;
      const tk = this.droneTarget(goals);
      const [tr, tc] = unkey(tk);
      add(r, c);
      this.blast(other, tr, tc, goals).forEach((k) => out.add(k));
      out.droneTarget = tk;
    }
    return { cells: out };
  }

  // Gravità: restituisce gli spostamenti e le nuove tessere
  // Gravità: sassi, casse e tessere incatenate restano ferme; le tessere scendono
  // in verticale e, se sotto un ostacolo c'è un buco, scivolano in diagonale.
  gravity() {
    const start = new Map();
    const spawnedTiles = new Set();
    const spawnCount = Array(COLS).fill(0);
    const movable = (t) => t && !t.rock && !t.chain;
    const g = this.grid, H = this.hole;
    const topRow = (c) => { for (let r = 0; r < ROWS; r++) if (!H[r][c]) return r; return -1; };
    const mark = (t, r, c) => { if (!start.has(t.id)) start.set(t.id, { tile: t, r, c }); };
    let guard = 0;
    while (guard++ < 800) {
      let changed = false;
      for (let r = ROWS - 2; r >= 0; r--) for (let c = 0; c < COLS; c++) {
        const t = g[r][c];
        if (movable(t) && !H[r + 1][c] && !g[r + 1][c]) { mark(t, r, c); g[r + 1][c] = t; g[r][c] = null; changed = true; }
      }
      for (let c = 0; c < COLS; c++) {
        const tr = topRow(c);
        if (tr >= 0 && !g[tr][c]) {
          const t = newTile(this.randColor());
          spawnCount[c]++;
          start.set(t.id, { tile: t, r: tr - spawnCount[c], c });
          spawnedTiles.add(t.id);
          g[tr][c] = t; changed = true;
        }
      }
      if (changed) continue;
      // scivolata diagonale verso le caselle che non possono essere riempite dall'alto
      const reach = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
      for (let c = 0; c < COLS; c++) {
        let ok = true, seen = false;
        for (let r = 0; r < ROWS; r++) {
          if (H[r][c]) { if (seen) ok = false; continue; }
          seen = true;
          const t = g[r][c];
          reach[r][c] = ok;
          if (t && !movable(t)) ok = false;
        }
      }
      let slid = false;
      for (let r = ROWS - 2; r >= 0 && !slid; r--) for (let c = 0; c < COLS && !slid; c++) {
        const tr = r + 1;
        if (H[tr][c] || g[tr][c]) continue;
        if (reach[tr][c]) continue;
        for (const dc of [-1, 1]) {
          const sc = c + dc;
          if (sc < 0 || sc >= COLS) continue;
          const t = g[r][sc];
          if (movable(t)) { mark(t, r, sc); g[tr][c] = t; g[r][sc] = null; slid = true; break; }
        }
      }
      if (!slid) break;
    }
    const moves = [], spawns = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = g[r][c];
      if (!t || !start.has(t.id)) continue;
      const st = start.get(t.id);
      const m = { tile: t, from: st.r, fromC: st.c, to: r, c };
      if (spawnedTiles.has(t.id)) spawns.push(m); else if (st.r !== r || st.c !== c) moves.push(m);
    }
    return { moves, spawns };
  }

  // le multe della Forestale si allargano se non ne togli nessuna
  spreadTicket() {
    const cand = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (!this.ticket[r][c]) continue;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr, cc = c + dc;
        if (inside(rr, cc) && !this.hole[rr][cc] && !this.ticket[rr][cc]) cand.push([rr, cc]);
      }
    }
    if (!cand.length) return null;
    const [r, c] = cand[Math.floor(this.rng() * cand.length)];
    this.ticket[r][c] = 1;
    return [r, c];
  }
  ticketCount() { return this.ticket.flat().reduce((a, b) => a + b, 0); }

  wouldMatch(a, b) {
    const ta = this.get(...a), tb = this.get(...b);
    if (!this.isSwappable(ta) || !this.isSwappable(tb)) return false;
    if (ta.power || tb.power) return true;
    this.swap(a, b);
    const ok = this.findMatches().length > 0;
    this.swap(a, b);
    return ok;
  }

  findMove() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.grid[r][c];
      if (t && t.power) return [[r, c], null];
      if (c + 1 < COLS && this.wouldMatch([r, c], [r, c + 1])) return [[r, c], [r, c + 1]];
      if (r + 1 < ROWS && this.wouldMatch([r, c], [r + 1, c])) return [[r, c], [r + 1, c]];
    }
    return null;
  }

  hasMoves() { return !!this.findMove(); }

  shuffle() {
    const cells = [];
    const tiles = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.grid[r][c];
      if (t && !t.rock && !t.chain) { cells.push([r, c]); tiles.push(t); }
    }
    for (let tries = 0; tries < 60; tries++) {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
      cells.forEach(([r, c], i) => { this.grid[r][c] = tiles[i]; });
      if (this.findMatches().length === 0 && this.hasMoves()) return;
    }
    // ultima spiaggia: ricolora
    cells.forEach(([r, c]) => { const t = this.grid[r][c]; if (!t.power) t.color = this.safeColor(r, c); });
  }
}

export { key, unkey, inside };
