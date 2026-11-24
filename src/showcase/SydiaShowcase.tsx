import { Audio } from "@remotion/media";
import {
  linearTiming,
  type TransitionPresentation,
  type TransitionPresentationComponentProps,
  TransitionSeries,
} from "@remotion/transitions";
import type React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, Track, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, easeInOut } from "../promo/theme";
import { BRIDGE_LEN, BridgeScene, CTA_GRATIS, CTA_KOMEN, IntroScene, OUTRO_LEN, OutroScene } from "./scenes/Bookends";
import { DESK_LEN, DesktopAct, T } from "./scenes/DesktopAct";
import { PHONE_LEN, PhoneAct, REMIND, waMessages } from "./scenes/PhoneAct";
import { VOICE_LEN, VoiceAct } from "./scenes/VoiceAct";
import { type Format, FormatStage, SQUARE, WIDE } from "./format";
import { at, BAR, SECTIONS as S } from "./timeline";

type NoProps = Record<string, never>;
const XFADE = 12;

/** Old scene rushes past the camera while the new one resolves out of a blur. */
const ZoomThrough: React.FC<TransitionPresentationComponentProps<NoProps>> = ({ children, presentationDirection, presentationProgress }) => {
  const p = easeInOut(presentationProgress);
  if (presentationDirection === "exiting") {
    return <AbsoluteFill style={{ scale: String(1 + p * 1.4), opacity: 1 - p, filter: `blur(${p * 20}px)` }}>{children}</AbsoluteFill>;
  }
  return <AbsoluteFill style={{ scale: String(0.92 + p * 0.08), opacity: p, filter: `blur(${(1 - p) * 12}px)` }}>{children}</AbsoluteFill>;
};
const zoomThrough = (): TransitionPresentation<NoProps> => ({ component: ZoomThrough, props: {} });

/** A warm light leak washes over the cut onto the final chorus. */
const LightLeak: React.FC<TransitionPresentationComponentProps<NoProps>> = ({ children, presentationDirection, presentationProgress }) => {
  const p = presentationProgress;
  if (presentationDirection === "exiting") {
    return <AbsoluteFill style={{ opacity: 1 - p, scale: String(1 + p * 0.15) }}>{children}</AbsoluteFill>;
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: p }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 50%, #fff6ee 0%, #ffb27a 45%, #f0669400 80%)", opacity: Math.sin(p * Math.PI) * 0.95 }} />
    </AbsoluteFill>
  );
};
const lightLeak = (): TransitionPresentation<NoProps> => ({ component: LightLeak, props: {} });

const xfade = linearTiming({ durationInFrames: XFADE });

const Music: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <Audio
      name="Sydia showcase track"
      src={staticFile("music/sydia-showcase.wav")}
      volume={interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
    />
  );
};

// ------------------------------------------------------------------ sound effects
const SFX_FRAMES: Record<string, number> = { ding: 42, "mouse-click": 12, notify: 27, pop: 4, switch: 10, whip: 6, whoosh: 5 };
const sfx = (name: string, file: string, from: number, volume: number) => ({ name, file, from, volume, durationInFrames: SFX_FRAMES[file] });
type Effect = ReturnType<typeof sfx>;

const desk = at(S.desktop);
const phone = at(S.phone);
const effects: Effect[] = [
  sfx("Intro send", "pop", 80, 0.6),
  ...[T.send1, T.send2, T.send3, T.send4, T.send5].map((f, i) => sfx(`Desktop send ${i + 1}`, "pop", desk + f, 0.55)),
  ...[T.chip1Click, T.chip2Click, T.lihat].map((f, i) => sfx(`Desktop click ${i + 1}`, "mouse-click", desk + f, 0.45)),
  sfx("File dropped", "switch", desk + T.drop, 0.4),
  ...[T.tasksIn, T.calIn, T.filesIn].map((f, i) => sfx(`Window arrives ${i + 1}`, "whoosh", desk + f + 2, 0.35)),
  sfx("Calendar drop", "pop", desk + T.calIn + T.calDrop, 0.5),
  sfx("Brief buzz", "notify", phone + 16, 0.55),
  ...waMessages
    .filter((m) => m.kind !== "chip" && m.at > 70)
    .map((m, i) => {
      const mine = m.kind === "text" && m.from === "me";
      return sfx(`WA message ${i + 1}`, mine ? "pop" : "notify", phone + m.at, mine ? 0.55 : 0.35);
    }),
  sfx("Reminder ding", "ding", phone + REMIND, 0.3),
  sfx("Voice note sent", "pop", at(S.voice) + 154, 0.55),
  sfx("Voice reply", "notify", at(S.voice) + 214, 0.35),
  sfx("CTA free trial", "switch", at(S.outro) + CTA_GRATIS, 0.4),
  sfx("CTA comment", "notify", at(S.outro) + CTA_KOMEN + 6, 0.35),
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
 * ~98 s showcase on a 100 BPM acoustic track. One continuous chat on desktop,
 * a breather, a day on WhatsApp, a voice note at night, and a final chorus.
 */
const Showcase: React.FC<{ readonly format: Format }> = ({ format }) => (
  <AbsoluteFill style={{ backgroundColor: colors.canvas }}>
    <FormatStage format={format}>
      <TransitionSeries name="Scenes">
        <TransitionSeries.Sequence name="Intro" durationInFrames={2 * BAR + XFADE}>
          <IntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomThrough()} timing={xfade} />
        <TransitionSeries.Sequence name="Desktop chat" durationInFrames={DESK_LEN}>
          <DesktopAct />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="Breather" durationInFrames={BRIDGE_LEN}>
          <BridgeScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="WhatsApp day" durationInFrames={PHONE_LEN}>
          <PhoneAct />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence name="Voice note" durationInFrames={VOICE_LEN + XFADE}>
          <VoiceAct />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={lightLeak()} timing={xfade} />
        <TransitionSeries.Sequence name="Outro" durationInFrames={OUTRO_LEN}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </FormatStage>
    <Track name="Music">
      <Music />
    </Track>
    {toLanes(effects).map((lane, i) => (
      <Track key={i} name={i === 0 ? "Sound effects" : `Sound effects ${i + 1}`}>
        {lane.map((e) => (
          <Sequence key={e.name} name={e.name} from={e.from} durationInFrames={e.durationInFrames} layout="none">
            <Audio name={e.name} src={staticFile(`sfx/${e.file}.wav`)} volume={e.volume} />
          </Sequence>
        ))}
      </Track>
    ))}
  </AbsoluteFill>
);

export const SydiaShowcase: React.FC = () => <Showcase format={WIDE} />;

/** The same cut reframed for a 1:1 feed post. */
export const SydiaShowcaseSquare: React.FC = () => <Showcase format={SQUARE} />;
