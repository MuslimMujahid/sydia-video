import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { easeOut, fontFamily } from "../../promo/theme";
import { SCREEN_H, SCREEN_W, SydiaAvatar, wa, WaAppIcon } from "../../showcase/components/Phone";
import { clamp, Ic } from "../../showcase/ui";
import { CUSTOMERS, type Customer, type CustomerKey, PREVIEW } from "../data";

// ------------------------------------------------------------------ bits
export const Avatar: React.FC<{ readonly c: Customer; readonly size?: number }> = ({ c, size = 46 }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.bg, color: c.color, fontSize: size * 0.36, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.initials}</div>
);

export type TapAt = { readonly at: number; readonly x: number; readonly y: number; readonly hold?: number };

/** Fingertip touches in screen coordinates: a soft dot lands, presses, and leaves a ripple. `hold` keeps it down for a long-press. */
export const Taps: React.FC<{ readonly taps: readonly TapAt[] }> = ({ taps }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {taps.map((t) => {
        const hold = t.hold ?? 0;
        if (frame < t.at - 10 || frame > t.at + hold + 16) return null;
        const inP = interpolate(frame, [t.at - 10, t.at], [0, 1], { ...clamp, easing: easeOut });
        const out = interpolate(frame, [t.at + hold + 2, t.at + hold + 10], [0, 1], clamp);
        const ripple = interpolate(frame, [t.at, t.at + 14], [0, 1], clamp);
        const charge = hold > 0 ? interpolate(frame, [t.at, t.at + hold], [0, 1], clamp) : 0;
        return (
          <div key={t.at} style={{ position: "absolute", left: t.x, top: t.y, width: 0, height: 0, zIndex: 40 }}>
            <div style={{ position: "absolute", left: -36, top: -36, width: 72, height: 72, borderRadius: 36, border: "3px solid rgba(255,255,255,0.9)", boxShadow: "0 0 0 2px rgba(23,20,25,0.15)", opacity: ripple > 0 && ripple < 1 ? 1 - ripple : 0, scale: String(0.4 + ripple * 0.9) }} />
            {hold > 0 ? <div style={{ position: "absolute", left: -40, top: -40, width: 80, height: 80, borderRadius: 40, border: "4px solid rgba(0,168,132,0.7)", opacity: charge * (1 - out), scale: String(0.6 + charge * 0.5) }} /> : null}
            <div style={{ position: "absolute", left: -24, top: -24, width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.55)", border: "2px solid rgba(255,255,255,0.95)", boxShadow: "0 6px 16px rgba(23,20,25,0.3)", opacity: inP * (1 - out), scale: String(1.3 - inP * 0.3 - (frame >= t.at ? 0.12 : 0)) }} />
          </div>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ lock screen
/** WhatsApp notifications stacking up under the lock-screen clock, newest on top. */
export const LockStack: React.FC<{ readonly notes: readonly { readonly who: CustomerKey; readonly at: number }[]; readonly moreAt: number }> = ({ notes, moreAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const CARD = 76;
  const shown = notes.filter((n) => frame >= n.at);
  const more = spring({ frame: frame - moreAt, fps, config: { damping: 16, stiffness: 200, mass: 0.6 } });
  return (
    <div style={{ position: "relative", width: SCREEN_W - 28, height: 560, marginTop: 26, fontFamily }}>
      {shown.map((n, i) => {
        const p = spring({ frame: frame - n.at, fps, config: { damping: 15, stiffness: 210, mass: 0.6 } });
        // Newest on top: every later card pushes this one down.
        const below = shown.slice(i + 1).reduce((acc, m) => acc + interpolate(frame, [m.at, m.at + 8], [0, 1], { ...clamp, easing: easeOut }), 0);
        const c = CUSTOMERS[n.who];
        return (
          <div
            key={n.who}
            style={{ position: "absolute", left: 0, right: 0, top: below * (CARD + 8), height: CARD, padding: "12px 14px", borderRadius: 24, backgroundColor: "rgba(245,245,247,0.9)", backdropFilter: "blur(20px)", display: "flex", gap: 12, alignItems: "center", boxShadow: "0 14px 30px -16px rgba(0,0,0,0.5)", opacity: Math.min(1, p * 1.3), scale: String(0.85 + p * 0.15), translate: `0 ${(1 - p) * -30}px` }}
          >
            <WaAppIcon size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, color: "#111" }}>
                <span style={{ fontWeight: 700 }}>{c.name}</span>
                <span style={{ color: "#8a8a8e", fontSize: 13 }}>sekarang</span>
              </div>
              <div style={{ fontSize: 15, color: "#333", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{PREVIEW[n.who]}</div>
            </div>
          </div>
        );
      })}
      {frame >= moreAt ? (
        <div style={{ position: "absolute", left: "50%", top: notes.length * (CARD + 8) + 6, translate: "-50% 0", padding: "8px 18px", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.22)", backdropFilter: "blur(20px)", color: "white", fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", opacity: more, scale: String(0.8 + more * 0.2) }}>
          +7 notifikasi lainnya
        </div>
      ) : null}
    </div>
  );
};

// ------------------------------------------------------------------ chat list
export const LIST_TOP = 236; // screen y of the first chat row
export const ROW_H = 82;

type ListRow = { readonly key: string; readonly at: number; readonly name: string; readonly avatar: React.ReactNode; readonly preview: string; readonly time: string; readonly unread?: number; readonly muted?: boolean };

/** WhatsApp's chat list. Rows with `at` > 0 arrive at the top and push the others down. `tapped` tints a row. */
export const ChatList: React.FC<{ readonly arrivals: readonly { readonly who: CustomerKey; readonly at: number; readonly unread: number; readonly time: string }[]; readonly tapped?: { readonly key: string; readonly at: number } }> = ({ arrivals, tapped }) => {
  const frame = useCurrentFrame();
  const rows: ListRow[] = [
    ...[...arrivals].reverse().map((a) => ({ key: a.who, at: a.at, name: CUSTOMERS[a.who].name, avatar: <Avatar c={CUSTOMERS[a.who]} size={54} />, preview: PREVIEW[a.who], time: a.time, unread: a.unread })),
    { key: "sydia", at: -1, name: "Sydia", avatar: <SydiaAvatar size={54} />, preview: "Selamat pagi, Kak Sari! Ada 2 pengingat…", time: "05.30" },
    { key: "ibu", at: -1, name: "Ibu", avatar: <Avatar c={{ name: "Ibu", initials: "I", color: "#be185d", bg: "#fde2ee" }} size={54} />, preview: "Jangan lupa sarapan ya nak", time: "Kemarin" },
    { key: "arisan", at: -1, name: "Arisan RT 05", avatar: <Avatar c={{ name: "Arisan", initials: "AR", color: "#0f766e", bg: "#d4f3ee" }} size={54} />, preview: "Bu Wati: Minggu ini di rumah saya…", time: "Kemarin", unread: 12, muted: true },
  ];
  let y = LIST_TOP - 54;
  const tint = tapped ? interpolate(frame, [tapped.at - 2, tapped.at + 2], [0, 1], clamp) : 0;
  return (
    <div style={{ position: "relative", height: SCREEN_H - 54, backgroundColor: "white", fontFamily, overflow: "hidden" }}>
      <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 20px", gap: 22 }}>
        <div style={{ flex: 1, fontSize: 28, fontWeight: 700, color: wa.green, letterSpacing: "-0.02em" }}>WhatsApp</div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={wa.ink} strokeWidth="2" strokeLinejoin="round">
          <path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        <svg width="6" height="22" viewBox="0 0 6 22" fill={wa.ink}>
          <circle cx="3" cy="3" r="2.2" />
          <circle cx="3" cy="11" r="2.2" />
          <circle cx="3" cy="19" r="2.2" />
        </svg>
      </div>
      <div style={{ margin: "8px 16px", height: 48, borderRadius: 24, backgroundColor: "#f0f2f5", display: "flex", alignItems: "center", gap: 12, padding: "0 18px", fontSize: 17, color: wa.meta }}>
        <Ic name="search" size={20} color={wa.meta} />
        Cari
      </div>
      <div style={{ display: "flex", gap: 8, padding: "6px 16px 0" }}>
        {[
          ["Semua", true],
          [`Belum dibaca ${Math.max(2, arrivals.filter((a) => frame >= a.at).length + 2)}`, false],
          ["Grup", false],
        ].map(([l, on]) => (
          <span key={String(l)} style={{ padding: "7px 14px", borderRadius: 999, fontSize: 15, fontWeight: 600, backgroundColor: on ? "#d8fdd2" : "#f0f2f5", color: on ? "#15603e" : wa.meta }}>
            {l}
          </span>
        ))}
      </div>
      {rows.map((r) => {
        const grow = r.at < 0 ? 1 : interpolate(frame, [r.at, r.at + 10], [0, 1], { ...clamp, easing: easeOut });
        if (r.at >= 0 && frame < r.at) return null;
        const top = y;
        y += ROW_H * grow;
        const flash = r.at < 0 ? 0 : interpolate(frame, [r.at, r.at + 4, r.at + 30], [0, 1, 0], clamp);
        const tap = tapped?.key === r.key ? tint : 0;
        return (
          <div key={r.key} style={{ position: "absolute", left: 0, right: 0, top, height: ROW_H, display: "flex", alignItems: "center", gap: 14, padding: "0 18px", opacity: grow, backgroundColor: tap > 0 ? `rgba(11,20,26,${tap * 0.08})` : flash > 0 ? `rgba(37,211,102,${flash * 0.12})` : "transparent" }}>
            {r.avatar}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 19, fontWeight: 600, color: wa.ink }}>{r.name}</span>
                <span style={{ fontSize: 13, fontWeight: r.unread && !r.muted ? 700 : 400, color: r.unread && !r.muted ? wa.green : wa.meta }}>{r.time}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <span style={{ flex: 1, fontSize: 16, color: wa.meta, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.preview}</span>
                {r.unread ? <span style={{ minWidth: 24, height: 24, padding: "0 7px", borderRadius: 12, backgroundColor: r.muted ? "#b8c2c8" : "#25d366", color: "white", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{r.unread}</span> : null}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 78, borderTop: "1px solid rgba(11,20,26,0.07)", backgroundColor: "white", display: "flex", justifyContent: "space-around", alignItems: "center", fontSize: 13, fontWeight: 600, color: wa.ink }}>
        {["Chat", "Pembaruan", "Komunitas", "Panggilan"].map((l, i) => (
          <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 56, height: 30, borderRadius: 15, backgroundColor: i === 0 ? "#d8fdd2" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic name={i === 0 ? "list" : i === 1 ? "sun" : i === 2 ? "grid" : "phone"} size={20} color={wa.ink} />
            </div>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ forward sheet
export const SHEET_TOP = 170;
export const SHEET_ROW = 76;
export const SHEET_FIRST = SHEET_TOP + 60 + 56 + 36; // screen y of the first contact row

/** "Teruskan ke…": slides up at `at`, Sydia gets ticked at `pick`, and the send bar rises with it. */
export const ForwardSheet: React.FC<{ readonly at: number; readonly pick: number; readonly send: number; readonly until: number }> = ({ at, pick, send, until }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at || frame >= until) return null;
  const p = spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 170, mass: 0.7 } });
  const picked = spring({ frame: frame - pick, fps, config: { damping: 12, stiffness: 260, mass: 0.5 } });
  const bar = spring({ frame: frame - pick - 2, fps, config: { damping: 16, stiffness: 200, mass: 0.6 } });
  const press = interpolate(frame, [send - 2, send, send + 6], [0, 1, 0], clamp);
  const rows: { key: string; name: string; sub: string; avatar: React.ReactNode }[] = [
    { key: "sydia", name: "Sydia", sub: "Asisten pribadi", avatar: <SydiaAvatar size={50} /> },
    ...(["dedi", "lia", "yusuf", "tini"] as const).map((k) => ({ key: k, name: CUSTOMERS[k].name, sub: "Pelanggan", avatar: <Avatar c={CUSTOMERS[k]} size={50} /> })),
  ];
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#0b141a", opacity: p * 0.35, zIndex: 20 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: SHEET_TOP, bottom: 0, borderRadius: "26px 26px 0 0", backgroundColor: "white", translate: `0 ${(1 - p) * 110}%`, zIndex: 21, fontFamily, overflow: "hidden" }}>
        <div style={{ height: 60, display: "flex", alignItems: "center", gap: 16, padding: "0 20px", fontSize: 21, fontWeight: 700, color: wa.ink }}>
          <span style={{ fontSize: 22, color: wa.meta }}>✕</span>
          Teruskan ke…
        </div>
        <div style={{ margin: "0 16px", height: 46, borderRadius: 23, backgroundColor: "#f0f2f5", display: "flex", alignItems: "center", gap: 12, padding: "0 16px", fontSize: 16, color: wa.meta }}>
          <Ic name="search" size={18} color={wa.meta} />
          Cari nama atau nomor
        </div>
        <div style={{ height: 36, display: "flex", alignItems: "flex-end", padding: "0 20px 6px", fontSize: 14, fontWeight: 600, color: wa.meta }}>Chat terbaru</div>
        {rows.map((r, i) => {
          const on = i === 0 && frame >= pick;
          return (
            <div key={r.key} style={{ height: SHEET_ROW, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", backgroundColor: on ? `rgba(0,168,132,${0.08 * Math.min(1, picked)})` : "transparent" }}>
              <div style={{ position: "relative" }}>
                {r.avatar}
                {on ? (
                  <div style={{ position: "absolute", right: -4, bottom: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: wa.green, border: "2.5px solid white", display: "flex", alignItems: "center", justifyContent: "center", scale: String(picked) }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  </div>
                ) : null}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: wa.ink }}>{r.name}</div>
                <div style={{ fontSize: 14, color: wa.meta, marginTop: 2 }}>{r.sub}</div>
              </div>
            </div>
          );
        })}
        {frame >= pick ? (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 92, backgroundColor: "#f0f2f5", display: "flex", alignItems: "center", padding: "0 22px", translate: `0 ${(1 - bar) * 100}%` }}>
            <span style={{ flex: 1, fontSize: 17, color: wa.ink }}>Sydia</span>
            <div style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: wa.green, display: "flex", alignItems: "center", justifyContent: "center", scale: String(1 - press * 0.15) }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
              </svg>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};
/** Screen y of the sheet's send button centre. */
export const SHEET_SEND = { x: SCREEN_W - 22 - 29, y: SCREEN_H - 46 };
