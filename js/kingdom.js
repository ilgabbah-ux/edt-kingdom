// EDT Kingdom — il Campo Base da costruire e i personaggi

const O = '#2b1d14';
const w = (inner, vb = '0 0 120 100') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`;

export const CHARS = {
  gabbah: { name: 'Il Gabbah', img: 'c_gabbah' },
  miti: { name: 'Miti, Protettore dell\'EDT', img: 'c_miti' },
  mirco: { name: 'Mirco', img: 'c_mirco' },
  purcello: { name: 'Purcello l\'Ingroppatore', img: 'c_purcello' },
  costa: { name: 'Costa', img: 'c_costa' },
  renard: { name: 'Renard', img: 'c_renard' },
  svetlana: { name: 'Svetlana', img: 'c_svetlana' },
  forestale: { name: 'La Forestale', img: 'forestale' },
};

// x,y in percentuale sulla mappa
export const BUILDINGS = [
  { id: 'bandiera', name: 'Bandiera EDT', cost: 1, x: 50, y: 18, who: 'gabbah',
    text: 'Bandiera piantata! Da oggi questo è territorio EDT. La Forestale non sarà contenta...' },
  { id: 'bar', name: 'Bar "L\'ultimo e poi andiamo"', cost: 2, x: 20, y: 34, who: 'gabbah',
    text: 'Il bar è aperto! Regola numero uno: l\'ultimo... e poi andiamo. Regola numero due: vedi regola numero uno.' },
  { id: 'garage', name: 'Garage di Renard', cost: 3, x: 80, y: 34, who: 'renard',
    text: 'Garage pronto! Ho già messo il Wi-Fi: adesso le moto si scaricano gli aggiornamenti da sole. In teoria.' },
  { id: 'tenda', name: 'Tenda di Mirco', cost: 3, x: 20, y: 61, who: 'mirco',
    text: 'Tenda montata. Ci ho messo dentro un letto, una flebo e un cartello "NON DISTURBARE". Campa giù!' },
  { id: 'pista', name: 'Pista col salto', cost: 4, x: 80, y: 61, who: 'miti',
    text: 'La pista è pronta! Io sto in fondo al salto con la GoPro: se cadete, almeno viene un bel video.' },
  { id: 'pesce', name: 'Bancarella del pesce di Costa', cost: 4, x: 50, y: 47, who: 'costa',
    text: 'Bancarella aperta! Trote, acciughe e pesce spada. La birra si abbina a tutto, il pesce di più.' },
  { id: 'carro', name: 'Carro attrezzi di Purcello', cost: 4, x: 50, y: 74, who: 'purcello',
    text: 'Chi si pianta nel fango non deve preoccuparsi: arrivo da dietro, aggancio, e via! Nessuno resta indietro.' },
  { id: 'trono', name: 'Trono di Svetlana', cost: 5, x: 20, y: 88, who: 'svetlana',
    text: 'Un trono tutto per me! Era ora. Prima ero sempre sgonfia di entusiasmo... adesso mi sento una regina.' },
  { id: 'statua', name: 'Statua del Gabbah', cost: 6, x: 80, y: 88, who: 'gabbah',
    text: 'La statua! Fiera, maestosa, con la birra alzata al cielo. Il Campo Base EDT è COMPLETO!' },
];

