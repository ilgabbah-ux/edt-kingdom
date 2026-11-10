// Aggiunta al server della classifica (Apps Script "Giro Easy Classifica", versione 20 del 6/11/2026)
// in doGet, subito dopo la riga action === 'hit':
  if (p.action === 'cloudsave' || p.action === 'cloudload') { let r; try { r = cloud_(p); } catch (err) { r = { ok: true, cloud: true, err: 'busy' }; } return reply_(r, p.callback); }

// v1 EDT Kingdom · SALVATAGGIO NEL CLOUD: i progressi del gioco (impacchettati dal gioco) si salvano col nome protetto
// e si ricaricano su un altro telefono con nome + codice pilota. Foglio "Salvataggi": nome, impronta del codice, dati, data, livello.
// GET ?action=cloudsave&name=..&k=..&data=..&lv=..  → { cloud: true, saved }   (taken: il nome è di un altro codice)
// GET ?action=cloudload&name=..&k=..                → { cloud: true, data, at } (none: niente salvato · wrong: codice sbagliato)
function saves_() {
  const ss = SpreadsheetApp.openById('1AVbuMrd3tPI9DCSv0b3XZo9q64egWY3yq1yan2OEHQg');
  let s = ss.getSheetByName('Salvataggi');
  if (!s) { s = ss.insertSheet('Salvataggi'); s.getRange(1, 1, 1, 5).setValues([['Nome', 'Impronta codice', 'Dati', 'Aggiornato', 'Livello']]).setFontWeight('bold'); s.setFrozenRows(1); }
  return s;
}
function cloud_(p) {
  const name = clean_(p.name, 16), key = name.toLowerCase();
  const k = /^[a-z0-9]{4,12}$/.test(p.k || '') ? p.k : '';
  if (!name || !k) return { ok: true, cloud: true, err: 'args' };
  const c = CacheService.getScriptCache(), fk = 'cf|' + key, fails = Number(c.get(fk) || 0);
  if (fails >= 20) return { ok: true, cloud: true, err: 'locked' };   // troppi codici sbagliati: riprova domani
  const s = saves_(), last = s.getLastRow();
  const rows = last > 1 ? s.getRange(2, 1, last - 1, 2).getValues() : [];
  const i = rows.findIndex(r => String(r[0]) === key);
  if (p.action === 'cloudload') {
    if (i < 0) return { ok: true, cloud: true, none: true };
    if (rows[i][1] !== hash_(k)) { c.put(fk, String(fails + 1), 21600); return { ok: true, cloud: true, wrong: true }; }
    const v = s.getRange(i + 2, 3, 1, 2).getValues()[0];
    return { ok: true, cloud: true, data: String(v[0]), at: v[1] instanceof Date ? v[1].toISOString() : '' };
  }
  const data = /^[zj][\w-]{20,40000}$/.test(p.data || '') ? p.data : '';
  if (!data) return { ok: true, cloud: true, err: 'data' };
  const lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try {
    if (!claim_(name, k)) return { ok: true, cloud: true, taken: true };
    const lv = Math.max(0, Math.min(99999, Math.round(Number(p.lv) || 0)));
    if (i >= 0) {
      if (rows[i][1] !== hash_(k)) return { ok: true, cloud: true, taken: true };
      s.getRange(i + 2, 3, 1, 3).setValues([[data, new Date(), lv]]);
    } else s.appendRow([key, hash_(k), data, new Date(), lv]);
  } finally { lock.releaseLock(); }
  return { ok: true, cloud: true, saved: true };
}

// ---- 10/11/2026 (versioni 24-25 dell'app web): classifiche del Kingdom separate da Giro Easy ----
// in cima:   let SHEET_NOW = SHEET;  const gameSheet_ = (p) => (p && p.gioco === 'kingdom' ? 'Kingdom' : SHEET);
// sheet_():  usa SHEET_NOW (crea il foglio "Kingdom" con le intestazioni se manca)
// doGet/doPost: SHEET_NOW = gameSheet_(p) subito dopo aver letto i parametri
// cache delle classifiche: chiave ['b', SHEET_NOW, grp, ...] per non mischiare i due giochi
// spostaKingdom(): una tantum, ha spostato 289 righe del Kingdom da "Punteggi" a "Kingdom" (copia di sicurezza "Backup Punteggi")
