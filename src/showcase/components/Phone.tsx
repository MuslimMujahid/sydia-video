import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SydiaMark } from "../../promo/components/Icons";
import { easeInOut, easeOut, fontFamily } from "../../promo/theme";
import { clamp, Ic } from "../ui";

export const PHONE_W = 470;
export const PHONE_H = 960;
const BEZEL = 13;
export const SCREEN_W = PHONE_W - BEZEL * 2;
export const SCREEN_H = PHONE_H - BEZEL * 2;
export const STATUS_H = 54;
export const HEADER_H = 74;
export const INPUT_H = 78;
export const CHAT_H = SCREEN_H - STATUS_H - HEADER_H - INPUT_H;

export const wa = {
  green: "#00a884",
  bg: "#efeae2",
  out: "#d9fdd3",
  ink: "#111b21",
  meta: "#667781",
  tick: "#53bdeb",
};

const LINE = 29;
const FWD_H = 24;
const SPACER = 12;
const GAP = 10;

export type ChatMsg =
  | {
      readonly kind: "text";
      readonly from: "me" | "bot";
      readonly at: number;
      readonly lines: readonly string[];
      readonly time: string;
      /** Start frame of each ==marker== swipe, in order of appearance. */
      readonly hl?: readonly number[];
      /** Shows WhatsApp's "Diteruskan" (forwarded) label above the text. */
      readonly fwd?: boolean;
      /** Frame from which the message is long-press selected (tinted row). */
      readonly sel?: number;
    }
  | { readonly kind: "doc"; readonly at: number; readonly quote: string; readonly name: string; readonly meta: string; readonly time: string }
  | { readonly kind: "voice"; readonly at: number; readonly dur: string; readonly time: string }
  | { readonly kind: "chip"; readonly at: number; readonly label: string };

export type Compose = { readonly start: number; readonly send: number; readonly text: string };

const heightOf = (m: ChatMsg) => {
  switch (m.kind) {
    case "text":
      return 16 + m.lines.reduce((a, l) => a + (l === "" ? SPACER : LINE), 0) + 22 + (m.fwd ? FWD_H : 0);
    case "doc":
      return 12 + 66 + 8 + 86 + 26;
    case "voice":
      return 12 + 58 + 22;
    case "chip":
      return 40;
  }
};

/** WhatsApp-ish wallpaper doodles, drawn very faintly. */
const doodles =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' fill='none' stroke='%23000' stroke-opacity='0.05' stroke-width='2' stroke-linecap='round'><circle cx='20' cy='22' r='8'/><path d='M60 14l6 10h-12z'/><path d='M96 20c6-6 14 2 8 8s-14-2-8-8z'/><path d='M18 72h18M27 63v18'/><rect x='56' y='60' width='18' height='14' rx='4'/><path d='M92 70q8-10 16 0t16 0'/><circle cx='30' cy='106' r='3'/><path d='M70 100l8 8M78 100l-8 8'/></svg>\")";

/** The render machine has no emoji font, so the two emoji we use are drawn inline. */
const emoji: Record<string, React.ReactNode> = {
  "⏰": (
    <svg width="22" height="22" viewBox="0 0 24 24" style={{ verticalAlign: "-4px" }}>
      <path d="M4 5.5 7 3M20 5.5 17 3" stroke="#d93a3a" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="13" r="8.5" fill="#f24b4b" />
      <circle cx="12" cy="13" r="6.4" fill="white" />
      <path d="M12 9v4.4l2.6 1.6" stroke="#222" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="m7 21-1.5 1.5M17 21l1.5 1.5" stroke="#d93a3a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "👍": (
    <svg width="22" height="22" viewBox="0 0 24 24" style={{ verticalAlign: "-4px" }}>
      <path d="M7 10.5h-3.2a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1H7Z" fill="#e8a33d" />
      <path d="M7 10.5 11.2 3c1.6 0 2.6 1.3 2.2 2.9l-.8 3.3h6.2a2 2 0 0 1 2 2.4l-1.5 7.4a2.4 2.4 0 0 1-2.4 2H7Z" fill="#ffc83d" />
    </svg>
  ),
};

/** Running index of ==markers== within one bubble, so each gets its own timing. */
type MarkCounter = { i: number };

