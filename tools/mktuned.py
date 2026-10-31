# raccoglie i risultati della taratura (log di tools/tunez.mjs) in js/tuned.js
import re, sys, json, glob
T = {}
for f in sys.argv[1:]:
    for line in open(f):
        m = re.match(r'z(\d) L(\d+): \d+ -> (\d+)', line)
        if m: T.setdefault(m[1], {})[m[2]] = int(m[3])
open('js/tuned.js', 'w').write('// mosse tarate col simulatore per ogni scenario (tools/tunez.mjs + tools/mktuned.py)\nexport const TUNED = ' + json.dumps(T, separators=(',', ':')) + ';\n')
print({k: len(v) for k, v in T.items()})
