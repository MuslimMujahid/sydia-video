"""
Prepares Haruka's poses for CumaSepuluhMenit from assets/Haruka.

Each pose is upscaled (the phone and laptop crops are only ~300-700 px), given the storyboard's
white sticker outline, and written to public/fallacy/haruka/<key>.png. The script also measures,
in output pixels, the crown of her hair (`top`), her head's centre (`cx`) and the hair's width
(`headW`), and writes them to src/fallacy/poses.ts so <Haruka> can keep her head pinned and the
same size while the pose changes.

Run: python3 scripts/make-fallacy-art.py
"""
import os

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = "assets/Haruka"
OUT = "public/fallacy/haruka"

# key: (asset file, what she is doing in the video)
POSES = {
    "replying": ("haruka-holding-phone-tapping-screen-smiling.png", "S1b: reads the boss's chat"),
    "confident": ("haruka-holding-phone-palm-up-eyes-closed-smiling.png", "S1: sent, easy"),
    "phoneThink": ("haruka-holding-phone-finger-to-chin-thinking-02.png", "S1b: 'Kira-kira berapa lama?' Hmm…"),
    "laptopSmile": ("haruka-at-laptop-smiling.png", "S2a: menit ke-2, still sure"),
    "frowning": ("haruka-at-laptop-hand-on-chin-focused.png", "S2a: 'Eh… catatannya kok berantakan gini?'"),
    "focused": ("haruka-at-laptop-hand-on-chin-focused-02.png", "S2b: 'Lho, ini maksudnya apa ya'"),
    "focused2": ("haruka-at-laptop-hand-on-chin-focused-03.png", "S2b: 'cek rekaman deh'"),
    "frustrated": ("haruka-at-laptop-hands-on-head-frustrated-02.png", "S2c: menit ke-47"),
    "overwhelmed": ("haruka-at-laptop-hands-on-head-overwhelmed-with-paperwork.png", "S2c: the third strip lands"),
    "reads": ("haruka-holding-phone-surprised.png", "S3: 'Udah, Har?' arrives"),
    "hah": ("haruka-holding-phone-shocked-02.png", "S3: 'Hah?!'"),
    "shocked": ("haruka-holding-phone-shocked-with-sweat-drop.png", "S3: 'empat puluh tujuh menit?!'"),
    "raise": ("haruka-index-finger-raised-open-palm-smiling.png", "S4: 'Namanya'"),
    "pointSide": ("haruka-pointing-sideways-open-palm-smiling.png", "S4: points at PLANNING FALLACY"),
    "explain": ("haruka-gesturing-sideways-explaining.png", "S5: the smooth version"),
    "palmsUp": ("haruka-palms-up-smiling.png", "S5: 'hambatan kecil nggak ikut dihitung'"),
    "research": ("haruka-index-finger-raised-open-palm-smiling-02.png", "S6a: 'pernah diteliti'"),
    "present": ("haruka-both-palms-presenting-smiling.png", "S6a: presents the authors"),
    "guess1": ("haruka-hand-on-chin-puzzled-with-question-mark.png", "S6b: guess 1"),
    "guess2": ("haruka-hand-on-chin-puzzled-with-question-mark-02.png", "S6b: guess 2"),
    "guess3": ("haruka-hand-on-chin-puzzled-with-question-mark-03.png", "S6b: guess 3"),
    "thinking": ("haruka-hand-on-chin-thinking.png", "S6c: the bars grow"),
    "gasp": ("haruka-hand-over-mouth-surprised.png", "S6c: 55 hari"),
    "gasp2": ("haruka-hand-over-mouth-surprised-02.png", "S6c: 'bahkan lebih lama'"),
    "wink": ("haruka-index-finger-raised-winking.png", "S7a: tips 1"),
    "winkIdea": ("haruka-index-finger-raised-winking-with-lightbulb.png", "S7a: '= 45 menit'"),
    "clipboard": ("haruka-index-finger-raised-with-clipboard-smiling.png", "S7b: tips 2"),
    "reachClip": ("haruka-reaching-out-with-clipboard-smiling.png", "S7b: shows last week's note"),
    "typing": ("haruka-holding-phone-tapping-screen-curious.png", "S7c: types the heads-up"),
    "phoneSmile": ("haruka-holding-phone-smiling.png", "S7c: 'Oke, makasih kabarnya!'"),
    "pointDown": ("haruka-pointing-down-open-palm-smiling.png", "S8: reads the CTA, points at the band"),
    "giggle1": ("haruka-holding-phone-hand-over-mouth-giggling.png", "S8: giggles"),
    "giggle2": ("haruka-holding-phone-hand-over-mouth-giggling-02.png", "S8: giggles"),
    "giggle3": ("haruka-holding-phone-hand-over-mouth-giggling-03.png", "S8: giggles"),
}

