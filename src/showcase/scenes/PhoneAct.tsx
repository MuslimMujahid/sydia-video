import type React from "react";
import { AbsoluteFill, interpolate, interpolateColors, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Grain } from "../../promo/components/Backgrounds";
import { Icon, SydiaMark } from "../../promo/components/Icons";
import { colors, easeInOut, easeOut, fontFamily } from "../../promo/theme";
import { CameraStage, type CamKey, Place } from "../components/Camera";
import { useSq } from "../format";
import { type ChatMsg, type Compose, Phone } from "../components/Phone";
import { BAR, BEAT } from "../timeline";
import { clamp, Ic } from "../ui";
import { type Caption, CaptionView } from "./DesktopAct";

const C = 3 * BAR; // 216 frames per chapter
const ch = (i: number, f: number) => i * C + f;
export const PHONE_LEN = 16 * BAR; // bars 18 → 34 (incl. one-bar dive)
const DIVE = ch(5, 0);
const UNLOCK = 58;

// Reminder chapter: the phone sleeps while the afternoon passes, then wakes.
const LOCK2 = ch(2, 70);
const SLEEP = ch(2, 76);
const LAPSE: readonly [number, number] = [ch(2, 84), ch(2, 146)];
export const REMIND = ch(2, 150);
const UNLOCK2 = ch(2, 184);

// Memory chapter: scroll back to where Sydia learned it, then back down.
const REWIND: readonly [number, number, number, number] = [ch(4, 98), ch(4, 118), ch(4, 150), ch(4, 166)];

// ------------------------------------------------------------------ time of day
const HOUR_F = [0, C, C + 20, ch(2, 0), LAPSE[0], LAPSE[1], ch(3, 0), ch(3, 20), ch(4, 0), ch(4, 28), DIVE, PHONE_LEN];
const HOUR_V = [8, 8, 9.2, 9.2, 9.25, 15, 15, 15 + 1 / 3, 15 + 1 / 3, 19 + 1 / 12, 19 + 1 / 12, 20];
export const hourOf = (frame: number) => interpolate(frame, HOUR_F, HOUR_V, { ...clamp, easing: easeInOut });
const pad = (n: number) => String(n).padStart(2, "0");
export const phoneClock = (frame: number) => {
  const m = Math.round(hourOf(frame) * 60);
  return `${pad(Math.floor(m / 60))}.${pad(m % 60)}`;
};
const isDark = (frame: number) => hourOf(frame) > 18.2;

