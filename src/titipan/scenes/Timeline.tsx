import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Haruka } from "../components/Haruka";
import { Pop, Rise, SceneOut } from "../components/Stage";
import { c, clamp, easeInOut, heavy, nunito, OUT } from "../theme";
import { cue, len } from "../timeline";

const L = len("timeline");
const DRAW: [number, number] = [4, 40]; // the time axis draws left → right
const X0 = 72;
const X1 = 1000;
/** Frame the drawing line passes x. */
const passes = (x: number) => DRAW[0] + ((x - X0) / (X1 - X0)) * (DRAW[1] - DRAW[0]);

const tick = { fontFamily: nunito, fontWeight: 800, fontSize: 20, lineHeight: 1.25, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 } as const;
const status = { ...heavy, fontSize: 20, lineHeight: 1.25, letterSpacing: 2, textAlign: "center" } as const;

const Axis: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, DRAW, [0, 1], { ...clamp, easing: easeInOut });
  const x = X0 + (X1 - X0) * p;
  return (
    <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
      <line x1={X0} y1={520} x2={x} y2={520} stroke={c.ink} strokeWidth={4} strokeLinecap="round" />
      {[230, 720].map((tx) => frame >= passes(tx) && <line key={tx} x1={tx} y1={510} x2={tx} y2={530} stroke={c.ink} strokeWidth={4} strokeLinecap="round" />)}
      {p > 0.98 && <path d={`M${X1 - 2},508 L${X1 + 14},520 L${X1 - 2},532 Z`} fill={c.ink} />}
    </svg>
  );
};

/** "beli telur": sharp when it lands, then it blurs away on "Udah kabur". */
const Fading: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at, at + 16], [0, 1], { ...clamp, easing: easeInOut });
  return <p style={{ ...heavy, fontSize: 42, lineHeight: 1.25, textAlign: "center", color: c.violet, filter: `blur(${9 * k}px)`, opacity: 1 - 0.3 * k }}>beli telur</p>;
};

/**
 * S2 · "Yang lama jelas, yang baru kabur." A time axis draws to SEKARANG; the embarrassing
 * moment five years back lands sharp, this morning's errand lands and immediately blurs.
 */
export const Timeline: React.FC = () => {
  const jelas = cue("timeline", "masihJelas");
  const pagi = cue("timeline", "tadiPagi");
  const kabur = cue("timeline", "udahKabur");
  return (
    <>
      <SceneOut len={L}>
        <Rise at={0} style={{ left: 72, top: 110, width: 936 }}>
          <p style={{ ...heavy, fontSize: 60, lineHeight: 1.12 }}>
            Yang lama <span style={{ color: c.pink }}>jelas,</span>
            <br />
            yang baru <span style={{ color: c.violet }}>kabur.</span>
          </p>
        </Rise>
        <Axis />
        <Rise at={passes(230)} dy={8} style={{ left: 130, top: 546, width: 200 }}>
          <p style={{ ...tick, color: c.muted, textAlign: "center" }}>5 tahun lalu</p>
        </Rise>
        <Rise at={passes(720)} dy={8} style={{ left: 620, top: 546, width: 200 }}>
          <p style={{ ...tick, color: c.muted, textAlign: "center" }}>tadi pagi</p>
        </Rise>
        <Rise at={DRAW[1]} dy={8} style={{ left: 880, top: 546, width: 124 }}>
          <p style={{ ...tick, color: c.ink }}>sekarang</p>
        </Rise>
        {/* five years ago: sharp */}
        <Pop at={jelas} from={0} style={{ left: 214, top: 504, width: 32, height: 32, borderRadius: "50%", backgroundColor: c.pink }}>{null}</Pop>
        <Rise at={jelas + 3} style={{ left: 80, top: 370, width: 300 }}>
          <p style={{ ...status, color: c.pink }}>MASIH JELAS</p>
        </Rise>
        <Rise at={jelas + 5} style={{ left: 30, top: 408, width: 460 }}>
          <p style={{ ...heavy, fontSize: 42, lineHeight: 1.25, textAlign: "center", whiteSpace: "nowrap" }}>momen memalukan</p>
        </Rise>
        {/* this morning: already gone */}
        <Pop at={pagi} from={0} style={{ left: 704, top: 504, width: 32, height: 32, borderRadius: "50%", backgroundColor: c.canvas, border: `5px solid ${c.violet}`, boxSizing: "border-box" }}>{null}</Pop>
        <Rise at={pagi + 5} style={{ left: 490, top: 408, width: 460 }}>
          <Fading at={kabur} />
        </Rise>
        <Rise at={kabur} style={{ left: 570, top: 370, width: 300 }}>
          <p style={{ ...status, color: c.violet }}>UDAH KABUR</p>
        </Rise>
      </SceneOut>
      <Haruka steps={[{ pose: "facepalm", at: 0 }, { pose: "thinkingPhone", at: pagi }, { pose: "exasperated", at: kabur }]} x={540} top={606} scale={1.07} enter={6} exit={L - OUT} />
    </>
  );
};
