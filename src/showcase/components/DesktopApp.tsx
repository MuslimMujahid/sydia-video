import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Icon, SydiaMark } from "../../promo/components/Icons";
import { colors, easeInOut, easeOut, fontFamily } from "../../promo/theme";
import { clamp, Ic } from "../ui";

export const WIN_W = 1600;
export const WIN_H = 960;
export const BAR_H = 40;
export const SIDE_W = 260;
export const MAIN_W = WIN_W - SIDE_W;
export const MAIN_H = WIN_H - BAR_H;
export const PANEL_W = 720;

export const ink2 = "#4a444f";
const LINE = 30;

// ------------------------------------------------------------------ chips
export type ChipKind = "note" | "task" | "file";
export type Chip = { readonly kind: ChipKind; readonly label: string };

const chipStyle: Record<ChipKind, { bg: string; fg: string }> = {
  note: { bg: "#fde7ef", fg: colors.ink },
  task: { bg: "#eef1ff", fg: "#2f45c4" },
  file: { bg: "#f3e8ff", fg: "#6d28d9" },
};

export const ChipPill: React.FC<{ readonly chip: Chip; readonly glow?: number }> = ({ chip, glow = 0 }) => {
  const s = chipStyle[chip.kind];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 36,
        padding: "0 14px",
        borderRadius: 12,
        backgroundColor: s.bg,
        color: s.fg,
        fontSize: 18,
        fontWeight: 600,
        whiteSpace: "nowrap",
        fontFamily,
        boxShadow: glow > 0 ? `0 0 0 ${glow * 4}px ${s.fg}22, 0 10px 24px -8px ${s.fg}55` : "none",
        verticalAlign: "middle",
      }}
    >
      {chip.kind === "task" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      ) : chip.kind === "note" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="8" width="13" height="13" rx="2" />
          <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
        </svg>
      ) : (
        <Icon name="file" size={18} />
      )}
      {chip.label}
    </span>
  );
};

// ------------------------------------------------------------------ messages
export type Block =
  | { readonly t: "p"; readonly lines: readonly string[] }
  | { readonly t: "h"; readonly text: string }
  | { readonly t: "li"; readonly lines: readonly string[]; readonly chip?: Chip }
  | { readonly t: "chip"; readonly chip: Chip };

export type DMsg =
  | { readonly kind: "user"; readonly at: number; readonly lines: readonly string[]; readonly file?: string }
  | { readonly kind: "bot"; readonly at: number; readonly blocks: readonly Block[] }
  | { readonly kind: "think"; readonly at: number; readonly until: number; readonly label: string };

const blockH = (b: Block) => {
  switch (b.t) {
    case "p":
      return b.lines.length * LINE + 14;
    case "h":
      return 34 + 10;
    case "li":
      return b.lines.length * (b.chip ? 38 : LINE) + 8;
    case "chip":
      return 40 + 10;
  }
};

const msgH = (m: DMsg) => {
  if (m.kind === "user") return 30 + m.lines.length * 28 + (m.file ? 50 : 0) + 30;
  if (m.kind === "think") return 34 + 26;
  return m.blocks.reduce((a, b) => a + blockH(b), 0) + 34;
};

const CHIP_CHAR = 9.6;

/**
 * Where a chip sits inside the window content area (below the title bar) at
 * `frame`, mirroring DesktopChat's layout maths. Used to aim the pointer.
 */