// ------------------------------------------------------------------ chat
export const waMessages: ChatMsg[] = [
  { kind: "chip", at: -1, label: "26 Oktober" },
  { kind: "text", from: "me", at: -1, time: "21.14", lines: ["Oh iya, Alya ==alergi kacang== ya"], hl: [ch(4, 122)] },
  { kind: "text", from: "bot", at: -1, time: "21.14", lines: ["Siap, saya ingat: Alya alergi", "kacang."] },
  { kind: "chip", at: UNLOCK, label: "Hari ini" },
  {
    kind: "text",
    from: "bot",
    at: UNLOCK + 2,
    time: "08.00",
    hl: [100, 100 + BEAT, 100 + 2 * BEAT, 100 + 3 * BEAT],
    lines: [
      "Selamat pagi, Kak Nadia! Ada 1 tugas",
      "lewat tenggat, beresin dulu sebelum",
      "rapat vendor jam 10 ya.",
      "",
      "==Tugas lewat tenggat (1)==",
      "- Bayar listrik — Tenggat 6 Nov",
      "  2026 17.00 · Prioritas tinggi",
      "",
      "==Tugas hari ini (1)==",
      "- Kirim proposal Q4 — Tenggat",
      "  9 Nov 2026 16.00",
      "",
      "==Agenda (2)==",
      "- Standup tim — 9 Nov 2026",
      "  09.00–09.30",
      "- Rapat vendor — 9 Nov 2026",
      "  10.00–11.00",
      "",
      "==Pengingat hari ini (1)==",
      "- Minum vitamin — Pada 9 Nov",
      "  2026 13.00",
    ],
  },
  { kind: "text", from: "me", at: ch(1, 46), time: "09.12", lines: ["Besok aku kosong jam berapa?", "Mau ngopi sama Raka, 1 jam aja"] },
  {
    kind: "text",
    from: "bot",
    at: ch(1, 76),
    time: "09.12",
    hl: [ch(1, 96)],
    lines: [
      "Besok (Sel, 10 Nov) paling pas",
      "==13.00–14.00== — setelah Rapat",
      "follow-up vendor, sebelum",
      "Telepon vendor.",
      "",
      "Alternatif: 11.30–12.30 atau",
      "16.00–17.00.",
      "",
      "Mau saya jadwalkan di kalender",
      "pukul 13.00–14.00?",
    ],
  },
  { kind: "text", from: "me", at: ch(1, 122), time: "09.13", lines: ["Gas, jadwalkan 👍"] },
  { kind: "text", from: "bot", at: ch(1, 140), time: "09.13", lines: ["Sudah saya jadwalkan:", "", "- Ngopi bareng Raka — 10 Nov", "  2026 13.00–14.00"] },
  { kind: "text", from: "me", at: ch(2, 36), time: "09.15", lines: ["Ingatkan aku telepon Pak Budi", "jam 3 sore"] },
  { kind: "text", from: "bot", at: ch(2, 56), time: "09.15", lines: ["Siap, pengingatnya sudah dibuat.", "", "- Telepon Pak Budi — Pada 9 Nov", "  2026 15.00"] },
  { kind: "text", from: "bot", at: REMIND, time: "15.00", lines: ["⏰ Pengingat - Telepon Pak Budi", "", "waktu: 9 Nov 2026, 15.00"] },
  { kind: "text", from: "me", at: ch(3, 30), time: "15.20", lines: ["Kirimkan proposal Acme dong"] },
  { kind: "doc", at: ch(3, 92), time: "15.20", quote: "Kirimkan proposal Acme dong", name: "Proposal_Acme.pdf", meta: "12 halaman · PDF · 2,4 MB" },
  { kind: "text", from: "bot", at: ch(3, 116), time: "15.20", lines: ["Siap, filenya sudah dikirim.", "", "- Proposal_Acme.pdf — Terkirim", "  sebagai lampiran"] },
  { kind: "text", from: "me", at: ch(4, 40), time: "19.05", lines: ["Ide kue ulang tahun buat Alya?", "Sabtu ini dia ultah"] },
  {
    kind: "text",
    from: "bot",
    at: ch(4, 70),
    time: "19.05",
    hl: [ch(4, 168)],
    lines: ["Karena Alya ==alergi kacang==, coba", "yang bebas kacang:", "", "- Cheesecake stroberi", "- Bolu pandan kukus", "- Tart cokelat tanpa topping", "  kacang"],
  },
];

const compose: Compose[] = [
  { start: ch(1, 8), send: ch(1, 46), text: "Besok aku kosong jam berapa? Mau ngopi sama Raka, 1 jam aja" },
  { start: ch(1, 108), send: ch(1, 122), text: "Gas, jadwalkan 👍" },
  { start: ch(2, 8), send: ch(2, 36), text: "Ingatkan aku telepon Pak Budi jam 3 sore" },
  { start: ch(3, 8), send: ch(3, 30), text: "Kirimkan proposal Acme dong" },
  { start: ch(4, 14), send: ch(4, 40), text: "Ide kue ulang tahun buat Alya? Sabtu ini dia ultah" },
];

const typing: (readonly [number, number])[] = [
  [ch(1, 50), ch(1, 76)],
  [ch(1, 124), ch(1, 140)],
  [ch(2, 40), ch(2, 56)],
  [ch(3, 34), ch(3, 92)],
  [ch(3, 96), ch(3, 116)],
  [ch(4, 44), ch(4, 70)],
];

// World y of lines inside the phone (phone centred on the origin, chat area starts at -339).
const BRIEF_HEADINGS = [-84, 15, 114, 271];
const OLD_MEMORY_Y = -252;
const NEW_MEMORY_Y = 172;

