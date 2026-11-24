import { VO, type VoId } from "./voiceover";

/**
 * SibukSeharian timeline. Scenes S1–S5 run on the 120 BPM "Sebentar Dulu" track (1 beat = 15 frames,
 * the montage cuts every 2 beats); the track stops dead when S6 starts. S7–S8 run on the 100 BPM
 * "Giliran" track (1 beat = 18 frames). Keep `scripts/make-sibuk-music.py` in sync with these numbers.
 */
export const FPS = 30;
export const BEAT = 15;
export const BEAT2 = 18;

/** S6's length: the silence plus Haruka's line (it ends a few frames before the cut to S7). */
const HENING = 210;

/** Each scene's start, and where Haruka's line starts relative to it (`vo`, may be negative to pre-lap the cut). */
export const SCENES = {
  hook: { from: 0, vo: 4, clip: "s1-hook" }, // cursor tick, then the hook
  pullback: { from: 12 * BEAT, vo: 8, clip: "s2-proposal" }, // 16.47, camera pulls back
  pagi: { from: 20 * BEAT, vo: 20, clip: "s3-pagi" }, // rewind to 09.02; the groove starts on beat 21
  cek: { from: 32 * BEAT, vo: 6, clip: "s4-cek" },
  // the montage words get more annoyed each cut; each clip is placed so its word lands just after its cut
  meeting: { from: 40 * BEAT, vo: 2 - VO["s5a-meeting"].cues.meeting, clip: "s5a-meeting" }, // "Habis itu," pre-laps the cut
  email: { from: 42 * BEAT, vo: 1 - VO["s5b-email"].cues.word, clip: "s5b-email" },
  revisi: { from: 44 * BEAT, vo: 1 - VO["s5c-revisi"].cues.word, clip: "s5c-revisi" },
  chat: { from: 46 * BEAT, vo: 7 - VO["s5d-chat"].cues.word, clip: "s5d-chat" }, // lands 6 frames late: "Revisi?!" still rings ~3 frames into this cut
  puncak: { from: 48 * BEAT, vo: null, clip: null }, // notifications swarm; the music stops dead at the cut
  hening: { from: 54 * BEAT, vo: 30, clip: "s6-hening" }, // a second of total silence first
  daftar: { from: 54 * BEAT + HENING, vo: 12, clip: "s7-giliran" }, // "Giliran" starts
  cta: { from: 54 * BEAT + HENING + 12 * BEAT2, vo: 10, clip: "s8-cta" },
} as const satisfies Record<string, { from: number; vo: number | null; clip: VoId | null }>;

export type SceneId = keyof typeof SCENES;
export const TOTAL_FRAMES = SCENES.cta.from + 14 * BEAT2;
/** Where the second track starts. */
export const GILIRAN_FROM = SCENES.daftar.from;
/** Where the first track stops dead. */
export const PAGI_END = SCENES.hening.from;

const ORDER = Object.keys(SCENES) as SceneId[];

/** Scene length: up to the next scene's start (or the end of the video). */
export const len = (id: SceneId) => {
  const next = ORDER[ORDER.indexOf(id) + 1];
  return (next ? SCENES[next].from : TOTAL_FRAMES) - SCENES[id].from;
};

type Voiced = { [K in SceneId]: (typeof SCENES)[K]["clip"] extends VoId ? K : never }[SceneId];
type CueOf<S extends Voiced> = keyof (typeof VO)[(typeof SCENES)[S]["clip"]]["cues"];

/** Frame, from the scene's start, where Haruka starts saying a cue phrase. */
export const cue = <S extends Voiced>(scene: S, name: CueOf<S>) => {
  const s = SCENES[scene];
  return s.vo + (VO[s.clip].cues as Record<CueOf<S>, number>)[name];
};

/** Frame, from the scene's start, where Haruka finishes the scene's line. */
export const voEnd = (scene: Voiced) => SCENES[scene].vo + VO[SCENES[scene].clip].frames;

export const VOICED = ORDER.filter((id): id is Voiced => SCENES[id].clip !== null);
