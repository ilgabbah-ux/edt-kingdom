# tessere, icone e ostacoli rifatti (ottobre 2026)
import os
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
import numpy as np
from scipy import ndimage
SRC = '/mnt/user-data/uploads/EDT_Promo/edt-kingdom-raw3'; DST = 'img'
def cutout(im, tol=10, all_white=False):
    a = np.array(im.convert('RGB')).astype(int)
    white = (255 - a).max(axis=2) <= tol
    lab, n = ndimage.label(white)
    if all_white:   # anche i buchi bianchi interni (catena), ma non i piccoli riflessi
        sizes = ndimage.sum(white, lab, range(1, n + 1))
        bg = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz > 300])
    else:
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        bg = np.isin(lab, list(edge))
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA'); out.putalpha(alpha)
    return out.crop(out.getbbox())
def square(im, S, pad):
    im = im.copy(); inner = int(S * (1 - 2 * pad)); im.thumbnail((inner, inner), Image.LANCZOS)
    sq = Image.new('RGBA', (S, S), (0, 0, 0, 0)); sq.paste(im, ((S - im.width) // 2, (S - im.height) // 2), im); return sq
def save(im, name, q=86): im.save(f'{DST}/{name}.webp', quality=q, method=6)
for f in sorted(os.listdir(SRC)):
    name = f[:-4]
    im = Image.open(f'{SRC}/{f}').convert('RGB'); im.thumbnail((720, 720), Image.LANCZOS)
    if name == 'o_fango':
        im = im.resize((192, 192), Image.LANCZOS)
        m = Image.new('L', (192, 192), 0); ImageDraw.Draw(m).rounded_rectangle((6, 6, 186, 186), 40, fill=255); m = m.filter(ImageFilter.GaussianBlur(5))
        l1 = im.copy().convert('RGBA'); l1.putalpha(m.point(lambda v: int(v * .9))); save(l1, 'o_fango1')
        l2 = ImageEnhance.Brightness(im).enhance(.62).convert('RGBA'); l2.putalpha(m); save(l2, 'o_fango2')
        continue
    c = cutout(im, 10, all_white=(name == 'o_catena'))
    if name.startswith('u_'): save(square(c, 128, 0.02), name)
    elif name in ('o_sasso1', 'o_sasso2', 'o_cassa1', 'o_cassa2', 'o_catena'): save(square(c, 192, 0.0), name)
    else: save(square(c, 192, 0.03), name)
print('ok')
