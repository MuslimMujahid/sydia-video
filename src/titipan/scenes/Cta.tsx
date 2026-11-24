import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Haruka } from "../components/Haruka";
import { Rise } from "../components/Stage";
import { c, clamp, heavy } from "../theme";
import { cue, len } from "../timeline";

/** The ↓ bounces twice toward the comment section, then rests. */
const Arrow: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame - at, [0, 8, 16, 24, 32], [0, 12, 0, 12, 0], clamp);
  return <span style={{ display: "inline-block", translate: `0px ${y}px` }}>↓</span>;
};

/**
 * S9 · CTA. The question lands big, Haruka rises pointing at the viewer, and on "Tulis di
 * komentar" she switches to a wink and thumbs-up while the prompt and its arrow point down to the comments.
 */
export const Cta: React.FC = () => {
  const komentar = cue("cta", "komentar");
  return (
    <>
      <Rise at={0} style={{ left: 90, top: 110, width: 900 }}>
        <p style={{ ...heavy, fontSize: 72, lineHeight: 1.12, textAlign: "center" }}>Kamu paling sering lupa titipan apa?</p>
      </Rise>
      <Rise at={komentar + 2} dy={12} style={{ left: 90, top: 310, width: 900 }}>
        <p style={{ ...heavy, fontSize: 32, lineHeight: 1.25, letterSpacing: 3, textAlign: "center", color: c.pink }}>
          TULIS DI KOMENTAR <Arrow at={komentar + 10} />
        </p>
      </Rise>
      <Haruka steps={[{ pose: "pointYou", at: 0 }, { pose: "thumbsUp", at: komentar }]} x={548} top={428} scale={0.53} enter={6} exit={len("cta") + 99} />
    </>
  );
};
