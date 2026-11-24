import type React from "react";
import {
  AbsoluteFill,
  Interactive,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Grain, InkStage } from "../components/Backgrounds";
import { Icon, SydiaMark } from "../components/Icons";
import { colors, easeOut, fontFamily, textGradient } from "../theme";

const rupiah = (n: number) => `Rp${Math.round(n).toLocaleString("id-ID")}`;

const Row: React.FC<{
  readonly at: number;
  readonly label: string;
  readonly amount: number;
  readonly tag: string;
  readonly tagColor: string;
  readonly tagBg: string;
}> = ({ at, label, amount, tag, tagColor, tagBg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 240, mass: 0.6 } });
  const chip = spring({ frame: frame - at - 6, fps, config: { damping: 11, stiffness: 260, mass: 0.5 } });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "22px 0",
        borderBottom: "1px solid rgba(23,20,25,0.07)",
        opacity: s,
        translate: `${interpolate(s, [0, 1], [120, 0])}px 0`,
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 600, flex: 1 }}>{label}</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          borderRadius: 999,
          backgroundColor: tagBg,
          color: tagColor,
          fontSize: 20,
          fontWeight: 600,
          scale: String(chip),
        }}
      >
        <Icon name={tag === "Gaya Hidup" ? "star" : "wallet"} size={18} color={tagColor} />
        {tag}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, width: 170, textAlign: "right" }}>{rupiah(amount)}</div>
    </div>
  );
};

/** Expense tracking from one chat message, with categories and a running total. */
export const ExpenseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = 0.4 * fps;
  const bubble = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 240, mass: 0.6 } });
  const card = spring({ frame: frame - 2 * beat, fps, config: { damping: 15, stiffness: 160, mass: 0.8 } });
  const total = interpolate(frame, [5 * beat, 5 * beat + 22], [0, 51000], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const saved = spring({ frame: frame - 8 * beat, fps, config: { damping: 12, stiffness: 220 } });
  const kick = Math.exp(-(frame % beat) / 3);

  return (
    <AbsoluteFill>
      <InkStage />
      <AbsoluteFill style={{ padding: "0 0 0 120px", justifyContent: "center", fontFamily }}>
        <div style={{ width: 660 }}>
          <Interactive.Div
            name="Expense headline 1"
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
              color: colors.canvas,
              opacity: interpolate(frame, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              translate: interpolate(frame, [0, 14], ["0px 80px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: easeOut,
              }),
            }}
          >
            Catat pengeluaran
          </Interactive.Div>
          <Interactive.Div
            name="Expense headline 2"
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
              marginTop: 8,
              paddingBottom: 12,
              backgroundImage: textGradient,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              opacity: interpolate(frame, [8, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              translate: interpolate(frame, [8, 22], ["0px 80px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: easeOut,
              }),
            }}
          >
            semudah kirim pesan.
          </Interactive.Div>
          <div
            style={{
              marginTop: 50,
              display: "inline-block",
              padding: "22px 30px",
              borderRadius: 28,
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: colors.canvas,
              fontSize: 34,
              lineHeight: 1.4,
              opacity: bubble,
              scale: String(interpolate(bubble, [0, 1], [0.7, 1])),
              transformOrigin: "0% 100%",
            }}
          >
            catat 32000 makan siang
            <br />
            dan 19000 kopi
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-end", paddingRight: 120 }}>
        <div
          style={{
            width: 860,
            padding: "40px 48px 44px",
            borderRadius: 34,
            backgroundColor: colors.canvas,
            fontFamily,
            color: colors.ink,
            boxShadow: "rgba(0,0,0,0.4) 0 60px 120px -40px",
            opacity: card,
            scale: String(interpolate(card, [0, 1], [0.8, 1]) + kick * 0.008 * card),
            rotate: `${interpolate(card, [0, 1], [8, -2])}deg`,
            translate: `${interpolate(card, [0, 1], [300, 0])}px 0`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <SydiaMark size={44} />
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", flex: 1 }}>
              Catatan Pengeluaran
            </div>
            <div style={{ fontSize: 22, color: colors.muted, fontWeight: 500 }}>6 Nov 2026</div>
          </div>
          <Row at={3 * beat} label="Makan siang" amount={32000} tag="Kebutuhan Wajib" tagColor="#047857" tagBg="#d1fae5" />
          <Row at={4 * beat} label="Kopi" amount={19000} tag="Gaya Hidup" tagColor="#be123c" tagBg="#ffe4e6" />
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 30 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 24, color: colors.muted, fontWeight: 500 }}>Total hari ini</div>
              <div
                style={{
                  fontSize: 104,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  backgroundImage: textGradient,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {rupiah(total)}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                borderRadius: 999,
                backgroundColor: colors.ink,
                color: colors.canvas,
                fontSize: 22,
                fontWeight: 600,
                marginBottom: 22,
                scale: String(saved),
              }}
            >
              <Icon name="check" size={20} color={colors.canvas} strokeWidth={3} />
              Tersimpan
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <Grain opacity={0.2} />
    </AbsoluteFill>
  );
};
