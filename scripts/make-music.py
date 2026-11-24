"""Synthesize the original promo track: 150 BPM, beat-synced to the video.

At 30 fps one beat = 12 frames, one bar = 48 frames (1.6 s).
Arrangement (bars):
  0-1   hook: kick + chord stab on each beat, snare roll + riser into the drop
  2-13  drop: four-on-the-floor, rolling bass, pumping supersaw, claps, hats
  6-13  + pluck arpeggio lead
  14-15 breakdown build: snare roll + riser
  16-17 second drop
  18    final hit, rings out to 20 bars (32 s)

Run: python3 -I scripts/make-music.py public/music/sydia-anthem.wav
"""

import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
BPM = 150
BEAT = 60 / BPM
BAR = BEAT * 4
TOTAL = 20 * BAR
N = int(TOTAL * SR) + SR  # 1 s tail headroom
rng = np.random.default_rng(7)


def buf():
    return np.zeros((N, 2))


def t_of(start_beat):
    return int(round(start_beat * BEAT * SR))


def add(bus, sig, start_beat, gain=1.0, pan=0.0):
    i = t_of(start_beat)
    if sig.ndim == 1:
        left = sig * np.sqrt(0.5 * (1 - pan))
        right = sig * np.sqrt(0.5 * (1 + pan))
        sig = np.stack([left, right], axis=1) * np.sqrt(2)
    end = min(N, i + len(sig))
    bus[i:end] += sig[: end - i] * gain


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x, axis=0)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x, axis=0)


def saw(freq, dur, phase=0.0):
    t = np.arange(int(dur * SR)) / SR
    return 2 * ((t * freq + phase) % 1.0) - 1


def note(name):
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    pitch, octave = name[:-1], int(name[-1])
    midi = 12 * (octave + 1) + names[pitch]
    return 440 * 2 ** ((midi - 69) / 12)


# ---------- instruments ----------
def kick(dur=0.38, punch=1.0):
    t = np.arange(int(dur * SR)) / SR
    f = 46 + 170 * np.exp(-t / 0.032)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.16)
    click = rng.standard_normal(len(t)) * np.exp(-t / 0.002) * 0.5
    return np.tanh((body + click) * 2.2 * punch) * 0.95


def clap(dur=0.32):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    env = np.zeros(n)
    for off in (0.0, 0.011, 0.022):
        m = t >= off
        env[m] += np.exp(-(t[m] - off) / (0.012 if off < 0.02 else 0.11))
    return bp(noise * env, 900, 5200) * 0.9


def snare(dur=0.18):
    t = np.arange(int(dur * SR)) / SR
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    noise = hp(rng.standard_normal(len(t)), 1500) * np.exp(-t / 0.06)
    return (tone * 0.5 + noise * 0.8) * 0.8


def hat(open_=False):
    dur = 0.22 if open_ else 0.05
    t = np.arange(int(dur * SR)) / SR
    noise = hp(rng.standard_normal(len(t)), 7500, order=4)
    return noise * np.exp(-t / (0.07 if open_ else 0.012)) * 0.5


def crash(dur=2.6):
    t = np.arange(int(dur * SR)) / SR
    noise = hp(rng.standard_normal(len(t)), 4000, order=2)
    return noise * np.exp(-t / 0.7) * 0.45


def supersaw(freqs, dur, voices=7, detune=0.18, cutoff=5200):
    """Stereo supersaw chord; separate detune sets per side for width."""
    n = int(dur * SR)
    out = np.zeros((n, 2))
    for ch in range(2):
        acc = np.zeros(n)
        for f in freqs:
            for v in range(voices):
                spread = (v - (voices - 1) / 2) / ((voices - 1) / 2)
                cents = spread * detune * 100 * (1.0 if ch == 0 else 0.93)
                acc += saw(f * 2 ** (cents / 1200), dur, phase=rng.random())[:n]
        out[:, ch] = acc / (voices * len(freqs))
    return lp(out, cutoff, order=2)


def pluck(freq, dur=0.22):
    t = np.arange(int(dur * SR)) / SR
    s = saw(freq, dur) * 0.6 + saw(freq * 1.005, dur) * 0.4
    s = lp(s, 3200)
    return s * np.exp(-t / 0.075)


def bass_note(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    s = saw(freq, dur) * 0.7 + np.sin(2 * np.pi * freq * t) * 0.6
    s = lp(s, 700, order=2)
    env = np.minimum(1, t / 0.004) * np.exp(-t / 0.09)
    return np.tanh(s * env * 1.6)


def riser(dur_beats, start_f=300, end_f=9000):
    dur = dur_beats * BEAT
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # sweep a band through the noise in chunks
    out = np.zeros(n)
    chunk = 1024
    for i in range(0, n, chunk):
        p = i / n
        fc = start_f * (end_f / start_f) ** p
        seg = noise[i : i + chunk]
        out[i : i + chunk] = bp(seg, fc * 0.7, min(fc * 1.4, SR / 2 - 100))
    f = 200 * (8 ** (t / dur))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    env = (t / dur) ** 2
    return (out * 1.4 + tone) * env * 0.7


def reverb(x, seconds=1.8, mix=0.25):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)], axis=1) * np.exp(-t / (seconds / 5))[:, None]
    ir[: int(0.012 * SR)] = 0
    ir = lp(ir, 6000)
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    wet *= np.max(np.abs(x)) / (np.max(np.abs(wet)) + 1e-9)
    return x + wet * mix


