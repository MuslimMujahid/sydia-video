import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { easeInOut, easeOut, fontFamily } from "../../promo/theme";
import { useFormat } from "../../showcase/format";
import { clamp } from "../../showcase/ui";
import { Taps } from "../components/PhoneScreens";
import { hourAt, introView, nightAt, roosterAt } from "../components/Scenery";
import { INTRO } from "../timeline";

// The clock box (CLOCK_W × CLOCK_H) sits on the nightstand; CLOCK_AT is its centre in canvas pixels.
const CLOCK_W = 340;
const CLOCK_H = 430;
const FACE = { x: 170, y: 250, r: 150 };
const BUTTON = { x: 170, y: 44 };
const PARALLAX = 1.35; // the clock is closer than the wall, so it grows faster in the push

const Bell: React.FC<{ readonly x: number; readonly rot: number; readonly ring: number; readonly frame: number }> = ({ x, rot, ring, frame }) => (
  <div style={{ position: "absolute", left: x - 62, top: 46, width: 124, height: 70, rotate: `${rot}deg`, transformOrigin: "50% 100%" }}>
    <div style={{ position: "absolute", left: 0, bottom: 0, width: 124, height: 70, borderRadius: "62px 62px 10px 10px", background: "linear-gradient(160deg, #ffe29a 0%, #e9b949 45%, #b8862a 100%)", boxShadow: "inset -8px -6px 0 rgba(120,80,20,0.25)" }} />
    <div style={{ position: "absolute", left: 54, top: -14, width: 16, height: 18, borderRadius: 8, backgroundColor: "#c9962f" }} />
    {ring > 0
      ? [0, 1].map((k) => {
          const p = ((frame * 0.09 + k * 0.5) % 1 + 1) % 1;
          return <div key={k} style={{ position: "absolute", left: 62, top: 36, width: 0, height: 0 }}>
            <div style={{ position: "absolute", left: -(60 + p * 70), top: -(60 + p * 70), width: 2 * (60 + p * 70), height: 2 * (60 + p * 70), borderRadius: "50%", border: "6px solid rgba(255,214,120,0.9)", borderColor: "rgba(255,214,120,0.9) transparent transparent transparent", opacity: ring * (1 - p) }} />
          </div>;
        })
      : null}
  </div>
);

/** A twin-bell alarm clock: luminous hands in the dark, then it rings at 06.00 until a tap on the button stops it. */
const AlarmClock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hr = hourAt(frame);
  const night = nightAt(frame);
  const ringing = frame >= INTRO.ring && frame < INTRO.stop ? 1 : 0;
  const settle = frame >= INTRO.stop ? Math.exp(-(frame - INTRO.stop) / 5) * Math.sin((frame - INTRO.stop) * 1.4) : 0;
  const shake = ringing * Math.sin(frame * 2.6) * 4 + settle * 3;
  const hop = ringing * Math.abs(Math.sin(frame * 1.9)) * -6;
  const hammer = ringing * Math.sin(frame * 3.4) * 26;
  const pressed = interpolate(frame, [INTRO.stop - 2, INTRO.stop, INTRO.stop + 6], [0, 1, 0], clamp);
  const minute = (hr % 1) * 360;
  const hour = ((hr % 12) / 12) * 360;
  const ringIn = spring({ frame: frame - INTRO.ring, fps, config: { damping: 12, stiffness: 220, mass: 0.5 } });
  const hand = (len: number, width: number, angle: number, color: string) => (
    <div style={{ position: "absolute", left: FACE.x - width / 2, top: FACE.y - len, width, height: len + 12, borderRadius: width, backgroundColor: color, rotate: `${angle}deg`, transformOrigin: `50% ${len}px`, boxShadow: night > 0.05 ? `0 0 ${14 * night}px rgba(140,255,190,${0.9 * night})` : "none" }} />
  );
  return (
    <div style={{ position: "relative", width: CLOCK_W, height: CLOCK_H, rotate: `${shake}deg`, translate: `0 ${hop}px`, transformOrigin: "50% 100%", filter: `brightness(${1 - night * 0.55})` }}>
      <div style={{ position: "absolute", left: 60, top: 392, width: 46, height: 36, borderRadius: "10px 10px 20px 20px", backgroundColor: "#c24b3f", rotate: "18deg" }} />
      <div style={{ position: "absolute", left: 234, top: 392, width: 46, height: 36, borderRadius: "10px 10px 20px 20px", backgroundColor: "#c24b3f", rotate: "-18deg" }} />
      <div style={{ position: "absolute", left: BUTTON.x - 6, top: BUTTON.y, width: 12, height: 50, borderRadius: 6, backgroundColor: "#9a7a3a" }} />
      <div style={{ position: "absolute", left: BUTTON.x - 26, top: BUTTON.y - 12 + pressed * 8, width: 52, height: 22, borderRadius: 11, backgroundColor: "#c9962f", boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.18)" }} />
      <Bell x={86} rot={-26} ring={ringing * Math.min(1, ringIn)} frame={frame} />
      <Bell x={254} rot={26} ring={ringing * Math.min(1, ringIn)} frame={frame + 5} />
      <div style={{ position: "absolute", left: FACE.x - 4, top: 70, width: 8, height: 40, borderRadius: 4, backgroundColor: "#7a5a2a", rotate: `${hammer}deg`, transformOrigin: "50% 100%" }}>
        <div style={{ position: "absolute", left: -7, top: -10, width: 22, height: 22, borderRadius: 11, backgroundColor: "#8a6a30" }} />
      </div>
      <div style={{ position: "absolute", left: FACE.x - FACE.r, top: FACE.y - FACE.r, width: FACE.r * 2, height: FACE.r * 2, borderRadius: FACE.r, background: "radial-gradient(circle at 35% 30%, #ff8f7d 0%, #f26b5b 45%, #c94a3c 100%)", boxShadow: "0 30px 50px -20px rgba(60,20,20,0.55), inset -10px -14px 0 rgba(120,30,20,0.25)" }} />
      <div style={{ position: "absolute", left: FACE.x - 122, top: FACE.y - 122, width: 244, height: 244, borderRadius: 122, backgroundColor: "#fffaf0", boxShadow: "inset 0 6px 14px rgba(80,40,20,0.25)" }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 122 - 3, top: 10, width: 6, height: i % 3 === 0 ? 22 : 12, borderRadius: 3, backgroundColor: "#3a2a2a", rotate: `${i * 30}deg`, transformOrigin: "50% 112px" }} />
        ))}
        {[
          [12, 122, 50],
          [3, 194, 122],
          [6, 122, 194],
          [9, 50, 122],
        ].map(([n, x, y]) => (
          <div key={n} style={{ position: "absolute", left: x, top: y, translate: "-50% -50%", fontFamily, fontSize: 30, fontWeight: 800, color: "#3a2a2a" }}>
            {n}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: CLOCK_W, height: CLOCK_H }}>
        <div style={{ position: "absolute", left: FACE.x - 2, top: FACE.y - 96, width: 4, height: 100, borderRadius: 2, backgroundColor: "#ff9f0a", rotate: "180deg", transformOrigin: "50% 96px" }} />
        {hand(64, 12, hour, "#2b2230")}
        {hand(98, 8, minute, "#2b2230")}
        <div style={{ position: "absolute", left: FACE.x - 11, top: FACE.y - 11, width: 22, height: 22, borderRadius: 11, backgroundColor: "#2b2230" }} />
      </div>
      <Taps taps={[{ at: INTRO.stop, x: BUTTON.x, y: BUTTON.y - 2 }]} />
    </div>
  );
};

