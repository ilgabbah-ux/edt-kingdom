#!/bin/sh
# Crea game.min.js (un solo file, caricamento più veloce) e aggiorna la cache del service worker
set -e
cd "$(dirname "$0")/.."
npx -y esbuild@0.24.0 js/game.js --bundle --format=iife --minify --target=es2017 --outfile=game.min.js
V=$(date +%s)
{
  echo "const CACHE = 'edtk-$V';"
  printf "const FILES = ['./', 'index.html', 'style.css?v=64', 'game.min.js?v=64', 'manifest.json', 'icon2-192.png', 'icon2-512.png', 'icon2-mask.png'"
  # all'installazione solo l'essenziale; storia, voci e musica si salvano la prima volta che servono
  for f in img/*.webp fonts/*.woff2; do case "$f" in img/st*) ;; *) printf ", '%s'" "$f";; esac; done
  echo "];"
  # tutto il resto (storia, voci, musiche) si scarica in sottofondo dopo l'installazione: così il gioco va anche senza campo
  echo "const MEDIA = 'edtk-media-$(ls -l img/st*.webp audio/*.mp3 | md5sum | cut -c1-8)';"
  printf "const LATE = ["
  sep=""; for f in img/st*.webp audio/*.mp3; do printf "%s'%s'" "$sep" "$f"; sep=", "; done
  echo "];"
  cat <<'JS'
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== MEDIA && k !== 'edtk-meta').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
  // in sottofondo, un file alla volta: storia, voci e musiche per giocare offline
  caches.open(MEDIA).then(async (c) => { for (const f of LATE) { try { if (!(await c.match(f))) await c.add(f); } catch (err) { /* riprova la prossima volta */ } } });
});
// pallino sull'icona quando c'è la ruota del giorno da girare (Android, app installata)
self.addEventListener('periodicsync', (e) => {
  if (e.tag !== 'edt-badge') return;
  e.waitUntil(caches.open('edtk-meta').then((c) => c.match('daily-last')).then((r) => (r ? r.text() : '')).then((last) => {
    const d = new Date(), today = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    if (last !== today && self.navigator.setAppBadge) return self.navigator.setAppBadge(1);
  }).catch(() => {}));
});
// rete prima per pagina e codice (così gli aggiornamenti arrivano subito), cache prima per immagini e font
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isAsset = /\.(webp|png|woff2|mp3)$/.test(url.pathname);
  if (isAsset) e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return res; })));
  else e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return res; }).catch(() => caches.match(e.request)));
});
JS
} > sw.js
echo "build ok"
