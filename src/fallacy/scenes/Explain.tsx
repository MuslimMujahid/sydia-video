import type React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Lead, MarkerCircle, Riso } from "../../sibuk/components/Paper";
import { Dot, Draw, Label, Slap, Tape, Typed, useRoll } from "../components/Bits";
import { Haruka } from "../components/Haruka";
import { c, clamp, easeOut, heavy, monoText, muted, orange, rule } from "../theme";
import { cue, SCENES, voEnd } from "../timeline";

const voStart = (id: "kenapa" | "riset" | "metode" | "hasil") => SCENES[id].vo;

/**
 * S4 · Istilah: "Namanya:" slaps down, PLANNING FALLACY is printed on her word, underlined and taped;
 * the definition types out as she reads it. Haruka raises a finger, then points at the term.
 */
export const ISTILAH = { label: 8, tape: 32, underline: 34 };
export const Istilah: React.FC = () => {
  const term = cue("istilah", "planning");
  return (
    <>
      <Haruka steps={[{ pose: "raise", at: 0 }, { pose: "pointSide", at: term }]} box={{ x: 390, y: 995, w: 720 }} anchor="pointSide" from={[520, 0]} fade={5} />
      <Slap at={ISTILAH.label} tone="orange" x={52} y={400} w={380} h={110} size={52} pad={[44, 18]}>
        Namanya:
      </Slap>
      <Riso at={term} x={64} y={540} size={150} slam>
        {"PLANNING\nFALLACY"}
      </Riso>
      <Tape at={ISTILAH.tape} x={859} y={509} w={150} h={46} rot={32} />
      <Draw d="M70,860 C250,845 450,872 620,852 C790,832 760,848 800,858" at={ISTILAH.underline} dur={12} color={c.pink} width={12} />
      <Draw d="M830,725 L875,690" at={ISTILAH.underline + 8} dur={5} color={orange} />
      <Draw d="M845,765 L905,760" at={ISTILAH.underline + 10} dur={5} color={orange} />
      <Draw d="M832,805 L880,835" at={ISTILAH.underline + 12} dur={5} color={orange} />
      <Typed at={cue("istilah", "kecenderungan")} end={voEnd("istilah") - 8} x={64} y={910} size={40} lh={1.35}>
        {"Kecenderungan\nmeremehkan waktu yang\ndibutuhkan untuk\nmenyelesaikan sesuatu."}
      </Typed>
    </>
  );
};

// S5 paths (storyboard "jalur · lurus" and "jalur · berkelok", in frame coordinates)
const LURUS = "M110,580 L930,580";
const BERKELOK = "M110,840 L880,840 C1010,840 1010,1040 880,1040 L200,1040 C70,1040 70,1240 200,1240 L930,1240";

/**
 * S5 · Kenapa: the plan she imagined is one straight line (catatan → rapihin → kirim). What actually
 * happened is drawn as a winding road; each problem strip slaps down as the line reaches it.
 */
export const Kenapa: React.FC = () => {
  const imagine = cue("kenapa", "bayangkan");
  const lancar = cue("kenapa", "lancar");
  const real = cue("kenapa", "hambatan") - 6;
  const DUR = 72; // the winding line is drawn linearly, so the strips land where the line meets them
  const at = (fraction: number) => real + Math.round(DUR * fraction);
  return (
    <>
      <Haruka steps={[{ pose: "explain", at: 0 }, { pose: "palmsUp", at: cue("kenapa", "hambatan") }]} box={{ x: 40, y: 1360, w: 560 }} anchor="explain" from={[-520, 0]} fade={5} />
      <Riso at={voStart("kenapa")} x={64} y={110} size={92}>
        Yang dibayangkan
      </Riso>
      <Riso at={imagine + 14} x={64} y={202} size={92}>
        cuma versi
      </Riso>
      <Riso at={lancar} x={64} y={294} size={92} slam>
        lancarnya.
      </Riso>
      {/* what she imagined */}
      <Label at={imagine} x={80} y={470} size={28}>
        YANG DIBAYANGKAN
      </Label>
      <Draw d={LURUS} at={imagine + 4} dur={34} arrow ease={false} />
      <Dot at={imagine + 4} x={110} y={580} />
      <Label at={imagine + 4} x={60} y={615} size={28}>
        catatan
      </Label>
      <Dot at={imagine + 21} x={535} y={580} />
      <Label at={imagine + 21} x={475} y={615} size={28}>
        rapihin
      </Label>
      <Label at={imagine + 38} x={860} y={615} size={28}>
        kirim ✓
      </Label>
      {/* what happened */}
      <Label at={real} x={80} y={730} size={28}>
        YANG TERJADI
      </Label>
      <Draw d={BERKELOK} at={real} dur={DUR} arrow ease={false} />
      <Dot at={real} x={110} y={840} />
      <Slap at={at(0.05)} tone="pink" x={240} y={780} w={490} h={90} size={38} pad={[50, 19]} tilt={-5}>
        catatan berantakan
      </Slap>
      <Slap at={at(0.39)} tone="pink" x={430} y={990} w={414} h={90} size={38} pad={[50, 19]} tilt={5}>
        review rekaman
      </Slap>
      <Dot at={at(0.58)} x={330} y={1040} />
      <Label at={at(0.58)} x={270} y={1075} size={28}>
        rapihin
      </Label>
      <Slap at={at(0.755)} tone="pink" x={290} y={1190} w={534} h={90} size={38} pad={[50, 19]} tilt={-4}>
        konfirmasi ke peserta
      </Slap>
      <Label at={real + DUR} x={860} y={1275} size={28}>
        kirim ✓
      </Label>
      <Lead at={cue("kenapa", "hambatan")} x={600} y={1520} size={48}>
        {"Hambatan kecil\nnggak ikut\ndihitung."}
      </Lead>
    </>
  );
};

