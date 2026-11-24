/**
 * Generates the CumaSepuluhMenit voice-over (narrator: Haruka) with ElevenLabs.
 *
 * Writes public/voiceover/fallacy/<id>.mp3 plus <id>.json (character timings), then
 * regenerates src/fallacy/voiceover.ts: each clip's length and the frame (from the clip's
 * start) where each cue phrase is spoken, so the animation lands on Haruka's words.
 *
 * Run: ELEVENLABS_API_KEY=... node scripts/make-fallacy-voiceover.mjs [id ...]
 * With ids, only those clips are re-generated; voiceover.ts is always rebuilt from every clip.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";

const VOICE = "iWydkXKoiVtvdn4vLKp9"; // Cahaya: young, bright (Indonesian)
const MODEL = "eleven_v4";
const OUT = "public/voiceover/fallacy";
const FPS = 30;
/**
 * eleven_v4 ignores `speed`, so each clip is tightened afterwards with ffmpeg's atempo (pitch kept);
 * the character timings are divided by the same factor when voiceover.ts is built.
 */
const TEMPO = 1.1;

const SETTINGS = { stability: 0.4, similarity_boost: 0.8, style: 0.45, use_speaker_boost: true, speed: 1.15 };

/**
 * The lines are the storyboard's VO notes ("Stroyboard - Planning fallacy"). Numbers are spelled out so
 * the Indonesian read is predictable; "MoM" is spelled "em-o-em" for the same reason. `cues` maps a cue
 * name to the phrase whose first letter it marks; `settings` overrides SETTINGS for one line. eleven_v4
 * reads a [tag] as direction (it isn't spoken).
 */
