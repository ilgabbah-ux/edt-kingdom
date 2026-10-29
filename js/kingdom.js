// EDT Kingdom — il Campo Base da costruire e i personaggi
import { L } from './i18n.js';


export const CHARS = {
  gabbah: { name: L`Il Gabbah`, img: 'c_gabbah' },
  miti: { name: L`Miti, Protettore dell'EDT`, img: 'c_miti' },
  mirco: { name: 'Mirco', img: 'c_mirco' },
  purcello: { name: L`Purcello l'Ingroppatore`, img: 'c_purcello' },
  costa: { name: 'Costa', img: 'c_costa' },
  renard: { name: 'Renard', img: 'c_renard' },
  svetlana: { name: 'Svetlana', img: 'c_svetlana' },
  forestale: { name: L`La Forestale`, img: 'forestale' },
  forestale2: { name: L`La Forestale (in versione invernale)`, img: 'forestale2' },
  forestale3: { name: L`La Forestale del cantiere`, img: 'forestale3' },
  forestale4: { name: L`La Forestale in vacanza`, img: 'forestale4' },
};

// x,y in percentuale sulla mappa
const VALLE = [
  { id: 'bandiera', name: L`Bandiera EDT`, cost: 1, x: 50, y: 18, who: 'gabbah',
    text: L`Bandiera piantata! Da oggi questa valle è territorio EDT. Alla Forestale verrà un colpo.` },
  { id: 'bar', name: L`Bar "L'ultimo e poi andiamo"`, cost: 2, x: 20, y: 34, who: 'gabbah',
    text: L`Il bar è aperto. Regola della casa: l'ultimo e poi andiamo. E poi un altro ultimo.` },
  { id: 'garage', name: L`Garage di Renard`, cost: 3, x: 80, y: 34, who: 'renard',
    text: L`Garage pronto! Chiavi, bulloni e un armadio pieno di pezzi "che prima o poi servono".` },
  { id: 'tenda', name: L`Tenda di Mirco`, cost: 3, x: 20, y: 61, who: 'mirco',
    text: L`Tenda montata, con brandina e cartello Non disturbare. Se mi cercate, campa giù.` },
  { id: 'pista', name: L`Pista col salto`, cost: 4, x: 80, y: 61, who: 'miti',
    text: L`La pista col salto è pronta! Io sto in fondo con la GoPro: se cadete, almeno viene un bel video.` },
  { id: 'pesce', name: L`Bancarella del pesce di Costa`, cost: 4, x: 50, y: 47, who: 'costa',
    text: L`Bancarella aperta: trote, acciughe e pure un pesce spada. Con la birra va bene tutto, col pesce ancora meglio.` },
  { id: 'carro', name: L`Carro attrezzi di Purcello`, cost: 4, x: 50, y: 74, who: 'purcello',
    text: L`Carro attrezzi in servizio! Chi resta piantato nel fango non si preoccupi: arrivo da dietro, aggancio e via.` },
  { id: 'trono', name: L`Trono di Svetlana`, cost: 5, x: 20, y: 88, who: 'svetlana',
    text: L`Un trono tutto per me, finalmente! Ora qui comando io. Gentilmente.` },
  { id: 'statua', name: L`Statua del Gabbah`, cost: 6, x: 80, y: 88, who: 'gabbah',
    text: L`La statua! Birra alzata al cielo e sguardo fiero. Il Campo Base EDT è completo!` },
];


