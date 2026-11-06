// Taratura del Giro infinito (271 - 570): node tools/tuneendless.mjs [partite] [da] [a]
import { runLevel } from './sim.mjs';
import { getLevel, MAX_LEVEL, ENDLESS_CYCLE } from '../js/levels.js';
const games = +(process.argv[2] || 24), from = +(process.argv[3] || MAX_LEVEL + 1), to = +(process.argv[4] || MAX_LEVEL + ENDLESS_CYCLE);
const out = {};
for (let n = from; n <= to; n++) {
  const lv = getLevel(n); if (lv.time) continue;
  const target = lv.superHard ? 0.42 : lv.hard ? 0.52 : lv.boss ? 0.72 : lv.breather ? 0.85 : 0.68;
  const rate = (m) => { let w = 0; for (let g = 0; g < games; g++) if (runLevel(n, 0.15, lv.zone, m).win) w++; return w / games; };
  let m = lv.moves, r = rate(m), best = { m, r };
  for (let it = 0; it < 12; it++) {
    if (Math.abs(r - target) < Math.abs(best.r - target)) best = { m, r };
    if (Math.abs(r - target) <= 0.08) break;
    const step = Math.abs(r - target) > 0.3 ? 4 : Math.abs(r - target) > 0.15 ? 2 : 1;
    m = Math.max(10, Math.min(60, m + (r < target ? step : -step)));
    if (m === best.m) break;
    r = rate(m);
  }
  if (Math.abs(r - target) < Math.abs(best.r - target)) best = { m, r };
  out[n] = best.m;
  process.stderr.write(`L${n} z${lv.zone} b${lv.base}${lv.boss ? ' BOSS' : ''}${lv.hard ? (lv.superHard ? ' SUPER' : ' hard') : ''}: ${lv.moves} -> ${best.m} (${Math.round(best.r * 100)}%)\n`);
}
console.log(JSON.stringify(out));
