/**
 * Generates SydiaSeller's intro sound effects with ElevenLabs' sound-generation API:
 * crickets under the night sky, the rooster at dawn and the twin-bell alarm clock.
 *
 * Writes public/sfx/<id>.mp3. Results differ per run, so after regenerating, check where
 * the crow peaks and when the bell stops ringing against INTRO in src/seller/scenes/NightIntro.tsx.
 *
 * Run: ELEVENLABS_API_KEY=... node scripts/make-seller-sfx.mjs [id ...]
 */
const OUT = "public/sfx";

export const EFFECTS = [
  { id: "night-crickets", seconds: 5, text: "Quiet night ambience, soft crickets chirping outside a bedroom window, gentle" },
  { id: "rooster", seconds: 2.5, text: "A single rooster crowing once at dawn" },
  { id: "alarm-clock", seconds: 3, text: "Old mechanical twin bell alarm clock ringing loudly, fast metallic hammer on bells" },
];

const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error("Set ELEVENLABS_API_KEY");
const only = process.argv.slice(2);
const { writeFileSync } = await import("node:fs");

for (const fx of EFFECTS.filter((e) => only.length === 0 || only.includes(e.id))) {
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ text: fx.text, duration_seconds: fx.seconds, prompt_influence: 0.6 }),
  });
  if (!res.ok) throw new Error(`${fx.id}: ${res.status} ${await res.text()}`);
  writeFileSync(`${OUT}/${fx.id}.mp3`, Buffer.from(await res.arrayBuffer()));
  console.log(`${fx.id}\tok`);
}
