import { loadFont } from "@remotion/google-fonts/Inter";
import { Easing } from "remotion";

// Sydia's "Aurora Haze" design system (see ~/projects/sydia/DESIGN.md).
export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const colors = {
  ink: "#171419",
  muted: "#6b6470",
  brand: "#ef5a8a",
  canvas: "#fbf8f5",
  surface: "#ffffff",
  orange: "#ff8a4c",
  peach: "#ffb27a",
  pink: "#f06694",
  violet: "#8c5cff",
  lilac: "#c47bff",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
};

export const auroraGradient =
  "radial-gradient(ellipse 90% 70% at 12% 88%, #ff8a4c 0%, transparent 55%), radial-gradient(ellipse 70% 80% at 88% 12%, #c47bff 0%, transparent 55%), radial-gradient(ellipse 50% 60% at 55% 50%, #ff6b9b 0%, transparent 60%), linear-gradient(135deg, #ffb27a 0%, #f06694 45%, #8c5cff 100%)";

export const textGradient =
  "linear-gradient(100deg, #ff8a4c 0%, #f06694 45%, #8c5cff 100%)";

export const cardShadow =
  "rgba(23,20,25,0.04) 0 1px 2px, rgba(23,20,25,0.10) 0 30px 70px -24px";

// The track runs at 150 BPM: one beat lasts 0.4 s (12 frames at 30 fps).
export const BEAT_SECONDS = 0.4;

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const snappy = { damping: 13, stiffness: 220, mass: 0.6 };