const PASSO = [
  { id: 'rifugio', name: L`Rifugio della Grappa`, x: 50, y: 18, who: 'gabbah',
    text: L`Il rifugio è aperto! Stufa accesa, grappa al caldo e scarponi ad asciugare. Qui si sta da re.` },
  { id: 'officina', name: L`Officina di montagna`, x: 20, y: 34, who: 'purcello',
    text: L`Catene da neve montate su tutte le moto. Chi si pianta nella neve lo tiro fuori io, come sempre: da dietro.` },
  { id: 'funivia', name: L`Funivia`, x: 80, y: 34, who: 'miti',
    text: L`La funivia funziona! Dalla cabina si riprende tutto il passo. Che inquadrature, ragazzi.` },
  { id: 'sauna', name: L`Sauna e tinozza`, x: 20, y: 61, who: 'mirco',
    text: L`Sauna pronta. Io qui dentro ci passo l'inverno intero. Campa giù, ma al caldo.` },
  { id: 'ghiaccio', name: L`Pista sul ghiaccio`, x: 80, y: 61, who: 'costa',
    text: L`Pista sul ghiaccio finita! E sotto il lago ghiacciato ci sono le trote più buone del Piemonte.` },
  { id: 'salumi', name: L`Spaccio di salumi e formaggi`, x: 50, y: 47, who: 'gabbah',
    text: L`Toma, salame e lardo. Il vero carburante dell'enduro invernale.` },
  { id: 'elisoccorso', name: L`Elisoccorso`, x: 50, y: 74, who: 'miti',
    text: L`Elisoccorso operativo. Speriamo di non usarlo... ma conoscendovi, teniamo il motore caldo.` },
  { id: 'festa', name: L`Baita della festa`, x: 20, y: 88, who: 'svetlana',
    text: L`Lucine, fuoco acceso e fusti al fresco nella neve. Stasera si balla in baita!` },
  { id: 'palazzo', name: L`Palazzo di ghiaccio`, x: 80, y: 88, who: 'svetlana',
    text: L`Un palazzo di ghiaccio tutto per l'EDT! Il Passo è conquistato. La Forestale può solo guardare.` },
];

const CAVA = [
  { id: 'miniera', name: L`Birreria della Miniera`, x: 50, y: 18, who: 'gabbah',
    text: L`Una vecchia miniera trasformata in birreria. Fresco tutto l'anno e nessun forestale sa dov'è l'ingresso.` },
  { id: 'ruspa', name: L`Ruspa di Purcello`, x: 20, y: 34, who: 'purcello',
    text: L`Con la ruspa sposto massi, moto piantate e amici in difficoltà. Arrivo sempre da dietro, si sa.` },
  { id: 'cingoli', name: L`Officina della Cava`, x: 80, y: 34, who: 'renard',
    text: L`Officina nuova, attrezzi nuovi. La mia moto? Quella la sistemo domani. Forse.` },
  { id: 'laghetto', name: L`Laghetto della Cava`, x: 20, y: 61, who: 'costa',
    text: L`Acqua turchese e trote che nessuno ha mai pescato. Fino a oggi. Grigliata stasera!` },
  { id: 'amaca', name: L`Angolo relax di Mirco`, x: 80, y: 61, who: 'mirco',
    text: L`Amaca, ombrellone e borsa frigo. Io da qui vi guardo lavorare. Campa giù!` },
  { id: 'torre', name: L`Torretta del Protettore`, x: 50, y: 47, who: 'miti',
    text: L`Da quassù vedo tutta la cava. Nessuno si perde, nessuno si fa male: il Protettore veglia.` },
  { id: 'hillclimb', name: L`Salita impossibile`, x: 50, y: 74, who: 'purcello',
    text: L`La salita più ripida del Piemonte. Chi si pianta a metà... lo spingo io fino in cima.` },
  { id: 'palco', name: L`Palco del concerto`, x: 20, y: 88, who: 'svetlana',
    text: L`Luci, casse e palla da discoteca. Stasera concerto in cava e io sono la regina della serata!` },
  { id: 'monumento', name: L`Monumento all'EDT`, x: 80, y: 88, who: 'gabbah',
    text: L`Una ruota e un boccale scolpiti nel marmo, per sempre. La Cava è nostra: EDT nella storia!` },
];

