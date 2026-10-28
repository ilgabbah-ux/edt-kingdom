// EDT Kingdom — grafica cartoon originale (SVG disegnati a mano nel codice)
const O = '#2b1d14'; // contorno scuro

const wrap = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;

const shine = (x, y, w, h, r = 6) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff" opacity=".55"/>`;

// --- 6 tessere colorate ---
export const TILE_SVG = [
  // 0 BIRRA (giallo)
  wrap(`
    <path d="M70 38 h8 a12 12 0 0 1 12 12 v14 a12 12 0 0 1 -12 12 h-8" fill="none" stroke="${O}" stroke-width="7"/>
    <path d="M70 38 h8 a12 12 0 0 1 12 12 v14 a12 12 0 0 1 -12 12 h-8" fill="none" stroke="#ffd34d" stroke-width="3"/>
    <rect x="22" y="30" width="50" height="58" rx="8" fill="#ffb81c" stroke="${O}" stroke-width="5"/>
    <rect x="30" y="42" width="7" height="38" rx="3" fill="#ffe08a"/>
    <rect x="44" y="42" width="7" height="38" rx="3" fill="#ffe08a" opacity=".7"/>
    <path d="M18 34 q4 -18 18 -14 q6 -12 20 -6 q12 -8 20 4 q10 2 6 16 z" fill="#fffaf0" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="36" cy="26" r="4" fill="#fff"/>`),
  // 1 CASCO (rosso)
  wrap(`
    <path d="M14 58 q0 -40 40 -42 q34 0 36 34 l0 14 q0 14 -14 18 l-30 4 q-18 2 -26 -8 z" fill="#e8322a" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M10 40 l34 -6 l-4 10 l-32 4 z" fill="#ffd34d" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M52 46 h30 q6 0 6 6 v8 q0 6 -6 6 h-30 q-6 0 -6 -6 v-8 q0 -6 6 -6 z" fill="#3a2a22" stroke="${O}" stroke-width="4"/>
    <path d="M56 50 h22" stroke="#7fd3ff" stroke-width="5" stroke-linecap="round"/>
    <path d="M30 78 q20 6 46 -4" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${shine(28, 24, 22, 8, 4)}`),
  // 2 MASCHERA (blu)
  wrap(`
    <path d="M6 52 q44 -20 88 0" stroke="${O}" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M6 52 q44 -20 88 0" stroke="#2f6fe0" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M16 40 q34 -14 68 0 q8 4 6 14 q-2 16 -14 18 q-10 2 -16 -8 q-6 -6 -12 0 q-6 10 -16 8 q-12 -2 -14 -18 q-2 -10 6 -14 z" fill="#3d8bff" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M24 46 q10 -6 20 0 q2 12 -10 14 q-10 0 -10 -14 z" fill="#bdf0ff" stroke="${O}" stroke-width="3"/>
    <path d="M56 46 q10 -6 20 0 q0 14 -10 14 q-12 -2 -10 -14 z" fill="#bdf0ff" stroke="${O}" stroke-width="3"/>
    <circle cx="30" cy="49" r="3" fill="#fff"/><circle cx="62" cy="49" r="3" fill="#fff"/>`),
  // 3 CHIAVE INGLESE (verde)
  wrap(`
    <g transform="rotate(-40 50 50)">
      <rect x="44" y="30" width="14" height="58" rx="7" fill="#3fbf4f" stroke="${O}" stroke-width="5"/>
      <path d="M30 22 a22 22 0 1 0 42 0 l-10 0 l0 10 l-22 0 l0 -10 z" fill="#3fbf4f" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="48" y="44" width="5" height="34" rx="2.5" fill="#a6f0ae"/>
      <circle cx="51" cy="80" r="4" fill="${O}"/>
    </g>`),
  // 4 GOMMA TASSELLATA (viola)
  wrap(`
    <circle cx="50" cy="50" r="40" fill="#3a2f36" stroke="${O}" stroke-width="5"/>
    ${Array.from({ length: 12 }, (_, i) => `<rect x="46" y="8" width="8" height="10" rx="2" fill="#2a2226" stroke="${O}" stroke-width="2" transform="rotate(${i * 30} 50 50)"/>`).join('')}
    <circle cx="50" cy="50" r="22" fill="#a24bd8" stroke="${O}" stroke-width="5"/>
    <circle cx="50" cy="50" r="8" fill="#e6c4ff" stroke="${O}" stroke-width="4"/>
    <path d="M36 38 a18 18 0 0 1 12 -8" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`),
  // 5 STIVALE (arancio)
  wrap(`
    <path d="M30 12 h32 l2 52 q22 4 26 14 v8 h-66 l2 -24 z" fill="#ff8a1c" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
    <rect x="22" y="84" width="70" height="8" rx="3" fill="#2b2b2b" stroke="${O}" stroke-width="4"/>
    <path d="M30 26 h32 M30 40 h33 M30 54 h33" stroke="${O}" stroke-width="4"/>
    <rect x="44" y="22" width="12" height="8" rx="2" fill="#cfcfcf" stroke="${O}" stroke-width="3"/>
    <rect x="44" y="36" width="12" height="8" rx="2" fill="#cfcfcf" stroke="${O}" stroke-width="3"/>
    <rect x="44" y="50" width="12" height="8" rx="2" fill="#cfcfcf" stroke="${O}" stroke-width="3"/>
    ${shine(33, 16, 6, 40, 3)}`),
];

