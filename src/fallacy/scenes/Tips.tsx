import type React from "react";
import { Band, BandText, Lead, Riso } from "../../sibuk/components/Paper";
import { Bubble, Dot, Draw, Label, Slap } from "../components/Bits";
import { Haruka } from "../components/Haruka";
import { c, heavy, monoText } from "../theme";
import { cue } from "../timeline";

const TipLabel: React.FC<{ at: number; n: number }> = ({ at, n }) => (
  <Slap at={at} tone="orange" x={52} y={110} w={264} h={99} size={52} pad={[44, 10]}>
    {`Tips ${n}`}
  </Slap>
);

const STEPS: [string, string][] = [
  ["baca catatan", "5 mnt"],
  ["cek rekaman", "15 mnt"],
  ["konfirmasi peserta", "10 mnt"],
  ["tulis MoM", "10 mnt"],
  ["kirim", "5 mnt"],
];

/** Frame into S7a where the first step lands, and the spacing between steps. */
export const TIPS1 = { label: 4, steps: (i: number) => cue("tips1", "pecah") + 16 + i * 12 };

/**
 * S7a · Tips 1, pecah jadi langkah: the five MoM steps drop onto a vertical line one by one, each with
 * its minutes, then add up to ±45 menit on "jauh lebih lama". Haruka winks; the lightbulb comes on with
 * the total.
 */
export const Tips1: React.FC = () => {
  const total = cue("tips1", "jauh");
  return (
    <>
      <Haruka steps={[{ pose: "wink", at: 0 }, { pose: "winkIdea", at: total }]} box={{ x: 600, y: 1264, w: 520 }} from={[480, 0]} fade={5} />
      <TipLabel at={TIPS1.label} n={1} />
      <Lead at={cue("tips1", "sebelum")} x={64} y={260} size={52}>
        Sebelum jawab "berapa lama?"
      </Lead>
      <Riso at={cue("tips1", "pecah")} x={64} y={360} size={110} slam>
        {"Pecah jadi\nlangkah."}
      </Riso>
      <Draw d="M100,700 L100,1300" at={TIPS1.steps(0)} dur={4 * 12} width={8} ease={false} />
      {STEPS.map(([step, mins], i) => (
        <div key={step}>
          <Dot at={TIPS1.steps(i)} x={100} y={700 + i * 150} />
          <Label at={TIPS1.steps(i)} x={150} y={676 + i * 150} size={36}>
            {step}
          </Label>
          <Label at={TIPS1.steps(i) + 4} x={150} y={720 + i * 150} size={36} mono={false} color={c.pink}>
            {mins}
          </Label>
        </div>
      ))}
      <Slap at={total} tone="pink" x={52} y={1430} w={476} h={107} size={60} pad={[44, 10]} tilt={-6}>
        = ±45 menit
      </Slap>
    </>
  );
};

/**
 * S7b · Tips 2, patokan: last week's note pops out of her clipboard on "Em-o-em minggu lalu", and the
 * answer (→ 45 menit) is written in on "berapa lama?".
 */
export const Tips2: React.FC = () => {
  const mom = cue("tips2", "mom");
  return (
    <>
      <Haruka steps={[{ pose: "clipboard", at: 0 }, { pose: "reachClip", at: mom }]} box={{ x: 520, y: 1117, w: 600 }} anchor="clipboard" from={[480, 0]} fade={5} />
      <TipLabel at={2} n={2} />
      <Lead at={-8} x={64} y={260} size={52}>
        Sebelum jawab "berapa lama?"
      </Lead>
      <Riso at={cue("tips2", "pakai")} x={64} y={360} size={96}>
        Pakai tugas
      </Riso>
      <Riso at={cue("tips2", "pakai") + 16} x={64} y={456} size={96}>
        yang mirip
      </Riso>
      <Riso at={cue("tips2", "patokan")} x={64} y={552} size={96} slam>
        sebagai patokan.
      </Riso>
      <Bubble at={mom} x={30} y={760} w={660} h={330} tilt={-4}>
        <p style={{ ...monoText, position: "absolute", left: 60, top: 50, fontSize: 26, lineHeight: 1.25, color: c.pink }}>CATATAN MINGGU LALU</p>
        <p style={{ ...heavy, position: "absolute", left: 60, top: 100, fontSize: 52, lineHeight: 1.15 }}>MoM minggu lalu</p>
      </Bubble>
      <Label at={cue("tips2", "berapa")} x={90} y={920} size={52} mono={false} lh={1.15}>
        → 45 menit
      </Label>
    </>
  );
};

/** Frames into S7c where her heads-up is sent and the boss replies. */
export const TIPS3 = { sent: cue("tips3", "kerasa") + 40, reply: cue("tips3", "bilang") + 48 };

/**
 * S7c · Tips 3, bilang dari awal: Haruka types a heads-up while the question is asked; the advice is
 * printed on her words; the boss's friendly reply arrives and she relaxes.
 */
export const Tips3: React.FC = () => (
  <>
    <Haruka steps={[{ pose: "typing", at: 0 }, { pose: "phoneSmile", at: TIPS3.reply + 2 }]} box={{ x: 560, y: 1244, w: 560 }} anchor="typing" from={[480, 0]} fade={5} />
    <TipLabel at={2} n={3} />
    <Lead at={cue("tips3", "kerasa")} x={64} y={260} size={44}>
      {"Kerasa bakal lebih lama dari yang\ndijanjikan?"}
    </Lead>
    <Bubble at={TIPS3.sent} x={300} y={760} w={760} h={330} flip tilt={4}>
      <p style={{ ...monoText, position: "absolute", left: 60, top: 45, fontSize: 30, lineHeight: 1.25 }}>{"Kak, catatannya ternyata\nkurang lengkap. Kayaknya\nbutuh ±30 menit lagi ya 🙏"}</p>
    </Bubble>
    <Riso at={cue("tips3", "jangan")} x={64} y={380} size={110}>
      Jangan malu,
    </Riso>
    <Riso at={cue("tips3", "bilang")} x={64} y={490} size={110} slam>
      {"bilang dari\nawal."}
    </Riso>
    <Bubble at={TIPS3.reply} x={30} y={1110} w={520} h={220} tilt={-4}>
      <p style={{ ...monoText, position: "absolute", left: 50, top: 40, fontSize: 32, lineHeight: 1.25 }}>{"Oke, makasih\nkabarnya! 👍"}</p>
    </Bubble>
  </>
);

/** Frame into S8 where the CTA band tears up (just before she starts reading it). */
export const PENUTUP = { band: 2 };

/**
 * S8 · Penutup: the blue band tears up with the CTA and Haruka reads it out, pointing down at it. Then
 * she giggles behind her hand: she says "10 menit" all the time too. The band holds so it can be read.
 */
export const Penutup: React.FC = () => (
  <>
    <Haruka steps={[{ pose: "pointDown", at: 0 }, { pose: "giggle1", at: cue("penutup", "giggle") }, { pose: "giggle2", at: cue("penutup", "hehe") + 6 }, { pose: "giggle3", at: cue("penutup", "aku") }]} box={{ x: 130, y: 520, w: 820 }} anchor="giggle1" from={[0, 700]} fade={5} />
    <Band at={PENUTUP.band} y={1400} h={700}>
      <BandText at={PENUTUP.band + 6} x={64} y={1580} size={72} lh={1.1}>
        {"Kirim ke temanmu yang\nhobi bilang \"10 menit\"."}
      </BandText>
    </Band>
  </>
);
