"""Crea dist/EDT_Kingdom.html: un unico file con codice, grafica e font dentro. Si apre anche offline."""
import base64, os, re, subprocess
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)
subprocess.run(['npx', '-y', 'esbuild@0.24.0', 'js/game.js', '--bundle', '--format=iife', '--minify', '--outfile=dist/bundle.js'], check=True, capture_output=True)
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
css = open('style.css').read()
css = re.sub(r"url\('img/([\w]+)\.webp'\)", lambda m: f"url('data:image/webp;base64,{b64('img/' + m.group(1) + '.webp')}')", css)
css = re.sub(r"url\('fonts/([\w]+)\.woff2'\)", lambda m: f"url('data:font/woff2;base64,{b64('fonts/' + m.group(1) + '.woff2')}')", css)
assets = {f[:-5]: 'data:image/webp;base64,' + b64('img/' + f) for f in sorted(os.listdir('img')) if f.endswith('.webp')}
amap = 'window.__A={' + ','.join(f'"{k}":"{v}"' for k, v in assets.items()) + '};'
html = open('index.html').read()
body = html.split('<body>')[1].split('<script')[0]
icon = 'data:image/png;base64,' + b64('icon-192.png')
out = f'''<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#2a8a37">
<title>EDT Kingdom</title>
<link rel="icon" href="{icon}">
<link rel="apple-touch-icon" href="{icon}">
<style>{css}</style>
</head>
<body>{body}<script>{amap}</script>
<script>{open('dist/bundle.js').read()}</script>
</body>
</html>'''
open('dist/EDT_Kingdom.html', 'w').write(out)
os.remove('dist/bundle.js')
print('dist/EDT_Kingdom.html', round(len(out) / 1024 / 1024, 2), 'MB')
