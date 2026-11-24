import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Haruka } from "../components/Haruka";
import { CORNER, DESK, FULL, Laptop, mix, SENTENCE } from "../components/Laptop";
import { Bubble, Riso } from "../components/Paper";
import { c, clamp, easeInOut, easeOut, heavy, monoText, popSpring } from "../theme";
import { cue } from "../timeline";
import { blink } from "./Hook";

/** S3 beats, in scene frames. */
export const PAGI = {
  rewound: 16, // the rewind has wound back to an empty document at 09.02
  typeFrom: 30,
  typeTo: 84,
  buzz: cue("pagi", "chat") - 4, // the phone buzzes on "ada chat"
  overlay: cue("pagi", "chat") + 28,
};

/** Tape-rewind look for the first frames of S3: torn scan bands slide across and the frame judders. */
const Rewind: React.FC<{ until: number }> = ({ until }) => {
  const frame = useCurrentFrame();
  if (frame >= until) return null;
  const fade = interpolate(frame, [until - 5, until], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: fade }}>
      {[0, 1, 2].map((i) => {
        const y = ((frame * 97 + i * 640) % 2100) - 120;
        return <div key={i} style={{ position: "absolute", left: 0, top: y, width: 1080, height: 26 + i * 14, backgroundColor: i === 1 ? "rgba(40,90,200,0.22)" : "rgba(239,90,138,0.2)", mixBlendMode: "multiply" }} />;
      })}
      <AbsoluteFill style={{ backgroundColor: "rgba(28,26,34,0.05)" }} />
    </AbsoluteFill>
  );
};

/**
 * S3 · Pagi (09.02): rewind to the morning, same framing as S1. The document un-types back to empty,
 * then the first sentence is typed; on "ada chat" the phone buzzes, the laptop shrinks to the desk and
 * Haruka reaches for her phone. Counter ×1, "Sebentar, balas ini dulu."
 */
export const Pagi: React.FC = () => {
  const frame = useCurrentFrame();
  const back = interpolate(frame, [0, PAGI.rewound], [0, 1], { ...clamp, easing: easeInOut });
  const shrink = interpolate(frame, [PAGI.buzz + 2, PAGI.buzz + 18], [0, 1], { ...clamp, easing: easeInOut });
  const box = frame < PAGI.rewound ? mix(CORNER, FULL, back) : mix(FULL, DESK, shrink);
  const chars = frame < PAGI.rewound ? SENTENCE.length * (1 - back) : interpolate(frame, [PAGI.typeFrom, PAGI.typeTo], [0, SENTENCE.length], clamp);
  // the buzz shakes the whole desk for a moment
  const buzz = frame >= PAGI.buzz && frame < PAGI.buzz + 10 ? Math.sin(frame * 5) * 6 : 0;
  const judder = frame < PAGI.rewound ? Math.sin(frame * 7.3) * 10 : 0;
  const cueIn = interpolate(frame, [0, 6], [0, 1], { ...clamp, easing: easeOut });
  return (
    <>
      <AbsoluteFill style={{ translate: `${judder + buzz}px 0px` }}>
        <Laptop box={box} chars={chars} cursorOn={frame < PAGI.typeTo && frame > PAGI.typeFrom ? true : blink(frame)} />
      </AbsoluteFill>
      <p style={{ ...monoText, position: "absolute", left: 64, top: 250, fontSize: 30, lineHeight: 1.25, opacity: cueIn, translate: `${-30 * (1 - cueIn)}px 0px` }}>◀◀ mundur ke pagi</p>
      <Haruka steps={[{ pose: "startled", at: 0 }, { pose: "reading", at: PAGI.buzz + 26 }]} box={{ x: 400, y: 660, w: 700 }} anchor="reading" enter={PAGI.buzz + 4} from={[520, 760]} />
      <Bubble at={PAGI.buzz + 12} x={30} y={1080} w={470} h={220} size={30} tilt={-6}>
        {"Pagi! Udah lihat\ngrup belum? 🙏"}
      </Bubble>
      <Riso at={PAGI.overlay} x={64} y={320} size={96}>
        {"“Sebentar,\nbalas ini dulu.”"}
      </Riso>
      <Rewind until={PAGI.rewound + 2} />
    </>
  );
};