// ------------------------------------------------------------------ camera
export const PHONE_KEYS: CamKey[] = [
  // brief: the phone buzzes on the table, lifts, then the sections get called out
  { f: 0, x: 0, y: 40, dolly: 60, rx: -40, ry: -12, rz: 10 },
  { f: 40, x: 0, y: 20, dolly: -40, rx: -26, ry: -8, rz: 6 },
  { f: 84, x: 0, y: -20, dolly: 60, rx: 0, ry: 0 },
  { f: 104, x: -250, y: 90, dolly: -60, rx: 0, ry: 3 },
  { f: 180, x: -250, y: 90, dolly: -20, rx: 0, ry: 3 },
  // schedule: type → reply + calendar card → event lands
  { f: ch(1, 6), x: 0, y: 300, dolly: 380, rx: 3, ry: -2 },
  { f: ch(1, 46), x: 0, y: 300, dolly: 400, rx: 3, ry: -2 },
  { f: ch(1, 72), x: -300, y: 40, dolly: -40, rx: 0, ry: 2 },
  { f: ch(1, 102), x: -280, y: 60, dolly: 20, rx: 0, ry: 2 },
  { f: ch(1, 114), x: 0, y: 300, dolly: 380, rx: 3, ry: -2 },
  { f: ch(1, 126), x: 0, y: 300, dolly: 380, rx: 3, ry: -2 },
  { f: ch(1, 140), x: -380, y: -40, dolly: 120, rx: 0, ry: 3 },
  { f: ch(1, 190), x: -300, y: 40, dolly: 40, rx: 0, ry: 2 },
  // reminder: type → receipt → screen sleeps while the sky time-lapses → wakes on the reminder
  { f: ch(2, 8), x: 0, y: 300, dolly: 380, rx: 3, ry: -2 },
  { f: ch(2, 60), x: 0, y: 240, dolly: 320, rx: 2, ry: 0 },
  { f: LAPSE[0], x: 0, y: -40, dolly: -720, rx: 0, ry: 0 },
  { f: LAPSE[1], x: 0, y: -40, dolly: -680, rx: 0, ry: 0 },
  { f: REMIND + 8, x: 0, y: -330, dolly: 420, rx: 0, ry: 0 },
  { f: UNLOCK2, x: 0, y: -300, dolly: 400, rx: 0, ry: 0 },
  { f: ch(2, 204), x: 0, y: 260, dolly: 330, rx: 2, ry: 0 },
  // files: type → Sydia searches the files → the right one flies into the chat
  { f: ch(3, 6), x: 0, y: 300, dolly: 380, rx: 3, ry: -2 },
  { f: ch(3, 30), x: 0, y: 300, dolly: 380, rx: 3, ry: -2 },
  { f: ch(3, 50), x: 0, y: -160, dolly: -420, rx: 0, ry: 0 },
  { f: ch(3, 84), x: 0, y: -60, dolly: -300, rx: 0, ry: 0 },
  { f: ch(3, 100), x: 0, y: 200, dolly: 320, rx: 2, ry: 0 },
  { f: ch(3, 140), x: 0, y: 260, dolly: 330, rx: 2, ry: 0 },
  // memory: dusk falls → ask → answer → scroll back to where Sydia learned it → back to the answer
  { f: ch(4, 0), x: 0, y: 0, dolly: -560, rx: 0, ry: 0 },
  { f: ch(4, 18), x: 0, y: 300, dolly: 380, rx: 3, ry: -2 },
  { f: ch(4, 40), x: 0, y: 300, dolly: 380, rx: 3, ry: -2 },
  { f: ch(4, 74), x: 0, y: 190, dolly: 300, rx: 2, ry: 0 },
  { f: ch(4, 100), x: 0, y: 190, dolly: 300, rx: 2, ry: 0 },
  { f: ch(4, 120), x: 180, y: -220, dolly: 340, rx: 0, ry: -2 },
  { f: ch(4, 148), x: 180, y: -220, dolly: 340, rx: 0, ry: -2 },
  { f: ch(4, 168), x: 180, y: 180, dolly: 340, rx: 0, ry: -2 },
  { f: ch(4, 212), x: 140, y: 200, dolly: 300, rx: 0, ry: -2 },
  // dive into the mic button
  { f: DIVE + 20, x: 150, y: 380, dolly: 500, rx: 2, ry: -6 },
  { f: DIVE + 40, x: 186, y: 421, dolly: 760, rx: 0, ry: 0 },
  { f: DIVE + 72, x: 186, y: 421, dolly: 1150, rx: 0, ry: 0 },
];

/** Square canvas: slide the phone right while the memory headline lands on its left. */
const PHONE_KEYS_SQ: CamKey[] = PHONE_KEYS.map((k) => ([ch(4, 18), ch(4, 40), ch(4, 74)].includes(k.f) ? { ...k, x: k.x - 260 } : k));

