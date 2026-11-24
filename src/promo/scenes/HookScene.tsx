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
import { Aurora, Grain } from "../components/Backgrounds";
import { colors, easeOut, fontFamily } from "../theme";

type Look = "canvas" | "ink" | "aurora";

/** One word slammed onto the screen for a single beat. */
const SlamWord: React.FC<{
  readonly word: string;
  readonly look: Look;
  readonly tilt: number;
}> = ({ word, look, tilt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hit = spring({ frame, fps, config: { damping: 14, stiffness: 320, mass: 0.5 } });
  const color = look === "canvas" ? colors.ink : look === "ink" ? colors.canvas : "#ffffff";
  return (
    <AbsoluteFill
      style={{
        backgroundColor: look === "ink" ? colors.ink : colors.canvas,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {look === "aurora" ? <Aurora speed={3} /> : null}
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 260,
          letterSpacing: "-0.05em",
          color,
          scale: String(interpolate(hit, [0, 1], [1.7, 1])),
          rotate: `${interpolate(hit, [0, 1], [tilt, 0])}deg`,
          opacity: interpolate(frame, [0, 2], [0, 1], { extrapolateRight: "clamp" }),
          filter: `blur(${interpolate(hit, [0, 0.6], [14, 0], { extrapolateRight: "clamp" })}px)`,
        }}
      >
        {word}
      </div>
    </AbsoluteFill>
  );
};

/** "Cukup satu chat." builds letter by letter over the snare roll. */
const BuildLine: React.FC = () => {
  const frame = useCurrentFrame();
  const text = "Cukup satu chat.";
  const shown = Math.min(text.length, Math.floor(frame / 1.2) + 1);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.canvas,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Interactive.Div
        name="Build line"
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: 168,
          letterSpacing: "-0.05em",
          color: colors.ink,
          scale: interpolate(frame, [0, 24], [0.92, 1.12], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: easeOut,
          }),
        }}
      >
        {text.slice(0, shown)}
        <span
          style={{
            display: "inline-block",
            width: 14,
            height: 150,
            marginLeft: 10,
            verticalAlign: "-16px",
            background: "linear-gradient(180deg, #ff8a4c, #f06694, #8c5cff)",
            borderRadius: 7,
            opacity: frame % 6 < 4 ? 1 : 0,
          }}
        />
      </Interactive.Div>
    </AbsoluteFill>
  );
};

/** Two bars: six features slammed on the beat, then the build into the drop. */
export const HookScene: React.FC = () => {
  const { fps } = useVideoConfig();
  const beat = 0.4 * fps;
  return (
    <AbsoluteFill>
      <Track name="Hook words">
        <Sequence name="Pengingat" durationInFrames={beat}>
          <SlamWord word="Pengingat" look="canvas" tilt={-6} />
        </Sequence>
        <Sequence name="Catatan" from={beat} durationInFrames={beat}>
          <SlamWord word="Catatan" look="ink" tilt={5} />
        </Sequence>
        <Sequence name="Jadwal" from={2 * beat} durationInFrames={beat}>
          <SlamWord word="Jadwal" look="aurora" tilt={-4} />
        </Sequence>
        <Sequence name="File" from={3 * beat} durationInFrames={beat}>
          <SlamWord word="File" look="canvas" tilt={6} />
        </Sequence>
        <Sequence name="Kontak" from={4 * beat} durationInFrames={beat}>
          <SlamWord word="Kontak" look="ink" tilt={-5} />
        </Sequence>
        <Sequence name="Pengeluaran" from={5 * beat} durationInFrames={beat}>
          <SlamWord word="Pengeluaran" look="aurora" tilt={4} />
        </Sequence>
        <Sequence name="Build" from={6 * beat}>
          <BuildLine />
        </Sequence>
      </Track>
      <Grain />
    </AbsoluteFill>
  );
};
