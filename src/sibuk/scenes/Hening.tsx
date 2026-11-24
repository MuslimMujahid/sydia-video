import type React from "react";
import { useCurrentFrame } from "remotion";
import { Haruka } from "../components/Haruka";
import { Laptop, SENTENCE, WIDE } from "../components/Laptop";
import { Riso } from "../components/Paper";
import { c } from "../theme";
import { cue } from "../timeline";
import { blink } from "./Hook";

/**
 * S6 · Hening (16.47): total silence after the peak. A wide, still shot: the desk line, the laptop
 * still showing one sentence with its cursor blinking, and Haruka small and spent beside it. The
 * counter has stopped at ×9 (washed out in the HUD). "9× sebentar. 0 kalimat baru."
 */
export const Hening: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: 1640, width: 1080, height: 6, backgroundColor: c.ink }} />
      <Laptop box={WIDE} chars={SENTENCE.length} cursorOn={blink(frame, 20)} />
      <Haruka steps={[{ pose: "tired", at: 0 }, { pose: "worried", at: cue("hening", "tapi") }]} box={{ x: 590, y: 1000, w: 430 }} from={[0, 0]} fade={8} />
      <Riso at={cue("hening", "semua")} x={64} y={620} size={108}>
        9× sebentar.
      </Riso>
      <Riso at={cue("hening", "tapi")} x={64} y={728} size={108}>
        0 kalimat baru.
      </Riso>
    </>
  );
};
