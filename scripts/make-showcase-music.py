"""Synthesize the acoustic showcase soundtrack and its UI sound effects.

100 BPM, 4/4. At 30 fps one beat = 18 frames, one bar = 72 frames (2.4 s).
Bar numbers mirror src/showcase/timeline.ts:

  0-1    intro: fingerpicked D - A/C#, kalimba motif, shaker + pickup strum
  2-5    verse 1 (D Bm G A): strum groove, cajon, shaker, bass, whistle A
  6-8    verse 2 (Em G A): claps, kalimba melody
  9-12   chorus 1 (G A Bm D): tambourine, whistle hook, kalimba counter-line
  13-15  post-chorus (Bm G A): piano melody, lighter
  16-17  breather: half-time fingerpicking, soft piano/kalimba, fill back in
  18-32  phone act in E (capo 2): verse, call/response, chorus, bridge, chorus 2
  33     dive: ringing Eadd9, descending kalimba, short reverse swell
  34-37  voice note: mellow fingerpicking, soft piano, light shaker
  38-40  outro: final chorus, E chord lands on the logo
  41-43  coda under the logo and CTA: soft fingerpicking (A B E), intro kalimba motif returns

Every instrument is synthesized here: Karplus-Strong guitars and bass,
additive piano, kalimba, whistle, choir pad and shaped-noise percussion.

Run: python3 -I scripts/make-showcase-music.py public
Writes music/sydia-showcase.wav, sfx/notify.wav and sfx/pop.wav under the given folder.
"""

import os
import sys
import time
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

T0 = time.time()
SR = 44100
BPM = 100
BEAT = 60 / BPM
BAR = BEAT * 4
BARS = 44
TOTAL = BARS * BAR
N = int(round(TOTAL * SR))
PAD = int(4 * SR)  # tail room while mixing
rng = np.random.default_rng(2026)


# ---------------------------------------------------------------- helpers
def bus():
    return np.zeros((N + PAD, 2))


def tb(bar, beat=0.0):
    """Seconds for a bar/beat position."""
    return bar * BAR + beat * BEAT


def place(dst, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i < 0:
        sig = sig[-i:]
        i = 0
    if sig.ndim == 1:
        sig = np.stack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))], axis=1) * np.sqrt(2)
    end = min(len(dst), i + len(sig))
    if end > i:
        dst[i:end] += sig[: end - i] * gain


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 200), "low", fs=SR, output="sos"), x, axis=0)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR / 2 - 200)], "band", fs=SR, output="sos"), x, axis=0)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


NAMES = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def midi(name):
    return 12 * (int(name[-1]) + 1) + NAMES[name[:-1]]


def mel(bar, spec, start=0.0):
    """'F#5:.5 A5:1 r:1' -> [(seconds, duration_seconds, midi)]."""
    out, beat = [], start
    for tok in spec.split():
        name, dur = tok.split(":")
        dur = float(dur)
        if name != "r":
            out.append((tb(bar, beat), dur * BEAT, midi(name)))
        beat += dur
    return out


def fade_tail(sig, ms=30):
    n = min(len(sig), int(ms / 1000 * SR))
    if n > 1:
        sig = sig.copy()
        sig[-n:] *= np.linspace(1, 0, n)
    return sig


def human(t, ms=6):
    return t + rng.normal(0, ms / 1000)


# ---------------------------------------------------------------- Karplus-Strong
_ks_cache = {}


def ks_raw(m, bright, t60, seed, length):
    f = hz(m)
    n = max(2, int(SR / f))
    f_eff = SR / (n + 0.5)  # the two-point average adds half a sample of delay
    ratio = f / f_eff
    out_len = int(length * SR)
    raw_len = int(out_len * ratio) + 2 * n + 4
    r = np.random.default_rng(seed)
    exc = r.uniform(-1, 1, n)
    a = 0.92 * (1 - bright)  # one-pole lowpass on the excitation = softer pick
    exc = lfilter([1 - a], [1, -a], exc)
    pick = max(1, int((0.1 + 0.12 * (1 - bright)) * n))
    exc = exc - 0.7 * np.roll(exc, pick)
    exc -= exc.mean()
    g = 0.001 ** (1 / (f_eff * t60))
    blocks = raw_len // n + 2
    y = np.zeros(blocks * n)
    y[:n] = exc
    for k in range(1, blocks):
        prev = y[(k - 1) * n : k * n]
        before = y[(k - 1) * n - 1] if k >= 2 else 0.0
        shifted = np.concatenate(([before], prev[:-1]))
        y[k * n : (k + 1) * n] = g * 0.5 * (prev + shifted)
    idx = np.arange(out_len) * ratio
    out = np.interp(idx, np.arange(len(y)), y)
    out /= np.max(np.abs(out)) + 1e-9
    return out


def ks(m, bright=0.5, mute=False, variant=None):
    b = round(bright * 5) / 5
    v = rng.integers(0, 3) if variant is None else variant
    key = (m, b, mute, v)
    if key not in _ks_cache:
        if mute:
            sig = ks_raw(m, 0.12, 0.09, hash(key) % 10_000, 0.3)
        else:
            t60 = float(np.clip(4.2 - (m - 40) * 0.07, 1.3, 4.5))
            sig = ks_raw(m, 0.25 + 0.6 * b, t60, hash(key) % 10_000, min(4.5, t60 + 0.3))
        _ks_cache[key] = sig
    return _ks_cache[key]


