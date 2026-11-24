import { VO, type VoId } from "./voiceover";

/**
 * CumaSepuluhMenit timeline. S1–S2c run on the 120 BPM "Yakin" track (1 beat = 15 frames); it stops dead
 * at the cut to S3 ("Udah, Har?" lands in silence). S4–S8 run on the 100 BPM "Penjelasan" track
 * (1 beat = 18 frames). Every scene length is a whole number of beats, so each cut lands on a downbeat.
 * Keep `scripts/make-fallacy-music.py` in sync with these numbers.
 */
export const FPS = 30;
export const BEAT = 15;
export const BEAT2 = 18;

/** Each scene's length, where Haruka's line starts in it (`vo`), and which clip she says. */
const PLAN = [
  { id: "hook", len: 12 * BEAT, vo: 6, clip: "s1-hook" },
  { id: "chat", len: 16 * BEAT, vo: 8, clip: "s1b-chat" }, // she reads the boss's chat out loud and answers "10 menit"
  { id: "s2a", len: 11 * BEAT, vo: 4, clip: "s2a-yakin" }, // menit ke-2: sure it's quick, then "Eh…?"
  { id: "s2b", len: 12 * BEAT, vo: 6, clip: "s2b-gumam" }, // 2 s after "cek rekaman deh" for the scrubbing
  { id: "s2c", len: 8 * BEAT, vo: 2, clip: "s2c-panik" }, // menit ke-47: panicking; the music stops dead at the cut
  { id: "freeze", len: 108, vo: 12, clip: "s3-kaget" }, // "Udah, Har?" lands in silence, "Hah?!", then a beat of silence
  { id: "istilah", len: 12 * BEAT2, vo: 8, clip: "s4-istilah" },
  { id: "kenapa", len: 11 * BEAT2, vo: 6, clip: "s5-kenapa" },
  { id: "riset", len: 10 * BEAT2, vo: 6, clip: "s6a-riset" },
  { id: "metode", len: 14 * BEAT2, vo: 6, clip: "s6b-metode" },
  { id: "hasil", len: 12 * BEAT2, vo: 6, clip: "s6c-hasil" },
  { id: "tips1", len: 16 * BEAT2, vo: 6, clip: "s7a-tips1" },
  { id: "tips2", len: 12 * BEAT2, vo: 6, clip: "s7b-tips2" },
  { id: "tips3", len: 13 * BEAT2, vo: 6, clip: "s7c-tips3" },
  { id: "penutup", len: 13 * BEAT2, vo: 10, clip: "s8-penutup" }, // she reads the CTA, then giggles
] as const satisfies readonly { id: string; len: number; vo: number | null; clip: VoId | null }[];

type Plan = (typeof PLAN)[number];
export type SceneId = Plan["id"];
type SceneOf<K extends SceneId> = Extract<Plan, { id: K }>;

const starts = PLAN.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + PLAN[i - 1].len], []);

/** Each scene's start (global frame), length, voice-over offset and clip. */
export const SCENES = Object.fromEntries(PLAN.map((s, i) => [s.id, { ...s, from: starts[i] }])) as { [K in SceneId]: SceneOf<K> & { from: number } };

export const TOTAL_FRAMES = starts[starts.length - 1] + PLAN[PLAN.length - 1].len;
/** Where the first track stops dead and where the second starts. */
export const YAKIN_END = SCENES.freeze.from;
export const PENJELASAN_FROM = SCENES.istilah.from;

export const len = (id: SceneId) => SCENES[id].len;

type Voiced = { [K in SceneId]: SceneOf<K>["clip"] extends VoId ? K : never }[SceneId];
type ClipOf<S extends Voiced> = SceneOf<S>["clip"] & VoId;
type CueOf<S extends Voiced> = keyof (typeof VO)[ClipOf<S>]["cues"];

/** Frame, from the scene's start, where Haruka starts saying a cue phrase. */
export const cue = <S extends Voiced>(scene: S, name: CueOf<S>) => {
  const s = SCENES[scene] as { vo: number; clip: VoId };
  return s.vo + (VO[s.clip].cues as Record<string, number>)[name as string];
};

/** Frame, from the scene's start, where Haruka finishes the scene's line. */
export const voEnd = (scene: Voiced) => {
  const s = SCENES[scene] as { vo: number; clip: VoId };
  return s.vo + VO[s.clip].frames;
};

export const VOICED = PLAN.filter((s): s is Extract<Plan, { clip: VoId }> => s.clip !== null).map((s) => s.id as Voiced);
