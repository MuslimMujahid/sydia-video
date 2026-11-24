import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { easeInOut, easeOut } from "../../promo/theme";
import { CameraStage, type CamKey, Place } from "../../showcase/components/Camera";
import { BAR_H, chipAnchor, type Compose, DesktopChat, type DMsg, PANEL_W, WIN_W, WindowChrome } from "../../showcase/components/DesktopApp";
import { type Caption, CaptionView } from "../../showcase/scenes/DesktopAct";
import { clamp, Pointer } from "../../showcase/ui";
import { Laptop, LID_H } from "../components/Laptop";
import { NotesPage, OPEN_BTN, OrderPanel, ReportPanel, treeNoteAt } from "../components/OrderNotes";
import { NOTE_TODAY, REPORT_NOTE, SARI, TODAY_ROWS, YESTERDAY_ROWS } from "../data";

// ------------------------------------------------------------------ script (scene frames; the scene starts at SECTIONS.afternoon)
export const L = {
  lidOpen: [30, 74] as const,
  screenOn: [58, 78] as const,
  type: 112,
  send: 160,
  bot: 200,
  chipClick: 270,
  sweep: 312,
  openClick: 404,
  page: 410,
  pastClick: 566,
  // back to the conversation for the weekly report (SECTIONS.report)
  report: 648,
  back: 676,
  type2: 700,
  send2: 752,
  bot2: 796,
  chip2: 858,
  sweep2: 890,
  end: 936,
};

const CMD = "Buka catatan pemesanan hari ini";
const msgs: DMsg[] = [
  { kind: "user", at: L.send, lines: [CMD] },
  { kind: "think", at: L.send + 8, until: L.bot, label: "Sydia sedang membuka catatan…" },
  {
    kind: "bot",
    at: L.bot,
    blocks: [
      { t: "p", lines: ["Ini catatan pemesanan hari ini, Kak Sari. Ada **5 pesanan**", "dengan total **18 barang**:"] },
      { t: "li", lines: ["Keripik pisang — 8 bungkus"] },
      { t: "li", lines: ["Sambal roa — 7 botol"] },
      { t: "li", lines: ["Nastar — 3 toples"] },
      { t: "chip", chip: { kind: "note", label: NOTE_TODAY } },
    ],
  },
];
const compose: Compose[] = [{ start: L.type, send: L.send, text: CMD }];
const convos = ["Buka catatan pemesanan…", "Rekap penjualan minggu lalu", "Resep nastar keju"];

const CMD2 = "Buatkan laporan pesanan seminggu terakhir";
const reportMsgs: DMsg[] = [
  ...msgs,
  { kind: "user", at: L.send2, lines: [CMD2] },
  { kind: "think", at: L.send2 + 8, until: L.bot2, label: "Sydia sedang membaca 7 catatan pesanan…" },
  {
    kind: "bot",
    at: L.bot2,
    blocks: [
      { t: "p", lines: ["Sudah jadi, Kak Sari! Seminggu terakhir ada **41 pesanan**", "dengan total **126 barang**:"] },
      { t: "li", lines: ["Terlaris: **Keripik pisang** — 54 bungkus"] },
      { t: "li", lines: ["Paling ramai: **Sabtu, 7 Nov** — 9 pesanan"] },
      { t: "chip", chip: { kind: "note", label: REPORT_NOTE } },
    ],
  },
];
const compose2: Compose[] = [{ start: L.type2, send: L.send2, text: CMD2 }];

// ------------------------------------------------------------------ camera
// The base sits on the origin; the screen's centre is about LID_H / 2 + 24 above it (tilted back 6°,
// so the camera looks down 6° to meet it face-on).
const SY = -LID_H / 2 - 24;
const TOP = SY - 480; // world y of the window's top edge
/** World point for window-content coordinates (below the 40 px title bar). */
const w = (x: number, y: number) => ({ x: x - 800, y: TOP + BAR_H + y + 24 });
const chip = chipAnchor(msgs, L.chipClick, 2);
const open = { x: WIN_W - PANEL_W + OPEN_BTN.x, y: OPEN_BTN.y };
const past = treeNoteAt(1);
/** The current conversation in the sidebar's "Percakapan" list. */
const convoLink = { x: 130, y: 366 };
const chip2 = chipAnchor(reportMsgs, L.chip2, reportMsgs.length - 1);

