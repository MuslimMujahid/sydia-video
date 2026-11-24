import type React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Grain } from "../../promo/components/Backgrounds";
import { colors, easeInOut, easeOut, fontFamily } from "../../promo/theme";
import { CameraStage, type CamKey, Place } from "../components/Camera";
import { useSq } from "../format";
import { type ChatMsg, Phone } from "../components/Phone";
import { BAR } from "../timeline";
import { clamp, Ic } from "../ui";
import { CaptionView } from "./DesktopAct";

export const VOICE_LEN = 4 * BAR;
const REC: readonly [number, number] = [40, 150];
const SENT = 154;
const REPLY = 214;
const CARD = 226;

const msgs: ChatMsg[] = [
  { kind: "chip", at: -1, label: "Hari ini" },
  { kind: "text", from: "bot", at: -1, time: "18.02", lines: ["Siap, pengingatnya sudah dibuat.", "", "- Jemput Alya — Pada 9 Nov", "  2026 18.30"] },
  { kind: "voice", at: SENT, dur: "0:04", time: "19.40" },
  { kind: "text", from: "bot", at: REPLY, time: "19.40", lines: ["Siap, 2 pengeluaran sudah dicatat", "di Catatan Pengeluaran:", "", "- Bensin — Rp150.000", "- Parkir — Rp10.000"] },
];

// World layout: phone on the right, the transcript and expense card on the left.
const PX = 470;
const PS = 0.9;
const MIC = { x: PX + 186 * PS, y: 421 * PS };
const TX = -400;

// The camera only moves to follow what is happening: mic -> waveform -> transcript -> card.
const KEYS: CamKey[] = [
  { f: 0, x: MIC.x - 40, y: MIC.y - 40, dolly: 640, rx: 0, ry: 0 },
  { f: 34, x: MIC.x - 70, y: MIC.y - 60, dolly: 560, rx: 0, ry: 0 },
  { f: 92, x: 220, y: 240, dolly: 180, rx: 0, ry: 2 },
  { f: 146, x: -20, y: 40, dolly: 0, rx: 0, ry: 2 },
  { f: CARD, x: -20, y: 40, dolly: 0, rx: 0, ry: 2 },
  { f: VOICE_LEN + 12, x: -40, y: 50, dolly: 70, rx: 0, ry: 2 },
];

/**
 * Square canvas: start with the mic left of centre so the headline has the right side,
 * then frame the transcript, card and phone together a little wider.
 */
const KEYS_SQ: CamKey[] = [
  { f: 0, x: MIC.x + 80, y: MIC.y - 40, dolly: 640, rx: 0, ry: 0 },
  { f: 34, x: MIC.x + 50, y: MIC.y - 60, dolly: 560, rx: 0, ry: 0 },
  { f: 92, x: 220, y: 240, dolly: 180, rx: 0, ry: 2 },
  { f: 146, x: -65, y: 40, dolly: -150, rx: 0, ry: 2 },
  { f: CARD, x: -65, y: 40, dolly: -150, rx: 0, ry: 2 },
  { f: VOICE_LEN + 12, x: -75, y: 50, dolly: -90, rx: 0, ry: 2 },
];

/** City lights sliding past a car window. */
const CityLights: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 26 }, (_, i) => {
        const z = -500 - random(`cz${i}`) * 1800;
        const speed = 6 + random(`cs${i}`) * 10;
        const span = 6000;
        const x = ((random(`cx${i}`) * span - frame * speed) % span + span) % span - span / 2;
        const y = -300 + random(`cy${i}`) * 900;
        const r = 40 + random(`cr${i}`) * 120;
        const hue = ["#ffb46b", "#ff6b8b", "#ffe2a8", "#9a8cff", "#ffffff"][i % 5];
        return (
          <Place key={i} x={x} y={y} z={z}>
            <div style={{ width: r * 2, height: r * 2, borderRadius: r, background: `radial-gradient(circle, ${hue}aa 0%, ${hue}00 70%)` }} />
          </Place>
        );
      })}
    </>
  );
};

/** Waveform that flows from the mic, under the phone, to where the transcript will appear. */
const RIBBON_X = [MIC.x - 10, PX + 40, PX - 300, TX + 120, TX - 300];
const RIBBON_Y = [MIC.y + 30, 470, 470, 110, 0];
const WaveRibbon: React.FC = () => {
  const frame = useCurrentFrame();
  const on = interpolate(frame, [REC[0], REC[0] + 10, REC[1] - 4, SENT + 10], [0, 1, 1, 0], clamp);
  if (on <= 0) return null;
  const n = 48;
  const knots = RIBBON_X.map((_, i) => i / (RIBBON_X.length - 1));
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const born = REC[0] + t * 60;
        const vis = interpolate(frame, [born, born + 8], [0, 1], clamp);
        const x = interpolate(t, knots, RIBBON_X);
        const y = interpolate(t, knots, RIBBON_Y);
        const speech = 0.3 + 0.7 * Math.abs(Math.sin(frame / 4.5 + i * 0.55)) * (0.55 + random(`v${i}-${Math.floor(frame / 3)}`) * 0.45);
        const h = 18 + speech * 110 * Math.sin(Math.min(1, 0.15 + t) * Math.PI * 0.85);
        return (
          <Place key={i} x={x} y={y} z={30} opacity={vis * on}>
            <div style={{ width: 14, height: Math.max(14, h), borderRadius: 7, background: "linear-gradient(180deg, #ffb27a, #f06694 50%, #8c5cff)", boxShadow: "0 0 22px rgba(240,102,148,0.5)" }} />
          </Place>
        );
      })}
    </>
  );
};

const TRANSCRIPT = ["“Tadi isi bensin", "150 ribu, parkir", "10 ribu. Tolong", "dicatat ya.”"];

