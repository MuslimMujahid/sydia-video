import { getLength, getPointAtLength } from "@remotion/paths";
import type React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Haruka } from "../components/Haruka";
import { Pop, PointHeader, Rise, SceneOut } from "../components/Stage";
import { c, clamp, easeInOut, easeOut, hand, heavy, OUT, popSpring } from "../theme";
import { cue, len } from "../timeline";

// The commute home, from the storyboard: office (top) → shop (left bend) → home (bottom right).
const ROAD = "M600,300 C960,320 940,470 720,500 C480,535 500,660 760,690 C940,710 960,760 930,800";
const LENGTH = getLength(ROAD);
const KANTOR = { x: 600, y: 300 };
const TOKO = { x: 560, y: 600 };
const RUMAH = { x: 930, y: 800 };
/** How far along the road the shop is (0..1). */
const AT_TOKO = (() => {
  let best = 0;
  let d = Infinity;
  for (let i = 0; i <= 400; i++) {
    const p = getPointAtLength(ROAD, (LENGTH * i) / 400) ?? TOKO;
    const di = Math.hypot(p.x - TOKO.x, p.y - TOKO.y);
    if (di < d) [d, best] = [di, i / 400];
  }
  return best;
})();

/** The road surface and its dashed centre line, drawn from the office down to home. */
const RoadPath: React.FC<{ draw: [number, number] }> = ({ draw }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, draw, [0, 1], { ...clamp, easing: easeInOut });
  return (
    <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <mask id="road-drawn">
          <path d={ROAD} fill="none" stroke="#fff" strokeWidth={60} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
        </mask>
      </defs>
      <g mask="url(#road-drawn)">
        <path d={ROAD} fill="none" stroke={c.road} strokeWidth={40} strokeLinecap="round" />
        <path d={ROAD} fill="none" stroke={c.ink} strokeOpacity={0.35} strokeWidth={4} strokeDasharray="14 12" />
      </g>
    </svg>
  );
};

/** A map pin: a filled dot with a white hole. */
const Pin: React.FC<{ at: number; x: number; y: number; color: string; opacity?: number }> = ({ at, x, y, color, opacity = 1 }) => (
  <Pop at={at} from={0} style={{ left: x - 22, top: y - 22, width: 44, height: 44 }}>
    <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: color, opacity, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#fff" }} />
    </div>
  </Pop>
);

/** You, travelling the road. `keys` are [frame, 0..1 along the road]; from `eggAt` an egg rides along. */
const Traveller: React.FC<{ keys: [number, number][]; eggAt?: number }> = ({ keys, eggAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < keys[0][0]) return null;
  const t = interpolate(frame, keys.map((k) => k[0]), keys.map((k) => k[1]), { ...clamp, easing: Easing.inOut(Easing.quad) });
  const pt = getPointAtLength(ROAD, LENGTH * t) ?? KANTOR;
  const appear = spring({ frame: frame - keys[0][0], fps, config: popSpring });
  const egg = eggAt === undefined ? 0 : spring({ frame: frame - eggAt, fps, config: popSpring });
  return (
    <div style={{ position: "absolute", left: pt.x, top: pt.y, width: 0, height: 0 }}>
      <div style={{ position: "absolute", left: -15, top: -15, width: 30, height: 30, borderRadius: "50%", backgroundColor: c.orange, border: "5px solid #fff", boxSizing: "border-box", boxShadow: "0 4px 12px rgba(23,20,25,0.25)", scale: String(appear) }} />
      {egg > 0.01 && (
        <svg width={30} height={38} style={{ position: "absolute", left: -15, top: -58, scale: String(egg), transformOrigin: "50% 100%" }}>
          <path d="M15,3 C24,3 27,18 27,24 C27,31 21,35 15,35 C9,35 3,31 3,24 C3,18 6,3 15,3 Z" fill="#fff6e8" stroke={c.peach} strokeWidth={3} />
        </svg>
      )}
    </div>
  );
};

/** A distraction that pops on the voice ("⚡ chat kerjaan" …), or sits faded in the S7 callback. */
const Distraction: React.FC<{ at: number; text: string; x: number; y: number; rot: number; faded?: boolean }> = ({ at, text, x, y, rot, faded }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 9, stiffness: 220, mass: 0.5 } });
  if (frame < at) return null;
  return (
    <p style={{ ...hand, position: "absolute", left: x, top: y, fontSize: 30, lineHeight: 1.15, color: c.orange, whiteSpace: "nowrap", rotate: `${rot}deg`, opacity: (faded ? 0.3 : 1) * Math.min(1, s * 2), scale: String(0.5 + 0.5 * s), transformOrigin: "0% 50%" }}>
      <Bolt /> {text}
    </p>
  );
};

/** The storyboard's yellow lightning bolt (drawn, since the render machine has no colour emoji font). */
const Bolt: React.FC = () => (
  <svg width={22} height={30} viewBox="0 0 22 30" style={{ verticalAlign: "-4px" }}>
    <path d="M13,1 L2,17 L10,17 L7,29 L20,11 L12,11 Z" fill="#ffbe1a" stroke="#f59e0b" strokeWidth={1.5} strokeLinejoin="round" />
  </svg>
);

