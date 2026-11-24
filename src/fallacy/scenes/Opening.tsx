import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Lead, MarkerCircle, Riso } from "../../sibuk/components/Paper";
import { Bubble, Slap, useRoll } from "../components/Bits";
import { Haruka } from "../components/Haruka";
import { c, clamp, easeOut, heavy, heavyEmoji, monoText } from "../theme";
import { cue, len } from "../timeline";

const HOOK_LINES = ["Kebiasaan", "meremehkan waktu", "pengerjaan itu", "ada istilahnya."];
const HOOK_KICKS = ["kebiasaan", "meremehkan", "pengerjaan", "istilah"] as const;

/**
 * S1 · Hook + cover (13.00): "Kebiasaan meremehkan waktu pengerjaan itu ada istilahnya." The hook is on
 * screen from the first frame (it doubles as the Reels cover); each line is re-inked as she says it, the
 * marker rings "meremehkan waktu", and Haruka points up at it.
 */
export const Hook: React.FC = () => (
  <>
    <Haruka steps={[{ pose: "pointSide", at: 0 }]} box={{ x: 330, y: 1000, w: 820 }} from={[0, 260]} fade={5} />
    <Lead at={-8} x={64} y={290} size={64}>
      Tahukah kalian?
    </Lead>
    {HOOK_LINES.map((line, i) => (
      <Riso key={line} at={-6 + i * 2} x={64} y={390 + i * 101} size={88} kick={cue("hook", HOOK_KICKS[i])}>
        {line}
      </Riso>
    ))}
    <MarkerCircle at={cue("hook", "meremehkan") + 2} x={14} y={478} w={HOOK.ring} h={165} dur={14} />
  </>
);

/** Frames into S1b where the boss's chat pops in and where Haruka's "10 menit 👌" is sent; the hook ring's width. */
export const HOOK = { ask: 2, reply: cue("chat", "sepuluh"), ring: 1010 };

/**
 * S1b · Chat (13.00): the boss's chat pops in; Haruka reads it out loud off her phone, thinks for half a
 * second ("Hmm…") and sends "10 menit 👌" as she says it.
 */
export const Chat: React.FC = () => (
  <>
    <Haruka steps={[{ pose: "replying", at: 0 }, { pose: "phoneThink", at: cue("chat", "hmm") }, { pose: "confident", at: HOOK.reply + 4 }]} box={{ x: 300, y: 980, w: 800 }} from={[0, 260]} fade={5} />
    <Bubble at={HOOK.ask} x={30} y={300} w={1000} h={440}>
      <p style={{ ...monoText, position: "absolute", left: 80, top: 70, fontSize: 48, lineHeight: 1.3 }}>{"Har, tolong bikin MoM\nmeeting tadi ya.\nKira-kira berapa lama?"}</p>
    </Bubble>
    <Bubble at={HOOK.reply} x={480} y={700} w={560} h={280} flip tilt={4}>
      <p style={{ ...heavy, fontFamily: heavyEmoji, position: "absolute", left: 70, top: 70, fontSize: 72, lineHeight: 1.25, color: c.blue }}>10 menit 👌</p>
    </Bubble>
  </>
);

/** "Menit ke-N." — the minute counter that rolls forward on each montage cut. */
const Timer: React.FC<{ from: number; to: number; suffix: string; slam?: boolean }> = ({ from, to, suffix, slam = false }) => {
  const n = useRoll(from, to, 0, 10);
  return (
    <Riso at={slam ? 2 : -20} x={64} y={400} size={124} slam={slam} kick={slam ? undefined : 10}>
      {`Menit ke-${n}${suffix}`}
    </Riso>
  );
};

