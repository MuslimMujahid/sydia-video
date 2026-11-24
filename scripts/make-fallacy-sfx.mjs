/**
 * Generates CumaSepuluhMenit's storyboard sound effects with ElevenLabs' sound-generation API.
 *
 * Writes public/sfx/fallacy/<id>.mp3, peak-normalised to -1 dBFS with ffmpeg so the volumes in
 * src/fallacy/CumaSepuluhMenit.tsx stay meaningful across regenerations. Results differ per run; after
 * regenerating, check each hit still lands on its cue and update SFX_FRAMES if a length changed.
 *
 * Run: ELEVENLABS_API_KEY=... node scripts/make-fallacy-sfx.mjs [id ...]
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";

const OUT = "public/sfx/fallacy";

export const EFFECTS = [
  { id: "paper-slap", seconds: 0.5, text: "A torn strip of paper slapped flat onto a desk, one short crisp paper slap, close up, dry" },
  { id: "paper-rip", seconds: 0.7, text: "One quick short rip of a sheet of paper being torn, crisp, close up, dry" },
  { id: "tape-stick", seconds: 0.5, text: "A strip of sticky tape pulled and pressed onto a paper page, short, close up" },
  { id: "page-drop", seconds: 0.6, text: "A single sheet of paper dropped flat onto a wooden desk, soft papery thump" },
  { id: "scrub", seconds: 1.4, text: "Scrubbing back and forth through a recording of people talking in a meeting, garbled sped-up voices, tape scrub, no music" },
  { id: "keys-fast", seconds: 2, text: "Frantic fast typing on a laptop keyboard, rapid hurried key clicks, close up, no music" },
  { id: "marker", seconds: 0.6, text: "A felt marker pen quickly drawing a circle on paper, short squeaky scribble, close up" },
  { id: "send", seconds: 0.5, text: "Chat message sent sound, a soft quick bubbly whoosh pop, friendly UI sound" },
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

const lengthOf = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }));

mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
const todo = EFFECTS.filter((e) => only.length === 0 || only.includes(e.id));
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
  const gain = levelTo(file);
  console.log(`${fx.id}\t${Math.ceil(lengthOf(file) * 30)} frames, ${gain.toFixed(1)} dB to -1 dBFS`);
}