export const chipAnchor = (msgs: readonly DMsg[], frame: number, msgIndex: number, panel = 0) => {
  const chatW = MAIN_W - PANEL_W * panel;
  const colW = Math.min(760, chatW - 80);
  const viewH = MAIN_H - 130;
  let y = 36;
  let target = 0;
  msgs.forEach((m, i) => {
    const grow = interpolate(frame, [m.at, m.at + 10], [0, 1], { ...clamp, easing: easeOut });
    const shrink = m.kind === "think" ? interpolate(frame, [m.until - 4, m.until], [1, 0], clamp) : 1;
    if (i === msgIndex) target = y;
    if (frame >= m.at) y += msgH(m) * grow * shrink;
  });
  const offset = Math.max(0, y - viewH);
  const m = msgs[msgIndex];
  let by = 0;
  let x = 0;
  if (m.kind === "bot") {
    for (const b of m.blocks) {
      if (b.t === "chip" || (b.t === "li" && b.chip)) {
        const label = b.t === "chip" ? b.chip.label : (b.chip?.label ?? "");
        x = (b.t === "li" ? 26 : 0) + (label.length * CHIP_CHAR + 52) / 2;
        by += b.t === "li" ? 19 : 18;
        break;
      }
      by += blockH(b);
    }
  }
  return { x: SIDE_W + (chatW - colW) / 2 + x, y: target - offset + 24 + by };
};

/** **bold** spans inside a line. */
export const Rich: React.FC<{ readonly text: string }> = ({ text }) => (
  <>
    {text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") ? (
        <strong key={i} style={{ color: colors.ink, fontWeight: 700 }}>
          {p.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{p}</span>
      ),
    )}
  </>
);

export const Spinner: React.FC<{ readonly size?: number }> = ({ size = 18 }) => {
  const frame = useCurrentFrame();
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: size,
        border: "2.5px solid rgba(23,20,25,0.15)",
        borderTopColor: colors.muted,
        rotate: `${frame * 22}deg`,
        flexShrink: 0,
      }}
    />
  );
};

