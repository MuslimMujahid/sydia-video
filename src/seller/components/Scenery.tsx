import type React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { easeInOut } from "../../promo/theme";
import { clamp } from "../../showcase/ui";
import { useFormat } from "../../showcase/format";
import { at, INTRO, SECTIONS as S } from "../timeline";

// Global frame → hour of Sari's day. Night time-lapses to 06.00 for the alarm, the morning
// creeps along with the forwards, then the afternoon arrives in one time-lapse before the laptop opens.
const HOUR_F = [0, 20, INTRO.ring - 10, INTRO.ring, at(S.list), at(S.forward), at(S.more), at(S.more + 1), at(S.more + 2), at(S.more + 3), at(S.afternoon), at(S.afternoon, 1), at(S.afternoon, 3.5), at(S.close)];
const HOUR_V = [4.0, 4.0, 5.98, 6.0, 6.01, 6.08, 6.6, 7.35, 8.15, 9.05, 9.15, 9.3, 15.6, 16.3];
export const hourAt = (frame: number) => interpolate(frame, HOUR_F, HOUR_V, { ...clamp, easing: easeInOut });
const pad = (n: number) => String(n).padStart(2, "0");
export const clockAt = (frame: number) => {
  const m = Math.floor(hourAt(frame) * 60);
  return `${pad(Math.floor(m / 60))}.${pad(m % 60)}`;
};
/** How dark it still is: 1 at night, 0 once the morning is up. */
export const nightAt = (frame: number) => interpolate(hourAt(frame), [4.0, 5.2, 5.85, 6.1], [1, 0.8, 0.25, 0], clamp);

const SKY_H = [4.0, 5.0, 5.5, 5.85, 6.2, 8, 10, 14, 15.5, 16.5];
const SKY_TOP = ["#0b1030", "#1c1a44", "#3a2b5e", "#c77aa0", "#ffb59a", "#ffd8bd", "#a9d6ff", "#9fd0ff", "#ffcf96", "#ffad7d"];
const SKY_BOTTOM = ["#1d2550", "#4a3f73", "#d88aa0", "#ffc4a6", "#ffe3cc", "#fff3e8", "#eef7ff", "#f1f8ff", "#fff0d4", "#ffdcc2"];
const WALL_H = [4.0, 5.0, 5.5, 6.2, 9, 15, 16.5];
const WALL = ["#6f6a8a", "#9b90aa", "#cdbfc4", "#efe2d8", "#f7efe7", "#f8eee2", "#f6e3d3"];

/** The window in canvas pixels. */
export const windowRect = (w: number, h: number) => ({ x: w / 2 - 470, y: h * 0.1, w: 940, h: h * 0.52 });
/** Where the rooster stands (its feet), in canvas pixels. Its beak tip is about (+64, -134) from there. */
export const roosterAt = (w: number, h: number) => {
  const win = windowRect(w, h);
  return { x: win.x + win.w * 0.77, y: win.y + win.h * 0.8 };
};

// ------------------------------------------------------------------ intro camera
// A 2D push over the room: night window → the rooster → the alarm clock → back out for the phone.
// Points are fractions of the canvas; zoom 1 is the resting framing for the rest of the video.
const CAM_F = [0, 56, 88, 116, 142, 180, INTRO.phone + 20];
const CAM_X = [0.5, 0.5, 0.64, 0.64, 0.29, 0.29, 0.5];
const CAM_Y = [0.5, 0.5, 0.5, 0.5, 0.72, 0.72, 0.5];
const CAM_Z = [1.0, 1.04, 1.7, 1.75, 1.65, 1.7, 1.0];

export const introView = (frame: number, w: number, h: number) => {
  const o = { ...clamp, easing: easeInOut };
  const zoom = interpolate(frame, CAM_F, CAM_Z, o);
  const cx = interpolate(frame, CAM_F, CAM_X, o) * w;
  const cy = interpolate(frame, CAM_F, CAM_Y, o) * h;
  // Keep the scaled room covering the frame.
  const tx = Math.min(0, Math.max(w - w * zoom, w / 2 - cx * zoom));
  const ty = Math.min(0, Math.max(h - h * zoom, h / 2 - cy * zoom));
  return { zoom, tx, ty, cx: (w / 2 - tx) / zoom, cy: (h / 2 - ty) / zoom };
};

/** Rack focus: the window is sharp for the night and the rooster, then the alarm clock takes the focus. */
export const roomBlur = (frame: number) => interpolate(frame, [0, 116, 140], [1.4, 1.4, 7], clamp);

