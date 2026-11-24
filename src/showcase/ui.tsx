import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AppWindow } from "../promo/components/AppWindow";
import { Grain, SoftCanvas } from "../promo/components/Backgrounds";
import { colors, easeInOut, easeOut, fontFamily, textGradient } from "../promo/theme";

export const BEAT = 12;
export const BAR = 48;

export const gradientBg =
  "linear-gradient(135deg, #ffb27a 0%, #f06694 45%, #8c5cff 100%)";

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** 0 → 1 spring that starts at `delay` frames. */
export const usePop = (delay = 0, damping = 14, stiffness = 220) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 0.6 } });
};

// ---------------------------------------------------------------- icons
const extra = {
  plus: <path d="M5 12h14M12 5v14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  sort: <path d="m3 16 4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  checklist: <path d="m3 7 2 2 4-4M3 17l2 2 4-4M13 6h8M13 12h8M13 18h8" />,
  grid: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 12h18M12 3v18" />
    </>
  ),
  folder: <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />,
  upload: <path d="M12 3v12M7 8l5-5 5 5M5 21h14" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
    </>
  ),
  play: <path d="M6 4v16l14-8Z" />,
  download: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </>
  ),
  bold: <path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" />,
  italic: <path d="M19 4h-9M14 20H5M15 4 9 20" />,
  underline: <path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16" />,
  bullets: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  video: <path d="m22 8-6 4 6 4V8ZM2 6h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
  sparkle: <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9ZM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  tick2: <path d="m2 12 5 5L18 6M12 17l1 1L23 6" />,
  pdf: (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </>
  ),
} as const;

export type ExtraIcon = keyof typeof extra;

export const Ic: React.FC<{
  readonly name: ExtraIcon;
  readonly size?: number;
  readonly color?: string;
  readonly strokeWidth?: number;
  readonly fill?: string;
}> = ({ name, size = 22, color = "currentColor", strokeWidth = 2, fill = "none" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}
  >
    {extra[name]}
  </svg>
);

// ---------------------------------------------------------------- pointer
type PointerKey = { readonly at: number; readonly x: number; readonly y: number };

/** Mouse pointer that glides through keyframes and ripples on click frames. */
export const Pointer: React.FC<{
  readonly keys: readonly PointerKey[];
  readonly clicks?: readonly number[];
  readonly grabbing?: boolean;
}> = ({ keys, clicks = [] }) => {
  const frame = useCurrentFrame();
  const xs = keys.map((k) => k.x);
  const ys = keys.map((k) => k.y);
  const ats = keys.map((k) => k.at);
  const x = interpolate(frame, ats, xs, { ...clamp, easing: easeInOut });
  const y = interpolate(frame, ats, ys, { ...clamp, easing: easeInOut });
  const visible = interpolate(frame, [ats[0] - 4, ats[0]], [0, 1], clamp);
  const press = Math.max(
    0,
    ...clicks.map((c) => interpolate(frame, [c - 2, c, c + 5], [0, 1, 0], clamp)),
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, translate: `${x}px ${y}px`, opacity: visible, zIndex: 50 }}>
      {clicks.map((c) => {
        const p = interpolate(frame, [c, c + 14], [0, 1], clamp);
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: -34,
              top: -34,
              width: 68,
              height: 68,
              borderRadius: 34,
              border: `4px solid ${colors.brand}`,
              opacity: p > 0 && p < 1 ? 1 - p : 0,
              scale: String(0.3 + p * 1.1),
            }}
          />
        );
      })}
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        style={{ scale: String(1 - press * 0.18), transformOrigin: "3px 2px", filter: "drop-shadow(0 6px 10px rgba(23,20,25,0.35))" }}
      >
        <path d="M4 2.5 20 11l-7 1.8-3 7Z" fill="#171419" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------- shared bits
