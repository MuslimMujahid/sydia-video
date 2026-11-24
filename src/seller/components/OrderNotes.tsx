import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../../promo/components/Icons";
import { colors, fontFamily } from "../../promo/theme";
import { AppSidebar, ink2, PANEL_W, SIDE_W } from "../../showcase/components/DesktopApp";
import { clamp, Ic } from "../../showcase/ui";
import { BEST_SELLERS, BUSIEST, NOTE_FOLDER, NOTE_TODAY, type OrderRow, PAST_NOTES, REPORT_NOTE, SARI, WEEK } from "../data";

const line = "1px solid rgba(23,20,25,0.08)";
const pink = "#fde7ef";

// ------------------------------------------------------------------ table
type ColKey = "n" | "time" | "who" | "item" | "qty" | "to" | "pay";
export type Col = { readonly key: ColKey; readonly label: string; readonly w: number; readonly kind?: "text" | "num" | "time" };

const ColIcon: React.FC<{ readonly kind?: Col["kind"] }> = ({ kind = "text" }) =>
  kind === "num" ? (
    <span style={{ fontSize: 15, color: colors.muted, fontWeight: 600 }}>#</span>
  ) : kind === "time" ? (
    <Ic name="clock" size={14} color={colors.muted} />
  ) : (
    <span style={{ fontSize: 14, color: colors.muted, fontWeight: 600, fontFamily: "Georgia, serif" }}>T</span>
  );

/**
 * The note's table, like Sydia's table notes: numbered rows, typed column headers and a
 * "+" row. `sweep` (frame) runs a highlight down the rows to walk the eye through them.
 */
export const OrderTable: React.FC<{ readonly rows: readonly OrderRow[]; readonly cols: readonly Col[]; readonly rowH?: number; readonly size?: number; readonly sweep?: number }> = ({ rows, cols, rowH = 44, size = 16, sweep }) => {
  const frame = useCurrentFrame();
  const cell = (c: Col, r: OrderRow, i: number) => {
    const v = c.key === "n" ? i + 1 : r[c.key];
    return (
      <div key={c.key} style={{ width: c.w, flexShrink: 0, padding: "0 12px", textAlign: c.kind === "num" || c.key === "n" ? (c.key === "n" ? "center" : "right") : "left", color: c.key === "n" ? colors.muted : colors.ink, whiteSpace: "nowrap", overflow: "hidden", fontVariantNumeric: "tabular-nums", borderLeft: c.key === "n" ? "none" : line, height: rowH, lineHeight: `${rowH}px` }}>
        {v}
      </div>
    );
  };
  return (
    <div style={{ borderRadius: 14, border: line, overflow: "hidden", backgroundColor: "white", fontSize: size, fontFamily }}>
      <div style={{ display: "flex", backgroundColor: "#faf6f3", borderBottom: line, fontWeight: 700 }}>
        {cols.map((c) => (
          <div key={c.key} style={{ width: c.w, flexShrink: 0, height: rowH - 4, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderLeft: c.key === "n" ? "none" : line, justifyContent: c.kind === "num" ? "flex-end" : "flex-start" }}>
            {c.key === "n" ? null : <ColIcon kind={c.kind} />}
            {c.label}
          </div>
        ))}
      </div>
      {rows.map((r, i) => {
        const g = sweep === undefined ? 0 : interpolate(frame, [sweep + i * 5, sweep + i * 5 + 4, sweep + i * 5 + 22], [0, 1, 0], clamp);
        return (
          <div key={`${r.who}${r.item}${i}`} style={{ display: "flex", borderBottom: line, backgroundColor: g > 0 ? `rgba(239,90,138,${g * 0.12})` : "white", boxShadow: g > 0 ? `inset 3px 0 0 rgba(239,90,138,${g})` : "none" }}>
            {cols.map((c) => cell(c, r, i))}
          </div>
        );
      })}
      <div style={{ height: rowH - 10, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted, fontSize: size + 4 }}>+</div>
    </div>
  );
};

