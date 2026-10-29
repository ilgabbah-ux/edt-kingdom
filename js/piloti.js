// EDT Kingdom — i piloti di Giro Easy come "compagni di giro": uno alla volta ti accompagna nel livello con il suo aiuto
import { L } from './i18n.js';

// perk: power = potenziamenti già in griglia · moves = mosse in più · clear = ostacoli tolti all'inizio
// coins = % monete in più · save = +5 mosse gratis la prima volta che finisci le mosse
// streak = se perdi non perdi la serie · hammer = un martello gratis · sprint = Moto quando restano 5 mosse
export const BUDDIES = [
  { id: 'max', name: 'Max', nick: L`Turbo facile`, at: 3, perk: { power: ['mH'] }, desc: L`Parte con una <b>Moto</b> già in griglia.`,
    lines: [L`Turbo carico, si parte! Ti lascio una moto pronta.`, L`Io il turbo lo carico prima ancora di accendere.`] },
  { id: 'angelo', name: 'Angelo', nick: L`Amico delle pietre`, at: 6, perk: { clear: 'rock', n: 4 }, desc: L`Spacca <b>4 sassi</b> appena parti.`,
    lines: [L`Le pietre? Sono amiche mie. Le saluto una a una.`, L`Sassi e gradoni non mi fanno niente. Lascia fare a me.`] },
  { id: 'gusta', name: 'Gusta', nick: L`Trinciatutto`, at: 9, perk: { clear: 'mud', n: 6 }, desc: L`Trincia <b>6 caselle di fango</b> all'inizio.`,
    lines: [L`Al Gusta Ranch la trincia passa ovunque. Anche qui.`, L`Fango? Lo trincio e ci faccio pure i punti.`] },
  { id: 'ciprian', name: 'Ciprian', nick: L`Salitone`, at: 12, perk: { moves: 3 }, desc: L`<b>+3 mosse</b> (o +12 secondi nei livelli a tempo).`,
    lines: [L`In salita non mollo mai il gas. Tieni, tre mosse in più.`, L`Più è ripida, più mi diverto.`] },
  { id: 'daniel', name: 'Daniel', nick: L`Re della scia`, at: 15, perk: { moves: 2, coins: 20 }, desc: L`<b>+2 mosse</b> e <b>+20% monete</b> se vinci.`,
    lines: [L`Stammi in scia e vedrai che arriviamo primi.`, L`La scia la prendo anche da lontano. Tu tira dritto.`] },
  { id: 'linus', name: 'Linus', nick: L`Scrubber`, at: 18, perk: { power: ['drone'] }, desc: L`Parte con un <b>Drone</b> già in griglia.`,
    lines: [L`Due scrub per salto, minimo. E un drone per te.`, L`Scrub, whip e un drone in regalo: oggi si fa spettacolo.`] },
  { id: 'albertone', name: 'Albertone', nick: L`Carrarmato`, at: 21, perk: { clear: 'crate', n: 4 }, desc: L`Sfonda <b>4 casse</b> appena parti.`,
    lines: [L`Casse in mezzo al sentiero? Ci passo sopra.`, L`Mi fermano le botte? Mai visto succedere.`] },
  { id: 'andrea', name: 'Andrea', nick: L`Precisione`, at: 24, perk: { coins: 60 }, desc: L`<b>+60% monete</b> quando vinci.`,
    lines: [L`Salto perfetto, atterraggio perfetto, conto perfetto.`, L`Tu fai i tris, io conto le monete.`] },
  { id: 'claudio', name: 'Claudio', nick: L`Sommelier`, at: 27, perk: { power: ['grappa'] }, desc: L`Parte con una <b>Grappa</b> già in griglia.`,
    lines: [L`Un rosso di quelli buoni? No, oggi offro la grappa.`, L`Con il vino giusto le birre valgono il triplo.`] },
  { id: 'luigi', name: 'Luigi', nick: L`Spedivellatore`, at: 30, perk: { power: ['bomb'] }, desc: L`Parte con una <b>Tanica</b> già in griglia.`,
    lines: [L`In discesa spedivello e non mi prende nessuno.`, L`Tanica piena, si va giù a manetta.`] },
  { id: 'siro', name: 'Siro', nick: L`Sgusciante`, at: 33, perk: { hammer: 1 }, desc: L`Un <b>Martello gratis</b> in ogni livello.`,
    lines: [L`Passo nei buchi dove non passa nessuno. Tieni il martello.`, L`Una tessera ti blocca? La sgusciamo via.`] },
  { id: 'erika', name: 'Erika', nick: L`Ci pensa Giacu`, at: 36, perk: { save: 5 }, desc: L`Se finisci le mosse, arriva Giacu: <b>+5 mosse gratis</b> (una volta).`,
    lines: [L`Tranquillo, se va male ci pensa Giacu.`, L`Giacu mi rimette in sella sempre. Anche a te.`] },
  { id: 'maggie', name: 'Maggie', nick: L`Sprint finale`, at: 39, perk: { sprint: 1 }, desc: L`Quando restano <b>5 mosse</b> ti regala una <b>Moto</b>.`,
    lines: [L`Il bello arriva alla fine: tieni duro!`, L`Ultimo giro? È lì che do il meglio.`] },
  { id: 'albo', name: 'Albo', nick: L`Acqua? Mai`, at: 42, perk: { clear: 'chain', n: 4 }, desc: L`Toglie <b>4 catene, ghiacci, nastri o sabbie</b> all'inizio.`,
    lines: [L`L'acqua la lascio ai pesci. Io porto la birra.`, L`Catene e ghiaccio? Roba da chi beve acqua.`] },
  { id: 'sergio', name: 'Sergio', nick: L`Capitan Schettino`, at: 45, perk: { streak: 1, moves: 1 }, desc: L`<b>+1 mossa</b> e se perdi <b>non perdi la serie</b> di vittorie.`,
    lines: [L`Se la nave affonda, io sono già sulla scialuppa. Ma la tua serie la salvo.`, L`Abbandono la nave per primo, ma torno sempre con i rinforzi.`] },
  { id: 'paletta', name: 'Paletta', nick: L`Bunny boy`, at: 48, perk: { power: ['mH'], moves: 2 }, desc: L`Una <b>Moto</b> in griglia e <b>+2 mosse</b>.`,
    lines: [L`Salto come un coniglio! Più alto, più lungo.`, L`Boing! Due mosse in più e una moto.`] },
  { id: 'brizio', name: 'Brizio', nick: L`Re dell'impennata`, at: 51, perk: { power: ['mH', 'mH'] }, desc: L`Parte con <b>2 Moto</b> già in griglia.`,
    lines: [L`Yee-haw! Ruota davanti in aria per sei secondi.`, L`Impennata e via, due moto per te.`] },
  { id: 'alex', name: 'Alex', nick: L`Partenza a razzo`, at: 54, perk: { power: ['bomb', 'mH'] }, desc: L`Parte con una <b>Tanica</b> e una <b>Moto</b> in griglia.`,
    lines: [L`Al semaforo verde sono già alla curva.`, L`Partenza a razzo: tanica e moto, subito!`] },
  { id: 'guccio', name: 'Guccio', nick: L`Benedetto da San Braulio`, at: 57, perk: { power: ['grappa'], moves: 2 }, desc: L`Una <b>Grappa</b> in griglia e <b>+2 mosse</b>.`,
    lines: [L`San Braulio mi ha benedetto. E oggi benedice anche te.`, L`Un goccio di grappa e la strada si apre.`] },
];
export const BUDDY = Object.fromEntries(BUDDIES.map((b) => [b.id, b]));
export const unlockedBuddies = (lvl) => BUDDIES.filter((b) => lvl > b.at);
