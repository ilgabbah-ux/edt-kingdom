#!/bin/bash
# Pubblica lo stesso gioco su tutti e due i siti: edt-kingdom e kingdom (quello usato sul telefono)
set -e
cd "$(dirname "$0")/.."
git push -q
K=/home/claude/kingdom
[ -d "$K/.git" ] || git clone -q --depth 1 https://github.com/ilgabbah-ux/kingdom "$K"
cp "$K/manifest.json" /tmp/kman.json
find "$K" -mindepth 1 -maxdepth 1 ! -name .git ! -name .nojekyll -exec rm -rf {} +
tar --exclude=.git --exclude=dist/.lite -cf - . | (cd "$K" && tar -xf -)
cp /tmp/kman.json "$K/manifest.json"
cd "$K" && git add -A && (git diff --cached --quiet || git commit -qm "Allineato a edt-kingdom $(cd - >/dev/null; git log --oneline -1 | cut -c1-7)") && git push -q
echo "pubblicato su edt-kingdom e kingdom"
