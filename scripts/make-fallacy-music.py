"""Synthesize the two acoustic tracks for "Cuma 10 Menit" (src/fallacy).

Writes both files in one run:

  public/music/fallacy-yakin.wav       120 BPM, D major, exactly 29.5 s (59 beats, 1 beat = 0.5 s = 15 frames)
    beats  0-12  S1 hook: light fingerpicking and shaker under the voice-over
    beats 12-28  S1b chat: the picking carries on while she reads the boss's chat; a glock "ding" as she
                 sends "10 menit"
    beats 28-33  S2a menit ke-2: cheerful strums, claps on 2 & 4 ("Oke, ayo kita beresin dengan cepat")
    beats 33-39  S2a "Eh… berantakan": the strums stall on one ringing chord, a clock tick
    beats 39-51  S2b menit ke-25: the band drops out, sparse picking over Bm-Gmaj7-Em7, a clock tick ("musik mulai menipis")
    beats 51-59  S2c menit ke-47: the music drops out under her panicked line; only the clock ticks, in 8ths;
                 stops dead at 29.500 s
                 (S3's "Udah, Har?" lands in silence)

  public/music/fallacy-penjelasan.wav  100 BPM, G major, exactly 67.8 s (113 beats, 1 beat = 0.6 s = 18 frames)
    beats  0-59  S4-S6c explainer bed: soft picking G-Em-C-D, light shaker, quiet enough for the voice-over;
                 a two-note glock on each new scene
    beats 59-100 S7 tips: brighter, a strummed pattern and soft kick (the "solution" lift)
    beats 100-113 S8 penutup: "musik naik, santai": fuller strums, bass, glock melody; tonic rings and fades

Scene starts are fixed in src/fallacy/timeline.ts; keep the beat numbers above in sync with it.
The instruments come from scripts/make-sibuk-music.py (Karplus-Strong guitar and bass, glockenspiel,
shaped-noise percussion), loaded as a module.

Run: python3 scripts/make-fallacy-music.py   (plain python3, not -I: NumPy/SciPy live in the user site)
"""

import importlib.util
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("sibuk_music", os.path.join(HERE, "make-sibuk-music.py"))
m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(m)

SR, midi, hz, place, human = m.SR, m.midi, m.hz, m.place, m.human
m.rng = np.random.default_rng(1010)

# scene starts in beats (keep in sync with src/fallacy/timeline.ts)
A_CHAT, A_S2A, A_S2B, A_S2C, A_END = 12, 28, 39, 51, 59
A_EH = A_S2A + 5  # S2a: "Eh… catatannya kok berantakan?": the strums stall here
A_REPLY = A_CHAT + 11.5  # S1b: "10 menit 👌" is sent
B_S5, B_S6A, B_S6B, B_S6C, B_S7A, B_S7B, B_S7C, B_S8, B_END = 12, 23, 33, 47, 59, 75, 87, 100, 113