/**
 * Inline text: *bold*, ==highlight== (a marker swipe timed by `hl`), and the
 * two emoji we use, drawn inline because the render machine has no emoji font.
 */
export const Bold: React.FC<{ readonly text: string; readonly frame?: number; readonly hl?: readonly number[]; readonly counter?: MarkCounter }> = ({ text, frame = 0, hl, counter }) => {
  const parts = text.split(/(\*[^*]+\*|==[^=]+==|⏰|👍)/gu);
  return (
    <>
      {parts.map((p, i) => {
        if (emoji[p]) return <span key={i}>{emoji[p]}</span>;
        if (p.startsWith("==") && p.endsWith("==") && p.length > 4) {
          const idx = counter ? counter.i++ : 0;
          const start = hl?.[idx] ?? 1e9;
          const swipe = interpolate(frame, [start, start + 10], [0, 1], { ...clamp, easing: easeOut });
          return (
            <span
              key={i}
              style={{
                fontWeight: 700,
                borderRadius: 5,
                padding: "0 3px",
                margin: "0 -3px",
                backgroundImage: "linear-gradient(#ffe066, #ffe066)",
                backgroundRepeat: "no-repeat",
                backgroundSize: `${swipe * 100}% 100%`,
              }}
            >
              {p.slice(2, -2)}
            </span>
          );
        }
        if (p.startsWith("*") && p.endsWith("*") && p.length > 1)
          return (
            <strong key={i} style={{ fontWeight: 700 }}>
              {p.slice(1, -1)}
            </strong>
          );
        return <span key={i}>{p}</span>;
      })}
    </>
  );
};

const Ticks: React.FC = () => (
  <svg width="19" height="12" viewBox="0 0 19 12" fill="none" stroke={wa.tick} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m1 6.5 3.5 3.5L11 2.5M8 9.5l.5.5L15 2.5" />
  </svg>
);

const Meta: React.FC<{ readonly time: string; readonly me?: boolean }> = ({ time, me }) => (
  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 5, fontSize: 13, color: wa.meta, height: 16, marginTop: 2 }}>
    {time}
    {me ? <Ticks /> : null}
  </div>
);

const Waveform: React.FC<{ readonly progress: number; readonly bars?: number; readonly color?: string; readonly height?: number }> = ({
  progress,
  bars = 30,
  color = "#8696a0",
  height = 30,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 3, height }}>
    {Array.from({ length: bars }, (_, i) => {
      const h = 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 0.75;
      return (
        <div
          key={i}
          style={{ width: 3.5, height: h * height, borderRadius: 2, backgroundColor: i / bars < progress ? wa.green : color }}
        />
      );
    })}
  </div>
);

