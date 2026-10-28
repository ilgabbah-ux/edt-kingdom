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
    text: 'Bandiera piantata! Da oggi questa valle è territorio EDT. Alla Forestale verrà un colpo.' },
  { id: 'bar', name: 'Bar "L\'ultimo e poi andiamo"', cost: 2, x: 20, y: 34, who: 'gabbah',
    text: 'Il bar è aperto. Regola della casa: l\'ultimo e poi andiamo. E poi un altro ultimo.' },
  { id: 'garage', name: 'Garage di Renard', cost: 3, x: 80, y: 34, who: 'renard',
    text: 'Garage pronto! Chiavi, bulloni e un armadio pieno di pezzi \"che prima o poi servono\".' },
  { id: 'tenda', name: 'Tenda di Mirco', cost: 3, x: 20, y: 61, who: 'mirco',
    text: 'Tenda montata, con brandina e cartello Non disturbare. Se mi cercate, campa giù.' },
  { id: 'pista', name: 'Pista col salto', cost: 4, x: 80, y: 61, who: 'miti',
    text: 'La pista col salto è pronta! Io sto in fondo con la GoPro: se cadete, almeno viene un bel video.' },
  { id: 'pesce', name: 'Bancarella del pesce di Costa', cost: 4, x: 50, y: 47, who: 'costa',
    text: 'Bancarella aperta: trote, acciughe e pure un pesce spada. Con la birra va bene tutto, col pesce ancora meglio.' },
  { id: 'carro', name: 'Carro attrezzi di Purcello', cost: 4, x: 50, y: 74, who: 'purcello',
    text: 'Carro attrezzi in servizio! Chi resta piantato nel fango non si preoccupi: arrivo da dietro, aggancio e via.' },
  { id: 'trono', name: 'Trono di Svetlana', cost: 5, x: 20, y: 88, who: 'svetlana',
    text: 'Un trono tutto per me, finalmente! Ora qui comando io. Gentilmente.' },
  { id: 'statua', name: 'Statua del Gabbah', cost: 6, x: 80, y: 88, who: 'gabbah',
    text: 'La statua! Birra alzata al cielo e sguardo fiero. Il Campo Base EDT è completo!' },
];