/** The "masalah" strips that pile up during the montage (positions from the storyboard). */
const Masalah = {
  catatan: (at: number) => (
    <Slap key="catatan" at={at} tone="pink" x={60} y={760} w={617} h={110} size={48} pad={[50, 22]} tilt={-6}>
      catatan berantakan
    </Slap>
  ),
  rekaman: (at: number) => (
    <Slap key="rekaman" at={at} tone="pink" x={508} y={880} w={522} h={110} size={48} pad={[50, 22]} tilt={5}>
      review rekaman
    </Slap>
  ),
  peserta: (at: number) => (
    <Slap key="peserta" at={at} tone="pink" x={70} y={1000} w={673} h={110} size={48} pad={[50, 22]} tilt={-5}>
      konfirmasi ke peserta
    </Slap>
  ),
};

/** Frame into S2a where the first problem strip lands (on "berantakan"). */
export const S2A = { catatan: cue("s2a", "berantakan") };

/**
 * S2a · Montase, masih yakin (13.02): calm, small smile ("Oke, ayo kita beresin dengan cepat"). On "Eh…" she
 * frowns at the notes, and the first strip lands on "berantakan".
 */
export const MasihYakin: React.FC = () => (
  <>
    <Haruka steps={[{ pose: "laptopSmile", at: 0 }, { pose: "frowning", at: cue("s2a", "eh") }]} box={{ x: 110, y: 1020, w: 860 }} from={[0, 0]} push={[0, 150, 1.04]} fade={5} />
    <Timer from={2} to={2} suffix="." slam />
    {Masalah.catatan(S2A.catatan)}
  </>
);

/** S2b · Montase, mulai serius (13.25): chin on hand, frowning; "…cek rekaman deh" lands the second strip. */
export const MulaiSerius: React.FC = () => (
  <>
    <Haruka steps={[{ pose: "focused", at: 0 }, { pose: "focused2", at: cue("s2b", "cek") }]} box={{ x: 40, y: 980, w: 1000 }} from={[0, 0]} push={[0, len("s2b"), 1.05]} />
    <Timer from={2} to={25} suffix="…" />
    {Masalah.catatan(-20)}
    {Masalah.rekaman(cue("s2b", "cek") + 2)}
  </>
);

/** Frame into S2c where the third strip lands and she goes under (on "Konfirmasi"). */
export const S2C = { peserta: cue("s2c", "konfirmasi") };

/** S2c · Montase, panik (13.47): "Ini maksudnya apa sih?! Konfirmasi ke siapa ya…?" The third strip piles on; spiral eyes, she shakes. */
export const Panik: React.FC = () => (
  <>
    <Haruka steps={[{ pose: "frustrated", at: 0 }, { pose: "overwhelmed", at: S2C.peserta }]} box={{ x: -60, y: 1180, w: 1200 }} anchor="overwhelmed" from={[0, 0]} shake={4} push={[0, 120, 1.05]} />
    <Timer from={25} to={47} suffix="." />
    {Masalah.catatan(-20)}
    {Masalah.rekaman(-20)}
    {Masalah.peserta(S2C.peserta)}
  </>
);

/** Frame into S3 where "Udah, Har?" arrives. */
export const FREEZE = { ask: 3 };

/**
 * S3 · Freeze (13.47): "Udah, Har?" lands in silence (the music has stopped). She reads it, "Hah?!",
 * and on "empat puluh tujuh menit?!" breaks into a cold sweat; then nothing moves for a beat.
 */
export const Freeze: React.FC = () => {
  const frame = useCurrentFrame();
  const punch = interpolate(frame, [FREEZE.ask, FREEZE.ask + 6], [1, 1.04], { ...clamp, easing: easeOut });
  return (
    <div style={{ position: "absolute", inset: 0, scale: String(punch), transformOrigin: "50% 40%" }}>
      <Haruka steps={[{ pose: "reads", at: 0 }, { pose: "hah", at: cue("freeze", "hah") }, { pose: "shocked", at: cue("freeze", "empat") }]} box={{ x: 90, y: 900, w: 900 }} anchor="shocked" from={[0, 0]} fade={3} />
      <Bubble at={FREEZE.ask} x={40} y={360} w={1000} h={480}>
        <p style={{ ...heavy, position: "absolute", left: 70, top: 110, fontSize: 120, lineHeight: 1.25 }}>Udah, Har?</p>
      </Bubble>
    </div>
  );
};
