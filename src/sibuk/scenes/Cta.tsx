import type React from "react";
import { Haruka } from "../components/Haruka";
import { Band, BandText, Lead, Riso } from "../components/Paper";
import { cue, SCENES } from "../timeline";

/**
 * S8 · Penutup (16.47): Haruka faces the camera and asks; on "Tulis angkanya" she points down, right
 * at the CTA on the blue band, and the camera holds still so it can be read.
 */
export const Cta: React.FC = () => (
  <>
    <Haruka steps={[{ pose: "asking", at: 0 }, { pose: "pointDown", at: cue("cta", "tulis") - 4 }]} box={{ x: 170, y: 560, w: 880 }} anchor="pointDown" enter={2} from={[0, 900]} fade={5} />
    <Lead at={SCENES.cta.vo} x={64} y={270} size={72}>
      Hari ini kamu bilang
    </Lead>
    <Riso at={cue("cta", "sebentar")} x={64} y={360} size={110}>
      “sebentar”
    </Riso>
    <Riso at={cue("cta", "berapa")} x={64} y={470} size={110}>
      berapa kali?
    </Riso>
    <Band at={cue("cta", "tulis")} y={1400} h={700}>
      <BandText at={cue("cta", "tulis") + 6} x={64} y={1580} size={84}>
        {"Tulis angkanya\ndi komentar."}
      </BandText>
    </Band>
  </>
);