# ---------- arrangement ----------
CHORDS = [
    (["A3", "C4", "E4", "A4"], "A1"),
    (["F3", "A3", "C4", "F4"], "F1"),
    (["G3", "C4", "E4", "C5"], "C2"),
    (["G3", "B3", "D4", "G4"], "G1"),
]

drums = buf()
music = buf()
fx = buf()

DROP_BARS = list(range(2, 14)) + list(range(16, 18))


def is_drop(bar):
    return bar in DROP_BARS


# Hook: bars 0-1, a kick + stab on beats 0..5
for b in range(6):
    add(drums, kick(punch=0.9), b, 0.95)
    add(music, hp(supersaw([note(n) for n in CHORDS[0][0]], 0.2, cutoff=7000), 200) * np.exp(-np.arange(int(0.2 * SR)) / SR / 0.06)[:, None], b, 1.6)
    add(drums, hat(), b + 0.5, 0.5)
# beats 6-7: snare roll (16ths accelerating) + riser
for k in range(8):
    add(drums, snare(), 6 + k * 0.25, 0.35 + k * 0.06)
add(fx, riser(4, 400, 10000), 4, 0.8)

# Drops
for bar in range(20):
    base = bar * 4
    if is_drop(bar):
        chord, root = CHORDS[(bar - 2) % 4] if bar < 16 else CHORDS[(bar - 16) % 4]
        for beat in range(4):
            add(drums, kick(), base + beat, 1.0)
            add(drums, hat(open_=True), base + beat + 0.5, 0.42)
            for s in (0.25, 0.75):
                add(drums, hat(), base + beat + s, 0.28)
        add(drums, clap(), base + 1, 0.75)
        add(drums, clap(), base + 3, 0.75)
        # rolling bass: 16ths except on the kick
        for beat in range(4):
            for s in (0.25, 0.5, 0.75):
                add(music, bass_note(note(root), BEAT / 4), base + beat + s, 0.6)
        # pumping supersaw
        pad = supersaw([note(n) for n in chord], BAR, cutoff=6500)
        t = np.arange(len(pad)) / SR
        pump = np.clip(((t % BEAT) / 0.16), 0, 1) ** 1.6 * 0.85 + 0.15
        add(music, pad * pump[:, None], base, 1.05)
        # pluck arp lead from bar 6 and the second drop
        if bar >= 6:
            tones = [note(n) * 2 for n in chord[:3]]
            pattern = [0, 1, 2, 1, 2, 0, 1, 2, 0, 2, 1, 2, 0, 1, 2, 1]
            for i, p in enumerate(pattern):
                octave = 2 if i in (3, 7, 11, 15) else 1
                add(music, pluck(tones[p] * octave), base + i * 0.25, 0.42, pan=(-0.35 if i % 2 else 0.35))
        if bar in (2, 6, 10, 16):
            add(fx, crash(), base, 0.8)

# Build bars 14-15: pad swells, snare roll speeds up (quarters, 8ths, 16ths)
add(fx, riser(8, 250, 12000), 14 * 4, 1.0)
roll = [14 * 4 + k for k in range(4)] + [15 * 4 + k * 0.5 for k in range(4)] + [15 * 4 + 2 + k * 0.25 for k in range(8)]
for k, pos in enumerate(roll):
    add(drums, snare(), pos, 0.3 + k * 0.035)
for i, chord_idx in enumerate((2, 3)):
    pad = supersaw([note(n) for n in CHORDS[chord_idx][0]], BAR, cutoff=1500 + i * 2500)
    add(music, pad * np.linspace(0.35 + i * 0.3, 0.65 + i * 0.35, len(pad))[:, None], (14 + i) * 4, 0.8)
    for beat in range(4):
        add(music, bass_note(note(CHORDS[chord_idx][1]), BEAT / 2), (14 + i) * 4 + beat + 0.5, 0.35)

# Final hit bar 18
final = 18 * 4
add(drums, kick(dur=0.6, punch=1.2), final, 1.1)
add(drums, clap(), final, 0.8)
add(fx, crash(4.0), final, 1.0)
chord_final = supersaw([note(n) for n in ["A2", "A3", "C4", "E4", "A4", "E5"]], 3.6, cutoff=5000)
add(music, chord_final * np.exp(-np.arange(len(chord_final)) / SR / 1.0)[:, None], final, 1.3)
add(music, bass_note(note("A1"), 1.2) * np.exp(-np.arange(int(1.2 * SR)) / SR / 0.5), final, 0.9)

# ---------- mix ----------
music = reverb(music, 1.6, 0.22)
fx = reverb(fx, 2.2, 0.3)
mix = drums * 0.5 + music * 1.0 + fx * 0.45
mix = hp(mix, 28)
mix = np.tanh(mix * 1.25) / np.tanh(1.25)  # loud: glue + soft clip
mix = mix[: int(TOTAL * SR)]
fade = int(0.3 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix *= 0.8 / np.max(np.abs(mix))

out = sys.argv[1]
pcm = (mix * 32767).astype("<i2")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(out, f"{len(mix) / SR:.2f}s")
