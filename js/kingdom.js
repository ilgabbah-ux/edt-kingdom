// EDT Kingdom — il Campo Base da costruire e i personaggi


export const CHARS = {
  gabbah: { name: 'Il Gabbah', img: 'c_gabbah' },
  miti: { name: 'Miti, Protettore dell\'EDT', img: 'c_miti' },
  mirco: { name: 'Mirco', img: 'c_mirco' },
  purcello: { name: 'Purcello l\'Ingroppatore', img: 'c_purcello' },
  costa: { name: 'Costa', img: 'c_costa' },
  renard: { name: 'Renard', img: 'c_renard' },
  svetlana: { name: 'Svetlana', img: 'c_svetlana' },
  forestale: { name: 'La Forestale', img: 'forestale' },
  forestale2: { name: 'La Forestale (in versione invernale)', img: 'forestale2' },
  forestale3: { name: 'La Forestale del cantiere', img: 'forestale3' },
};

// x,y in percentuale sulla mappa
const VALLE = [
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


const PASSO = [
  { id: 'rifugio', name: 'Rifugio della Grappa', x: 50, y: 18, who: 'gabbah',
    text: 'Il rifugio è aperto! Stufa accesa, grappa al caldo e scarponi ad asciugare. Qui si sta da re.' },
  { id: 'officina', name: 'Officina di montagna', x: 20, y: 34, who: 'purcello',
    text: 'Catene da neve montate su tutte le moto. Chi si pianta nella neve lo tiro fuori io, come sempre: da dietro.' },
  { id: 'funivia', name: 'Funivia', x: 80, y: 34, who: 'miti',
    text: 'La funivia funziona! Dalla cabina si riprende tutto il passo. Che inquadrature, ragazzi.' },
  { id: 'sauna', name: 'Sauna e tinozza', x: 20, y: 61, who: 'mirco',
    text: 'Sauna pronta. Io qui dentro ci passo l\'inverno intero. Campa giù, ma al caldo.' },
  { id: 'ghiaccio', name: 'Pista sul ghiaccio', x: 80, y: 61, who: 'costa',
    text: 'Pista sul ghiaccio finita! E sotto il lago ghiacciato ci sono le trote più buone del Piemonte.' },
  { id: 'salumi', name: 'Spaccio di salumi e formaggi', x: 50, y: 47, who: 'gabbah',
    text: 'Toma, salame e lardo. Il vero carburante dell\'enduro invernale.' },
  { id: 'elisoccorso', name: 'Elisoccorso', x: 50, y: 74, who: 'miti',
    text: 'Elisoccorso operativo. Speriamo di non usarlo... ma conoscendovi, teniamo il motore caldo.' },
  { id: 'festa', name: 'Baita della festa', x: 20, y: 88, who: 'svetlana',
    text: 'Lucine, fuoco acceso e fusti al fresco nella neve. Stasera si balla in baita!' },
  { id: 'palazzo', name: 'Palazzo di ghiaccio', x: 80, y: 88, who: 'svetlana',
    text: 'Un palazzo di ghiaccio tutto per l\'EDT! Il Passo è conquistato. La Forestale può solo guardare.' },
];

const CAVA = [
  { id: 'miniera', name: 'Birreria della Miniera', x: 50, y: 18, who: 'gabbah',
    text: 'Una vecchia miniera trasformata in birreria. Fresco tutto l\'anno e nessun forestale sa dov\'è l\'ingresso.' },
  { id: 'ruspa', name: 'Ruspa di Purcello', x: 20, y: 34, who: 'purcello',
    text: 'Con la ruspa sposto massi, moto piantate e amici in difficoltà. Arrivo sempre da dietro, si sa.' },
  { id: 'cingoli', name: 'Officina della Cava', x: 80, y: 34, who: 'renard',
    text: 'Officina nuova, attrezzi nuovi. La mia moto? Quella la sistemo domani. Forse.' },
  { id: 'laghetto', name: 'Laghetto della Cava', x: 20, y: 61, who: 'costa',
    text: 'Acqua turchese e trote che nessuno ha mai pescato. Fino a oggi. Grigliata stasera!' },
  { id: 'amaca', name: 'Angolo relax di Mirco', x: 80, y: 61, who: 'mirco',
    text: 'Amaca, ombrellone e borsa frigo. Io da qui vi guardo lavorare. Campa giù!' },
  { id: 'torre', name: 'Torretta del Protettore', x: 50, y: 47, who: 'miti',
    text: 'Da quassù vedo tutta la cava. Nessuno si perde, nessuno si fa male: il Protettore veglia.' },
  { id: 'hillclimb', name: 'Salita impossibile', x: 50, y: 74, who: 'purcello',
    text: 'La salita più ripida del Piemonte. Chi si pianta a metà... lo spingo io fino in cima.' },
  { id: 'palco', name: 'Palco del concerto', x: 20, y: 88, who: 'svetlana',
    text: 'Luci, casse e palla da discoteca. Stasera concerto in cava e io sono la regina della serata!' },
  { id: 'monumento', name: 'Monumento all\'EDT', x: 80, y: 88, who: 'gabbah',
    text: 'Una ruota e un boccale scolpiti nel marmo, per sempre. La Cava è nostra: EDT nella storia!' },
];

export const ZONES = [
  { id: 'valle', name: 'La Valle', bg: 'map_bg', boss: 'forestale', from: 1,
    // sentiero sulla mappa (pixel dell'immagine 1280x1280) per la moto che gira
    trail: [[430,1275],[470,1210],[530,1140],[580,1080],[600,1020],[600,960],[620,900],[655,840],[680,795],[650,768],[600,745],[595,705],[650,675],[700,648],[720,605],[700,570],[645,545],[600,515],[595,480],[640,450],[715,425],[760,398],[740,365],[690,345],[695,315],[745,290],[770,268],[740,248],[680,240],[610,236],[545,230]],
    buildings: VALLE },
  { id: 'passo', name: 'Il Passo', bg: 'map2_bg', boss: 'forestale2', from: 31,
    trail: [[560,1260],[640,1180],[720,1100],[730,1020],[700,940],[680,860],[720,790],[700,740],[620,700],[580,640],[620,580],[560,530],[560,470],[620,420],[740,380],[760,340],[680,310],[580,280],[560,250],[620,220],[650,200]], buildings: PASSO },
  { id: 'cava', name: 'La Cava', bg: 'map3_bg', boss: 'forestale3', from: 61,
    trail: [[610,1275],[600,1180],[590,1090],[610,1020],[630,960],[580,900],[540,860],[600,820],[670,790],[680,740],[620,700],[590,650],[640,620],[690,590],[640,550],[590,520],[610,470],[680,440],[700,400],[640,380],[610,340],[680,300],[720,260],[670,220],[680,170],[700,140]], buildings: CAVA },
];
VALLE.forEach((b) => { b.zone = 'valle'; });
PASSO.forEach((b) => { b.zone = 'passo'; });
CAVA.forEach((b) => { b.zone = 'cava'; });
export const BUILDINGS = [...VALLE, ...PASSO, ...CAVA];
// zona di un livello: 0 = Valle, 1 = Passo, 2 = Cava
export const zoneOfLevel = (n) => (n > 60 ? 2 : n > 30 ? 1 : 0);
