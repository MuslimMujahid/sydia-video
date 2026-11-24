import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Haruka } from "../components/Haruka";
import { CORNER, FULL, Laptop, mix, SENTENCE } from "../components/Laptop";
import { Lead, MarkerCircle, Riso } from "../components/Paper";
import { clamp, easeInOut } from "../theme";
import { BEAT, cue } from "../timeline";

/** The cursor blinks on the beat. */
export const blink = (frame: number, period = BEAT) => Math.floor(frame / period) % 2 === 0;

/**
 * S1 · Hook (16.47): extreme close-up on Proposal.docx, one sentence and a blinking cursor. The question
 * is on screen from the first frame; each line is re-inked as Haruka says it, and on "tapi kerjaan" the
 * marker rings the lonely sentence.
 */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <Laptop box={FULL} chars={SENTENCE.length} cursorOn={blink(frame)} />
      <MarkerCircle at={cue("hook", "tapi")} x={22} y={985} w={920} h={190} dur={14} />
      <Lead at={-8} x={64} y={262} size={62}>
        Pernah gak kalian merasa
      </Lead>
      <Riso at={0} x={64} y={350} size={94} kick={cue("hook", "sibuk")}>
        sibuk seharian
      </Riso>
      <Riso at={2} x={64} y={444} size={94} kick={cue("hook", "tapi")}>
        tapi kerjaan gak
      </Riso>
      <Riso at={4} x={64} y={538} size={94} kick={cue("hook", "selesai")}>
        selesai-selesai?
      </Riso>
    </>
  );
};

/**
 * S2 · Tarik mundur (still 16.47): the camera pulls back off the screen. The laptop shrinks into the
 * bottom-left corner as Haruka rises in behind it; "Hari ini aku mau ngerjain proposal." lands on her words.
 */
export const Pullback: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 24], [0, 1], { ...clamp, easing: easeInOut });
  return (
    <>
      <Haruka steps={[{ pose: "puzzled", at: 0 }]} box={{ x: -60, y: 520, w: 1200 }} enter={6} from={[0, 700]} />
      <Laptop box={mix(FULL, CORNER, t)} chars={SENTENCE.length} cursorOn={blink(frame)} />
      <Lead at={cue("pullback", "hari")} x={64} y={270} size={72}>
        Hari ini aku mau
      </Lead>
      <Riso at={cue("pullback", "ngerjain")} x={64} y={365} size={104}>
        ngerjain
      </Riso>
      <Riso at={cue("pullback", "proposal")} x={64} y={469} size={104}>
        proposal.
      </Riso>
    </>
  );
};
