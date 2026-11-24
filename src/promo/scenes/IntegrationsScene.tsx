import type React from "react";
import {
  AbsoluteFill,
  Img,
  Interactive,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Grain, SoftCanvas } from "../components/Backgrounds";
import { SydiaMark } from "../components/Icons";
import { colors, easeInOut, easeOut, fontFamily } from "../theme";

const CX = 960;
const CY = 610;

/** A connected service: a line draws out from Sydia, then its badge pops. */
const Node: React.FC<{
  readonly at: number;
  readonly angle: number;
  readonly src: string;
  readonly label: string;
}> = ({ at, angle, src, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const radius = 500;
  const spin = interpolate(frame, [0, 108], [0, 20], { easing: easeInOut });
  const a = ((angle + spin) * Math.PI) / 180;
  const x = CX + Math.cos(a) * radius;
  const y = CY + Math.sin(a) * radius * 0.6;
  const draw = interpolate(frame, [at, at + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const pop = spring({ frame: frame - at - 6, fps, config: { damping: 11, stiffness: 240, mass: 0.6 } });
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`g${angle}`} x1={CX} y1={CY} x2={x} y2={y} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f06694" />
            <stop offset="100%" stopColor="#8c5cff" />
          </linearGradient>
        </defs>
        <line
          x1={CX}
          y1={CY}
          x2={CX + (x - CX) * draw}
          y2={CY + (y - CY) * draw}
          stroke={`url(#g${angle})`}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray="2 16"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: x - 90,
          top: y - 90,
          width: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          scale: String(pop),
        }}
      >
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: 48,
            backgroundColor: "white",
            boxShadow: "rgba(23,20,25,0.06) 0 2px 4px, rgba(140,92,255,0.25) 0 30px 60px -20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Img src={staticFile(src)} style={{ width: 92, height: 92 }} />
        </div>
        <div style={{ fontFamily, fontSize: 32, fontWeight: 700, color: colors.ink, whiteSpace: "nowrap" }}>
          {label}
        </div>
      </div>
    </>
  );
};

/** Sydia meets you where you already chat; the build-up before the final drop. */
export const IntegrationsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = 0.4 * fps;
  const logo = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const build = interpolate(frame, [0, 8 * beat], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });
  // Follows the snare roll: quarter notes, then 8ths, then 16ths into the drop.
  const pulseStep = frame < 4 * beat ? beat : frame < 6 * beat ? beat / 2 : beat / 4;
  const pulse = Math.exp(-(frame % pulseStep) / 3) * build;
  return (
    <AbsoluteFill>
      <SoftCanvas glow={0.6 + build * 0.6} />
      <AbsoluteFill style={{ scale: String(1 + build * 0.12) }}>
        <Interactive.Div
          name="Integrations headline"
          style={{
            position: "absolute",
            top: 110,
            width: "100%",
            textAlign: "center",
            fontFamily,
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: "-0.045em",
            color: colors.ink,
            opacity: interpolate(frame, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            translate: interpolate(frame, [0, 14], ["0px -60px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: easeOut,
            }),
          }}
        >
          Hadir di aplikasi favorit Anda.
        </Interactive.Div>
        <Node at={beat} angle={180} src="brands/whatsapp.svg" label="WhatsApp" />
        <Node at={2 * beat} angle={-30} src="brands/telegram.svg" label="Telegram" />
        <Node at={3 * beat} angle={30} src="brands/google-calendar.svg" label="Google Calendar" />
        <div
          style={{
            position: "absolute",
            left: CX - 130,
            top: CY - 130,
            width: 260,
            height: 260,
            borderRadius: 80,
            backgroundColor: "white",
            boxShadow: `rgba(240,102,148,${0.3 + pulse * 0.5}) 0 0 ${60 + pulse * 80}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            scale: String(logo * (1 + pulse * 0.08)),
          }}
        >
          <SydiaMark size={170} />
        </div>
      </AbsoluteFill>
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};