export const TILE_NAMES = ['Birre', 'Caschi', 'Maschere', 'Chiavi', 'Gomme', 'Stivali'];

// --- Power-up ---
const motoBody = `
  <circle cx="26" cy="66" r="15" fill="#3a2f36" stroke="${O}" stroke-width="5"/>
  <circle cx="76" cy="66" r="15" fill="#3a2f36" stroke="${O}" stroke-width="5"/>
  <circle cx="26" cy="66" r="5" fill="#ddd"/><circle cx="76" cy="66" r="5" fill="#ddd"/>
  <path d="M26 66 l18 -22 h24 l10 22" fill="none" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M36 46 q14 -14 34 -4 l6 8 h-32 z" fill="#ff8a1c" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M66 36 l14 -6 l6 10" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/>
  <path d="M20 44 h20" stroke="#ff8a1c" stroke-width="7" stroke-linecap="round"/>
  <path d="M8 30 h10 M4 40 h8" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`;

export const POWER_SVG = {
  mH: wrap(`<circle cx="50" cy="50" r="46" fill="#fff3c4" opacity=".55"/>${motoBody}
    <path d="M4 88 l10 -6 v12 z M96 88 l-10 -6 v12 z" fill="#e8322a" stroke="${O}" stroke-width="2"/>`),
  mV: wrap(`<circle cx="50" cy="50" r="46" fill="#fff3c4" opacity=".55"/>
    <g transform="rotate(-90 50 50)">${motoBody}</g>
    <path d="M88 4 l-6 10 h12 z M88 96 l-6 -10 h12 z" fill="#e8322a" stroke="${O}" stroke-width="2"/>`),
  bomb: wrap(`<circle cx="50" cy="54" r="44" fill="#ffd0c4" opacity=".5"/>
    <rect x="20" y="26" width="58" height="66" rx="8" fill="#d62424" stroke="${O}" stroke-width="5"/>
    <path d="M30 40 l38 38 M68 40 l-38 38" stroke="#a01414" stroke-width="7"/>
    <rect x="58" y="14" width="16" height="16" rx="3" fill="#ffd34d" stroke="${O}" stroke-width="4"/>
    <rect x="26" y="18" width="24" height="10" rx="4" fill="#d62424" stroke="${O}" stroke-width="4"/>
    <path d="M66 14 q4 -10 14 -8" stroke="${O}" stroke-width="3" fill="none"/>
    <circle cx="82" cy="6" r="5" fill="#ffd34d"/><circle cx="82" cy="6" r="2.5" fill="#fff"/>
    ${shine(26, 32, 6, 50, 3)}`),
  grappa: wrap(`
    <circle cx="50" cy="52" r="46" fill="#fff" opacity=".35"/>
    <ellipse cx="50" cy="14" rx="20" ry="6" fill="none" stroke="#ffd34d" stroke-width="5"/>
    <path d="M42 22 h16 v14 q16 10 16 28 v20 q0 8 -8 8 h-32 q-8 0 -8 -8 v-20 q0 -18 16 -28 z" fill="#e9f8ff" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M30 64 q20 -6 40 0 v18 q0 4 -4 4 h-32 q-4 0 -4 -4 z" fill="#ffe27a" opacity=".85"/>
    <rect x="34" y="56" width="32" height="16" rx="3" fill="#fff" stroke="${O}" stroke-width="3"/>
    <text x="50" y="68" font-size="10" font-family="Arial Black,Arial" text-anchor="middle" fill="#7a2fb0">S.B.</text>
    <path d="M14 30 l4 8 l8 4 l-8 4 l-4 8 l-4 -8 l-8 -4 l8 -4 z" fill="#ffd34d"/>
    <path d="M84 50 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 l6 -3 z" fill="#ff7ad9"/>`),
  drone: wrap(`<circle cx="50" cy="50" r="46" fill="#c4f1ff" opacity=".5"/>
    <path d="M24 30 L76 70 M76 30 L24 70" stroke="${O}" stroke-width="7" stroke-linecap="round"/>
    <rect x="34" y="38" width="32" height="24" rx="8" fill="#2f6fe0" stroke="${O}" stroke-width="5"/>
    <circle cx="50" cy="50" r="6" fill="#bdf0ff" stroke="${O}" stroke-width="3"/>
    ${[[22, 26], [78, 26], [22, 74], [78, 74]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="16" ry="5" fill="#ddd" stroke="${O}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="4" fill="${O}"/>`).join('')}`),
};

export const POWER_NAMES = {
  mH: 'Moto (riga)', mV: 'Moto (colonna)', bomb: 'Tanica', grappa: 'Grappa di San Braulio', drone: 'Drone',
};

// --- Ostacoli ---
export const ROCK_SVG = [
  null,
  wrap(`<path d="M12 70 q-4 -26 14 -42 q16 -16 36 -10 q24 6 28 30 q4 22 -10 32 q-14 10 -40 8 q-24 -2 -28 -18 z" fill="#9a958f" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M30 34 q10 -8 22 -6" stroke="#fff" stroke-width="5" opacity=".6" fill="none" stroke-linecap="round"/>
    <path d="M40 60 l8 6 M62 50 l6 -4" stroke="#6d6863" stroke-width="4" stroke-linecap="round"/>`),
  wrap(`<path d="M12 70 q-4 -26 14 -42 q16 -16 36 -10 q24 6 28 30 q4 22 -10 32 q-14 10 -40 8 q-24 -2 -28 -18 z" fill="#78736d" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M14 66 q20 -10 30 -2 q14 10 34 -4 q8 -4 12 0 q-2 18 -14 24 q-20 8 -40 4 q-20 -4 -22 -22z" fill="#5fa04a" stroke="${O}" stroke-width="3"/>
    <path d="M30 34 q10 -8 22 -6" stroke="#fff" stroke-width="5" opacity=".5" fill="none" stroke-linecap="round"/>
    <path d="M48 24 l-6 16 l10 8" stroke="${O}" stroke-width="3" fill="none"/>`),
];

// --- Personaggi (avatar cartoon generici, non ritratti) ---
export function riderAvatar(color = '#e8322a', accent = '#ffd34d', num = '') {
  return wrap(`
    <circle cx="50" cy="50" r="48" fill="#ffe9c7"/>
    <path d="M14 62 q0 -46 38 -48 q36 0 36 40 l0 16 q0 14 -14 16 l-40 2 q-20 0 -20 -26 z" fill="${color}" stroke="${O}" stroke-width="5"/>
    <path d="M10 40 l36 -8 l-4 10 l-34 6 z" fill="${accent}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M30 50 q20 -10 46 0 q4 14 -6 18 h-34 q-10 -4 -6 -18 z" fill="#7fd3ff" stroke="${O}" stroke-width="4"/>
    <path d="M36 54 q8 -4 14 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="34" y="72" width="40" height="12" rx="6" fill="#3a2a22"/>
    <text x="54" y="31" font-size="16" font-family="Arial Black,Arial" text-anchor="middle" fill="#fff" stroke="${O}" stroke-width="1">${num}</text>`);
}

export const FORESTALE_SVG = wrap(`
  <circle cx="50" cy="50" r="48" fill="#d9f0c9"/>
  <ellipse cx="50" cy="58" rx="26" ry="28" fill="#f2c39b" stroke="${O}" stroke-width="5"/>
  <path d="M14 36 q36 -10 72 0 l-4 8 q-32 -8 -64 0 z" fill="#2f5a2a" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M26 36 q4 -26 24 -26 q20 0 24 26 z" fill="#3d7a35" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M28 24 h44" stroke="#c9a227" stroke-width="5"/>
  <path d="M50 16 l4 6 h-8 z" fill="#ffd34d" stroke="${O}" stroke-width="2"/>
  <path d="M34 48 l12 4 M66 48 l-12 4" stroke="${O}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="40" cy="56" r="4" fill="${O}"/><circle cx="60" cy="56" r="4" fill="${O}"/>
  <path d="M30 70 q10 -8 20 -2 q10 -6 20 2 q-10 6 -20 0 q-10 6 -20 0z" fill="#5a3a22" stroke="${O}" stroke-width="3"/>
  <path d="M42 80 q8 4 16 0" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <rect x="62" y="74" width="20" height="9" rx="4" fill="#c9c9c9" stroke="${O}" stroke-width="3"/>
  <circle cx="82" cy="78" r="5" fill="#c9c9c9" stroke="${O}" stroke-width="3"/>`);

export const toURI = (svg) => `url('data:image/svg+xml;utf8,${encodeURIComponent(svg).replace(/'/g, '%27')}')`;
