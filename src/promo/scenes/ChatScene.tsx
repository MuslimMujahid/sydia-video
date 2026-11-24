import type React from "react";
import {
  AbsoluteFill,
  Interactive,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AppWindow, Composer } from "../components/AppWindow";
import { Grain, SoftCanvas } from "../components/Backgrounds";
import { Icon, SydiaMark } from "../components/Icons";
import { colors, easeOut, fontFamily, textGradient } from "../theme";

const PROMPT = "Ingatkan aku bayar listrik Jumat jam 9 pagi.";
const REPLY = "Siap, pengingat bayar listrik untuk Jumat pukul 09.00 sudah dibuat.";

const TYPE_START = 20;
const TYPE_END = 66;
const SEND = 72;
const THINK = 84;
const REPLY_START = 104;
const CARD = 132;

const TypingDots: React.FC<{ readonly frame: number }> = ({ frame }) => (
  <div style={{ display: "flex", gap: 8, padding: "18px 0" }}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: colors.brand,
          translate: `0 ${Math.sin((frame - i * 3) / 2.2) * -6}px`,
          opacity: 0.5 + 0.5 * Math.max(0, Math.sin((frame - i * 3) / 2.2)),
        }}
      />
    ))}
  </div>
);

const ChatPane: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const typed = Math.floor(
    interpolate(frame, [TYPE_START, TYPE_END], [0, PROMPT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const sent = frame >= SEND;
  const sendPulse = interpolate(frame, [SEND - 2, SEND, SEND + 5], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bubble = spring({ frame: frame - SEND, fps, config: { damping: 14, stiffness: 240, mass: 0.6 } });
  const words = REPLY.split(" ");
  const wordsShown = Math.floor(
    interpolate(frame, [REPLY_START, REPLY_START + 20], [0, words.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const card = spring({ frame: frame - CARD, fps, config: { damping: 12, stiffness: 200, mass: 0.7 } });
  const check = spring({ frame: frame - CARD - 10, fps, config: { damping: 10, stiffness: 260 } });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        padding: "36px 48px 34px",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 26 }}>
        {sent ? (
          <div
            style={{
              alignSelf: "flex-end",
              maxWidth: 500,
              padding: "18px 24px",
              borderRadius: 26,
              backgroundColor: "#f1efef",
              fontSize: 25,
              lineHeight: 1.45,
              scale: String(interpolate(bubble, [0, 1], [0.7, 1])),
              translate: `0 ${interpolate(bubble, [0, 1], [70, 0])}px`,
              opacity: bubble,
              transformOrigin: "100% 100%",
            }}
          >
            {PROMPT}
          </div>
        ) : null}
        {frame >= THINK ? (
          <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
            <SydiaMark size={40} style={{ marginTop: 6 }} />
            <div style={{ flex: 1 }}>
              {frame < REPLY_START ? (
                <TypingDots frame={frame} />
              ) : (
                <div style={{ fontSize: 25, lineHeight: 1.5, maxWidth: 560, paddingTop: 8 }}>
                  {words.slice(0, wordsShown).join(" ")}
                </div>
              )}
              {frame >= CARD ? (
                <div
                  style={{
                    marginTop: 22,
                    width: 470,
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    padding: "22px 24px",
                    borderRadius: 22,
                    backgroundColor: "white",
                    border: "1px solid rgba(23,20,25,0.07)",
                    boxShadow: "rgba(23,20,25,0.05) 0 1px 2px, rgba(240,102,148,0.25) 0 24px 50px -20px",
                    scale: String(interpolate(card, [0, 1], [0.6, 1])),
                    opacity: card,
                    transformOrigin: "0% 0%",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 18,
                      background: "linear-gradient(135deg, #ffb27a 0%, #f06694 45%, #8c5cff 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      rotate: `${Math.sin(Math.max(0, frame - CARD) / 2) * Math.exp(-Math.max(0, frame - CARD) / 10) * 18}deg`,
                    }}
                  >
                    <Icon name="bell" size={32} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>Bayar listrik</div>
                    <div style={{ fontSize: 19, color: colors.muted, marginTop: 4 }}>
                      Jumat, 09.00 · Pengingat
                    </div>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.emerald,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      scale: String(check),
                    }}
                  >
                    <Icon name="check" size={24} color="white" strokeWidth={3} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      <Composer
        text={sent ? "" : PROMPT.slice(0, typed)}
        caret={!sent && frame >= TYPE_START - 6 && frame % 10 < 6}
        sendPulse={sendPulse}
      />
    </div>
  );
};

/** "Ngobrol seperti biasa" — a reminder created from one casual sentence. */
export const ChatScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 120, mass: 0.9 } });
  return (
    <AbsoluteFill>
      <SoftCanvas />
      <AbsoluteFill style={{ padding: "0 0 0 120px", justifyContent: "center" }}>
        <div style={{ width: 680, fontFamily }}>
          <Interactive.Div
            name="Chat headline 1"
            style={{
              fontSize: 92,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
              color: colors.ink,
              opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              translate: interpolate(frame, [0, 14], ["-80px 0px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: easeOut,
              }),
            }}
          >
            Ngobrol
            <br />
            seperti biasa,
          </Interactive.Div>
          <Interactive.Div
            name="Chat headline 2"
            style={{
              fontSize: 92,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
              marginTop: 10,
              paddingBottom: 12,
              backgroundImage: textGradient,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              opacity: interpolate(frame, [12, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              translate: interpolate(frame, [12, 26], ["-80px 0px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: easeOut,
              }),
            }}
          >
            tanpa instruksi
            <br />
            rumit.
          </Interactive.Div>
          <Interactive.Div
            name="Chat subline"
            style={{
              fontSize: 40,
              fontWeight: 500,
              lineHeight: 1.35,
              color: colors.muted,
              marginTop: 34,
              opacity: interpolate(frame, [28, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              translate: interpolate(frame, [28, 40], ["0px 30px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: easeOut,
              }),
            }}
          >
            Sampaikan melalui chat, Sydia yang urus sisanya.
          </Interactive.Div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ perspective: 2200 }}>
        <AppWindow
          width={960}
          height={760}
          style={{
            position: "absolute",
            left: 800,
            top: 160,
            transformOrigin: "0% 50%",
            rotate: `0 1 0 ${interpolate(enter, [0, 1], [-38, -6])}deg`,
            translate: `${interpolate(enter, [0, 1], [500, 0])}px ${interpolate(frame, [0, 200], [10, -10])}px`,
            scale: String(interpolate(frame, [CARD, CARD + 60], [1, 1.03], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut })),
            opacity: interpolate(enter, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <ChatPane />
        </AppWindow>
      </AbsoluteFill>
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};
