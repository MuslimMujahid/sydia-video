"""Synthesize "Pagi Cerah", the happy acoustic track for SydiaSeller.

100 BPM, 4/4, C major. At 30 fps one beat = 18 frames, one bar = 72 frames (2.4 s).
Bar numbers below are timeline.ts's minus the two intro bars (tb() adds them back):

  -2..-1 night → dawn: a music-box lullaby over a low pad, then a soft swell; the rooster
         (an SFX) crows in bar -1, so beats 1-3 stay nearly empty
  0      wake: the alarm clock (SFX) rings over a C pad, the phone comes up
  1-2    soft ukulele picking as notifications pile up, pickup strum
  3-5    WhatsApp list: ukulele strum groove, upright bass, shaker (C Am F G)
  6-10   forward to Sydia: verse, kick + brushes, glockenspiel answers (F G Em Am F-G)
  11-14  "tambah ini, ini juga": chorus, claps, tambourine, recorder hook (C G Am F)
  15     afternoon time-lapse: half-time Fmaj7 swell, rising glockenspiel run
  16-20  laptop + web chat: lighter verse (Am F C G Am-F)
  21-23  notes workspace: steady groove, claps join (F G Am-F)
  24-27  weekly report: verse with glockenspiel answers (C Am F-G), then the build
         (Dm-G7 with a snare roll) into the logo
  28-29  closing logo: final chorus hit, hook returns (C G)
  30-31  coda under the CTA: the night lullaby returns on marimba, C rings out

Every instrument is synthesized here: Karplus-Strong ukulele and bass, additive
marimba, glockenspiel and recorder, a soft pad and shaped-noise percussion.

Run: python3 scripts/make-seller-music.py public/music/sydia-seller.wav
"""

import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

SR = 44100
BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT
INTRO_BARS = 2
BARS = 32 + INTRO_BARS
N = int((BARS * BAR + 3) * SR)
rng = np.random.default_rng(909)
SWING = 0.56  # second eighth of each beat lands a little late


# ---------------------------------------------------------------- helpers
def tb(bar, beat=0.0):
    """Seconds at a bar/beat position, with swung eighths."""
    whole = np.floor(beat)
    frac = beat - whole
    if abs(frac - 0.5) < 1e-6:
        frac = SWING
    return (bar + INTRO_BARS) * BAR + (whole + frac) * BEAT


def bus():
    return np.zeros((N, 2))


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


NAMES = {"C": 0, "C#": 1, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "Bb": 10, "B": 11}


def midi(name):
    return 12 * (int(name[-1]) + 1) + NAMES[name[:-1]]


def env(n, a=0.005, d=None, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    if d:
        e *= np.exp(-curve * t / d)
    return e


def tail(sig, ms=40):
    k = min(len(sig), int(ms / 1000 * SR))
    sig = sig.copy()
    sig[-k:] *= np.linspace(1, 0, k)
    return sig


def human(t, ms=5):
    return t + rng.normal(0, ms / 1000)


# ---------------------------------------------------------------- plucked strings (Karplus-Strong)
_ks = {}


def ks(m, length=1.6, bright=0.6, t60=1.4, seed=0):
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


def uke(m, bright=0.7, length=1.4, seed=0):
    s = ks(m, length, bright, 1.1, seed)
    body = bp(s, 180, 5200)  # small nylon-string body
    return 0.75 * s + 0.6 * body


# ---------------------------------------------------------------- mallets, bells, wind
def marimba(m, length=0.9):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 5)
    s += 0.35 * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t * 22)
    s += 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 45)
    click = rng.normal(0, 1, n) * np.exp(-t * 900) * 0.15
    return tail((s + click) * env(n, 0.002), 30)


def glock(m, length=1.6):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.zeros(n)
    for ratio, amp, dec in [(1, 1, 2.2), (2.76, 0.35, 6), (5.40, 0.18, 12), (8.93, 0.08, 20)]:
        s += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * dec)
    return tail(s * env(n, 0.001), 40)


def recorder(m, dur):
    n = int((dur + 0.12) * SR)
    t = np.arange(n) / SR
    f = hz(m)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.25)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    s = np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    breath = bp(rng.normal(0, 1, n), 1200, 5000) * 0.05
    e = np.minimum(1, t / 0.04) * np.clip((dur + 0.08 - t) / 0.08, 0, 1)
    return (s + breath) * e


