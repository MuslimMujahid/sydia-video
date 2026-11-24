"""Synthesize "Titip Senyum", the happy acoustic track for TitipanTelur.

112.5 BPM, 4/4, G major. At 30 fps one beat = 16 frames, one bar = 64 frames (2.133 s).
Bar numbers match src/titipan/timeline.ts (SCENES); keep them in sync:

  0-3    S1 hook: fingerpicked steel-string guitar over a soft pad (G D/F# Em C).
         On "malah lupa?!" (frame 222) the track tape-stops (slows to a halt); bar 3 is
         stretched to six beats so the hook can breathe, and a pickup strum on beat 5.5
         brings the band back. Every bar from 4 on is shifted by those two beats (HOOK_EXTRA)
  4-10   S2-S3: the groove: strums with muted "chucks" on 2 and 4, acoustic bass, cajón,
         shaker; glockenspiel answers
  11-18  S4 spotlight: the music drops to kalimba and a low pad, no drums
  18.5   S5: pickup strum, then a lighter groove (fingerpicking, bass, shaker, soft cajón)
  26.5   S6 busy mind: the strum groove returns, claps join, tambourine and a roll into the chorus
  34-36  S7 "Pasang pengingat": chorus with the whistle hook
  37-40  S8 summary: half-time resolve (C Am7 Dsus4-D)
  40.5   S9 CTA: light groove, the whistle tag, a final G rings out

Every instrument is synthesized here: Karplus-Strong guitar and bass, additive kalimba,
glockenspiel and whistle, a soft pad and shaped-noise percussion.

Run: python3 scripts/make-titipan-music.py public/music/titipan-telur.wav
"""

import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

SR = 44100
FPS = 30
BEAT = 16 / FPS  # 112.5 BPM
BAR = 4 * BEAT
TOTAL_FRAMES = 2816
HOOK_EXTRA = 2 * BEAT  # bar 3 runs six beats
N = int((TOTAL_FRAMES / FPS + 3) * SR)
rng = np.random.default_rng(2611)
SWING = 0.57


# ---------------------------------------------------------------- helpers
def tb(bar, beat=0.0):
    """Seconds at a bar/beat position, with swung eighths."""
    whole = np.floor(beat)
    frac = beat - whole
    if abs(frac - 0.5) < 1e-6:
        frac = SWING
    return bar * BAR + (whole + frac) * BEAT + (HOOK_EXTRA if bar >= 4 else 0)


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


NAMES = {"C": 0, "C#": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "Bb": 10, "B": 11}


def midi(name):
    return 12 * (int(name[-1]) + 1) + NAMES[name[:-1]]


def tail(sig, ms=40):
    k = min(len(sig), int(ms / 1000 * SR))
    sig = sig.copy()
    sig[-k:] *= np.linspace(1, 0, k)
    return sig


def human(t, ms=5):
    return t + rng.normal(0, ms / 1000)


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
    thump = sum(ks(midi(x), 0.12, 0.5, 0.05, seed=4) for x in ["G2", "D3", "G3", "B3"])
    noise = bp(rng.normal(0, 1, n), 400, 3500) * np.exp(-t * 60)
    return (thump * 0.5 + noise * 0.6) * np.minimum(1, t / 0.002)


# ---------------------------------------------------------------- kalimba, glockenspiel, whistle, pad
def kalimba(m, length=2.2):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 1.9)
    s += 0.22 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 14)
    s += 0.08 * np.sin(2 * np.pi * f * 9.6 * t) * np.exp(-t * 30)
    click = bp(rng.normal(0, 1, n), 1500, 6000) * np.exp(-t * 700) * 0.2
    return tail((s + click) * np.minimum(1, t / 0.0015), 40)


def glock(m, length=1.6):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.zeros(n)
    for ratio, amp, dec in [(1, 1, 2.2), (2.76, 0.35, 6), (5.40, 0.18, 12), (8.93, 0.08, 20)]:
        s += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * dec)
    return tail(s * np.minimum(1, t / 0.001), 40)


def whistle(m, dur):
    n = int((dur + 0.1) * SR)
    t = np.arange(n) / SR
    f = hz(m)
    scoop = 2 ** (-0.35 / 12 * np.exp(-t / 0.03))  # each note slides up into pitch
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.12) / 0.2, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * scoop * vib) / SR
    s = np.sin(ph) + 0.04 * np.sin(2 * ph)
    breath = bp(rng.normal(0, 1, n), f * 0.9, min(f * 1.15, SR / 2 - 200)) * 0.08
    e = np.minimum(1, t / 0.025) * np.clip((dur + 0.06 - t) / 0.06, 0, 1)
    return (s + breath) * e


