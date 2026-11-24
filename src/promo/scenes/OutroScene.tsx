import type React from "react";
import {
  AbsoluteFill,
  Interactive,
  interpolate,
  Sequence,
  spring,
  Track,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Aurora, Grain, SoftCanvas } from "../components/Backgrounds";
import { SydiaMark } from "../components/Icons";
import { auroraGradient, colors, easeOut, fontFamily } from "../theme";

/** Words stack up one per beat, each landing with a hard spring. */
const BeatWords: React.FC<{ readonly words: string[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = 0.4 * fps;
  const kick = Math.exp(-(frame % beat) / 3);
  return (
    <AbsoluteFill>
      <Aurora speed={3} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          fontFamily,
          fontWeight: 800,
          fontSize: 190,
          letterSpacing: "-0.055em",
          lineHeight: 1.0,
          color: "white",
          textShadow: "0 10px 50px rgba(70,10,90,0.3)",
          scale: String(1 + kick * 0.02),
        }}
      >
        {words.map((w, i) => {
          const s = spring({ frame: frame - i * beat, fps, config: { damping: 13, stiffness: 300, mass: 0.5 } });
          return (
            <div
              key={w}
              style={{
                opacity: frame >= i * beat ? 1 : 0,
                scale: String(interpolate(s, [0, 1], [1.8, 1])),
                filter: `blur(${interpolate(s, [0, 0.7], [12, 0], { extrapolateRight: "clamp" })}px)`,
              }}
            >
              {w}
            </div>
          );
        })}
      </AbsoluteFill>
      <Grain opacity={0.28} />
    </AbsoluteFill>
  );
};

/** Final hit: logo lock-up and call to action. */
const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 11, stiffness: 160, mass: 0.8 } });
  const cta = spring({ frame: frame - 14, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  const flash = interpolate(frame, [0, 10], [1, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <SoftCanvas glow={1} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          fontFamily,
          color: colors.ink,
          scale: String(interpolate(frame, [0, 96], [1, 1.04])),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            fontSize: 190,
            fontWeight: 800,
            letterSpacing: "-0.055em",
            lineHeight: 1,
            scale: String(interpolate(logo, [0, 1], [0.6, 1])),
            opacity: logo,
          }}
        >
          <SydiaMark size={190} style={{ rotate: `${interpolate(logo, [0, 1], [-90, 0])}deg` }} />
          Sydia
        </div>
        <Interactive.Div
          name="End tagline"
          style={{
            fontSize: 52,
            fontWeight: 500,
            color: colors.muted,
            marginTop: 30,
            letterSpacing: "-0.015em",
            opacity: interpolate(frame, [8, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            translate: interpolate(frame, [8, 20], ["0px 30px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: easeOut,
            }),
          }}
        >
          Asisten pribadi untuk keseharian Anda.
        </Interactive.Div>
        <div
          style={{
            marginTop: 64,
            padding: "30px 64px",
            borderRadius: 26,
            background: auroraGradient,
            color: "white",
            fontSize: 48,
            fontWeight: 700,
            boxShadow: "rgba(240,102,148,0.4) 0 24px 50px -16px, rgba(140,92,255,0.3) 0 14px 40px -12px",
            scale: String(cta),
          }}
        >
          Coba Sydia sekarang
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
      <Grain opacity={0.14} />
    </AbsoluteFill>
  );
};

/** Second drop: the promise in big type, then the end card on the final hit. */
export const OutroScene: React.FC = () => {
  const { fps } = useVideoConfig();
  const beat = 0.4 * fps;
  return (
    <Track name="Outro">
      <Sequence name="Sampaikan melalui chat" durationInFrames={4 * beat}>
        <BeatWords words={["Sampaikan", "melalui", "chat."]} />
      </Sequence>
      <Sequence name="Sydia yang urus sisanya" from={4 * beat} durationInFrames={4 * beat}>
        <BeatWords words={["Sydia", "yang urus", "sisanya."]} />
      </Sequence>
      <Sequence name="End card" from={8 * beat}>
        <EndCard />
      </Sequence>
    </Track>
  );
};
