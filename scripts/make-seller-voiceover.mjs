/**
 * Generates the SydiaSeller voice-over with ElevenLabs.
 *
 * Writes public/voiceover/seller/<id>.mp3 plus <id>.json (character timings),
 * and prints each clip's duration so src/seller/timeline.ts can be checked.
 *
 * Run: ELEVENLABS_API_KEY=... node scripts/make-seller-voiceover.mjs [id ...]
 */
import { mkdirSync, writeFileSync } from "node:fs";

const VOICE = "iWydkXKoiVtvdn4vLKp9"; // Cahaya: young, bright (Indonesian)
const MODEL = "eleven_v4";
const OUT = "public/voiceover/seller";

export const LINES = [
  { id: "v01-wake", text: "Jam enam pagi. Sari baru bangun… tapi pesanan sudah numpuk." },
  { id: "v02-list", text: "Bu Rina, Pak Dedi, pelanggan baru… semuanya pesan lewat WhatsApp." },
  { id: "v03-forward", text: "Sari cukup teruskan pesannya ke Sydia, lalu minta dibuatkan catatan pemesanan hari ini." },
  { id: "v04-more", text: "Ada pesanan lagi? Teruskan saja. Tambah ini… ini juga… Sydia yang mencatat." },
  { id: "v05-laptop", text: "Sore harinya, Sari buka laptop untuk cek semua pesanan." },
  { id: "v06-panel", text: "Cukup tanya, catatannya langsung terbuka di samping chat." },
  { id: "v07-notes", text: "Rapi per hari, bersama catatan pesanan hari-hari sebelumnya." },
  { id: "v08-report", text: "Mau laporan mingguan? Tinggal minta. Sydia merangkum semua catatan pesanannya." },
  { id: "v09-logo", text: "Sydia. Asisten pribadi yang selalu ingat." },
  { id: "v10-cta", text: "Coba gratis tujuh hari. Komen MAU di kolom komentar!" },
];

const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error("Set ELEVENLABS_API_KEY");
mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);

for (const line of LINES.filter((l) => only.length === 0 || only.includes(l.id))) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: line.text,
      model_id: MODEL,
      language_code: "id",
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed: 1.0 },
    }),
  });
  if (!res.ok) throw new Error(`${line.id}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  writeFileSync(`${OUT}/${line.id}.mp3`, Buffer.from(data.audio_base64, "base64"));
  writeFileSync(`${OUT}/${line.id}.json`, JSON.stringify({ text: line.text, alignment: data.alignment }, null, 1));
  const ends = data.alignment.character_end_times_seconds;
  console.log(`${line.id}\t${ends[ends.length - 1].toFixed(2)} s`);
}
