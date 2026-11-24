import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Haruka } from "../components/Haruka";
import { PointHeader, Rise, SceneOut } from "../components/Stage";
import { c, clamp, easeInOut, easeOut, hand, heavy, OUT } from "../theme";
import { cue, len } from "../timeline";

const L = len("spotlight");

/** The stage light: it clicks on (with a flicker) on "fokus" and burns brighter on "diperkuat". */
const Light: React.FC<{ on: number; boost: number }> = ({ on, boost }) => {
  const frame = useCurrentFrame();
  if (frame < on) return null;
  const flicker = interpolate(frame - on, [0, 1, 3, 4, 7], [0, 1, 0.35, 1, 1], clamp);
  const more = interpolate(frame, [boost, boost + 24], [0, 1], { ...clamp, easing: easeInOut });
  return (
    <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: flicker }}>
      <defs>
        <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.spot} stopOpacity={0.55 + 0.3 * more} />
          <stop offset="1" stopColor={c.spot} stopOpacity={0.12 + 0.1 * more} />
        </linearGradient>
      </defs>
      <ellipse cx={770} cy={692} rx={230} ry={42} fill={c.spot} fillOpacity={0.28 + 0.14 * more} />
      <path d="M748,262 L792,262 L990,690 L550,690 Z" fill="url(#cone)" />
      <ellipse cx={770} cy={261} rx={26} ry={11} fill={c.spot} />
    </svg>
  );
};

/** "momen memalukan" under the light; it glows as the memory is strengthened. */
const Lit: React.FC<{ boost: number }> = ({ boost }) => {
  const frame = useCurrentFrame();
  const more = interpolate(frame, [boost, boost + 24], [0, 1], { ...clamp, easing: easeInOut });
  return <p style={{ ...heavy, fontSize: 44, lineHeight: 1.25, textAlign: "center", color: "#fff", whiteSpace: "nowrap", scale: String(1 + 0.06 * more), textShadow: `0 0 ${28 * more}px rgba(255,231,163,${0.9 * more})` }}>momen memalukan</p>;
};

/** The details outside the light: they surface faintly on "selektif", then sink back into the dark. */
const DETAILS = [
  { text: "baju apa?", x: 560, y: 321, rot: -4 },
  { text: "jam berapa?", x: 898, y: 360, rot: 3 },
  { text: "siapa yang lihat?", x: 830, y: 770, rot: -2 },
  { text: "habis itu ngapain?", x: 559, y: 790, rot: 2 },
];

const Detail: React.FC<{ at: number; fade: number; text: string; x: number; y: number; rot: number }> = ({ at, fade, text, x, y, rot }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 10, fade, fade + 30], [0, 0.3, 0.3, 0.1], { ...clamp, easing: easeOut });
  return <p style={{ ...hand, position: "absolute", left: x, top: y, fontSize: 30, lineHeight: 1.15, color: "#fff", opacity: o, rotate: `${rot}deg`, whiteSpace: "nowrap", translate: `0px ${interpolate(frame, [at, at + 10], [10, 0], clamp)}px` }}>{text}</p>;
};

/**
 * S4 · Poin 1, emotion. The canvas goes dark like a stage; a spotlight clicks on over "momen memalukan"
 * on "fokus", burns brighter on "diperkuat", and on "selektif" the unlit details surface faintly
 * and fade. Haruka presents the light from the left.
 */
export const Spotlight: React.FC = () => {
  const frame = useCurrentFrame();
  const fokus = cue("spotlight", "fokus");
  const boost = cue("spotlight", "diperkuat");
  const selektif = cue("spotlight", "selektif");
  const dark = interpolate(frame, [0, 8], [0, 1], { ...clamp, easing: easeOut });
  return (
    <>
      <SceneOut len={L}>
        <AbsoluteFill style={{ backgroundColor: c.ink, opacity: dark }} />
        <PointHeader n="1" color={c.pink} ink="#fff">
          Emosi bikin perhatian <span style={{ color: c.spot }}>fokus</span> ke satu momen
        </PointHeader>
        <Light on={fokus} boost={boost} />
        <Rise at={fokus + 6} dy={10} style={{ left: 550, top: 530, width: 440 }}>
          <p style={{ ...heavy, fontSize: 20, lineHeight: 1.25, letterSpacing: 2, textAlign: "center", color: c.spot }}>DIINGAT KUAT</p>
        </Rise>
        <Rise at={fokus + 8} dy={10} style={{ left: 550, top: 560, width: 440 }}>
          <Lit boost={boost} />
        </Rise>
        {DETAILS.map((d, i) => <Detail key={d.text} {...d} at={selektif + 6 + i * 6} fade={cue("spotlight", "detail") + 40} />)}
      </SceneOut>
      <Haruka steps={[{ pose: "explaining", at: 0 }, { pose: "presenting", at: cue("spotlight", "makanya") }, { pose: "caveat", at: selektif }, { pose: "puzzled", at: cue("spotlight", "detail") }]} x={202} top={450} scale={1.34} enter={6} exit={L - OUT} from={[-500, 600]} />
    </>
  );
};
