"""Scarica un'immagine generata, toglie lo sfondo bianco (flood fill dai bordi) e salva un webp."""
import sys, io, urllib.request
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

def cutout(img, tol=28):
    a = np.array(img.convert('RGBA'))
    h, w = a.shape[:2]
    rgb = a[:, :, :3].astype(int)
    white = (np.abs(rgb - 255).max(axis=2) <= tol)
    mask = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if white[y, x] and not mask[y, x]: mask[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if white[y, x] and not mask[y, x]: mask[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny, nx = y+dy, x+dx
            if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not mask[ny, nx]:
                mask[ny, nx] = True; q.append((ny, nx))
    alpha = np.where(mask, 0, 255).astype(np.uint8)
    am = Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1))
    out = Image.fromarray(a)
    out.putalpha(am)
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out

if __name__ == '__main__':
    url, dst, size = sys.argv[1], sys.argv[2], int(sys.argv[3])
    keep_bg = len(sys.argv) > 4 and sys.argv[4] == 'bg'
    data = urllib.request.urlopen(url).read()
    im = Image.open(io.BytesIO(data))
    im = im.convert('RGB') if keep_bg else cutout(im)
    im.thumbnail((size, size), Image.LANCZOS)
    if not keep_bg:
        sq = Image.new('RGBA', (max(im.size),) * 2, (0, 0, 0, 0))
        sq.paste(im, ((sq.width - im.width) // 2, (sq.height - im.height) // 2))
        im = sq
    im.save(dst, quality=86, method=6)
    print(dst, im.size)
