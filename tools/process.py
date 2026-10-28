import sys, os
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
import numpy as np
from scipy import ndimage
SRC='/mnt/user-data/uploads/EDT_Promo/edt-kingdom-raw'; DST='img'
os.makedirs(DST, exist_ok=True)

def cutout(im, tol=24):
    a = np.array(im.convert('RGB')).astype(int)
    white = (255 - a).max(axis=2) <= tol
    lab, n = ndimage.label(white)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA'); out.putalpha(alpha)
    return out.crop(out.getbbox())

def square(im, S, pad=0.04):
    im = im.copy(); inner = int(S * (1 - 2 * pad))
    im.thumbnail((inner, inner), Image.LANCZOS)
    sq = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    sq.paste(im, ((S - im.width) // 2, (S - im.height) // 2), im)
    return sq

def save(im, name, q=84):
    im.save(f'{DST}/{name}.webp', quality=q, method=6)

for f in sorted(os.listdir(SRC)):
    name = f[:-4]
    im = Image.open(f'{SRC}/{f}')
    if name == 'map_bg':
        im = im.convert('RGB'); im.thumbnail((1280, 1280), Image.LANCZOS); save(im, name, 80); continue
    if name == 'o_fango':
        im = im.convert('RGB').resize((192, 192), Image.LANCZOS)
        m = Image.new('L', (192, 192), 0); ImageDraw.Draw(m).rounded_rectangle((6, 6, 186, 186), 40, fill=255)
        m = m.filter(ImageFilter.GaussianBlur(5))
        l1 = im.copy().convert('RGBA'); l1.putalpha(m.point(lambda v: int(v * .9))); save(l1, 'o_fango1')
        l2 = ImageEnhance.Brightness(im).enhance(.62).convert('RGBA'); l2.putalpha(m); save(l2, 'o_fango2')
        continue
    small = im.convert('RGB'); small.thumbnail((720, 720), Image.LANCZOS)
    c = cutout(small)
    S = 400 if name.startswith('b_') else 320 if (name.startswith('c_') or name == 'forestale') else 192
    out = square(c, S, 0.02 if S == 192 else 0.0)
    save(out, name)
    if name == 'p_moto': save(out.rotate(90, expand=True), 'p_moto_v')
print(sorted(os.listdir(DST)), sum(os.path.getsize(f'{DST}/{x}') for x in os.listdir(DST)) // 1024, 'KB')
