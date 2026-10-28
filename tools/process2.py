# immagini della zona 2 (Il Passo): non ritocca quelle già fatte
import sys; sys.path.insert(0, 'tools')
import os
from PIL import Image, ImageFilter
import numpy as np
from scipy import ndimage
SRC = '/mnt/user-data/uploads/EDT_Promo/edt-kingdom-raw'; DST = 'img'
def cutout(im, tol):
    a = np.array(im.convert('RGB')).astype(int)
    white = (255 - a).max(axis=2) <= tol
    lab, n = ndimage.label(white)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA'); out.putalpha(alpha)
    return out.crop(out.getbbox())
def square(im, S):
    im = im.copy(); im.thumbnail((S, S), Image.LANCZOS)
    sq = Image.new('RGBA', (S, S), (0, 0, 0, 0)); sq.paste(im, ((S - im.width) // 2, (S - im.height) // 2), im); return sq
def save(im, name, q=84): im.save(f'{DST}/{name}.webp', quality=q, method=6)
im = Image.open(f'{SRC}/map2_bg.png').convert('RGB'); im.thumbnail((1280, 1280), Image.LANCZOS); save(im, 'map2_bg', 80)
for n in ['b_rifugio','b_funivia','b_ghiaccio','b_sauna','b_elisoccorso','b_salumi','b_officina','b_torre','b_palazzo','b_festa','forestale2']:
    im = Image.open(f'{SRC}/{n}.png').convert('RGB'); im.thumbnail((720, 720), Image.LANCZOS)
    save(square(cutout(im, 6), 320 if n == 'forestale2' else 400), n)
# ghiaccio: sfondo nero, interno semi-trasparente per vedere la tessera sotto
im = Image.open(f'{SRC}/o_ghiaccio.png').convert('RGB'); im.thumbnail((400, 400), Image.LANCZOS)
a = np.array(im).astype(float); lum = a.mean(axis=2)
mask = ndimage.binary_fill_holes(lum > 40)
al = np.clip(70 + (lum - 150) * 1.6, 70, 235) * mask
dist = ndimage.distance_transform_edt(mask); al = np.where(dist < 10, np.maximum(al, 225 * mask), al)
o = Image.fromarray(a.astype(np.uint8)).convert('RGBA'); o.putalpha(Image.fromarray(al.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1)))
o = o.crop(o.getbbox()); o = o.resize((192, 192), Image.LANCZOS); save(o, 'o_ghiaccio', 88)
print('ok')
