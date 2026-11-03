// Taratura dei livelli Difficili (vinti ~1 su 2) e Super difficili (~2 su 5): node tools/tunehard.mjs [partite]
import { runLevel } from './sim.mjs';
import { getLevel, natZone, hardKind, MAX_LEVEL } from '../js/levels.js';
const games = +(process.argv[2] || 40);
const out = {};
for (let n = 1; n <= MAX_LEVEL; n++) {
  const hk = hardKind(n); if (!hk) continue; if (process.env.ONLY && !process.env.ONLY.split(',').includes(String(n))) continue;
  const z = natZone(n), lv = getLevel(n, z); if (lv.time || lv.boss) continue;
  const target = hk === 2 ? 0.4 : 0.52;
  const rate = (m) => { let w = 0; for (let g = 0; g < games; g++) if (runLevel(n, 0.15, z, m).win) w++; return w / games; };
  let m = lv.moves, r = rate(m), best = { m, r };
  for (let it = 0; it < 12; it++) {
    if (Math.abs(r - target) < Math.abs(best.r - target)) best = { m, r };
    if (Math.abs(r - target) <= 0.07) break;
    m = Math.max(10, Math.min(60, m + (r < target ? (target - r > 0.25 ? 3 : 1) : (r - target > 0.25 ? -3 : -1))));
    r = rate(m);
  }
  if (Math.abs(r - target) < Math.abs(best.r - target)) best = { m, r };
  (out[z] = out[z] || {})[n] = best.m;
  process.stderr.write(`L${n} z${z} ${hk === 2 ? 'SUPER' : 'hard'}: ${lv.moves} -> ${best.m} (${Math.round(best.r * 100)}%)\n`);
}
console.log(JSON.stringify(out));