def pad(ms, dur, cutoff=1800):
    n = int((dur + 0.6) * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for m in ms:
        for det in (-0.12, 0.0, 0.11):
            f = hz(m) * 2 ** (det / 12)
            ph = rng.uniform(0, 1)
            s += 2 * ((f * t + ph) % 1) - 1
    s = lp(s / (len(ms) * 3), cutoff)
    e = np.minimum(1, t / 0.5) * np.clip((dur + 0.6 - t) / 0.6, 0, 1)
    return s * e


# ---------------------------------------------------------------- drums
def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 52 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.9


def clap():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    noise = bp(rng.normal(0, 1, n), 900, 5000)
    e = np.zeros(n)
    for k, d in enumerate([0, 0.011, 0.022]):
        e += (t >= d) * np.exp(-(t - d) * (160 if k < 2 else 28)) * (t >= d)
    return noise * e * 0.6


def shaker(acc=1.0):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    return hp(rng.normal(0, 1, n), 5500) * np.minimum(1, t / 0.012) * np.exp(-t * 55) * 0.25 * acc


def tamb():
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    jingle = bp(rng.normal(0, 1, n), 6000, 14000) * np.exp(-t * 20)
    return jingle * 0.35


def brush():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    return bp(rng.normal(0, 1, n), 1500, 7000) * np.exp(-t * 14) * 0.3


# ---------------------------------------------------------------- harmony
UKE = {
    "C": ["G4", "C4", "E4", "C5"],
    "Am": ["A4", "C4", "E4", "A4"],
    "F": ["A4", "C4", "F4", "A4"],
    "G": ["G4", "D4", "G4", "B4"],
    "Em": ["G4", "E4", "G4", "B4"],
    "Fmaj7": ["A4", "C4", "E4", "A4"],
    "A7": ["G4", "C#4", "E4", "A4"],
    "Dm": ["A4", "D4", "F4", "A4"],
    "G7": ["G4", "D4", "F4", "B4"],
}
ROOT = {"C": "C2", "Am": "A1", "F": "F1", "G": "G1", "Em": "E2", "Fmaj7": "F1", "A7": "A1", "Dm": "D2", "G7": "G1"}

# One entry per bar: chords on beats 1 (and 3 when two are given).
CHORDS = {
    1: ["C"], 2: ["F", "G"],
    3: ["C"], 4: ["Am"], 5: ["F", "G"],
    6: ["F"], 7: ["G"], 8: ["Em"], 9: ["Am"], 10: ["F", "G"],
    11: ["C"], 12: ["G"], 13: ["Am"], 14: ["F"],
    15: ["Fmaj7"],
    16: ["Am"], 17: ["F"], 18: ["C"], 19: ["G"], 20: ["Am", "F"],
    21: ["F"], 22: ["G"], 23: ["Am", "F"],
    24: ["C"], 25: ["Am"], 26: ["F", "G"], 27: ["Dm", "G7"],
    28: ["C"], 29: ["G"], 30: ["Am", "F"], 31: ["C"],
}


def chord_at(bar, beat):
    ch = CHORDS.get(bar)
    if not ch:
        return None
    return ch[1] if len(ch) > 1 and beat >= 2 else ch[0]


uke_b, bass_b, mel_b, perc_b, pad_b, bell_b = bus(), bus(), bus(), bus(), bus(), bus()


def strum(bar, beat, name, down=True, gain=1.0, spread=0.014, bright=0.7):
    notes = [midi(x) for x in UKE[name]]
    order = notes if down else notes[::-1]
    t0 = human(tb(bar, beat), 4)
    for i, m in enumerate(order):
        g = gain * (1.0 if down else 0.7) * (0.85 + 0.15 * rng.random())
        place(uke_b, uke(m, bright, 1.3, seed=i % 3), t0 + i * spread, 0.22 * g, pan=-0.25 + i * 0.12)


# Strum pattern: D . D U . U D U  (eighth positions), with accents.
PATTERN = [(0, True, 1.0), (1, True, 0.8), (1.5, False, 0.55), (2.5, False, 0.6), (3, True, 0.85), (3.5, False, 0.55)]


def groove(bar, gain=1.0, bright=0.7):
    for beat, down, acc in PATTERN:
        name = chord_at(bar, beat)
        strum(bar, beat, name, down, gain * acc, bright=bright)


def picking(bar, gain=1.0):
    """Gentle arpeggio: string order per eighth note."""
    seq = [1, 2, 0, 3, 2, 0, 3, 2]
    for k, s in enumerate(seq):
        beat = k / 2
        name = chord_at(bar, beat)
        m = midi(UKE[name][s])
        place(uke_b, uke(m, 0.55, 1.6, seed=k % 3), human(tb(bar, beat), 5), 0.2 * gain, pan=-0.2 + s * 0.13)


def bassline(bar, walk=True, gain=1.0):
    ch = CHORDS[bar]
    beats = [(0, 0), (2, 7)] if len(ch) == 1 else [(0, 0), (2, 0)]
    for beat, iv in beats:
        name = chord_at(bar, beat)
        m = midi(ROOT[name]) + 12 + iv if iv else midi(ROOT[name]) + 12
        s = ks(m, 1.2, 0.25, 0.9, seed=1)
        sub = np.sin(2 * np.pi * hz(m) * np.arange(len(s)) / SR) * np.exp(-np.arange(len(s)) / SR * 2.5) * 0.5
        place(bass_b, lp(s, 900) + sub, human(tb(bar, beat), 3), 0.55 * gain)
    if walk:
        nxt = CHORDS.get(bar + 1)
        if nxt:
            target = midi(ROOT[nxt[0]]) + 12
            m = target - 2 if rng.random() < 0.5 else target + 2
            s = ks(m, 0.5, 0.25, 0.6, seed=2)
            place(bass_b, lp(s, 900), human(tb(bar, 3.5), 3), 0.35 * gain)


def drums(bar, kick_g=0.0, clap_g=0.0, shake_g=0.0, tamb_g=0.0, brush_g=0.0):
    for beat in (0, 2):
        if kick_g:
            place(perc_b, kick(), tb(bar, beat), kick_g)
    for beat in (1, 3):
        if clap_g:
            place(perc_b, clap(), human(tb(bar, beat), 3), clap_g, pan=0.1)
        if brush_g:
            place(perc_b, brush(), human(tb(bar, beat), 3), brush_g, pan=-0.1)
    if shake_g:
        for k in range(8):
            place(perc_b, shaker(1.0 if k % 2 == 0 else 0.6), human(tb(bar, k / 2), 3), shake_g, pan=0.35)
    if tamb_g:
        for k in (0.5, 1.5, 2.5, 3.5):
            place(perc_b, tamb(), human(tb(bar, k), 3), tamb_g, pan=-0.35)


def notes(buf, bar, spec, inst, gain, pan=0.0):
    """'E5:.5 G5:.5 r:1' — durations in beats."""
    beat = 0.0
    for tok in spec.split():
        name, dur = tok.split(":")
        dur = float(dur)
        if name != "r":
            t = human(tb(bar, beat), 4)
            sig = recorder(midi(name), dur * BEAT * 0.95) if inst == "rec" else glock(midi(name)) if inst == "glock" else marimba(midi(name))
            place(buf, sig, t, gain, pan)
        beat += dur


# ---------------------------------------------------------------- arrangement
# bars -2..-1: night. A music-box lullaby (the motif the coda brings back), then dawn swells
LULLABY = "C6:.5 E6:.5 G6:.5 C7:.5 G6:.5 E6:.5 C6:1"
place(pad_b, pad([midi(x) for x in ["A2", "E3", "G3", "C4"]], BAR, cutoff=900), tb(-2), 0.1)
notes(bell_b, -2, LULLABY, "glock", 0.07, 0.2)
place(pad_b, pad([midi(x) for x in ["F3", "A3", "C4", "E4"]], BAR * 0.75, cutoff=1400), tb(-1), 0.1)
place(pad_b, pad([midi(x) for x in ["G3", "C4", "D4"]], BAR * 0.25, cutoff=1800), tb(-1, 3), 0.12)
notes(bell_b, -1, "r:3 G5:.25 A5:.25 B5:.25 D6:.25", "glock", 0.09, 0.3)

# bar 0: the alarm clock rings (SFX) and is tapped off at beat 2.1; a C pad holds underneath
place(pad_b, pad([midi(x) for x in ["C3", "G3", "E4"]], BAR), tb(0), 0.1)
strum(0, 0, "C", True, 0.5, spread=0.03, bright=0.5)

# bars 1-2: soft picking, notifications get bell answers, pickup strum into the groove
picking(1, 1.1)
notes(bell_b, 1, "r:1.1 G5:1 C6:1 E6:.9", "glock", 0.18, 0.3)
picking(2, 1.3)
drums(2, shake_g=0.45)
place(pad_b, pad([midi(x) for x in ["C3", "G3", "E4"]], BAR), tb(1), 0.12)
place(pad_b, pad([midi(x) for x in ["F3", "A3", "C4"]], BAR / 2), tb(2), 0.14)
place(pad_b, pad([midi(x) for x in ["G3", "B3", "D4"]], BAR / 2), tb(2, 2), 0.14)
strum(2, 3.5, "G", False, 0.6)

# bars 3-5: WhatsApp list
for b in range(3, 6):
    groove(b, 0.9)
    bassline(b)
    drums(b, shake_g=0.8, kick_g=0.35)
notes(bell_b, 5, "r:2 G5:.5 A5:.5 B5:.5 D6:.5", "glock", 0.16, 0.3)

# bars 6-10: forward to Sydia (VO-heavy, keep the top line sparse)
for b in range(6, 11):
    groove(b, 0.95)
    bassline(b)
    drums(b, kick_g=0.45, brush_g=0.5, shake_g=0.8)
for b, spec in [(7, "r:3 D6:.5 B5:.5"), (9, "r:3 E6:.5 C6:.5"), (10, "r:2 F5:.5 A5:.5 C6:.5 D6:.5")]:
    notes(bell_b, b, spec, "glock", 0.15, 0.3)

# bars 11-14: chorus with the recorder hook
for b in range(11, 15):
    groove(b, 1.05, bright=0.8)
    bassline(b, gain=1.1)
    drums(b, kick_g=0.55, clap_g=0.5, shake_g=0.8, tamb_g=0.6)
HOOK = [
    (11, "E5:.5 G5:.5 C6:1 B5:.5 G5:.5 r:1"),
    (12, "D5:.5 G5:.5 B5:1 A5:.5 G5:.5 r:1"),
    (13, "C5:.5 E5:.5 A5:1 G5:.5 E5:.5 r:1"),
    (14, "F5:.5 A5:.5 C6:.5 D6:.5 E6:1.5 r:.5"),
]
for b, spec in HOOK:
    notes(mel_b, b, spec, "rec", 0.16, -0.05)
    notes(bell_b, b, spec, "glock", 0.06, 0.3)

# bar 15: afternoon time-lapse
place(pad_b, pad([midi(x) for x in ["F3", "A3", "C4", "E4"]], BAR), tb(15), 0.22)
for k, x in enumerate(["F4", "A4", "C5", "E5", "F5", "A5", "C6", "E6", "F6", "A6", "C7", "E7"]):
    place(bell_b, glock(midi(x)), tb(15, 0.5 + k * 0.25), 0.1 + k * 0.006, pan=-0.4 + k * 0.07)
strum(15, 0, "Fmaj7", True, 0.7, spread=0.04, bright=0.5)

# bars 16-20: laptop + web chat, lighter
for b in range(16, 21):
    picking(b, 0.85) if b < 18 else groove(b, 0.75, bright=0.6)
    bassline(b, walk=b >= 18, gain=0.85)
    drums(b, shake_g=0.65, kick_g=0.3 if b >= 18 else 0.0)
for b, spec in [(17, "r:2 C6:.5 A5:.5 F5:1"), (19, "r:2 B5:.5 D6:.5 G6:1"), (20, "r:3 E6:.5 C6:.5")]:
    notes(bell_b, b, spec, "glock", 0.14, 0.3)

# bars 21-23: notes workspace
for b in range(21, 24):
    groove(b, 0.95, bright=0.75)
    bassline(b, gain=1.0)
    drums(b, kick_g=0.5, clap_g=0.35 if b >= 22 else 0.0, shake_g=0.8)
notes(mel_b, 22, "r:2 G5:.5 A5:.5 B5:.5 D6:.5", "rec", 0.13)

# bars 24-27: back to the chat for the weekly report (VO-heavy), then the build into the logo
for b in range(24, 28):
    groove(b, 0.85 + (b - 24) * 0.06, bright=0.7)
    bassline(b, gain=0.95)
    drums(b, kick_g=0.45, brush_g=0.4 if b < 27 else 0.0, clap_g=0.4 if b == 27 else 0.0, shake_g=0.75, tamb_g=0.4 if b == 27 else 0.0)
for b, spec in [(24, "r:3 E6:.5 G6:.5"), (25, "r:3 C6:.5 E6:.5"), (26, "r:2 A5:.5 C6:.5 B5:.5 D6:.5")]:
    notes(bell_b, b, spec, "glock", 0.14, 0.3)
for k in range(8):  # snare-ish roll on the last two beats
    place(perc_b, brush(), tb(27, 2 + k * 0.25), 0.2 + k * 0.05)

# bars 28-29: final chorus under the logo
for b in (28, 29):
    groove(b, 1.0, bright=0.8)
    bassline(b, gain=1.1)
    drums(b, kick_g=0.5, clap_g=0.45, shake_g=0.7, tamb_g=0.5)
place(perc_b, hp(rng.normal(0, 1, int(1.2 * SR)) * np.exp(-np.arange(int(1.2 * SR)) / SR * 4), 4000) * 0.25, tb(28), 1.0)  # cymbal-ish wash
notes(mel_b, 28, HOOK[0][1], "rec", 0.16)
notes(mel_b, 29, HOOK[1][1], "rec", 0.16)

# bars 30-31: coda, the night lullaby on marimba, C rings out
picking(30, 0.7)
bassline(30, walk=False, gain=0.8)
drums(30, shake_g=0.4)
notes(mel_b, 30, "C6:.5 E6:.5 G6:.5 C7:.5 G6:.5 E6:.5 C6:1", "marimba", 0.3, 0.1)
strum(31, 0, "C", True, 0.8, spread=0.05, bright=0.6)
place(bass_b, lp(ks(midi("C3"), 2.5, 0.25, 2.0, seed=3), 800), tb(31), 0.5)
place(bell_b, glock(midi("C7"), 2.5), tb(31, 0.02), 0.12)
place(bell_b, glock(midi("G6"), 2.5), tb(31, 0.5), 0.08)
place(pad_b, pad([midi(x) for x in ["C3", "G3", "C4", "E4"]], BAR * 0.9), tb(31), 0.14)


# ---------------------------------------------------------------- mix
def reverb_ir(seconds=1.8, predelay=0.012):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([rng.normal(0, 1, n), rng.normal(0, 1, n)], axis=1) * np.exp(-t * 3.6)[:, None]
    ir = lp(ir, 6500)
    ir[: int(predelay * SR)] = 0
    return ir / np.sqrt(np.sum(ir**2))


IR = reverb_ir()


def verb(x, wet):
    out = np.zeros_like(x)
    for c in range(2):
        out[:, c] = fftconvolve(x[:, c], IR[:, c])[: len(x)]
    return x + out * wet


mix = verb(uke_b, 0.25) * 1.0
mix += verb(lp(bass_b, 2200), 0.08) * 0.9
mix += verb(mel_b, 0.35)
mix += verb(bell_b, 0.45)
mix += verb(pad_b, 0.4)
mix += verb(perc_b, 0.15) * 0.9
mix = hp(mix, 35)

# gentle bus compression (RMS follower) then normalise
rms = np.sqrt(lp(np.mean(mix**2, axis=1), 6) + 1e-9)
thr = 0.18
gain = np.where(rms > thr, (thr / rms) ** 0.35, 1.0)
mix *= gain[:, None]
end = int((BARS * BAR + 0.5) * SR)
mix = mix[:end]
mix[-int(0.4 * SR) :] *= np.linspace(1, 0, int(0.4 * SR))[:, None]
mix = mix / np.max(np.abs(mix)) * 0.89

out = sys.argv[1] if len(sys.argv) > 1 else "public/music/sydia-seller.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
print(f"wrote {out}: {len(mix) / SR:.1f} s")