// il Marocco: ix, iy = posizione della radura nell'immagine (percentuale), così gli edifici cadono giusti su ogni schermo
const MAROCCO = [
  { id: 'tenda4', name: L`Tenda berbera`, ix: 66, iy: 74, who: 'gabbah',
    text: L`Tappeti, cuscini e lanterne. Si dorme sotto le stelle del deserto, e la sveglia la suona il cammello.` },
  { id: 'camion', name: L`Camion d'assistenza`, ix: 30, iy: 68, who: 'miti',
    text: L`Gomme di scorta, attrezzi e borsa frigo. Il Protettore non lascia nessuno a piedi, neanche nel Sahara.` },
  { id: 'pozzo', name: L`Pozzo dell'oasi`, ix: 52, iy: 54, who: 'costa',
    text: L`Acqua fresca dal pozzo. Ci sono pure dei pesciolini: stasera provo a pescarli.` },
  { id: 'container', name: L`Officina nel deserto`, ix: 64, iy: 43, who: 'renard',
    text: L`Un container, due palme e tutti gli attrezzi. La mia moto? Qui la sabbia entra ovunque, la sistemo al ritorno.` },
  { id: 'cammelli', name: L`Stalla dei cammelli`, ix: 32, iy: 44, who: 'purcello',
    text: L`Spingo moto, amici e adesso pure cammelli. Questo qui mi guarda male, però.` },
  { id: 'te', name: L`Tè alla menta`, ix: 46, iy: 33, who: 'svetlana',
    text: L`Un tè alla menta, poi musica e si balla fino all'alba. Il deserto è il palco più bello.` },
  { id: 'souk', name: L`Souk delle spezie`, ix: 65, iy: 25, who: 'gabbah',
    text: L`Spezie, tappeti e un venditore che mi ha venduto una lampada. Dice che dentro c'è un genio. Vedremo.` },
  { id: 'oasi', name: L`Oasi di Mirco`, ix: 32, iy: 26, who: 'mirco',
    text: L`Palme, acqua turchese e un'amaca. Ho trovato il paradiso. Campa giù, io resto qui.` },
  { id: 'duna', name: L`Salto della duna`, ix: 45, iy: 19, who: 'miti',
    text: L`Il salto più lungo mai ripreso con la GoPro. L'atterraggio... quello non lo pubblichiamo.` },
  { id: 'kasbah', name: L`Kasbah dell'EDT`, ix: 37, iy: 11, who: 'gabbah',
    text: L`Una kasbah tutta nostra, con la terrazza sul deserto. La bandiera EDT sventola anche qui.` },
  { id: 'bab', name: L`Porta del Marocco`, ix: 60, iy: 11, who: 'gabbah',
    text: L`La grande porta del Marocco con lo stendardo EDT. Da qui in poi, ogni giro è un giro easy.` },
];
export const ZONES = [
  { id: 'valle', name: L`La Valle`, bg: 'map_bg', boss: 'forestale', from: 1,
    // sentiero sulla mappa (pixel dell'immagine 1280x1280) per la moto che gira
    trail: [[430,1275],[470,1210],[530,1140],[580,1080],[600,1020],[600,960],[620,900],[655,840],[680,795],[650,768],[600,745],[595,705],[650,675],[700,648],[720,605],[700,570],[645,545],[600,515],[595,480],[640,450],[715,425],[760,398],[740,365],[690,345],[695,315],[745,290],[770,268],[740,248],[680,240],[610,236],[545,230]],
    buildings: VALLE },
  { id: 'passo', name: L`Il Passo`, bg: 'map2_bg', boss: 'forestale2', from: 31,
    trail: [[560,1260],[640,1180],[720,1100],[730,1020],[700,940],[680,860],[720,790],[700,740],[620,700],[580,640],[620,580],[560,530],[560,470],[620,420],[740,380],[760,340],[680,310],[580,280],[560,250],[620,220],[650,200]], buildings: PASSO },
  { id: 'cava', name: L`La Cava`, bg: 'map3_bg', boss: 'forestale3', from: 61,
    trail: [[610,1275],[600,1180],[590,1090],[610,1020],[630,960],[580,900],[540,860],[600,820],[670,790],[680,740],[620,700],[590,650],[640,620],[690,590],[640,550],[590,520],[610,470],[680,440],[700,400],[640,380],[610,340],[680,300],[720,260],[670,220],[680,170],[700,140]], buildings: CAVA },
  { id: 'marocco', name: L`Il Marocco`, bg: 'map4_bg', boss: 'forestale4', from: 91,
    trail: [[470,1275],[460,1180],[440,1090],[420,1010],[390,930],[400,860],[430,800],[440,740],[400,690],[380,640],[420,590],[500,560],[570,530],[620,480],[640,420],[600,360],[540,320],[520,270],[560,220],[620,180],[640,140]], buildings: MAROCCO },
];
VALLE.forEach((b) => { b.zone = 'valle'; });
PASSO.forEach((b) => { b.zone = 'passo'; });
CAVA.forEach((b) => { b.zone = 'cava'; });
MAROCCO.forEach((b) => { b.zone = 'marocco'; });
export const BUILDINGS = [...VALLE, ...PASSO, ...CAVA, ...MAROCCO];
// zona di un livello: 0 = Valle, 1 = Passo, 2 = Cava
export const zoneOfLevel = (n) => (n > 90 ? 3 : n > 60 ? 2 : n > 30 ? 1 : 0);
