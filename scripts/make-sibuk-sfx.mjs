/**
 * Generates SibukSeharian's storyboard sound effects with ElevenLabs' sound-generation API.
 *
 * Writes public/sfx/sibuk/<id>.mp3, peak-normalised to -1 dBFS with ffmpeg so the volumes in
 * src/sibuk/SibukSeharian.tsx stay meaningful across regenerations. Results differ per run; after
 * regenerating, check each hit still lands on its cue and update SFX_FRAMES if a length changed.
 *
 * Run: ELEVENLABS_API_KEY=... node scripts/make-sibuk-sfx.mjs [id ...]
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";

const OUT = "public/sfx/sibuk";

export const EFFECTS = [
  { id: "key-tap", seconds: 0.5, text: "A single soft click of one laptop keyboard key in a quiet room, close up, dry" },
  { id: "rewind", seconds: 0.8, text: "Cassette tape rewinding fast, high-pitched whirring rewind with a squeaky reel, short, ends with a click" },
  { id: "phone-buzz", seconds: 1, text: "A smartphone vibrating twice on a wooden desk, short buzz buzz, close up" },
  { id: "call-ring", seconds: 1, text: "Incoming video call ringtone, one short bright friendly digital ring" },
  { id: "email", seconds: 0.7, text: "Email received notification, quick soft swoosh ending in a small chime" },
  { id: "notif-pile", seconds: 3, text: "Many different smartphone notification pings, chimes and buzzes piling up faster and faster, overlapping, getting denser and louder into a chaotic crescendo" },
  { id: "pen-scratch", seconds: 1.5, text: "Writing a few short words quickly with a ballpoint pen on paper, scratchy, close up, no music" },
  { id: "pen-tick", seconds: 0.5, text: "One quick ballpoint pen tick mark stroke on paper, short scratch, close up" },
  { id: "soft-tap", seconds: 0.5, text: "A single light soft wooden tap knock, gentle and clean" },
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
