import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Grain, SoftCanvas } from "../../promo/components/Backgrounds";
import { colors, easeInOut, easeOut, fontFamily, textGradient } from "../../promo/theme";
import { CameraStage, type CamKey, Place } from "../components/Camera";
import { type Attach, chipAnchor, type Compose, DesktopChat, type DMsg, Popover } from "../components/DesktopApp";
import { CalendarWin, FilesWin, TaskBoardWin } from "../components/FeatureWindows";
import { useFormat } from "../format";
import { BAR } from "../timeline";
import { clamp, Pointer } from "../ui";

export const DESK_LEN = 14 * BAR; // bars 2 → 16

// ------------------------------------------------------------------ script
export const T = {
  send1: 66,
  bot1: 108,
  chip1Click: 166,
  panelOpen: 168,
  panelType: 196,
  panelClose: 278,
  send2: 340,
  bot2: 372,
  chip2Click: 392,
  lihat: 424,
  tasksIn: 426,
  send3: 548,
  bot3: 576,
  send4: 636,
  bot4: 660,
  calIn: 668,
  calDrop: 44,
  drag: 798,
  drop: 836,
  ready: 862,
  send5: 880,
  bot5: 918,
  filesIn: 944,
};

export const deskMsgs: DMsg[] = [
  { kind: "user", at: T.send1, lines: ["Buatkan catatan rapat vendor: harga final 48 juta,", "draf kontrak sebelum Jumat"] },
  { kind: "think", at: T.send1 + 8, until: T.bot1, label: "Sydia sedang menyiapkan jawaban…" },
  {
    kind: "bot",
    at: T.bot1,
    blocks: [
      { t: "p", lines: ["Siap, Kak Nadia! Catatan rapatnya sudah jadi."] },
      { t: "h", text: "Catatan Rapat Vendor — 9 Nov 2026" },
      { t: "li", lines: ["Harga final disepakati: Rp48.000.000"] },
      { t: "li", lines: ["Draf kontrak dikirim sebelum Jumat"] },
      { t: "p", lines: ["Kalau mau, saya bisa bantu ingatkan tenggat draf kontraknya."] },
      { t: "chip", chip: { kind: "note", label: "Catatan Rapat Vendor — 9 Nov 2026" } },
    ],
  },
  { kind: "user", at: T.send2, lines: ["Tambahkan tugas kirim draf kontrak ke vendor,", "tenggat Jumat jam 5 sore, prioritas tinggi"] },
  { kind: "think", at: T.send2 + 8, until: T.bot2, label: "Sydia sedang menyiapkan jawaban…" },
  {
    kind: "bot",
    at: T.bot2,
    blocks: [
      { t: "p", lines: ["Siap, tugasnya sudah dibuat."] },
      { t: "li", chip: { kind: "task", label: "Kirim draf kontrak ke vendor" }, lines: ["— Tenggat 13 Nov 2026, 17.00 · Prioritas tinggi"] },
    ],
  },
  { kind: "user", at: T.send3, lines: ["Jadwalkan rapat follow-up vendor Selasa jam 10, 1 jam"] },
  { kind: "think", at: T.send3 + 8, until: T.bot3, label: "Sydia sedang memeriksa kalender…" },
  {
    kind: "bot",
    at: T.bot3,
    blocks: [
      { t: "p", lines: ["Selasa 10 November pukul 10.00–11.00 masih kosong —", "tidak ada bentrok di kalender."] },
      { t: "p", lines: ["Mau saya jadwalkan **Rapat follow-up vendor** di kalender", "untuk Selasa, 10 Nov 2026, pukul 10.00–11.00?"] },
    ],
  },
  { kind: "user", at: T.send4, lines: ["Ya, jadwalkan"] },
  { kind: "think", at: T.send4 + 6, until: T.bot4, label: "Sydia sedang menyiapkan jawaban…" },
  {
    kind: "bot",
    at: T.bot4,
    blocks: [
      { t: "p", lines: ["Sudah masuk kalender, Kak Nadia!"] },
      { t: "li", lines: ["Rapat follow-up vendor — Selasa, 10 Nov 2026, 10.00–11.00"] },
    ],
  },
  { kind: "user", at: T.send5, lines: ["Simpan dan ringkas proposal ini"], file: "Proposal_Acme.pdf" },
  { kind: "think", at: T.send5 + 8, until: T.bot5, label: "Sydia sedang membaca dokumen…" },
  {
    kind: "bot",
    at: T.bot5,
    blocks: [
      { t: "p", lines: ["Siap, filenya sudah disimpan."] },
      { t: "li", chip: { kind: "file", label: "Proposal_Acme.pdf" }, lines: ["— PDF · 2,4 MB"] },
      { t: "h", text: "Ringkasan" },
      { t: "li", lines: ["Pengadaan 120 laptop untuk cabang Surabaya & Bandung"] },
      { t: "li", lines: ["Nilai Rp48 jt per batch, dikirim dalam dua batch"] },
      { t: "li", lines: ["Tanda tangan kontrak: 13 Nov 2026"] },
    ],
  },
];

