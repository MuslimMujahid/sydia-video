/**
 * Generates the SibukSeharian voice-over (narrator: Haruka) with ElevenLabs.
 *
 * Writes public/voiceover/sibuk/<id>.mp3 plus <id>.json (character timings), then
 * regenerates src/sibuk/voiceover.ts: each clip's length and the frame (from the clip's
 * start) where each cue phrase is spoken, so the animation lands on Haruka's words.
 *
 * Run: ELEVENLABS_API_KEY=... node scripts/make-sibuk-voiceover.mjs [id ...]
 * With ids, only those clips are re-generated; voiceover.ts is always rebuilt from every clip.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const VOICE = "iWydkXKoiVtvdn4vLKp9"; // Cahaya: young, bright (Indonesian)
const MODEL = "eleven_v4";
const OUT = "public/voiceover/sibuk";
const FPS = 30;

const SETTINGS = { stability: 0.4, similarity_boost: 0.8, style: 0.45, use_speaker_boost: true, speed: 1.06 };
/**
 * The montage words get more annoyed on every cut: a tired sigh at the meeting, then annoyed,
 * frustrated, and exasperated at yet another chat. Each step loosens stability and pushes style;
 * eleven_v4 reads the [tag] as direction (it takes ~0.1 s in the timings and isn't spoken).
 */
const ANNOYED = [
  { stability: 0.45, style: 0.5, speed: 1.12 },
  { stability: 0.35, style: 0.7, speed: 1.0 },
  { stability: 0.25, style: 0.85, speed: 1.15 },
  { stability: 0.15, style: 1.0, speed: 1.05 },
];

/** `cues` maps a cue name to the phrase whose first letter it marks; `settings` overrides SETTINGS for one line. */
export const LINES = [
  {
    id: "s1-hook",
    text: "Pernah gak kalian merasa sibuk seharian, tapi kerjaan gak selesai-selesai?",
    settings: { stability: 0.3, style: 0.75, speed: 1.1 },
    cues: { sibuk: "sibuk seharian", tapi: "tapi kerjaan", selesai: "selesai-selesai" },
  },
  { id: "s2-proposal", text: "Hari ini aku mau ngerjain proposal.", settings: { stability: 0.45, speed: 1.0 }, cues: { hari: "Hari ini", ngerjain: "ngerjain", proposal: "proposal" } },
  { id: "s3-pagi", text: "Pagi. Baru mulai ngerjain, ada chat.", cues: { pagi: "Pagi", baru: "Baru mulai", chat: "ada chat" } },
  { id: "s4-cek", text: "Diminta cek sesuatu.", cues: { cek: "cek" } },
  // `word` marks the montage word, so each one can land right on its cut
  { id: "s5a-meeting", text: "[tired] Habis itu, meeting.", settings: ANNOYED[0], cues: { meeting: "meeting" } },
  { id: "s5b-email", text: "[annoyed] Email.", settings: ANNOYED[1], cues: { word: "Email" } },
  { id: "s5c-revisi", text: "[frustrated] Revisi?!", settings: ANNOYED[2], cues: { word: "Revisi" } },
  { id: "s5d-chat", text: "[exasperated] Chat lagi?!", settings: ANNOYED[3], cues: { word: "Chat" } },
  {
    id: "s6-hening",
    // after the silence: quiet and tired
    text: "Iya sih, semua cuma sebentar… tapi kerjaanku gak lanjut-lanjut.",
    settings: { stability: 0.55, style: 0.3, speed: 0.96 },
    cues: { semua: "semua cuma", tapi: "tapi kerjaanku" },
  },
  {
    id: "s7-giliran",
    // tired, then weighing it up: a slower, thoughtful second half
    text: "[tired] Yang baru masuk selalu dapat giliran duluan. [thoughtful] Yang penting… nunggu terus.",
    settings: { stability: 0.5, style: 0.55, speed: 0.95 },
    cues: { baru: "Yang baru", duluan: "duluan", penting: "Yang penting", nunggu: "nunggu terus" },
  },
  {
    id: "s8-cta",
    text: "Hari ini kamu bilang ‘sebentar’ berapa kali? Tulis angkanya di komentar!",
    settings: { stability: 0.32, style: 0.7, speed: 1.06 },
    cues: { sebentar: "sebentar", berapa: "berapa kali", tulis: "Tulis angkanya", komentar: "komentar" },
  },
];

mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
const todo = LINES.filter((l) => only.length === 0 || only.includes(l.id));

if (todo.length > 0) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("Set ELEVENLABS_API_KEY");
  for (const line of todo) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: line.text,
        model_id: MODEL,
        language_code: "id",
        voice_settings: { ...SETTINGS, ...line.settings },
      }),
    });
    if (!res.ok) throw new Error(`${line.id}: ${res.status} ${await res.text()}`);
    const data = await res.json();
    writeFileSync(`${OUT}/${line.id}.mp3`, Buffer.from(data.audio_base64, "base64"));
    writeFileSync(`${OUT}/${line.id}.json`, JSON.stringify({ text: line.text, alignment: data.alignment }, null, 1));
    const ends = data.alignment.character_end_times_seconds;
    console.log(`${line.id}\t${ends[ends.length - 1].toFixed(2)} s`);
  }
}

// ---------------------------------------------------------------- voiceover.ts
const entries = LINES.map((line) => {
  const file = `${OUT}/${line.id}.json`;
  if (!existsSync(file)) throw new Error(`Missing ${file}; generate it first`);
  const { alignment: a } = JSON.parse(readFileSync(file, "utf8"));
  const spoken = a.characters.join("");
  const cues = Object.fromEntries(
    Object.entries(line.cues).map(([name, phrase]) => {
      const i = spoken.toLowerCase().indexOf(phrase.toLowerCase());
      if (i < 0) throw new Error(`${line.id}: cue "${phrase}" not found in "${spoken}"`);
      return [name, Math.round(a.character_start_times_seconds[i] * FPS)];
    }),
  );
  const frames = Math.ceil(a.character_end_times_seconds[a.character_end_times_seconds.length - 1] * FPS);
  return { id: line.id, frames, cues };
});

const ts = `// Generated by scripts/make-sibuk-voiceover.mjs from the ElevenLabs character timings. Do not edit by hand.
/** Each clip's length and the frame (from the clip's start) where each cue phrase is spoken. */
export const VO = {
${entries.map((e) => `  "${e.id}": { frames: ${e.frames}, cues: { ${Object.entries(e.cues).map(([k, v]) => `${k}: ${v}`).join(", ")} } },`).join("\n")}
} as const;

export type VoId = keyof typeof VO;
`;
mkdirSync("src/sibuk", { recursive: true });
writeFileSync("src/sibuk/voiceover.ts", ts);
console.log("wrote src/sibuk/voiceover.ts");