# Open-position guitar shapes in D (low string first). Capo +2 gives the E-major act.
SHAPES = {
    "D": [50, 57, 62, 66],
    "Bm": [47, 54, 59, 62, 66],
    "G": [43, 47, 50, 55, 59, 67],
    "A": [45, 52, 57, 61, 64],
    "Em": [40, 47, 52, 55, 59, 64],
    "A/C#": [49, 52, 57, 61, 64],
    "Gmaj7": [43, 50, 55, 59, 66],
    "A6sus": [45, 52, 57, 62, 66],
    "Dadd9": [50, 57, 62, 64, 69],
}
ROOTS = {"D": 38, "Bm": 35, "G": 31, "A": 33, "Em": 28, "A/C#": 37, "Gmaj7": 31, "A6sus": 33, "Dadd9": 38}

gtr, gtr_pick = bus(), bus()


def strum(t, shape, capo, vel, kind, ring, dst=None):
    dst = gtr if dst is None else dst
    notes = [m + capo for m in SHAPES[shape]]
    if kind == "U":
        notes = notes[-4:][::-1]
        vel *= 0.78
    mute = kind == "M"
    gap = rng.uniform(0.008, 0.015) * (0.8 if kind == "U" else 1.0)
    bright = 0.35 + 0.5 * vel + (0.12 if kind == "U" else 0)
    for i, m in enumerate(notes):
        sig = ks(m, bright, mute)
        length = int((0.3 if mute else ring) * SR)
        sig = fade_tail(sig[:length], 40)
        spread = (i / max(1, len(notes) - 1) - 0.5) * 0.5
        place(dst, sig, t + i * gap, vel * (0.32 if mute else 0.2) * (1 - 0.04 * i), spread * (-1 if kind == "U" else 1))
    if mute:  # the slap of the palm on the strings
        n = int(0.03 * SR)
        click = bp(rng.standard_normal(n), 300, 3000) * np.exp(-np.arange(n) / SR / 0.006)
        place(dst, click, t, vel * 0.25)


GROOVES = {
    "A": [(0, "D", 1.0), (1, "M", 0.7), (1.5, "U", 0.55), (2.5, "U", 0.6), (3, "M", 0.7), (3.5, "U", 0.55)],
    "B": [(0, "D", 1.0), (1, "D", 0.75), (1.5, "U", 0.6), (2.5, "U", 0.65), (3, "D", 0.8), (3.5, "U", 0.6)],
    "C": [(0, "D", 1.0), (0.75, "U", 0.4), (1, "D", 0.7), (1.5, "U", 0.55), (2, "M", 0.6), (2.5, "U", 0.6), (3, "D", 0.8), (3.5, "U", 0.55), (3.75, "U", 0.4)],
    "S": [(0, "D", 0.8), (1, "M", 0.6), (1.5, "U", 0.45), (2.5, "U", 0.5), (3, "M", 0.6)],
    "16": [(k * 0.25, "D" if k % 2 == 0 else "U", 0.95 if k % 4 == 0 else (0.75 if k % 2 == 0 else 0.5)) for k in range(16)],
    "push": [(0, "D", 1.0), (1, "D", 0.7), (1.5, "U", 0.6), (2, "D", 0.75), (2.5, "U", 0.6), (3, "D", 0.85), (3.25, "U", 0.5), (3.5, "D", 0.8), (3.75, "U", 0.55)],
}


def groove(bar, chords, capo, level, pattern, drop=()):
    """chords: [(beat, shape)]; each strum rings until the next stroke."""
    events = [e for e in GROOVES[pattern] if e[0] not in drop]
    for j, (b, kind, v) in enumerate(events):
        nxt = events[j + 1][0] if j + 1 < len(events) else 4.0
        shape = [s for (cb, s) in chords if cb <= b][-1]
        vel = float(np.clip(v * level + rng.normal(0, 0.05), 0.15, 1.0))
        strum(human(tb(bar, b), 5), shape, capo, vel, kind, (nxt - b) * BEAT + 0.08)


def chug(bar, shape, capo, level):
    notes = [m + capo for m in SHAPES[shape]][:3]
    for k in range(8):
        v = level * (1.0 if k in (0, 3, 6) else 0.62) + rng.normal(0, 0.04)
        for i, m in enumerate(notes):
            sig = fade_tail(ks(m, 0.3, False)[: int(0.2 * SR)] * np.exp(-np.arange(int(0.2 * SR)) / SR / 0.07), 20)
            place(gtr, sig, human(tb(bar, k * 0.5), 4) + i * 0.006, v * 0.3, -0.1)


def fingerpick(bar, shape, capo, level, variant=0, ring=1.8, dst=None):
    dst = gtr_pick if dst is None else dst
    n = [m + capo for m in SHAPES[shape]]
    bass, alt, tre = n[0], n[1] if len(n) > 4 else n[0] + 12, n[-3:]
    pats = [
        [(0, bass), (0.5, tre[1]), (1, alt), (1.5, tre[2]), (2, bass), (2.5, tre[0]), (3, alt), (3.5, tre[1])],
        [(0, bass), (0, tre[2]), (1, alt), (1.5, tre[1]), (2, bass), (2.5, tre[2]), (3, alt), (3.5, tre[0])],
        [(0, bass), (0.5, tre[0]), (1, tre[1]), (1.5, tre[2]), (2, alt), (2.5, tre[1]), (3, tre[0]), (3.5, tre[2])],
        [(0, bass), (0.75, tre[1]), (1.5, tre[2]), (2, alt), (2.75, tre[0]), (3.5, tre[1])],
    ]
    for b, m in pats[variant % len(pats)]:
        thumb = m in (bass, alt)
        v = level * (0.9 if thumb else 0.75) + rng.normal(0, 0.05)
        sig = fade_tail(ks(m, 0.4 if thumb else 0.55)[: int(ring * SR)], 80)
        place(dst, sig, human(tb(bar, b), 7), v * 0.24, (-0.3 if thumb else 0.3))