/** The journal page drops onto the desk and settles. */
const JournalPage: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 140, mass: 0.8 } });
  return (
    <div style={{ position: "absolute", left: 80, top: 470, width: 920, height: 880, backgroundColor: c.white, boxShadow: "6px 6px 0 #b9b3a7", translate: `0px ${(1 - s) * -160}px`, rotate: `${(1 - s) * -6}deg`, scale: String(1.08 - 0.08 * s), opacity: Math.min(1, s * 2.5) }}>
      {children}
    </div>
  );
};

/** An author's name: blue ink stamped on as she says it. */
const Author: React.FC<{ at: number; y: number; children: React.ReactNode }> = ({ at, y, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame < at ? 0 : spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 260, mass: 0.5 } });
  return <p style={{ ...heavy, position: "absolute", left: 60, top: y, fontSize: 44, lineHeight: 1.2, color: c.blue, opacity: 0.18 + 0.82 * Math.min(1, s * 2), scale: String(1 + 0.12 * (1 - s) * (frame >= at ? 1 : 0)), transformOrigin: "0% 50%" }}>{children}</p>;
};

/**
 * S6a · Riset: the 1994 paper is taped down. Each author's name is stamped in blue as Haruka names them,
 * and the year is ringed on "tahun".
 */
export const RISET = { label: 2, page: 8 };
export const Riset: React.FC = () => (
  <>
    <Slap at={RISET.label} tone="orange" x={52} y={300} w={355} h={99} size={52} pad={[44, 12]}>
      Risetnya:
    </Slap>
    <JournalPage at={RISET.page}>
      <p style={{ ...monoText, position: "absolute", left: 60, top: 60, fontSize: 26, lineHeight: 1.25, color: c.pink }}>{"Journal of Personality and\nSocial Psychology · 1994"}</p>
      <div style={{ position: "absolute", left: 60, top: 155, width: 800, height: 4, backgroundColor: c.ink }} />
      <p style={{ ...heavy, position: "absolute", left: 60, top: 200, fontSize: 76, lineHeight: 1.05 }}>{"Exploring the\n\"Planning Fallacy\""}</p>
      <p style={{ ...monoText, position: "absolute", left: 60, top: 390, fontSize: 32, lineHeight: 1.3 }}>{"Why People Underestimate Their\nTask Completion Times"}</p>
      <Author at={cue("riset", "buehler")} y={540}>
        Roger Buehler
      </Author>
      <Author at={cue("riset", "griffin")} y={593}>
        Dale Griffin
      </Author>
      <Author at={cue("riset", "ross")} y={646}>
        Michael Ross
      </Author>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ position: "absolute", left: 60, top: 730 + i * 26, width: i === 4 ? 460 : 800, height: 8, backgroundColor: rule }} />
      ))}
    </JournalPage>
    <Tape at={RISET.page + 10} x={38} y={437} w={150} h={44} rot={-28} />
    <Tape at={RISET.page + 14} x={888} y={1287} w={150} h={44} rot={-28} />
    <MarkerCircle at={cue("riset", "tahun")} x={436} y={551} w={106} h={56} dur={10} />
    <Haruka steps={[{ pose: "research", at: 0 }, { pose: "present", at: cue("riset", "buehler") }]} box={{ x: 580, y: 1268, w: 540 }} enter={RISET.page + 6} from={[480, 0]} fade={5} />
  </>
);

/**
 * S6b · Metode: "37 mahasiswa" counts up, the setup types out, and the three estimates slap down one by
 * one as she lists them; Haruka's question mark changes with each estimate.
 */