// ------------------------------------------------------------------ sky
const SKY_H = [7, 9, 12, 15, 17.5, 19, 20.5];
const SKY_TOP = ["#ffc9a8", "#ffd9bd", "#a9d6ff", "#ffcb8e", "#ff9e7c", "#3f2c6c", "#161229"];
const SKY_BOTTOM = ["#fff0e6", "#fff4ea", "#eef7ff", "#fff0db", "#ffd6c4", "#ee8aa6", "#2c1d45"];

/** Clouds are pinned to the clock, so they race during time-lapses and idle otherwise. */
const Clouds: React.FC<{ readonly h: number }> = ({ h }) => {
  const frame = useCurrentFrame();
  const tint = interpolateColors(h, [9, 15, 18, 19.5], ["#ffffff", "#fff4e4", "#ffd0c8", "#6b5a90"]);
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => {
        const w = 360 + random(`cw${i}`) * 420;
        const x = ((random(`cx${i}`) * 2600 + h * 520 + frame * 0.35) % 2600) - 340;
        const y = 40 + random(`cy${i}`) * 420;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: w, height: w * 0.32, borderRadius: "50%", background: tint, opacity: 0.55, filter: "blur(28px)" }} />;
      })}
    </>
  );
};

/** The sky tells the time: sunrise, blue midday, golden afternoon, dusk, night. */
const Sky: React.FC = () => {
  const frame = useCurrentFrame();
  const h = hourOf(frame);
  const top = interpolateColors(h, SKY_H, SKY_TOP);
  const bottom = interpolateColors(h, SKY_H, SKY_BOTTOM);
  const t = (h - 6) / 13;
  const elev = Math.max(0, Math.sin(Math.PI * t));
  const sunX = 8 + t * 84;
  const sunY = 92 - elev * 72;
  const sunOpacity = interpolate(h, [18.4, 19.1], [1, 0], clamp);
  const moon = interpolate(h, [18.8, 19.4], [0, 1], clamp);
  const sunColor = interpolateColors(elev, [0, 0.4, 1], ["#ff8a4c", "#ffd27a", "#fff7d6"]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)` }}>
      <AbsoluteFill style={{ opacity: sunOpacity }}>
        <div style={{ position: "absolute", left: `${sunX}%`, top: `${sunY}%`, width: 900, height: 900, translate: "-50% -50%", borderRadius: "50%", background: `radial-gradient(circle, ${sunColor}aa 0%, ${sunColor}00 60%)` }} />
        <div style={{ position: "absolute", left: `${sunX}%`, top: `${sunY}%`, width: 150, height: 150, translate: "-50% -50%", borderRadius: "50%", backgroundColor: sunColor, boxShadow: `0 0 80px 20px ${sunColor}` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: moon }}>
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: `${random(`sx${i}`) * 100}%`, top: `${random(`sy${i}`) * 55}%`, width: 3, height: 3, borderRadius: 2, backgroundColor: "white", opacity: 0.4 + random(`so${i}`) * 0.5 }} />
        ))}
        <div style={{ position: "absolute", left: "82%", top: "16%", width: 110, height: 110, borderRadius: "50%", backgroundColor: "#fff6e0", boxShadow: "0 0 70px 14px rgba(255,240,210,0.5), inset -26px -10px 0 0 #e8dcc0" }} />
      </AbsoluteFill>
      <Clouds h={h} />
    </AbsoluteFill>
  );
};

/** Time-of-day chip, top-right: the clock the sky is following. */
const TimeChip: React.FC = () => {
  const frame = useCurrentFrame();
  const h = hourOf(frame);
  const period = h < 11 ? "Pagi" : h < 15 ? "Siang" : h < 18.5 ? "Sore" : "Malam";
  const dark = isDark(frame);
  const lapse = (frame > LAPSE[0] && frame < LAPSE[1]) || (frame > ch(4, 0) && frame < ch(4, 28));
  return (
    <div
      style={{
        position: "absolute",
        right: 80,
        top: 64,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 24px 12px 16px",
        borderRadius: 999,
        backgroundColor: dark ? "rgba(20,14,30,0.6)" : "rgba(255,255,255,0.85)",
        color: dark ? "white" : colors.ink,
        fontFamily,
        boxShadow: "0 14px 34px -16px rgba(23,20,25,0.35)",
        scale: String(lapse ? 1.12 : 1),
        transformOrigin: "100% 0%",
      }}
    >
      <span style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: dark ? "#3f2c6c" : "#ffe8b8", color: dark ? "#fff6e0" : "#e08a00", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {dark ? <span style={{ fontSize: 22 }}>☾</span> : <Ic name="sun" size={24} />}
      </span>
      <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{phoneClock(frame)}</span>
      <span style={{ fontSize: 20, fontWeight: 600, opacity: 0.7 }}>{period}</span>
    </div>
  );
};

// ------------------------------------------------------------------ chapter props
/** Brief: each highlighted section gets a callout card, connected to its line. */
const BriefCallouts: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cards = [
    { n: 1, label: "Lewat tenggat", color: colors.rose, icon: "clock" as const },
    { n: 1, label: "Tugas hari ini", color: colors.violet, icon: "checklist" as const },
    { n: 2, label: "Agenda", color: colors.orange, icon: "list" as const },
    { n: 1, label: "Pengingat", color: colors.emerald, icon: "sun" as const },
  ];
  const out = interpolate(frame, [C - 20, C - 4], [0, 1], { ...clamp, easing: easeInOut });
  if (frame < 96 || out >= 1) return null;
  return (
    <>
      {cards.map((c, i) => {
        const start = 100 + i * BEAT;
        const p = spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 180, mass: 0.6 } });
        const line = interpolate(frame, [start, start + 10], [0, 1], { ...clamp, easing: easeOut });
        const y = BRIEF_HEADINGS[i];
        return (
          <div key={c.label}>
            <Place x={-330} y={y} opacity={(1 - out) * Math.min(1, line * 2)}>
              <div style={{ width: 170, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${c.color}00, ${c.color})`, scale: `${line} 1`, transformOrigin: "100% 50%" }} />
            </Place>
            <Place x={-560 - (1 - p) * 60 - out * 120} y={y} opacity={Math.min(1, p) * (1 - out)}>
              <div style={{ width: 280, padding: "14px 18px", borderRadius: 22, backgroundColor: "white", boxShadow: `0 20px 40px -18px ${c.color}99`, display: "flex", alignItems: "center", gap: 14, fontFamily }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: `${c.color}1c`, color: c.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic name={c.icon} size={26} />
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, color: c.color, letterSpacing: "-0.03em" }}>{c.n}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: colors.ink, lineHeight: 1.15 }}>{c.label}</div>
              </div>
            </Place>
          </div>
        );
      })}
    </>
  );
};