const BlockView: React.FC<{ readonly b: Block; readonly glowChip?: number }> = ({ b, glowChip = 0 }) => {
  if (b.t === "h") return <div style={{ height: 44, fontSize: 21, fontWeight: 700, color: colors.ink, display: "flex", alignItems: "center" }}>{b.text}</div>;
  if (b.t === "p")
    return (
      <div style={{ paddingBottom: 14 }}>
        {b.lines.map((l, i) => (
          <div key={i} style={{ height: LINE, lineHeight: `${LINE}px`, whiteSpace: "nowrap" }}>
            <Rich text={l} />
          </div>
        ))}
      </div>
    );
  if (b.t === "chip")
    return (
      <div style={{ height: 50 }}>
        <ChipPill chip={b.chip} glow={glowChip} />
      </div>
    );
  return (
    <div style={{ display: "flex", gap: 14, paddingBottom: 8, paddingLeft: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ink2, marginTop: b.chip ? 16 : 12, flexShrink: 0 }} />
      <div>
        {b.lines.map((l, i) => (
          <div key={i} style={{ height: b.chip ? 38 : LINE, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            {i === 0 && b.chip ? <ChipPill chip={b.chip} glow={glowChip} /> : null}
            <Rich text={l} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Message: React.FC<{ readonly m: DMsg; readonly frame: number; readonly glowChip?: number }> = ({ m, frame, glowChip }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - m.at, fps, config: { damping: 16, stiffness: 220, mass: 0.6 } });
  if (m.kind === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 30 }}>
        <div
          style={{
            maxWidth: 560,
            padding: "15px 20px",
            borderRadius: 22,
            backgroundColor: "#f1efef",
            color: "#5a5560",
            fontSize: 18.5,
            lineHeight: "28px",
            opacity: p,
            scale: String(0.9 + p * 0.1),
            translate: `0 ${(1 - p) * 30}px`,
            transformOrigin: "100% 100%",
          }}
        >
          {m.lines.map((l) => (
            <div key={l} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
          {m.file ? (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(23,20,25,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
              <ChipPill chip={{ kind: "file", label: m.file }} />
              <span style={{ fontSize: 14, fontFamily: "monospace", color: colors.muted }}>2,4 MB</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
  if (m.kind === "think") {
    const out = interpolate(frame, [m.until - 4, m.until], [1, 0], clamp);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, height: 34, fontSize: 18, color: colors.muted, opacity: p * out }}>
        <Spinner />
        {m.label}
      </div>
    );
  }
  return (
    <div style={{ paddingBottom: 34, fontSize: 19, color: ink2 }}>
      {m.blocks.map((b, i) => {
        const bp = interpolate(frame, [m.at + i * 5, m.at + i * 5 + 10], [0, 1], { ...clamp, easing: easeOut });
        return (
          <div key={i} style={{ opacity: bp, translate: `0 ${(1 - bp) * 14}px`, filter: bp < 1 ? `blur(${(1 - bp) * 4}px)` : undefined }}>
            <BlockView b={b} glowChip={glowChip} />
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------ composer
export type Compose = { readonly start: number; readonly send: number; readonly text: string };
export type Attach = { readonly at: number; readonly ready: number; readonly sent: number; readonly name: string };

const Composer: React.FC<{
  readonly frame: number;
  readonly compose: readonly Compose[];
  readonly attach?: Attach;
  readonly context?: { readonly from: number; readonly to: number; readonly label: string };
  readonly width: number;
}> = ({ frame, compose, attach, context, width }) => {
  const { fps } = useVideoConfig();
  const active = compose.find((c) => frame >= c.start && frame < c.send);
  const sent = compose.find((c) => frame >= c.send && frame < c.send + 8);
  const chars = active ? [...active.text] : [];
  const n = active ? Math.ceil(interpolate(frame, [active.start, active.send - 8], [0, chars.length], clamp)) : 0;
  const text = chars.slice(0, n).join("");
  const shown = text.length > 62 ? `…${text.slice(-61)}` : text;
  const pulse = sent ? interpolate(frame, [sent.send, sent.send + 3, sent.send + 8], [0, 1, 0], clamp) : 0;
  const showAttach = attach && frame >= attach.at && frame < attach.sent;
  const attachP = attach ? spring({ frame: frame - attach.at, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } }) : 0;
  const ctx = context && frame >= context.from && frame < context.to;
  return (
    <div style={{ width, position: "relative" }}>
      {showAttach ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 74,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 16,
            border: "1px solid rgba(23,20,25,0.1)",
            backgroundColor: "white",
            fontSize: 17,
            color: colors.ink,
            opacity: attachP,
            scale: String(0.8 + attachP * 0.2),
            transformOrigin: "0% 100%",
            boxShadow: "0 12px 30px -16px rgba(23,20,25,0.3)",
          }}
        >
          <Icon name="file" size={18} />
          {attach.name}
          <span style={{ color: colors.muted, display: "inline-flex", alignItems: "center", gap: 8 }}>
            {frame < attach.ready ? (
              <>
                <Spinner size={14} /> Memproses
              </>
            ) : (
              <span style={{ color: colors.emerald, fontWeight: 600 }}>Siap</span>
            )}
          </span>
          <span style={{ color: colors.muted }}>✕</span>
        </div>
      ) : null}
      {ctx ? (
        <div style={{ position: "absolute", left: 6, bottom: 70, display: "flex", alignItems: "center", gap: 8, fontSize: 15, color: colors.muted }}>
          <Icon name="file" size={15} />
          Sedang diedit: {context.label}
        </div>
      ) : null}
      <div
        style={{
          height: 60,
          borderRadius: 999,
          backgroundColor: "#f1efef",
          border: active ? "1.5px solid rgba(239,90,138,0.45)" : "1px solid rgba(23,20,25,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 10px 0 24px",
          fontSize: 18.5,
          boxShadow: active ? "0 10px 30px -14px rgba(239,90,138,0.45)" : "none",
        }}
      >
        <Icon name="clip" size={20} color={colors.muted} />
        <div style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", color: text ? colors.ink : colors.muted }}>
          {shown || "Tulis pesan atau lampirkan file..."}
          {active && frame % 14 < 8 ? <span style={{ display: "inline-block", width: 2, height: 22, marginLeft: 1, verticalAlign: "-4px", backgroundColor: colors.brand }} /> : null}
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: text || showAttach ? "linear-gradient(135deg, #ffb27a 0%, #f06694 45%, #8c5cff 100%)" : "#dcc9d2",
            scale: String(1 - pulse * 0.25),
          }}
        >
          <Icon name="send" size={20} color="white" />
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ side panel
export const NotePanel: React.FC<{ readonly frame: number; readonly typeFrom: number; readonly title: string }> = ({ frame, typeFrom, title }) => {
  const extra = "Minta legal review pasal 4";
  const n = Math.max(0, Math.floor((frame - typeFrom) * 0.9));
  const typing = frame >= typeFrom;
  const saving = typing && n < extra.length + 6;
  return (
    <AbsoluteFill style={{ backgroundColor: "white", borderLeft: "1px solid rgba(23,20,25,0.08)", fontFamily }}>
      <div style={{ height: 54, backgroundColor: "#f4f2f1", display: "flex", alignItems: "flex-end", padding: "0 16px" }}>
        <div style={{ height: 44, padding: "0 16px", borderRadius: "12px 12px 0 0", backgroundColor: "white", display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 600 }}>
          <Icon name="file" size={16} />
          {title.slice(0, 18)}…
          <span style={{ color: colors.muted, marginLeft: 8 }}>✕</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 22px" }}>
        <span style={{ padding: "8px 14px", borderRadius: 999, backgroundColor: "#f1edea", fontSize: 15, fontWeight: 700 }}>Catatan khusus</span>
        <span style={{ flex: 1 }} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, backgroundColor: "#f6f4f3", fontSize: 15, color: colors.muted }}>
          {saving ? <Spinner size={13} /> : <Icon name="check" size={15} />}
          {saving ? "Menyimpan…" : "Tersimpan"}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, backgroundColor: "#f6f4f3", fontSize: 15, fontWeight: 700 }}>
          <Ic name="link" size={15} />
          Buka di Catatan
        </span>
      </div>
      <div style={{ padding: "18px 44px" }}>
        <div style={{ fontSize: 38, fontWeight: 500, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ marginTop: 24, height: 50, borderRadius: 14, backgroundColor: "#faf6f3", display: "flex", alignItems: "center", gap: 26, padding: "0 18px", color: ink2 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>H2</span>
          <Ic name="bold" size={19} />
          <Ic name="italic" size={19} />
          <Ic name="bullets" size={19} />
          <Ic name="link" size={19} />
        </div>
        <div style={{ marginTop: 30, fontSize: 23, fontWeight: 700 }}>Rapat Vendor — 9 Nov 2026</div>
        {["Harga final disepakati: Rp48.000.000", "Draf kontrak dikirim sebelum Jumat"].map((t) => (
          <div key={t} style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 16, fontSize: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ink }} />
            {t}
          </div>
        ))}
        {typing ? (
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 16, fontSize: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ink }} />
            <span>
              {extra.slice(0, n)}
              <span style={{ display: "inline-block", width: 2, height: 24, marginLeft: 1, verticalAlign: "-5px", backgroundColor: colors.brand, opacity: frame % 14 < 8 ? 1 : 0 }} />
            </span>
          </div>
        ) : null}
        <div style={{ marginTop: 60, borderTop: "1px solid rgba(23,20,25,0.08)", paddingTop: 22, display: "flex", fontSize: 17 }}>
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center", fontWeight: 700, flex: 1 }}>
            <Ic name="link" size={17} /> Tautan masuk
          </span>
          <span style={{ color: colors.muted, fontSize: 15 }}>0 catatan</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ popover
export const Popover: React.FC<{
  readonly frame: number;
  readonly at: number;
  readonly until: number;
  readonly title: string;
  readonly lines: readonly string[];
  readonly primary: string;
  readonly secondary: string;
  readonly pressSecondary?: number;
  readonly x: number;
  readonly y: number;
}> = ({ frame, at, until, title, lines, primary, secondary, pressSecondary, x, y }) => {
  const { fps } = useVideoConfig();
  if (frame < at || frame >= until) return null;
  const p = spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 260, mass: 0.5 } });
  const out = interpolate(frame, [until - 6, until], [0, 1], clamp);
  const press = pressSecondary ? interpolate(frame, [pressSecondary - 2, pressSecondary, pressSecondary + 5], [0, 1, 0], clamp) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 330,
        padding: "18px 18px 16px",
        borderRadius: 18,
        backgroundColor: "white",
        border: "1px solid rgba(23,20,25,0.07)",
        boxShadow: "0 24px 50px -20px rgba(23,20,25,0.35)",
        opacity: p * (1 - out),
        scale: String(0.9 + p * 0.1),
        translate: `0 ${(1 - p) * -10}px`,
        transformOrigin: "20% 0%",
        zIndex: 20,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
      {lines.map((l) => (
        <div key={l} style={{ fontSize: 16, color: colors.muted, marginTop: 6 }}>
          {l}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 16 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 14, backgroundColor: "#ef5a8a", color: "white", fontSize: 16, fontWeight: 700 }}>
          <Icon name="check" size={16} color="white" />
          {primary}
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, scale: String(1 - press * 0.12), color: press > 0 ? colors.brand : colors.ink }}>{secondary}</span>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ window
const nav: { icon: "chat" | "calendar" | "notes" | "file" | "more"; label: string }[] = [
  { icon: "chat", label: "Chat baru" },
  { icon: "calendar", label: "Kalender" },
  { icon: "notes", label: "Catatan" },
  { icon: "file", label: "File" },
  { icon: "more", label: "Lainnya" },
];

export const WindowChrome: React.FC<{
  readonly width: number;
  readonly height: number;
  readonly url: string;
  readonly children: React.ReactNode;
  readonly glow?: number;
}> = ({ width, height, url, children, glow = 0 }) => (
  <div
    style={{
      width,
      height,
      borderRadius: 26,
      overflow: "hidden",
      backgroundColor: "white",
      fontFamily,
      color: colors.ink,
      border: "1px solid rgba(23,20,25,0.07)",
      boxShadow: `rgba(23,20,25,0.06) 0 2px 4px, rgba(23,20,25,0.22) 0 60px 120px -40px, rgba(140,92,255,${0.16 + glow * 0.3}) 0 30px 90px -30px`,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div style={{ height: BAR_H, flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "0 18px", backgroundColor: "#f6f2ee", borderBottom: "1px solid rgba(23,20,25,0.06)" }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <div key={c} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c }} />
      ))}
      <div style={{ marginLeft: 20, padding: "4px 16px", borderRadius: 999, backgroundColor: "white", fontSize: 14, color: colors.muted }}>{url}</div>
    </div>
    <div style={{ flex: 1, position: "relative", minHeight: 0 }}>{children}</div>
  </div>
);