const Bubble: React.FC<{ readonly msg: ChatMsg; readonly frame: number }> = ({ msg, frame }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - msg.at, fps, config: { damping: 14, stiffness: 240, mass: 0.55 } });
  if (msg.kind === "chip") {
    return (
      <div style={{ display: "flex", justifyContent: "center", opacity: p, scale: String(0.8 + p * 0.2) }}>
        <div style={{ padding: "6px 14px", borderRadius: 10, backgroundColor: "white", fontSize: 14, fontWeight: 500, color: wa.meta, boxShadow: "0 1px 1px rgba(0,0,0,0.08)" }}>
          {msg.label}
        </div>
      </div>
    );
  }
  const me = msg.kind === "voice" || (msg.kind === "text" && msg.from === "me");
  const style: React.CSSProperties = {
    alignSelf: me ? "flex-end" : "flex-start",
    maxWidth: SCREEN_W - 60,
    backgroundColor: me ? wa.out : "white",
    borderRadius: 14,
    borderTopRightRadius: me ? 4 : 14,
    borderTopLeftRadius: me ? 14 : 4,
    padding: "8px 11px 6px 12px",
    boxShadow: "0 1px 1px rgba(11,20,26,0.1)",
    color: wa.ink,
    opacity: Math.min(1, p * 1.4),
    scale: String(0.82 + p * 0.18),
    translate: `0 ${(1 - p) * 16}px`,
    transformOrigin: me ? "100% 100%" : "0% 100%",
  };
  if (msg.kind === "text") {
    const counter: MarkCounter = { i: 0 };
    return (
      <div style={style}>
        {msg.fwd ? (
          <div style={{ height: FWD_H, display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontStyle: "italic", color: wa.meta }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={wa.meta} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 5 6 6-6 6" />
              <path d="M21 11H11a7 7 0 0 0-7 7v1" />
            </svg>
            Diteruskan
          </div>
        ) : null}
        {msg.lines.map((l, i) =>
          l === "" ? (
            <div key={i} style={{ height: SPACER }} />
          ) : (
            <div key={i} style={{ fontSize: 20, lineHeight: `${LINE}px`, whiteSpace: "pre" }}>
              <Bold text={l} frame={frame} hl={msg.hl} counter={counter} />
            </div>
          ),
        )}
        <Meta time={msg.time} me={me} />
      </div>
    );
  }
  if (msg.kind === "doc") {
    return (
      <div style={{ ...style, width: 360 }}>
        <div style={{ height: 66, borderRadius: 8, backgroundColor: "#f5f6f6", borderLeft: `4px solid ${wa.green}`, padding: "8px 12px", overflow: "hidden" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: wa.green }}>Anda</div>
          <div style={{ fontSize: 16, color: wa.meta, marginTop: 3, whiteSpace: "nowrap" }}>{msg.quote}</div>
        </div>
        <div style={{ marginTop: 8, height: 86, borderRadius: 10, backgroundColor: "#f5f6f6", display: "flex", alignItems: "center", gap: 14, padding: "0 14px" }}>
          <div style={{ width: 46, height: 56, borderRadius: 6, backgroundColor: "#e5484d", color: "white", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 8 }}>PDF</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{msg.name}</div>
            <div style={{ fontSize: 14, color: wa.meta, marginTop: 4 }}>{msg.meta}</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 19, border: `2px solid ${wa.meta}`, color: wa.meta, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ic name="download" size={18} />
          </div>
        </div>
        <Meta time={msg.time} />
      </div>
    );
  }
  const play = interpolate(frame, [msg.at + 6, msg.at + 60], [0, 1], clamp);
  return (
    <div style={{ ...style, width: 340 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, height: 58 }}>
        <div style={{ width: 46, height: 46, borderRadius: 23, overflow: "hidden", backgroundColor: "#f6c2d4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#a3173f" }}>N</div>
        <Ic name="play" size={24} color={wa.meta} fill={wa.meta} />
        <div style={{ flex: 1 }}>
          <Waveform progress={play} bars={26} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: wa.meta, marginTop: 2, paddingLeft: 58 }}>
        <span>{msg.dur}</span>
        <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
          {msg.time}
          <Ticks />
        </span>
      </div>
    </div>
  );
};