/** Schedule: Tuesday's calendar, face-on. Free slots show while Sydia checks; the event lands on "Gas". */
const DayCard: React.FC = () => {
  const local = useCurrentFrame() - ch(1, 0);
  const { fps } = useVideoConfig();
  // Square canvas: a touch smaller and closer to the phone so both stay in frame.
  const sq = useSq();
  if (local < 54 || local > C + 6) return null;
  const inP = spring({ frame: local - 56, fps, config: { damping: 17, stiffness: 140, mass: 0.8 } });
  const out = interpolate(local, [C - 14, C + 4], [0, 1], { ...clamp, easing: easeInOut });
  const W = 820;
  const x = (hr: number) => ((hr - 8) / 10) * W;
  const busy = [
    { from: 10, to: 11, label: "Rapat follow-up vendor", color: colors.pink },
    { from: 15, to: 16, label: "Telepon vendor", color: colors.violet },
  ];
  const free = [
    { from: 11.5, to: 12.5, best: false },
    { from: 13, to: 14, best: true },
    { from: 16, to: 17, best: false },
  ];
  const scan = interpolate(local, [58, 76], [0, 1], { ...clamp, easing: easeInOut });
  const bestPulse = interpolate(local, [96, 104, 140], [0, 1, 0.4], clamp);
  const drop = spring({ frame: local - 142, fps, config: { damping: 10, stiffness: 170, mass: 0.7 } });
  return (
    <Place x={sq(-680, -600)} y={-40} z={(1 - inP) * 300} ry={4} scale={sq(1, 0.85)} opacity={Math.min(1, inP * 1.4) * (1 - out)}>
      <div style={{ width: 900, padding: "26px 40px 36px", borderRadius: 30, backgroundColor: "white", boxShadow: "0 40px 80px -30px rgba(23,20,25,0.35)", fontFamily, color: colors.ink }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 700 }}>
          <Icon name="calendar" size={30} /> Selasa, 10 November
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 19, color: colors.muted, fontWeight: 600 }}>{local < 76 ? "Memeriksa kalender…" : "3 slot kosong"}</span>
        </div>
        <div style={{ position: "relative", height: 160, marginTop: 26 }}>
          {Array.from({ length: 11 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: x(8 + i), top: 0, bottom: 30, borderLeft: "1px solid rgba(23,20,25,0.08)" }}>
              <span style={{ position: "absolute", left: -12, bottom: -32, fontSize: 16, color: colors.muted, fontFamily: "monospace" }}>{pad(8 + i)}</span>
            </div>
          ))}
          {busy.map((b) => (
            <div key={b.label} style={{ position: "absolute", left: x(b.from) + 3, width: x(b.to) - x(b.from) - 6, top: 10, height: 110, borderRadius: 14, backgroundColor: `${b.color}22`, borderLeft: `5px solid ${b.color}`, padding: "8px 10px", fontSize: 16, fontWeight: 700, overflow: "hidden" }}>
              {b.label}
            </div>
          ))}
          {free.map((f, i) => {
            const p = spring({ frame: local - (76 + i * 5), fps, config: { damping: 13, stiffness: 220, mass: 0.6 } });
            const pulse = f.best ? bestPulse : 0;
            return (
              <div
                key={f.from}
                style={{
                  position: "absolute",
                  left: x(f.from) + 3,
                  width: x(f.to) - x(f.from) - 6,
                  top: 10,
                  height: 110,
                  borderRadius: 14,
                  border: `2.5px dashed ${f.best ? colors.emerald : "rgba(16,185,129,0.5)"}`,
                  backgroundColor: f.best ? `rgba(16,185,129,${0.12 + pulse * 0.12})` : "rgba(16,185,129,0.05)",
                  opacity: Math.min(1, p),
                  scale: String(0.85 + Math.min(1, p) * 0.15 + pulse * 0.06),
                  boxShadow: pulse > 0 ? `0 0 0 ${pulse * 8}px rgba(16,185,129,0.18), 0 0 0 ${pulse * 3}px #ffe066` : "none",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  paddingBottom: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  color: colors.emerald,
                }}
              >
                {f.best ? "TERBAIK" : "kosong"}
              </div>
            );
          })}
          {local >= 142 ? (
            <div style={{ position: "absolute", left: x(13) + 3, width: x(14) - x(13) - 6, top: 10, height: 110, borderRadius: 14, backgroundColor: "#fde0ea", borderLeft: "5px solid #f06694", padding: "8px 10px", fontSize: 16, fontWeight: 700, color: "#a3173f", translate: `0 ${(1 - drop) * -170}px`, opacity: Math.min(1, drop * 2), boxShadow: "0 16px 30px -12px rgba(240,102,148,0.6)" }}>
              Ngopi bareng Raka
            </div>
          ) : null}
          <div style={{ position: "absolute", left: scan * W, top: 0, bottom: 30, width: 3, backgroundColor: colors.brand, opacity: scan > 0 && scan < 1 ? 1 : 0, boxShadow: `0 0 18px ${colors.brand}` }} />
        </div>
      </div>
    </Place>
  );
};

