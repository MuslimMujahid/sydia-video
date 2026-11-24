import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { cue, SCENES as S } from "../timeline";
import { clamp, easeInOut } from "../theme";
import { Strip } from "./Paper";

/** Minutes since midnight → "16.47". */
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}.${String(Math.floor(m % 60)).padStart(2, "0")}`;
const t = (s: string) => {
  const [h, m] = s.split(".").map(Number);
  return h * 60 + m;
};

/** The clock: [global frame, time, frames it rolls over to get there]. Rolls show time passing (or rewinding). */
const CLOCK: [number, string, number][] = [
  [0, "16.47", 0],
  [S.pagi.from + 2, "09.02", 16], // rewind
  [S.cek.from, "09.31", 6],
  [S.meeting.from, "10.15", 4],
  [S.email.from, "11.40", 4],
  [S.revisi.from, "13.20", 4],
  [S.chat.from, "14.55", 4],
  [S.hening.from + 6, "16.47", 22], // the afternoon slips by in the silence
];

/** The "SEBENTAR ×n" counter: [global frame, n]. 0 hides it. */
const COUNT: [number, number][] = [
  [0, 0],
  [S.pagi.from + cue("pagi", "chat") + 18, 1],
  [S.cek.from + 52, 2], // as she sends "Oke, bentar ya"
  [S.meeting.from, 3],
  [S.email.from - 6, 4],
  [S.email.from, 5],
  [S.revisi.from - 6, 6],
  [S.revisi.from, 7],
  [S.chat.from, 8],
  [S.puncak.from + 22, 9], // the last notification lands
];

/** Clock and "sebentar" counter, pinned to the top of the frame across scenes (hidden on the to-do list close-up). */
export const Hud: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame >= S.daftar.from && frame < S.cta.from) return null;

  let ci = 0;
  CLOCK.forEach((k, i) => {
    if (frame >= k[0]) ci = i;
  });
  const [at, value, roll] = CLOCK[ci];
  const prev = ci > 0 ? t(CLOCK[ci - 1][1]) : t(value);
  const minutes = roll > 0 ? interpolate(frame, [at, at + roll], [prev, t(value)], { ...clamp, easing: easeInOut }) : t(value);
  const rolling = roll > 0 && frame < at + roll;

  let ni = 0;
  COUNT.forEach((k, i) => {
    if (frame >= k[0]) ni = i;
  });
  const [nAt, n] = COUNT[ni];
  const pop = spring({ frame: frame - nAt, fps, config: { damping: 10, stiffness: 260, mass: 0.5 } });
  const first = ni > 0 && COUNT[ni - 1][1] === 0;
  // in the silence the counter stops and washes out
  const washed = interpolate(frame, [S.hening.from, S.hening.from + 20], [1, 0.45], clamp);
  const showCount = n > 0 && frame < S.daftar.from;

  return (
    <>
      <Strip tone="orange" x={56} y={96} w={409} h={122} textStyle={{ left: 56, top: 22, fontSize: 60, translate: rolling ? `${Math.sin(frame * 2.1) * 2}px 0px` : undefined }}>
        {hhmm(minutes)}
      </Strip>
      {showCount ? (
        <Strip tone="pink" x={600} y={100} w={430} h={118} style={{ opacity: washed * Math.min(1, first ? pop * 3 : 1), scale: String(first ? 0.6 + 0.4 * pop : 1 + 0.12 * (1 - pop)), rotate: `${(1 - pop) * (first ? -8 : 3)}deg`, transformOrigin: "60% 50%" }} textStyle={{ left: 44, top: 30, fontSize: 48 }}>
          SEBENTAR ×{n}
        </Strip>
      ) : null}
    </>
  );
};