// ------------------------------------------------------------------ night sky, fence and rooster
const STARS = [
  [8, 12, 5], [17, 30, 3], [26, 9, 4], [34, 22, 3], [41, 6, 5], [47, 35, 3], [55, 15, 4], [62, 28, 3], [69, 8, 5], [76, 20, 3], [84, 33, 4], [91, 11, 3], [13, 44, 3], [72, 42, 3],
] as const;

const Rooster: React.FC<{ readonly frame: number }> = ({ frame }) => {
  const r = INTRO.rooster;
  // Head tucked while it sleeps, lifts at first light, thrown back for the crow.
  const crow = interpolate(frame, [r, r + 8, r + 52, r + 64], [0, 1, 1, 0], { ...clamp, easing: easeInOut });
  const head = interpolate(frame, [0, r - 30, r - 14], [14, 14, 0], { ...clamp, easing: easeInOut }) - crow * 28;
  const beak = crow * (0.55 + 0.45 * Math.abs(Math.sin((frame - r) * 0.22)));
  const puff = 1 + crow * 0.06;
  return (
    <svg width={160} height={176} viewBox="0 0 100 110" style={{ overflow: "visible" }}>
      <g transform={`translate(50 80) scale(${puff}) translate(-50 -80)`}>
        <path d="M34 58 C 14 46, 6 24, 16 8 C 20 26, 26 38, 40 48 Z" fill="#2f2a3a" />
        <path d="M36 60 C 20 56, 10 40, 12 26 C 20 40, 30 48, 42 54 Z" fill="#3f6b5c" />
        <ellipse cx={52} cy={62} rx={26} ry={20} fill="#8a4a2c" />
        <path d="M40 66 C 48 58, 62 58, 70 64 C 62 74, 48 76, 40 66 Z" fill="#6b3522" />
        <line x1={46} y1={80} x2={44} y2={99} stroke="#d9a23a" strokeWidth={3.5} strokeLinecap="round" />
        <line x1={56} y1={80} x2={58} y2={99} stroke="#d9a23a" strokeWidth={3.5} strokeLinecap="round" />
        <g transform={`rotate(${head} 64 46)`}>
          <path d="M58 52 C 62 40, 64 34, 66 26 L 78 28 C 76 40, 74 50, 72 60 Z" fill="#b8642f" />
          <circle cx={72} cy={24} r={9.5} fill="#b8642f" />
          <path d="M64 17 q2 -8 5 -2 q2 -8 5 -1 q4 -6 5 2 Z" fill="#e2453c" />
          <ellipse cx={78} cy={34} rx={3.2} ry={5.5} fill="#e2453c" />
          <circle cx={75} cy={21} r={1.6} fill="#1a1414" />
          <g transform={`rotate(${-beak * 16} 80 24)`}>
            <path d="M80 20 L 90 23.5 L 80 24.5 Z" fill="#e9b949" />
          </g>
          <g transform={`rotate(${beak * 18} 80 25)`}>
            <path d="M80 25 L 88 26.5 L 80 28.5 Z" fill="#d99a2a" />
          </g>
        </g>
      </g>
    </svg>
  );
};

/** The view out of the window before sunrise: stars and a setting moon, the garden fence and its rooster. */
const WindowExtras: React.FC<{ readonly hr: number; readonly frame: number }> = ({ hr, frame }) => {
  const stars = interpolate(hr, [4.8, 5.5], [1, 0], clamp);
  const moon = interpolate(hr, [5.2, 5.7], [1, 0], clamp);
  const moonY = interpolate(hr, [4.0, 5.7], [18, 32], clamp);
  const lit = interpolate(hr, [4.0, 5.6, 6.4, 8], [0.3, 0.55, 0.85, 1], clamp);
  // It hops off the fence while the phone comes up, so it doesn't sit beside the phone all morning.
  const gone = interpolate(frame, [INTRO.phone, INTRO.phone + 14], [0, 1], { ...clamp, easing: easeInOut });
  const fence = interpolateColors(hr, [4.0, 5.6, 7], ["#1a1530", "#3d2c3e", "#7a6250"]);
  return (
    <>
      {stars > 0
        ? STARS.map(([x, y, s], i) => (
            <div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, width: s, height: s, borderRadius: s, backgroundColor: "#fffbea", opacity: stars * (0.65 + 0.35 * Math.sin(frame * 0.12 + i * 1.7)), boxShadow: `0 0 ${s * 3}px #fffbea` }} />
          ))
        : null}
      {moon > 0 ? <div style={{ position: "absolute", left: "20%", top: `${moonY}%`, width: 92, height: 92, borderRadius: 46, boxShadow: "inset -24px 10px 0 0 #fff4d2", filter: "drop-shadow(0 0 24px rgba(255,244,210,0.6))", opacity: moon, rotate: "-20deg" }} /> : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: "86%", height: 10, backgroundColor: fence }} />
      {[8, 30, 52, 77, 94].map((x) => (
        <div key={x} style={{ position: "absolute", left: `${x}%`, top: "80%", bottom: 0, width: 18, translate: "-50% 0", borderRadius: "6px 6px 0 0", backgroundColor: fence }} />
      ))}
      {gone < 1 ? (
        <div style={{ position: "absolute", left: "77%", top: "80%", translate: "-50% -100%", marginTop: 4 + gone * 90, filter: `brightness(${lit})`, opacity: 1 - gone }}>
          <Rooster frame={frame} />
        </div>
      ) : null}
    </>
  );
};