const compose: Compose[] = [
  { start: 12, send: T.send1, text: "Buatkan catatan rapat vendor: harga final 48 juta, draf kontrak sebelum Jumat" },
  { start: 296, send: T.send2, text: "Tambahkan tugas kirim draf kontrak ke vendor, tenggat Jumat jam 5 sore, prioritas tinggi" },
  { start: 512, send: T.send3, text: "Jadwalkan rapat follow-up vendor Selasa jam 10, 1 jam" },
  { start: 618, send: T.send4, text: "Ya, jadwalkan" },
  { start: 846, send: T.send5, text: "Simpan dan ringkas proposal ini" },
];

const attach: Attach = { at: T.drop, ready: T.ready, sent: T.send5, name: "Proposal_Acme.pdf" };

// ------------------------------------------------------------------ camera
export const DESK_KEYS: CamKey[] = [
  { f: 0, x: 0, y: 40, dolly: -760, rx: 16, ry: -28 },
  { f: 56, x: 60, y: 40, dolly: 300, rx: 6, ry: -9 },
  { f: 70, x: 60, y: 40, dolly: 330, rx: 5, ry: -7 },
  { f: 112, x: 60, y: -150, dolly: 260, rx: 4, ry: 3 },
  { f: 160, x: 40, y: -90, dolly: 360, rx: 2, ry: 7 },
  { f: 196, x: 330, y: -40, dolly: 280, rx: 0, ry: 14 },
  { f: 262, x: 420, y: -60, dolly: 420, rx: -1, ry: 18 },
  { f: 300, x: 120, y: 330, dolly: 330, rx: 13, ry: -8 },
  { f: 344, x: 120, y: 330, dolly: 420, rx: 14, ry: -5 },
  { f: 382, x: 80, y: 130, dolly: 340, rx: 5, ry: 3 },
  { f: 418, x: 60, y: 170, dolly: 420, rx: 3, ry: 6 },
  { f: 446, x: 700, y: 0, dolly: -300, rx: 0, ry: 20 },
  { f: 480, x: 1480, y: -30, dolly: 260, rx: 0, ry: 33 },
  { f: 502, x: 1440, y: -30, dolly: 200, rx: 0, ry: 30 },
  { f: 532, x: 120, y: 340, dolly: 360, rx: 14, ry: -9 },
  { f: 556, x: 120, y: 320, dolly: 380, rx: 12, ry: -6 },
  { f: 592, x: 80, y: 130, dolly: 340, rx: 4, ry: 3 },
  { f: 624, x: 120, y: 320, dolly: 380, rx: 10, ry: -4 },
  { f: 664, x: 80, y: 170, dolly: 300, rx: 5, ry: 0 },
  { f: 700, x: 0, y: 520, dolly: -260, rx: -26, ry: 2 },
  { f: 750, x: 30, y: 720, dolly: 260, rx: -34, ry: -5 },
  { f: 786, x: 0, y: 700, dolly: 200, rx: -32, ry: -3 },
  { f: 814, x: -40, y: 360, dolly: 260, rx: 10, ry: 8 },
  { f: 848, x: 120, y: 360, dolly: 400, rx: 12, ry: -4 },
  { f: 886, x: 100, y: 220, dolly: 300, rx: 6, ry: 0 },
  { f: 934, x: 80, y: 100, dolly: 330, rx: 2, ry: 5 },
  { f: 968, x: -800, y: 20, dolly: -260, rx: 0, ry: -16 },
  { f: 1000, x: -1480, y: 40, dolly: 220, rx: 0, ry: -31 },
  { f: DESK_LEN, x: -1460, y: 40, dolly: 180, rx: 0, ry: -29 },
];

// ------------------------------------------------------------------ world
/** Faint dot grid far behind everything, for parallax. */
export const DotField: React.FC<{ readonly opacity?: number }> = ({ opacity = 1 }) => (
  <Place z={-1400} x={0} y={200} opacity={opacity}>
    <div
      style={{
        width: 9000,
        height: 6000,
        backgroundImage: "radial-gradient(circle, rgba(140,92,255,0.22) 2.2px, transparent 2.6px)",
        backgroundSize: "70px 70px",
        maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, black 30%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, black 30%, transparent 70%)",
      }}
    />
  </Place>
);

