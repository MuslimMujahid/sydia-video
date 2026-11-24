/**
 * Showcase timeline, in bars of the 100 BPM acoustic soundtrack.
 * 1 beat = 18 frames, 1 bar = 72 frames (2.4 s) at 30 fps.
 * Keep `scripts/make-showcase-music.py` in sync with these bar numbers.
 */
export const FPS = 30;
export const BEAT = 18;
export const BAR = 72;

export const SECTIONS = {
  intro: 0, // fingerpicked intro, chat composer types, logo blooms
  desktop: 2, // one continuous chat: notes → tasks → calendar → files
  notes: 2,
  tasks: 6,
  calendar: 9,
  files: 13,
  breath: 16, // soft half-time breather, desktop → phone
  phone: 18, // key lift to E: WhatsApp through the day
  brief: 18,
  schedule: 21,
  reminder: 24,
  sendFile: 27,
  memory: 30,
  dive: 33, // one-bar dive into the mic button
  voice: 34, // mellow voice-note section
  outro: 38, // final chorus, then a soft coda under the CTA
  end: 44,
} as const;

export const at = (bar: number, beat = 0) => bar * BAR + beat * BEAT;

export const TOTAL_FRAMES = at(SECTIONS.end);
