import { loadFont as loadEmoji } from "@remotion/google-fonts/NotoColorEmoji";
import { archivo } from "../sibuk/theme";

// Same riso-zine system as SibukSeharian (the Penpot storyboard "Stroyboard - Planning fallacy" uses the
// same paper grain, torn strips, blue ink with pink misprint, Archivo Black and Space Mono), so the
// type, colours and paper components are shared from src/sibuk.
export { c, clamp, easeIn, easeInOut, easeOut, heavy, monoText, popSpring, slamSpring, MONO_ADVANCE, W, H } from "../sibuk/theme";

/** Archivo Black with the emoji fallback, for "10 menit 👌" (headless Chrome has no emoji font). */
export const heavyEmoji = `${archivo}, ${loadEmoji("normal", { subsets: ["emoji"] }).fontFamily}`;

export const orange = "#f2683a";
export const tape = "#f4dfa0";
export const muted = "#6b665c";
export const rule = "#d9d3c7";