export const Pill: React.FC<{
  readonly children: React.ReactNode;
  readonly bg: string;
  readonly color: string;
  readonly size?: number;
}> = ({ children, bg, color, size = 17 }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "5px 14px",
      borderRadius: 999,
      backgroundColor: bg,
      color,
      fontSize: size,
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

export const GradientButton: React.FC<{
  readonly label: string;
  readonly icon?: ExtraIcon;
  readonly pulse?: number;
}> = ({ label, icon, pulse = 0 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 54,
      padding: "0 28px",
      borderRadius: 18,
      background: "radial-gradient(ellipse 90% 70% at 12% 88%, #ff8a4c 0%, transparent 55%), radial-gradient(ellipse 70% 80% at 88% 12%, #c47bff 0%, transparent 55%), linear-gradient(135deg, #ffb27a 0%, #f06694 45%, #8c5cff 100%)",
      color: "white",
      fontWeight: 700,
      fontSize: 20,
      boxShadow: `rgba(240,102,148,${0.28 + pulse * 0.3}) 0 10px 24px -10px, rgba(140,92,255,0.22) 0 6px 18px -8px`,
      scale: String(1 - pulse * 0.07),
    }}
  >
    {icon ? <Ic name={icon} size={20} strokeWidth={2.4} /> : null}
    {label}
  </div>
);

/** Window + headline staging shared by all web feature scenes. */
export const FeatureFrame: React.FC<{
  readonly title: string;
  readonly accent: string;
  readonly sub: string;
  readonly active: string;
  readonly children: React.ReactNode;
  readonly overlay?: React.ReactNode;
  readonly titleTilt?: number;
}> = ({ title, accent, sub, active, children, overlay, titleTilt = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 140, mass: 0.9 } });
  const push = interpolate(frame, [0, durationInFrames], [1, 1.035], { ...clamp });
  const words = title.split(" ");
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <SoftCanvas glow={0.6} />
      <div style={{ position: "absolute", left: 140, top: 44, display: "flex", alignItems: "baseline", gap: 26, overflow: "visible" }}>
        <div style={{ display: "flex", gap: 22 }}>
          {words.map((w, i) => {
            const p = spring({ frame: frame - 4 - i * 3, fps, config: { damping: 15, stiffness: 240, mass: 0.5 } });
            return (
              <span
                key={w}
                style={{
                  fontSize: 92,
                  fontWeight: 800,
                  letterSpacing: "-0.05em",
                  color: colors.ink,
                  translate: `0 ${(1 - p) * 70}px`,
                  rotate: `${(1 - p) * titleTilt}deg`,
                  opacity: p,
                  display: "inline-block",
                }}
              >
                {w}
              </span>
            );
          })}
          <span
            style={{
              fontSize: 92,
              fontWeight: 800,
              letterSpacing: "-0.05em",
              backgroundImage: textGradient,
              WebkitBackgroundClip: "text",
              color: "transparent",
              display: "inline-block",
              translate: `0 ${(1 - spring({ frame: frame - 4 - words.length * 3, fps, config: { damping: 15, stiffness: 240, mass: 0.5 } })) * 70}px`,
              opacity: spring({ frame: frame - 4 - words.length * 3, fps, config: { damping: 15, stiffness: 240, mass: 0.5 } }),
            }}
          >
            {accent}
          </span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 140,
          top: 82,
          fontSize: 32,
          fontWeight: 500,
          color: colors.muted,
          textAlign: "right",
          opacity: interpolate(frame, [14, 28], [0, 1], clamp),
          translate: `${interpolate(frame, [14, 28], [30, 0], { ...clamp, easing: easeOut })}px 0`,
        }}
      >
        {sub}
      </div>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 178,
          translate: `0 ${(1 - enter) * 160}px`,
          scale: String(push),
          transformOrigin: "50% 30%",
          opacity: interpolate(frame, [0, 8], [0, 1], clamp),
        }}
      >
        <div style={{ position: "relative" }}>
          <AppWindow width={1640} height={870} active={active}>
            {children}
          </AppWindow>
          {overlay}
        </div>
      </div>
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};

export const stagger = (frame: number, start: number, i: number, step = 4) =>
  interpolate(frame, [start + i * step, start + i * step + 14], [0, 1], { ...clamp, easing: easeOut });