def slow_arp(bar, shape, capo, level):
    n = [m + capo for m in SHAPES[shape]]
    seq = [(0, n[0]), (0.5, n[1]), (1, n[2]), (1.5, n[3]), (2, n[-1]), (3, n[2])]
    for b, m in seq:
        sig = fade_tail(ks(m, 0.4)[: int(3.2 * SR)], 200)
        place(gtr_pick, sig, human(tb(bar, b), 10), level * 0.24 * rng.uniform(0.85, 1.05), (b - 1.5) * 0.15)


# ---------------------------------------------------------------- bass
bass = bus()


def bass_note(m, t, dur, vel):
    length = dur + 0.12
    k = ks_raw(m, 0.2, 1.8, int(m * 7), length + 0.05)[: int(length * SR)]
    tt = np.arange(len(k)) / SR
    sine = np.sin(2 * np.pi * hz(m) * tt) * np.exp(-tt / 0.9) * np.minimum(1, tt / 0.006)
    sig = lp(0.55 * k + 0.6 * sine, 1100)
    place(bass, fade_tail(sig, 60), human(t, 4), vel * 0.5)


def bass_bar(bar, root, nxt_root, level, style):
    fifth, octv = root + 7, root + 12
    approach = nxt_root - 1 if nxt_root > root else nxt_root + 2
    if style == "verse":
        pat = [(0, root, 1.4, 1), (2.5, root, 0.4, 0.6), (3, fifth, 0.45, 0.7), (3.5, approach, 0.4, 0.6)]
    elif style == "chorus":
        pat = [(0, root, 0.9, 1), (1.5, root, 0.4, 0.6), (2, fifth, 0.9, 0.85), (3, octv, 0.45, 0.6), (3.5, approach, 0.4, 0.65)]
    elif style == "eighths":
        pat = [(k * 0.5, root, 0.35, 1 if k % 3 == 0 else 0.7) for k in range(8)]
    elif style == "soft":
        pat = [(0, root, 1.8, 0.8), (2, fifth, 1.6, 0.55)]
    else:  # "long"
        pat = [(0, root, 3.8, 0.9)]
    for b, m, d, v in pat:
        bass_note(m, tb(bar, b), d * BEAT, level * v)


# ---------------------------------------------------------------- percussion
perc = bus()


def cajon_bass(t, vel):
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    f = 62 + 70 * np.exp(-tt / 0.02)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.13)
    thump = lp(rng.standard_normal(n), 400) * np.exp(-tt / 0.02) * 0.6
    place(perc, (body + thump) * 0.9, human(t, 4), vel * 0.7)


def cajon_slap(t, vel):
    n = int(0.18 * SR)
    tt = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 900, 6500) * np.exp(-tt / 0.045)
    tone = np.sin(2 * np.pi * 235 * tt) * np.exp(-tt / 0.03)
    place(perc, noise * 0.7 + tone * 0.35, human(t, 4), vel * 0.55, 0.05)


def shaker(t, vel):
    n = int(0.11 * SR)
    tt = np.arange(n) / SR
    env = np.minimum(1, tt / 0.018) * np.exp(-tt / 0.035)
    place(perc, hp(rng.standard_normal(n), 5000) * env, human(t, 5), vel * 0.18, 0.35)


def tamb(t, vel):
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    jingle = bp(rng.standard_normal(n), 6500, 12000) * np.exp(-tt / 0.11)
    hit = hp(rng.standard_normal(n), 3000) * np.exp(-tt / 0.01)
    place(perc, jingle * 0.6 + hit * 0.3, human(t, 5), vel * 0.22, -0.4)


def clap(t, vel):
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    env = np.zeros(n)
    for off in (0.0, 0.009, 0.019):
        mask = tt >= off
        env[mask] += np.exp(-(tt[mask] - off) / (0.008 if off < 0.015 else 0.07))
    place(perc, bp(rng.standard_normal(n), 900, 3500) * env * 0.6, human(t, 4), vel * 0.4, -0.15)


def drums(bar, style, level=1.0, fill=None):
    if style in ("verse", "chorus", "light"):
        cajon_bass(tb(bar, 0), level)
        cajon_bass(tb(bar, 2.5), level * 0.75)
        if style == "chorus":
            cajon_bass(tb(bar, 2), level * 0.6)
        cajon_slap(tb(bar, 1), level * (0.8 if style == "light" else 1))
        cajon_slap(tb(bar, 3), level * (0.8 if style == "light" else 1))
        for gb in rng.choice([0.75, 1.75, 2.25, 3.75, 1.5], size=2, replace=False):
            cajon_slap(tb(bar, gb), level * 0.22)
    if style != "none":
        for k in range(16):
            accent = 1.0 if k % 4 == 2 else (0.65 if k % 2 == 0 else 0.4)
            shaker(tb(bar, k * 0.25), level * accent * (0.6 if style == "light" else 1))
    if fill == "short":
        for b, v in ((3.5, 0.5), (3.75, 0.7)):
            cajon_slap(tb(bar, b), level * v)
    elif fill == "roll":
        for k, b in enumerate((3, 3.25, 3.5, 3.75)):
            cajon_slap(tb(bar, b), level * (0.45 + k * 0.15))
    elif fill == "build":
        for k in range(8):
            cajon_slap(tb(bar, 2 + k * 0.25), level * (0.3 + k * 0.09))