/**
 * Sari's room, softly out of focus behind the devices: a window whose sky follows the
 * clock (night → dawn → morning → golden afternoon) and the sunlight it throws across the wall.
 */
export const Room: React.FC = () => {
  const frame = useCurrentFrame();
  const { w, h } = useFormat();
  const hr = hourAt(frame);
  const top = interpolateColors(hr, SKY_H, SKY_TOP);
  const bottom = interpolateColors(hr, SKY_H, SKY_BOTTOM);
  const wall = interpolateColors(hr, WALL_H, WALL);
  // Unclamped before sunrise so the sun waits below the window sill.
  const t = Math.min(1, (hr - 5.8) / 12.4);
  const elev = Math.sin(Math.PI * t);
  const sunX = 12 + Math.max(0, t) * 76;
  const sunY = 96 - elev * 80;
  const sunColor = interpolateColors(Math.max(0, elev), [0, 0.35, 1], ["#ff8a4c", "#ffcf7a", "#fff6d6"]);
  const light = interpolate(hr, [5.9, 6.6, 9, 15, 16.5], [0.05, 0.45, 0.6, 0.65, 0.8], clamp);
  const dim = interpolate(hr, [4.0, 5.2, 5.8, 6.2], [0.6, 0.5, 0.22, 0], clamp);
  // The beam swings across the room as the sun moves.
  const beamX = interpolate(Math.max(0, t), [0, 1], [70, 20]);
  const win = windowRect(w, h);
  const cam = introView(frame, w, h);
  return (
    <AbsoluteFill style={{ backgroundColor: wall, overflow: "hidden" }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.zoom})` }}>
        <AbsoluteFill style={{ filter: `blur(${roomBlur(frame)}px)` }}>
          <div style={{ position: "absolute", left: win.x - 26, top: win.y - 26, width: win.w + 52, height: win.h + 52, borderRadius: 34, backgroundColor: "#fffaf4", boxShadow: "0 30px 80px -30px rgba(80,50,40,0.35)" }} />
          <div style={{ position: "absolute", left: win.x, top: win.y, width: win.w, height: win.h, borderRadius: 18, overflow: "hidden", background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)` }}>
            <div style={{ position: "absolute", left: `${sunX}%`, top: `${sunY}%`, width: 160, height: 160, translate: "-50% -50%", borderRadius: 80, backgroundColor: sunColor, boxShadow: `0 0 120px 70px ${sunColor}aa` }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "26%", background: "linear-gradient(180deg, rgba(120,140,110,0) 0%, rgba(96,120,92,0.55) 100%)" }} />
            <WindowExtras hr={hr} frame={frame} />
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 22, translate: "-50% 0", backgroundColor: "#fffaf4" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: "48%", height: 22, backgroundColor: "#fffaf4" }} />
          </div>
          <div style={{ position: "absolute", left: `${beamX}%`, top: "30%", width: "60%", height: "120%", translate: "-50% 0", rotate: "28deg", background: `linear-gradient(180deg, ${sunColor}00 0%, ${sunColor} 40%, ${sunColor}00 100%)`, opacity: light * 0.55, mixBlendMode: "screen" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h * 0.2, background: "linear-gradient(180deg, #d9b99a 0%, #c79f7e 100%)", boxShadow: "0 -6px 30px rgba(80,50,30,0.2)" }} />
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#1b1230", opacity: dim }} />
    </AbsoluteFill>
  );
};