const Kantor: React.FC = () => (
  <>
    <Pin at={4} {...KANTOR} color={c.ink} />
    <Rise at={8} dy={8} style={{ left: 636, top: 276 }}>
      <p style={{ ...heavy, fontSize: 32, lineHeight: 1.25, whiteSpace: "nowrap" }}>Pulang kantor</p>
    </Rise>
  </>
);

const L6 = len("road");

/** S6's shop: passed at speed, it fades, gets struck through, "kelewat!". */
const MissedShop: React.FC<{ pass: number }> = ({ pass }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [pass, pass + 10], [1, 0.45], clamp);
  const strike = interpolate(frame, [pass + 8, pass + 18], [0, 1], { ...clamp, easing: easeOut });
  return (
    <>
      <Pin at={14} {...TOKO} color={c.red} opacity={fade} />
      <Rise at={18} dy={8} style={{ left: 600, top: 574 }}>
        <p style={{ ...heavy, fontSize: 40, lineHeight: 1.25, color: c.red, opacity: Math.max(fade, 0.8) }}>TOKO</p>
      </Rise>
      <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {strike > 0 && <path d={`M596,600 L${596 + 124 * strike},${600 - 4 * strike}`} stroke={c.red} strokeWidth={6} strokeLinecap="round" />}
      </svg>
      <Rise at={pass + 18} dy={8} style={{ left: 610, top: 609 }}>
        <p style={{ ...hand, fontSize: 34, lineHeight: 1.15, color: c.red, rotate: "-4deg", whiteSpace: "nowrap" }}>kelewat!</p>
      </Rise>
    </>
  );
};

/**
 * S6 · Poin 3, a busy mind. The commute home draws from the office; each distraction pops on the
 * voice while you're still on the way, then you speed straight past the shop (it fades and is struck
 * out) and stop at home on "kelewat": "Eh, telurnya!".
 */
export const Busy: React.FC = () => {
  const aktivitas = cue("road", "aktivitas");
  const kelewat = cue("road", "kelewat");
  const pass = aktivitas + 8; // roughly when you go by the shop
  return (
    <>
      <SceneOut len={L6}>
        <PointHeader n="3" color={c.orange}>
          Pikiran lagi sibuk, niatnya gampang <span style={{ color: c.orange }}>kelewat</span>
        </PointHeader>
        <RoadPath draw={[6, 36]} />
        <Traveller keys={[[40, 0], [aktivitas, AT_TOKO - 0.05], [pass + 6, AT_TOKO + 0.12], [kelewat, 1]]} />
        <Kantor />
        <MissedShop pass={pass} />
        <Pin at={30} {...RUMAH} color={c.violet} />
        <Distraction at={cue("road", "chat")} text="chat kerjaan" x={610} y={352} rot={4} />
        <Distraction at={cue("road", "deadline")} text="mikirin deadline" x={590} y={412} rot={-4} />
        <Distraction at={cue("road", "macet")} text="jalan macet" x={818} y={520} rot={3} />
        <Rise at={kelewat + 2} dy={8} style={{ left: 760, top: 760 }}>
          <p style={{ ...heavy, fontSize: 24, lineHeight: 1.25, letterSpacing: 2, color: c.violet }}>RUMAH</p>
        </Rise>
        <Pop at={kelewat + 6} from={0.5} origin="90% 50%" style={{ left: 560, top: 790 }}>
          <p style={{ ...hand, fontSize: 40, lineHeight: 1.15, color: c.violet, rotate: "-2deg", whiteSpace: "nowrap" }}>“Eh, telurnya!”</p>
        </Pop>
      </SceneOut>
      <Haruka steps={[{ pose: "tapping", at: 0 }, { pose: "tappingAngry", at: cue("road", "chat") }, { pose: "scratching", at: cue("road", "deadline") }, { pose: "annoyed", at: cue("road", "macet") }, { pose: "oops", at: kelewat }]} x={232} top={470} scale={1.7} enter={8} exit={L6 - OUT} from={[-500, 600]} />
    </>
  );
};

/** The reminder at the shop: the pin turns green and ripples like a notification. */
const Ripples: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  const rings = [0, 1, 2, 3, 4, 5, 6].map((k) => from + k * 22).filter((s) => s <= Math.min(frame, to));
  return (
    <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
      {rings.map((s) => {
        const t = interpolate(frame - s, [0, 34], [0, 1], { ...clamp, easing: easeOut });
        return t < 1 && <circle key={s} cx={TOKO.x} cy={TOKO.y} r={26 + 56 * t} fill="none" stroke={c.green} strokeWidth={4} strokeOpacity={0.55 * (1 - t)} />;
      })}
    </svg>
  );
};