const StatusBar: React.FC<{ readonly time: string; readonly dark?: boolean }> = ({ time, dark }) => {
  const c = dark ? "white" : wa.ink;
  return (
    <div style={{ height: STATUS_H, display: "flex", alignItems: "center", padding: "6px 34px 0", fontSize: 18, fontWeight: 600, color: c, position: "relative" }}>
      <span style={{ flex: 1, fontVariantNumeric: "tabular-nums" }}>{time}</span>
      <div style={{ position: "absolute", left: "50%", top: 12, translate: "-50% 0", width: 118, height: 34, borderRadius: 17, backgroundColor: "#000" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <svg width="20" height="13" viewBox="0 0 20 13" fill={c}>
          <rect x="0" y="9" width="3.5" height="4" rx="1" />
          <rect x="5.5" y="6" width="3.5" height="7" rx="1" />
          <rect x="11" y="3" width="3.5" height="10" rx="1" />
          <rect x="16.5" y="0" width="3.5" height="13" rx="1" />
        </svg>
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none" stroke={c}>
          <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" strokeOpacity="0.45" />
          <rect x="2.5" y="2.5" width="16" height="8" rx="2" fill={c} stroke="none" />
          <path d="M24.5 4.5v4" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

/** Who the chat is with. Defaults to Sydia. */
export type Contact = { readonly name: string; readonly avatar: React.ReactNode; readonly status?: string };

export const SydiaAvatar: React.FC<{ readonly size?: number }> = ({ size = 46 }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: "linear-gradient(135deg, #fff1e6, #fde7ef 50%, #efe6ff)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <SydiaMark size={size * 0.65} />
  </div>
);

const SYDIA: Contact = { name: "Sydia", avatar: <SydiaAvatar /> };

/** WhatsApp's long-press selection bar: count, star, delete and forward. `press` (0→1) dips the forward icon. */
const SelectHeader: React.FC<{ readonly press: number }> = ({ press }) => (
  <div style={{ height: HEADER_H, display: "flex", alignItems: "center", gap: 26, padding: "0 22px 0 14px", backgroundColor: "white", borderBottom: "1px solid rgba(11,20,26,0.07)", color: wa.ink }}>
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={wa.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
    <div style={{ flex: 1, fontSize: 22, fontWeight: 600 }}>1</div>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={wa.ink} strokeWidth="2" strokeLinejoin="round">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9Z" />
    </svg>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={wa.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
    <div style={{ width: 44, height: 44, margin: -10, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `rgba(0,168,132,${press * 0.18})`, scale: String(1 - press * 0.15) }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={press > 0 ? wa.green : wa.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 5 6 6-6 6" />
        <path d="M21 11H11a7 7 0 0 0-7 7v1" />
      </svg>
    </div>
  </div>
);

const Header: React.FC<{ readonly typing: boolean; readonly contact?: Contact }> = ({ typing, contact = SYDIA }) => (
  <div style={{ height: HEADER_H, display: "flex", alignItems: "center", gap: 12, padding: "0 16px 0 10px", backgroundColor: "white", borderBottom: "1px solid rgba(11,20,26,0.07)" }}>
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={wa.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
    {contact.avatar}
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: wa.ink }}>{contact.name}</div>
      <div style={{ fontSize: 14, color: typing ? wa.green : wa.meta, fontWeight: typing ? 600 : 400, marginTop: 1 }}>{typing ? "mengetik…" : (contact.status ?? "online")}</div>
    </div>
    <Ic name="video" size={24} color={wa.ink} />
    <div style={{ width: 18 }} />
    <Ic name="phone" size={22} color={wa.ink} />
  </div>
);

export type Recording = { readonly start: number; readonly end: number };

const InputBar: React.FC<{ readonly compose: readonly Compose[]; readonly recording?: Recording; readonly frame: number }> = ({ compose, recording, frame }) => {
  const active = compose.find((c) => frame >= c.start && frame < c.send);
  const sent = compose.find((c) => frame >= c.send && frame < c.send + 8);
  const chars = active ? [...active.text] : [];
  const text = active ? chars.slice(0, Math.ceil(interpolate(frame, [active.start, active.send - 6], [0, chars.length], clamp))).join("") : "";
  const pulse = sent ? interpolate(frame, [sent.send, sent.send + 3, sent.send + 8], [0, 1, 0], clamp) : 0;
  const rec = recording && frame >= recording.start && frame < recording.end;
  const recSeconds = rec ? Math.floor((frame - recording.start) / 30) : 0;
  const recP = recording ? interpolate(frame, [recording.start, recording.start + 8, recording.end - 4, recording.end], [0, 1, 1, 0], clamp) : 0;
  return (
    <div style={{ height: INPUT_H, display: "flex", alignItems: "center", gap: 10, padding: "0 10px 6px", backgroundColor: wa.bg, position: "relative" }}>
      <div style={{ flex: 1, height: 54, borderRadius: 27, backgroundColor: "white", display: "flex", alignItems: "center", gap: 12, padding: "0 16px", fontSize: 19, color: text ? wa.ink : wa.meta, overflow: "hidden", boxShadow: "0 1px 1px rgba(11,20,26,0.08)" }}>
        {rec ? (
          <>
            <span style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#ea0038", opacity: frame % 20 < 12 ? 1 : 0.3 }} />
            <span style={{ fontVariantNumeric: "tabular-nums", color: wa.ink }}>{`0:0${recSeconds}`}</span>
            <span style={{ flex: 1, textAlign: "right", fontSize: 16, paddingRight: 34 }}>‹ Geser untuk batal</span>
          </>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={wa.meta} strokeWidth="1.8">
              <circle cx="12" cy="12" r="9.5" />
              <path d="M8 14.5s1.5 2 4 2 4-2 4-2M9 9.5h.01M15 9.5h.01" strokeLinecap="round" strokeWidth="2.4" />
            </svg>
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>
              <Bold text={[...text].length > 26 ? `…${[...text].slice(-25).join("")}` : text || "Ketik pesan"} />
              {active && frame % 14 < 8 ? <span style={{ display: "inline-block", width: 2, height: 22, marginLeft: 1, verticalAlign: "-4px", backgroundColor: wa.green }} /> : null}
            </span>
            {text ? null : <Ic name="link" size={22} color={wa.meta} />}
          </>
        )}
      </div>
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: wa.green,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          scale: String(1 - pulse * 0.18 + recP * 0.5),
          translate: `${-recP * 8}px ${-recP * 10}px`,
          boxShadow: recP > 0 ? `0 0 0 ${8 + Math.sin(frame / 3) * 4}px rgba(0,168,132,0.2)` : "none",
          zIndex: 2,
        }}
      >
        {text || active ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
          </svg>
        ) : (
          <Ic name="mic" size={24} color="white" />
        )}
      </div>
    </div>
  );
};

/** Smoothly-scrolling WhatsApp conversation, laid out from known line counts. */
const ChatArea: React.FC<{ readonly msgs: readonly ChatMsg[]; readonly frame: number; readonly dim?: number; readonly rewind?: number }> = ({ msgs, frame, dim = 0, rewind = 0 }) => {
  let y = 14;
  const placed = msgs.map((m) => {
    const grow = interpolate(frame, [m.at, m.at + 9], [0, 1], { ...clamp, easing: easeOut });
    const top = y;
    if (frame >= m.at) y += (heightOf(m) + GAP) * grow;
    return { m, top };
  });
  const offset = Math.max(0, y + 6 - CHAT_H) * (1 - rewind);
  return (
    <div style={{ height: CHAT_H, position: "relative", overflow: "hidden", backgroundColor: wa.bg, backgroundImage: doodles }}>
      {placed.map(({ m, top }, i) =>
        frame < m.at || top - offset + heightOf(m) < -20 ? null : (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              top: top - offset,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {m.kind === "text" && m.sel !== undefined && frame >= m.sel ? (
              <div style={{ position: "absolute", left: -12, right: -12, top: -4, bottom: -4, backgroundColor: "rgba(0,168,132,0.2)", opacity: interpolate(frame, [m.sel, m.sel + 4], [0, 1], clamp) }} />
            ) : null}
            <Bubble msg={m} frame={frame} />
          </div>
        ),
      )}
      <AbsoluteFill style={{ backgroundColor: "#0b141a", opacity: dim, pointerEvents: "none" }} />
    </div>
  );
};

export type Banner = { readonly at: number; readonly until: number; readonly title: string; readonly text: string };

/** WhatsApp's app icon, as shown on notifications. */
export const WaAppIcon: React.FC<{ readonly size?: number }> = ({ size = 44 }) => (
  <div style={{ width: size, height: size, borderRadius: size / 4, backgroundColor: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <svg width={size * 0.64} height={size * 0.64} viewBox="0 0 24 24" fill="white">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z" />
    </svg>
  </div>
);

const NotificationBanner: React.FC<{ readonly banner: Banner; readonly frame: number }> = ({ banner, frame }) => {
  const { fps } = useVideoConfig();
  const inP = spring({ frame: frame - banner.at, fps, config: { damping: 15, stiffness: 200, mass: 0.7 } });
  const outP = interpolate(frame, [banner.until - 8, banner.until], [0, 1], { ...clamp, easing: easeInOut });
  if (frame < banner.at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        top: 60,
        padding: "14px 16px",
        borderRadius: 26,
        backgroundColor: "rgba(245,245,247,0.92)",
        backdropFilter: "blur(20px)",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        translate: `0 ${(1 - inP) * -140 - outP * 140}px`,
        opacity: 1 - outP,
        boxShadow: "0 18px 40px -16px rgba(0,0,0,0.5)",
        zIndex: 10,
      }}
    >
      <WaAppIcon />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: "#111" }}>
          <span style={{ fontWeight: 700 }}>{banner.title}</span>
          <span style={{ color: "#8a8a8e", fontSize: 14 }}>sekarang</span>
        </div>
        <div style={{ fontSize: 16, color: "#222", marginTop: 3, lineHeight: 1.3 }}><Bold text={banner.text} /></div>
      </div>
    </div>
  );
};

const LockScreen: React.FC<{ readonly time: string; readonly date: string; readonly children?: React.ReactNode }> = ({ time, date, children }) => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse 90% 60% at 20% 90%, #ff8a4c 0%, transparent 60%), radial-gradient(ellipse 80% 70% at 90% 10%, #8c5cff 0%, transparent 60%), linear-gradient(160deg, #2a1736 0%, #5a2350 50%, #1b1020 100%)",
      color: "white",
      alignItems: "center",
    }}
  >
    <div style={{ marginTop: 200, fontSize: 22, fontWeight: 600, opacity: 0.85 }}>{date}</div>
    <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>{time}</div>
    {children}
  </AbsoluteFill>
);