/** Files: Sydia lays out the saved files, finds the proposal and sends it into the chat. */
const FileFan: React.FC = () => {
  const frame = useCurrentFrame() - ch(3, 0);
  const { fps } = useVideoConfig();
  if (frame < 44 || frame > C) return null;
  const files = [
    { name: "Laporan_Q3.xlsx", color: colors.emerald, icon: "table" as const },
    { name: "Notulen_rapat.docx", color: "#3b82f6", icon: "pdf" as const },
    { name: "Proposal_Acme.pdf", color: "#e5484d", icon: "pdf" as const, hit: true },
    { name: "Mascot.png", color: colors.violet, icon: "image" as const },
    { name: "Kontrak_klien.pdf", color: "#e5484d", icon: "pdf" as const },
  ];
  const open = spring({ frame: frame - 46, fps, config: { damping: 16, stiffness: 130, mass: 0.8 } });
  const close = interpolate(frame, [88, 108], [0, 1], { ...clamp, easing: easeInOut });
  const fly = interpolate(frame, [72, 92], [0, 1], { ...clamp, easing: easeInOut });
  const found = interpolate(frame, [62, 68], [0, 1], clamp);
  return (
    <>
      {files.map((f, i) => {
        const hl = f.hit ? found : 0;
        let x = (i - 2) * 330 * open;
        let y = -560 - hl * 40;
        let z = -40 + hl * 80;
        let sc = 0.85 + hl * 0.1;
        let op = Math.min(1, open * 1.4) * (f.hit ? 1 : (1 - close) * (1 - found * 0.45));
        if (f.hit && fly > 0) {
          x = interpolate(fly, [0, 1], [x, 0]);
          y = interpolate(fly, [0, 1], [y, 200]);
          z = interpolate(fly, [0, 1], [z, 40]);
          sc = interpolate(fly, [0, 1], [sc, 0.3]);
          op = interpolate(fly, [0.85, 1], [1, 0], clamp);
        }
        return (
          <Place key={f.name} x={x} y={y} z={z} scale={sc} opacity={op}>
            <div style={{ width: 290, height: 230, borderRadius: 26, backgroundColor: "white", boxShadow: hl > 0 ? `0 0 0 ${hl * 6}px ${colors.brand}55, 0 40px 70px -24px rgba(23,20,25,0.4)` : "0 30px 60px -26px rgba(23,20,25,0.35)", padding: 20, fontFamily, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, borderRadius: 16, backgroundColor: `${f.color}12`, display: "flex", alignItems: "center", justifyContent: "center", color: f.color }}>
                <Ic name={f.icon} size={70} strokeWidth={1.6} />
              </div>
              <div style={{ fontSize: 21, fontWeight: 700, marginTop: 14, color: colors.ink }}>{f.name}</div>
            </div>
          </Place>
        );
      })}
    </>
  );
};

