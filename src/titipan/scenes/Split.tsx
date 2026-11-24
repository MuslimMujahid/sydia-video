import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Haruka } from "../components/Haruka";
import { Rise, SceneOut } from "../components/Stage";
import { POSES } from "../poses";
import { c, clamp, easeInOut, easeOut, hand, heavy, OUT } from "../theme";
import { cue, len } from "../timeline";

/** The split-screen halves open from the seam outward: left (pink, the past) and right (lilac, "later"). */
const Half: React.FC<{ side: "left" | "right"; at: number; children?: React.ReactNode }> = ({ side, at, children }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 14], [100, 0], { ...clamp, easing: easeInOut });
  const clip = side === "left" ? `inset(0 0 0 ${t}%)` : `inset(0 ${t}% 0 0)`;
  return (
    <div style={{ position: "absolute", top: 0, left: side === "left" ? 0 : 540, width: 540, height: 1080, clipPath: clip }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: side === "left" ? c.splitPink : c.splitLilac }} />
      <div style={{ position: "absolute", top: 0, left: side === "left" ? 0 : -540, width: 1080, height: 1080 }}>{children}</div>
    </div>
  );
};

/** The dashed seam, drawn top → bottom. */
const Seam: React.FC<{ at: number; y0: number; y1: number }> = ({ at, y0, y1 }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [at, at + 14], [y0, y1], { ...clamp, easing: easeOut });
  return (
    <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
      {frame >= at && <line x1={540} y1={y0} x2={540} y2={y} stroke={c.ink} strokeOpacity={0.25} strokeWidth={3} strokeDasharray="10 10" strokeLinecap="round" />}
    </svg>
  );
};

/** «« rewind: memories of what already happened. */
const Rewind: React.FC<{ x: number; y: number; w: number; h: number; gap: number; stroke: number }> = ({ x, y, w, h, gap, stroke }) => (
  <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
    {[0, gap].map((dx) => <path key={dx} d={`M${x + dx + w},${y} L${x + dx},${y + h / 2} L${x + dx + w},${y + h}`} fill="none" stroke={c.pink} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />)}
  </svg>
);

/** A clock: remembering to do something later. */
const Clock: React.FC<{ cx: number; cy: number; r: number; hands: string; stroke: number }> = ({ cx, cy, r, hands, stroke }) => (
  <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={c.violet} strokeWidth={stroke} />
    <path d={hands} fill="none" stroke={c.violet} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const kicker = { ...heavy, fontSize: 22, lineHeight: 1.25, letterSpacing: 2 } as const;
const title = { ...heavy, fontSize: 46, lineHeight: 1.1 } as const;
const example = { ...hand, fontSize: 32, lineHeight: 1.15, rotate: "-2deg", transformOrigin: "0 50%" } as const;

/** "cuma beda “mode” aja:", written in left → right. */
const Handwrite: React.FC<{ at: number; children: React.ReactNode; style: React.CSSProperties }> = ({ at, children, style }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 16], [100, 0], { ...clamp, easing: easeOut });
  return <div style={{ position: "absolute", ...style, clipPath: `inset(-20px ${t}% -20px -10px)` }}>{children}</div>;
};

/** The flash behind the lightbulb in Haruka's "idea" pose. */
const BulbFlash: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 3, at + 8, at + 11, at + 26], [0, 1, 0.35, 0.9, 0], clamp);
  return <div style={{ position: "absolute", left: x - 80, top: y - 80, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,214,90,0.85) 0%, rgba(255,214,90,0) 70%)", opacity: o }} />;
};

const L3 = len("modes");

/**
 * S3 · Two modes of remembering. After "Tenang, bukan berarti ingatanmu jelek." the seam draws
 * and the screen splits: Mode 1 (rewind, pink) opens on "Dua kejadian", Mode 2 (clock, violet)
 * follows, and Haruka's idea pose lands on "mode".
 */
