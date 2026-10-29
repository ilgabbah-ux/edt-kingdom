"""Crea dist/EDT_Kingdom.html: un unico file con codice, grafica e font dentro. Si apre anche offline."""
import base64, os, re, subprocess
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)
subprocess.run(['npx', '-y', 'esbuild@0.24.0', 'js/game.js', '--bundle', '--format=iife', '--minify', '--target=es2017', '--outfile=dist/bundle.js'], check=True, capture_output=True)
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
css = open('style.css').read()
css = re.sub(r"url\('img/([\w]+)\.webp'\)", lambda m: f"url('data:image/webp;base64,{b64('img/' + m.group(1) + '.webp')}')", css)
css = re.sub(r"url\('fonts/([\w]+)\.woff2'\)", lambda m: f"url('data:font/woff2;base64,{b64('fonts/' + m.group(1) + '.woff2')}')", css)
assets = {f[:-5]: 'data:image/webp;base64,' + b64('img/' + f) for f in sorted(os.listdir('img')) if f.endswith('.webp')}
amap = 'window.__A={' + ','.join(f'"{k}":"{v}"' for k, v in assets.items()) + '};'
voices = {f[:-4]: 'data:audio/mpeg;base64,' + b64('audio/' + f) for f in sorted(os.listdir('audio')) if f.endswith('.mp3')}
amap += 'window.__V={' + ','.join(f'"{k}":"{v}"' for k, v in voices.items()) + '};'
html = open('index.html').read()
body = html.split('<body>')[1].split('<script')[0]
icon = 'data:image/png;base64,' + b64('icon2-192.png')
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
<body>{body}<script>
window.addEventListener('error', function () {{ window.__err = 1; }});
setTimeout(function () {{
  var l = document.getElementById('loading');
  if (!l) return;
  if (window.__EDT) {{ l.parentNode.removeChild(l); return; }}
  l.querySelector('small').innerHTML = 'Questo visualizzatore non riesce ad avviare il gioco.<br>Apri il file con <b>Chrome</b> (Android) o <b>Safari</b> (iPhone):<br>tieni premuto il file → Apri con → Chrome.';
}}, 7000);
</script><script>{amap}</script>
<script>{open('dist/bundle.js').read()}</script>
</body>
</html>'''
open('dist/EDT_Kingdom.html', 'w').write(out)
os.remove('dist/bundle.js')
print('dist/EDT_Kingdom.html', round(len(out) / 1024 / 1024, 2), 'MB')
