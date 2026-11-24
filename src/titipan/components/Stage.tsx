import type React from "react";
import type { CSSProperties } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { c, clamp, easeIn, easeOut, heavy, OUT, popSpring } from "../theme";

/** The storyboard's warm canvas: cream with a peach glow top-right and a lilac glow bottom-left. */
export const Backdrop: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: c.canvas, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 620, top: -260, width: 720, height: 720, borderRadius: "50%", backgroundColor: c.peach, opacity: 0.45, filter: "blur(140px)" }} />
    <div style={{ position: "absolute", left: -300, top: 620, width: 760, height: 760, borderRadius: "50%", backgroundColor: c.lilac, opacity: 0.28, filter: "blur(160px)" }} />
  </AbsoluteFill>
);

/** Clears a scene's content over its last OUT frames (lifts and fades), so the next scene starts on a clean canvas. */
export const SceneOut: React.FC<{ len: number; children: React.ReactNode }> = ({ len, children }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [len - OUT, len], [0, 1], { ...clamp, easing: easeIn });
  return <AbsoluteFill style={{ opacity: 1 - t, translate: `0px ${-24 * t}px` }}>{children}</AbsoluteFill>;
};

/** Fades and rises its children in at `at`. */
export const Rise: React.FC<{ at: number; dy?: number; dur?: number; style?: CSSProperties; children: React.ReactNode }> = ({ at, dy = 18, dur = 10, style, children }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
  return <div style={{ position: "absolute", ...style, opacity: t * (style?.opacity === undefined ? 1 : Number(style.opacity)), translate: `0px ${dy * (1 - t)}px` }}>{children}</div>;
};

/** Pops its children in at `at` with a spring, scaling from `origin`. */
export const Pop: React.FC<{ at: number; from?: number; origin?: string; style?: CSSProperties; children: React.ReactNode }> = ({ at, from = 0.4, origin = "50% 50%", style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: popSpring });
  if (frame < at) return null;
  return <div style={{ position: "absolute", ...style, opacity: Math.min(1, s * 2), scale: String(from + (1 - from) * s), transformOrigin: origin }}>{children}</div>;
};

/** The big coloured numeral and headline that open the four "poin" scenes. */
export const PointHeader: React.FC<{ n: string; color: string; ink?: string; children: React.ReactNode }> = ({ n, color, ink = c.ink, children }) => (
  <>
    <Pop at={2} from={0.6} origin="30% 80%" style={{ left: 56, top: 18 }}>
      <p style={{ ...heavy, fontSize: 210, lineHeight: 1, color }}>{n}</p>
    </Pop>
    <Rise at={6} style={{ left: 200, top: 70, width: 820 }}>
      <p style={{ ...heavy, fontSize: 50, lineHeight: 1.12, color: ink }}>{children}</p>
    </Rise>
  </>
);