const useArrive = (start: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 90, mass: 1 } });
};

type Pose = { readonly x: number; readonly y: number; readonly z: number; readonly rx: number; readonly ry: number; readonly scale: number; readonly opacity: number };
/**
 * Cover-flow row used by the breather (camera face-on, dolly 0): files, chat, tasks, calendar
 * left to right, each scaled to a similar on-screen width. The window nearest the camera sits
 * flat; its neighbours angle toward it and step back.
 */
export const ROW_GAP = 1300;
const ROW: Record<"chat" | "tasks" | "cal" | "files", { readonly x: number; readonly scale: number }> = {
  files: { x: -1.5 * ROW_GAP, scale: 1 },
  chat: { x: -0.5 * ROW_GAP, scale: 0.72 },
  tasks: { x: 0.5 * ROW_GAP, scale: 1 },
  cal: { x: 1.5 * ROW_GAP, scale: 0.9 },
};
export const ROW_START = ROW.files.x;
export const ROW_END = ROW.cal.x;
const ORDER = ["files", "chat", "tasks", "cal"] as const;

/**
 * Everything that lives in the desktop world. Frame-driven, so it can be frozen for the bridge.
 * `row` (0→1) glides the windows from their world spots into the cover-flow row, posed
 * around the camera's x position `camX`.
 */
