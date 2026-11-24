"""Synthesize the two happy acoustic tracks for "Sebentar x9" (src/sibuk).

Writes both files in one run:

  public/music/sibuk-pagi.wav     120 BPM, D major, exactly 27.0 s (54 beats, 1 beat = 0.5 s)
    beats  0-12  hook: a soft clock "tick" on every beat; fingerpicked D, Bm7 from beat 4
    beats 12-20  puzzled colour: Gadd9, Asus4, a two-note glock "question"
    beats 19.3-20 tape-stop (pitch-down to a halt) hands off to...
    beats 20-21  SILENCE (the video's tape-rewind SFX plays here)
    beats 21-40  bouncy groove: 8th strums with accents, root bass, shaker 16ths, claps on 2 & 4,
                 a glockenspiel hook every two bars (bars 6, 8, 10)
    beats 40-48  montage: kick on every beat, accent hits exactly on beats 40/42/44/46, rising
    beats 48-54  peak: double-time 16th strums, climbing bass and riser, snare-ish clap roll;
                 the track stops dead at 27.000 s (5 ms declick only, no tail)

  public/music/sibuk-giliran.wav  100 BPM, G major, exactly 15.6 s (6.5 bars, 1 bar = 2.4 s)
    bars 0-3     sparse, wistful fingerpicked guitar (G, C-Cm, G-Dsus4) leaving room for pen sounds
    bars 3-6     warm resolve: soft strums, bass, light shaker, a short glock melody
    bar 6        tonic G at 14.4 s rings; gentle fade over the last 0.5 s

Every sound is synthesized here (techniques copied from scripts/make-titipan-music.py):
Karplus-Strong guitar and bass, additive glockenspiel, shaped-noise percussion.

Run: python3 scripts/make-sibuk-music.py   (use plain python3, not -I: NumPy/SciPy live in the user site)
"""

import os
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

SR = 44100
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(2715)


# ---------------------------------------------------------------- helpers
def sos(kind, f, order=2):
    return butter(order, f, kind, fs=SR, output="sos")


def lp(x, f):
    return sosfilt(sos("low", min(f, SR / 2 - 100)), x, axis=0)


def hp(x, f):
    return sosfilt(sos("high", f), x, axis=0)


def bp(x, lo, hi):
    return sosfilt(sos("band", [lo, hi]), x, axis=0)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


NAMES = {"C": 0, "C#": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "Bb": 10, "B": 11}


def midi(name):
    return 12 * (int(name[-1]) + 1) + NAMES[name[:-1]]


def tail(sig, ms=40):
    k = min(len(sig), int(ms / 1000 * SR))
    sig = sig.copy()
    sig[-k:] *= np.linspace(1, 0, k)
    return sig


def human(t, ms=4):
    """Late-only timing jitter, so nothing lands before its grid line (keeps the silence gap clean)."""
    return t + abs(rng.normal(0, ms / 1000))


def place(dst, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(dst):
        return
    if i < 0:
        sig, i = sig[-i:], 0
    if sig.ndim == 1:
        sig = np.stack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))], axis=1) * np.sqrt(2)
    end = min(len(dst), i + len(sig))
    dst[i:end] += sig[: end - i] * gain


class Track:
    """Beat grid for one song. Beats are absolute (beat 0 = 0 s); 4/4."""

    def __init__(self, bpm, seconds, swing=0.5):
        self.beat = 60 / bpm
        self.seconds = seconds
        self.swing = swing
        self.n = int(round((seconds + 3) * SR))
        self.end = int(round(seconds * SR))

    def t(self, beat):
        whole = np.floor(beat)
        frac = beat - whole
        if abs(frac - 0.5) < 1e-6:
            frac = self.swing
        return (whole + frac) * self.beat

    def buses(self):
        return {k: np.zeros((self.n, 2)) for k in ("gtr", "bass", "bell", "perc", "fx")}


# ---------------------------------------------------------------- steel-string guitar (Karplus-Strong)
_ks = {}


