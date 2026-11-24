import type React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { colors } from "../theme";

const grainSvg =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>\")";

/** Film grain that re-seeds every two frames, matching the Aurora Haze texture. */
export const Grain: React.FC<{ readonly opacity?: number }> = ({
  opacity = 0.18,
}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: grainSvg,
        backgroundSize: "240px 240px",
        backgroundPosition: `${Math.round(random(`x${seed}`) * 240)}px ${Math.round(random(`y${seed}`) * 240)}px`,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

/** Full-bleed drifting aurora: amber into coral into violet. */
export const Aurora: React.FC<{ readonly speed?: number }> = ({
  speed = 1,
}) => {
  const frame = useCurrentFrame() * speed;
  const x1 = 12 + Math.sin(frame / 40) * 10;
  const y1 = 88 - Math.cos(frame / 50) * 10;
  const x2 = 88 - Math.sin(frame / 45) * 12;
  const y2 = 12 + Math.cos(frame / 38) * 10;
  const x3 = 55 + Math.sin(frame / 30) * 14;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 90% 70% at ${x1}% ${y1}%, #ff8a4c 0%, transparent 55%), radial-gradient(ellipse 70% 80% at ${x2}% ${y2}%, #c47bff 0%, transparent 55%), radial-gradient(ellipse 50% 60% at ${x3}% 50%, #ff6b9b 0%, transparent 60%), linear-gradient(135deg, #ffb27a 0%, #f06694 45%, #8c5cff 100%)`,
      }}
    />
  );
};

/** Bone-white canvas with soft aurora glows bleeding in from the corners. */
export const SoftCanvas: React.FC<{ readonly glow?: number }> = ({
  glow = 0.55,
}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 35) * 6;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
      <AbsoluteFill
        style={{
          opacity: glow,
          background: `radial-gradient(circle at ${92 + drift}% ${8 - drift}%, rgba(196,123,255,0.45) 0%, transparent 32%), radial-gradient(circle at ${6 - drift}% ${96 + drift}%, rgba(255,138,76,0.40) 0%, transparent 34%), radial-gradient(circle at 80% 100%, rgba(240,102,148,0.30) 0%, transparent 30%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Dark ink stage with a pulsing aurora bloom behind the subject. */
export const InkStage: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 30) * 5;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 45% 55% at ${70 + drift}% 55%, rgba(240,102,148,0.55) 0%, transparent 70%), radial-gradient(ellipse 35% 45% at ${85 - drift}% 25%, rgba(140,92,255,0.5) 0%, transparent 70%), radial-gradient(ellipse 35% 40% at 55% 90%, rgba(255,138,76,0.4) 0%, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};
