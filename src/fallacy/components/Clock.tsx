import type React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { c, clamp, easeInOut, heavy } from "../theme";
import { SCENES as S } from "../timeline";

/** Minutes past 13.00 → "13.47". */
const hhmm = (m: number) => `13.${String(Math.floor(m)).padStart(2, "0")}`;

/** [global frame, minutes past 13.00, frames the clock rolls over to get there]. */
const CLOCK: [number, number, number][] = [
  [S.chat.from, 0, 0],
  [S.s2a.from, 2, 6],
  [S.s2b.from, 25, 10],
  [S.s2c.from, 47, 10],
];

/**
 * The orange clock strip (top-left, S1b–S3; the hook/cover screen has none). On each montage cut it rolls forward to the new time and
 * kicks, so the jump from 13.02 to 13.47 reads at a glance.
 */
export const Clock: React.FC = () => {
  const frame = useCurrentFrame() + S.chat.from; // the clock's Sequence starts at S1b; CLOCK uses global frames
  const { fps } = useVideoConfig();
  let i = 0;
  CLOCK.forEach(([f], k) => {
    if (frame >= f) i = k;
  });
  const [f, to, roll] = CLOCK[i];
  const prev = i > 0 ? CLOCK[i - 1][1] : to;
  const m = roll ? interpolate(frame, [f, f + roll], [prev, to], { ...clamp, easing: easeInOut }) : to;
  const kick = i > 0 ? 1 - spring({ frame: frame - f - roll, fps, config: { damping: 10, stiffness: 260, mass: 0.5 } }) : 0;
  return (
    <div style={{ position: "absolute", left: 56, top: 96, width: 409, height: 122, scale: String(1 + Math.max(0, kick) * 0.08), rotate: `${Math.max(0, kick) * -3}deg` }}>
      <Img src={staticFile("sibuk/paper/strip-orange.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <p style={{ ...heavy, position: "absolute", left: 50, top: 22, fontSize: 60, lineHeight: 1.25, color: c.white, fontVariantNumeric: "tabular-nums" }}>{hhmm(m)}</p>
    </div>
  );
};
