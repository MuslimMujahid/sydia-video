import type React from "react";
import type { CSSProperties } from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { c, clamp, easeOut, heavy, monoText, popSpring, slamSpring } from "../theme";

const paper = (name: string) => staticFile(`sibuk/paper/${name}.png`);

/** The storyboard's riso paper: a cream grain texture, tiled down the 9:16 frame. */
export const Grain: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#f2ede1" }}>
    <Img src={paper("grain")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080 }} />
    <Img src={paper("grain")} style={{ position: "absolute", left: 0, top: 1080, width: 1080, height: 1080 }} />
  </AbsoluteFill>
);

/**
 * Riso headline: blue ink over a pink misprint. On `at` it is "printed": it slams down from a little
 * larger with the pink plate badly out of register, and the plates snap together.
 */
export const Riso: React.FC<{ at: number; x: number; y: number; size: number; lh?: number; color?: string; mis?: string; slam?: boolean; kick?: number; style?: CSSProperties; children: React.ReactNode }> = ({ at, x, y, size, lh = 1, color = c.blue, mis = c.pink, slam = false, kick, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: slam ? slamSpring : popSpring });
  // `kick`: the line is re-inked when Haruka says it (the pink plate jumps out of register and snaps back)
  const k = kick === undefined || frame < kick ? 0 : 1 - spring({ frame: frame - kick, fps, config: slamSpring });
  const off = 6 + (1 - s) * 22 + k * 16;
  const text = { ...heavy, fontSize: size, lineHeight: lh, position: "absolute", left: 0, top: 0 } as const;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: Math.min(1, s * 2.5), scale: String((slam ? 1.25 : 1.08) - (slam ? 0.25 : 0.08) * s), transformOrigin: "0% 50%", ...style }}>
      <p style={{ ...text, color: mis, translate: `${off}px ${off * 0.8}px` }}>{children}</p>
      <p style={{ ...text, position: "relative", color }}>{children}</p>
    </div>
  );
};

/** A plain ink line of the headline (the lead-in above a Riso line). */
export const Lead: React.FC<{ at: number; x: number; y: number; size: number; color?: string; children: React.ReactNode }> = ({ at, x, y, size, color = c.ink, children }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 8], [0, 1], { ...clamp, easing: easeOut });
  if (frame < at) return null;
  return <p style={{ ...heavy, position: "absolute", left: x, top: y, fontSize: size, lineHeight: 1.05, color, opacity: t, translate: `0px ${14 * (1 - t)}px` }}>{children}</p>;
};

/** A torn riso strip (the clock is orange, the "SEBENTAR" counter pink) with white type. */
export const Strip: React.FC<{ tone: "orange" | "pink"; x: number; y: number; w: number; h: number; style?: CSSProperties; children: React.ReactNode; textStyle?: CSSProperties }> = ({ tone, x, y, w, h, style, children, textStyle }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, ...style }}>
    <Img src={paper(tone === "orange" ? "strip-orange" : "strip-pink")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    <div style={{ ...heavy, position: "absolute", color: c.white, lineHeight: 1.05, ...textStyle }}>{children}</div>
  </div>
);

/**
 * A torn white speech bubble (tail bottom-left) holding a chat line in Space Mono. It pops out of its
 * tail on `at`.
 */
export const Bubble: React.FC<{ at: number; x: number; y: number; w: number; h: number; size: number; pad?: [number, number]; tilt?: number; children: React.ReactNode }> = ({ at, x, y, w, h, size, pad = [46, 42], tilt = 0, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: popSpring });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: Math.min(1, s * 3), scale: String(0.5 + 0.5 * s), rotate: `${tilt * (2 - s)}deg`, transformOrigin: "12% 100%" }}>
      <Img src={paper("bubble")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <p style={{ ...monoText, position: "absolute", left: pad[0], top: pad[1], fontSize: size, lineHeight: 1.25 }}>{children}</p>
    </div>
  );
};

/** The torn blue riso band the storyboard uses for punchlines and the CTA. It tears up from the bottom on `at`. */
export const Band: React.FC<{ at: number; y: number; h: number; children?: React.ReactNode }> = ({ at, y, h, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 160, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, translate: `0px ${(1 - s) * (1920 - y + 40)}px` }}>
      <Img src={paper("band-blue")} style={{ position: "absolute", left: -121, top: y, width: 1322, height: h }} />
      {children}
    </div>
  );
};

/** White type on the band; each line rises in after the band lands. */
export const BandText: React.FC<{ at: number; x: number; y: number; size: number; lh?: number; children: React.ReactNode }> = ({ at, x, y, size, lh = 1.02, children }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 9], [0, 1], { ...clamp, easing: easeOut });
  return <p style={{ ...heavy, position: "absolute", left: x, top: y, fontSize: size, lineHeight: lh, color: c.white, opacity: t, translate: `0px ${20 * (1 - t)}px` }}>{children}</p>;
};

/** The pink marker ellipse, drawn on clockwise from the left over `dur` frames. */
export const MarkerCircle: React.FC<{ at: number; x: number; y: number; w: number; h: number; dur?: number }> = ({ at, x, y, w, h, dur = 12 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + dur], [0, 360], { ...clamp, easing: easeOut });
  if (frame < at) return null;
  const mask = `conic-gradient(from 250deg, #000 ${t}deg, transparent ${t}deg)`;
  return <Img src={paper("marker-circle")} style={{ position: "absolute", left: x, top: y, width: w, height: h, maskImage: mask, WebkitMaskImage: mask }} />;
};