def pad(ms, dur, cutoff=1600):
    n = int((dur + 0.8) * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for m in ms:
        for det in (-0.1, 0.0, 0.09):
            f = hz(m) * 2 ** (det / 12)
            s += np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) + 0.3 * np.sin(4 * np.pi * f * t)
    s = lp(s / (len(ms) * 3), cutoff)
    e = np.minimum(1, t / 0.6) * np.clip((dur + 0.8 - t) / 0.8, 0, 1)
    return s * e


# ---------------------------------------------------------------- percussion
def cajon_bass():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    f = 55 + 60 * np.exp(-t * 35)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    thud = lp(rng.normal(0, 1, n), 400) * np.exp(-t * 40) * 0.6
    return (body + thud) * 0.9


def cajon_slap():
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    crack = bp(rng.normal(0, 1, n), 900, 6000) * np.exp(-t * 38)
    tone = np.sin(2 * np.pi * 230 * t) * np.exp(-t * 30) * 0.35
    return (crack * 0.7 + tone) * 0.8


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


def tamb():
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    return bp(rng.normal(0, 1, n), 6000, 14000) * np.exp(-t * 18) * 0.35


# ---------------------------------------------------------------- harmony
GTR = {
    "G": ["G2", "B2", "D3", "G3", "B3", "G4"],
    "D/F#": ["F#2", "A2", "D3", "A3", "D4", "F#4"],
    "D": ["D3", "A3", "D4", "F#4"],
    "Dsus4": ["D3", "A3", "D4", "G4"],
    "Em": ["E2", "B2", "E3", "G3", "B3", "E4"],
    "C": ["C3", "E3", "G3", "C4", "E4"],
    "Cmaj7": ["C3", "E3", "G3", "B3", "E4"],
    "Am7": ["A2", "E3", "G3", "C4", "E4"],
}
ROOT = {"G": "G1", "D/F#": "F#1", "D": "D2", "Dsus4": "D2", "Em": "E1", "C": "C2", "Cmaj7": "C2", "Am7": "A1"}

# One entry per bar: chords on beats 1 (and 3 when two are given).
CHORDS = {
    0: ["G"], 1: ["D/F#"], 2: ["Em"], 3: ["C"],
    4: ["G"], 5: ["D"], 6: ["Em"], 7: ["C"], 8: ["G"], 9: ["D"], 10: ["C", "D"],
    11: ["Em"], 12: ["C"], 13: ["G"], 14: ["D"], 15: ["Em"], 16: ["C"], 17: ["G"], 18: ["D"],
    19: ["G"], 20: ["D"], 21: ["Em"], 22: ["C"], 23: ["G"], 24: ["D"], 25: ["C"], 26: ["D"],
    27: ["Em"], 28: ["C"], 29: ["G"], 30: ["D"], 31: ["Em"], 32: ["C"], 33: ["D"],
    34: ["G"], 35: ["D"], 36: ["Em"], 37: ["C"],
    38: ["Am7"], 39: ["Dsus4", "D"], 40: ["G"], 41: ["C"], 42: ["D", "G"], 43: ["G"],
}


def chord_at(bar, beat):
    ch = CHORDS.get(bar)
    if not ch:
        return None
    return ch[1] if len(ch) > 1 and beat >= 2 else ch[0]


gtr_b, bass_b, mel_b, perc_b, pad_b, bell_b = bus(), bus(), bus(), bus(), bus(), bus()


def strum(bar, beat, name, down=True, gain=1.0, spread=0.011, bright=0.75):
    notes = [midi(x) for x in GTR[name]]
    order = notes if down else notes[::-1][:4]  # up-strums catch the top strings
    t0 = human(tb(bar, beat), 4)
    for i, m in enumerate(order):
        g = gain * (1.0 if down else 0.65) * (0.85 + 0.15 * rng.random())
        place(gtr_b, guitar(m, bright, 2.0, 2.2, seed=i % 3), t0 + i * spread, 0.16 * g, pan=-0.3 + i * 0.1)