/** S4 beats, in scene frames. */
export const CEK = { message: 6, peek: 12, typing: 34, sent: 50, dinaTyping: 64, overlay: 72 };

/** Dina's chat on the phone: her ask lands, Haruka's "Oke, bentar ya" goes out, and Dina is already typing again. */
const Chat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 18, stiffness: 150, mass: 0.7 } });
  const msg = spring({ frame: frame - CEK.message, fps, config: popSpring });
  const sent = spring({ frame: frame - CEK.sent, fps, config: popSpring });
  const dots = ".".repeat(1 + (Math.floor(frame / 8) % 3));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, translate: `0px ${(1 - rise) * 500}px`, opacity: Math.min(1, rise * 2) }}>
      <div style={{ position: "absolute", left: 150, top: 300, width: 780, height: 1100, borderRadius: 90, backgroundColor: c.ink }} />
      <div style={{ position: "absolute", left: 174, top: 324, width: 732, height: 1052, borderRadius: 70, backgroundColor: c.phone }} />
      <div style={{ position: "absolute", left: 460, top: 346, width: 160, height: 34, borderRadius: 17, backgroundColor: c.ink }} />
      <p style={{ ...heavy, position: "absolute", left: 230, top: 430, fontSize: 40, lineHeight: 1.05 }}>Dina · kantor</p>
      <div style={{ position: "absolute", left: 210, top: 510, width: 660, height: 3, backgroundColor: "rgba(28,26,34,0.12)" }} />
      {frame >= CEK.message ? (
        <div style={{ position: "absolute", left: 210, top: 570, width: 560, height: 190, borderRadius: 34, border: `4px solid ${c.ink}`, backgroundColor: c.white, boxSizing: "border-box", opacity: Math.min(1, msg * 3), scale: String(0.6 + 0.4 * msg), transformOrigin: "0% 100%" }}>
          <p style={{ ...monoText, position: "absolute", left: 32, top: 26, fontSize: 38, lineHeight: 1.25 }}>{"Bisa bantu cek\nsebentar? 🙏"}</p>
        </div>
      ) : null}
      {frame >= CEK.sent ? (
        <div style={{ position: "absolute", left: 430, top: 800, width: 440, height: 110, borderRadius: 34, backgroundColor: c.blue, opacity: Math.min(1, sent * 3), scale: String(0.6 + 0.4 * sent), transformOrigin: "100% 100%" }}>
          <p style={{ ...monoText, position: "absolute", left: 36, top: 30, fontSize: 34, lineHeight: 1.25, color: c.white }}>Oke, bentar ya</p>
        </div>
      ) : null}
      {frame >= CEK.dinaTyping ? <p style={{ ...monoText, position: "absolute", left: 210, top: 960, fontSize: 28, lineHeight: 1.25, opacity: 0.5 }}>{`mengetik${dots}`}</p> : null}
    </div>
  );
};

/**
 * S4 · Diminta cek (09.31): back at the document, a chat lands: "Bisa bantu cek sebentar?". The chat
 * fills the frame; Haruka only peeks in, weighs it, and replies. Counter ×2, "Cuma sebentar, kok."
 */
export const Cek: React.FC = () => (
  <>
    <Chat />
    <Haruka steps={[{ pose: "weighing", at: 0 }, { pose: "replying", at: CEK.typing }]} box={{ x: 680, y: 1080, w: 520 }} enter={CEK.peek} from={[360, 300]} />
    <Riso at={CEK.overlay} x={56} y={1420} size={92}>
      {"“Cuma\nsebentar, kok.”"}
    </Riso>
  </>
);
