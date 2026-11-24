import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Haruka } from "../components/Haruka";
import { Band, BandText, Bubble, Riso } from "../components/Paper";
import { clamp, easeIn } from "../theme";
import { len } from "../timeline";

/**
 * S5a–d · Montase: one hard cut every two beats, each a word and the request that caused it. The
 * framing gets tighter on every cut (medium → close-up → closer → extreme close-up) while the counter
 * keeps climbing.
 */
export const Meeting: React.FC = () => (
  <>
    <Haruka steps={[{ pose: "meeting", at: 0 }]} box={{ x: 40, y: 780, w: 1000 }} from={[0, 0]} push={[0, len("meeting"), 1.03]} />
    <Riso at={0} x={64} y={280} size={170} lh={1.05} slam>
      Meeting.
    </Riso>
    <Bubble at={6} x={560} y={520} w={470} h={220} size={36} tilt={6}>
      {"Bisa join\nsekarang?"}
    </Bubble>
  </>
);

export const Email: React.FC = () => (
  <>
    <Haruka steps={[{ pose: "email", at: 0 }]} box={{ x: -150, y: 300, w: 1380 }} from={[0, 0]} push={[0, len("email"), 1.04]} />
    <Bubble at={4} x={30} y={320} w={470} h={290} size={36} pad={[48, 32]} tilt={-6}>
      {"Tolong kirim\ndata Q3\nhari ini ya"}
    </Bubble>
    <Band at={-5} y={1420} h={600}>
      <BandText at={0} x={64} y={1540} size={170}>
        Email.
      </BandText>
    </Band>
  </>
);

export const Revisi: React.FC = () => (
  <>
    <Haruka steps={[{ pose: "revisi", at: 0 }]} box={{ x: -480, y: 560, w: 2060 }} from={[0, 0]} push={[0, len("revisi"), 1.05]} />
    <Riso at={0} x={360} y={270} size={170} lh={1.05} slam>
      Revisi.
    </Riso>
    <Bubble at={4} x={30} y={1380} w={440} h={220} size={36} tilt={-6}>
      {"Slide 4\ndikit ya 🙏"}
    </Bubble>
  </>
);

export const ChatLagi: React.FC = () => (
  <>
    <Haruka steps={[{ pose: "chat", at: 0 }]} box={{ x: -960, y: 330, w: 3000 }} from={[0, 0]} push={[0, len("chat"), 1.06]} />
    <Riso at={0} x={64} y={270} size={150} lh={1.05} slam>
      Chat lagi.
    </Riso>
    <Bubble at={3} x={620} y={560} w={420} h={200} size={40} tilt={6}>
      Halo?? 🙏
    </Bubble>
  </>
);

/** The four requests that swarm her in S5e: where each bubble sits and the frame it lands on. */
const SWARM = [
  { at: 2, x: 24, y: 330, w: 620, h: 230, tilt: -7, text: "10.15 · Meeting\nbisa join sekarang?" },
  { at: 7, x: 400, y: 560, w: 660, h: 230, tilt: 7, text: "11.40 · Email\nKirim data Q3 hari ini ya" },
  { at: 12, x: 0, y: 1330, w: 540, h: 230, tilt: -7, text: "13.20 · Revisi\nslide 4 dikit ya" },
  { at: 17, x: 600, y: 1450, w: 460, h: 230, tilt: 7, text: "14.55 · Chat\nHalo?? 🙏" },
];

/**
 * S5e · Puncak: every request from the day lands at once and closes in on her; she panics in the
 * middle. Counter ×9. The scene (and the music) cut dead into S6's silence.
 */
export const Puncak: React.FC = () => {
  const frame = useCurrentFrame();
  const n = len("puncak");
  // after the last one lands, the bubbles squeeze in toward her and tremble harder until the cut
  const squeeze = interpolate(frame, [24, n], [0, 1], { ...clamp, easing: easeIn });
  return (
    <>
      <Haruka steps={[{ pose: "panic", at: 0 }]} box={{ x: 110, y: 760, w: 860 }} from={[0, 0]} shake={2 + squeeze * 7} push={[0, n, 1.04]} />
      {SWARM.map((b, i) => {
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;
        const jx = Math.sin(frame * (2.1 + i * 0.4) + i) * squeeze * 6;
        const jy = Math.cos(frame * (2.7 + i * 0.3) + i) * squeeze * 5;
        return (
          <div key={b.text} style={{ position: "absolute", inset: 0, translate: `${(540 - cx) * 0.12 * squeeze + jx}px ${(1150 - cy) * 0.1 * squeeze + jy}px` }}>
            <Bubble at={b.at} x={b.x} y={b.y} w={b.w} h={b.h} size={34} tilt={b.tilt}>
              {b.text}
            </Bubble>
          </div>
        );
      })}
    </>
  );
};
