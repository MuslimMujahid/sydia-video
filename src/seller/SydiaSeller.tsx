import { Audio } from "@remotion/media";
import type React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, Track, useCurrentFrame, useVideoConfig } from "remotion";
import { Grain, SoftCanvas } from "../promo/components/Backgrounds";
import { colors } from "../promo/theme";
import { FormatStage, SQUARE } from "../showcase/format";
import { CTA_GRATIS, CTA_KOMEN, Lockup, MONTAGE_END } from "../showcase/scenes/Bookends";
import { clamp } from "../showcase/ui";
import { Room } from "./components/Scenery";
import { ROUNDS } from "./data";
import { L, LaptopAfternoon } from "./scenes/LaptopAfternoon";
import { LIST_PINGS, LOCK_PINGS, M, MorningPhone, PHONE, R, roundAt } from "./scenes/MorningPhone";
import { NightIntro } from "./scenes/NightIntro";
import { at, INTRO, SECTIONS as S, VOICE } from "./timeline";

const LAPTOP = at(S.afternoon);
const LOGO = at(S.close);
/** The closing screen is SydiaShowcase's outro from its logo beat on, so it starts MONTAGE_END early. */
const CLOSE_SEQ = LOGO - MONTAGE_END;

// ------------------------------------------------------------------ closing
/** SydiaShowcase's closing: flash, logo + tagline, then "Coba Sydia sekarang" → "Gratis 7 hari" → "Komen MAU…". */
const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < MONTAGE_END - 1) return null;
  const flash = interpolate(frame, [MONTAGE_END - 1, MONTAGE_END, MONTAGE_END + 10], [0, 0.9, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
      <SoftCanvas glow={1} />
      <Lockup at={MONTAGE_END} size={170} cta />
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ audio
const VO_LEN: Record<(typeof VOICE)[number]["id"], number> = {
  "v01-wake": 172,
  "v02-list": 155,
  "v03-forward": 182,
  "v04-more": 184,
  "v05-laptop": 124,
  "v06-panel": 124,
  "v07-notes": 131,
  "v08-report": 174,
  "v09-logo": 116,
  "v10-cta": 109,
};

/** Music dips under the narrator. */
const Music: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const duck = Math.max(0, ...VOICE.map((v) => interpolate(frame, [v.from - 8, v.from, v.from + VO_LEN[v.id], v.from + VO_LEN[v.id] + 10], [0, 1, 1, 0], clamp)));
  const fade = interpolate(frame, [durationInFrames - 24, durationInFrames], [1, 0], clamp);
  return <Audio name="Pagi Cerah (music)" src={staticFile("music/sydia-seller.wav")} volume={(1 - duck * 0.4) * fade} />;
};

const SFX_FRAMES: Record<string, number> = { ding: 42, "mouse-click": 12, notify: 27, pop: 4, switch: 10, whip: 6, whoosh: 5, "rooster.mp3": 75, "alarm-clock.mp3": 91 };
const sfx = (name: string, file: string, from: number, volume: number) => ({ name, file: file.includes(".") ? file : `${file}.wav`, from, volume, durationInFrames: SFX_FRAMES[file] });
type Effect = ReturnType<typeof sfx>;

const effects: Effect[] = [
  sfx("Rooster", "rooster.mp3", INTRO.rooster - 6, 0.7),
  sfx("Alarm clock", "alarm-clock.mp3", INTRO.ring, 0.5),
  sfx("Alarm tapped off", "mouse-click", INTRO.stop, 0.5),
  sfx("Phone comes up", "whoosh", INTRO.phone + 2, 0.3),
  ...LOCK_PINGS.map((f, i) => sfx(`Lock notification ${i + 1}`, "notify", PHONE + f, 0.32)),
  ...LIST_PINGS.map((f, i) => sfx(`New chat ${i + 1}`, "notify", PHONE + f, 0.32)),
  ...[M.tapRina, M.fwdTap, M.pick].map((f, i) => sfx(`Tap ${i + 1}`, "mouse-click", PHONE + f, 0.25)),
  sfx("Forward sent", "pop", PHONE + M.send, 0.5),
  sfx("Request sent", "pop", PHONE + M.cmd1, 0.5),
  sfx("Sydia reply", "notify", PHONE + M.bot1, 0.3),
  ...ROUNDS.flatMap((_, k) => [
    sfx(`Card ${k + 1} flies`, "whoosh", PHONE + roundAt(k) + 4, 0.28),
    sfx(`Round ${k + 1} sent`, "pop", PHONE + roundAt(k) + R.cmd, 0.45),
    sfx(`Round ${k + 1} reply`, "notify", PHONE + roundAt(k) + R.bot, 0.26),
  ]),
  sfx("Phone away", "whoosh", PHONE + M.exit + 4, 0.35),
  sfx("Laptop rises", "whoosh", LAPTOP + 8, 0.3),
  sfx("Desktop send", "pop", LAPTOP + L.send, 0.5),
  ...[L.chipClick, L.openClick, L.pastClick, L.back, L.chip2].map((f, i) => sfx(`Desktop click ${i + 1}`, "mouse-click", LAPTOP + f, 0.45)),
  sfx("Panel slides", "whoosh", LAPTOP + L.chipClick + 4, 0.25),
  sfx("Report request sent", "pop", LAPTOP + L.send2, 0.5),
  sfx("Report panel slides", "whoosh", LAPTOP + L.chip2 + 4, 0.25),
  sfx("CTA free trial", "switch", CLOSE_SEQ + CTA_GRATIS, 0.4),
  sfx("CTA comment", "notify", CLOSE_SEQ + CTA_KOMEN + 6, 0.35),
];

const toLanes = (items: Effect[]) => {
  const lanes: Effect[][] = [];
  for (const e of [...items].sort((a, b) => a.from - b.from)) {
    const lane = lanes.find((l) => l[l.length - 1].from + l[l.length - 1].durationInFrames <= e.from);
    if (lane) lane.push(e);
    else lanes.push([e]);
  }
  return lanes;
};

/**
 * 1:1 promo, ~82 s on an original 100 BPM acoustic track: night turns to dawn (rooster,
 * alarm clock), then a home seller's morning on WhatsApp (orders forwarded to Sydia), then the afternoon on Sydia web (the order note in
 * the side panel, the notes workspace and a weekly report), ending on SydiaShowcase's closing screen.
 */
export const SydiaSeller: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
    <FormatStage format={SQUARE}>
      <Sequence name="Room" durationInFrames={LOGO + 12} layout="none">
        <Room />
      </Sequence>
      <Sequence name="Night to dawn" durationInFrames={INTRO.phone + 40}>
        <NightIntro />
      </Sequence>
      <Sequence name="Morning on WhatsApp" from={PHONE} durationInFrames={LAPTOP + 40 - PHONE}>
        <MorningPhone />
      </Sequence>
      <Sequence name="Afternoon on Sydia web" from={LAPTOP} durationInFrames={LOGO - LAPTOP + 12}>
        <LaptopAfternoon />
      </Sequence>
      <Sequence name="Closing" from={CLOSE_SEQ}>
        <Closing />
      </Sequence>
      <Grain opacity={0.1} />
    </FormatStage>
    <Track name="Music">
      <Music />
    </Track>
    <Track name="Ambience">
      <Sequence name="Night crickets" durationInFrames={151} layout="none">
        <Audio name="Night crickets" src={staticFile("sfx/night-crickets.mp3")} volume={(f) => interpolate(f, [0, 12, 80, 140], [0, 0.45, 0.45, 0], clamp)} />
      </Sequence>
    </Track>
    <Track name="Voice-over">
      {VOICE.map((v, i) => (
        <Sequence key={v.id} name={v.id} from={v.from} durationInFrames={Math.min(VO_LEN[v.id] + 4, (VOICE[i + 1]?.from ?? Infinity) - v.from)} layout="none">
          <Audio name={v.id} src={staticFile(`voiceover/seller/${v.id}.mp3`)} />
        </Sequence>
      ))}
    </Track>
    {toLanes(effects).map((lane, i) => (
      <Track key={i} name={i === 0 ? "Sound effects" : `Sound effects ${i + 1}`}>
        {lane.map((e) => (
          <Sequence key={e.name} name={e.name} from={e.from} durationInFrames={e.durationInFrames} layout="none">
            <Audio name={e.name} src={staticFile(`sfx/${e.file}`)} volume={e.volume} />
          </Sequence>
        ))}
      </Track>
    ))}
  </AbsoluteFill>
);