export type PhoneProps = {
  readonly msgs?: readonly ChatMsg[];
  readonly compose?: readonly Compose[];
  readonly typing?: readonly (readonly [number, number])[];
  readonly recording?: Recording;
  readonly banner?: Banner;
  readonly time: string;
  readonly lock?: { readonly date: string; readonly content?: React.ReactNode };
  /** Who the chat is with (defaults to Sydia). */
  readonly contact?: Contact;
  /** Frame from which the header shows the long-press selection bar; `selectPress` dips its forward icon. */
  readonly select?: number;
  readonly selectPress?: number;
  /** Replaces the chat (header, messages, input) under the status bar, e.g. the chat list. */
  readonly screen?: React.ReactNode;
  /** Drawn on top of the screen, e.g. a bottom sheet. */
  readonly overlay?: React.ReactNode;
  readonly dim?: number;
  /** 0 → 1 scrolls the chat back up to its first message. */
  readonly rewind?: number;
  /** 0 → 1 turns the screen off (sleep). */
  readonly screenOff?: number;
  /** Frame offset so a chat can continue across scenes. */
  readonly frameOffset?: number;
  readonly style?: React.CSSProperties;
};

export const Phone: React.FC<PhoneProps> = ({ msgs = [], compose = [], typing = [], recording, banner, time, lock, contact, select, selectPress = 0, screen, overlay, dim, rewind, screenOff = 0, frameOffset = 0, style }) => {
  const frame = useCurrentFrame() + frameOffset;
  const isTyping = typing.some(([a, b]) => frame >= a && frame < b);
  return (
    <div
      style={{
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 74,
        padding: BEZEL,
        background: "linear-gradient(145deg, #3a3640 0%, #141216 40%, #2a272e 100%)",
        boxShadow:
          "inset 0 0 0 2px rgba(255,255,255,0.08), 0 2px 4px rgba(23,20,25,0.2), 0 60px 120px -40px rgba(23,20,25,0.55), 0 30px 80px -30px rgba(140,92,255,0.35)",
        fontFamily,
        ...style,
      }}
    >
      <div style={{ width: SCREEN_W, height: SCREEN_H, borderRadius: 62, overflow: "hidden", position: "relative", backgroundColor: "white" }}>
        {lock ? (
          <>
            <LockScreen time={time} date={lock.date}>
              {lock.content}
            </LockScreen>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0 }}>
              <StatusBar time="" dark />
            </div>
          </>
        ) : screen ? (
          <>
            <StatusBar time={time} />
            {screen}
          </>
        ) : (
          <>
            <StatusBar time={time} />
            {select !== undefined && frame >= select ? <SelectHeader press={selectPress} /> : <Header typing={isTyping} contact={contact} />}
            <ChatArea msgs={msgs} frame={frame} dim={dim} rewind={rewind} />
            <InputBar compose={compose} recording={recording} frame={frame} />
          </>
        )}
        {overlay}
        {banner ? <NotificationBanner banner={banner} frame={frame} /> : null}
        {screenOff > 0 ? <AbsoluteFill style={{ backgroundColor: "#050307", opacity: screenOff }} /> : null}
      </div>
    </div>
  );
};

export { Waveform };
