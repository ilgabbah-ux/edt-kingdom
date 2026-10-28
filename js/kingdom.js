// EDT Kingdom — il Campo Base da costruire e i personaggi
import { riderAvatar, FORESTALE_SVG } from './art.js';

const O = '#2b1d14';
const w = (inner, vb = '0 0 120 100') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`;

export const CHARS = {
  gabbah: { name: 'Il Gabbah', svg: riderAvatar('#7a2fb0', '#ffd34d', 'G') },
  miti: { name: 'Miti, Protettore dell\'EDT', svg: riderAvatar('#2f6fe0', '#fff', 'M') },
  mirco: { name: 'Mirco', svg: riderAvatar('#3fbf4f', '#ffd34d', 'Mi') },
  purcello: { name: 'Purcello l\'Ingroppatore', svg: riderAvatar('#ff8a1c', '#2b1d14', 'P') },
  costa: { name: 'Costa', svg: riderAvatar('#1aa3a3', '#fff', 'C') },
  renard: { name: 'Renard', svg: riderAvatar('#e8322a', '#fff', 'R') },
  svetlana: { name: 'Svetlana', svg: riderAvatar('#ff6fb5', '#fff', '♥') },
  forestale: { name: 'La Forestale', svg: FORESTALE_SVG },
};

// x,y in percentuale sulla mappa
export const BUILDINGS = [
  { id: 'bandiera', name: 'Bandiera EDT', cost: 1, x: 50, y: 22, who: 'gabbah',
    text: 'Bandiera piantata! Da oggi questo è territorio EDT. La Forestale non sarà contenta...',
    svg: w(`<rect x="56" y="10" width="6" height="84" fill="#7a5230" stroke="${O}" stroke-width="3"/>
      <path d="M62 14 q20 -6 40 4 q-6 10 0 22 q-20 -8 -40 -2 z" fill="#e8322a" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>
      <text x="80" y="32" font-size="13" font-family="Arial Black,Arial" text-anchor="middle" fill="#fff">EDT</text>
      <ellipse cx="59" cy="94" rx="22" ry="5" fill="#000" opacity=".2"/>`) },
  { id: 'bar', name: 'Bar "L\'ultimo e poi andiamo"', cost: 2, x: 22, y: 38, who: 'gabbah',
    text: 'Il bar è aperto! Regola numero uno: l\'ultimo... e poi andiamo. Regola numero due: vedi regola numero uno.',
    svg: w(`<rect x="14" y="40" width="92" height="52" rx="4" fill="#c98a4b" stroke="${O}" stroke-width="5"/>
      <path d="M6 44 l54 -34 l54 34 z" fill="#e8322a" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M20 44 h80" stroke="#fff" stroke-width="5" stroke-dasharray="10 8"/>
      <rect x="48" y="60" width="24" height="32" fill="#5a3a22" stroke="${O}" stroke-width="4"/>
      <rect x="22" y="56" width="18" height="16" fill="#ffe27a" stroke="${O}" stroke-width="4"/>
      <rect x="80" y="56" width="18" height="16" fill="#ffe27a" stroke="${O}" stroke-width="4"/>
      <rect x="30" y="28" width="60" height="14" rx="3" fill="#fffaf0" stroke="${O}" stroke-width="3"/>
      <text x="60" y="39" font-size="10" font-family="Arial Black,Arial" text-anchor="middle" fill="${O}">BAR EDT</text>`) },
  { id: 'garage', name: 'Garage di Renard', cost: 3, x: 78, y: 38, who: 'renard',
    text: 'Garage pronto! Ho già messo il Wi-Fi: adesso le moto si scaricano gli aggiornamenti da sole. In teoria.',
    svg: w(`<rect x="10" y="34" width="100" height="58" fill="#9aa3ad" stroke="${O}" stroke-width="5"/>
      <path d="M4 38 l56 -26 l56 26 z" fill="#5f6b78" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="24" y="48" width="72" height="44" fill="#d9dee3" stroke="${O}" stroke-width="4"/>
      ${[56, 64, 72, 80].map((y) => `<path d="M24 ${y} h72" stroke="#9aa3ad" stroke-width="3"/>`).join('')}
      <circle cx="96" cy="22" r="10" fill="#ffd34d" stroke="${O}" stroke-width="3"/>
      <path d="M90 22 h12 M96 16 v12" stroke="${O}" stroke-width="3"/>`) },
  { id: 'tenda', name: 'Tenda di Mirco', cost: 3, x: 26, y: 62, who: 'mirco',
    text: 'Tenda montata. Ci ho messo dentro un letto, una flebo e un cartello "NON DISTURBARE". Campa giù!',
    svg: w(`<path d="M8 90 l52 -74 l52 74 z" fill="#3fbf4f" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M60 16 l-14 74 h28 z" fill="#2a8a37" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="78" y="58" width="30" height="16" rx="3" fill="#fff" stroke="${O}" stroke-width="3"/>
      <path d="M93 60 v12 M87 66 h12" stroke="#e8322a" stroke-width="4"/>
      <text x="22" y="86" font-size="9" font-family="Arial Black,Arial" fill="#fff">Zzz</text>`) },
  { id: 'pista', name: 'Pista col salto', cost: 4, x: 74, y: 62, who: 'miti',
    text: 'La pista è pronta! Io sto in fondo al salto con la GoPro: se cadete, almeno viene un bel video.',
    svg: w(`<path d="M2 92 q30 -4 40 -40 q4 -6 8 0 l10 40 z" fill="#a0642e" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M60 92 l20 -24 q6 -4 10 0 l26 24 z" fill="#a0642e" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M4 92 h112" stroke="${O}" stroke-width="5"/>
      ${[10, 30, 90, 110].map((x) => `<path d="M${x} 92 v-14" stroke="#fff" stroke-width="4"/><path d="M${x} 78 l8 3 l-8 3" fill="#e8322a"/>`).join('')}
      <path d="M44 30 q10 -18 26 -10" stroke="${O}" stroke-width="3" fill="none" stroke-dasharray="4 4"/>`) },
  { id: 'pesce', name: 'Bancarella del pesce di Costa', cost: 4, x: 50, y: 50, who: 'costa',
    text: 'Bancarella aperta! Trote, acciughe e pesce spada. La birra si abbina a tutto, il pesce di più.',
    svg: w(`<rect x="14" y="54" width="92" height="38" rx="3" fill="#c98a4b" stroke="${O}" stroke-width="5"/>
      <path d="M10 54 h100 l-8 -24 h-84 z" fill="#1aa3a3" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M18 30 v24 M102 30 v24" stroke="${O}" stroke-width="4"/>
      ${[30, 60, 90].map((x) => `<ellipse cx="${x}" cy="66" rx="12" ry="6" fill="#9fd7f0" stroke="${O}" stroke-width="3"/><path d="M${x + 12} 66 l8 -6 v12 z" fill="#9fd7f0" stroke="${O}" stroke-width="3"/><circle cx="${x - 6}" cy="65" r="1.6" fill="${O}"/>`).join('')}`) },
  { id: 'carro', name: 'Carro attrezzi di Purcello', cost: 4, x: 50, y: 74, who: 'purcello',
    text: 'Chi si pianta nel fango non deve preoccuparsi: arrivo da dietro, aggancio, e via! Nessuno resta indietro.',
    svg: w(`<rect x="8" y="46" width="60" height="30" rx="4" fill="#ff8a1c" stroke="${O}" stroke-width="5"/>
      <rect x="66" y="34" width="38" height="42" rx="6" fill="#ff8a1c" stroke="${O}" stroke-width="5"/>
      <rect x="74" y="40" width="22" height="14" rx="3" fill="#bdf0ff" stroke="${O}" stroke-width="3"/>
      <path d="M20 46 l-8 -30 l26 0" stroke="${O}" stroke-width="5" fill="none" stroke-linejoin="round"/>
      <path d="M38 16 v16 q0 6 -6 6" stroke="${O}" stroke-width="4" fill="none"/>
      <circle cx="26" cy="80" r="11" fill="#3a2f36" stroke="${O}" stroke-width="4"/><circle cx="86" cy="80" r="11" fill="#3a2f36" stroke="${O}" stroke-width="4"/>`) },
  { id: 'trono', name: 'Trono di Svetlana', cost: 5, x: 20, y: 84, who: 'svetlana',
    text: 'Un trono tutto per me! Era ora. Prima ero sempre sgonfia di entusiasmo... adesso mi sento una regina.',
    svg: w(`<rect x="34" y="20" width="52" height="56" rx="10" fill="#ff6fb5" stroke="${O}" stroke-width="5"/>
      <path d="M34 22 l8 -14 l10 12 l8 -14 l8 14 l10 -12 l8 14" fill="#ffd34d" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="24" y="60" width="72" height="18" rx="6" fill="#d94a92" stroke="${O}" stroke-width="5"/>
      <path d="M32 78 v14 M88 78 v14" stroke="${O}" stroke-width="6"/>
      <path d="M60 36 c-6 -8 -18 0 0 14 c18 -14 6 -22 0 -14z" fill="#fff"/>`) },
  { id: 'statua', name: 'Statua del Gabbah', cost: 6, x: 80, y: 84, who: 'gabbah',
    text: 'La statua! Fiera, maestosa, con la birra alzata al cielo. Il Campo Base EDT è COMPLETO!',
    svg: w(`<rect x="34" y="70" width="52" height="22" fill="#b9b2a8" stroke="${O}" stroke-width="5"/>
      <circle cx="60" cy="30" r="14" fill="#d8d2c8" stroke="${O}" stroke-width="5"/>
      <path d="M42 70 q0 -26 18 -26 q18 0 18 26 z" fill="#d8d2c8" stroke="${O}" stroke-width="5"/>
      <path d="M74 50 l14 -24" stroke="${O}" stroke-width="10" stroke-linecap="round"/>
      <path d="M74 50 l14 -24" stroke="#d8d2c8" stroke-width="5" stroke-linecap="round"/>
      <rect x="82" y="8" width="14" height="18" rx="2" fill="#ffd34d" stroke="${O}" stroke-width="3"/>
      <text x="60" y="86" font-size="9" font-family="Arial Black,Arial" text-anchor="middle" fill="${O}">IL GABBAH</text>`) },
];

export const SCAFFOLD_SVG = w(`
  <path d="M14 92 v-60 M50 92 v-60 M86 92 v-60 M14 32 h72 M14 62 h72" stroke="#c98a4b" stroke-width="6"/>
  <path d="M14 62 l36 -30 M50 62 l36 -30 M14 92 l36 -30 M50 92 l36 -30" stroke="#a0642e" stroke-width="4"/>
  <path d="M90 92 l20 -40 l8 0 l-18 40z" fill="#ffd34d" stroke="${O}" stroke-width="3"/>`, '0 0 120 100');

// Sfondo della mappa
export const MAP_BG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ec6ff"/><stop offset="1" stop-color="#bfe8ff"/></linearGradient></defs>
  <rect width="400" height="600" fill="url(#sky)"/>
  <circle cx="330" cy="60" r="34" fill="#fff3a0"/>
  <path d="M0 150 l70 -70 l60 50 l70 -90 l90 100 l50 -40 l60 50 v60 h-400z" fill="#7aa0c4"/>
  <path d="M130 70 l20 20 l-18 -4 z M200 40 l22 26 l-22 -8 z" fill="#fff"/>
  <path d="M0 170 q100 -50 200 -10 q100 40 200 -10 v450 h-400z" fill="#6cc25a"/>
  <path d="M0 260 q120 -30 220 10 q100 30 180 0 v340 h-400z" fill="#5cb04b"/>
  <path d="M190 600 q-40 -120 30 -200 q60 -70 -10 -150 q-30 -40 0 -80" stroke="#c9a06a" stroke-width="26" fill="none" stroke-linecap="round"/>
  <path d="M190 600 q-40 -120 30 -200 q60 -70 -10 -150 q-30 -40 0 -80" stroke="#b08550" stroke-width="4" fill="none" stroke-dasharray="10 14"/>
  ${[[30, 200], [370, 210], [12, 330], [388, 360], [350, 470], [40, 470], [110, 560], [300, 570]].map(([x, y]) => `<g transform="translate(${x} ${y})"><rect x="-4" y="0" width="8" height="18" fill="#7a5230"/><path d="M0 -34 l20 34 h-40 z" fill="#2f8a3a" stroke="#1e5e27" stroke-width="3"/></g>`).join('')}
</svg>`;
