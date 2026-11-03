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
  ...Object.fromEntries(['max', 'angelo', 'gusta', 'ciprian', 'daniel', 'linus', 'albertone', 'andrea', 'claudio', 'luigi', 'siro', 'erika', 'maggie', 'albo', 'sergio', 'paletta', 'brizio', 'alex', 'guccio']
    .map((id) => [id, { name: id[0].toUpperCase() + id.slice(1), img: 'c_' + id }])),
  forestale: { name: L`La Forestale`, img: 'forestale' },
  forestale2: { name: L`La Forestale (in versione invernale)`, img: 'forestale2' },
  forestale3: { name: L`La Forestale del cantiere`, img: 'forestale3' },
  forestale4: { name: L`La Forestale in vacanza`, img: 'forestale4' },
  forestale5: { name: L`La Forestale all'Oktoberfest`, img: 'forestale5' },
  forestale6: { name: L`La Forestale vampira`, img: 'forestale6' },
  forestale7: { name: L`La Forestale Babbo Natale`, img: 'forestale7' },
  forestale8: { name: L`La Forestale vigile urbano`, img: 'forestale8' },
  forestale9: { name: L`La Forestale commissario della Dakar`, img: 'forestale9' },
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
const OKTOBER = [
  { id: 'tendone', name: L`Tendone EDT`, ix: 68, iy: 77, who: 'gabbah',
    text: L`Il nostro tendone, bianco e blu con la bandiera EDT. Mille posti a sedere e nessuno che sta seduto.` },
  { id: 'wurstel', name: L`Griglia dei würstel`, ix: 29, iy: 70, who: 'albertone',
    text: L`Würstel, crauti e senape. La griglia non si spegne mai, come la sete.` },
  { id: 'brezel', name: L`Banco dei brezel`, ix: 53, iy: 56, who: 'costa',
    text: L`Brezel grandi come un volante. Ne ho preso uno per il pesce, giuro.` },
  { id: 'botti', name: L`Piramide di botti`, ix: 64, iy: 45, who: 'claudio',
    text: L`Dodici botti e un rubinetto solo. Il sommelier assaggia tutto, per sicurezza.` },
  { id: 'calcinculo', name: L`Calcinculo`, ix: 33, iy: 46, who: 'paletta',
    text: L`Gira, vola e salta come un coniglio. Dopo tre giri il brezel torna su.` },
  { id: 'banda', name: L`Palco della banda`, ix: 46, iy: 36, who: 'svetlana',
    text: L`Tuba, tamburi e Svetlana al microfono. Il pubblico canta, la Forestale balla di nascosto.` },
  { id: 'lebkuchen', name: L`Cuori di pan di zenzero`, ix: 64, iy: 28, who: 'erika',
    text: L`Cuori di zenzero con scritto "EDT". Uno è per Giacu, ovviamente.` },
  { id: 'maibaum', name: L`Albero della cuccagna`, ix: 33, iy: 28, who: 'brizio',
    text: L`Il palo bianco e blu della festa. Chi arriva in cima vince un boccale. Io ci arrivo in impennata.` },
  { id: 'ruota', name: L`Ruota panoramica`, ix: 46, iy: 21, who: 'miti',
    text: L`Da quassù si vede tutta la festa. La GoPro sul casco riprende pure le Alpi.` },
  { id: 'ottovolante', name: L`Montagne russe`, ix: 62, iy: 13, who: 'alex',
    text: L`Partenza a razzo e giro della morte. Il boccale resta pieno, il resto meno.` },
  { id: 'birreria', name: L`Birreria reale dell'EDT`, ix: 36, iy: 13, who: 'guccio',
    text: L`La birreria più bella della festa, con il boccale d'oro sul tetto. San Braulio benedice ogni spina.` },
];
// Halloween nel bosco (151-180)
const HALLO = [
  { id: 'zucche', name: L`Campo di zucche`, ix: 70, iy: 77, who: 'costa',
    text: L`Zucche grandi come pneumatici. Una l'ho svuotata e ci tengo le trote al fresco.` },
  { id: 'falo', name: L`Falò nel bosco`, ix: 30, iy: 70, who: 'mirco',
    text: L`Fuoco acceso, marshmallow e borsa frigo. Qui i fantasmi non arrivano. Spero. Campa giù.` },
  { id: 'cimitero', name: L`Cimitero delle moto`, ix: 52, iy: 56, who: 'renard',
    text: L`Qui riposano le moto che ho promesso di sistemare. Un giorno le resuscito. Forse.` },
  { id: 'pozioni', name: L`Banco delle pozioni`, ix: 33, iy: 46, who: 'claudio',
    text: L`Pozioni verdi, rosse e viola. Le ho assaggiate tutte: la migliore è il Barolo.` },
  { id: 'fantasmi', name: L`Carro dei fantasmi`, ix: 64, iy: 45, who: 'luigi',
    text: L`Fantasmi a bordo e giù in discesa. Spedivello anche col carro, non c'è niente da fare.` },
  { id: 'lanterne', name: L`Arco delle lanterne`, ix: 45, iy: 36, who: 'miti',
    text: L`Cento lanterne accese sul sentiero. Nessuno si perde nel bosco: il Protettore veglia.` },
  { id: 'strega', name: L`Capanna della strega`, ix: 33, iy: 28, who: 'svetlana',
    text: L`Calderone acceso, scopa parcheggiata. Stasera la strega sono io, e le pozioni le offro io.` },
  { id: 'rampa', name: L`Salto della luna`, ix: 64, iy: 27, who: 'brizio',
    text: L`Impennata, rampa e su davanti alla luna piena. La foto più bella dell'anno!` },
  { id: 'castello', name: L`Castello dell'EDT`, ix: 46, iy: 18, who: 'gabbah',
    text: L`Il castello della Forestale vampira adesso è nostro. Bandiera EDT sulla torre e birre in cantina!` },
];
// Natale in baita (181-210)
const NATALE = [
  { id: 'albero', name: L`Albero di Natale`, ix: 67, iy: 77, who: 'costa',
    text: L`Albero addobbato e sotto una moto col fiocco. Quest'anno Babbo Natale ha capito tutto.` },
  { id: 'mercatino', name: L`Mercatino di Natale`, ix: 31, iy: 70, who: 'erika',
    text: L`Cuori di pan di zenzero, palline e candele. Ho comprato tutto, anche il banco.` },
  { id: 'vinbrule', name: L`Chiosco del vin brulè`, ix: 53, iy: 57, who: 'mirco',
    text: L`Vin brulè bollente! Finalmente sento di nuovo le dita. Campa giù, un altro giro.` },
  { id: 'slittino', name: L`Pista da slittino`, ix: 32, iy: 46, who: 'brizio',
    text: L`Slittino o moto, per me è uguale: si scende in impennata.` },
  { id: 'presepe', name: L`Presepe dell'EDT`, ix: 64, iy: 45, who: 'svetlana',
    text: L`Il presepe dell'EDT: bue, asinello e una moto da enduro nella stalla. Perfetto.` },
  { id: 'elfi', name: L`Laboratorio degli elfi`, ix: 46, iy: 35, who: 'renard',
    text: L`Il laboratorio degli elfi! Le moto ve le sistemo entro Natale. Quale Natale, non lo so.` },
  { id: 'pattinaggio', name: L`Pista di pattinaggio`, ix: 33, iy: 28, who: 'maggie',
    text: L`Pista ghiacciata pronta. Io pattino, voi cadete. Tutto normale.` },
  { id: 'slitta', name: L`Slitta di Babbo Natale`, ix: 63, iy: 27, who: 'purcello',
    text: L`La slitta la tira una moto, e la moto la tiro io. Da dietro, come sempre.` },
  { id: 'baita', name: L`Baita dell'EDT`, ix: 46, iy: 20, who: 'gabbah',
    text: L`La baita dell'EDT! Stufa accesa, panettone e birre al fresco nella neve. Buon Natale, ragazzi!` },
];
// Capodanno in città (211-240)
const CAPODANNO = [
  { id: 'trattoria', name: L`Cotechino e lenticchie`, ix: 67, iy: 76, who: 'costa',
    text: L`Cotechino e lenticchie: portano soldi! Io ci aggiungo una trota, porta fortuna doppia.` },
  { id: 'bollicine', name: L`Bar delle bollicine`, ix: 30, iy: 70, who: 'claudio',
    text: L`Torre di bicchieri e spumante in fresco. Il primo brindisi lo offro io. Anche il secondo.` },
  { id: 'ballo', name: L`Pista da ballo`, ix: 52, iy: 57, who: 'erika',
    text: L`Palla da discoteca accesa! Stanotte si balla fino all'alba.` },
  { id: 'bus', name: L`Bus della festa`, ix: 32, iy: 46, who: 'luigi',
    text: L`Bus a due piani, musica a palla e giro della città. Spedivello anche col bus.` },
  { id: 'palco8', name: L`Palco di Capodanno`, ix: 64, iy: 45, who: 'svetlana',
    text: L`Sul palco ci salgo io: microfono acceso e tutta la piazza che canta con l'EDT!` },
  { id: 'discoteca', name: L`Discoteca EDT`, ix: 46, iy: 36, who: 'alex',
    text: L`Luci al neon e tappeto rosso. Il buttafuori fa entrare solo chi ha il casco.` },
  { id: 'terrazza', name: L`Terrazza sui tetti`, ix: 33, iy: 28, who: 'miti',
    text: L`Dalla terrazza si riprende tutta la città. La GoPro è pronta per mezzanotte.` },
  { id: 'fuochi', name: L`Rampa dei fuochi`, ix: 63, iy: 28, who: 'purcello',
    text: L`Razzi, fontane e girandole. Li accendo io: se qualcosa va storto, vi traino via io.` },
  { id: 'orologio', name: L`Torre dell'orologio`, ix: 47, iy: 19, who: 'gabbah',
    text: L`Dieci, nove, otto… La torre dell'orologio è nostra. Buon anno, EDT!` },
];
// La Dakar (241-270)
const DAKAR = [
  { id: 'carburante', name: L`Deposito carburante`, ix: 66, iy: 77, who: 'purcello',
    text: L`Fusti pieni e taniche in fila. Se qualcuno resta a secco, lo traino io fino a Dakar.` },
  { id: 'mensa', name: L`Mensa del bivacco`, ix: 29, iy: 70, who: 'mirco',
    text: L`Griglia accesa e borsa frigo piena. Al bivacco si mangia bene. Campa giù.` },
  { id: 'oasi9', name: L`L'oasi`, ix: 52, iy: 57, who: 'costa',
    text: L`Un'oasi con lo stagno! Ci sarà una trota del deserto? Io la canna la butto.` },
  { id: 'roadbook', name: L`Tenda della navigazione`, ix: 33, iy: 46, who: 'linus',
    text: L`Roadbook, GPS e bussola. Tranquilli, è un giro easy: sono solo ottocento chilometri.` },
  { id: 'officina9', name: L`Officina sotto le stelle`, ix: 64, iy: 45, who: 'renard',
    text: L`Officina aperta tutta la notte. La moto ve la riparo… domani. Forse dopodomani.` },
  { id: 'elicottero', name: L`Elicottero della gara`, ix: 45, iy: 36, who: 'miti',
    text: L`Dall'elicottero riprendo tutta la tappa. E se cadete, vi vengo a prendere io.` },
  { id: 'camion9', name: L`Camion della Dakar`, ix: 33, iy: 29, who: 'guccio',
    text: L`Il camion d'assistenza è arrivato: ricambi, gomme e un frigo pieno di birre.` },
  { id: 'cammello', name: L`Bivacco dei cammelli`, ix: 63, iy: 29, who: 'brizio',
    text: L`Ho provato a impennare anche il cammello. Lui non ha gradito.` },
  { id: 'podio', name: L`Podio del Lago Rosa`, ix: 46, iy: 21, who: 'gabbah',
    text: L`Il podio sul Lago Rosa! Dakar finita, coppa d'oro e spumante per tutti. L'EDT è leggenda!` },
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
  { id: 'oktober', name: L`L'Oktoberfest`, bg: 'map5_bg', boss: 'forestale5', from: 121,
    trail: [[640,1275],[605,1180],[575,1080],[555,990],[545,900],[575,830],[520,760],[470,700],[520,640],[600,600],[640,540],[655,470],[700,420],[700,360],[640,320],[580,270],[600,210],[640,160],[600,120]], buildings: OKTOBER },
  { id: 'hallo', name: L`Halloween nel bosco`, bg: 'map6_bg', boss: 'forestale6', from: 151,
    trail: [[600,1275],[590,1180],[560,1080],[510,990],[470,900],[510,820],[600,760],[660,700],[640,620],[590,560],[600,500],[660,450],[650,390],[600,330],[560,290],[600,240],[650,200],[620,170]], buildings: HALLO },
  { id: 'natale', name: L`Natale in baita`, bg: 'map7_bg', boss: 'forestale7', from: 181, trail: [[600,1275],[590,1180],[560,1080],[510,990],[470,900],[510,820],[600,760],[660,700],[640,620],[590,560],[600,500],[660,450],[650,390],[600,330],[560,290],[600,240],[650,200],[620,170]], buildings: NATALE },
  { id: 'capodanno', name: L`Capodanno in città`, bg: 'map8_bg', boss: 'forestale8', from: 211, trail: [[600,1275],[590,1180],[560,1080],[510,990],[470,900],[510,820],[600,760],[660,700],[640,620],[590,560],[600,500],[660,450],[650,390],[600,330],[560,290],[600,240],[650,200],[620,170]], buildings: CAPODANNO },
  { id: 'dakar', name: L`La Dakar`, bg: 'map9_bg', boss: 'forestale9', from: 241, trail: [[600,1275],[590,1180],[560,1080],[510,990],[470,900],[510,820],[600,760],[660,700],[640,620],[590,560],[600,500],[660,450],[650,390],[600,330],[560,290],[600,240],[650,200],[620,170]], buildings: DAKAR },
];
VALLE.forEach((b) => { b.zone = 'valle'; });
PASSO.forEach((b) => { b.zone = 'passo'; });
CAVA.forEach((b) => { b.zone = 'cava'; });
MAROCCO.forEach((b) => { b.zone = 'marocco'; });
OKTOBER.forEach((b) => { b.zone = 'oktober'; });
HALLO.forEach((b) => { b.zone = 'hallo'; });
NATALE.forEach((b) => { b.zone = 'natale'; });
CAPODANNO.forEach((b) => { b.zone = 'capodanno'; });
DAKAR.forEach((b) => { b.zone = 'dakar'; });
export const BUILDINGS = [...VALLE, ...PASSO, ...CAVA, ...MAROCCO, ...OKTOBER, ...HALLO, ...NATALE, ...CAPODANNO, ...DAKAR];
// zona di un livello: 0 = Valle, 1 = Passo, 2 = Cava
export const zoneOfLevel = (n) => (n > 240 ? 8 : n > 210 ? 7 : n > 180 ? 6 : n > 150 ? 5 : n > 120 ? 4 : n > 90 ? 3 : n > 60 ? 2 : n > 30 ? 1 : 0);