def tamb_bar(bar, level, eighths=False):
    for k in range(8 if eighths else 2):
        b = k * 0.5 if eighths else (1 + 2 * k)
        tamb(tb(bar, b), level * (1 if b in (1, 3) else 0.55))


def claps_bar(bar, level):
    clap(tb(bar, 1), level)
    clap(tb(bar, 3), level)


# ---------------------------------------------------------------- kalimba, piano, whistle, choir
kal, piano, whistle_bus, choir = bus(), bus(), bus(), bus()


def kalimba_note(m, vel):
    f = hz(m)
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.75)
    s += np.sin(2 * np.pi * f * 5.93 * tt) * np.exp(-tt / 0.05) * 0.25
    s += np.sin(2 * np.pi * f * 2.0 * tt) * np.exp(-tt / 0.22) * 0.08
    click = bp(rng.standard_normal(n), 2000, 6000) * np.exp(-tt / 0.0025) * 0.25
    return (s + click) * np.minimum(1, tt / 0.0015) * vel


def kalimba(notes, vel=0.6, pan=0.25):
    for t, d, m in notes:
        place(kal, kalimba_note(m, vel * rng.uniform(0.85, 1.05)), human(t, 6), 0.35, pan)


_piano_cache = {}


def piano_note(m, vel, dur):
    key = (m, round(vel, 1))
    if key not in _piano_cache:
        f = hz(m)
        n = int(4.0 * SR)
        tt = np.arange(n) / SR
        B = 0.00035
        t1 = float(np.clip(3.2 - (m - 48) * 0.05, 0.8, 4.0))
        s = np.zeros(n)
        for k in range(1, 13):
            fk = k * f * np.sqrt(1 + B * k * k)
            if fk > 9000:
                break
            amp = (1 / k) ** (1.5 - 0.7 * key[1])
            dec = t1 / (1 + 0.45 * (k - 1))
            for det in (-0.6, 0.6):
                s += np.sin(2 * np.pi * fk * 2 ** (det / 1200) * tt + rng.random() * 6.28) * amp * np.exp(-tt / dec) * 0.5
        s += lp(rng.standard_normal(n), 2500) * np.exp(-tt / 0.004) * 0.12 * key[1]
        s *= np.minimum(1, tt / 0.002)
        _piano_cache[key] = s / (np.max(np.abs(s)) + 1e-9)
    sig = _piano_cache[key][: int((dur + 0.3) * SR)]
    return fade_tail(sig, 250)


def piano_mel(notes, vel=0.55, legato=1.0):
    for t, d, m in notes:
        v = vel * rng.uniform(0.9, 1.05)
        place(piano, piano_note(m, v, d * legato), human(t, 7), 0.5 * v, (m - 64) / 60)


def piano_chord(t, ms, vel, dur):
    for i, m in enumerate(ms):
        place(piano, piano_note(m, vel, dur), t + i * 0.012, 0.4 * vel, (m - 64) / 60)


WHISTLE = []  # (t, dur, midi)


def whistle(notes):
    WHISTLE.extend(notes)


def render_whistle():
    out = np.zeros(N + PAD)
    if not WHISTLE:
        return out
    notes = sorted(WHISTLE)
    freq = np.zeros(N + PAD)
    amp = np.zeros(N + PAD)
    vib = np.zeros(N + PAD)
    prev_end, prev_f = -1.0, None
    for t, d, m in notes:
        f = hz(m)
        s, e = int(t * SR), int((t + d) * SR)
        n = e - s
        tt = np.arange(n) / SR
        legato = prev_f is not None and t - prev_end < 0.08
        if legato:
            glide = prev_f + (f - prev_f) * (1 - np.exp(-tt / 0.03))
            env = np.ones(n)
            if abs(f - prev_f) < 1:  # repeated note: re-articulate with a small dip
                env = 0.55 + 0.45 * np.minimum(1, tt / 0.04)
        else:
            glide = f * (1 - 0.03 * np.exp(-tt / 0.03))
            env = np.minimum(1, tt / 0.035)
        rel = int(min(n, 0.07 * SR))
        env[-rel:] *= np.linspace(1, 0.35, rel)
        freq[s:e] = glide
        amp[s:e] = np.maximum(amp[s:e], env)
        vib[s:e] = np.clip((tt - 0.18) / 0.25, 0, 1)
        tail = int(0.06 * SR)
        amp[e : e + tail] = np.maximum(amp[e : e + tail], 0.35 * np.linspace(1, 0, tail))
        freq[e : e + tail] = np.where(freq[e : e + tail] == 0, f, freq[e : e + tail])
        prev_end, prev_f = t + d, f
    t_all = np.arange(N + PAD) / SR
    f_mod = freq * (1 + 0.006 * vib * np.sin(2 * np.pi * 5.3 * t_all))
    ph = 2 * np.pi * np.cumsum(f_mod) / SR
    amp = lfilter([0.003], [1, -0.997], amp)  # smooth the envelope so joins never click
    tone = np.sin(ph) + 0.06 * np.sin(2 * ph)
    breath = bp(rng.standard_normal(N + PAD), 1200, 4500) * 0.05
    return (tone + breath) * amp


def choir_chord(t, ms, dur, vel):
    n = int((dur + 1.0) * SR)
    tt = np.arange(n) / SR
    acc = np.zeros(n)
    for m in ms:
        f = hz(m)
        for det in (-7, 0, 6):
            fm = f * 2 ** (det / 1200) * (1 + 0.003 * np.sin(2 * np.pi * 4.8 * tt + rng.random() * 6))
            acc += 2 * ((np.cumsum(fm) / SR + rng.random()) % 1.0) - 1
    voice = bp(acc, 250, 420) * 1.0 + bp(acc, 650, 1000) * 0.6 + bp(acc, 2200, 2800) * 0.12
    env = np.minimum(1, tt / 0.7) * np.clip((dur + 1.0 - tt) / 0.9, 0, 1)
    place(choir, voice * env / (len(ms) * 3), t, vel)