export const LINES = [
  {
    id: "s1-hook",
    text: "Tahukah kalian? Kebiasaan meremehkan waktu pengerjaan itu ada istilahnya.",
    settings: { stability: 0.32, style: 0.7, speed: 1.15 },
    cues: { kebiasaan: "Kebiasaan", meremehkan: "meremehkan", pengerjaan: "pengerjaan", istilah: "ada istilahnya" },
  },
  {
    id: "s1b-chat",
    // S1b: she reads the boss's chat out loud, thinks for half a second, and answers
    text: "[reading] Har, tolong bikin Em-o-em meeting tadi ya. Kira-kira berapa lama? [thoughtful] Hmm… [cheerful] sepuluh menit!",
    settings: { stability: 0.4, style: 0.6, speed: 1.1 },
    cues: { har: "Har,", kira: "Kira-kira", hmm: "Hmm", sepuluh: "sepuluh" },
  },
  // S2a–S3: Haruka talking to herself at the laptop, getting more confused, then panicked, then shocked
  {
    id: "s2a-yakin",
    text: "[confident] Oke, ayo kita beresin dengan cepat. [confused] Eh… catatannya kok berantakan gini?",
    settings: { stability: 0.4, style: 0.6, speed: 1.1 },
    cues: { eh: "Eh", berantakan: "berantakan" },
  },
  {
    id: "s2b-gumam",
    text: "[muttering] Lho, ini maksudnya apa ya… cek rekaman deh.",
    settings: { stability: 0.45, style: 0.5, speed: 1.1 },
    cues: { lho: "Lho", cek: "cek rekaman" },
  },
  {
    id: "s2c-panik",
    text: "[panicking] Ini maksudnya apa sih?! Konfirmasi ke siapa ya…?",
    settings: { stability: 0.25, style: 0.85, speed: 1.15 },
    cues: { konfirmasi: "Konfirmasi", siapa: "siapa ya" },
  },
  {
    id: "s3-kaget",
    text: "[shocked] Hah?! Udah empat puluh tujuh menit?!",
    settings: { stability: 0.25, style: 0.9, speed: 1.1 },
    cues: { hah: "Hah", empat: "empat puluh" },
  },
  {
    id: "s4-istilah",
    text: "Namanya planning fallacy: kecenderungan meremehkan waktu yang dibutuhkan untuk menyelesaikan sesuatu.",
    cues: { planning: "planning", kecenderungan: "kecenderungan", meremehkan: "meremehkan", menyelesaikan: "menyelesaikan" },
  },
  {
    id: "s5-kenapa",
    text: "Soalnya, yang kita bayangkan cuma versi lancarnya. Hambatan kecil nggak ikut dihitung.",
    cues: { bayangkan: "yang kita", lancar: "versi lancarnya", hambatan: "Hambatan", dihitung: "dihitung" },
  },
  {
    id: "s6a-riset",
    text: "Ini pernah diteliti oleh Buehler, Griffin, dan Ross, tahun sembilan belas sembilan puluh empat.",
    cues: { diteliti: "diteliti", buehler: "Buehler", griffin: "Griffin", ross: "Ross", tahun: "tahun" },
  },
  {
    id: "s6b-metode",
    text: "Mereka diminta membuat estimasi tiga kali: estimasi paling realistis, kalau semua lancar, dan kalau semua kacau.",
    cues: { tiga: "tiga kali", realistis: "estimasi paling", lancar: "kalau semua lancar", kacau: "kalau semua kacau" },
  },
  {
    id: "s6c-hasil",
    text: "Hasilnya? Rata-rata selesai lima puluh lima hari. [surprised] Bahkan lebih lama dari estimasi terburuk mereka.",
    settings: { stability: 0.35, style: 0.6 },
    cues: { rata: "Rata-rata", lima: "lima puluh lima", bahkan: "Bahkan", terburuk: "terburuk" },
  },
  {
    id: "s7a-tips1",
    text: "Jadi, sebelum jawab ‘berapa lama?’, pecah dulu jadi langkah-langkah kecil. Biasanya totalnya jauh lebih lama dari yang kita kira.",
    cues: { sebelum: "sebelum jawab", pecah: "pecah dulu", biasanya: "Biasanya", jauh: "jauh lebih" },
  },
  {
    id: "s7b-tips2",
    text: "Kedua, pakai tugas yang mirip sebagai patokan. Em-o-em minggu lalu makan waktu berapa lama?",
    cues: { pakai: "pakai tugas", patokan: "patokan", mom: "Em-o-em", berapa: "berapa lama" },
  },
  {
    id: "s7c-tips3",
    text: "Dan kalau sudah kerasa bakal lebih lama dari yang dijanjikan, jangan malu buat bilang dari awal.",
    cues: { kerasa: "kerasa", jangan: "jangan malu", bilang: "bilang dari awal" },
  },
  {
    id: "s8-penutup",
    // S8: she reads the CTA off the band, then catches herself: she says "10 menit" all the time too
    text: "Kirim ke temanmu yang hobi bilang ‘sepuluh menit’! [giggles] Hehe… aku juga sering, sih.",
    settings: { stability: 0.3, style: 0.75, speed: 1.05 },
    cues: { sepuluh: "sepuluh", giggle: "[giggles]", hehe: "Hehe", aku: "aku juga" },
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
    const mp3 = `${OUT}/${line.id}.mp3`;
    writeFileSync(`${OUT}/${line.id}.raw.mp3`, Buffer.from(data.audio_base64, "base64"));
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", `${OUT}/${line.id}.raw.mp3`, "-af", `atempo=${TEMPO}`, "-b:a", "128k", `${mp3}.tmp.mp3`]);
    renameSync(`${mp3}.tmp.mp3`, mp3);
    writeFileSync(`${OUT}/${line.id}.json`, JSON.stringify({ text: line.text, alignment: data.alignment }, null, 1));
    const ends = data.alignment.character_end_times_seconds;
    console.log(`${line.id}\t${(ends[ends.length - 1] / TEMPO).toFixed(2)} s`);
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
      return [name, Math.round((a.character_start_times_seconds[i] / TEMPO) * FPS)];
    }),
  );
  const frames = Math.ceil((a.character_end_times_seconds[a.character_end_times_seconds.length - 1] / TEMPO) * FPS);
  return { id: line.id, frames, cues };
});

const ts = `// Generated by scripts/make-fallacy-voiceover.mjs from the ElevenLabs character timings. Do not edit by hand.
/** Each clip's length and the frame (from the clip's start) where each cue phrase is spoken. */
export const VO = {
${entries.map((e) => `  "${e.id}": { frames: ${e.frames}, cues: { ${Object.entries(e.cues).map(([k, v]) => `${k}: ${v}`).join(", ")} } },`).join("\n")}
} as const;

export type VoId = keyof typeof VO;
`;
mkdirSync("src/fallacy", { recursive: true });
writeFileSync("src/fallacy/voiceover.ts", ts);
console.log("wrote src/fallacy/voiceover.ts");