const KEYS: CamKey[] = [
  { f: 0, x: 0, y: -260, dolly: -2700, rx: -26, ry: 0 },
  { f: 40, x: 0, y: -300, dolly: -2350, rx: -22, ry: 0 },
  { f: 78, x: 0, y: -440, dolly: -1500, rx: -12, ry: 0 },
  { f: 104, x: 0, y: SY, dolly: -340, rx: -6, ry: 0 },
  // typing in the empty-state composer
  { f: 122, ...w(930, 520), dolly: 300, rx: -6, ry: 0 },
  { f: 158, ...w(930, 520), dolly: 320, rx: -6, ry: 0 },
  // the answer, then the chip
  { f: 198, ...w(930, 230), dolly: 520, rx: -6, ry: 0 },
  { f: 250, ...w(900, 290), dolly: 500, rx: -6, ry: 0 },
  // side panel: the whole table
  { f: 300, ...w(1240, 330), dolly: 700, rx: -6, ry: 0 },
  { f: 380, ...w(1240, 330), dolly: 720, rx: -6, ry: 0 },
  // "Buka di Catatan"
  { f: 398, ...w(1340, 160), dolly: 760, rx: -6, ry: 0 },
  { f: 412, ...w(1340, 160), dolly: 760, rx: -6, ry: 0 },
  // workspace: whole page, then the folder of daily order notes beside the table
  { f: 444, x: 0, y: SY, dolly: -320, rx: -6, ry: 0 },
  { f: 486, ...w(680, 380), dolly: 470, rx: -6, ry: 0 },
  { f: 560, ...w(700, 380), dolly: 490, rx: -6, ry: 0 },
  { f: L.report, ...w(740, 380), dolly: 530, rx: -6, ry: 0, ease: (t) => t },
  // back to the conversation in the sidebar
  { f: 668, ...w(420, 420), dolly: 380, rx: -6, ry: 0 },
  { f: 684, ...w(420, 420), dolly: 380, rx: -6, ry: 0 },
  // the request in the composer, then Sydia's summary
  { f: 712, ...w(930, 680), dolly: 470, rx: -6, ry: 0 },
  { f: 752, ...w(930, 680), dolly: 480, rx: -6, ry: 0 },
  { f: 806, ...w(930, 540), dolly: 490, rx: -6, ry: 0 },
  { f: 848, ...w(900, 580), dolly: 500, rx: -6, ry: 0 },
  // the report in the side panel
  { f: 884, ...w(1240, 420), dolly: 640, rx: -6, ry: 0 },
  { f: L.end, ...w(1240, 440), dolly: 680, rx: -6, ry: 0, ease: (t) => t },
];

export const laptopCaptions: Caption[] = [
  { from: 124, to: 396, title: "Tinggal minta", accent: "lewat chat.", pos: "bc" },
  { from: 444, to: L.report, title: "Sydia bantu", accent: "susun rapi.", pos: "bc" },
  { from: 704, to: L.end + 4, title: "Laporan mingguan,", accent: "tinggal minta.", pos: "bc" },
];

