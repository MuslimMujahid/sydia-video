import type React from "react";
import { AbsoluteFill, Freeze, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Grain, SoftCanvas } from "../../promo/components/Backgrounds";
import { Icon, SydiaMark } from "../../promo/components/Icons";
import { auroraGradient, colors, easeInOut, easeOut, fontFamily, textGradient } from "../../promo/theme";
import { CameraStage, type CamKey, Place } from "../components/Camera";
import { useFormat, useSq } from "../format";
import { ChipPill } from "../components/DesktopApp";
import { BAR, BEAT } from "../timeline";
import { clamp } from "../ui";
import { DESK_KEYS, DESK_LEN, DesktopAct, DesktopWorld, DotField, ROW_END, ROW_START } from "./DesktopAct";
import { PhoneAct } from "./PhoneAct";
import { VoiceAct } from "./VoiceAct";

// ------------------------------------------------------------------ shared
/** Glass chat composer used by the intro and outro. */
const GlassComposer: React.FC<{ readonly text: string; readonly caret: boolean; readonly pulse: number; readonly width?: number }> = ({ text, caret, pulse, width = 920 }) => (
  <div
    style={{
      width,
      height: 92,
      borderRadius: 46,
      backgroundColor: "rgba(255,255,255,0.92)",
      border: "1px solid rgba(23,20,25,0.06)",
      boxShadow: "0 40px 80px -30px rgba(140,92,255,0.45), 0 10px 30px -14px rgba(23,20,25,0.25)",
      display: "flex",
      alignItems: "center",
      gap: 20,
      padding: "0 16px 0 34px",
      fontFamily,
      fontSize: 32,
      color: text ? colors.ink : colors.muted,
    }}
  >
    <Icon name="clip" size={28} color={colors.muted} />
    <div style={{ flex: 1, whiteSpace: "nowrap" }}>
      {text || "Tulis pesan atau lampirkan file..."}
      {caret ? <span style={{ display: "inline-block", width: 3, height: 36, marginLeft: 2, verticalAlign: "-6px", backgroundColor: colors.brand }} /> : null}
    </div>
    <div style={{ width: 62, height: 62, borderRadius: 31, background: auroraGradient, display: "flex", alignItems: "center", justifyContent: "center", scale: String(1 - pulse * 0.25) }}>
      <Icon name="send" size={28} color="white" />
    </div>
  </div>
);

const typed = (frame: number, text: string, from: number, to: number) => text.slice(0, Math.ceil(interpolate(frame, [from, to], [0, text.length], clamp)));

export const Lockup: React.FC<{ readonly at: number; readonly size?: number; readonly cta?: boolean }> = ({ at, size = 180, cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 140, mass: 0.8 } });
  const word = (i: number) => spring({ frame: frame - at - 4 - i * 2, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
  const tag = interpolate(frame, [at + 14, at + 30], [0, 1], { ...clamp, easing: easeOut });
  if (frame < at) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", fontFamily, color: colors.ink }}>
      <div style={{ display: "flex", alignItems: "center", gap: size * 0.22 }}>
        <SydiaMark size={size} style={{ scale: String(logo), rotate: `${interpolate(logo, [0, 1], [-100, 0])}deg`, filter: "drop-shadow(0 30px 50px rgba(140,92,255,0.45))" }} />
        <div style={{ display: "flex", overflow: "hidden", paddingBottom: size * 0.12, fontSize: size, fontWeight: 800, letterSpacing: "-0.055em", lineHeight: 1 }}>
          {"Sydia".split("").map((c, i) => (
            <span key={i} style={{ display: "inline-block", translate: `0 ${(1 - word(i)) * 110}%` }}>
              {c}
            </span>
          ))}
        </div>
      </div>
      <div style={{ fontSize: size * 0.28, fontWeight: 500, color: colors.muted, marginTop: size * 0.12, opacity: tag, translate: `0 ${(1 - tag) * 24}px`, letterSpacing: "-0.015em" }}>Asisten pribadi yang selalu ingat.</div>
      {cta ? <Cta at={at} /> : null}
    </AbsoluteFill>
  );
};