# ================================================================ TRACK 1: fallacy-yakin (120 BPM, D major)
def make_yakin():
    tr = m.Track(120, A_END * 0.5)
    V = {
        "D": ["D3", "A3", "D4", "F#4", "A4"],
        "G": ["G2", "B2", "D3", "G3", "B3", "G4"],
        "A": ["A2", "E3", "A3", "C#4", "E4"],
        "Bm": ["B2", "F#3", "B3", "D4", "F#4"],
        "Bm7": ["B2", "F#3", "A3", "D4", "F#4"],
        "Em7": ["E2", "B2", "D3", "G3", "D4"],
        "Gmaj7": ["G2", "D3", "F#3", "B3", "D4"],
    }
    ROOT = {"D": "D2", "G": "G1", "A": "A1", "Bm": "B1", "Bm7": "B1", "Em7": "E2", "Gmaj7": "G1"}
    B = tr.buses()

    # S1 + S1b (beats 0-28): light picking under the hook and while she reads the chat
    for beat in range(0, A_S2A, 4):
        name = ["D", "Bm7", "G", "A"][(beat // 4) % 4]
        m.picking(tr, B, beat, V[name], beats=min(4, A_S2A - beat), gain=0.62, skip=(5,))
        place(B["bass"], m.bass_note(midi(ROOT[name]) + 12, 1.8, 1.4), human(tr.t(beat), 3), 0.3)
    for k in range(A_S2A * 2):
        place(B["perc"], m.shaker(1.0 if k % 2 == 0 else 0.5), human(tr.t(k / 2), 2), 0.3, pan=0.35)
    place(B["bell"], m.glock(midi("A6"), 1.2), tr.t(A_REPLY), 0.09, 0.3)  # "10 menit 👌" sent
    place(B["bell"], m.glock(midi("D7"), 1.2), tr.t(A_REPLY + 0.5), 0.07, 0.3)

    # S2a (beats 28-33): cheerful strums, claps, she's sure ("Oke, ayo kita beresin dengan cepat")
    ACC = [1.0, 0.45, 0.65, 0.75, 0.85, 0.45, 0.65, 0.75]
    CH = [(A_S2A, A_S2A + 2, "D"), (A_S2A + 2, A_S2A + 4, "G"), (A_S2A + 4, A_EH, "A")]
    for a, b, name in CH:
        for k in range((b - a) * 2):
            beat = a + k / 2
            pos = int(round((beat % 4) * 2))
            m.strum(tr, B, beat, V[name], down=(pos % 2 == 0), gain=0.62 * ACC[pos], bright=0.8)
        place(B["bass"], m.bass_note(midi(ROOT[name]) + 12, 0.9, 0.7), human(tr.t(a), 3), 0.45)
    for beat in range(A_S2A, A_EH):
        if beat % 2 == 0:
            place(B["perc"], m.clap(), human(tr.t(beat), 3), 0.34, pan=-0.12)
        else:
            place(B["perc"], m.kick(), human(tr.t(beat), 2), 0.36)
    for k in range((A_EH - A_S2A) * 4):
        place(B["perc"], m.shaker([1.0, 0.45, 0.7, 0.45][k % 4]), human(tr.t(A_S2A + k / 4), 2), 0.45, pan=0.35)
    m.melody(tr, B, A_S2A, "F#6:.5 A6:.5 B6:.5 A6:.5 F#6:1", 0.1)

    # S2a "Eh…" (beats 33-39): the strumming stalls on one let-ring Em7, a clock tick, a two-note "huh?"
    m.strum(tr, B, A_EH, V["Em7"], True, 0.7, spread=0.03, bright=0.7, ring=3.0)
    m.picking(tr, B, A_EH + 2, V["Em7"], 3, gain=0.45, skip=(1, 3, 5))
    for beat in range(A_EH, A_S2B):
        place(B["perc"], m.tick(beat % 2 == 0), tr.t(beat), 0.16, pan=0.25)
    m.melody(tr, B, A_EH + 1, "G5:.5 A5:1", 0.05)

    # S2b (beats 39-51): sparse picking over Bm-Gmaj7, the clock keeps ticking ("musik mulai menipis")
    for i, bar in enumerate(range(A_S2B, A_S2C, 4)):
        name, root = [("Bm", "B2"), ("Gmaj7", "G2"), ("Em7", "E2")][i % 3]
        m.picking(tr, B, bar, V[name], min(4, A_S2C - bar), gain=0.6 - 0.04 * i, skip=(3, 5, 7))
        place(B["bass"], m.bass_note(midi(root), 2.0, 1.6), tr.t(bar), 0.18)
    for beat in range(A_S2B, A_S2C):
        place(B["perc"], m.tick(beat % 2 == 0), tr.t(beat), 0.18, pan=0.25)
    m.melody(tr, B, A_S2B + 2, "B5:.5 C#6:1", 0.05)

    # S2c (beats 51-59): no music under her panic ("Ini maksudnya apa sih?! Konfirmasi ke siapa ya…?"), only the clock,
    # ticking twice as fast; it stops dead with everything else at beat 59
    for k in range((A_END - A_S2C) * 2):
        place(B["perc"], m.tick(k % 2 == 0), tr.t(A_S2C + k / 2), 0.2, pan=0.25)

    mix = m.compress(m.render(B))[: tr.end]  # hard cut at exactly 29.500 s
    k = int(0.005 * SR)
    mix[-k:] *= np.linspace(1, 0, k)[:, None]
    return mix


# ================================================================ TRACK 2: fallacy-penjelasan (100 BPM, G major)
def make_penjelasan():
    tr = m.Track(100, B_END * 0.6, swing=0.55)
    V = {
        "G": ["G2", "B2", "D3", "G3", "B3", "G4"],
        "Em7": ["E2", "B2", "D3", "G3", "D4"],
        "Cadd9": ["C3", "G3", "D4", "E4", "G4"],
        "D": ["D3", "A3", "D4", "F#4"],
        "Dsus4": ["D3", "A3", "D4", "G4"],
        "Am7": ["A2", "E3", "G3", "C4", "E4"],
        "Gring": ["G2", "B2", "D3", "G3", "B3", "D4", "G4"],
    }
    ROOT = {"G": "G1", "Em7": "E2", "Cadd9": "C2", "D": "D2", "Dsus4": "D2", "Am7": "A1"}
    LOOP = ["G", "Em7", "Cadd9", "D"]
    B = tr.buses()

    def chord_at(beat):
        return LOOP[int(beat // 4) % 4]

    # S4-S6c (beats 0-58): explainer bed, picking only, quiet
    for bar0 in range(0, B_S7A, 4):
        name = chord_at(bar0)
        m.picking(tr, B, bar0, V[name], beats=min(4, B_S7A - bar0), gain=0.55, skip=(3, 7))
        place(B["bass"], m.bass_note(midi(ROOT[name]) + 12, 2.2, 1.8), human(tr.t(bar0), 3), 0.22)
    for k in range(B_S7A * 2):
        beat = k / 2
        place(B["perc"], m.shaker(1.0 if k % 2 == 0 else 0.5), human(tr.t(beat), 2), 0.18, pan=0.35)
    # a two-note glint on each new scene, so each cut has a soft downbeat
    for beat, notes in [(0, "D6:.5 G6:1"), (B_S5, "B5:.5 D6:1"), (B_S6A, "G6:.5 B6:1"), (B_S6B, "A5:.5 B5:1"), (B_S6C, "D6:.5 E6:1")]:
        m.melody(tr, B, beat, notes, 0.07)

    # S7 tips (beats 59-100): brighter, strummed, soft kick
    PAT = [(0, True, 1.0), (1, True, 0.6), (1.5, False, 0.5), (2.5, False, 0.55), (3, True, 0.7), (3.5, False, 0.5)]
    for bar0 in range(B_S7A, B_S8, 4):
        name = chord_at(bar0)
        for off, down, acc in PAT:
            beat = bar0 + off
            if beat < B_S8:
                m.strum(tr, B, beat, V[name], down, 0.5 * acc, bright=0.72)
        place(B["bass"], m.bass_note(midi(ROOT[name]) + 12, 1.6, 1.2), human(tr.t(bar0), 3), 0.36)
        if bar0 + 2 < B_S8:
            place(B["bass"], m.bass_note(midi(ROOT[name]) + 19, 1.0, 0.8), human(tr.t(bar0 + 2), 3), 0.28)
    for k in range((B_S8 - B_S7A) * 2):
        beat = B_S7A + k / 2
        place(B["perc"], m.shaker(1.0 if k % 2 == 0 else 0.55), human(tr.t(beat), 2), 0.3, pan=0.35)
    for beat in range(B_S7A, B_S8, 2):
        place(B["perc"], m.kick(), human(tr.t(beat), 2), 0.2)
    for beat, notes in [(B_S7A, "G6:.5 A6:.5 B6:1"), (B_S7B, "A6:.5 B6:.5 D7:1"), (B_S7C, "B6:.5 D7:.5 E7:1")]:
        m.melody(tr, B, beat, notes, 0.08)

    # S8 (beats 100-113): "musik naik, santai": fuller, a glock tune, tonic rings
    R = B_END - 1  # the tonic rings on the last beat
    PROG = ["Cadd9", "D", "Em7", "Am7"]  # two beats each, repeated; Dsus4 leads into the final G
    CH = [(b, min(b + 2, R - 1), PROG[i % 4]) for i, b in enumerate(range(B_S8, R - 1, 2))] + [(R - 1, R, "Dsus4")]
    for a, b, name in CH:
        for off, down, acc in PAT:
            beat = (a - (a - B_S8) % 4) + off
            for bb in (beat, beat + 4):
                if a <= bb < b:
                    m.strum(tr, B, bb, V[name], down, 0.66 * acc, bright=0.75)
        place(B["bass"], m.bass_note(midi(ROOT[name]) + 12, 1.4, 1.0), human(tr.t(a), 3), 0.45)
    for k in range((R - B_S8) * 2):
        place(B["perc"], m.shaker(1.0 if k % 2 == 0 else 0.55), human(tr.t(B_S8 + k / 2), 2), 0.4, pan=0.35)
    for beat in range(B_S8, R):
        place(B["perc"], m.kick() if beat % 2 else m.clap(), human(tr.t(beat), 2), 0.3 if beat % 2 else 0.28, pan=-0.1)
    m.melody(tr, B, B_S8 + 4, "E6:.5 G6:.5 B6:1 A6:.5 G6:.5 F#6:1 E6:.5 F#6:.5 G6:1 A6:1", 0.12)  # after she has read the CTA
    m.strum(tr, B, R, V["Gring"], True, 0.9, spread=0.035, bright=0.7, ring=3.0)
    place(B["bass"], m.bass_note(midi("G2"), 2.5, 2.4), tr.t(R), 0.45)
    place(B["bell"], m.glock(midi("G6"), 2.0), tr.t(R), 0.1, 0.3)

    mix = m.compress(m.render(B))[: tr.end]
    k = int(0.5 * SR)
    mix[-k:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, k)))[:, None]
    return mix


if __name__ == "__main__":
    root = os.path.dirname(HERE)
    m.write(os.path.join(root, "public/music/fallacy-yakin.wav"), make_yakin())
    m.write(os.path.join(root, "public/music/fallacy-penjelasan.wav"), make_penjelasan())