const Pager: React.FC<{ readonly count: number; readonly size?: number }> = ({ count, size = 14 }) => (
  <div style={{ display: "flex", alignItems: "center", marginTop: 16, fontSize: size, color: ink2 }}>
    <span style={{ flex: 1 }}>
      Baris 1–{count} dari {count}
    </span>
    {["«", "‹", "›", "»"].map((c) => (
      <span key={c} style={{ width: 34, height: 34, marginLeft: 6, borderRadius: 10, border: line, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted }}>
        {c}
      </span>
    ))}
  </div>
);

const CsvButton: React.FC = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 18px", borderRadius: 12, border: "1px solid rgba(23,20,25,0.14)", fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>
    <Ic name="download" size={17} />
    Unduh CSV
  </span>
);

// ------------------------------------------------------------------ side panel
export const PANEL_COLS: Col[] = [
  { key: "n", label: "", w: 36 },
  { key: "who", label: "Pemesan", w: 118 },
  { key: "item", label: "Barang", w: 146 },
  { key: "qty", label: "Jml", w: 70, kind: "num" },
  { key: "to", label: "Kirim", w: 150 },
  { key: "pay", label: "Bayar", w: 150 },
];
/** Centre of the panel's "Buka di Catatan" button, in panel coordinates. */
export const OPEN_BTN = { x: PANEL_W - 22 - 88, y: 54 + 14 + 21 };

/** The side panel's tab and toolbar ("Catatan khusus", "Tersimpan", "Buka di Catatan" pressed at `press`). */
const PanelBar: React.FC<{ readonly title: string; readonly press?: number }> = ({ title, press = -100 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [press - 2, press, press + 6], [0, 1, 0], clamp);
  return (
    <>
      <div style={{ height: 54, backgroundColor: "#f4f2f1", display: "flex", alignItems: "flex-end", padding: "0 16px" }}>
        <div style={{ height: 44, padding: "0 16px", borderRadius: "12px 12px 0 0", backgroundColor: "white", display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 600 }}>
          <Icon name="file" size={16} />
          {title}
          <span style={{ color: colors.muted, marginLeft: 8 }}>✕</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 22px" }}>
        <span style={{ padding: "9px 14px", borderRadius: 999, backgroundColor: "#f1edea", fontSize: 15, fontWeight: 700 }}>Catatan khusus</span>
        <span style={{ flex: 1 }} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 999, backgroundColor: "#f6f4f3", fontSize: 15, color: colors.muted }}>
          <Icon name="check" size={15} />
          Tersimpan
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, width: 176, height: 42, borderRadius: 999, backgroundColor: p > 0 ? pink : "#f6f4f3", color: p > 0 ? colors.brand : colors.ink, fontSize: 15, fontWeight: 700, scale: String(1 - p * 0.08) }}>
          <Ic name="link" size={15} />
          Buka di Catatan
        </span>
      </div>
    </>
  );
};

/** Chat side panel showing the table note, with "Buka di Catatan" pressed at `press`. */
export const OrderPanel: React.FC<{ readonly rows: readonly OrderRow[]; readonly sweep?: number; readonly press?: number }> = ({ rows, sweep, press }) => (
  <AbsoluteFill style={{ backgroundColor: "white", borderLeft: line, fontFamily, color: colors.ink }}>
    <PanelBar title={NOTE_TODAY} press={press} />
    <div style={{ padding: "16px 24px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{NOTE_TODAY}</div>
          <div style={{ fontSize: 15, color: colors.muted, marginTop: 8 }}>Pesanan masuk dari pelanggan hari ini.</div>
        </div>
        <CsvButton />
      </div>
      <div style={{ marginTop: 24 }}>
        <OrderTable rows={rows} cols={PANEL_COLS} rowH={42} size={15} sweep={sweep} />
      </div>
      <Pager count={rows.length} />
    </div>
  </AbsoluteFill>
);

// ------------------------------------------------------------------ weekly report
const Bullet: React.FC<{ readonly children: React.ReactNode; readonly glow?: number }> = ({ children, glow = 0 }) => (
  <div style={{ display: "flex", gap: 14, alignItems: "center", height: 36, fontSize: 19, padding: "0 8px", marginLeft: -8, borderRadius: 10, backgroundColor: glow > 0 ? `rgba(239,90,138,${glow * 0.12})` : "transparent", boxShadow: glow > 0 ? `inset 3px 0 0 rgba(239,90,138,${glow})` : "none", whiteSpace: "nowrap" }}>
    <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ink, flexShrink: 0 }} />
    <span>{children}</span>
  </div>
);
const B: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => <b style={{ fontWeight: 700, color: colors.ink }}>{children}</b>;