/** Outro CTA beats, in outro-scene frames. */
export const CTA_GRATIS = 4 * BAR;
export const CTA_KOMEN = 4 * BAR + 3 * BEAT;
const KOMEN_WORDS = ["Komen", "MAU", "di", "komentar", "untuk", "mendapatkan", "akses"];

/** Button "Coba Sydia sekarang" -> "Gratis 7 hari", then it dissolves into the comment instruction. */
const Cta: React.FC<{ readonly at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const btn = spring({ frame: frame - at - 24, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  const g = interpolate(frame, [CTA_GRATIS - 4, CTA_GRATIS + 10], [0, 1], { ...clamp, easing: easeInOut });
  const pop = spring({ frame: frame - CTA_GRATIS - 4, fps, config: { damping: 9, stiffness: 260, mass: 0.5 } });
  const k = interpolate(frame, [CTA_KOMEN - 4, CTA_KOMEN + 8], [0, 1], { ...clamp, easing: easeInOut });
  const width = interpolate(g, [0, 1], [520, 360]);
  const bump = frame >= CTA_GRATIS ? 1 + Math.sin(Math.min(1, pop) * Math.PI) * 0.08 : 1;
  const label = (text: string, p: number) => (
    <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", translate: `0 ${p * 100}%`, opacity: 1 - Math.abs(p) }}>{text}</span>
  );
  return (
    <div style={{ position: "relative", width: 1500, height: 120, marginTop: 50 }}>
      {k < 1 ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width,
            height: 104,
            translate: "-50% -50%",
            scale: String(btn * bump * (1 - k * 0.5)),
            opacity: 1 - k,
            filter: k > 0 ? `blur(${k * 10}px)` : undefined,
            borderRadius: 28,
            overflow: "hidden",
            background: auroraGradient,
            color: "white",
            fontSize: 40,
            fontWeight: 700,
            boxShadow: "rgba(240,102,148,0.4) 0 24px 50px -16px, rgba(140,92,255,0.3) 0 14px 40px -12px",
          }}
        >
          {label("Coba Sydia sekarang", -g)}
          {label("Gratis 7 hari", 1 - g)}
        </div>
      ) : null}
      {frame >= CTA_KOMEN - 2 ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 52, fontWeight: 700, letterSpacing: "-0.03em", color: colors.ink, whiteSpace: "nowrap" }}>
          {KOMEN_WORDS.map((w, i) => {
            const p = spring({ frame: frame - CTA_KOMEN - (i === 1 ? 8 : i * 2), fps, config: { damping: i === 1 ? 10 : 16, stiffness: 200, mass: 0.6 } });
            const mau = i === 1;
            return (
              <span
                key={w}
                style={{
                  display: "inline-block",
                  opacity: Math.min(1, p),
                  translate: `0 ${(1 - p) * 30}px`,
                  filter: p < 1 ? `blur(${Math.max(0, 1 - p) * 6}px)` : undefined,
                  ...(mau
                    ? { scale: String(0.6 + p * 0.4), fontWeight: 900, fontSize: 60, padding: "0 6px", backgroundImage: textGradient, WebkitBackgroundClip: "text", color: "transparent" }
                    : {}),
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------------ intro
const INTRO_TEXT = "Hai Sydia, bantu atur hariku ya";
const INTRO_KEYS: CamKey[] = [
  { f: 0, x: 0, y: 0, dolly: -500, rx: 22, ry: -26 },
  { f: 70, x: 0, y: 0, dolly: 140, rx: 8, ry: -8 },
  { f: 100, x: 0, y: -40, dolly: 0, rx: 2, ry: 4 },
  { f: 2 * BAR + BEAT, x: 0, y: -60, dolly: 260, rx: 0, ry: 0 },
];

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const SEND = 80;
  const text = frame < SEND ? typed(frame, INTRO_TEXT, 16, SEND - 8) : "";
  const pulse = interpolate(frame, [SEND - 2, SEND, SEND + 6], [0, 1, 0], clamp);
  const bubble = spring({ frame: frame - SEND, fps, config: { damping: 15, stiffness: 160, mass: 0.7 } });
  const composerOut = interpolate(frame, [SEND + 6, SEND + 20], [0, 1], { ...clamp, easing: easeInOut });
  const bubbleOut = interpolate(frame, [96, 110], [0, 1], { ...clamp, easing: easeInOut });
  const sq = useSq();
  // The square canvas is narrower and taller: pull the chips in and spread them up and down.
  const spread = { x: sq(1, 0.62), y: sq(1, 1.5) };
  const chips = [
    { kind: "note" as const, label: "Catatan", x: -720, y: -330, z: -200 },
    { kind: "task" as const, label: "Tugas", x: 700, y: -300, z: -120 },
    { kind: "file" as const, label: "File", x: -640, y: 330, z: -60 },
    { kind: "note" as const, label: "Kalender", x: 720, y: 320, z: -260 },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
      <SoftCanvas glow={1} />
      <CameraStage keys={INTRO_KEYS} drift={0.8}>
        <DotField />
        {chips.map((c, i) => {
          const p = spring({ frame: frame - 98 - i * 4, fps, config: { damping: 13, stiffness: 160, mass: 0.6 } });
          return (
            <Place key={c.label} x={c.x * spread.x * (0.4 + p * 0.6)} y={c.y * spread.y * (0.4 + p * 0.6) + Math.sin(frame / 20 + i) * 10} z={c.z} opacity={Math.min(1, p)} scale={1.6}>
              <ChipPill chip={c} />
            </Place>
          );
        })}
        <Place y={60 + composerOut * 200} z={-composerOut * 300} opacity={1 - composerOut}>
          <GlassComposer text={text} caret={frame < SEND && frame % 14 < 8} pulse={pulse} />
        </Place>
        {frame >= SEND ? (
          <Place x={140} y={interpolate(bubble, [0, 1], [60, -40]) - bubbleOut * 260} z={bubbleOut * -400} opacity={Math.min(1, bubble) * (1 - bubbleOut)}>
            <div style={{ padding: "22px 32px", borderRadius: 30, backgroundColor: "#f1efef", fontFamily, fontSize: 34, color: "#5a5560", whiteSpace: "nowrap", boxShadow: "0 20px 50px -24px rgba(23,20,25,0.35)" }}>{INTRO_TEXT}</div>
          </Place>
        ) : null}
        <Place y={-40} z={40}>
          <div style={{ width: 1920, height: 600, position: "relative" }}>
            <Lockup at={100} size={170} />
          </div>
        </Place>
      </CameraStage>
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ bridge
export const BRIDGE_LEN = 2 * BAR;
const last = DESK_KEYS[DESK_KEYS.length - 1];
const ROW_IN: readonly [number, number] = [0, 22];
const GLIDE: readonly [number, number] = [16, 104];
const PUSH: readonly [number, number] = [92, 116];
const glideX = (f: number) => interpolate(f, GLIDE, [ROW_START, ROW_END + 300], { ...clamp, easing: easeInOut });
const BRIDGE_KEYS: CamKey[] = [
  { ...last, f: 0 },
  { f: GLIDE[0], x: glideX(GLIDE[0]), y: 0, dolly: 0, rx: 0, ry: 0 },
  ...Array.from({ length: 12 }, (_, i) => {
    const f = GLIDE[0] + ((i + 1) * (GLIDE[1] - GLIDE[0])) / 12;
    return { f, x: glideX(f), y: 0, dolly: 0, rx: 0, ry: 0, ease: (t: number) => t };
  }),
  { f: BRIDGE_LEN, x: glideX(BRIDGE_LEN), y: 0, dolly: 0, rx: 0, ry: 0 },
];

/** Glass pill caption that sits over the overview without hiding much of it. */
const BridgePill: React.FC<{ readonly from: number; readonly to: number; readonly children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - from, fps, config: { damping: 18, stiffness: 160, mass: 0.7 } });
  const out = interpolate(frame, [to - 12, to], [0, 1], { ...clamp, easing: easeInOut });
  if (frame < from - 1 || frame > to) return null;
  return (
    <div style={{ position: "absolute", left: "50%", bottom: 26, translate: `-50% ${(1 - p) * 40 - out * 20}px`, opacity: Math.min(1, p) * (1 - out) }}>
      <div style={{ padding: "16px 40px 20px", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(14px)", boxShadow: "0 24px 60px -24px rgba(23,20,25,0.45)", whiteSpace: "nowrap", fontSize: 54, fontWeight: 800, letterSpacing: "-0.04em", color: colors.ink }}>{children}</div>
    </div>
  );
};

/** Big stacked headline in the open sky left of the phone (below it on the square canvas), as the doors part. */
const SideHeadline: React.FC<{ readonly from: number; readonly to: number; readonly title: string; readonly accent: string }> = ({ from, to, title, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: frame - from, fps, config: { damping: 16, stiffness: 200, mass: 0.6 } });
  const b = spring({ frame: frame - from - 5, fps, config: { damping: 16, stiffness: 200, mass: 0.6 } });
  const out = interpolate(frame, [to - 12, to], [0, 1], { ...clamp, easing: easeInOut });
  const { square } = useFormat();
  if (frame < from - 1 || frame > to) return null;
  const place: React.CSSProperties = square
    ? { left: "50%", bottom: 60, width: "max-content", translate: `-50% ${-out * 30}px`, fontSize: 80, textAlign: "center" }
    : { left: 110, top: "50%", translate: `0 calc(-50% - ${out * 30}px)`, fontSize: 92 };
  return (
    <div style={{ position: "absolute", ...place, opacity: 1 - out, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.04 }}>
      <div style={{ overflow: "hidden", paddingBottom: 8 }}>
        <div style={{ color: colors.ink, translate: `0 ${(1 - a) * 110}%`, whiteSpace: "pre-line" }}>{title}</div>
      </div>
      <div style={{ overflow: "hidden", paddingBottom: 8 }}>
        <div style={{ color: "#16a34a", translate: `0 ${(1 - b) * 110}%` }}>{accent}</div>
      </div>
    </div>
  );
};

/**
 * Breather: the desktop windows line up in a face-on cover-flow row and the camera glides
 * through them (files → chat → tasks → calendar), each one flat and large as it passes.
 * The glide carries on into a push that brings in the phone scene in the exact pose the
 * WhatsApp act starts from.
 */
export const BridgeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const row = interpolate(frame, ROW_IN, [0, 1], clamp);
  const push = interpolate(frame, PUSH, [0, 1], { ...clamp, easing: easeInOut });
  const sq = useSq();
  // The camera's actual x (keyframes above sample glideX); used to pose the cover-flow.
  const camX = frame < GLIDE[0] ? interpolate(frame, [0, GLIDE[0]], [last.x, glideX(GLIDE[0])], { ...clamp, easing: easeInOut }) : glideX(frame);
  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {push < 1 ? (
        <AbsoluteFill style={{ translate: `${-push * 100}% 0` }}>
          <SoftCanvas glow={0.9} />
          <CameraStage keys={BRIDGE_KEYS} drift={0}>
            <Freeze frame={DESK_LEN - 1}>
              <DesktopWorld row={row} camX={camX} />
            </Freeze>
          </CameraStage>
          <BridgePill from={28} to={92}>
            Dengan antarmuka <span style={{ backgroundImage: textGradient, WebkitBackgroundClip: "text", color: "transparent" }}>yang terintegrasi.</span>
          </BridgePill>
        </AbsoluteFill>
      ) : null}
      {push > 0 ? (
        <AbsoluteFill style={{ translate: `${(1 - push) * 100}% 0` }}>
          <Freeze frame={0}>
            <PhoneAct />
          </Freeze>
          <SideHeadline from={100} to={BRIDGE_LEN - 2} title={sq("Lagi jauh dari\nlaptop?", "Lagi jauh dari laptop?")} accent="WhatsApp." />
        </AbsoluteFill>
      ) : null}
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ outro
export const OUTRO_LEN = 6 * BAR;

type Shot = { readonly act: "desk" | "phone" | "voice" | "chat"; readonly src: number; readonly len: number };
/**
 * Final-chorus montage of real moments, cut on the beat: four desktop shots on quarter
 * notes (bar 38), then the phone day and voice note on eighth notes (bar 39), landing
 * on the web chat, held through the final chord, then the logo as the coda starts (bar 41). `src` is the act-local frame each shot
 * starts from; the acts' own corner captions label every shot.
 */
const SHOTS: Shot[] = [
  { act: "desk", src: 204, len: BEAT }, // note panel
  { act: "desk", src: 444, len: BEAT }, // task board
  { act: "desk", src: 716, len: BEAT }, // calendar drop
  { act: "desk", src: 962, len: BEAT }, // files
  { act: "phone", src: 146, len: BEAT / 2 }, // daily brief
  { act: "phone", src: 354, len: BEAT / 2 }, // free slots
  { act: "phone", src: 592, len: BEAT / 2 }, // reminder at 15.00
  { act: "phone", src: 741, len: BEAT / 2 }, // file sent
  { act: "phone", src: 1036, len: BEAT / 2 }, // memory
  { act: "voice", src: 252, len: BEAT / 2 }, // expense card
  { act: "chat", src: DESK_LEN - 1, len: 5 * BEAT }, // the whole web chat, face-on, held until the final chord has rung out
];
const SHOT_AT = SHOTS.map((_, i) => SHOTS.slice(0, i).reduce((n, sh) => n + sh.len, 0));
export const MONTAGE_END = SHOT_AT[SHOTS.length - 1] + SHOTS[SHOTS.length - 1].len;

/** The full web chat window, face-on, with a slow push-in. */
const ChatShot: React.FC<{ readonly src: number; readonly len: number }> = ({ src, len }) => (
  <>
    <SoftCanvas glow={1} />
    <CameraStage
      keys={[
        { f: 0, x: 0, y: 0, dolly: -330, rx: 0, ry: 0 },
        { f: len, x: 0, y: 0, dolly: -130, rx: 0, ry: 0, ease: (t) => t },
      ]}
      drift={0}
    >
      <Freeze frame={src}>
        <DesktopWorld />
      </Freeze>
    </CameraStage>
  </>
);

const ShotView: React.FC<{ readonly shot: Shot; readonly start: number }> = ({ shot, start }) => {
  const frame = useCurrentFrame();
  const t = (frame - start) / shot.len;
  if (shot.act === "chat") {
    return (
      <Sequence from={start} layout="none">
        <AbsoluteFill>
          <ChatShot src={shot.src} len={shot.len} />
        </AbsoluteFill>
      </Sequence>
    );
  }
  const Act = shot.act === "desk" ? DesktopAct : shot.act === "phone" ? PhoneAct : VoiceAct;
  return (
    <AbsoluteFill style={{ scale: String(interpolate(t, [0, 1], [1.06, 1], { ...clamp, easing: easeOut })) }}>
      <Sequence from={start - shot.src} layout="none">
        <Act />
      </Sequence>
    </AbsoluteFill>
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const i = SHOT_AT.findIndex((f, k) => frame >= f && frame < f + SHOTS[k].len);
  // Soft flashes on the desktop -> phone downbeat and on the logo downbeat.
  const flash = Math.max(interpolate(frame, [0, 10], [0.8, 0], clamp), interpolate(frame, [BAR - 1, BAR, BAR + 6], [0, 0.5, 0], clamp), interpolate(frame, [MONTAGE_END - 1, MONTAGE_END, MONTAGE_END + 10], [0, 0.9, 0], clamp));
  return (
    <AbsoluteFill style={{ fontFamily, backgroundColor: colors.canvas }}>
      <SoftCanvas glow={1} />
      {i >= 0 ? <ShotView shot={SHOTS[i]} start={SHOT_AT[i]} /> : null}
      <Lockup at={MONTAGE_END} size={170} cta />
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};
