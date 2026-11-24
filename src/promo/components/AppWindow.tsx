import type React from "react";
import { colors, fontFamily } from "../theme";
import { Icon, type IconName, SydiaMark } from "./Icons";

const nav: { icon: IconName; label: string }[] = [
  { icon: "chat", label: "Chat baru" },
  { icon: "calendar", label: "Kalender" },
  { icon: "notes", label: "Catatan" },
  { icon: "file", label: "File" },
  { icon: "more", label: "Lainnya" },
];

/** A faithful, simplified recreation of the Sydia web app shell. */
export const AppWindow: React.FC<{
  readonly width: number;
  readonly height: number;
  readonly active?: string;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}> = ({ width, height, active = "Chat baru", children, style }) => (
  <div
    style={{
      width,
      height,
      borderRadius: 28,
      overflow: "hidden",
      backgroundColor: colors.surface,
      boxShadow:
        "rgba(23,20,25,0.06) 0 2px 4px, rgba(23,20,25,0.18) 0 50px 110px -30px, rgba(140,92,255,0.18) 0 30px 80px -40px",
      border: "1px solid rgba(23,20,25,0.06)",
      display: "flex",
      flexDirection: "column",
      fontFamily,
      color: colors.ink,
      ...style,
    }}
  >
    <div
      style={{
        height: 44,
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "0 20px",
        backgroundColor: "#f6f2ee",
        borderBottom: "1px solid rgba(23,20,25,0.06)",
      }}
    >
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <div key={c} style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: c }} />
      ))}
      <div
        style={{
          marginLeft: 24,
          padding: "5px 18px",
          borderRadius: 999,
          backgroundColor: "white",
          fontSize: 15,
          color: colors.muted,
        }}
      >
        sydia · Asisten pribadi
      </div>
    </div>
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      <div
        style={{
          width: 250,
          borderRight: "1px solid rgba(23,20,25,0.07)",
          padding: "22px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px 18px" }}>
          <SydiaMark size={28} />
          <span style={{ fontWeight: 700, fontSize: 21 }}>Sydia</span>
        </div>
        {nav.map((n) => (
          <div
            key={n.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 12px",
              borderRadius: 12,
              fontSize: 18,
              fontWeight: n.label === active ? 600 : 500,
              backgroundColor: n.label === active ? "#f1edea" : "transparent",
              color: n.label === active ? colors.ink : "#4a444f",
            }}
          >
            <Icon name={n.icon} size={19} />
            {n.label}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 8px" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#fde7ef",
              color: colors.brand,
              fontWeight: 700,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            DU
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Demo User</div>
            <div style={{ fontSize: 13, color: colors.muted }}>Trial gratis</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", minWidth: 0 }}>{children}</div>
    </div>
  </div>
);

/** Rounded composer bar from the chat screen. */
export const Composer: React.FC<{
  readonly text: string;
  readonly caret: boolean;
  readonly sendPulse: number;
}> = ({ text, caret, sendPulse }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      height: 70,
      padding: "0 14px 0 24px",
      borderRadius: 999,
      backgroundColor: "#f1efef",
      border: "1px solid rgba(23,20,25,0.07)",
      fontSize: 21,
    }}
  >
    <Icon name="clip" size={22} color={colors.muted} />
    <div style={{ flex: 1, color: text ? colors.ink : colors.muted, whiteSpace: "nowrap", overflow: "hidden" }}>
      {text || "Tulis pesan atau lampirkan file..."}
      {caret ? (
        <span style={{ display: "inline-block", width: 2, height: 24, marginLeft: 2, verticalAlign: "-4px", backgroundColor: colors.brand }} />
      ) : null}
    </div>
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: text ? "linear-gradient(135deg, #ffb27a 0%, #f06694 45%, #8c5cff 100%)" : "#dcc9d2",
        scale: String(1 - sendPulse * 0.2),
      }}
    >
      <Icon name="send" size={22} color="white" />
    </div>
  </div>
);
