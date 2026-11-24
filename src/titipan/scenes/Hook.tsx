import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Haruka } from "../components/Haruka";
import { Pop, SceneOut } from "../components/Stage";
import { c, clamp, easeOut, heavy, OUT, popSpring } from "../theme";
import { cue, len, SCENES } from "../timeline";

const L = len("hook");

/** One phrase of the hook, revealed as Haruka says it. Highlighted phrases pop in their colour. */
const Phrase: React.FC<{ at: number; text: string; color?: string }> = ({ at, text, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [at, at + 8], [0, 1], { ...clamp, easing: easeOut });
  const s = color ? spring({ frame: frame - at, fps, config: popSpring }) : 1;
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span style={{ display: "inline-block", opacity: t, translate: `0px ${14 * (1 - t)}px`, scale: color ? String(1.25 - 0.25 * s) : undefined, transformOrigin: "50% 80%", color: color ?? c.ink }}>{w}</span>{" "}
        </span>
      ))}
    </>
  );
};

/**
 * S1 · Hook. The question builds phrase by phrase with the voice; "masih ingat" lights pink,
 * "malah lupa?" violet, and on that word Haruka bursts in from the bottom-right corner,
 * shocked, while "Telurnya mana?" pops in from the top-right.
 */
export const Hook: React.FC = () => {
  const lupa = cue("hook", "malahLupa");
  return (
    <>
      <SceneOut len={L}>
        <p style={{ ...heavy, position: "absolute", left: 72, top: 328, width: 560, fontSize: 62, lineHeight: 1.14 }}>
          <Phrase at={SCENES.hook.vo} text="Kenapa kejadian" />
          <Phrase at={cue("hook", "memalukan")} text="memalukan 5 tahun lalu" />
          <Phrase at={cue("hook", "masihIngat")} text="masih ingat," color={c.pink} />
          <Phrase at={cue("hook", "tapi")} text="tapi Ibu nitip beli telur" />
          <Phrase at={lupa} text="malah lupa?" color={c.violet} />
        </p>
        <Pop at={lupa + 8} from={0.2} origin="1060px 200px" style={{ left: 0, top: 0, width: 1080, height: 1080 }}>
          <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 10px 24px rgba(23,20,25,0.08))" }}>
            <path d="M940,250L1060,200L980,300Z" fill="#fff" />
            <ellipse cx={850} cy={295} rx={210} ry={85} fill="#fff" />
          </svg>
          <p style={{ ...heavy, position: "absolute", left: 660, top: 268, width: 380, fontSize: 40, lineHeight: 1.1, textAlign: "center" }}>
            “<span style={{ color: c.pink }}>Telurnya</span> mana?”
          </p>
        </Pop>
      </SceneOut>
      <Haruka steps={[{ pose: "shocked", at: 0 }]} x={884} top={482} scale={1.85} enter={lupa} exit={L - OUT} from={[420, 520]} jolt />
    </>
  );
};