# ---------------------------------------------------------------- arrangement
E = 2  # capo for the phone act
chart = {  # bar -> [(beat, shape)], capo
    0: ([(0, "D")], 0), 1: ([(0, "A/C#")], 0),
    2: ([(0, "D")], 0), 3: ([(0, "Bm")], 0), 4: ([(0, "G")], 0), 5: ([(0, "A")], 0),
    6: ([(0, "Em")], 0), 7: ([(0, "G")], 0), 8: ([(0, "A")], 0),
    9: ([(0, "G")], 0), 10: ([(0, "A")], 0), 11: ([(0, "Bm")], 0), 12: ([(0, "D"), (2, "A")], 0),
    13: ([(0, "Bm")], 0), 14: ([(0, "G")], 0), 15: ([(0, "A")], 0),
    16: ([(0, "Gmaj7")], 0), 17: ([(0, "A6sus")], 0),
    18: ([(0, "D")], E), 19: ([(0, "Bm")], E), 20: ([(0, "G"), (2, "A")], E),
    21: ([(0, "G")], E), 22: ([(0, "A")], E), 23: ([(0, "Bm")], E),
    24: ([(0, "G")], E), 25: ([(0, "A")], E), 26: ([(0, "Bm"), (2, "D")], E),
    27: ([(0, "Em")], E), 28: ([(0, "G")], E), 29: ([(0, "A")], E),
    30: ([(0, "G")], E), 31: ([(0, "A")], E), 32: ([(0, "D")], E),
    33: ([(0, "Dadd9")], E),
    34: ([(0, "Bm")], E), 35: ([(0, "G")], E), 36: ([(0, "D")], E), 37: ([(0, "A")], E),
    38: ([(0, "G")], E), 39: ([(0, "A")], E), 40: ([(0, "D")], E),
    41: ([(0, "G")], E), 42: ([(0, "A")], E), 43: ([(0, "D")], E),
}


def root_of(bar):
    chords, capo = chart[min(bar, BARS - 1)]
    r = ROOTS[chords[0][1]] + capo
    return r - 12 if r > 45 else r


# Guitar
fingerpick(0, "D", 0, 1.0, 0)
fingerpick(1, "A/C#", 0, 1.0, 2)
strum(tb(1, 3.5), "A", 0, 0.55, "U", BEAT * 0.6)
verse1 = ["A", "C", "A", "B"]
for i, bar in enumerate(range(2, 6)):
    groove(bar, chart[bar][0], 0, 0.72 + 0.04 * i, verse1[i])
for i, bar in enumerate(range(6, 9)):
    groove(bar, chart[bar][0], 0, 0.75, ["B", "C", "push"][i])
for i, bar in enumerate(range(9, 13)):
    groove(bar, chart[bar][0], 0, 0.9, ["B", "C", "B", "push"][i])
for i, bar in enumerate(range(13, 16)):
    groove(bar, chart[bar][0], 0, 0.62, ["S", "A", "S"][i], drop=(3.5,) if bar == 15 else ())
strum(tb(15, 3), "A", 0, 0.6, "D", BEAT * 2.5)
slow_arp(16, "Gmaj7", 0, 1.25)
slow_arp(17, "A6sus", 0, 1.15)
strum(tb(17, 3.5), "A", E, 0.6, "U", BEAT * 0.55)  # pickup into the phone act (B chord)
for i, bar in enumerate(range(18, 21)):
    groove(bar, chart[bar][0], E, 0.8, ["A", "C", "B"][i])
for i, bar in enumerate(range(21, 24)):
    groove(bar, chart[bar][0], E, 0.62, "S")
    fingerpick(bar, chart[bar][0][0][1], E, 0.5, i + 1)
groove(24, chart[24][0], E, 0.95, "B")
groove(25, chart[25][0], E, 0.85, "16")
groove(26, chart[26][0], E, 0.95, "push")
for bar in range(27, 30):
    chug(bar, chart[bar][0][0][1], E, 0.65 + 0.08 * (bar - 27))
for i, bar in enumerate(range(30, 33)):
    groove(bar, chart[bar][0], E, 1.0, ["B", "C", "push"][i])
strum(tb(33, 0), "Dadd9", E, 0.65, "D", BAR * 1.1)
for i, bar in enumerate(range(34, 38)):
    fingerpick(bar, chart[bar][0][0][1], E, 0.95, [0, 2, 1, 3][i], ring=2.0)
strum(tb(37, 3.5), "A", E, 0.5, "U", BEAT * 0.55)
for i, bar in enumerate(range(38, 40)):
    groove(bar, chart[bar][0], E, 1.0, ["C", "push"][i])
strum(tb(40, 0), "D", E, 1.0, "D", BAR * 1.6)
fingerpick(41, "G", E, 0.55, 2, ring=2.0)
fingerpick(42, "A", E, 0.5, 1, ring=2.0)
fingerpick(43, "D", E, 0.5, 0, ring=3.0)

