import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Aurora, Grain } from "../components/Backgrounds";
import { SydiaMark } from "../components/Icons";
import { fontFamily } from "../theme";

/** Expanding ring fired on every kick. */
const Shockwaves: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = 0.4 * fps;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const local = frame - i * beat;
        if (local < 0 || local > 30) return null;
        const p = local / 30;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 420,
              height: 420,
              borderRadius: "50%",
              border: `${interpolate(p, [0, 1], [i === 0 ? 40 : 10, 1])}px solid rgba(255,255,255,0.8)`,
              scale: String(interpolate(p, [0, 1], [0.6, i === 0 ? 5 : 3.2], { easing: Easing.out(Easing.cubic) })),
              opacity: interpolate(p, [0, 1], [i === 0 ? 0.9 : 0.35, 0]),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Wordmark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", overflow: "hidden", paddingBottom: 20 }}>
      {"Sydia".split("").map((ch, i) => {
        const s = spring({ frame: frame - 6 - i * 2, fps, config: { damping: 14, stiffness: 260, mass: 0.6 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              translate: `0 ${interpolate(s, [0, 1], [110, 0])}%`,
              rotate: `${interpolate(s, [0, 1], [12, 0])}deg`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** The drop: logo slams in over a living aurora. */
export const LogoDropScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = 0.4 * fps;
  const logoIn = spring({ frame, fps, config: { damping: 11, stiffness: 180, mass: 0.7 } });
  const kick = Math.exp(-(frame % beat) / 3);
  return (
    <AbsoluteFill>
      <Aurora speed={2.5} />
      <Shockwaves />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          scale: String(1 + kick * 0.025 + frame * 0.0012),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 56,
            fontFamily,
            fontWeight: 800,
            fontSize: 250,
            letterSpacing: "-0.055em",
            color: "white",
            lineHeight: 1,
          }}
        >
          <SydiaMark
            size={250}
            style={{
              scale: String(logoIn),
              rotate: `${interpolate(logoIn, [0, 1], [-120, 0])}deg`,
              filter: "drop-shadow(0 30px 60px rgba(60,10,80,0.45))",
            }}
          />
          <Wordmark />
        </div>
        <Interactive.Div
          name="Drop tagline"
          style={{
            fontFamily,
            fontWeight: 600,
            fontSize: 58,
            color: "white",
            letterSpacing: "-0.02em",
            marginTop: 30,
            textShadow: "0 6px 30px rgba(60,10,80,0.35)",
            opacity: interpolate(frame, [2 * beat, 3 * beat], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [2 * beat, 3 * beat], ["0px 40px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          Asisten pribadi untuk keseharian Anda.
        </Interactive.Div>
      </AbsoluteFill>
      <Grain opacity={0.28} />
    </AbsoluteFill>
  );
};
