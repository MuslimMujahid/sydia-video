/**
 * Generates TitipanTelur's storyboard-specific sound effects with ElevenLabs' sound-generation API.
 *
 * Writes public/sfx/titipan/<id>.mp3, peak-normalised to -1 dBFS with ffmpeg (ElevenLabs returns
 * some effects very quiet, e.g. the hum), so the volumes in src/titipan/TitipanTelur.tsx stay
 * meaningful across regenerations. Results differ per run; after regenerating, check each hit
 * still lands on its cue (SFX in src/titipan/TitipanTelur.tsx).
 *
 * Run: ELEVENLABS_API_KEY=... node scripts/make-titipan-sfx.mjs [id ...]
 *      node scripts/make-titipan-sfx.mjs --normalise-only   (re-level the existing files, no API calls)
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";

const OUT = "public/sfx/titipan";

export const EFFECTS = [
  { id: "egg-crack", seconds: 1, text: "A single raw egg cracking cleanly on the rim of a bowl, crisp shell crack, close up" },
  { id: "typing", seconds: 1.2, text: "Quick light typing on a laptop keyboard, about ten soft key clicks, close up" },
  { id: "soft-buzz", seconds: 0.8, text: "Short soft cartoon wrong-answer buzzer, gentle low double buzz, not harsh" },
  { id: "sparkle", seconds: 1.5, text: "Bright magical sparkle twinkle chime, cute and short, glittering" },
  { id: "spotlight-hum", seconds: 6, text: "Soft steady electrical hum of a theatre spotlight in a quiet empty room, low and warm, constant" },
  { id: "pen-writing", seconds: 1, text: "Quickly writing two short words with a pen on paper, scratchy ballpoint on notepad, close up" },
  { id: "reminder", seconds: 1.5, text: "Friendly smartphone reminder alert, two bright marimba notes rising, clean" },
];

/** A file's peak level in dBFS (ffmpeg's volumedetect reports on stderr). */
const peakOf = (file) => {
  const out = execFileSync("sh", ["-c", `ffmpeg -hide_banner -i "${file}" -af volumedetect -f null - 2>&1`], { encoding: "utf8" });
  const m = out.match(/max_volume: (-?[\d.]+) dB/);
  if (!m) throw new Error(`no peak for ${file}`);
  return Number(m[1]);
};

/** Peak-normalise a file in place; returns the gain applied. */
const levelTo = (file, target = -1) => {
  const gain = target - peakOf(file);
  const tmp = file.replace(/\.mp3$/, ".tmp.mp3");
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", file, "-af", `volume=${gain.toFixed(2)}dB`, "-b:a", "128k", tmp]);
  renameSync(tmp, file);
  return gain;
};

mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);

const todo = EFFECTS.filter((e) => only.length === 0 || only.includes(e.id));
if (todo.length > 0) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("Set ELEVENLABS_API_KEY");
  for (const fx of todo) {
    const res = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text: fx.text, duration_seconds: fx.seconds, prompt_influence: 0.6 }),
    });
    if (!res.ok) throw new Error(`${fx.id}: ${res.status} ${await res.text()}`);
    const file = `${OUT}/${fx.id}.mp3`;
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    console.log(`${fx.id}\tok, ${levelTo(file).toFixed(1)} dB to -1 dBFS`);
  }
}

if (process.argv.includes("--normalise-only")) {
  for (const fx of EFFECTS) console.log(`${fx.id}\t${levelTo(`${OUT}/${fx.id}.mp3`).toFixed(1)} dB`);
}
