import type React from "react";
import {
  AbsoluteFill,
  Interactive,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Grain, SoftCanvas } from "../components/Backgrounds";
import { Icon, type IconName } from "../components/Icons";
import { cardShadow, colors, easeOut, fontFamily } from "../theme";

/** One feature tile; pops on its beat and glows while it is spotlighted. */
const Tile: React.FC<{
  readonly index: number;
  readonly icon: IconName;
  readonly title: string;
  readonly body: string;
}> = ({ index, icon, title, body }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = 0.4 * fps;
  const pop = spring({ frame: frame - (index + 1) * beat, fps, config: { damping: 12, stiffness: 230, mass: 0.6 } });
  // Spotlight runs through the tiles one per beat once they have all landed.
  const spotBeat = Math.floor(frame / beat) - 7;
  const lit = spotBeat === index ? Math.exp(-(frame % beat) / 8) : 0;
  return (
    <div
      style={{
        position: "relative",
        padding: 4,
        borderRadius: 34,
        background: `linear-gradient(135deg, rgba(255,178,122,${lit}) 0%, rgba(240,102,148,${lit}) 45%, rgba(140,92,255,${lit}) 100%)`,
        opacity: pop,
        scale: String(interpolate(pop, [0, 1], [0.4, 1]) + lit * 0.05),
        rotate: `${interpolate(pop, [0, 1], [index % 2 ? 14 : -14, 0])}deg`,
        translate: `0 ${interpolate(pop, [0, 1], [140, 0])}px`,
      }}
    >
      <div
        style={{
          height: 250,
          borderRadius: 30,
          backgroundColor: colors.surface,
          border: "1px solid rgba(23,20,25,0.06)",
          boxShadow: cardShadow,
          padding: "36px 38px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 22,
            background: "linear-gradient(135deg, #ffb27a 0%, #f06694 45%, #8c5cff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "rgba(240,102,148,0.35) 0 14px 28px -12px",
          }}
        >
          <Icon name={icon} size={40} color="white" />
        </div>
        <div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em" }}>{title}</div>
          <div style={{ fontSize: 26, color: colors.muted, marginTop: 6, fontWeight: 500 }}>{body}</div>
        </div>
      </div>
    </div>
  );
};

/** Everything Sydia handles, one tile per beat. */
export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <SoftCanvas glow={0.8} />
      <AbsoluteFill
        style={{
          fontFamily,
          color: colors.ink,
          padding: "110px 120px 0",
          scale: String(interpolate(frame, [84, 156], [1, 1.06], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })),
        }}
      >
        <Interactive.Div
          name="Features headline"
          style={{
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: "-0.045em",
            textAlign: "center",
            opacity: interpolate(frame, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            scale: interpolate(frame, [0, 12], [1.3, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: easeOut,
            }),
          }}
        >
          Satu asisten. Semua urusan.
        </Interactive.Div>
        <div
          style={{
            marginTop: 64,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 36,
          }}
        >
          <Tile index={0} icon="calendar" title="Kalender" body="Jadwal & tugas sekali pandang" />
          <Tile index={1} icon="notes" title="Catatan" body="Catatan harian & folder rapi" />
          <Tile index={2} icon="file" title="File" body="Baca & ringkas dokumen Anda" />
          <Tile index={3} icon="bell" title="Pengingat" body="Tepat waktu, tanpa lupa" />
          <Tile index={4} icon="users" title="Kontak" body="Kenal orang-orang terdekat" />
          <Tile index={5} icon="lock" title="Rahasia" body="Data sensitif tersimpan aman" />
        </div>
      </AbsoluteFill>
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};
