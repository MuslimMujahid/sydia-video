import type React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { Icon } from "../../promo/components/Icons";
import { colors, easeOut } from "../../promo/theme";
import { clamp, GradientButton, Ic, type ExtraIcon } from "../ui";
import { WindowChrome } from "./DesktopApp";

const stag = (t: number, i: number, step = 4, start = 0) => interpolate(t, [start + i * step, start + i * step + 12], [0, 1], { ...clamp, easing: easeOut });

// ------------------------------------------------------------------ tasks
type Task = { readonly title: string; readonly cat: string; readonly color: string; readonly due: string; readonly isNew?: boolean; readonly doneAt?: number; readonly done?: boolean };

const tasks: Task[] = [
  { title: "Kirim draf kontrak ke vendor", cat: "Kerja", color: "#6366f1", due: "Jum, 13 Nov · 17.00", isNew: true },
  { title: "Bayar listrik", cat: "Keuangan", color: "#10b981", due: "Hari ini · 17.00", doneAt: 46 },
  { title: "Review desain halaman baru", cat: "Kerja", color: "#6366f1", due: "Sel, 10 Nov" },
  { title: "Beli kado ulang tahun Alya", cat: "Keluarga", color: "#06b6d4", due: "Sab, 28 Nov" },
  { title: "Latihan lari 5K", cat: "Kesehatan", color: "#f43f5e", due: "Hari ini · 06.00", done: true },
];

