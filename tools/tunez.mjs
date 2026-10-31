// Taratura delle mosse per ogni scenario: node tools/tunez.mjs <zone,zone> [daLivello] [aLivello] [partite]
// Obiettivo: un giocatore "normale" (skill 0.15) vince circa 3 volte su 4, avanzando poche mosse.
import { runLevel } from './sim.mjs';
import { getLevel, natZone } from '../js/levels.js';
const [zs, from = 1, to = 180, games = 16] = process.argv.slice(2);
const zones = String(zs).split(',').map(Number);
const target = (n) => (n <= 4 ? 8 : n <= 10 ? 6 : n <= 20 ? 5 : 4);
const out = {};
for (const z of zones) {
  out[z] = {};
  for (let n = +from; n <= +to; n++) {
    if (z === natZone(n) && n <= 20) continue;   // livelli fatti a mano
    if (process.env.ONLY_BOSS && n % 5) continue;
    const lv0 = getLevel(n, z);
    if (lv0.time) continue;
    let moves = lv0.moves, best = null;
    for (let it = 0; it < 8; it++) {
      let wins = 0, left = 0;
      for (let g = 0; g < +games; g++) { const r = runLevel(n, 0.15, z, moves); if (r.win) { wins++; left += r.left; } }
      const rate = wins / games, avgLeft = wins ? left / wins : 0;
      best = { moves, rate, avgLeft };
      if (rate < 0.8) { moves = Math.min(60, Math.ceil(moves * 1.15) + 1); continue; }
      const rec = Math.max(14, Math.round(moves - avgLeft + target(n)));
      if (rate <= 0.95 && Math.abs(rec - moves) <= 2) break;
      if (rate > 0.95) { moves = Math.max(14, Math.min(rec, moves - 2)); continue; }
      moves = rec;
    }
    out[z][n] = best.moves;
    process.stderr.write(`z${z} L${n}: ${lv0.moves} -> ${best.moves} (${Math.round(best.rate * 100)}%)\n`);
  }
}
console.log(JSON.stringify(out));
