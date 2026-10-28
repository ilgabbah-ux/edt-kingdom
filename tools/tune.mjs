// Calcola il numero di mosse consigliato per ogni livello con il simulatore.
import { spawnSync } from 'child_process';
const target = (n) => (n <= 4 ? 8 : n <= 10 ? 5 : n <= 20 ? 4 : 3);
const out = {};
const args = process.argv.slice(2).map(Number);
const [from, to, games] = [args[0] || 1, args[1] || 60, args[2] || 14];
for (let n = from; n <= to; n++) {
  let override = null, tries = 0, res;
  while (tries++ < 5) {
    const env = { ...process.env, EDT_MOVES: override ? `${n}:${override}` : '' };
    const r = spawnSync('node', ['tools/sim.mjs', n, n, games, '0.15'], { env, encoding: 'utf8' });
    const m = r.stdout.match(/mosse (\d+)\tvinte (\d+)\/(\d+)\tmosse avanzate ([\d.-]+)/);
    const moves = +m[1], wins = +m[2], left = m[4] === '-' ? 0 : +m[4];
    res = { moves, wins, left };
    if (wins < games * 0.75) { override = Math.ceil(moves * 1.15) + 1; continue; }
    const used = moves - left;
    const rec = Math.max(15, Math.round(used + target(n)));
    if (Math.abs(rec - moves) <= 2) { override = moves; break; }
    override = rec;
  }
  out[n] = override;
  console.error(`L${n}: ${res.moves} -> ${override} (vinte ${res.wins}/${games}, avanzate ${res.left})`);
}
console.log(JSON.stringify(out));