/** The shopping list: on "tulis di daftar" a box draws and "beli telur" is handwritten beside it; at `tick` it's checked off. */
const TodoItem: React.FC<{ at: number; tick: number }> = ({ at, tick }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const box = interpolate(frame, [at, at + 6], [1, 0], { ...clamp, easing: easeOut });
  const write = interpolate(frame, [at + 4, at + 26], [100, 0], clamp);
  const check = interpolate(frame, [tick, tick + 6], [1, 0], { ...clamp, easing: easeOut });
  const done = spring({ frame: frame - tick, fps, config: popSpring });
  const head = interpolate(frame, [at, at + 8], [0, 1], { ...clamp, easing: easeOut });
  return (
    <div style={{ position: "absolute", left: 300, top: 290 }}>
      <p style={{ ...hand, fontSize: 28, lineHeight: 1.15, color: c.muted, opacity: head, rotate: "-3deg", whiteSpace: "nowrap" }}>daftar belanja:</p>
      <svg width={52} height={52} style={{ position: "absolute", left: 0, top: 46, overflow: "visible" }}>
        <rect x={4} y={6} width={36} height={36} rx={8} fill={frame >= tick ? c.green : "none"} fillOpacity={frame >= tick ? 0.15 * done : 0} stroke={frame >= tick ? c.green : c.ink} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={box} />
        {frame >= tick && <path d="M11,24 L20,33 L37,10" fill="none" stroke={c.green} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={check} style={{ scale: String(0.8 + 0.2 * done), transformOrigin: "22px 24px" }} />}
      </svg>
      <div style={{ position: "absolute", left: 58, top: 42, clipPath: `inset(-20px ${write}% -20px -10px)` }}>
        <p style={{ ...hand, fontSize: 44, lineHeight: 1.15, color: frame >= tick ? c.green : c.ink, rotate: "-2deg", whiteSpace: "nowrap" }}>beli telur</p>
      </div>
    </div>
  );
};

const L7 = len("reminder");

/**
 * S7 · Poin 4, a reminder at the right spot. Callback to S6: the same road redraws with the
 * distractions faded. You stop at the shop as the reminder rings ("Pasang pengingat"); on "tulis di
 * daftar" a shopping-list item is written and checked off, the egg hops on, and you ride home with
 * it on "begitu masuk toko": "telurnya ikut pulang".
 */
export const Reminder: React.FC = () => {
  const frame = useCurrentFrame();
  const ring = cue("reminder", "pengingat");
  const daftar = cue("reminder", "daftar");
  const home = cue("reminder", "masukToko");
  const green = frame >= ring;
  return (
    <>
      <SceneOut len={L7}>
        <PointHeader n="4" color={c.green}>
          <span style={{ color: c.green }}>Pengingat</span> di titik yang pas
        </PointHeader>
        <RoadPath draw={[4, 26]} />
        <Traveller keys={[[20, 0], [ring - 4, AT_TOKO], [daftar + 32, AT_TOKO], [home, 1]]} eggAt={daftar + 28} />
        <Kantor />
        <Distraction at={10} text="chat kerjaan" x={608} y={352} rot={4} faded />
        <Distraction at={14} text="mikirin deadline" x={590} y={394} rot={-4} faded />
        <Distraction at={18} text="jalan macet" x={818} y={520} rot={3} faded />
        <Ripples from={ring} to={home - 20} />
        <Pin at={14} {...TOKO} color={green ? c.green : c.ink} opacity={green ? 1 : 0.35} />
        <Rise at={ring + 2} dy={8} style={{ left: 650, top: 560 }}>
          <p style={{ ...heavy, fontSize: 20, lineHeight: 1.25, letterSpacing: 2, color: c.green, whiteSpace: "nowrap" }}>TOKO · 17.30</p>
        </Rise>
        <Rise at={ring + 5} dy={8} style={{ left: 650, top: 588 }}>
          <p style={{ ...heavy, fontSize: 34, lineHeight: 1.25, whiteSpace: "nowrap" }}>“Beli telur!” bunyi</p>
        </Rise>
        <Pin at={24} {...RUMAH} color={c.violet} />
        <TodoItem at={daftar} tick={daftar + 26} />
        <Rise at={home + 2} dy={8} style={{ left: 560, top: 750 }}>
          <p style={{ ...heavy, fontSize: 24, lineHeight: 1.25, letterSpacing: 2, color: c.violet }}>RUMAH</p>
        </Rise>
        <Rise at={home + 5} dy={8} style={{ left: 560, top: 778 }}>
          <p style={{ ...heavy, fontSize: 32, lineHeight: 1.25, color: c.violet, whiteSpace: "nowrap" }}>telurnya ikut pulang</p>
        </Rise>
      </SceneOut>
      <Haruka steps={[{ pose: "temple", at: 0 }, { pose: "showPhone", at: ring }, { pose: "clipboard", at: daftar }, { pose: "starEyes", at: home }]} x={192} top={434} scale={1.42} enter={6} exit={L7 - OUT} from={[-500, 600]} />
    </>
  );
};