export const Modes: React.FC = () => {
  const dua = cue("modes", "dua");
  const mode = cue("modes", "mode");
  const left = dua + 12;
  const right = mode - 16;
  const H = { x: 532, top: 592, scale: 1.15 };
  const bulb = POSES.lightbulb;
  return (
    <>
      <SceneOut len={L3}>
        <Half side="left" at={left}>
          <Rewind x={92} y={290} w={40} h={64} gap={50} stroke={9} />
          <p style={{ ...kicker, position: "absolute", left: 72, top: 386, color: c.pink }}>MODE 1</p>
          <p style={{ ...title, position: "absolute", left: 72, top: 420, width: 420 }}>Ingat yang sudah terjadi</p>
          <p style={{ ...example, position: "absolute", left: 72, top: 525, color: c.pink }}>kayak momen memalukan itu</p>
        </Half>
        <Half side="right" at={right}>
          <Clock cx={642} cy={322} r={38} hands="M642,300 L642,324 L662,334" stroke={7} />
          <p style={{ ...kicker, position: "absolute", left: 604, top: 386, color: c.violet }}>MODE 2</p>
          <p style={{ ...title, position: "absolute", left: 604, top: 420, width: 420 }}>Ingat yang harus dikerjakan nanti</p>
          <p style={{ ...example, position: "absolute", left: 604, top: 527, color: c.violet }}>kayak titipan telur</p>
        </Half>
        <Seam at={dua} y0={250} y1={1080} />
        <Rise at={0} style={{ left: 72, top: 64, width: 936 }}>
          <p style={{ ...heavy, fontSize: 54, lineHeight: 1.12 }}>
            Tenang, <span style={{ color: c.pink }}>bukan</span> berarti ingatanmu jelek.
          </p>
        </Rise>
        <Handwrite at={dua} style={{ left: 72, top: 214 }}>
          <p style={{ ...hand, fontSize: 36, lineHeight: 1.15, color: c.muted, rotate: "-2deg", whiteSpace: "nowrap" }}>cuma beda “mode” aja:</p>
        </Handwrite>
        <Rise at={right + 6} dy={8} style={{ left: 512, top: 300 }}>
          <p style={{ ...hand, fontSize: 56, lineHeight: 1.15, color: c.ink }}>vs</p>
        </Rise>
        <BulbFlash at={mode} x={H.x + (0.15 * bulb.w - bulb.cx) * H.scale} y={H.top + (0.12 * bulb.h - bulb.top) * H.scale} />
      </SceneOut>
      <Haruka steps={[{ pose: "reassuring", at: 0 }, { pose: "lightbulb", at: mode }]} {...H} enter={4} exit={L3 - OUT} />
    </>
  );
};

const L8 = len("summary");

/** The halves' backgrounds alone, opening at `at` (S8 opens both at once as a callback). */
const Tints: React.FC<{ at: number }> = ({ at }) => (
  <>
    <Half side="left" at={at} />
    <Half side="right" at={at} />
  </>
);

/**
 * S8 · Intinya. Callback to S3's split: the halves open from the seam, "Intinya:" lands, then
 * the left ("Yang emosional nempel sendiri") and right ("Yang “nanti” perlu dibantu") wipe in on the voice.
 */
export const Summary: React.FC = () => {
  const kiri = cue("summary", "kiri");
  const kanan = cue("summary", "kanan");
  const line = { ...heavy, fontSize: 50, lineHeight: 1.1, textAlign: "center", width: 460 } as const;
  return (
    <SceneOut len={L8}>
      <Tints at={0} />
      <Seam at={4} y0={490} y1={890} />
      <Rise at={cue("summary", "intinya")} style={{ left: 0, top: 340, width: 1080 }}>
        <p style={{ ...heavy, fontSize: 60, lineHeight: 1.25, textAlign: "center" }}>Intinya:</p>
      </Rise>
      <Wipe at={kiri} side="left">
        <Rewind x={206} y={510} w={44} h={72} gap={56} stroke={10} />
        <p style={{ ...line, position: "absolute", left: 40, top: 630 }}>Yang emosional</p>
        <p style={{ ...line, position: "absolute", left: 40, top: 690, color: c.pink }}>nempel sendiri</p>
      </Wipe>
      <Wipe at={kanan} side="right">
        <Clock cx={810} cy={546} r={42} hands="M810,522 L810,548 L832,558" stroke={8} />
        <p style={{ ...line, position: "absolute", left: 580, top: 630 }}>Yang “nanti”</p>
        <p style={{ ...line, position: "absolute", left: 580, top: 690, color: c.violet }}>perlu dibantu</p>
      </Wipe>
    </SceneOut>
  );
};

/** Content wiping in from the seam outward. */
const Wipe: React.FC<{ at: number; side: "left" | "right"; children: React.ReactNode }> = ({ at, side, children }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: easeOut });
  const hidden = (1 - t) * 100;
  const clip = side === "left" ? `inset(0 0 0 ${hidden}%)` : `inset(0 ${hidden}% 0 0)`;
  return (
    <div style={{ position: "absolute", top: 0, left: side === "left" ? 0 : 540, width: 540, height: 1080, clipPath: clip, opacity: t }}>
      <div style={{ position: "absolute", top: 0, left: side === "left" ? 0 : -540, width: 1080, height: 1080, translate: `${(side === "left" ? 1 : -1) * 30 * (1 - t)}px 0px` }}>{children}</div>
    </div>
  );
};

