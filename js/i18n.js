// i18n: Italian is the source language; English via dictionary (js/en.js)
import EN from './en.js';

const KEY = 'edtk-lang';
function detect() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'it' || q === 'en') { localStorage.setItem(KEY, q); return q; }
  } catch (e) {}
  try { const s = localStorage.getItem(KEY); if (s === 'it' || s === 'en') return s; } catch (e) {}
  const n = ((navigator.languages && navigator.languages[0]) || navigator.language || 'it').toLowerCase();
  return n.startsWith('it') ? 'it' : 'en';
}
export const LANG = detect();
const DICT = LANG === 'en' ? EN : null;

export function L(strings, ...vals) {
  let key = strings[0];
  for (let i = 0; i < vals.length; i++) key += '{' + i + '}' + strings[i + 1];
  const tr = DICT && DICT[key];
  if (!tr) {
    let out = strings[0];
    for (let i = 0; i < vals.length; i++) out += vals[i] + strings[i + 1];
    return out;
  }
  return vals.length ? tr.replace(/\{(\d+)\}/g, (m, i) => (i < vals.length ? vals[i] : m)) : tr;
}

// plain string lookup (for DOM text)
export const T = (s) => (DICT && DICT[s]) || s;

export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch (e) {}
  const u = new URL(location.href); u.searchParams.delete('lang');
  location.replace(u.toString());
}

export function translateDOM(root) {
  if (!DICT || !root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) {
    const p = n.parentNode && n.parentNode.nodeName;
    if (p === 'SCRIPT' || p === 'STYLE') continue;
    const raw = n.nodeValue, t = raw.trim().replace(/\s+/g, ' ');
    if (t && DICT[t]) n.nodeValue = raw.replace(raw.trim(), DICT[t]);
  }
  root.querySelectorAll('[title],[placeholder],[aria-label]').forEach((el) => {
    for (const a of ['title', 'placeholder', 'aria-label']) {
      const v = el.getAttribute(a); if (v && DICT[v.trim()]) el.setAttribute(a, DICT[v.trim()]);
    }
  });
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = LANG;
  if (DICT) translateDOM(document.body);
}