# Bass
for bar in range(1, BARS):
    nxt = root_of(bar + 1)
    r = root_of(bar)
    if bar == 1:
        bass_note(r, tb(1, 3), BEAT, 0.5)
    elif bar in range(2, 9) or bar in range(18, 21):
        bass_bar(bar, r, nxt, 0.85, "verse")
    elif bar in range(9, 13) or bar in range(24, 27) or bar in range(30, 33) or bar in (38, 39):
        bass_bar(bar, r, nxt, 1.0, "chorus")
    elif bar in range(13, 16) or bar in range(21, 24):
        bass_bar(bar, r, nxt, 0.75, "verse" if bar != 15 else "soft")
    elif bar in (16, 17):
        bass_bar(bar, r, nxt, 0.5, "long")
    elif bar in range(27, 30):
        bass_bar(bar, r, nxt, 0.8, "eighths")
    elif bar in range(34, 38):
        bass_bar(bar, r, nxt, 0.42, "soft")
    elif bar == 40:
        bass_note(r, tb(40, 0), BAR * 1.4, 1.0)
    elif bar in (41, 42):
        bass_bar(bar, r, nxt, 0.38, "soft")
    elif bar == 43:
        bass_note(r, tb(43, 0), BAR * 1.2, 0.5)

# Percussion
for k in range(8):
    shaker(tb(1, 2 + k * 0.25), 0.35 + k * 0.05)
fills = {5: "short", 8: "roll", 12: "roll", 20: "short", 23: "roll", 26: "roll", 29: "build", 39: "roll"}
for bar in range(2, 16):
    style = "chorus" if 9 <= bar <= 12 else ("light" if bar >= 13 else "verse")
    drums(bar, style, 0.9 if bar < 9 else 1.0, fills.get(bar))
for k, b in enumerate((3, 3.25, 3.5, 3.75)):
    cajon_slap(tb(17, b), 0.35 + k * 0.12)
cajon_bass(tb(17, 3.5), 0.5)
for bar in range(18, 33):
    style = "chorus" if bar >= 24 and bar not in (27, 28) else ("light" if 21 <= bar <= 23 else "verse")
    drums(bar, style, 1.0, fills.get(bar))
for bar in range(34, 38):
    for k in range(8):
        shaker(tb(bar, k * 0.5), 0.32 if k % 2 else 0.2)
    cajon_bass(tb(bar, 0), 0.28)
for k, b in enumerate((3, 3.5, 3.75)):
    cajon_slap(tb(37, b), 0.3 + k * 0.12)
for bar in (38, 39):
    drums(bar, "chorus", 1.05, fills.get(bar))
cajon_bass(tb(40, 0), 1.0)
cajon_slap(tb(40, 0), 0.6)
tamb(tb(40, 0), 1.0)
for bar in range(6, 9):
    claps_bar(bar, 0.8)
for bar in list(range(24, 27)) + list(range(30, 33)) + [38, 39]:
    claps_bar(bar, 0.9)
for bar in range(9, 13):
    tamb_bar(bar, 0.8, eighths=bar in (11, 12))
for bar in list(range(30, 33)) + [38, 39]:
    tamb_bar(bar, 0.9, eighths=True)

# Whistle (lead)
W = {
    2: "r:1 F#5:.5 A5:.5 D6:1 C#6:.5 B5:.5",
    3: "A5:1.5 F#5:.5 D5:1 r:1",
    4: "r:.5 G5:.5 B5:.5 D6:.5 E6:1 D6:.5 B5:.5",
    5: "C#6:1.5 A5:.5 E5:1 r:1",
    9: "D6:.5 D6:.5 E6:.5 D6:.5 B5:1 G5:1",
    10: "A5:.5 B5:.5 C#6:.5 E6:.5 E6:1.5 r:.5",
    11: "F#6:.5 E6:.5 D6:.5 B5:.5 D6:1 B5:.5 A5:.5",
    12: "A5:1 F#5:.5 E5:.5 D5:1.5 r:.5",
    18: "G#5:.5 B5:.5 E6:1 D#6:.5 E6:.5 F#6:1",
    19: "E6:1.5 C#6:.5 B5:1 G#5:1",
    20: "A5:.5 B5:.5 C#6:.5 D#6:.5 F#6:1 D#6:1",
    24: "E6:.5 E6:.5 F#6:.5 E6:.5 C#6:1 A5:1",
    25: "B5:.5 C#6:.5 D#6:.5 F#6:.5 F#6:1.5 r:.5",
    26: "G#6:.5 F#6:.5 E6:.5 C#6:.5 E6:1 B5:1",
    30: "E6:.5 E6:.5 F#6:.5 E6:.5 C#6:.5 E6:.5 B5:1",
    31: "D#6:.5 E6:.5 F#6:.5 G#6:.5 F#6:1.5 D#6:.5",
    32: "E6:1.5 B5:.5 G#5:1 E5:1",
    38: "E6:.5 F#6:.5 G#6:.5 A6:.5 G#6:1 E6:1",
    39: "F#6:.5 D#6:.5 B5:.5 D#6:.5 F#6:2",
    40: "E6:3",
}
for bar, spec in W.items():
    whistle(mel(bar, spec))