/** "Kukuruyuuuk!" pops out of the rooster's beak while it crows. */
const Crow: React.FC<{ readonly x: number; readonly y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = INTRO.rooster;
  if (frame < r || frame > r + 46) return null;
  const inP = spring({ frame: frame - r - 4, fps, config: { damping: 11, stiffness: 200, mass: 0.6 } });
  const out = interpolate(frame, [r + 34, r + 44], [0, 1], { ...clamp, easing: easeInOut });
  const wobble = Math.sin((frame - r) * 0.5) * 3 * (1 - out);
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: "0 -100%", padding: "16px 28px", borderRadius: "34px 34px 34px 6px", backgroundColor: "white", boxShadow: "0 20px 40px -18px rgba(23,20,25,0.5)", fontFamily, fontSize: 46, fontWeight: 800, letterSpacing: "-0.02em", color: "#c2410c", whiteSpace: "nowrap", opacity: Math.min(1, inP) * (1 - out), scale: String(0.6 + inP * 0.4), transformOrigin: "0% 100%", rotate: `${4 + wobble}deg` }}>
      Kukuruyuuuk!
    </div>
  );
};

/**
 * Night to dawn: the window time-lapses from stars to sunrise, the rooster on the fence
 * crows, then focus racks to the alarm clock on the nightstand, which rings at 06.00 and
 * is tapped off. It slips away as the phone comes up.
 */
export const NightIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { w, h } = useFormat();
  const cam = introView(frame, w, h);
  const z = 1 + (cam.zoom - 1) * PARALLAX;
  const spot = { x: w * 0.29, y: h * 0.72 };
  const blur = interpolate(frame, [0, 116, 140, INTRO.phone, INTRO.phone + 30], [5, 5, 0, 0, 14], clamp);
  const exit = interpolate(frame, [INTRO.phone, INTRO.phone + 30], [0, 1], { ...clamp, easing: easeInOut });
  const rooster = roosterAt(w, h);
  // The bubble rides with the room (no parallax), its corner just above the beak.
  const crowX = cam.tx + (rooster.x + 66) * cam.zoom;
  const crowY = cam.ty + (rooster.y - 150) * cam.zoom;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${w / 2 - cam.cx * z}px, ${h / 2 - cam.cy * z}px) scale(${z})` }}>
        <div style={{ position: "absolute", left: spot.x - CLOCK_W / 2, top: spot.y - CLOCK_H / 2 + exit * 160, filter: `blur(${blur}px)`, opacity: 1 - interpolate(exit, [0.4, 1], [0, 1], { ...clamp, easing: easeOut }) }}>
          <AlarmClock />
        </div>
      </AbsoluteFill>
      <Crow x={crowX} y={crowY} />
    </AbsoluteFill>
  );
};
