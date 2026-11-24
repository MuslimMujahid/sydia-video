import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Haruka } from "../components/Haruka";
import { Pop, Rise, SceneOut } from "../components/Stage";
import { c, clamp, easeInOut, easeOut, heavy, nunito, OUT } from "../theme";
import { cue, len } from "../timeline";

const L = len("egg");
const EGG = "M288,290 C417.2,290 478,501.2 478,597.2 C478,698 394.4,770 288,770 C181.6,770 98,698 98,597.2 C98,501.2 158.8,290 288,290 Z";
const MID = 288;

/** "prospective memory" typed out as Haruka says the term. */
const Typed: React.FC<{ at: number; text: string }> = ({ at, text }) => {
  const frame = useCurrentFrame();
  const n = Math.floor(interpolate(frame, [at, at + 20], [0, text.length], clamp));
  return (
    <span style={{ color: c.violet }}>
      {text.slice(0, n)}
      <span style={{ color: "transparent" }}>{text.slice(n)}</span>
    </span>
  );
};

/**
 * The egg: whole, then it cracks down the middle on "dua hal" and splits into two halves.
 * The left half (APA) fills up warm on "ingat apa"; the right half (KAPAN) empties into a red
 * dashed outline on "Biasanya yang kedua ini yang bolong".
 */
const SplitEgg: React.FC<{ show: number; crack: number; fill: number; hole: number }> = ({ show, crack, fill, hole }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < show) return null;
  const s = spring({ frame: frame - crack, fps, config: { damping: 11, stiffness: 160, mass: 0.7 } });
  const tilt = spring({ frame: frame - crack, fps, config: { damping: 7, stiffness: 120, mass: 0.6 } });
  const wobble = (1 - tilt) * 5;
  const cracked = frame >= crack;
  const crackDraw = interpolate(frame, [crack - 8, crack], [0, 1], clamp);
  const level = interpolate(frame, [fill, fill + 20], [770, 290], { ...clamp, easing: easeInOut });
  const k = interpolate(frame, [hole, hole + 10], [0, 1], clamp);
  const buzz = frame >= hole ? Math.sin((frame - hole) * 2.6) * 6 * Math.exp(-(frame - hole) / 6) : 0;
  const zig = `M${MID + 15},292 l-9,60 l14,52 l-12,58 l12,62 l-10,64 l10,70 l-6,60 l4,52`;
  return (
    <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <clipPath id="egg-left"><rect x={0} y={0} width={MID} height={1080} /></clipPath>
        <clipPath id="egg-right"><rect x={MID} y={0} width={600} height={1080} /></clipPath>
        <clipPath id="egg-shape"><path d={EGG} /></clipPath>
      </defs>
      <g transform={`translate(${cracked ? 15 - 15 * s : 15} 0) rotate(${cracked ? -wobble : 0} ${MID} 770)`}>
        <g clipPath="url(#egg-left)">
          <path d={EGG} fill="#fff6e8" />
          <rect x={0} y={level} width={MID} height={800} fill="#ffe2b4" clipPath="url(#egg-shape)" />
          <path d={EGG} fill="none" stroke={c.peach} strokeWidth={7} />
        </g>
      </g>
      <g transform={`translate(${(cracked ? 15 + 15 * s : 15) + buzz} 0) rotate(${cracked ? wobble : 0} ${MID} 770)`}>
        <g clipPath="url(#egg-right)">
          <path d={EGG} fill="#fff6e8" stroke={c.peach} strokeWidth={7} opacity={1 - k} />
          <path d={EGG} fill={c.red} fillOpacity={0.05} stroke={c.red} strokeWidth={7} strokeDasharray="26 16" strokeLinecap="round" opacity={k} />
        </g>
      </g>
      {!cracked && crackDraw > 0 && <path d={zig} fill="none" stroke="#d98a4e" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - crackDraw} />}
    </svg>
  );
};

const label = { ...heavy, fontSize: 30, lineHeight: 1.25, letterSpacing: 1, textAlign: "center" } as const;
const sub = { fontFamily: nunito, fontWeight: 700, fontSize: 22, lineHeight: 1.25, color: c.muted, textAlign: "center", margin: 0 } as const;

/** "KAPAN ?" lands neutral, then flips to a red "KAPAN ✗" when Haruka says it's the part that's missing. */
const Kapan: React.FC<{ hole: number }> = ({ hole }) => {
  const frame = useCurrentFrame();
  const missing = frame >= hole;
  const k = interpolate(frame, [hole, hole + 6], [0, 1], { ...clamp, easing: easeOut });
  return <p style={{ ...label, color: missing ? c.red : c.ink, scale: String(1 + 0.15 * (1 - k) * (missing ? 1 : 0)) }}>KAPAN {missing ? "✗" : "?"}</p>;
};

/**
 * S5 · Poin 2, prospective memory. The term types in, the definition follows, and a whole egg
 * cracks into the two parts the errand needs: APA (what, remembered ✓) and KAPAN (when, missing ✗).
 */
export const Egg: React.FC = () => {
  const crack = cue("egg", "duaHal");
  const apa = cue("egg", "apa");
  const kapan = cue("egg", "kapan");
  const hole = cue("egg", "bolong");
  return (
    <>
      <SceneOut len={L}>
        <Pop at={2} from={0.6} origin="30% 80%" style={{ left: 56, top: 18 }}>
          <p style={{ ...heavy, fontSize: 210, lineHeight: 1, color: c.violet }}>2</p>
        </Pop>
        <Rise at={6} style={{ left: 200, top: 70, width: 800 }}>
          <p style={{ ...heavy, fontSize: 50, lineHeight: 1.12 }}>
            Titipan belanja = <Typed at={cue("egg", "term")} text="prospective memory" />
          </p>
        </Rise>
        <Rise at={cue("egg", "definisi")} dy={8} style={{ left: 202, top: 204, width: 800 }}>
          <p style={{ fontFamily: nunito, fontWeight: 600, fontSize: 24, lineHeight: 1.25, color: c.muted, margin: 0 }}>Mengingat hal yang harus dikerjakan nanti. Butuh 2 bagian:</p>
        </Rise>
        <Pop at={cue("egg", "definisi") + 18} from={0.5} origin="303px 770px" style={{ left: 0, top: 0, width: 1080, height: 1080 }}>
          <SplitEgg show={0} crack={crack} fill={apa} hole={hole} />
        </Pop>
        <Rise at={apa} style={{ left: 45, top: 790, width: 300 }}>
          <p style={{ ...label, color: c.green }}>APA ✓</p>
          <p style={sub}>beli telur</p>
        </Rise>
        <Rise at={kapan} style={{ left: 255, top: 790, width: 300 }}>
          <Kapan hole={hole} />
          <p style={sub}>pas lewat toko</p>
        </Rise>
      </SceneOut>
      <Haruka steps={[{ pose: "clipboard", at: 0 }, { pose: "peace", at: crack }, { pose: "oopsHand", at: hole }]} x={822} top={430} scale={1.385} enter={8} exit={L - OUT} />
    </>
  );
};
