import { loadFont as loadArchivo } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";
import { loadFont as loadSpaceMono } from "@remotion/google-fonts/SpaceMono";
import { Easing } from "remotion";

// Type and colours follow the Penpot storyboard "Storyboard - Sibuk seharian" (riso zine: paper grain,
// torn strips, blue ink with a pink misprint, Space Mono for chats and the document).
export const archivo = loadArchivo("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
/** Chats end in 🙏; headless Chrome has no emoji font, so Noto Color Emoji is the fallback (after Space Mono, so digits stay mono). */
const emoji = loadEmoji("normal", { subsets: ["emoji"] }).fontFamily;
export const mono = `${loadSpaceMono("normal", { weights: ["700"], subsets: ["latin"] }).fontFamily}, ${emoji}`;

export const c = {
  ink: "#1c1a22",
  blue: "#285ac8",
  pink: "#ef5a8a",
  white: "#ffffff",
  titleBar: "#e7e1d4",
  phone: "#f7f4ec",
  paper: "#fbf5e2",
  rule: "#9db8e0",
};

export const W = 1080;
export const H = 1920;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
/** Springy pop for things that land on a word. */
export const popSpring = { damping: 12, stiffness: 220, mass: 0.6 };
/** A hard, short slam for the montage words. */
export const slamSpring = { damping: 16, stiffness: 420, mass: 0.5 };

export const heavy = { fontFamily: archivo, fontWeight: 400, color: c.ink, margin: 0, whiteSpace: "pre" } as const;
export const monoText = { fontFamily: mono, fontWeight: 700, color: c.ink, margin: 0, whiteSpace: "pre" } as const;

/** Space Mono's advance width, as a fraction of the font size (for typing and the pen tip). */
export const MONO_ADVANCE = 0.6;