# Kalimba
kalimba(mel(0, "A5:1 F#5:.5 A5:.5 D6:1.5 r:.5"), 0.55)
kalimba(mel(1, "C#6:1 B5:.5 A5:.5 E5:2"), 0.55)
kalimba(mel(6, "E5:.5 G5:.5 B5:.5 E6:.5 D6:.5 B5:.5 G5:1"), 0.8)
kalimba(mel(7, "D5:.5 G5:.5 B5:.5 D6:1 B5:.5 A5:1"), 0.8)
kalimba(mel(8, "C#6:.5 B5:.5 A5:.5 E5:.5 A5:1 r:1"), 0.8)
kalimba(mel(9, "G5:.5 B5:.5 D6:.5 G6:.5", 2), 0.45, -0.35)
kalimba(mel(10, "A5:.5 C#6:.5 E6:.5 A6:.5", 2), 0.45, -0.35)
kalimba(mel(11, "F#5:.5 B5:.5 D6:.5 F#6:.5", 2), 0.45, -0.35)
kalimba(mel(12, "D6:.5 A5:.5 F#5:.5 E5:.5", 2), 0.45, -0.35)
kalimba(mel(16, "B5:1.5 A5:.5 F#5:2"), 0.5)
kalimba(mel(17, "A5:1 E5:1 r:2"), 0.45)
kalimba(mel(21, "A5:.5 C#6:.5 E6:.5 C#6:.5"), 0.75)
kalimba(mel(22, "F#5:.5 B5:.5 D#6:.5 F#6:.5"), 0.75)
kalimba(mel(23, "E6:.5 C#6:.5 G#5:.5 E5:.5"), 0.75)
kalimba(mel(30, "B6:.5 G#6:.5 E6:.5", 2.5), 0.35, -0.4)
kalimba(mel(33, "E6:.25 D#6:.25 B5:.25 G#5:.25 F#5:.25 E5:.25 B4:.5"), 0.6)
kalimba(mel(36, "B5:.5 G#5:.5 E5:1", 2), 0.35)
kalimba(mel(40, "B5:.25 E6:.25 G#6:.25 B6:.25", 1), 0.5)
kalimba(mel(41, "B5:1 G#5:.5 B5:.5 E6:1.5 r:.5"), 0.5)
kalimba(mel(42, "D#6:1 C#6:.5 B5:.5 F#5:2"), 0.5)
kalimba(mel(43, "E6:3"), 0.45)

# Piano
piano_mel(mel(13, "B4:.5 D5:.5 F#5:1 E5:.5 D5:.5 C#5:1"), 0.6)
piano_mel(mel(14, "B4:1 D5:.5 G5:1.5 F#5:1"), 0.6)
piano_mel(mel(15, "E5:1 C#5:1 A4:1.5"), 0.55)
piano_chord(tb(16, 0), [midi("G3"), midi("D4"), midi("F#4")], 0.4, BEAT * 3.5)
piano_chord(tb(16, 2.5), [midi("B4")], 0.35, BEAT * 1.5)
piano_chord(tb(17, 0), [midi("A3"), midi("E4"), midi("G4")], 0.4, BEAT * 3)
piano_mel(mel(21, "B4:1 A4:1", 2), 0.5)
piano_mel(mel(22, "E5:1 D#5:1", 2), 0.5)
piano_mel(mel(23, "G#4:1 B4:1", 2), 0.5)
piano_mel(mel(27, "A3:.5 C#4:.5 F#4:1 E4:.5 C#4:.5 A3:1"), 0.55)
piano_mel(mel(28, "C#4:.5 E4:.5 A4:1 G#4:.5 E4:.5 C#4:1"), 0.55)
piano_mel(mel(29, "D#4:1 F#4:1 B4:1 A4:.5 F#4:.5"), 0.6)
piano_mel(mel(34, "G#5:1.5 E5:.5 C#5:2"), 0.4)
piano_mel(mel(35, "C#5:.5 E5:.5 A5:1 G#5:1 E5:1"), 0.4)
piano_mel(mel(36, "B4:1 E5:1 G#5:1.5 F#5:.5"), 0.4)
piano_mel(mel(37, "F#5:2 D#5:1 B4:.5 D#5:.5"), 0.4)
for bar, ch in ((34, ["C#3", "G#3"]), (35, ["A2", "E3"]), (36, ["E3", "B3"]), (37, ["B2", "F#3"])):
    piano_chord(tb(bar, 0), [midi(n) for n in ch], 0.3, BAR * 0.95)
piano_chord(tb(40, 0), [midi(n) for n in ["E3", "B3", "E4", "G#4"]], 0.5, BAR * 1.4)
piano_chord(tb(43, 0), [midi(n) for n in ["E3", "B3", "G#4"]], 0.3, BAR * 1.2)

# Choir pad on the big choruses
for bar, ch in ((30, ["A3", "C#4", "E4"]), (31, ["B3", "D#4", "F#4"]), (32, ["G#3", "B3", "E4"]), (38, ["A3", "C#4", "E4"]), (39, ["B3", "D#4", "F#4"]), (40, ["G#3", "B3", "E4"])):
    choir_chord(tb(bar, 0), [midi(n) for n in ch], BAR * (1.3 if bar == 40 else 1.0), 0.9)

# Dive: a one-beat reverse swell into the voice section
swell_src = np.zeros(int(1.2 * SR))
for m in [52, 59, 64, 66]:  # E3 B3 E4 F#4 = Eadd9
    k = ks(m, 0.6)[: len(swell_src)]
    swell_src[: len(k)] += k
swell = swell_src[::-1][-int(BEAT * SR) :] * np.linspace(0, 1, int(BEAT * SR)) ** 2
place(kal, swell * 0.25, tb(33, 3), 1.0)

print(f"arranged in {time.time() - T0:.1f}s", flush=True)

# ---------------------------------------------------------------- mix
whis = render_whistle()
whistle_bus[:, 0] = whis * 0.95
whistle_bus[:, 1] = whis * 1.0

body_t = np.arange(int(0.12 * SR)) / SR
body_ir = np.zeros(len(body_t))
for f, d, a in ((105, 0.05, 1.0), (205, 0.04, 0.7), (275, 0.03, 0.5), (410, 0.02, 0.35), (580, 0.015, 0.2)):
    body_ir += np.sin(2 * np.pi * f * body_t) * np.exp(-body_t / d) * a
