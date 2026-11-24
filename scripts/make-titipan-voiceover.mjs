/**
 * Generates the TitipanTelur voice-over (narrator: Haruka) with ElevenLabs.
 *
 * Writes public/voiceover/titipan/<id>.mp3 plus <id>.json (character timings), then
 * regenerates src/titipan/voiceover.ts: each clip's length and the frame (from the clip's
 * start) where each cue phrase is spoken, so the animation lands on Haruka's words.
 *
 * Run: ELEVENLABS_API_KEY=... node scripts/make-titipan-voiceover.mjs [id ...]
 * With ids, only those clips are re-generated; voiceover.ts is always rebuilt from every clip.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const VOICE = "iWydkXKoiVtvdn4vLKp9"; // Cahaya: young, bright (Indonesian)
const MODEL = "eleven_v4";
const OUT = "public/voiceover/titipan";
const FPS = 30;

const SETTINGS = { stability: 0.4, similarity_boost: 0.8, style: 0.45, use_speaker_boost: true, speed: 1.08 };

/** `cues` maps a cue name to the phrase whose first letter it marks; `settings` overrides SETTINGS for one line. */
export const LINES = [
  {
    id: "s1-hook",
    // the hook: livelier and curious (less stable, more style, a touch faster)
    text: "Kenapa ya, kejadian memalukan lima tahun lalu masih ingat… tapi Ibu nitip beli telur, malah lupa?!",
    settings: { stability: 0.28, style: 0.8, speed: 1.12 },
    cues: { memalukan: "memalukan", masihIngat: "masih ingat", tapi: "tapi Ibu", malahLupa: "malah lupa" },
  },
  {
    id: "s2-timeline",
    text: "Yang lima tahun lalu masih jelas banget. Yang tadi pagi? Udah kabur.",
    cues: { masihJelas: "masih jelas", tadiPagi: "Yang tadi pagi", udahKabur: "Udah kabur" },
  },
  {
    id: "s3-mode",
    text: "Tenang, bukan berarti ingatanmu jelek. Dua kejadian ini pakai ‘mode’ mengingat yang beda.",
    cues: { bukan: "bukan", dua: "Dua kejadian", mode: "mode", beda: "beda" },
  },
  {
    id: "s4-emosi",
    text: "Waktu kamu malu, emosi bikin perhatian fokus ke momen itu, dan ingatannya cenderung diperkuat sesudahnya. Makanya bisa membekas bertahun-tahun. Tapi efeknya selektif ya, nggak semua detail ikut keingat.",
    cues: { emosi: "emosi", fokus: "fokus", diperkuat: "diperkuat", makanya: "Makanya", selektif: "selektif", detail: "nggak semua" },
  },
  {
    id: "s5-prospective",
    text: "Nah, titipan belanja itu contoh prospective memory: mengingat hal yang harus dikerjakan nanti. Kamu butuh dua hal: ingat apa yang harus dilakukan, dan teringat tepat saat waktunya tiba. Biasanya yang kedua ini yang bolong.",
    cues: { term: "prospective", definisi: "mengingat hal", duaHal: "dua hal", apa: "ingat apa", kapan: "teringat tepat", bolong: "Biasanya" },
  },
  {
    id: "s6-sibuk",
    text: "Apalagi kalau pikiranmu lagi sibuk: balas chat kerjaan, mikirin deadline, nyetir di jalan macet. Aktivitas yang menguras perhatian bikin niat tadi gampang kelewat.",
    cues: { sibuk: "sibuk", chat: "balas chat", deadline: "mikirin deadline", macet: "nyetir", aktivitas: "Aktivitas", kelewat: "gampang kelewat" },
  },
  {
    id: "s7-pengingat",
    text: "Jadi jangan cuma andalkan kepala. Pasang pengingat menjelang jam belanja, atau tulis di daftar yang langsung kamu buka begitu masuk toko.",
    cues: { kepala: "andalkan kepala", pengingat: "Pasang pengingat", daftar: "tulis di daftar", masukToko: "begitu masuk toko" },
  },
  {
    id: "s8-intinya",
    text: "Jadi intinya: yang emosional nempel sendiri, yang ‘nanti’ perlu dibantu.",
    cues: { intinya: "intinya", kiri: "yang emosional", kanan: "yang ‘nanti’" },
  },
  {
    id: "s9-cta",
    text: "Kamu paling sering lupa titipan apa? Tulis di komentar!",
    cues: { komentar: "Tulis di komentar" },
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

const ts = `// Generated by scripts/make-titipan-voiceover.mjs from the ElevenLabs character timings. Do not edit by hand.
/** Each clip's length and the frame (from the clip's start) where each cue phrase is spoken. */
export const VO = {
${entries.map((e) => `  "${e.id}": { frames: ${e.frames}, cues: { ${Object.entries(e.cues).map(([k, v]) => `${k}: ${v}`).join(", ")} } },`).join("\n")}
} as const;

export type VoId = keyof typeof VO;
`;
mkdirSync("src/titipan", { recursive: true });
writeFileSync("src/titipan/voiceover.ts", ts);
console.log("wrote src/titipan/voiceover.ts");
