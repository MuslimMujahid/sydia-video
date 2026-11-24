import type React from "react";
import { c, monoText, heavy } from "../theme";

/** Where the laptop screen sits and how big its content is drawn (`k` = 1 is the S1 full-bleed close-up). */
export type Box = { x: number; y: number; w: number; h: number; r: number; k: number; base: number };

/** The storyboard's four framings of the same screen. `base` fades the laptop's base bar in (wide shots). */
export const FULL: Box = { x: -30, y: 700, w: 1140, h: 1400, r: 36, k: 1, base: 0 };
export const CORNER: Box = { x: -80, y: 1430, w: 620, h: 560, r: 28, k: 0.53, base: 0 };
export const DESK: Box = { x: 70, y: 640, w: 440, h: 273, r: 11, k: 0.27, base: 1 };
export const WIDE: Box = { x: 110, y: 1385, w: 380, h: 236, r: 10, k: 0.235, base: 1 };

export const mix = (a: Box, b: Box, t: number): Box => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
  r: a.r + (b.r - a.r) * t,
  k: a.k + (b.k - a.k) * t,
  base: a.base + (b.base - a.base) * t,
});

export const SENTENCE = "Tahun ini, tim kami ingin";

/**
 * Proposal.docx on the laptop: a title, the one sentence typed so far and a blinking blue cursor
 * over empty ruled lines. `chars` is how much of the sentence is typed.
 */
export const Laptop: React.FC<{ box: Box; chars: number; cursorOn: boolean; filename?: boolean }> = ({ box: b, chars, cursorOn, filename = b.k > 0.8 }) => {
  const k = b.k;
  const typed = SENTENCE.slice(0, Math.max(0, Math.round(chars)));
  const stroke = Math.max(4, 12 * k);
  return (
    <div style={{ position: "absolute", left: 0, top: 0 }}>
      <div style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: b.r, border: `${stroke}px solid ${c.ink}`, backgroundColor: c.white, overflow: "hidden", boxSizing: "border-box" }}>
        <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 84 * k + 2, backgroundColor: c.titleBar }} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: "absolute", left: 88 * k + i * 42 * k, top: 30 * k, width: 24 * k, height: 24 * k, borderRadius: "50%", backgroundColor: i === 0 ? c.pink : "rgba(28,26,34,0.25)" }} />
        ))}
        {filename ? <p style={{ ...monoText, position: "absolute", left: 0, right: 0, top: 22 * k, textAlign: "center", fontSize: 30 * k, lineHeight: 1.25 }}>Proposal.docx</p> : null}
        <p style={{ ...heavy, position: "absolute", left: 108 * k, top: 158 * k, fontSize: 120 * k, lineHeight: 1.05 }}>Proposal</p>
        <p style={{ ...monoText, position: "absolute", left: 108 * k, top: 328 * k, fontSize: 50 * k, lineHeight: 1.25 }}>
          {typed}
          <span style={{ display: "inline-block", width: 12 * k, height: 70 * k, marginLeft: -2 * k, verticalAlign: -12 * k, backgroundColor: c.blue, opacity: cursorOn ? 1 : 0 }} />
        </p>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ position: "absolute", left: 108 * k, top: 458 * k + i * 84 * k, width: 900 * k, height: Math.max(2, 5 * k), backgroundColor: "rgba(28,26,34,0.08)" }} />
        ))}
      </div>
      {b.base > 0 ? <div style={{ position: "absolute", left: b.x - 30 * (b.w / 440), top: b.y + b.h, width: b.w + 60 * (b.w / 440), height: 18 * (b.w / 440), borderRadius: 7, backgroundColor: c.ink, opacity: b.base }} /> : null}
    </div>
  );
};