export const DesktopWorld: React.FC<{ readonly fade?: number; readonly row?: number; readonly camX?: number }> = ({ fade = 1, row = 0, camX = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const panelIn = spring({ frame: frame - T.panelOpen, fps, config: { damping: 18, stiffness: 140, mass: 0.8 } });
  const panelOut = interpolate(frame, [T.panelClose, T.panelClose + 14], [0, 1], { ...clamp, easing: easeInOut });
  const panel = frame < T.panelOpen ? 0 : panelIn * (1 - panelOut);
  const tasks = useArrive(T.tasksIn);
  const cal = useArrive(T.calIn);
  const filesP = useArrive(T.filesIn);
  const tasksBack = interpolate(frame, [506, 540], [0, 1], { ...clamp, easing: easeInOut });
  const calBack = interpolate(frame, [790, 820], [0, 1], { ...clamp, easing: easeInOut });

  // Pointer path, in window-content coordinates.
  const chip1 = chipAnchor(deskMsgs, T.chip1Click, 2);
  const chip2 = chipAnchor(deskMsgs, T.chip2Click, 5);
  const glow = (f: number) => interpolate(f, [T.chip1Click - 2, T.chip1Click + 2, T.chip1Click + 14], [0, 1, 0], clamp) + interpolate(f, [T.chip2Click - 2, T.chip2Click + 2, T.chip2Click + 14], [0, 1, 0], clamp);

  // Dragged PDF card, in window-content coordinates.
  const dragP = interpolate(frame, [T.drag, T.drop], [0, 1], { ...clamp, easing: easeInOut });
  const dragVis = interpolate(frame, [T.drag, T.drag + 6, T.drop - 2, T.drop + 4], [0, 1, 1, 0], clamp);

  const world: Record<keyof typeof ROW, Pose> = {
    tasks: { x: 1480, y: -30, z: -260 + (1 - tasks) * 900 - tasksBack * 260, rx: (1 - tasks) * 20, ry: -33 + (1 - tasks) * -40, scale: 1, opacity: Math.min(1, tasks * 1.5) * (1 - tasksBack * 0.25) },
    files: { x: -1480, y: 40, z: -260 + (1 - filesP) * 900, rx: (1 - filesP) * -20, ry: 31 + (1 - filesP) * 40, scale: 1, opacity: Math.min(1, filesP * 1.5) },
    chat: { x: 0, y: 0, z: 0, rx: 0, ry: 0, scale: 1, opacity: 1 },
    cal: { x: 0, y: 720 + calBack * 80, z: 240 + (1 - cal) * 700 - calBack * 200, rx: 64 + (1 - cal) * 30, ry: 0, scale: 1, opacity: Math.min(1, cal * 1.5) },
  };
  const pose = (key: keyof typeof ROW) => {
    const i = ORDER.indexOf(key);
    const g = easeInOut(Math.max(0, Math.min(1, (row - i * 0.08) / 0.76)));
    const a = world[key];
    const d = Math.max(-1.2, Math.min(1.2, (ROW[key].x - camX) / ROW_GAP));
    const b: Pose = { x: ROW[key].x, y: 0, z: -Math.abs(d) * 280, rx: 0, ry: -d * 30, scale: ROW[key].scale, opacity: 1 - Math.min(1, Math.abs(d)) * 0.3 };
    const mix = (k: keyof Pose) => a[k] + (b[k] - a[k]) * g;
    return { x: mix("x"), y: mix("y"), z: mix("z"), rx: mix("rx"), ry: mix("ry"), scale: mix("scale"), opacity: mix("opacity") * fade };
  };

  return (
    <>
      <DotField opacity={fade} />
      <Place {...pose("tasks")}>{frame >= T.tasksIn ? <TaskBoardWin t={frame - T.tasksIn} /> : null}</Place>
      <Place {...pose("files")}>{frame >= T.filesIn ? <FilesWin t={frame - T.filesIn} /> : null}</Place>
      <Place {...pose("chat")}>
        <DesktopChat
          msgs={deskMsgs}
          compose={compose}
          attach={attach}
          context={{ from: T.panelOpen + 16, to: T.panelClose + 6, label: "Catatan Rapat Vendor — 9 Nov 2026" }}
          panel={panel}
          panelTypeFrom={T.panelType}
          firstSend={T.send1}
          convoTitle="Buatkan catatan rapat ven…"
          glowChip={glow}
          overlay={
            <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
              <Popover frame={frame} at={T.chip2Click + 2} until={T.lihat + 8} title="Kirim draf kontrak ke vendor" lines={["Inbox", "13 Nov 2026, 17.00"]} primary="Tandai selesai" secondary="Lihat tugas" pressSecondary={T.lihat} x={chip2.x - 120} y={chip2.y + 26} />
              {frame >= T.drag - 2 && frame < T.drop + 6 ? (
                <div
                  style={{
                    position: "absolute",
                    left: interpolate(dragP, [0, 1], [-260, 560]),
                    top: interpolate(dragP, [0, 0.6, 1], [260, 560, 790]),
                    opacity: dragVis,
                    rotate: `${interpolate(dragP, [0, 1], [-18, -3])}deg`,
                    scale: String(interpolate(frame, [T.drop - 4, T.drop + 4], [1, 0.5], clamp)),
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    borderRadius: 18,
                    backgroundColor: "white",
                    boxShadow: "0 30px 60px -20px rgba(23,20,25,0.45)",
                    zIndex: 30,
                    fontFamily,
                  }}
                >
                  <div style={{ width: 48, height: 58, borderRadius: 8, backgroundColor: "#e5484d", color: "white", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 8 }}>PDF</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Proposal_Acme.pdf</div>
                    <div style={{ fontSize: 14, color: colors.muted, marginTop: 3 }}>2,4 MB · 12 halaman</div>
                  </div>
                </div>
              ) : null}
              <Pointer
                keys={[
                  { at: 140, x: 900, y: 600 },
                  { at: T.chip1Click, x: chip1.x, y: chip1.y },
                  { at: 230, x: 1180, y: 520 },
                  { at: 370, x: 900, y: 600 },
                  { at: T.chip2Click, x: chip2.x, y: chip2.y },
                  { at: T.lihat, x: chip2.x + 140, y: chip2.y + 150 },
                  { at: 470, x: 1300, y: 500 },
                  { at: T.drag, x: -200, y: 300 },
                  { at: T.drop, x: 620, y: 820 },
                  { at: 960, x: 900, y: 560 },
                ]}
                clicks={[T.chip1Click, T.chip2Click, T.lihat, T.drop]}
              />
            </div>
          }
        />
      </Place>
      <Place {...pose("cal")}>
        {frame >= T.calIn ? <CalendarWin t={frame - T.calIn} dropAt={T.calDrop} /> : null}
      </Place>
    </>
  );
};

// ------------------------------------------------------------------ captions
/**
 * `pos` is where the headline lands big, picked per shot to stay clear of the UI:
 * top-left (default), bottom-centre, or stacked on the left/right side (`\n` in `accent` breaks lines).
 */
export type Caption = { readonly from: number; readonly to: number; readonly title: string; readonly accent: string; readonly pos?: "tl" | "bc" | "l" | "r" };

// Anchor per position: left = lp% + lx px, top = tp% + ty px, then translate by (sx%, sy%) of the caption's own size.
const ANCHORS = {
  tl: { lp: 0, lx: 80, tp: 0, ty: 60, sx: 0, sy: 0, glow: "0% 0%" },
  bc: { lp: 50, lx: 0, tp: 100, ty: -70, sx: -50, sy: -100, glow: "50% 100%" },
  l: { lp: 0, lx: 80, tp: 50, ty: 0, sx: 0, sy: -50, glow: "0% 50%" },
  r: { lp: 100, lx: -80, tp: 50, ty: 0, sx: -100, sy: -50, glow: "100% 50%" },
} as const;
export const deskCaptions: Caption[] = [
  { from: 8, to: 284, title: "Mulai apapun", accent: "dari chat." },
  { from: 296, to: 506, title: "Catat sebagai", accent: "tugas.", pos: "bc" },
  { from: 516, to: 788, title: "Mengatur jadwal", accent: "lebih mudah.", pos: "bc" },
  { from: 800, to: DESK_LEN + 8, title: "Memahami", accent: "konten berkas.", pos: "bc" },
];

/**
 * Title card: the caption lands big where it covers the least UI (top-left or bottom-centre),
 * holds for a moment, then shrinks and travels into a small top-left corner label.
 */
export const CaptionView: React.FC<{ readonly c: Caption; readonly dark?: boolean }> = ({ c, dark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { square } = useFormat();
  if (frame < c.from - 2 || frame > c.to + 12) return null;
  const a = spring({ frame: frame - c.from, fps, config: { damping: 16, stiffness: 200, mass: 0.6 } });
  const b = spring({ frame: frame - c.from - 5, fps, config: { damping: 16, stiffness: 200, mass: 0.6 } });
  const shrink = interpolate(frame, [c.from + 40, c.from + 56], [0, 1], { ...clamp, easing: easeInOut });
  const out = interpolate(frame, [c.to - 4, c.to + 8], [0, 1], { ...clamp, easing: easeInOut });
  const scrim = (1 - shrink) * (1 - out);
  // Lands at its anchor, then travels into the top-left corner as it shrinks.
  const from = ANCHORS[c.pos ?? "tl"];
  const to = ANCHORS.tl;
  const m = (key: "lp" | "lx" | "tp" | "ty" | "sx" | "sy") => from[key] + (to[key] - from[key]) * shrink;
  // The square canvas is too narrow for the longer headlines on one line: stack them.
  const stacked = c.pos === "l" || c.pos === "r" || (square && c.title.length + c.accent.length > 26);
  return (
    <>
      <AbsoluteFill
        style={{
          background: dark
            ? `radial-gradient(ellipse 60% 50% at ${from.glow}, rgba(14,10,24,0.85) 0%, rgba(14,10,24,0.5) 45%, transparent 75%)`
            : `radial-gradient(ellipse 60% 50% at ${from.glow}, rgba(251,248,245,0.97) 0%, rgba(251,248,245,0.75) 45%, transparent 75%)`,
          opacity: scrim,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `calc(${m("lp")}% + ${m("lx")}px)`,
          top: `calc(${m("tp")}% + ${m("ty")}px)`,
          translate: `${m("sx")}% calc(${m("sy")}% - ${out * 30}px)`,
          width: "max-content",
          fontFamily,
          opacity: 1 - out,
          scale: String(1 - shrink * 0.6),
          transformOrigin: "0% 0%",
        }}
      >
        <div
          style={{
            overflow: "hidden",
            paddingBottom: 8,
            padding: shrink > 0 ? `${shrink * 10}px ${shrink * 30}px ${8 + shrink * 10}px` : "0 0 8px",
            borderRadius: 40,
            backgroundColor: dark ? `rgba(20,14,30,${shrink * 0.75})` : `rgba(255,255,255,${shrink * 0.9})`,
            boxShadow: shrink > 0 ? `0 20px 50px -20px rgba(23,20,25,${shrink * 0.35})` : "none",
          }}
        >
          <div style={{ display: "flex", flexDirection: stacked ? "column" : "row", alignItems: stacked && c.pos === "bc" ? "center" : undefined, gap: stacked ? 0 : 22, fontSize: 92, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.04, whiteSpace: stacked ? "pre-line" : "nowrap" }}>
            <span style={{ color: dark ? "white" : colors.ink, translate: `0 ${(1 - a) * 110}%`, display: "inline-block" }}>{c.title}</span>
            <span style={{ backgroundImage: textGradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", translate: `0 ${(1 - b) * 110}%`, display: "inline-block", paddingRight: 6 }}>{c.accent}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export const DesktopAct: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: easeOut });
  return (
    <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
      <SoftCanvas glow={0.9} />
      <AbsoluteFill style={{ opacity: enter }}>
        <CameraStage keys={DESK_KEYS} drift={0.5}>
          <DesktopWorld />
        </CameraStage>
      </AbsoluteFill>
      {deskCaptions.map((c) => (
        <CaptionView key={c.title} c={c} />
      ))}
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};