/** Spoken words land where the waveform ended, then step up to sit above the expense card. */
const Transcript: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < SENT) return null;
  const lines = TRANSCRIPT.map((l) => l.split(" "));
  const total = lines.flat().length;
  const shown = interpolate(frame, [SENT + 6, SENT + 50], [0, total], clamp);
  const label = interpolate(frame, [SENT, SENT + 10], [0, 1], clamp);
  const up = interpolate(frame, [CARD - 6, CARD + 12], [0, 1], { ...clamp, easing: easeInOut });
  let k = 0;
  let hot = false;
  return (
    <Place x={TX} y={interpolate(up, [0, 1], [-10, -215])} z={40} scale={interpolate(up, [0, 1], [1, 0.62])}>
      <div style={{ width: 780, fontFamily, color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, fontWeight: 600, color: "rgba(255,255,255,0.7)", opacity: label, marginBottom: 14 }}>
          <Ic name="sparkle" size={24} color="#ffb27a" />
          Sydia mendengar
        </div>
        {lines.map((tokens, li) => (
          <div key={li} style={{ fontSize: 66, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.14, whiteSpace: "nowrap" }}>
            {tokens.map((token) => {
              const p = Math.max(0, Math.min(1, shown - k++));
              // `==` toggles the highlight, which may open in one token and close in a later one.
              const segs = token.split("==").map((text, i) => {
                if (i > 0) hot = !hot;
                return { text, hot };
              });
              return (
                <span key={`${token}${k}`} style={{ display: "inline-block", marginRight: 16, opacity: p, translate: `0 ${(1 - p) * 20}px`, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined }}>
                  {segs
                    .filter((sg) => sg.text)
                    .map((sg, i) =>
                      sg.hot ? (
                        <span key={i} style={{ backgroundImage: "linear-gradient(90deg, #ffb27a, #f06694)", WebkitBackgroundClip: "text", color: "transparent" }}>
                          {sg.text}
                        </span>
                      ) : (
                        <span key={i}>{sg.text}</span>
                      ),
                    )}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </Place>
  );
};

const ExpenseCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < CARD - 2) return null;
  const p = spring({ frame: frame - CARD, fps, config: { damping: 16, stiffness: 120, mass: 0.8 } });
  const rows = [
    { d: "8 Nov 2026", k: "Belanja mingguan", n: 245000, at: -100 },
    { d: "9 Nov 2026", k: "Bensin", n: 150000, at: CARD + 14 },
    { d: "9 Nov 2026", k: "Parkir", n: 10000, at: CARD + 24 },
  ];
  const total = rows.reduce((a, r) => a + r.n * interpolate(frame, [r.at, r.at + 14], [0, 1], { ...clamp, easing: easeOut }), 0);
  return (
    <Place x={TX} y={175 + (1 - p) * 80} z={40} scale={0.92 + p * 0.08} opacity={Math.min(1, p * 1.4)}>
      <div style={{ width: 820, padding: "26px 30px", borderRadius: 30, backgroundColor: "rgba(255,255,255,0.96)", boxShadow: "0 40px 90px -30px rgba(0,0,0,0.6)", fontFamily, color: colors.ink }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 30, fontWeight: 700 }}>
          <Ic name="table" size={30} color={colors.emerald} /> Catatan Pengeluaran
        </div>
        <div style={{ marginTop: 18, borderRadius: 16, border: "1px solid rgba(23,20,25,0.1)", overflow: "hidden" }}>
          {rows.map((r) => {
            const rp = interpolate(frame, [r.at, r.at + 10], [0, 1], { ...clamp, easing: easeOut });
            return (
              <div key={r.k} style={{ display: "grid", gridTemplateColumns: "190px 1fr 180px", height: 60 * rp, overflow: "hidden", alignItems: "center", fontSize: 22, borderBottom: "1px solid rgba(23,20,25,0.07)", padding: "0 20px", backgroundColor: r.at > 0 ? `rgba(16,185,129,${0.1 * (1 - interpolate(frame, [r.at + 20, r.at + 50], [0, 1], clamp))})` : "white", opacity: rp }}>
                <span style={{ color: colors.muted }}>{r.d}</span>
                <span style={{ fontWeight: 600 }}>{r.k}</span>
                <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.n.toLocaleString("id-ID")}</span>
              </div>
            );
          })}
          <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 180px", height: 62, alignItems: "center", fontSize: 22, fontWeight: 800, padding: "0 20px", backgroundColor: "#faf6f3" }}>
            <span>Total</span>
            <span />
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: colors.emerald }}>{Math.round(total).toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>
    </Place>
  );
};

export const VoiceAct: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 16], [1, 0], clamp);
  const sq = useSq();
  return (
    <AbsoluteFill style={{ fontFamily, background: "linear-gradient(180deg, #0d1226 0%, #1d1838 55%, #34204a 100%)" }}>
      <CameraStage keys={sq(KEYS, KEYS_SQ)} drift={0}>
        <CityLights />
        <WaveRibbon />
        <Transcript />
        <ExpenseCard />
        <Place x={PX} scale={PS}>
          <Phone msgs={msgs} time={frame < SENT ? "19.39" : "19.40"} recording={{ start: REC[0], end: REC[1] }} typing={[[SENT + 18, REPLY]]} />
        </Place>
      </CameraStage>
      <CaptionView c={{ from: 8, to: VOICE_LEN + 12, title: "Males ngetik?", accent: "Kirim voice\nnote aja.", pos: "r" }} dark />
      <AbsoluteFill style={{ backgroundColor: "#0d1226", opacity: reveal }} />
      <Grain opacity={0.2} />
    </AbsoluteFill>
  );
};
