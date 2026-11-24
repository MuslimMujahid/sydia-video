import { VO, type VoId } from "./voiceover";

/**
 * TitipanTelur timeline, in bars of its 112.5 BPM acoustic track ("Titip Senyum").
 * 1 beat = 16 frames, 1 bar = 64 frames (2.13 s) at 30 fps.
 * Keep `scripts/make-titipan-music.py` in sync with these bar numbers.
 */
export const FPS = 30;
export const BEAT = 16;
export const BAR = 64;

/** The hook's last bar runs six beats (the music has stopped), so every bar from 4 on is two beats later. */
const HOOK_EXTRA = 2 * BEAT;

export const at = (bar: number, beat = 0) => bar * BAR + beat * BEAT + (bar >= 4 ? HOOK_EXTRA : 0);

/** Each scene's start and where Haruka's line starts inside it (`vo`, frames after the scene starts). */
export const SCENES = {
  hook: { from: at(0), vo: 6, clip: "s1-hook" }, // music: fingerpicking, tape-stops on "malah lupa?!"
  timeline: { from: at(4), vo: 8, clip: "s2-timeline" }, // the groove kicks in
  modes: { from: at(7), vo: 8, clip: "s3-mode" },
  spotlight: { from: at(11), vo: 14, clip: "s4-emosi" }, // music drops to kalimba
  egg: { from: at(18, 2), vo: 10, clip: "s5-prospective" },
  road: { from: at(26, 2), vo: 10, clip: "s6-sibuk" }, // busy groove, claps
  reminder: { from: at(32, 2), vo: 10, clip: "s7-pengingat" }, // chorus + whistle from bar 34, on "Pasang pengingat"
  summary: { from: at(37, 1), vo: 8, clip: "s8-intinya" }, // half-time resolve
  cta: { from: at(40, 2), vo: 12, clip: "s9-cta" }, // the final G rings out
} as const satisfies Record<string, { from: number; vo: number; clip: VoId }>;

export type SceneId = keyof typeof SCENES;
export const TOTAL_FRAMES = at(43, 2);

const ORDER = Object.keys(SCENES) as SceneId[];

/** Scene length: up to the next scene's start (or the end of the video). */
export const len = (id: SceneId) => {
  const next = ORDER[ORDER.indexOf(id) + 1];
  return (next ? SCENES[next].from : TOTAL_FRAMES) - SCENES[id].from;
};

type CueOf<S extends SceneId> = keyof (typeof VO)[(typeof SCENES)[S]["clip"]]["cues"];

/** Frame, from the scene's start, where Haruka starts saying a cue phrase. */
export const cue = <S extends SceneId>(scene: S, name: CueOf<S>) => {
  const s = SCENES[scene];
  return s.vo + (VO[s.clip].cues as Record<CueOf<S>, number>)[name];
};

/** Frame, from the scene's start, where Haruka finishes the scene's line. */
export const voEnd = (scene: SceneId) => SCENES[scene].vo + VO[SCENES[scene].clip].frames;