def ks(m, length=2.0, bright=0.6, t60=2.0, seed=0):
    key = (m, round(bright, 2), round(t60, 2), seed, round(length, 2))
    if key in _ks:
        return _ks[key]
    f = hz(m)
    p = max(2, int(SR / f))
    ratio = f / (SR / (p + 0.5))
    n_out = int(length * SR)
    r = np.random.default_rng(seed * 1000 + m)
    exc = r.uniform(-1, 1, p)
    a = 0.9 * (1 - bright)
    exc = lfilter([1 - a], [1, -a], exc)
    exc -= exc.mean()
    g = 0.001 ** (1 / ((SR / (p + 0.5)) * t60))
    blocks = int(n_out * ratio) // p + 3
    y = np.zeros(blocks * p)
    y[:p] = exc
    for k in range(1, blocks):
        prev = y[(k - 1) * p : k * p]
        before = y[(k - 1) * p - 1] if k > 1 else 0.0
        y[k * p : (k + 1) * p] = g * 0.5 * (prev + np.concatenate(([before], prev[:-1])))
    out = np.interp(np.arange(n_out) * ratio, np.arange(len(y)), y)
    out = tail(out / (np.max(np.abs(out)) + 1e-9), 60)
    _ks[key] = out
    return out


_gtr = {}


def guitar(m, bright=0.75, length=2.2, t60=2.4, seed=0):
    key = (m, bright, length, t60, seed)
    if key not in _gtr:
        s = ks(m, length, bright, t60, seed)
        _gtr[key] = 0.8 * s + 0.45 * bp(s, 85, 320) + 0.3 * bp(s, 2200, 7000)  # wooden body + steel shimmer
    return _gtr[key]


def chuck():
    """A palm-muted strum: a dead thump of strings plus pick noise."""
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    thump = sum(ks(midi(x), 0.12, 0.5, 0.05, seed=4) for x in ["D3", "A3", "D4", "F#4"])
    noise = bp(rng.normal(0, 1, n), 400, 3500) * np.exp(-t * 60)
    return (thump * 0.5 + noise * 0.6) * np.minimum(1, t / 0.002)


def bass_note(m, length=1.0, t60=0.8):
    s = ks(m, length, 0.25, t60, seed=1)
    tt = np.arange(len(s)) / SR
    sub = np.sin(2 * np.pi * hz(m) * tt) * np.exp(-tt * (1.2 / max(t60, 0.3))) * 0.5
    return tail(lp(s, 900) + sub, 30)


# ---------------------------------------------------------------- glockenspiel
def glock(m, length=1.6):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.zeros(n)
    for ratio, amp, dec in [(1, 1, 2.2), (2.76, 0.35, 6), (5.40, 0.18, 12), (8.93, 0.08, 20)]:
        s += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * dec)
    return tail(s * np.minimum(1, t / 0.001), 40)


# ---------------------------------------------------------------- percussion
def kick():
    """Soft kick (the cajón bass hit from the titipan track, a touch rounder)."""
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    f = 52 + 70 * np.exp(-t * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 13)
    thud = lp(rng.normal(0, 1, n), 380) * np.exp(-t * 45) * 0.5
    return (body + thud) * 0.9


def clap():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    noise = bp(rng.normal(0, 1, n), 900, 5000)
    e = np.zeros(n)
    for k, d in enumerate([0, 0.012, 0.023]):
        e += (t >= d) * np.exp(-(t - d) * (160 if k < 2 else 26))
    return noise * e * 0.55


def shaker(acc=1.0):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    return hp(rng.normal(0, 1, n), 5500) * np.minimum(1, t / 0.014) * np.exp(-t * 50) * 0.25 * acc


def tick(high=True):
    """A muted clock tick / cursor blink: a tiny woody click, no pitch to speak of."""
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    f = 2300 if high else 1750
    tone = np.sin(2 * np.pi * f * t) * np.exp(-t * 220)
    click = bp(rng.normal(0, 1, n), 2500, 8000) * np.exp(-t * 450) * 0.6
    body = np.sin(2 * np.pi * 620 * t) * np.exp(-t * 120) * 0.3
    return (tone + click + body) * np.minimum(1, t / 0.0006)


def wash(seconds=1.0, decay=4.0):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    return hp(rng.normal(0, 1, n), 5000) * np.exp(-t * decay) * np.minimum(1, t / 0.002) * 0.25