export type AppUser = { readonly name: string; readonly initials: string; readonly plan: string };
const NADIA: AppUser = { name: "Nadia", initials: "NA", plan: "Trial gratis" };

/** The app's left sidebar: logo, main nav, the conversation list (`children`) and the account chip. */
export const AppSidebar: React.FC<{ readonly active: string; readonly user?: AppUser; readonly children?: React.ReactNode }> = ({ active, user = NADIA, children }) => (
  <div style={{ width: SIDE_W, borderRight: "1px solid rgba(23,20,25,0.07)", padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px 18px" }}>
      <SydiaMark size={26} />
      <span style={{ fontWeight: 700, fontSize: 19 }}>Sydia</span>
    </div>
    {nav.map((n) => (
      <div key={n.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, fontSize: 17, backgroundColor: n.label === active ? "#f1edea" : "transparent", color: n.label === active ? colors.ink : ink2 }}>
        <Icon name={n.icon} size={18} />
        {n.label}
      </div>
    ))}
    <div style={{ fontSize: 13, fontWeight: 700, color: colors.muted, margin: "26px 10px 10px" }}>Percakapan</div>
    {children}
    <div style={{ flex: 1 }} />
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 8 }}>
      <div style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#fde7ef", color: colors.brand, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{user.initials}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{user.name}</div>
        <div style={{ fontSize: 12, color: colors.muted }}>{user.plan}</div>
      </div>
    </div>
  </div>
);