export const Metode: React.FC = () => {
  const n = useRoll(0, 37, 2, 16);
  const guesses = [cue("metode", "realistis"), cue("metode", "lancar"), cue("metode", "kacau")];
  return (
    <>
      <Haruka steps={[{ pose: "guess1", at: 0 }, { pose: "guess2", at: guesses[0] }, { pose: "guess3", at: guesses[1] }, { pose: "guess1", at: guesses[2] }]} box={{ x: 580, y: 1153, w: 540 }} from={[480, 0]} fade={5} />
      <Slap at={0} tone="orange" x={52} y={200} w={419} h={99} size={52} pad={[44, 14]}>
        Metodenya:
      </Slap>
      <Riso at={2} x={64} y={340} size={150} slam>
        {String(n)}
      </Riso>
      <Riso at={8} x={64} y={490} size={150}>
        mahasiswa
      </Riso>
      <Typed at={voStart("metode")} end={cue("metode", "tiga") + 4} x={64} y={680} size={36} lh={1.35}>
        {"tingkat akhir diminta membuat\nestimasi kapan tugas akhir\nmereka selesai. Tiga kali:"}
      </Typed>
      <Slap at={guesses[0]} tone="pink" x={52} y={900} w={712} h={90} size={44} pad={[44, 10]} tilt={-4}>
        estimasi paling realistis?
      </Slap>
      <Slap at={guesses[1]} tone="pink" x={52} y={1020} w={589} h={90} size={44} pad={[44, 10]} tilt={4}>
        kalau semua lancar?
      </Slap>
      <Slap at={guesses[2]} tone="pink" x={52} y={1140} w={584} h={90} size={44} pad={[44, 10]} tilt={-4}>
        kalau semua kacau?
      </Slap>
    </>
  );
};

/** A torn bar that tears out to its full length from the left, its number counting up with it. */
const Bar: React.FC<{ at: number; dur?: number; label: string; days: number; y: number; w: number; h: number; tone: "orange" | "pink"; size: number }> = ({ at, dur = 12, label, days, y, w, h, tone, size }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: easeOut });
  const n = useRoll(0, days, at, dur);
  if (frame < at - 4) return null;
  const lt = interpolate(frame, [at - 4, at + 3], [0, 1], clamp);
  return (
    <>
      <p style={{ ...monoText, position: "absolute", left: 64, top: y - 42, fontSize: 28, lineHeight: 1.25, opacity: lt }}>{label}</p>
      <div style={{ position: "absolute", left: 40, top: y, width: w, height: h, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>
        <Img src={staticFile(`sibuk/paper/strip-${tone}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        <p style={{ ...heavy, position: "absolute", left: 50, top: (h - size * 1.25) / 2, fontSize: size, lineHeight: 1.25, color: c.white, fontVariantNumeric: "tabular-nums" }}>{`${n} hari`}</p>
      </div>
    </>
  );
};

/**
 * S6c · Hasil: the three estimates tear out as bars (lancar 27, realistis 34, kacau 49); on "lima puluh
 * lima" the pink reality bar tears out past all of them. Haruka gasps; the punchline is printed.
 */
export const BARS = { first: 10, gap: 12 };
export const Hasil: React.FC = () => {
  const lima = cue("hasil", "lima");
  const bahkan = cue("hasil", "bahkan");
  return (
    <>
      <Haruka steps={[{ pose: "thinking", at: 0 }, { pose: "gasp", at: lima + 2 }, { pose: "gasp2", at: bahkan }]} box={{ x: 560, y: 1216, w: 560 }} anchor="gasp" from={[480, 0]} fade={4} />
      <Slap at={2} tone="orange" x={52} y={150} w={352} h={99} size={52} pad={[44, 14]}>
        Hasilnya:
      </Slap>
      <Bar at={BARS.first} label="KALAU SEMUA LANCAR" days={27} y={352} w={494} h={125} tone="orange" size={64} />
      <Bar at={BARS.first + BARS.gap} label="ESTIMASI REALISTIS" days={34} y={557} w={611} h={125} tone="orange" size={64} />
      <Bar at={BARS.first + 2 * BARS.gap} label="KALAU SEMUA KACAU" days={49} y={762} w={876} h={125} tone="orange" size={64} />
      <Bar at={lima} dur={16} label="KENYATAAN (RATA-RATA)" days={55} y={967} w={1000} h={150} tone="pink" size={80} />
      <Riso at={bahkan} x={64} y={1180} size={66} slam kick={cue("hasil", "terburuk")}>
        {"Bahkan\nestimasi\nterburuk pun\nmeleset."}
      </Riso>
      <Label at={cue("hasil", "terburuk") + 14} x={64} y={1480} size={24} lh={1.35}>
        {"Hanya ±30% yang selesai\nsesuai estimasi realistisnya."}
      </Label>
      <Label at={BARS.first} x={64} y={1820} size={22} color={muted}>
        {"Buehler, Griffin & Ross (1994)"}
      </Label>
    </>
  );
};