/** Task list window. `t` is frames since the window started arriving. */
export const TaskBoardWin: React.FC<{ readonly t: number }> = ({ t }) => {
  const { fps } = useVideoConfig();
  const insert = spring({ frame: t - 10, fps, config: { damping: 14, stiffness: 200, mass: 0.6 } });
  return (
    <WindowChrome width={1080} height={720} url="sydia · Tugas" glow={0.4}>
      <div style={{ padding: "26px 34px", backgroundColor: colors.canvas, position: "absolute", inset: 0 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
          <div style={{ display: "flex", gap: 6, padding: 5, borderRadius: 16, border: "1px solid rgba(23,20,25,0.1)", backgroundColor: "white" }}>
            <div style={{ width: 48, height: 42, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted }}>
              <Icon name="calendar" size={22} />
            </div>
            <div style={{ width: 48, height: 42, borderRadius: 11, backgroundColor: "#f1edea", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic name="checklist" size={22} />
            </div>
          </div>
          <div style={{ marginLeft: 20, fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>Tugas</div>
          <div style={{ flex: 1 }} />
          <GradientButton label="Tugas baru" icon="plus" />
        </div>
        {tasks.map((task, i) => {
          const appear = task.isNew ? insert : stag(t, i, 3);
          const doneP = task.doneAt ? interpolate(t, [task.doneAt, task.doneAt + 8], [0, 1], clamp) : task.done ? 1 : 0;
          return (
            <div
              key={task.title}
              style={{
                height: task.isNew ? 96 * Math.min(1, appear) : 96,
                marginBottom: 12,
                overflow: "visible",
                opacity: Math.min(1, appear) * (1 - doneP * 0.45),
              }}
            >
              <div
                style={{
                  height: 96,
                  borderRadius: 20,
                  backgroundColor: "white",
                  border: task.isNew ? `2px solid ${colors.brand}` : "1px solid rgba(23,20,25,0.07)",
                  boxShadow: task.isNew ? "0 18px 40px -16px rgba(240,102,148,0.45)" : "0 10px 24px -18px rgba(23,20,25,0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "0 26px",
                  scale: String(task.isNew ? 0.9 + appear * 0.1 : 1),
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    border: doneP > 0.5 ? "none" : "2.5px solid #cfc8d2",
                    background: doneP > 0.5 ? "linear-gradient(135deg, #ffb27a, #f06694 50%, #8c5cff)" : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    scale: String(1 + Math.sin(doneP * Math.PI) * 0.3),
                  }}
                >
                  {doneP > 0.5 ? <Icon name="check" size={18} color="white" strokeWidth={3.4} /> : null}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 24, fontWeight: 600, position: "relative", display: "inline-block" }}>
                    {task.title}
                    <div style={{ position: "absolute", left: 0, top: "54%", height: 3, backgroundColor: colors.ink, width: `${doneP * 100}%` }} />
                  </div>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 6, fontSize: 17, color: colors.muted }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 600 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: task.color }} />
                      {task.cat}
                    </span>
                    <span>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Ic name="clock" size={16} />
                      {task.due}
                    </span>
                    {task.isNew ? <span style={{ marginLeft: 8, padding: "3px 10px", borderRadius: 999, backgroundColor: "#fde0e6", color: "#c2185b", fontWeight: 700, fontSize: 14 }}>Prioritas tinggi</span> : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </WindowChrome>
  );
};

// ------------------------------------------------------------------ calendar
const HOUR = 58;
const START = 8;
const COL = 150;
const TIME_W = 80;
const week = ["SEN 9", "SEL 10", "RAB 11", "KAM 12", "JUM 13", "SAB 14", "MIN 15"];
type Ev = { readonly day: number; readonly from: number; readonly to: number; readonly title: string; readonly bg: string; readonly fg: string; readonly bar: string };
const violet = { bg: "#ece4ff", fg: "#4c2bb8", bar: "#8c5cff" };
const pink = { bg: "#fde0ea", fg: "#a3173f", bar: "#f06694" };
const orange = { bg: "#ffe9d6", fg: "#a04a0c", bar: "#ff8a4c" };
const green = { bg: "#d8f5e8", fg: "#0b6b49", bar: "#10b981" };
const amber = { bg: "#fdf0cc", fg: "#8a5a05", bar: "#f59e0b" };
const events: Ev[] = [
  { day: 0, from: 9, to: 9.5, title: "Standup tim", ...violet },
  { day: 0, from: 10, to: 11, title: "Rapat vendor", ...orange },
  { day: 0, from: 13, to: 15, title: "Fokus: proposal", ...pink },
  { day: 1, from: 15, to: 16, title: "Telepon vendor", ...violet },
  { day: 2, from: 8.5, to: 9.5, title: "Olahraga pagi", ...green },
  { day: 2, from: 12, to: 13.5, title: "Makan siang Rani", ...amber },
  { day: 3, from: 10, to: 12, title: "Workshop UX", ...violet },
  { day: 4, from: 13, to: 14.5, title: "Demo produk", ...orange },
  { day: 4, from: 16, to: 17, title: "Kirim draf kontrak", ...pink },
  { day: 5, from: 9.5, to: 11, title: "Belanja mingguan", ...green },
];
export const NEW_EVENT: Ev = { day: 1, from: 10, to: 11, title: "Rapat follow-up vendor", ...pink };

const EventBlock: React.FC<{ readonly ev: Ev; readonly p: number; readonly glow?: number }> = ({ ev, p, glow = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: TIME_W + ev.day * COL + 5,
      top: (ev.from - START) * HOUR + 3,
      width: COL - 10,
      height: (ev.to - ev.from) * HOUR - 6,
      borderRadius: 12,
      backgroundColor: ev.bg,
      color: ev.fg,
      borderLeft: `5px solid ${ev.bar}`,
      padding: "6px 10px",
      overflow: "hidden",
      fontSize: 15,
      fontWeight: 700,
      lineHeight: 1.2,
      opacity: Math.min(1, p * 1.5),
      scale: String(0.7 + Math.min(1, p) * 0.3),
      boxShadow: glow > 0 ? `0 0 0 ${glow * 5}px ${ev.bar}44, 0 20px 40px -12px ${ev.bar}` : "none",
    }}
  >
    {ev.title}
  </div>
);

/** Week view. `t` is frames since the window started arriving, `dropAt` when the new event lands. */
export const CalendarWin: React.FC<{ readonly t: number; readonly dropAt: number }> = ({ t, dropAt }) => {
  const { fps } = useVideoConfig();
  const drop = spring({ frame: t - dropAt, fps, config: { damping: 10, stiffness: 160, mass: 0.8 } });
  const glow = interpolate(t, [dropAt + 8, dropAt + 14, dropAt + 50], [0, 1, 0.3], clamp);
  return (
    <WindowChrome width={1240} height={760} url="sydia · Kalender" glow={0.4}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.canvas, padding: "22px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ height: 44, padding: "0 18px", display: "flex", alignItems: "center", borderRadius: 12, border: "1px solid rgba(23,20,25,0.12)", backgroundColor: "white", fontSize: 16, fontWeight: 600 }}>Hari ini</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>9 – 15 November 2026</div>
          <div style={{ flex: 1 }} />
          <div style={{ height: 44, padding: "0 16px", display: "flex", alignItems: "center", gap: 8, borderRadius: 12, border: "1px solid rgba(23,20,25,0.12)", backgroundColor: "white", fontSize: 16, fontWeight: 600 }}>
            Minggu <Ic name="chevron" size={16} />
          </div>
          <GradientButton label="Buat" icon="plus" />
        </div>
        <div style={{ marginTop: 18, borderRadius: 22, backgroundColor: "white", height: 640, overflow: "hidden", position: "relative", boxShadow: "0 20px 40px -30px rgba(23,20,25,0.3)" }}>
          <div style={{ display: "flex", height: 70, borderBottom: "1px solid rgba(23,20,25,0.08)" }}>
            <div style={{ width: TIME_W }} />
            {week.map((d, i) => {
              const [dn, num] = d.split(" ");
              return (
                <div key={d} style={{ width: COL, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", color: colors.muted }}>{dn}</div>
                  <div style={{ width: 38, height: 38, borderRadius: 19, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, backgroundColor: i === 0 ? colors.brand : "transparent", color: i === 0 ? "white" : colors.ink }}>{num}</div>
                </div>
              );
            })}
          </div>
          <div style={{ position: "relative", height: 570 }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * HOUR, borderTop: "1px solid rgba(23,20,25,0.06)" }}>
                <span style={{ position: "absolute", left: 16, top: -9, fontSize: 12, color: colors.muted, fontFamily: "monospace", backgroundColor: "white", padding: "0 4px" }}>{String(START + i).padStart(2, "0")}.00</span>
              </div>
            ))}
            {week.map((d, i) => (
              <div key={d} style={{ position: "absolute", left: TIME_W + i * COL, top: 0, bottom: 0, width: COL, borderLeft: "1px solid rgba(23,20,25,0.05)", backgroundColor: i === 1 ? `rgba(240,102,148,${0.06 * Math.min(1, drop)})` : "transparent" }} />
            ))}
            {events.map((ev, i) => (
              <EventBlock key={ev.title} ev={ev} p={spring({ frame: t - 6 - i * 2, fps, config: { damping: 15, stiffness: 220, mass: 0.6 } })} />
            ))}
            {t >= dropAt ? (
              <div style={{ position: "absolute", inset: 0, translate: `0 ${(1 - Math.min(drop, 1.2)) * -160}px` }}>
                <EventBlock ev={NEW_EVENT} p={drop} glow={glow} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </WindowChrome>
  );
};

// ------------------------------------------------------------------ files
type FileRow = { readonly name: string; readonly icon: ExtraIcon; readonly tint: string; readonly size: string; readonly date: string; readonly folder?: boolean; readonly isNew?: boolean };
const files: FileRow[] = [
  { name: "Proposal_Acme.pdf", icon: "pdf", tint: "#e5484d", size: "2,4 MB", date: "9 Nov 2026, 14.20", isNew: true },
  { name: "Kontrak klien", icon: "folder", tint: "#6b6470", size: "4 item", date: "2 Nov 2026, 10.12", folder: true },
  { name: "Laporan_Q3.xlsx", icon: "table", tint: "#10b981", size: "820 KB", date: "5 Nov 2026, 16.02" },
  { name: "Mascot.png", icon: "image", tint: "#8c5cff", size: "1,6 MB", date: "6 Nov 2026, 21.29" },
  { name: "Notulen_rapat.docx", icon: "pdf", tint: "#3b82f6", size: "96 KB", date: "4 Nov 2026, 11.30" },
];

export const FilesWin: React.FC<{ readonly t: number }> = ({ t }) => {
  const { fps } = useVideoConfig();
  const insert = spring({ frame: t - 8, fps, config: { damping: 14, stiffness: 200, mass: 0.6 } });
  const cols = "1fr 140px 190px 230px";
  return (
    <WindowChrome width={1080} height={640} url="sydia · File" glow={0.4}>
      <div style={{ position: "absolute", inset: 0, padding: "24px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>File</div>
          <div style={{ height: 48, padding: "0 18px", borderRadius: 14, border: "1px solid rgba(23,20,25,0.14)", display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 600 }}>
            <Ic name="folder" size={18} /> Folder baru
          </div>
          <GradientButton label="Unggah file" icon="upload" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: cols, height: 48, alignItems: "center", marginTop: 22, borderBottom: "1px solid rgba(23,20,25,0.08)", fontSize: 14, color: colors.muted, fontWeight: 500, paddingLeft: 10 }}>
          <span>Nama</span>
          <span>Ukuran</span>
          <span>Status</span>
          <span>Ditambahkan</span>
        </div>
        {files.map((f, i) => {
          const appear = f.isNew ? insert : stag(t, i, 3);
          return (
            <div
              key={f.name}
              style={{
                display: "grid",
                gridTemplateColumns: cols,
                alignItems: "center",
                height: f.isNew ? 76 * Math.min(1, appear) : 76,
                overflow: "hidden",
                borderBottom: "1px solid rgba(23,20,25,0.06)",
                fontSize: 19,
                paddingLeft: 10,
                borderRadius: 14,
                opacity: Math.min(1, appear),
                backgroundColor: f.isNew ? "rgba(240,102,148,0.08)" : "transparent",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 16, fontWeight: 500 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: f.folder ? "transparent" : `${f.tint}18`, color: f.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic name={f.icon} size={24} />
                </span>
                {f.name}
              </span>
              <span style={{ fontSize: 16, color: colors.muted }}>{f.size}</span>
              <span style={{ fontSize: 16, color: f.isNew ? colors.emerald : colors.muted, fontWeight: f.isNew ? 700 : 400, display: "inline-flex", alignItems: "center", gap: 6 }}>
                {f.folder ? null : (
                  <>
                    <Icon name="check" size={16} strokeWidth={2.6} /> Siap digunakan
                  </>
                )}
              </span>
              <span style={{ fontSize: 16, color: colors.muted }}>{f.date}</span>
            </div>
          );
        })}
      </div>
    </WindowChrome>
  );
};