# hair widths the measurement gets wrong (shock lines next to the hair), in source pixels after upscaling
HEAD_W_OVERRIDE = {"hah": 560}

MIN_SIDE = 1100  # upscale until the longer side is at least this


def hair_mask(rgba):
    a = rgba[..., 3] > 200
    r, g, b = (rgba[..., i].astype(int) for i in range(3))
    brown = (r > g) & (g >= b - 4) & (r - b > 22) & (r < 205) & (r > 55)
    return a & brown


def measure(img):
    rgba = np.array(img)
    mask = hair_mask(rgba)
    mask = ndimage.binary_opening(mask, iterations=2)
    lab, n = ndimage.label(mask)
    if n == 0:
        return 0, img.width // 2, img.width // 3
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    hair = lab == (int(np.argmax(sizes)) + 1)
    ys, xs = np.nonzero(hair)
    top = int(ys.min())
    span = int(ys.max() - top)
    band = hair[top + int(span * 0.12) : top + int(span * 0.3)]
    bx = np.nonzero(band.any(axis=0))[0]
    cols = np.nonzero(hair[top : top + int(span * 0.3)].any(axis=0))[0]
    cx = int(round((np.percentile(cols, 3) + np.percentile(cols, 97)) / 2))
    head_w = int(bx.max() - bx.min()) if len(bx) else img.width // 3
    return top, cx, head_w


def sticker(img, radius):
    """White outline under the cut-out, like the storyboard's stickers."""
    pad = radius + 4
    w, h = img.size
    canvas = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    canvas.paste(img, (pad, pad), img)
    alpha = np.array(canvas)[..., 3] > 40
    yy, xx = np.mgrid[-radius : radius + 1, -radius : radius + 1]
    disk = xx * xx + yy * yy <= radius * radius
    grown = ndimage.binary_dilation(alpha, structure=disk)
    grown = ndimage.binary_fill_holes(grown)
    edge = Image.fromarray((grown * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    white = Image.new("RGBA", canvas.size, (255, 253, 248, 255))
    white.putalpha(edge)
    white.alpha_composite(canvas)
    return white, pad


os.makedirs(OUT, exist_ok=True)
rows = []
for key, (file, note) in POSES.items():
    img = Image.open(os.path.join(SRC, file)).convert("RGBA")
    k = max(1, int(np.ceil(MIN_SIDE / max(img.size))))
    if k > 1:
        img = img.resize((img.width * k, img.height * k), Image.LANCZOS)
    top, cx, head_w = measure(img)
    head_w = HEAD_W_OVERRIDE.get(key, head_w)
    radius = max(8, round(head_w * 0.035))
    out, pad = sticker(img, radius)
    out.save(os.path.join(OUT, f"{key}.png"), optimize=True)
    rows.append((key, out.width, out.height, top + pad, cx + pad, head_w, file, note))
    print(f"{key:10s} {file:62s} x{k} -> {out.width}x{out.height} top={top + pad} cx={cx + pad} headW={head_w}")

ts = [
    "// Generated by scripts/make-fallacy-art.py from assets/Haruka. Do not edit by hand.",
    "// `top` is the crown of her hair and `cx` her head's centre, in image pixels (public/fallacy/haruka/<key>.png);",
    "// `headW` is the hair's width near the top of her head, used to keep her the same size across poses.",
    "export const POSES = {",
]
for key, w, h, top, cx, head_w, file, note in rows:
    ts.append(f'  {key}: {{ w: {w}, h: {h}, top: {top}, cx: {cx}, headW: {head_w} }}, // {file.removeprefix("haruka-")} · {note}')
ts += ["} as const;", "", "export type Pose = keyof typeof POSES;", ""]
os.makedirs("src/fallacy", exist_ok=True)
with open("src/fallacy/poses.ts", "w") as f:
    f.write("\n".join(ts))
print("wrote src/fallacy/poses.ts")