/**
 * The weekly report note in the chat side panel: a summary and a per-day table. From `sweep`
 * a highlight walks down the days and settles on the busiest one and its summary line.
 */
export const ReportPanel: React.FC<{ readonly sweep: number }> = ({ sweep }) => {
  const frame = useCurrentFrame();
  const rowGlow = (i: number) => (i === BUSIEST ? interpolate(frame, [sweep + i * 5, sweep + i * 5 + 4], [0, 1], clamp) : interpolate(frame, [sweep + i * 5, sweep + i * 5 + 4, sweep + i * 5 + 20], [0, 1, 0], clamp));
  const busyLine = interpolate(frame, [sweep + BUSIEST * 5 + 4, sweep + BUSIEST * 5 + 12], [0, 1], clamp);
  const total = WEEK.reduce((a, d) => ({ orders: a.orders + d.orders, items: a.items + d.items }), { orders: 0, items: 0 });
  const cell = { height: 38, display: "flex", alignItems: "center", padding: "0 16px", fontVariantNumeric: "tabular-nums" } as const;
  const COLS = [220, 150, 150];
  return (
    <AbsoluteFill style={{ backgroundColor: "white", borderLeft: line, fontFamily, color: colors.ink }}>
      <PanelBar title={REPORT_NOTE} />
      <div style={{ padding: "12px 36px 0", color: ink2 }}>
        <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.02em", whiteSpace: "nowrap", color: colors.ink }}>{REPORT_NOTE}</div>
        <div style={{ fontSize: 15, color: colors.muted, marginTop: 8 }}>
          Dirangkum Sydia dari 7 catatan di {NOTE_FOLDER}.
        </div>
        <div style={{ marginTop: 22, fontSize: 22, fontWeight: 700, color: colors.ink }}>Ringkasan</div>
        <div style={{ marginTop: 8 }}>
          <Bullet>
            <B>{total.orders} pesanan</B> · <B>{total.items} barang</B> dalam 7 hari
          </Bullet>
          <Bullet>
            Terlaris: {BEST_SELLERS.map((b, i) => (
              <span key={b.item}>
                {i > 0 ? ", " : ""}
                {i === 0 ? <B>{b.item}</B> : b.item} ({b.qty})
              </span>
            ))}
          </Bullet>
          <Bullet glow={busyLine}>
            Paling ramai: <B>{WEEK[BUSIEST].day}</B> — {WEEK[BUSIEST].orders} pesanan
          </Bullet>
        </div>
        <div style={{ marginTop: 22, fontSize: 22, fontWeight: 700, color: colors.ink }}>Per hari</div>
        <div style={{ marginTop: 12, width: COLS.reduce((a, b) => a + b, 0), borderRadius: 14, border: line, overflow: "hidden", fontSize: 16 }}>
          <div style={{ display: "flex", backgroundColor: "#faf6f3", borderBottom: line, fontWeight: 700, color: colors.ink }}>
            {["Hari", "Pesanan", "Barang"].map((h, i) => (
              <div key={h} style={{ ...cell, width: COLS[i], justifyContent: i ? "flex-end" : "flex-start", borderLeft: i ? line : "none" }}>
                {h}
              </div>
            ))}
          </div>
          {WEEK.map((d, i) => {
            const g = rowGlow(i);
            return (
              <div key={d.day} style={{ display: "flex", borderBottom: line, color: colors.ink, fontWeight: i === BUSIEST && g > 0.5 ? 700 : 400, backgroundColor: g > 0 ? `rgba(239,90,138,${g * 0.12})` : "white", boxShadow: g > 0 ? `inset 3px 0 0 rgba(239,90,138,${g})` : "none" }}>
                <div style={{ ...cell, width: COLS[0] }}>{d.day}</div>
                <div style={{ ...cell, width: COLS[1], justifyContent: "flex-end", borderLeft: line }}>{d.orders}</div>
                <div style={{ ...cell, width: COLS[2], justifyContent: "flex-end", borderLeft: line }}>{d.items}</div>
              </div>
            );
          })}
          <div style={{ display: "flex", fontWeight: 700, color: colors.ink, backgroundColor: "#faf6f3" }}>
            <div style={{ ...cell, width: COLS[0] }}>Total</div>
            <div style={{ ...cell, width: COLS[1], justifyContent: "flex-end", borderLeft: line }}>{total.orders}</div>
            <div style={{ ...cell, width: COLS[2], justifyContent: "flex-end", borderLeft: line }}>{total.items}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ notes workspace
export const TREE_X = SIDE_W;
export const TREE_W = 290;
export const PAGE_HEAD = 80;
export const FOLDER_Y = 300; // content-area y of the order folder row
export const TREE_ROW = 38;
/** Content-area centre of the n-th note in the order folder (0 = today). */
export const treeNoteAt = (i: number) => ({ x: TREE_X + 150, y: FOLDER_Y + TREE_ROW * (i + 1) + TREE_ROW / 2 });

export const PAGE_COLS: Col[] = [
  { key: "n", label: "", w: 44 },
  { key: "time", label: "Jam", w: 96, kind: "time" },
  { key: "who", label: "Pemesan", w: 140 },
  { key: "item", label: "Barang", w: 170 },
  { key: "qty", label: "Jumlah", w: 108, kind: "num" },
  { key: "to", label: "Alamat Kirim", w: 196 },
  { key: "pay", label: "Pembayaran", w: 230 },
];

const TreeRow: React.FC<{ readonly depth: number; readonly icon: React.ReactNode; readonly label: string; readonly active?: boolean; readonly glow?: number; readonly caret?: "open" | "closed" }> = ({ depth, icon, label, active, glow = 0, caret }) => (
  <div
    style={{
      height: TREE_ROW,
      display: "flex",
      alignItems: "center",
      gap: 10,
      paddingLeft: 10 + depth * 22,
      marginRight: 10,
      borderRadius: 10,
      fontSize: 15.5,
      fontWeight: active ? 700 : 500,
      color: active ? colors.ink : ink2,
      backgroundColor: active ? pink : glow > 0 ? `rgba(239,90,138,${glow * 0.1})` : "transparent",
      boxShadow: glow > 0 ? `inset 3px 0 0 rgba(239,90,138,${glow})` : "none",
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ width: 14, color: colors.muted, display: "flex" }}>{caret ? <Ic name={caret === "open" ? "chevron" : "chevronRight"} size={14} /> : null}</span>
    {icon}
    {label}
  </div>
);

const folderIcon = <Ic name="folder" size={17} color={ink2} />;
const tableIcon = (on?: boolean) => <Ic name="table" size={16} color={on ? colors.brand : ink2} />;

/**
 * The Catatan workspace: app sidebar, the note tree with the order folder (today plus past
 * days), and the open table note. `active` 0 = today, 1 = yesterday. `glowFrom` walks a
 * highlight down the folder's notes.
 */
export const NotesPage: React.FC<{ readonly today: readonly OrderRow[]; readonly yesterday: readonly OrderRow[]; readonly showYesterday: number; readonly glowFrom?: number; readonly convos: readonly string[]; readonly pressConvo?: number }> = ({ today, yesterday, showYesterday, glowFrom, convos, pressConvo = -100 }) => {
  const frame = useCurrentFrame();
  const press = interpolate(frame, [pressConvo - 2, pressConvo, pressConvo + 8], [0, 1, 0.6], clamp);
  const notes = [NOTE_TODAY, ...PAST_NOTES];
  const glow = (i: number) => (glowFrom === undefined ? 0 : interpolate(frame, [glowFrom + i * 5, glowFrom + i * 5 + 5, glowFrom + i * 5 + 40], [0, 1, 0.25], clamp));
  const active = showYesterday > 0.5 ? 1 : 0;
  const rows = active ? yesterday : today;
  const swap = Math.abs(showYesterday - 0.5) * 2;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", fontFamily, color: colors.ink }}>
      <AppSidebar active="Catatan" user={SARI}>
        {convos.map((c, i) => (
          <div key={c} style={{ padding: "10px 12px", borderRadius: 12, fontSize: 16, fontWeight: i === 0 ? 600 : 500, color: i === 0 ? colors.ink : ink2, whiteSpace: "nowrap", overflow: "hidden", backgroundColor: i === 0 && press > 0 ? `rgba(241,237,234,${press})` : "transparent", scale: String(i === 0 ? 1 - interpolate(frame, [pressConvo - 2, pressConvo, pressConvo + 6], [0, 0.04, 0], clamp) : 1) }}>
            {c}
          </div>
        ))}
      </AppSidebar>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: PAGE_HEAD, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 26px", backgroundColor: "#faf6f3", borderBottom: line }}>
          <span style={{ flex: 1, fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>Catatan</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 22px", borderRadius: 14, background: "linear-gradient(135deg, #ffb27a 0%, #f06694 45%, #8c5cff 100%)", color: "white", fontWeight: 700, fontSize: 17 }}>
            <Ic name="plus" size={18} color="white" />
            Buat baru
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <div style={{ width: TREE_W, flexShrink: 0, backgroundColor: "#faf7f4", borderRight: line, position: "relative", paddingLeft: 10 }}>
            <div style={{ margin: "16px 10px 0 0", height: 42, borderRadius: 12, border: line, backgroundColor: "white", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", fontSize: 15, color: colors.muted }}>
              <Ic name="search" size={16} color={colors.muted} />
              <span style={{ flex: 1 }}>Cari catatan…</span>⌘K
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: ink2, margin: "22px 0 8px 10px" }}>Catatan harian</div>
            <TreeRow depth={0} icon={<Icon name="calendar" size={16} color={ink2} />} label="Hari ini · 9 Nov" />
            <div style={{ position: "absolute", left: 10, right: 0, top: FOLDER_Y - PAGE_HEAD - 40 }}>
              <div style={{ display: "flex", alignItems: "center", height: 32, fontSize: 13.5, fontWeight: 700, color: ink2, padding: "0 20px 0 10px" }}>
                <span style={{ flex: 1 }}>Folder</span>
                <Ic name="plus" size={15} color={colors.muted} />
              </div>
            </div>
            <div style={{ position: "absolute", left: 10, right: 0, top: FOLDER_Y - PAGE_HEAD }}>
              <TreeRow depth={0} caret="open" icon={folderIcon} label={NOTE_FOLDER} />
              {notes.map((n, i) => (
                <TreeRow key={n} depth={1} icon={tableIcon(i === active)} label={n} active={i === active} glow={glow(i)} />
              ))}
              <TreeRow depth={0} caret="closed" icon={folderIcon} label="Resep & Bahan" />
              <TreeRow depth={0} caret="closed" icon={folderIcon} label="Keuangan" />
              <TreeRow depth={0} icon={<Icon name="notes" size={16} color={ink2} />} label="Daftar pelanggan tetap" />
            </div>
            <div style={{ position: "absolute", left: 20, right: 20, bottom: 16, display: "flex", alignItems: "center", gap: 10, paddingTop: 14, borderTop: line, fontSize: 16, color: ink2 }}>
              <Ic name="folder" size={16} color={ink2} />
              <span style={{ flex: 1 }}>Sampah</span>0
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <div style={{ height: 50, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, padding: "0 26px", borderBottom: line, fontSize: 14, color: colors.muted }}>
              <Icon name="check" size={14} /> Tersimpan <span style={{ marginLeft: 14, letterSpacing: 2 }}>···</span>
            </div>
            <div style={{ padding: "28px 32px 0", opacity: swap, translate: `0 ${(1 - swap) * 10}px` }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.02em" }}>{notes[active]}</div>
                  <div style={{ fontSize: 15.5, color: colors.muted, marginTop: 10 }}>Pesanan masuk dari pelanggan hari ini.</div>
                </div>
                <CsvButton />
              </div>
              <div style={{ marginTop: 28 }}>
                <OrderTable rows={rows} cols={PAGE_COLS} rowH={46} size={16} />
              </div>
              <Pager count={rows.length} size={15} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