# Island-pop strum: D . (chuck) U . U (chuck) U, with swung eighths.
PATTERN = [(0, "D", 1.0), (0.5, "U", 0.45), (1, "X", 0.9), (1.5, "U", 0.55), (2.5, "U", 0.6), (3, "X", 0.9), (3.5, "U", 0.55)]


def groove(bar, gain=1.0, bright=0.75):
    for beat, kind, acc in PATTERN:
        name = chord_at(bar, beat)
        if kind == "X":
            place(gtr_b, chuck(), human(tb(bar, beat), 3), 0.35 * gain * acc, pan=0.05)
        else:
            strum(bar, beat, name, kind == "D", gain * acc, bright=bright)


def picking(bar, gain=1.0):
    """Travis picking: alternating bass on the beats, treble on the off-beats."""
    for k in range(8):
        beat = k / 2
        name = chord_at(bar, beat)
        notes = GTR[name]
        if k % 2 == 0:
            m = midi(notes[0]) if k % 4 == 0 else midi(notes[2])
            g = 0.2
        else:
            m = midi(notes[[-1, -2, -1, -3][k // 2]])
            g = 0.15
        place(gtr_b, guitar(m, 0.65, 2.0, 2.0, seed=k % 3), human(tb(bar, beat), 5), g * gain, pan=-0.15 + (k % 2) * 0.3)


def bassline(bar, walk=True, gain=1.0, half=False):
    ch = CHORDS[bar]
    beats = [(0, 0)] if half else ([(0, 0), (2, 7)] if len(ch) == 1 else [(0, 0), (2, 0)])
    for beat, iv in beats:
        name = chord_at(bar, beat)
        m = midi(ROOT[name]) + 12 + iv
        s = ks(m, 1.6 if half else 1.0, 0.25, 1.4 if half else 0.8, seed=1)
        sub = np.sin(2 * np.pi * hz(m) * np.arange(len(s)) / SR) * np.exp(-np.arange(len(s)) / SR * 2.2) * 0.5
        place(bass_b, lp(s, 900) + sub, human(tb(bar, beat), 3), 0.55 * gain)
    if walk and not half:
        nxt = CHORDS.get(bar + 1)
        if nxt:
            target = midi(ROOT[nxt[0]]) + 12
            m = target - 1 if rng.random() < 0.5 else target + 2
            place(bass_b, lp(ks(m, 0.5, 0.25, 0.6, seed=2), 900), human(tb(bar, 3.5), 3), 0.33 * gain)


def drums(bar, bass_g=0.0, slap_g=0.0, clap_g=0.0, shake_g=0.0, tamb_g=0.0):
    if bass_g:
        for beat in (0, 1.5, 2):
            place(perc_b, cajon_bass(), human(tb(bar, beat), 3), bass_g * (0.7 if beat == 1.5 else 1.0))
    for beat in (1, 3):
        if slap_g:
            place(perc_b, cajon_slap(), human(tb(bar, beat), 3), slap_g, pan=0.1)
        if clap_g:
            place(perc_b, clap(), human(tb(bar, beat), 4), clap_g, pan=-0.12)
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
            if inst == "whistle":
                sig = whistle(midi(name), dur * BEAT * 0.92)
            elif inst == "glock":
                sig = glock(midi(name))
            else:
                sig = kalimba(midi(name))
            place(buf, sig, t, gain, pan)
        beat += dur


def chord_pad(bar, name, beats=4, gain=0.1, cutoff=1600):
    place(pad_b, pad([midi(x) + 12 for x in GTR[name][-4:]], beats * BEAT, cutoff), tb(bar), gain)


# ---------------------------------------------------------------- arrangement
# bars 0-3: S1 hook, fingerpicked, the scratch cuts it on bar 3
for b in range(0, 4):
    picking(b, 1.5 + 0.15 * b)
    chord_pad(b, chord_at(b, 0), gain=0.1)
drums(2, shake_g=0.4)
drums(3, shake_g=0.5)
strum(3, 5.5, "G", False, 0.8)  # pickup back in after the tape stop

# bars 4-10: S2-S3 groove
for b in range(4, 11):
    groove(b, 0.9 if b < 7 else 0.95)
    bassline(b)
    drums(b, bass_g=0.4, slap_g=0.4 if b >= 5 else 0.0, shake_g=0.7)
for b, spec in [(5, "r:3 A5:.5 F#5:.5"), (7, "r:2 G5:.5 A5:.5 B5:.5 D6:.5"), (9, "r:3 F#6:.5 D6:.5"), (10, "r:2 E6:.5 D6:.5 B5:.5 A5:.5")]:
    notes(bell_b, b, spec, "glock", 0.14, 0.3)

# bars 11-18: S4 spotlight, the music drops to kalimba and a low pad
KAL = {"Em": "E4 G4 B4 E5", "C": "C4 E4 G4 C5", "G": "G4 B4 D5 G5", "D": "D4 F#4 A4 D5"}
for b in range(11, 19):
    name = chord_at(b, 0)
    tones = KAL[name].split()
    seq = [0, 2, 1, 3, 2, 1, 3, 2] if b % 2 else [0, 1, 2, 3, 2, 1, 2, 3]
    for k, i in enumerate(seq):
        place(mel_b, kalimba(midi(tones[i])), human(tb(b, k / 2), 6), 0.055 if k else 0.07, pan=-0.3 + i * 0.2)
    chord_pad(b, name, gain=0.05, cutoff=900)
    place(bass_b, np.sin(2 * np.pi * hz(midi(ROOT[name]) + 12) * np.arange(int(BAR * SR)) / SR) * np.exp(-np.arange(int(BAR * SR)) / SR * 1.5), tb(b), 0.06)
drums(18, shake_g=0.35)
strum(18, 3.5, "G", False, 0.7)  # S5 pickup (bar 18.5 is the cut; the groove resumes on 19)
strum(18, 2, "D", True, 0.6)

# bars 19-26: S5, lighter groove under the long explanation
for b in range(19, 27):
    picking(b, 0.95)
    bassline(b, gain=0.9)
    drums(b, bass_g=0.3, slap_g=0.25 if b >= 21 else 0.0, shake_g=0.6)
for b, spec in [(20, "r:3 A5:.5 D6:.5"), (22, "r:3 G5:.5 E5:.5"), (24, "r:3 F#5:.5 A5:.5"), (26, "r:2 D6:.5 C6:.5 A5:.5 F#5:.5")]:
    notes(bell_b, b, spec, "glock", 0.12, 0.3)

# bars 27-33: S6 busy mind, the strum groove is back, claps and tambourine pile on
for b in range(27, 34):
    groove(b, 0.95, bright=0.8)
    bassline(b, gain=1.0)
    drums(b, bass_g=0.45, slap_g=0.45, clap_g=0.35 if b >= 28 else 0.0, shake_g=0.75, tamb_g=0.45 if b >= 31 else 0.0)
for k in range(8):  # cajón roll into the chorus
    place(perc_b, cajon_slap(), tb(33, 2 + k * 0.25), 0.18 + k * 0.05)

# bars 34-37: S7 chorus, the whistle hook ("Pasang pengingat" lands on bar 34)
HOOK = [
    (34, "D6:.5 B5:.5 D6:.5 G6:1 r:.5 F#6:.5 G6:.5"),
    (35, "A6:1 F#6:.5 D6:.5 r:1 D6:.5 E6:.5"),
    (36, "G6:.5 F#6:.5 E6:.5 B5:1 r:.5 B5:.5 C6:.5"),
    (37, "D6:.5 E6:.5 C6:1 B5:.5 A5:.5 G5:1"),
]
place(perc_b, hp(rng.normal(0, 1, int(1.4 * SR)) * np.exp(-np.arange(int(1.4 * SR)) / SR * 3.5), 4500) * 0.22, tb(34), 1.0)  # cymbal-ish wash
for b in range(34, 37):
    groove(b, 1.05, bright=0.85)
    bassline(b, gain=1.1)
    drums(b, bass_g=0.5, slap_g=0.5, clap_g=0.45, shake_g=0.75, tamb_g=0.5)
for b, spec in HOOK:
    notes(mel_b, b, spec, "whistle", 0.13, -0.05)
    notes(bell_b, b, spec, "glock", 0.045, 0.3)

# bars 37-40: S8 summary, half-time resolve
for b in range(37, 40):
    strum(b, 0, chord_at(b, 0), True, 0.9, spread=0.02)
    if len(CHORDS[b]) > 1:
        strum(b, 2, chord_at(b, 2), True, 0.7, spread=0.02)
    strum(b, 2.5, chord_at(b, 2.5), False, 0.4)
    bassline(b, half=True, gain=0.9)
    chord_pad(b, chord_at(b, 0), gain=0.1)
    drums(b, shake_g=0.45)
for b, spec in [(38, "r:2 E6:1 G6:1"), (39, "r:2 F#6:.5 A6:.5 D7:1")]:
    notes(bell_b, b, spec, "glock", 0.12, 0.3)

# bars 40-43: S9 CTA, light groove, the whistle tag, a final G rings out
for b in (40, 41):
    groove(b, 0.8)
    bassline(b, gain=0.9)
    drums(b, bass_g=0.35, slap_g=0.35, shake_g=0.6)
strum(42, 0, "D", True, 0.8)
strum(42, 1, "D", True, 0.5)
place(bass_b, lp(ks(midi("D2"), 1.0, 0.25, 0.8, seed=1), 900), tb(42), 0.5)
notes(mel_b, 42, "r:.5 D6:.5 E6:.5 F#6:.5", "whistle", 0.13)
strum(42, 2, "G", True, 1.0, spread=0.04, bright=0.7)
place(bass_b, lp(ks(midi("G2"), 2.5, 0.25, 2.2, seed=3), 800), tb(42, 2), 0.55)
place(mel_b, whistle(midi("G6"), 1.4), tb(42, 2), 0.13)
place(bell_b, glock(midi("G6"), 2.5), tb(42, 2.02), 0.12)
place(bell_b, glock(midi("D7"), 2.5), tb(42, 2.5), 0.08)
place(pad_b, pad([midi(x) for x in ["G3", "B3", "D4", "G4"]], BAR * 0.7), tb(42, 2), 0.12)


# ---------------------------------------------------------------- mix
def reverb_ir(seconds=1.6, predelay=0.012):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([rng.normal(0, 1, n), rng.normal(0, 1, n)], axis=1) * np.exp(-t * 4.0)[:, None]
    ir = lp(ir, 6500)
    ir[: int(predelay * SR)] = 0
    return ir / np.sqrt(np.sum(ir**2))


IR = reverb_ir()


def verb(x, wet):
    out = np.zeros_like(x)
    for c in range(2):
        out[:, c] = fftconvolve(x[:, c], IR[:, c])[: len(x)]
    return x + out * wet


mix = verb(gtr_b, 0.22)
mix += verb(lp(bass_b, 2200), 0.06) * 0.9
mix += verb(mel_b, 0.35)
mix += verb(bell_b, 0.45)
mix += verb(pad_b, 0.4)
mix += verb(perc_b, 0.12) * 0.9
mix = hp(mix, 35)

# Tape stop on "malah lupa?!" (frame 222 = the hook clip starts at 6 + its malahLupa cue): the band slows to a halt over STOP seconds, then silence
# until the pickup on bar 3 beat 5.5.
t = np.arange(len(mix)) / SR
cut_from, cut_to, STOP = 222 / FPS, tb(3, 5.5) - 0.01, 0.45
i0, n_stop = int(cut_from * SR), int(STOP * SR)
tau = np.arange(n_stop) / SR
src = (cut_from + tau - tau**2 / (2 * STOP)) * SR  # read position decelerating from 1x to 0x
stopped = np.stack([np.interp(src, np.arange(len(mix)), mix[:, ch]) for ch in range(2)], axis=1)
stopped *= np.linspace(1, 0, n_stop)[:, None] ** 0.7
gate = np.clip((t - cut_to) / 0.01, 0, 1)
gate[:i0] = 1
mix = mix * gate[:, None]
mix[i0 : i0 + n_stop] = lp(stopped, 3500)

# gentle bus compression (RMS follower) then normalise
rms = np.sqrt(np.maximum(lp(np.mean(mix**2, axis=1), 6), 0) + 1e-9)
thr = 0.18
mix *= np.where(rms > thr, (thr / rms) ** 0.35, 1.0)[:, None]
end = int(TOTAL_FRAMES / FPS * SR)
mix = mix[:end]
mix[-int(0.5 * SR) :] *= np.linspace(1, 0, int(0.5 * SR))[:, None]
mix = mix / np.max(np.abs(mix)) * 0.89

out = sys.argv[1] if len(sys.argv) > 1 else "public/music/titipan-telur.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
print(f"wrote {out}: {len(mix) / SR:.1f} s")