/** Memory: a label pinned to what Sydia remembered, travelling with the scroll to where it was used. */
const MemoryLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < REWIND[1] - 2 || frame > ch(4, 214)) return null;
  const p = spring({ frame: frame - REWIND[1], fps, config: { damping: 15, stiffness: 200, mass: 0.6 } });
  const travel = interpolate(frame, [REWIND[2], REWIND[3]], [0, 1], { ...clamp, easing: easeInOut });
  const y = interpolate(travel, [0, 1], [OLD_MEMORY_Y, NEW_MEMORY_Y]);
  const used = frame >= REWIND[2] + 8;
  const fade = interpolate(frame, [ch(4, 200), ch(4, 214)], [1, 0], clamp);
  return (
    <Place x={480} y={y} z={30} opacity={Math.min(1, p) * fade} scale={0.8 + Math.min(1, p) * 0.2}>
      <div style={{ display: "flex", alignItems: "center", fontFamily }}>
        <svg width="46" height="24" viewBox="0 0 46 24" style={{ marginRight: -2 }}>
          <path d="M44 12H6M14 4 4 12l10 8" fill="none" stroke="#ffe066" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px 14px 14px", borderRadius: 22, backgroundColor: "white", boxShadow: "0 24px 50px -20px rgba(0,0,0,0.55)", whiteSpace: "nowrap" }}>
          <SydiaMark size={40} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.ink }}>{used ? "Sydia bantu ingat" : "Ceritakan ke Sydia"}</div>
          </div>
        </div>
      </div>
    </Place>
  );
};

// ------------------------------------------------------------------ phone body
export const PhoneBody: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lift = spring({ frame: frame - 30, fps, config: { damping: 15, stiffness: 70, mass: 1 } });
  const buzz = (from: number, len: number) => (frame >= from && frame < from + len ? Math.sin(frame * 3.3) * 5 : 0);
  const b = buzz(16, 18) + buzz(REMIND, 20);
  const firstLock = frame < ch(2, 0);
  // Locking fades the lock screen in; unlocking swipes it up off the chat.
  const swipe = firstLock ? interpolate(frame, [UNLOCK - 8, UNLOCK + 4], [0, 1], { ...clamp, easing: easeInOut }) : interpolate(frame, [UNLOCK2, UNLOCK2 + 10], [0, 1], { ...clamp, easing: easeInOut });
  const lockOpacity = firstLock ? 1 : interpolate(frame, [LOCK2, SLEEP], [0, 1], clamp);
  const lockVisible = swipe < 1 && lockOpacity > 0;
  const screenOff = interpolate(frame, [SLEEP, LAPSE[0], LAPSE[1], REMIND - 2], [0, 0.97, 0.97, 0], clamp);
  const rewind = interpolate(frame, [...REWIND], [0, 1, 1, 0], { ...clamp, easing: easeInOut });
  return (
    <Place rx={66 * (1 - lift)} rz={-14 * (1 - lift) + b * 0.4} x={b} z={-60 * (1 - lift)}>
      <div style={{ position: "relative", width: 470, height: 960 }}>
        {!lockVisible || lockOpacity < 1 || swipe > 0 ? (
          <div style={{ position: "absolute", inset: 0 }}>
            <Phone msgs={waMessages} compose={compose} typing={typing} time={phoneClock(frame)} rewind={rewind} />
          </div>
        ) : null}
        {lockVisible ? (
          <div style={{ position: "absolute", inset: 0, opacity: lockOpacity, overflow: "hidden", borderRadius: 74 }}>
            <div style={{ translate: `0 ${-swipe * 105}%` }}>
              <Phone
                time={firstLock ? "08.00" : phoneClock(frame)}
                lock={{ date: "Senin, 9 November" }}
                screenOff={firstLock ? 0 : screenOff}
                banner={
                  firstLock
                    ? { at: 16, until: 999, title: "Sydia", text: "Selamat pagi, Kak Nadia! Ada 1 tugas lewat tenggat, beresin dulu sebelum…" }
                    : { at: REMIND, until: 99999, title: "Sydia", text: "⏰ Pengingat - Telepon Pak Budi · waktu: 9 Nov 2026, 15.00" }
                }
              />
            </div>
          </div>
        ) : null}
      </div>
    </Place>
  );
};