export type DesktopChatProps = {
  readonly msgs: readonly DMsg[];
  readonly compose: readonly Compose[];
  readonly attach?: Attach;
  readonly context?: { readonly from: number; readonly to: number; readonly label: string };
  /** 0 → 1 open amount of the right-side note panel. */
  readonly panel: number;
  readonly panelTypeFrom: number;
  readonly firstSend: number;
  readonly convoTitle: string;
  readonly glowChip?: (frame: number) => number;
  readonly overlay?: React.ReactNode;
  /** Replaces the default note panel content. */
  readonly panelView?: React.ReactNode;
  readonly user?: AppUser;
  /** Older conversations listed under the current one. */
  readonly recent?: readonly string[];
};

/** The Sydia chat screen: sidebar, conversation, composer and note panel. */
export const DesktopChat: React.FC<DesktopChatProps> = ({ msgs, compose, attach, context, panel, panelTypeFrom, firstSend, convoTitle, glowChip, overlay, panelView, user, recent = ["Catatan pengeluaran"] }) => {
  const frame = useCurrentFrame();
  const started = interpolate(frame, [firstSend - 2, firstSend + 14], [0, 1], { ...clamp, easing: easeInOut });
  const panelW = PANEL_W * panel;
  const chatW = MAIN_W - panelW;
  const colW = Math.min(760, chatW - 80);
  const viewH = MAIN_H - 130;

  let y = 36;
  const placed = msgs.map((m) => {
    const grow = interpolate(frame, [m.at, m.at + 10], [0, 1], { ...clamp, easing: easeOut });
    const shrink = m.kind === "think" ? interpolate(frame, [m.until - 4, m.until], [1, 0], clamp) : 1;
    const top = y;
    if (frame >= m.at) y += msgH(m) * grow * shrink;
    return { m, top, visible: frame >= m.at && (m.kind !== "think" || frame < m.until) };
  });
  const offset = Math.max(0, y - viewH);
  const composerY = interpolate(started, [0, 1], [MAIN_H / 2 + 10, MAIN_H - 92]);

  return (
    <WindowChrome width={WIN_W} height={WIN_H} url="sydia · Asisten pribadi">
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        <AppSidebar active="Chat baru" user={user}>
          {frame >= firstSend ? (
            <div style={{ padding: "10px 12px", borderRadius: 12, backgroundColor: "#f1edea", fontSize: 16, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", opacity: started }}>{convoTitle}</div>
          ) : null}
          {recent.map((r) => (
            <div key={r} style={{ padding: "10px 12px", fontSize: 16, fontWeight: 500, color: ink2, whiteSpace: "nowrap", overflow: "hidden" }}>
              {r}
            </div>
          ))}
        </AppSidebar>
        <div style={{ width: chatW, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: MAIN_H / 2 - 90, textAlign: "center", fontSize: 34, fontWeight: 500, opacity: 1 - started, translate: `0 ${-started * 40}px` }}>
            Ingin melakukan apa hari ini?
          </div>
          {started > 0 ? (
            <div style={{ position: "absolute", left: (chatW - colW) / 2, width: colW, top: 0, height: viewH + 20, overflow: "hidden" }}>
              <div style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: colors.muted, marginTop: 14 - offset }}>Hari ini</div>
              {placed.map(({ m, top, visible }, i) =>
                !visible || top - offset + msgH(m) < 0 ? null : (
                  <div key={i} style={{ position: "absolute", left: 0, right: 0, top: top - offset + 24 }}>
                    <Message m={m} frame={frame} glowChip={glowChip ? glowChip(frame) : 0} />
                  </div>
                ),
              )}
            </div>
          ) : null}
          <div style={{ position: "absolute", left: (chatW - colW) / 2, top: composerY }}>
            <Composer frame={frame} compose={compose} attach={attach} context={context} width={colW} />
          </div>
        </div>
        {panel > 0 ? (
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: PANEL_W, translate: `${(1 - panel) * PANEL_W}px 0` }}>
            {panelView ?? <NotePanel frame={frame} typeFrom={panelTypeFrom} title="Catatan Rapat Vendor — 9 Nov 2026" />}
          </div>
        ) : null}
      </div>
      {overlay}
    </WindowChrome>
  );
};
