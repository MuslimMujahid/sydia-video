import { loadFont as loadKalam } from "@remotion/google-fonts/Kalam";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { Easing } from "remotion";

// Type and colours follow the Penpot storyboard "Content Boards" (TOFU · Haruka).
export const nunito = loadNunito("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin"] }).fontFamily;
export const kalam = loadKalam("normal", { weights: ["700"], subsets: ["latin"] }).fontFamily;

export const c = {
  canvas: "#fbf8f5",
  ink: "#171419",
  muted: "#6b6470",
  pink: "#ef5a8a",
  violet: "#8c5cff",
  orange: "#ff8a4c",
  peach: "#ffb27a",
  lilac: "#c47bff",
  green: "#10b981",
  red: "#f43f5e",
  spot: "#ffe7a3",
  road: "#e8e1da",
  splitPink: "rgba(253,228,236,0.85)",
  splitLilac: "rgba(238,230,255,0.85)",
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
/** Springy pop for things that appear on a word. */
export const popSpring = { damping: 12, stiffness: 210, mass: 0.6 };

/** Frames every scene uses to clear its content before the cut. */
export const OUT = 8;

/** Headline / label base style. */
export const heavy = { fontFamily: nunito, fontWeight: 900, color: c.ink, margin: 0 } as const;
export const hand = { fontFamily: kalam, fontWeight: 700, margin: 0 } as const;
