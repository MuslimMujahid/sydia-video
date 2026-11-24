import type React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Band, BandText, MarkerCircle } from "../components/Paper";
import { c, clamp, easeInOut, easeOut, heavy, MONO_ADVANCE, monoText, popSpring } from "../theme";
import { cue } from "../timeline";

const SIZE = 54;
const ADV = SIZE * MONO_ADVANCE;
const TEXT_X = 274;
const rowY = (i: number) => 206 + 150 * i;

const TASKS = ["Proposal", "Balas grup", "Cek file Dina", "Meeting dadakan", "Email data Q3", "Revisi slide 4", "Bales chat bos"];
/** Each new task: written from `at` for 10 frames, ticked 2 frames later, then struck through. */
const STEP = 19;
const START = 6;
const startOf = (i: number) => START + (i - 1) * STEP;
const WRITE = 10;
const tickAt = (i: number) => startOf(i) + WRITE + 2;
/** The last task is still being written, slowly, when the scene ends. */
const LAST = TASKS.length - 1;
const LAST_FRAMES_PER_CHAR = 3.2;

/** Chars written of row i at frame f. */
const written = (i: number, f: number) => {
  if (i === 0) return TASKS[0].length;
  if (i === LAST) return Math.max(0, Math.min(TASKS[i].length, (f - startOf(i)) / LAST_FRAMES_PER_CHAR));
  return interpolate(f, [startOf(i), startOf(i) + WRITE], [0, TASKS[i].length], clamp);
};

/** Pen-tip keyframes: along each line as it's written, then down to its checkbox for the tick. */
const PATH: [number, number, number][] = (() => {
  const k: [number, number, number][] = [];
  for (let i = 1; i < LAST; i++) {
    const base = rowY(i) + 52;
    k.push([startOf(i), TEXT_X, base], [startOf(i) + WRITE, TEXT_X + TASKS[i].length * ADV, base], [tickAt(i), 222, rowY(i) + 40], [tickAt(i) + 3, 232, rowY(i) + 20]);
  }
  k.push([startOf(LAST), TEXT_X, rowY(LAST) + 52]);
  return k;
})();

const tip = (f: number): [number, number] => {
  if (f >= startOf(LAST)) return [TEXT_X + written(LAST, f) * ADV, rowY(LAST) + 52];
  const x = interpolate(f, PATH.map((p) => p[0]), PATH.map((p) => p[1]), { ...clamp, easing: easeInOut });
  const y = interpolate(f, PATH.map((p) => p[0]), PATH.map((p) => p[2]), { ...clamp, easing: easeInOut });
  return [x, y];
};

/** 1 while a task is being written, easing to 0 over 3 frames either side (so the wiggle doesn't snap). */
const writing = (f: number) => {
  const spans: [number, number][] = [1, 2, 3, 4, 5].map((i) => [startOf(i), startOf(i) + WRITE]);
  spans.push([startOf(LAST), startOf(LAST) + TASKS[LAST].length * LAST_FRAMES_PER_CHAR]);
  return Math.max(0, ...spans.map(([a, b]) => interpolate(f, [a - 3, a, b, b + 3], [0, 1, 1, 0], clamp)));
};

/** Haruka's hand (assets/Haruka "hand-writing"); the pen tip is at (186, 328) in the image. */
const HAND_S = 0.522;
const Hand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 140, mass: 0.7 } });
  const [x, y] = tip(frame);
  // the pen only wiggles while a word is being written, not while it moves to a box or rests
  const scribble = Math.sin(frame * 2.6) * 3 * writing(frame);
  return <Img src={staticFile("sibuk/haruka/hand.png")} style={{ position: "absolute", left: x - 186 * HAND_S + (1 - enter) * 500, top: y - 328 * HAND_S + scribble + (1 - enter) * 400, width: 1286 * HAND_S, height: 1286 * HAND_S }} />;
};

/**
 * S7 · Daftar tugas: top-down close-up of the to-do list. "Proposal" was written first, at the top. The
 * hand keeps writing whatever came in next and ticks each one off straight away; Proposal's box stays
 * empty. On "Yang penting" the marker rings it.
 */
export const Daftar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nunggu = cue("daftar", "nunggu");
  const wait = frame >= nunggu ? 1 - spring({ frame: frame - nunggu, fps, config: { damping: 7, stiffness: 200, mass: 0.6 } }) : 0;
  const note = interpolate(frame, [cue("daftar", "penting") + 10, cue("daftar", "penting") + 18], [0, 1], { ...clamp, easing: easeOut });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: -40, top: -40, width: 1160, height: 1500, backgroundColor: c.paper }} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} style={{ position: "absolute", left: -40, top: 300 + 150 * i, width: 1160, height: 3, backgroundColor: c.rule }} />
      ))}
      <div style={{ position: "absolute", left: 130, top: -40, width: 4, height: 1500, backgroundColor: c.pink, opacity: 0.7 }} />
      {TASKS.map((task, i) => {
        const y = rowY(i);
        const chars = Math.floor(written(i, frame));
        if (chars <= 0 && i > 0) return null;
        const ticked = i > 0 && i < LAST && frame >= tickAt(i);
        const tick = ticked ? spring({ frame: frame - tickAt(i), fps, config: popSpring }) : 0;
        const strike = ticked ? interpolate(frame, [tickAt(i) + 1, tickAt(i) + 6], [0, 1], { ...clamp, easing: easeOut }) : 0;
        const isProposal = i === 0;
        return (
          <div key={task}>
            <div style={{ position: "absolute", left: 190, top: y + 12, width: 50, height: 50, borderRadius: 5, border: `6px solid ${isProposal && wait > 0.01 ? c.pink : c.ink}`, boxSizing: "border-box", scale: String(1 + (isProposal ? wait * 0.35 : 0)) }} />
            {ticked ? <p style={{ ...heavy, position: "absolute", left: 186, top: y - 22, fontSize: 84, lineHeight: 1.05, color: c.blue, opacity: Math.min(1, tick * 3), scale: String(0.4 + 0.6 * tick), transformOrigin: "30% 80%" }}>✓</p> : null}
            <p style={{ ...monoText, position: "absolute", left: TEXT_X, top: y, fontSize: SIZE, lineHeight: 1.25, color: isProposal ? c.pink : c.ink }}>{task.slice(0, chars)}</p>
            {strike > 0 ? <div style={{ position: "absolute", left: 270, top: y + 38, width: (task.length * ADV + 4) * strike, height: 6, backgroundColor: "rgba(28,26,34,0.75)" }} /> : null}
          </div>
        );
      })}
      <MarkerCircle at={cue("daftar", "penting")} x={150} y={160} w={640} h={180} dur={12} />
      <p style={{ ...monoText, position: "absolute", left: 790, top: 230, fontSize: 26, lineHeight: 1.25, color: c.pink, opacity: note, translate: `${20 * (1 - note)}px 0px` }}>← ditulis pertama</p>
      <Hand />
      <Band at={cue("daftar", "baru")} y={1290} h={800}>
        <BandText at={cue("daftar", "baru") + 6} x={64} y={1400} size={84}>
          {"Yang baru masuk\nselalu dapat\ngiliran pertama."}
        </BandText>
      </Band>
    </AbsoluteFill>
  );
};

/** Frames (scene-relative) where a task is written / ticked, for the pen sounds. */
export const PEN = {
  writes: [1, 2, 3, 4, 5].map(startOf),
  ticks: [1, 2, 3, 4, 5].map(tickAt),
  last: startOf(LAST),
};
