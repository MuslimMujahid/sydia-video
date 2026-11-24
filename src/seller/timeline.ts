/**
 * SydiaSeller timeline, in bars of its 100 BPM acoustic track ("Pagi Cerah").
 * 1 beat = 18 frames, 1 bar = 72 frames (2.4 s) at 30 fps.
 * Keep `scripts/make-seller-music.py` in sync with these bar numbers.
 */
export const FPS = 30;
export const BEAT = 18;
export const BAR = 72;

export const at = (bar: number, beat = 0) => bar * BAR + beat * BEAT;

export const SECTIONS = {
  night: 0, // night turns to dawn in the window, the rooster crows
  wake: 2, // the alarm clock rings and is tapped off, then the phone comes up: notifications pile up
  list: 5, // unlock: customer chats keep landing in WhatsApp
  forward: 8, // Bu Rina's order is forwarded to Sydia, "Buat catatan pemesanan…"
  more: 13, // four more forwards: "tambah ini", "ini juga"…
  afternoon: 17, // the sky turns to afternoon, the laptop opens
  desk: 18, // web chat: "Buka catatan pemesanan hari ini" → side panel
  notes: 23, // "Buka di Catatan" → the notes workspace, day by day
  report: 26, // back to the chat: "Buatkan laporan pesanan seminggu terakhir" → the weekly report
  close: 30, // the SydiaShowcase closing screen: logo, tagline, CTA
  end: 34,
} as const;

export const TOTAL_FRAMES = at(SECTIONS.end);

/** Voice-over clips (public/voiceover/seller) and the frame each one starts on. */
export const VOICE = [
  { id: "v01-wake", from: at(2) + 34 }, // "Jam enam pagi." as the alarm bell dies away
  { id: "v02-list", from: at(5) + 10 },
  { id: "v03-forward", from: at(8) + 30 },
  { id: "v04-more", from: at(12) + 32 }, // "Tambah ini…" lands as the first "tambah ini" is sent
  { id: "v05-laptop", from: at(17) + 6 },
  { id: "v06-panel", from: at(20) + 6 },
  { id: "v07-notes", from: at(23) + 24 },
  { id: "v08-report", from: at(26) + 40 },
  { id: "v09-logo", from: at(30) - 6 },
  { id: "v10-cta", from: at(31) + 42 },
] as const;

/** The night intro, in global frames: the rooster crows at dawn, then the alarm clock rings until it's tapped off. */
export const INTRO = {
  rooster: 84, // the crow starts (rooster.mp3 has ~6 frames of lead-in)
  ring: at(SECTIONS.wake), // 06.00 on the dot
  stop: at(SECTIONS.wake) + 38, // the bell in alarm-clock.mp3 rings for ~1.25 s
  phone: at(SECTIONS.wake) + 62, // the phone starts rising into view
};