body_ir = body_ir / np.sum(np.abs(body_ir)) * 6
body_ir[0] += 1.0


def body(x):
    wet = np.stack([fftconvolve(x[:, c], body_ir)[: len(x)] for c in range(2)], axis=1)
    return x * 0.55 + wet * 0.45


guitars = hp(lp(body(gtr + gtr_pick * 0.42), 9000), 80)
bass_b = hp(lp(bass, 1500), 35)
perc_b = hp(perc, 40)
kal_b = hp(kal, 200)
piano_b = hp(piano, 60)
choir_b = hp(choir, 150)
whistle_b = hp(lp(whistle_bus, 7000), 400)

GAINS = {"gtr": 2.6, "bass": 0.6, "perc": 0.85, "kal": 0.45, "piano": 0.5, "choir": 0.45, "whistle": 0.12}
def _rms(x, b0, b1):
    seg = x[int(tb(b0) * SR) : int(tb(b1) * SR)]
    return 20 * np.log10(np.sqrt(np.mean(seg**2)) + 1e-12)


for name, x in (("guitars", guitars * GAINS["gtr"]), ("bass", bass_b * GAINS["bass"]), ("perc", perc_b * GAINS["perc"]), ("kalimba", kal_b * GAINS["kal"]), ("piano", piano_b * GAINS["piano"]), ("whistle", whistle_b * GAINS["whistle"]), ("choir", choir_b * GAINS["choir"])):
    print(f"  {name:8s} chorus1 {_rms(x, 9, 13):6.1f}  chorus2 {_rms(x, 30, 33):6.1f}  verse2 {_rms(x, 6, 9):6.1f}  breather {_rms(x, 16, 18):6.1f}  voice {_rms(x, 34, 38):6.1f}")

dry = (
    guitars * GAINS["gtr"]
    + bass_b * GAINS["bass"]
    + perc_b * GAINS["perc"]
    + kal_b * GAINS["kal"]
    + piano_b * GAINS["piano"]
    + choir_b * GAINS["choir"]
    + whistle_b * GAINS["whistle"]
)
send = (
    guitars * 0.14
    + perc_b * 0.08
    + kal_b * GAINS["kal"] * 0.45
    + piano_b * GAINS["piano"] * 0.35
    + choir_b * GAINS["choir"] * 0.6
    + whistle_b * GAINS["whistle"] * 0.4
)

ir_n = int(2.2 * SR)
ir_t = np.arange(ir_n) / SR
ir = rng.standard_normal((ir_n, 2)) * np.exp(-ir_t / 0.45)[:, None]
ir[: int(0.018 * SR)] = 0
for d, a in ((0.021, 0.5), (0.033, 0.35), (0.047, 0.3), (0.061, 0.2)):
    ir[int(d * SR), 0] += a
    ir[int((d + 0.004) * SR), 1] += a
ir = lp(ir, 5500)
ir /= np.sqrt(np.sum(ir**2, axis=0, keepdims=True))
wet = np.stack([fftconvolve(send[:, c], ir[:, c])[: len(send)] for c in range(2)], axis=1)
mix = dry + wet * 0.6
mix = hp(mix, 30)[:N]
mix -= np.mean(mix, axis=0)

# Level, then a soft-knee limiter that keeps peaks under -1 dBFS.
full = np.concatenate([mix[int(tb(b) * SR) : int(tb(b + 1) * SR)] for b in (9, 10, 11, 12, 30, 31)])
target = 10 ** (-15.5 / 20)
mix *= target / np.sqrt(np.mean(full**2))
ceil = 10 ** (-1.2 / 20)
knee = 0.6 * ceil
mag = np.abs(mix)
over = np.maximum(mag - knee, 0)
limited = knee + (ceil - knee) * np.tanh(over / (ceil - knee))
mix = np.where(mag > knee, np.sign(mix) * limited, mix)

fade = int(1.5 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
mix[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]


def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    pcm = (np.clip(data, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(path, f"{len(data) / SR:.2f}s")


root_dir = sys.argv[1]
write(os.path.join(root_dir, "music/sydia-showcase.wav"), mix)

# ---------------------------------------------------------------- UI sound effects
notify = np.zeros(int(0.9 * SR))
for off, m in ((0.0, midi("E6")), (0.09, midi("B6"))):
    s = kalimba_note(m, 1.0)[: len(notify) - int(off * SR)]
    notify[int(off * SR) : int(off * SR) + len(s)] += s
notify = np.stack([notify, notify], axis=1)
small_ir = ir[: int(0.6 * SR)] * np.exp(-np.arange(int(0.6 * SR)) / SR / 0.15)[:, None]
notify = notify + np.stack([fftconvolve(notify[:, c], small_ir[:, c])[: len(notify)] for c in range(2)], axis=1) * 0.15
write(os.path.join(root_dir, "sfx/notify.wav"), notify / np.max(np.abs(notify)) * 0.7)

n = int(0.12 * SR)
t = np.arange(n) / SR
pop = np.sin(2 * np.pi * np.cumsum(480 + 520 * np.exp(-t / 0.008)) / SR) * np.exp(-t / 0.025)
pop += bp(rng.standard_normal(n), 1500, 4000) * np.exp(-t / 0.002) * 0.25
pop = np.stack([pop, pop], axis=1)
write(os.path.join(root_dir, "sfx/pop.wav"), pop / np.max(np.abs(pop)) * 0.6)

print(f"done in {time.time() - T0:.1f}s")