// ------------------------------------------------------------------ act
export const phoneCaptions: Caption[] = [
  { from: 6, to: ch(1, 0) - 6, title: "Sydia membantumu", accent: "memulai hari." },
  { from: ch(1, 4), to: ch(2, 0) - 6, title: "Cari jadwal kosong?", accent: "Tanya aja.", pos: "bc" },
  { from: ch(2, 4), to: ch(3, 0) - 6, title: "Pengingat,", accent: "tepat waktu.", pos: "bc" },
  { from: ch(3, 4), to: ch(4, 0) - 6, title: "Butuh file?", accent: "Minta aja.", pos: "bc" },
  { from: ch(4, 30), to: DIVE + 10, title: "Ingat hal kecil", accent: "yang kamu\nceritakan.", pos: "l" },
];

/** Night-blue iris that opens out of the mic button as the camera dives in. */
const DiveCover: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [DIVE + 42, PHONE_LEN], [0, 1], { ...clamp, easing: (t) => t * t * t });
  if (p <= 0) return null;
  const size = 70 + p * 2400;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: "#0d1226",
          boxShadow: `0 0 0 ${6 + p * 10}px #00a884, 0 0 ${40 + p * 80}px ${10 + p * 30}px rgba(0,168,132,0.55)`,
          opacity: interpolate(p, [0, 0.08], [0, 1], clamp),
        }}
      />
    </AbsoluteFill>
  );
};

/** Soft floating orbs scattered in depth (used by the outro cluster). */
export const Orbs: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 16 }, (_, i) => {
        const x = (random(`ox${i}`) - 0.5) * 4200;
        const y = (random(`oy${i}`) - 0.5) * 2600;
        const z = -600 - random(`oz${i}`) * 1600;
        const r = 60 + random(`or${i}`) * 180;
        const hue = [colors.peach, colors.pink, colors.lilac, "#ffffff"][i % 4];
        return (
          <Place key={i} x={x + Math.sin(frame / 60 + i) * 30} y={y + Math.cos(frame / 70 + i) * 30} z={z}>
            <div style={{ width: r * 2, height: r * 2, borderRadius: r, background: `radial-gradient(circle, ${hue}cc 0%, ${hue}00 70%)`, opacity: 0.7 }} />
          </Place>
        );
      })}
    </>
  );
};

export const PhoneAct: React.FC = () => {
  const frame = useCurrentFrame();
  const sq = useSq();
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Sky />
      <CameraStage keys={sq(PHONE_KEYS, PHONE_KEYS_SQ)} drift={frame > DIVE ? 0 : 0.35}>
        <FileFan />
        <DayCard />
        <PhoneBody />
        <BriefCallouts />
        <MemoryLabel />
      </CameraStage>
      {phoneCaptions.map((c) => (
        <CaptionView key={c.title} c={c} dark={isDark(c.from + 40)} />
      ))}
      {frame < DIVE + 30 ? <TimeChip /> : null}
      <DiveCover />
      <Grain opacity={isDark(frame) ? 0.16 : 0.08} />
    </AbsoluteFill>
  );
};