export const LaptopAfternoon: React.FC = () => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 38], [1500, 0], { ...clamp, easing: easeOut });
  const lid = interpolate(frame, L.lidOpen, [-89, 6], { ...clamp, easing: easeInOut });
  const on = interpolate(frame, L.screenOn, [0, 1], clamp);
  const panelIn = interpolate(frame, [L.chipClick + 2, L.chipClick + 24], [0, 1], { ...clamp, easing: easeOut });
  const page = interpolate(frame, [L.page, L.page + 14], [0, 1], { ...clamp, easing: easeInOut });
  const showYesterday = interpolate(frame, [L.pastClick + 2, L.pastClick + 14], [0, 1], { ...clamp, easing: easeInOut });
  const back = interpolate(frame, [L.back + 2, L.back + 14], [0, 1], { ...clamp, easing: easeInOut });
  const panel2 = interpolate(frame, [L.chip2 + 2, L.chip2 + 24], [0, 1], { ...clamp, easing: easeOut });
  const glow2 = (f: number) => interpolate(f, [L.chip2 - 2, L.chip2 + 2, L.chip2 + 14], [0, 1, 0], clamp);
  const glow = (f: number) => interpolate(f, [L.chipClick - 2, L.chipClick + 2, L.chipClick + 14], [0, 1, 0], clamp);
  return (
    <AbsoluteFill>
      <CameraStage keys={KEYS} drift={0.3}>
        <Place y={rise}>
          <Laptop lid={lid} on={on}>
            {page < 1 ? (
              <div style={{ position: "absolute", inset: 0 }}>
                <DesktopChat
                  msgs={msgs}
                  compose={compose}
                  panel={panelIn}
                  panelTypeFrom={1e9}
                  firstSend={L.send}
                  convoTitle={convos[0]}
                  recent={convos.slice(1)}
                  user={SARI}
                  glowChip={glow}
                  context={{ from: L.chipClick + 16, to: 1e9, label: NOTE_TODAY }}
                  panelView={<OrderPanel rows={TODAY_ROWS} sweep={L.sweep} press={L.openClick} />}
                />
              </div>
            ) : null}
            {page > 0 && back < 1 ? (
              <div style={{ position: "absolute", inset: 0, opacity: page }}>
                <WindowChrome width={1600} height={960} url="sydia · Catatan">
                  <NotesPage today={TODAY_ROWS} yesterday={YESTERDAY_ROWS} showYesterday={showYesterday} glowFrom={504} convos={convos} pressConvo={L.back} />
                </WindowChrome>
              </div>
            ) : null}
            {back > 0 ? (
              <div style={{ position: "absolute", inset: 0, opacity: back }}>
                <DesktopChat
                  msgs={reportMsgs}
                  compose={compose2}
                  panel={panel2}
                  panelTypeFrom={1e9}
                  firstSend={L.send}
                  convoTitle={convos[0]}
                  recent={convos.slice(1)}
                  user={SARI}
                  glowChip={glow2}
                  context={{ from: L.chip2 + 16, to: 1e9, label: REPORT_NOTE }}
                  panelView={<ReportPanel sweep={L.sweep2} />}
                />
              </div>
            ) : null}
            <div style={{ position: "absolute", left: 0, top: BAR_H, right: 0, bottom: 0, overflow: "hidden" }}>
              <Pointer
                keys={[
                  { at: 230, x: 1180, y: 640 },
                  { at: L.chipClick, x: chip.x, y: chip.y },
                  { at: 340, x: 1100, y: 700 },
                  { at: L.openClick, x: open.x, y: open.y },
                  { at: 470, x: 700, y: 720 },
                  { at: L.pastClick, x: past.x, y: past.y },
                  { at: 640, x: past.x + 40, y: past.y + 60 },
                  { at: L.back, x: convoLink.x, y: convoLink.y },
                  { at: 720, x: 700, y: 640 },
                  { at: 820, x: 1000, y: 560 },
                  { at: L.chip2, x: chip2.x, y: chip2.y },
                  { at: L.end, x: chip2.x + 120, y: chip2.y + 90 },
                ]}
                clicks={[L.chipClick, L.openClick, L.pastClick, L.back, L.chip2]}
              />
            </div>
          </Laptop>
        </Place>
      </CameraStage>
      {laptopCaptions.map((c) => (
        <CaptionView key={c.title} c={c} />
      ))}
    </AbsoluteFill>
  );
};