def riser(seconds, f0, f1):
    """Pitch climb (soft square-ish tone, octave doubled) plus a swelling high noise."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    x = t / seconds
    f = f0 * (f1 / f0) ** (x**1.4)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.25 * np.sin(3 * ph) + 0.35 * np.sin(2 * ph)
    tone = lp(tone, 4000) * x**1.6
    noise = hp(rng.normal(0, 1, n), 3500) * x**2.2
    return tone * 0.5 + noise * 0.35


# ---------------------------------------------------------------- playing
def strum(tr, B, beat, voicing, down=True, gain=1.0, spread=0.011, bright=0.75, exact=False, ring=2.0):
    notes = [midi(x) for x in voicing]
    order = notes if down else notes[::-1][:4]  # up-strums catch the top strings
    t0 = tr.t(beat) if exact else human(tr.t(beat), 3)
    for i, m in enumerate(order):
        g = gain * (1.0 if down else 0.65) * (0.85 + 0.15 * rng.random())
        place(B["gtr"], guitar(m, bright, ring, 2.2, seed=i % 3), t0 + i * spread, 0.16 * g, pan=-0.3 + i * 0.1)


PICK = [0, 3, 2, 4, 1, 3, 2, 4]  # string order per eighth (bass, then the trebles answer)


def picking(tr, B, beat, voicing, beats=4, gain=1.0, skip=(), bright=0.65):
    """Fingerpicked eighths over a chord starting at `beat`; `skip` drops eighths (0-based) for air."""
    ms = [midi(x) for x in voicing]
    for k in range(int(beats * 2)):
        if k in skip:
            continue
        m = ms[min(PICK[k % 8], len(ms) - 1)]
        g = (0.2 if k % 2 == 0 else 0.14) * (1.15 if k == 0 else 1.0)
        place(B["gtr"], guitar(m, bright, 2.0, 2.0, seed=k % 3), human(tr.t(beat + k / 2), 5), g * gain, pan=-0.2 + (k % 2) * 0.35)


def melody(tr, B, beat, spec, gain, pan=0.3, octave=0):
    """'E6:.5 G6:.5 r:1', durations in beats, glockenspiel."""
    for tok in spec.split():
        name, dur = tok.split(":")
        if name != "r":
            place(B["bell"], glock(midi(name) + octave), human(tr.t(beat), 3), gain, pan)
        beat += float(dur)


# ---------------------------------------------------------------- mix
def reverb_ir(seconds=1.4, predelay=0.012):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([rng.normal(0, 1, n), rng.normal(0, 1, n)], axis=1) * np.exp(-t * 4.5)[:, None]
    ir = lp(ir, 6500)
    ir[: int(predelay * SR)] = 0
    return ir / np.sqrt(np.sum(ir**2))


IR = reverb_ir()


def verb(x, wet):
    out = np.zeros_like(x)
    for c in range(2):
        out[:, c] = fftconvolve(x[:, c], IR[:, c])[: len(x)]
    return x + out * wet


def render(B):
    mix = verb(B["gtr"], 0.2)
    mix += verb(lp(B["bass"], 2200), 0.05) * 0.9
    mix += verb(B["bell"], 0.4)
    mix += verb(B["perc"], 0.1) * 0.9
    mix += verb(B["fx"], 0.15)
    mix = hp(mix, 35)
    return mix - 0.25 * bp(mix, 1000, 3200)  # gentle presence dip, leaves room for the voice-over


def compress(mix, thr=0.18, ratio=0.35):
    rms = np.sqrt(np.maximum(lp(np.mean(mix**2, axis=1), 6), 0) + 1e-9)
    return mix * np.where(rms > thr, (thr / rms) ** ratio, 1.0)[:, None]


def write(path, mix):
    mix = mix / np.max(np.abs(mix)) * 10 ** (-1 / 20)  # peak -1 dBFS
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(np.round(np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"wrote {os.path.relpath(path, ROOT_DIR)}: {len(mix) / SR:.3f} s")


# ================================================================ TRACK 1: sibuk-pagi (120 BPM, D major)
def make_pagi():
    tr = Track(120, 27.0)
    V = {
        "D": ["D3", "A3", "D4", "F#4", "A4"],
        "Bm7": ["B2", "F#3", "A3", "D4", "F#4"],
        "Gadd9": ["G2", "D3", "A3", "B3", "D4", "G4"],
        "Asus4": ["A2", "E3", "A3", "D4", "E4"],
        "A": ["A2", "E3", "A3", "C#4", "E4"],
        "Bm": ["B2", "F#3", "B3", "D4", "F#4"],
        "G": ["G2", "B2", "D3", "G3", "B3", "G4"],
    }
    ROOT = {"D": "D2", "Bm7": "B1", "Gadd9": "G1", "Asus4": "A1", "A": "A1", "Bm": "B1", "G": "G1"}

    # ---- beats 0-20: the hook and the puzzled bit (own buses so the tape stop can cut it cleanly)
    P = tr.buses()
    for b in range(0, 20):  # tick... tock on every beat, nothing on beat 20
        place(P["perc"], tick(b % 2 == 0), tr.t(b), 0.3 if b < 12 else 0.22, pan=0.25)
    picking(tr, P, 4, V["D"], gain=0.7, skip=(5,))
    picking(tr, P, 8, V["Bm7"], gain=0.72, skip=(5,))
    picking(tr, P, 12, V["Gadd9"], gain=0.62, skip=(3, 7))
    picking(tr, P, 16, V["Asus4"], gain=0.62, skip=(3,))
    place(P["bass"], bass_note(midi("G2"), 2.0, 1.6), tr.t(12), 0.15)
    place(P["bass"], bass_note(midi("A2"), 2.0, 1.6), tr.t(16), 0.15)
    melody(tr, P, 14, "A5:.5 B5:1", 0.07)  # a little rising "huh?" that never resolves
    melody(tr, P, 18, "E6:.5 F#6:.5 G6:1", 0.06)
    pre = render(P)

    # tape stop: from STOP_AT the music slows from 1x to a halt by beat 20 (10.0 s), then silence
    stop_at, stop_end = 9.65, tr.t(20)
    i0, n_stop = int(stop_at * SR), int((stop_end - stop_at) * SR)
    dur = stop_end - stop_at
    tau = np.arange(n_stop) / SR
    src = (stop_at + tau - tau**2 / (2 * dur)) * SR  # read position decelerating to 0x
    stopped = np.stack([np.interp(src, np.arange(len(pre)), pre[:, c]) for c in range(2)], axis=1)
    stopped *= (np.linspace(1, 0, n_stop) ** 0.6)[:, None]
    pre[i0 : i0 + n_stop] = lp(stopped, 4000)
    pre[i0 + n_stop :] = 0

    # ---- beats 21-54: the groove, the montage, the peak
    G = tr.buses()
    # chords by beat range [from, to)
    CH = [(21, 24, "D"), (24, 28, "A"), (28, 32, "Bm"), (32, 36, "G"), (36, 40, "D"),
          (40, 42, "G"), (42, 44, "A"), (44, 46, "Bm"), (46, 48, "A"),
          (48, 50, "G"), (50, 52, "A"), (52, 53, "Bm"), (53, 54, "A")]

    def chord(beat):
        for a, b, name in CH:
            if a <= beat < b:
                return name
        return None

    ACC = [1.0, 0.4, 0.6, 0.75, 0.85, 0.4, 0.6, 0.75]  # D . d U D . d U  (bouncy push on the "and"s)
    for k in range(int((48 - 21) * 2)):
        beat = 21 + k / 2
        name = chord(beat)
        pos = int(round((beat % 4) * 2))
        rise = 1.0 + 0.25 * max(0, beat - 40) / 8  # montage gets hotter
        if pos in (2, 6) and beat < 40:
            place(G["gtr"], chuck(), human(tr.t(beat), 3), 0.28, pan=0.05)  # chuck under the claps
            continue
        strum(tr, G, beat, V[name], down=(pos % 2 == 0), gain=0.75 * ACC[pos] * rise, bright=0.8)
    # bass on roots, octave bounce on the "and" of 4, a walk into each change
    for a, b, name in CH[:9]:
        r = midi(ROOT[name]) + 12
        for beat in range(a, b):
            if beat % 2 == 0 or beat == 21:
                place(G["bass"], bass_note(r, 0.9, 0.7), human(tr.t(beat), 3), 0.5 * (1.15 if beat >= 40 else 1.0))
        if b - a >= 4:
            place(G["bass"], bass_note(r + 12, 0.35, 0.3), human(tr.t(b - 0.5), 3), 0.28)
    for k in range(int((48 - 21) * 4)):  # shaker 16ths
        beat = 21 + k / 4
        place(G["perc"], shaker([1.0, 0.45, 0.7, 0.45][k % 4]), human(tr.t(beat), 2), 0.55 + 0.25 * (beat >= 40), pan=0.35)
    for beat in range(21, 48):
        if beat % 2 == 1:  # claps on 2 and 4
            place(G["perc"], clap(), human(tr.t(beat), 3), 0.42 + 0.08 * (beat >= 40), pan=-0.12)
        if beat >= 40 or beat % 2 == 0:  # soft kick on 1 & 3, every beat in the montage
            place(G["perc"], kick(), tr.t(beat) if beat >= 40 else human(tr.t(beat), 2), 0.42 if beat < 40 else 0.5 + 0.02 * (beat - 40))
    # the glockenspiel hook, every two bars
    melody(tr, G, 24, "r:1 E6:.5 F#6:.5 E6:.5 C#6:.5 A5:1", 0.13)
    melody(tr, G, 32, "r:1 F#6:.5 G6:.5 F#6:.5 D6:.5 B5:1", 0.13)
    melody(tr, G, 40, "r:1 G6:.5 A6:.5 B6:.5 A6:.5 F#6:1", 0.14)

    # montage cuts: exact accent hits on 40, 42, 44, 46
    for i, beat in enumerate((40, 42, 44, 46)):
        lift = 1 + 0.12 * i
        strum(tr, G, beat, V[chord(beat)], True, 1.25 * lift, spread=0.006, bright=0.9, exact=True)
        place(G["perc"], clap(), tr.t(beat), 0.55 * lift, pan=0.12)
        place(G["perc"], wash(0.8, 5.0), tr.t(beat), 0.55 * lift, pan=-0.2)
        place(G["bell"], glock(midi("D7") + [0, 2, 4, 7][i], 0.8), tr.t(beat), 0.07)

    # peak: double-time 16th strums, climbing bass, clap roll, riser; stops dead at beat 54
    for k in range(6 * 4):
        beat = 48 + k / 4
        name = chord(beat)
        rise = 1.25 + 0.6 * k / 23
        acc = 1.0 if k % 4 == 0 else (0.7 if k % 2 == 0 else 0.5)
        strum(tr, G, beat, V[name], down=(k % 2 == 0), gain=0.75 * acc * rise, spread=0.005, bright=0.85, ring=0.6)
        place(G["perc"], shaker(1.0 if k % 2 == 0 else 0.6), human(tr.t(beat), 2), 0.85, pan=0.35)
    for i, (beat, note) in enumerate([(48, "G2"), (49, "G2"), (50, "A2"), (51, "A2"), (52, "B2"), (52.5, "C#3"), (53, "D3"), (53.5, "E3")]):
        place(G["bass"], bass_note(midi(note), 0.6, 0.5), tr.t(beat), 0.55 + 0.03 * i)
    for k, beat in enumerate([48, 49, 50, 51, 52, 52.5, 53, 53.5]):  # kick on every beat, then 8ths
        place(G["perc"], kick(), tr.t(beat), 0.55 + 0.03 * k)
    for k in range(4 * 4 + 2 * 4):  # claps: on beats, then 16th roll for the last two beats
        beat = 48 + k * 0.25
        if beat < 52 and k % 4:
            continue
        place(G["perc"], clap(), tr.t(beat), 0.35 + 0.35 * k / 23, pan=0.1 * (-1) ** k)
    place(G["fx"], riser(3.0, hz(midi("D4")), hz(midi("D6"))), tr.t(48), 0.22)
    melody(tr, G, 50, "A5:.5 B5:.5 C#6:.5 D6:.5 E6:.5 F#6:.5 G6:.25 A6:.25 B6:.25 C#7:.25", 0.1)
    post = render(G)
    gate = np.clip((np.arange(len(post)) / SR - tr.t(21)) / 0.002, 0, 1)
    post *= gate[:, None]

    mix = compress(pre + post)[: tr.end]  # hard cut at exactly 27.000 s
    k = int(0.005 * SR)
    mix[-k:] *= np.linspace(1, 0, k)[:, None]  # 5 ms declick only
    return mix


# ================================================================ TRACK 2: sibuk-giliran (100 BPM, G major)
def make_giliran():
    tr = Track(100, 15.6, swing=0.55)
    V = {
        "G": ["G2", "B2", "D3", "G3", "B3", "G4"],
        "C": ["C3", "E3", "G3", "C4", "E4"],
        "Cm": ["C3", "G3", "C4", "Eb4", "G4"],
        "Dsus4": ["D3", "A3", "D4", "G4"],
        "D": ["D3", "A3", "D4", "F#4"],
        "Am7": ["A2", "E3", "G3", "C4", "E4"],
        "Gring": ["G2", "B2", "D3", "G3", "B3", "D4", "G4"],
    }
    ROOT = {"G": "G1", "C": "C2", "Cm": "C2", "D": "D2", "Dsus4": "D2", "Am7": "A1"}
    B = tr.buses()

    # bars 0-3 (beats 0-12): sparse, wistful picking, room for the pen
    picking(tr, B, 0, V["G"], 4, gain=0.8, skip=(3, 7))
    picking(tr, B, 4, V["C"], 2, gain=0.8, skip=(3,))
    picking(tr, B, 6, V["Cm"], 2, gain=0.8, skip=(3,))  # the IV-iv sigh
    picking(tr, B, 8, V["G"], 2, gain=0.78, skip=(3,))
    picking(tr, B, 10, V["Dsus4"], 2, gain=0.78, skip=())
    melody(tr, B, 2.5, "B5:.5", 0.05)  # two quiet glints, nothing more
    melody(tr, B, 7, "Eb6:1", 0.04)

    # bars 3-6 (beats 12-24): warm resolve
    CH = [(12, 16, "C"), (16, 20, "G"), (20, 22, "Am7"), (22, 24, "D")]
    PAT = [(0, True, 1.0), (1, True, 0.6), (1.5, False, 0.5), (2.5, False, 0.55), (3, True, 0.7), (3.5, False, 0.5)]
    for a, b, name in CH:
        for bar0 in range(a - a % 4, b, 4):
            for off, down, acc in PAT:
                beat = bar0 + off
                if a <= beat < b:
                    strum(tr, B, beat, V[name], down, 0.62 * acc + (0.06 if beat >= 16 else 0), bright=0.7)
        r = midi(ROOT[name]) + 12
        place(B["bass"], bass_note(r, 1.6, 1.2), human(tr.t(a), 3), 0.45)
        if b - a == 4:
            place(B["bass"], bass_note(r + 7, 1.0, 0.8), human(tr.t(a + 2), 3), 0.36)
    place(B["bass"], bass_note(midi("A2"), 0.4, 0.3), human(tr.t(15.5), 3), 0.25)  # walk C-A-G into bar 4
    for k in range(int((24 - 12) * 2)):  # light shaker 8ths
        beat = 12 + k / 2
        place(B["perc"], shaker(1.0 if k % 2 == 0 else 0.55), human(tr.t(beat), 3), 0.38 + 0.1 * (beat >= 16), pan=0.35)
    for beat in range(16, 24, 2):
        place(B["perc"], kick(), human(tr.t(beat), 2), 0.22)
    melody(tr, B, 16, "B5:.5 D6:.5 G6:1 r:.5 F#6:.5 E6:.5 D6:.5", 0.12)
    melody(tr, B, 20, "C6:.5 B5:.5 A5:1 r:.5 A5:.5 B5:.5 C6:.5", 0.12)

    # bar 6 (beat 24 = 14.4 s): tonic G rings out
    strum(tr, B, 24, V["Gring"], True, 1.0, spread=0.035, bright=0.7, ring=3.0)
    place(B["bass"], bass_note(midi("G2"), 2.5, 2.4), tr.t(24), 0.5)
    place(B["bell"], glock(midi("D6"), 2.0), tr.t(24), 0.11, 0.3)
    place(B["bell"], glock(midi("G6"), 2.0), tr.t(24.5), 0.09, 0.3)
    place(B["perc"], shaker(0.8), tr.t(24), 0.3, pan=0.35)

    mix = compress(render(B))[: tr.end]
    k = int(0.5 * SR)
    mix[-k:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, k)))[:, None]  # gentle 0.5 s fade
    return mix


if __name__ == "__main__":
    write(os.path.join(ROOT_DIR, "public/music/sibuk-pagi.wav"), make_pagi())
    write(os.path.join(ROOT_DIR, "public/music/sibuk-giliran.wav"), make_giliran())
