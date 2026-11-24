import { evolvePath, getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
import type React from "react";
import type { CSSProperties } from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { c, clamp, easeOut, heavy, monoText, popSpring, slamSpring, tape } from "../theme";

const paper = (name: string) => staticFile(`sibuk/paper/${name}.png`);

/**
 * A torn riso strip with white type that is slapped down on `at`: it lands from a little larger and
 * tilted, so the eye goes to it. Before `at` it isn't drawn; pass a negative `at` for a strip that is
 * already there.
 */
export const Slap: React.FC<{ at: number; tone: "orange" | "pink"; x: number; y: number; w: number; h: number; size: number; pad: [number, number]; tilt?: number; style?: CSSProperties; children: React.ReactNode }> = ({ at, tone, x, y, w, h, size, pad, tilt = -4, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: slamSpring });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: Math.min(1, s * 3), scale: String(1.3 - 0.3 * s), rotate: `${tilt * (1 - s)}deg`, ...style }}>
      <Img src={paper(tone === "orange" ? "strip-orange" : "strip-pink")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <p style={{ ...heavy, position: "absolute", left: pad[0], top: pad[1], fontSize: size, lineHeight: 1.25, color: c.white }}>{children}</p>
    </div>
  );
};

/** A strip of masking tape, pressed on at `at` (it drops in from above its spot). */
export const Tape: React.FC<{ at: number; x: number; y: number; w: number; h: number; rot: number }> = ({ at, x, y, w, h, rot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: popSpring });
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, backgroundColor: tape, opacity: 0.85 * Math.min(1, s * 2), rotate: `${rot}deg`, scale: String(1.25 - 0.25 * s), boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }} />;
};

/**
 * An ink line drawn on from `at` over `dur` frames (storyboard paths). With `arrow`, a triangle arrowhead
 * rides the tip of the line, so the eye follows the drawing.
 */
export const Draw: React.FC<{ d: string; at: number; dur: number; color?: string; width?: number; arrow?: boolean; ease?: boolean }> = ({ d, at, dur, color = c.ink, width = 10, arrow = false, ease = true }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: ease ? easeOut : undefined });
  if (p <= 0) return null;
  const { strokeDasharray, strokeDashoffset } = evolvePath(p, d);
  let head: React.ReactNode = null;
  if (arrow) {
    const L = getLength(d) * p;
    const tip = getPointAtLength(d, L);
    const tan = getTangentAtLength(d, L) ?? { x: 1, y: 0 };
    if (!tip) return null;
    const a = (Math.atan2(tan.y, tan.x) * 180) / Math.PI;
    head = <polygon points="12,0 -26,-21 -26,21" fill={color} transform={`translate(${tip.x} ${tip.y}) rotate(${a})`} />;
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
      {head}
    </svg>
  );
};

/** A blue riso dot with a paper-white ring, popped on at `at`. `x`/`y` is its centre. */
export const Dot: React.FC<{ at: number; x: number; y: number; r?: number }> = ({ at, x, y, r = 18 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: popSpring });
  return <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: r, backgroundColor: c.blue, border: "5px solid #fffdf8", boxSizing: "content-box", translate: "-5px -5px", scale: String(s) }} />;
};

/**
 * Space Mono text typed on from `at` to `end` (the untyped rest is laid out but invisible, so lines
 * don't reflow). Used for chat lines and the definition.
 */
export const Typed: React.FC<{ at: number; end: number; x: number; y: number; size: number; lh?: number; color?: string; children: string }> = ({ at, end, x, y, size, lh = 1.3, color = c.ink, children }) => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [at, end], [0, children.length], clamp));
  if (frame < at) return null;
  return (
    <p style={{ ...monoText, position: "absolute", left: x, top: y, fontSize: size, lineHeight: lh, color }}>
      {children.slice(0, n)}
      <span style={{ opacity: 0 }}>{children.slice(n)}</span>
    </p>
  );
};

/** A small line of text (labels, notes) that fades and rises in on `at`. */
export const Label: React.FC<{ at: number; x: number; y: number; size: number; mono?: boolean; lh?: number; color?: string; style?: CSSProperties; children: React.ReactNode }> = ({ at, x, y, size, mono = true, lh = 1.25, color = c.ink, style, children }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const t = interpolate(frame, [at, at + 7], [0, 1], { ...clamp, easing: easeOut });
  return <p style={{ ...(mono ? monoText : heavy), position: "absolute", left: x, top: y, fontSize: size, lineHeight: lh, color, opacity: t, translate: `0px ${12 * (1 - t)}px`, ...style }}>{children}</p>;
};

/**
 * A torn white speech bubble (tail bottom-left, or bottom-right with `flip`) that pops out of its tail
 * on `at`. The content is placed by the caller, relative to the bubble.
 */
export const Bubble: React.FC<{ at: number; x: number; y: number; w: number; h: number; flip?: boolean; tilt?: number; children: React.ReactNode }> = ({ at, x, y, w, h, flip = false, tilt = 0, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: popSpring });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: Math.min(1, s * 3), scale: String(0.5 + 0.5 * s), rotate: `${tilt * (2 - s)}deg`, transformOrigin: flip ? "88% 100%" : "12% 100%" }}>
      <Img src={paper("bubble")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", scale: flip ? "-1 1" : undefined }} />
      {children}
    </div>
  );
};

/** A number that rolls from `from` to `to` between frames `at` and `at + dur`. */
export const useRoll = (from: number, to: number, at: number, dur: number) => {
  const frame = useCurrentFrame();
  return Math.round(interpolate(frame, [at, at + dur], [from, to], { ...clamp, easing: easeOut }));
};
